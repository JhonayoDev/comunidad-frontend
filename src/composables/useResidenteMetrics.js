import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/services/dashboardService";

// ─── Polling dashboard residente ─────────────────────────────────────────────
// GET /condominios/{id}/dashboard/residente/metrics (Cache-Control: no-cache, @RequiresModule ENCOMIENDAS).
// Polling 60s (menor criticidad que guardia 30s); SSE solo para notificaciones.

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
