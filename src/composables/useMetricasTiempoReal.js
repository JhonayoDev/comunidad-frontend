import { computed, reactive } from "vue";
import { queryClient } from "@/queryClient";
import { useAuthStore } from "@/stores/authStore";
import {
  suscribirEventos,
  streamVivo,
  EVENTO_METRICAS,
} from "@/services/dashboardStreamService";

// ─── Registro de métricas del dashboard operativo ────────────────────────────
// Clave SSE (backend) → estrategia de actualización sobre TanStack Query.
//   - invalidar: la query devuelve una lista; no conocemos su contenido desde
//     el SSE, así que invalidamos para refetchear.
//   - aplicar: la query devuelve un conteo; sobrescribimos el dato al instante.
//
// UC-5 (extensión): agregar una métrica nueva = sumar una entrada aquí y que el
// backend publique la `clave`. No hay cambios de transporte.

const INTERVALO_STREAM_VIVO_MS = 60_000;
const INTERVALO_FALLBACK_MS = 30_000;

const METRICAS = {
  visitasActivas: {
    queryKey: (cid) => ["conteoActivos", cid],
    aplicar: (old, valor) => ({ ...(old ?? {}), activosAhora: Number(valor) }),
  },
  encomiendasPendientes: {
    queryKey: (cid) => ["encomiendasPendientes", cid],
    invalidar: true,
  },
  autorizacionesPendientes: {
    queryKey: (cid) => ["autorizacionesPendientes", cid],
    invalidar: true,
  },
};

// Últimos valores conocidos por clave (para lectura instantánea en las cards).
export const metricas = reactive({});

function aplicarMetrica(condominioId, clave, valor) {
  const config = METRICAS[clave];
  if (!config) {
    console.info(`[useMetricasTiempoReal] métrica SSE desconocida: ${clave}`);
    return;
  }

  metricas[clave] = Number(valor);
  const key = config.queryKey(condominioId);

  if (config.invalidar) {
    queryClient.invalidateQueries({ queryKey: key });
  } else {
    queryClient.setQueryData(key, (old) => config.aplicar(old, valor));
  }
}

let suscrito = false;

function asegurarSuscripcion() {
  if (suscrito) return;
  suscrito = true;

  suscribirEventos((evento) => {
    if (evento.event !== EVENTO_METRICAS) return;

    let payload;
    try {
      payload = JSON.parse(evento.data);
    } catch (e) {
      console.error("[useMetricasTiempoReal] Payload SSE inválido:", e);
      return;
    }

    if (!payload?.condominioId || !Array.isArray(payload.metricas)) return;
    for (const metrica of payload.metricas) {
      if (metrica?.clave && metrica?.valor != null) {
        aplicarMetrica(payload.condominioId, metrica.clave, metrica.valor);
      }
    }
  });
}

/**
 * Composable de integración SSE ↔ TanStack Query.
 *
 * Proporciona el intervalo de refetch reactivo: cuando el stream SSE está vivo,
 * el polling baja a 60s (solo como respaldo); si cae, sube a 30s (UC-6).
 */
export function useMetricasTiempoReal() {
  asegurarSuscripcion();

  const auth = useAuthStore();
  const estaVivo = computed(() => streamVivo.value);

  // Intervalo reactivo: cuando `streamVivo` cambia, TanStack Query re-evalúa
  // este ref sin reiniciar la query ni tocar el componente (UC-6).
  const refetchIntervalMetrica = computed(() =>
    streamVivo.value ? INTERVALO_STREAM_VIVO_MS : INTERVALO_FALLBACK_MS,
  );

  return { estaVivo, refetchIntervalMetrica, metricas };
}
