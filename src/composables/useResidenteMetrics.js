import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/services/dashboardService";

// ─── Polling reemplazo del SSE del residente ─────────────────────────────────
// Backend deprecó GET /dashboard/residente/stream (SSE) y creó
// GET /condominios/{id}/dashboard/residente/metrics (Cache-Control: no-cache).
// Polling 60s para residente (30s guardia, 60s residente por menor criticidad).
// El stream de notificaciones (/notificaciones/stream) no se toca.

export function useResidenteMetrics() {
  const auth = useAuthStore();
  const condominioId = computed(() => auth.condominioActualId);

  const enabled = computed(() => !!condominioId.value);

  const query = useQuery({
    queryKey: computed(() => ["residenteMetrics", condominioId.value]),
    queryFn: async () => {
      const { data } = await dashboardService.getResidenteMetrics(condominioId.value);
      return data;
    },
    enabled,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });

  return {
    data: computed(() => query.data.value),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => query.error.value),
    refetch: query.refetch,
    encomiendasPendientes: computed(() => query.data.value?.encomiendasPendientes ?? null),
  };
}
