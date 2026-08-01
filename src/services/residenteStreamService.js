import { ref } from "vue";
import { accessToken } from "@/utils/tokenStore";
import { crearParserSse } from "@/utils/sseParser";

// ─── Cliente SSE scoped al residente (canal "mis encomiendas") ───────────────
// Bus INDEPENDIENTE del canal operativo (dashboardStreamService): distinto
// endpoint (/dashboard/residente/stream), distinto payload (señales por unidad,
// no conteos globales) y distinto permiso (DASHBOARD_RESIDENTE). Por eso cada
// canal tiene su propia conexión y su propio ref `stream*Vivo`.
//
// Contrato en docs/sse-residente-mis-encomiendas.md: eventos `event: metrica`
// con JSON en `data` (tipoEvento + condominioId + unidadId/unidadNumero/
// encomiendaId + pendientes + timestamp). Primer frame = SNAPSHOT_INICIAL.
//
// Mismo transporte que el canal operativo: fetch() + ReadableStream (EventSource
// no soporta cabeceras `Authorization`) y mismo ciclo de vida de reconexión con
// backoff (1s→30s). Singleton a nivel de módulo, dedupe por condominio.

const API_URL = import.meta.env.VITE_API_URL;
const EVENTO_METRICAS = "metrica";

const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;

export const streamResidenteVivo = ref(false);

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
 * Inicia (o mantiene) el stream SSE del residente para el condominio indicado.
 * Dedupe: si ya hay una conexión viva para el mismo condominio, no hace nada.
 * Si cambia el condominio, aborta la anterior y conecta a la nueva.
 */
export function iniciarStreamResidente(condominioId) {
  if (!condominioId) {
    detenerStreamResidente();
    return;
  }

  if (condominioActual === condominioId && streamResidenteVivo.value) return;

  if (condominioActual !== condominioId) {
    detenerStreamResidente();
  }

  condominioActual = condominioId;
  intentos = 0;
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
      new Error("Sin sesión activa para el stream SSE del residente"),
    );
    detenerStreamResidente();
    return;
  }

  const miController = new AbortController();
  controller = miController;
  const parser = crearParserSse();

  fetch(`${API_URL}/condominios/${condominioActual}/dashboard/residente/stream`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
    signal: miController.signal,
  })
    .then(async (respuesta) => {
      if (!respuesta.ok || !respuesta.body) {
        throw new Error(`SSE respondió HTTP ${respuesta.status}`);
      }

      streamResidenteVivo.value = true;
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
      console.error("[residenteStreamService] Error en stream SSE:", error);
      notificarEstado("error", error);
      programarReconexion();
    })
    .finally(() => {
      if (miController.signal.aborted) return;
      if (streamResidenteVivo.value) streamResidenteVivo.value = false;
    });
}

function programarReconexion() {
  if (streamResidenteVivo.value) streamResidenteVivo.value = false;
  if (!condominioActual) return;

  const delay = delayReconexion();
  console.info(
    `[residenteStreamService] Reconectando stream SSE del residente en ${delay}ms (condominio ${condominioActual})`,
  );
  notificarEstado("reconectando", delay);

  timerReconexion = setTimeout(() => {
    timerReconexion = null;
    conectar();
  }, delay);
}

/** Cierra la conexión actual y limpia timers de reconexión. */
export function detenerStreamResidente() {
  if (timerReconexion) {
    clearTimeout(timerReconexion);
    timerReconexion = null;
  }
  if (controller) {
    controller.abort();
    controller = null;
  }
  if (streamResidenteVivo.value) streamResidenteVivo.value = false;
  condominioActual = null;
  intentos = 0;
}

/** Nombre del evento SSE que transporta las señales de "mis encomiendas". */
export { EVENTO_METRICAS };
