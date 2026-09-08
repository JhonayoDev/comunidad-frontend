import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/services/dashboardService";

// ─── Polling reemplazo del SSE del dashboard operativo ───────────────────────
// Backend feature/cambios-rendimiento deprecó GET /dashboard/stream (SSE) y
// creó GET /condominios/{id}/dashboard/metrics (Cache-Control: no-cache).
// TanStack Query hace polling 30s (30-60s, elegido 30s para guardia/operativo).
// El stream de notificaciones (/notificaciones/stream) es INDEPENDIENTE y no se toca.

export function useDashboardMetrics() {
  const auth = useAuthStore();
  const condominioId = computed(() => auth.condominioActualId);

  const enabled = computed(() => !!condominioId.value);

  const query = useQuery({
    queryKey: computed(() => ["dashboardMetrics", condominioId.value]),
    queryFn: async () => {
      const { data } = await dashboardService.getMetrics(condominioId.value);
      return data;
    },
    enabled,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });

  return {
    data: computed(() => query.data.value),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => query.error.value),
    refetch: query.refetch,
    // Accesos directos tipados según DTO DashboardMetricasPollingResponse
    visitasActivas: computed(() => query.data.value?.visitasActivas ?? null),
    encomiendasPendientes: computed(() => query.data.value?.encomiendasPendientes ?? null),
    autorizacionesPendientes: computed(() => query.data.value?.autorizacionesPendientes ?? null),
  };
}
