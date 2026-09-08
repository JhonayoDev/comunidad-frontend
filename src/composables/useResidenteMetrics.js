import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/services/dashboardService";
import { esErrorModuloNoContratado } from "@/utils/errores";

// ─── Polling dashboard residente ─────────────────────────────────────────────
// GET /condominios/{id}/dashboard/residente/metrics (Cache-Control: no-cache, @RequiresModule ENCOMIENDAS).
// Polling 60s (menor criticidad que guardia 30s); SSE solo para notificaciones.
// Si el módulo ENCOMIENDAS no está contratado → 403 moduleNotSubscribed → pausar polling.

export function useResidenteMetrics() {
  const auth = useAuthStore();
  const condominioId = computed(() => auth.condominioActualId);

  const enabled = computed(() => !!condominioId.value);

  const intervalRef = ref(60_000);

  const query = useQuery({
    queryKey: computed(() => ["residenteMetrics", condominioId.value]),
    queryFn: async () => {
      const { data } = await dashboardService.getResidenteMetrics(condominioId.value);
      return data;
    },
    enabled,
    // 403 por módulo no contratado → pausar polling (evita loop 60s). F2 P18.
    refetchInterval: intervalRef,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
    retry: (failureCount, error) => {
      if (esErrorModuloNoContratado(error)) return false;
      return failureCount < 2;
    },
  });

  const isModuleMissing = computed(() => esErrorModuloNoContratado(query.error.value));

  watch(isModuleMissing, (missing) => {
    intervalRef.value = missing ? false : 60_000;
  });

  return {
    data: computed(() => query.data.value),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => query.error.value),
    refetch: query.refetch,
    isModuleMissing,
    encomiendasPendientes: computed(() => query.data.value?.encomiendasPendientes ?? null),
  };
}
