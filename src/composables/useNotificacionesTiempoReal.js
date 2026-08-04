import { computed, ref } from "vue";
import { queryClient } from "@/queryClient";
import {
  suscribirEventos,
  suscribirEstado,
  streamNotificacionesVivo,
  moduloNoContratado,
  EVENTO_NOTIFICACION,
} from "@/services/notificacionesStreamService";

// ─── Integración SSE ↔ TanStack Query para la bandeja de notificaciones ──────
// El stream de notificaciones (contrato en SOLICITUD_MOTOR_NOTIFICACIONES_V2.md)
// es la fuente primaria del badge: ante NOTIFICACION_CREADA se invalida
// ["notificaciones-sync", cid] y la query refetchea GET /notificaciones/sync
// (única fuente de verdad de la lista; el stream nunca transporta contenido).
//
// El SNAPSHOT_INICIAL (primer frame al conectar/reconectar) siembra el badge
// (`noLeidasNotificaciones`) y también invalida la query para reconciliar deltas
// perdidos durante la caída. Patrón de respaldo idéntico al dashboard
// operativo y al stream del residente: con stream vivo NO hay polling; si cae,
// gracia de 1 min y solo tras expirar, polling de respaldo a 2 min.

const GRACIA_POLLING_MS = 60_000;
const INTERVALO_FALLBACK_MS = 120_000;

// Estado de gracia de caída: durante `GRACIA_POLLING_MS` con el stream caído NO
// se pollea (se le da tiempo a la reconexión con backoff de recuperarse sola).
// Pasado ese plazo sin recuperarse, se activa el polling de respaldo de 2 min.
// `graciaExpirada` es un ref compartido a nivel de módulo (igual que
// `noLeidasNotificaciones`) para que todas las instancias del composable
// observen el mismo estado.
const graciaExpirada = ref(false);
let timerGracia = null;

function cancelarGracia() {
  if (timerGracia) {
    clearTimeout(timerGracia);
    timerGracia = null;
  }
  graciaExpirada.value = false;
}

function iniciarGracia() {
  if (timerGracia || graciaExpirada.value) return;
  timerGracia = setTimeout(() => {
    timerGracia = null;
    graciaExpirada.value = true;
  }, GRACIA_POLLING_MS);
}

// Último conteo de no leídas del snapshot (seed del badge). Se siembra solo con
// SNAPSHOT_INICIAL y se descarta ante un evento de cambio para que el badge
// vuelva al valor real del sync (evita mostrar un conteo stale mientras la
// query de la lista se reconcilia).
export const noLeidasNotificaciones = ref(null);

let suscrito = false;
let estadoAnterior = null;

function asegurarSuscripcion() {
  if (suscrito) return;
  suscrito = true;

  suscribirEventos((evento) => {
    if (evento.event !== EVENTO_NOTIFICACION) return;

    let payload;
    try {
      payload = JSON.parse(evento.data);
    } catch (e) {
      console.error("[useNotificacionesTiempoReal] Payload SSE inválido:", e);
      return;
    }

    const cid = payload?.condominioId;
    if (!cid) return;

    if (payload.tipoEvento === "SNAPSHOT_INICIAL") {
      noLeidasNotificaciones.value = payload.noLeidas ?? null;
    } else if (payload.tipoEvento === "NOTIFICACION_CREADA") {
      noLeidasNotificaciones.value = null;
    }

    // Invalidar la bandeja: ante un cambio (refetch del sync) y ante el
    // snapshot (reconciliación al conectar/reconectar, deltas perdidos durante
    // la caída). En el primer montaje coincide con la carga inicial de la query
    // (TanStack Query deduplica el refetch en vuelo), así que no duplica red.
    queryClient.invalidateQueries({ queryKey: ["notificaciones-sync", cid] });
  });

  suscribirEstado((estado, payload) => {
    if (estado === "conectado") {
      // El stream se recuperó: cancela la gracia de caída y vuelve a SSE puro.
      cancelarGracia();

      // Reconexión tras caída → refetch del sync como respaldo; el
      // SNAPSHOT_INICIAL (primer frame) es ahora la fuente de reconciliación y
      // el refetch solo reconcilia deltas si el snapshot fallara.
      const esReconexion =
        estadoAnterior === "reconectando" || estadoAnterior === "error";
      if (esReconexion && payload?.condominioId) {
        queryClient.invalidateQueries({
          queryKey: ["notificaciones-sync", payload.condominioId],
        });
      }
      estadoAnterior = "conectado";
    } else if (estado === "modulo-no-contratado") {
      // Módulo COMUNICACION no contratado: no hay stream ni polling. La UI
      // oculta la bandeja; no se inicia gracia ni fallback (evita reintentos).
      cancelarGracia();
      estadoAnterior = estado;
    } else {
      // Reconectando o error: inicia la gracia (idempotente — solo la primera
      // vez; no se reinicia con cada intento de backoff del stream).
      iniciarGracia();
      estadoAnterior = estado;
    }
  });
}

/**
 * Composable de integración SSE ↔ TanStack Query para la bandeja de
 * notificaciones.
 *
 * Con el stream SSE vivo NO hay polling (el SSE es la fuente primaria). Solo si
 * el stream cae y no se recupera en la gracia (1 min), el intervalo de respaldo
 * sube a 2 min para no inundar de peticiones (mismo patrón que
 * `useMetricasTiempoReal` y `useMisEncomiendasTiempoReal`).
 */
export function useNotificacionesTiempoReal() {
  asegurarSuscripcion();

  const estaVivo = computed(() => streamNotificacionesVivo.value);

  // Intervalo reactivo de respaldo:
  //   - `false` mientras el stream está vivo (SSE es la fuente primaria).
  //   - `false` durante la gracia de caída: se le da tiempo a la reconexión
  //     (backoff 1s→30s) de recuperarse sola sin disparar peticiones.
  //   - `INTERVALO_FALLBACK_MS` (2 min) solo si el stream sigue caído pasada
  //     la gracia — polling espaciado que no inunda de requests.
  // TanStack Query re-evalúa este ref reactivamente al cambiar
  // `streamNotificacionesVivo` o `graciaExpirada`, sin reiniciar la query.
  const refetchIntervalNotificaciones = computed(() => {
    if (moduloNoContratado.value) return false;
    if (streamNotificacionesVivo.value) return false;
    if (!graciaExpirada.value) return false;
    return INTERVALO_FALLBACK_MS;
  });

  return {
    estaVivo,
    refetchIntervalNotificaciones,
    noLeidasNotificaciones,
  };
}
