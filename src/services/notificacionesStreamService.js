import { ref } from "vue";
import { accessToken } from "@/utils/tokenStore";
import { crearParserSse } from "@/utils/sseParser";
import { esErrorModuloNoContratado } from "@/utils/errores";

// ─── Cliente SSE de la bandeja de notificaciones (scoped por persona) ────────
// Bus INDEPENDIENTE de los canales de dashboard (dashboardStreamService y
// residenteStreamService): distinto endpoint (/notificaciones/stream), distinto
// payload (señal NOTIFICACION_CREADA + snapshot noLeidas) y distinto permiso
// (NOTIFICACION_VER). Por eso cada canal tiene su propia conexión y su propio
// ref `stream*Vivo`.
//
// Contrato (docs/solicitudes-backend/SOLICITUD_MOTOR_NOTIFICACIONES_V2.md):
// eventos `event: notificacion` con JSON en `data` (tipoEvento + condominioId +
// notificacionId + noLeidas + timestamp). Primer frame = SNAPSHOT_INICIAL con
// solo el conteo de no leídas; los cambios llegan como NOTIFICACION_CREADA con
// solo el id (la lista se lee siempre por REST /sync — el stream nunca
// transporta contenido sensible).
//
// Mismo transporte que los otros canales: fetch() + ReadableStream (EventSource
// no soporta cabeceras `Authorization`) y mismo ciclo de vida de reconexión con
// backoff (1s→30s). Singleton a nivel de módulo, dedupe por condominio.

const API_URL = import.meta.env.VITE_API_URL;
const EVENTO_NOTIFICACION = "notificacion";

const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;

export const streamNotificacionesVivo = ref(false);

// Módulo COMUNICACION no contratado (gating @RequiresModule → 403). Cuando el
// backend responde 403 por módulo (JSON, no la rama SSE), el stream NO debe
// reconectarse en bucle: es un módulo accesorio, la app sigue viva y la UI
// oculta la bandeja. Este ref permite a los consumidores reaccionar.
export const moduloNoContratado = ref(false);

const suscriptoresEventos = new Set();
const suscriptoresEstado = new Set();

let controller = null;
let condominioActual = null;
let timerReconexion = null;
let intentos = 0;

export function suscribirEventos(callback) {
  suscriptoresEventos.add(callback);
  return () => suscriptoresEventos.delete(callback);
}

export function suscribirEstado(callback) {
  suscriptoresEstado.add(callback);
  return () => suscriptoresEstado.delete(callback);
}

function notificarEvento(evento) {
  for (const cb of suscriptoresEventos) cb(evento);
}

function notificarEstado(estado, payload) {
  for (const cb of suscriptoresEstado) cb(estado, payload);
}

function delayReconexion() {
  intentos += 1;
  return Math.min(RETRY_BASE_MS * 2 ** (intentos - 1), RETRY_MAX_MS);
}

/**
 * Detecta si una respuesta HTTP fallida del stream es un 403 por módulo no
 * contratado. Solo se lee el body cuando el content-type es JSON (el 403 de
 * AccessDenied en SSE llega como text/event-stream sin body y NO debe parsearse
 * — contrato de la Ruptura 2). Devuelve false ante cualquier otro caso.
 */
async function esModuloNoContratadoEnRespuesta(respuesta) {
  const contentType = respuesta.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return false;
  try {
    const body = await respuesta.json();
    return esErrorModuloNoContratado({
      response: { status: respuesta.status, data: body },
    });
  } catch {
    return false;
  }
}

/**
 * Inicia (o mantiene) el stream SSE de notificaciones para el condominio
 * indicado. Dedupe: si ya hay una conexión viva para el mismo condominio, no
 * hace nada. Si cambia el condominio, aborta la anterior y conecta a la nueva.
 */
export function iniciarStreamNotificaciones(condominioId) {
  if (!condominioId) {
    detenerStreamNotificaciones();
    return;
  }

  if (condominioActual === condominioId && streamNotificacionesVivo.value) return;

  if (condominioActual !== condominioId) {
    detenerStreamNotificaciones();
  }

  condominioActual = condominioId;
  intentos = 0;
  moduloNoContratado.value = false;
  if (timerReconexion) {
    clearTimeout(timerReconexion);
    timerReconexion = null;
  }
  conectar();
}

function conectar() {
  if (!condominioActual) return;

  const token = accessToken.value;
  if (!token) {
    notificarEstado(
      "error",
      new Error("Sin sesión activa para el stream SSE de notificaciones"),
    );
    detenerStreamNotificaciones();
    return;
  }

  const miController = new AbortController();
  controller = miController;
  const parser = crearParserSse();

  fetch(`${API_URL}/condominios/${condominioActual}/notificaciones/stream`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
    signal: miController.signal,
  })
    .then(async (respuesta) => {
      if (!respuesta.ok || !respuesta.body) {
        // Contrato SSE (Ruptura 2): en status >= 400 el body puede estar vacío
        // (403 text/event-stream sin body). Solo se parsea el body cuando el
        // content-type es JSON — ahí el 403 por módulo (ModuleNotSubscribedException)
        // llega como JSON. Si es módulo no contratado, se detiene la reconexión.
        if (await esModuloNoContratadoEnRespuesta(respuesta)) {
          const cid = condominioActual;
          detenerStreamNotificaciones();
          moduloNoContratado.value = true;
          notificarEstado("modulo-no-contratado", { condominioId: cid });
          return;
        }
        throw new Error(`SSE respondió HTTP ${respuesta.status}`);
      }

      streamNotificacionesVivo.value = true;
      intentos = 0;
      notificarEstado("conectado", { condominioId: condominioActual });

      const reader = respuesta.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const texto = decoder.decode(value, { stream: true });
        const eventos = parser(texto);
        for (const evento of eventos) notificarEvento(evento);
      }

      // El servidor cerró el stream limpiamente → reconectar.
      programarReconexion();
    })
    .catch((error) => {
      if (miController.signal.aborted) return;
      console.error("[notificacionesStreamService] Error en stream SSE:", error);
      notificarEstado("error", error);
      programarReconexion();
    })
    .finally(() => {
      if (miController.signal.aborted) return;
      if (streamNotificacionesVivo.value) streamNotificacionesVivo.value = false;
    });
}

function programarReconexion() {
  if (streamNotificacionesVivo.value) streamNotificacionesVivo.value = false;
  if (!condominioActual) return;

  const delay = delayReconexion();
  console.info(
    `[notificacionesStreamService] Reconectando stream SSE de notificaciones en ${delay}ms (condominio ${condominioActual})`,
  );
  notificarEstado("reconectando", delay);

  timerReconexion = setTimeout(() => {
    timerReconexion = null;
    conectar();
  }, delay);
}

/** Cierra la conexión actual y limpia timers de reconexión. */
export function detenerStreamNotificaciones() {
  if (timerReconexion) {
    clearTimeout(timerReconexion);
    timerReconexion = null;
  }
  if (controller) {
    controller.abort();
    controller = null;
  }
  if (streamNotificacionesVivo.value) streamNotificacionesVivo.value = false;
  condominioActual = null;
  intentos = 0;
}

/** Nombre del evento SSE que transporta las señales de la bandeja. */
export { EVENTO_NOTIFICACION };
