import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/services/dashboardService";

// ─── Polling dashboard operativo ─────────────────────────────────────────────
// GET /condominios/{id}/dashboard/metrics (Cache-Control: no-cache, @RequiresModule CONTROL_ACCESO).
// Polling 30s con TanStack Query; SSE solo queda para notificaciones (/notificaciones/stream).

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
