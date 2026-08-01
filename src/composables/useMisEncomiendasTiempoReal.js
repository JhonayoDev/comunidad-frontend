import { computed, ref } from "vue";
import { queryClient } from "@/queryClient";
import {
  suscribirEventos,
  suscribirEstado,
  streamResidenteVivo,
  EVENTO_METRICAS,
} from "@/services/residenteStreamService";

// ─── Integración SSE ↔ TanStack Query para "mis encomiendas" del residente ──
// El stream residente (contrato en docs/sse-residente-mis-encomiendas.md) es la
// fuente primaria de cambios sobre la lista: ante ENCOMIENDA_RECIBIDA/ENTREGADA/
// CERRADA se invalida ["misEncomiendas", cid] y la query refetchea
// GET /mis-encomiendas (única fuente de verdad de la lista).
//
// El SNAPSHOT_INICIAL (primer frame al conectar/reconectar) siembra el badge
// (`pendientesResidente`) y también invalida la query para reconciliar deltas
// perdidos durante la caída. Patrón de respaldo idéntico al dashboard
// operativo: con stream vivo NO hay polling; si cae, gracia de 1 min y solo
// tras expirar, polling de respaldo a 2 min.

const GRACIA_POLLING_MS = 60_000;
const INTERVALO_FALLBACK_MS = 120_000;

const EVENTOS_CAMBIO = new Set([
  "ENCOMIENDA_RECIBIDA",
  "ENCOMIENDA_ENTREGADA",
  "ENCOMIENDA_CERRADA",
]);

// Estado de gracia de caída: durante `GRACIA_POLLING_MS` con el stream caído NO
// se pollea (se le da tiempo a la reconexión con backoff de recuperarse sola).
// Pasado ese plazo sin recuperarse, se activa el polling de respaldo de 2 min.
// `graciaExpirada` es un ref compartido a nivel de módulo (igual que
// `pendientesResidente`) para que todas las instancias del composable observen
// el mismo estado.
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

// Último conteo pendiente del snapshot (seed del badge). Se siembra solo con
// SNAPSHOT_INICIAL y se descarta ante un evento de cambio para que el badge
// vuelva a la longitud de la lista (evita mostrar un conteo stale mientras la
// query de la lista se reconcilia).
export const pendientesResidente = ref(null);

let suscrito = false;
let estadoAnterior = null;

function asegurarSuscripcion() {
  if (suscrito) return;
  suscrito = true;

  suscribirEventos((evento) => {
    if (evento.event !== EVENTO_METRICAS) return;

    let payload;
    try {
      payload = JSON.parse(evento.data);
    } catch (e) {
      console.error("[useMisEncomiendasTiempoReal] Payload SSE inválido:", e);
      return;
    }

    const cid = payload?.condominioId;
    if (!cid) return;

    if (payload.tipoEvento === "SNAPSHOT_INICIAL") {
      pendientesResidente.value = payload.pendientes ?? null;
    } else if (EVENTOS_CAMBIO.has(payload.tipoEvento)) {
      pendientesResidente.value = null;
    }

    // Invalidar la lista: ante un cambio (refetch) y ante el snapshot
    // (reconciliación al conectar/reconectar, deltas perdidos durante la
    // caída). En el primer montaje coincide con la carga inicial de la query
    // (TanStack Query deduplica el refetch en vuelo), así que no duplica red.
    queryClient.invalidateQueries({ queryKey: ["misEncomiendas", cid] });
  });

  suscribirEstado((estado, payload) => {
    if (estado === "conectado") {
      // El stream se recuperó: cancela la gracia de caída y vuelve a SSE puro.
      cancelarGracia();

      // Reconexión tras caída → refetch de la lista como respaldo; el
      // SNAPSHOT_INICIAL (primer frame) es ahora la fuente de reconciliación y
      // el refetch solo reconcilia deltas si el snapshot fallara.
      const esReconexion =
        estadoAnterior === "reconectando" || estadoAnterior === "error";
      if (esReconexion && payload?.condominioId) {
        queryClient.invalidateQueries({
          queryKey: ["misEncomiendas", payload.condominioId],
        });
      }
      estadoAnterior = "conectado";
    } else {
      // Reconectando o error: inicia la gracia (idempotente — solo la primera
      // vez; no se reinicia con cada intento de backoff del stream).
      iniciarGracia();
      estadoAnterior = estado;
    }
  });
}

/**
 * Composable de integración SSE ↔ TanStack Query para "mis encomiendas".
 *
 * Con el stream SSE vivo NO hay polling (el SSE es la fuente primaria). Solo si
 * el stream cae y no se recupera en la gracia (1 min), el intervalo de respaldo
 * sube a 2 min para no inundar de peticiones (mismo patrón que
 * `useMetricasTiempoReal`).
 */
export function useMisEncomiendasTiempoReal() {
  asegurarSuscripcion();

  const estaVivo = computed(() => streamResidenteVivo.value);

  // Intervalo reactivo de respaldo:
  //   - `false` mientras el stream está vivo (SSE es la fuente primaria).
  //   - `false` durante la gracia de caída: se le da tiempo a la reconexión
  //     (backoff 1s→30s) de recuperarse sola sin disparar peticiones.
  //   - `INTERVALO_FALLBACK_MS` (2 min) solo si el stream sigue caído pasada
  //     la gracia — polling espaciado que no inunda de requests.
  // TanStack Query re-evalúa este ref reactivamente al cambiar
  // `streamResidenteVivo` o `graciaExpirada`, sin reiniciar la query.
  const refetchIntervalResidente = computed(() => {
    if (streamResidenteVivo.value) return false;
    if (!graciaExpirada.value) return false;
    return INTERVALO_FALLBACK_MS;
  });

  return { estaVivo, refetchIntervalResidente, pendientesResidente };
}
