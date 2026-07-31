import { computed, reactive } from "vue";
import { queryClient } from "@/queryClient";
import { useAuthStore } from "@/stores/authStore";
import {
  suscribirEventos,
  suscribirEstado,
  streamVivo,
  EVENTO_METRICAS,
} from "@/services/dashboardStreamService";

// ─── Registro de métricas del dashboard operativo ────────────────────────────
// Clave SSE (backend) → estrategia de actualización sobre TanStack Query.
//   - invalidar: la query devuelve una lista; no conocemos su contenido desde
//     el SSE, así que invalidamos para refetchear.
//   - soloConteo: no hay query que tocar; el valor llega por SSE y se lee
//     desde `metricas` (no se fetchea un endpoint ligero solo para contar).
//
// UC-5 (extensión): agregar una métrica nueva = sumar una entrada aquí y que el
// backend publique la `clave`. No hay cambios de transporte.

const INTERVALO_FALLBACK_MS = 60_000;

const METRICAS = {
  visitasActivas: {
    soloConteo: true,
  },
  encomiendasPendientes: {
    soloConteo: true,
  },
  autorizacionesPendientes: {
    queryKey: (cid) => ["autorizacionesPendientes", cid],
    invalidar: true,
  },
};

// Últimos valores conocidos por clave (lectura instantánea en las cards).
// Se limpian SOLO al cambiar de condominio (evita filtrar conteos del
// condominio anterior). El backend envía SNAPSHOT_INICIAL como primer frame
// del stream al conectar/reconectar, repoblando los valores frescos sin
// necesidad de esperar un evento de cambio (UC-3/UC-4).
export const metricas = reactive({});

function limpiarMetricas() {
  for (const clave of Object.keys(metricas)) {
    delete metricas[clave];
  }
}

function invalidarQueriesRegistradas(condominioId) {
  for (const config of Object.values(METRICAS)) {
    if (!config.soloConteo && config.queryKey) {
      queryClient.invalidateQueries({ queryKey: config.queryKey(condominioId) });
    }
  }
}

function aplicarMetrica(condominioId, clave, valor) {
  const config = METRICAS[clave];
  if (!config) {
    console.info(`[useMetricasTiempoReal] métrica SSE desconocida: ${clave}`);
    return;
  }

  metricas[clave] = Number(valor);
  if (config.soloConteo) return;

  const key = config.queryKey(condominioId);
  if (config.invalidar) {
    queryClient.invalidateQueries({ queryKey: key });
  } else {
    queryClient.setQueryData(key, (old) => config.aplicar(old, valor));
  }
}

let suscrito = false;
let estadoAnterior = null;
let condominioConectado = null;

function asegurarSuscripcion() {
  if (suscrito) return;
  suscrito = true;

  suscribirEventos((evento) => {
    if (evento.event !== EVENTO_METRICAS) return;

    // `tipoEvento` es informativo y opaco: el SNAPSHOT_INICIAL (primer frame
    // al conectar/reconectar) y los eventos de cambio (ACCESO_INGRESADO,
    // ENCOMIENDA_RECIBIDA, ...) comparten el mismo evento `metrica` y el mismo
    // payload — se aplican igual, sin validar contra un enum.
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

  suscribirEstado((estado, payload) => {
    if (estado === "conectado") {
      const cid = payload?.condominioId;

      // Limpiar SOLO al conectar a un condominio distinto (primera vez o
      // cambio de condominio): evita mostrar conteos del condominio anterior.
      // En la reconexión del MISMO condominio NO se resetea: el backend envía
      // SNAPSHOT_INICIAL como primer frame del stream y repuebla `metricas`
      // al instante (un reset acá solo causaría un parpadeo a `conteoInicial`).
      if (condominioConectado !== cid) {
        limpiarMetricas();
        condominioConectado = cid;
      }

      // Reconexión tras caída → refetch del snapshot HTTP como respaldo; el
      // SNAPSHOT_INICIAL del stream es ahora la fuente de reconciliación y el
      // refetch solo reconcilia deltas si el snapshot fallara (UC-4).
      const esReconexion =
        estadoAnterior === "reconectando" || estadoAnterior === "error";
      if (esReconexion && cid) {
        invalidarQueriesRegistradas(cid);
        // El seed de las cards (`dashboard.encomiendas`, `dashboard.totalUnidades`,
        // ...) también debe reconciliarse con el snapshot fresco.
        queryClient.invalidateQueries({ queryKey: ["dashboardGuardia", cid] });
      }
      estadoAnterior = "conectado";
    } else {
      estadoAnterior = estado;
    }
  });
}

/**
 * Composable de integración SSE ↔ TanStack Query.
 *
 * Con el stream SSE vivo NO hay polling (el SSE es la fuente primaria). Solo
 * si el stream cae, el intervalo de respaldo sube a 60s (UC-6).
 */
export function useMetricasTiempoReal() {
  asegurarSuscripcion();

  const auth = useAuthStore();
  const estaVivo = computed(() => streamVivo.value);

  // Intervalo reactivo: `false` (sin polling) mientras el stream está vivo;
  // 60s cuando cae. Al cambiar `streamVivo`, TanStack Query re-evalúa este ref
  // sin reiniciar la query ni tocar el componente (UC-6).
  const refetchIntervalMetrica = computed(() =>
    streamVivo.value ? false : INTERVALO_FALLBACK_MS,
  );

  return { estaVivo, refetchIntervalMetrica, metricas };
}
