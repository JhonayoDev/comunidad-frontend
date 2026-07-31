import { ref } from "vue";
import { accessToken } from "@/utils/tokenStore";
import { crearParserSse } from "@/utils/sseParser";

// ─── Cliente SSE vía fetch() + ReadableStream ────────────────────────────────
// EventSource nativo NO permite headers personalizados, y el backend requiere
// `Authorization: Bearer`. Por eso el stream se lee con fetch() y se parsea el
// cuerpo text/event-stream a mano (ver utils/sseParser.js).
//
// Singleton a nivel de módulo: hay UNA conexión activa a la vez, deduplicada
// por condominio. `streamVino` es un ref reactivo compartido (igual que
// `accessToken`) para que TanStack Query pueda bajar el refetchInterval cuando
// el stream está vivo.

const API_URL = import.meta.env.VITE_API_URL;
const EVENTO_METRICAS = "metrica";

const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;

export const streamVivo = ref(false);

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
 * Inicia (o mantiene) el stream SSE del condominio indicado.
 * Dedupe: si ya hay una conexión viva para el mismo condominio, no hace nada.
 * Si cambia el condominio, aborta la anterior y conecta a la nueva.
 */
export function iniciarStream(condominioId) {
  if (!condominioId) {
    detenerStream();
    return;
  }

  if (condominioActual === condominioId && streamVivo.value) return;

  if (condominioActual !== condominioId) {
    detenerStream();
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
    notificarEstado("error", new Error("Sin sesión activa para el stream SSE"));
    detenerStream();
    return;
  }

  const miController = new AbortController();
  controller = miController;
  const parser = crearParserSse();

  fetch(`${API_URL}/condominios/${condominioActual}/dashboard/stream`, {
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

      streamVivo.value = true;
      intentos = 0;
      notificarEstado("conectado");

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
      console.error("[dashboardStreamService] Error en stream SSE:", error);
      notificarEstado("error", error);
      programarReconexion();
    })
    .finally(() => {
      if (miController.signal.aborted) return;
      if (streamVivo.value) streamVivo.value = false;
    });
}

function programarReconexion() {
  if (streamVivo.value) streamVivo.value = false;
  if (!condominioActual) return;

  const delay = delayReconexion();
  console.info(
    `[dashboardStreamService] Reconectando stream SSE en ${delay}ms (condominio ${condominioActual})`,
  );
  notificarEstado("reconectando", delay);

  timerReconexion = setTimeout(() => {
    timerReconexion = null;
    conectar();
  }, delay);
}

/** Cierra la conexión actual y limpia timers de reconexión. */
export function detenerStream() {
  if (timerReconexion) {
    clearTimeout(timerReconexion);
    timerReconexion = null;
  }
  if (controller) {
    controller.abort();
    controller = null;
  }
  if (streamVivo.value) streamVivo.value = false;
  condominioActual = null;
  intentos = 0;
}

/** Nombre del evento SSE que transporta métricas del dashboard. */
export { EVENTO_METRICAS };
