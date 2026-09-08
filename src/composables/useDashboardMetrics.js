import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/services/dashboardService";
import { esErrorModuloNoContratado } from "@/utils/errores";

// ─── Polling dashboard operativo ─────────────────────────────────────────────
// GET /condominios/{id}/dashboard/metrics (Cache-Control: no-cache, @RequiresModule CONTROL_ACCESO).
// Polling 30s con TanStack Query; SSE solo queda para notificaciones (/notificaciones/stream).
// Si el módulo CONTROL_ACCESO no está contratado → 403 moduleNotSubscribed → pausar polling.

export function useDashboardMetrics() {
  const auth = useAuthStore();
  const condominioId = computed(() => auth.condominioActualId);

  const enabled = computed(() => !!condominioId.value);

  const intervalRef = ref(30_000);

  const query = useQuery({
    queryKey: computed(() => ["dashboardMetrics", condominioId.value]),
    queryFn: async () => {
      const { data } = await dashboardService.getMetrics(condominioId.value);
      return data;
    },
    enabled,
    // 403 por módulo no contratado → pausar polling (evita loop 30s). F2 P18.
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
    intervalRef.value = missing ? false : 30_000;
  });

  return {
    data: computed(() => query.data.value),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => query.error.value),
    refetch: query.refetch,
    isModuleMissing,
    // Accesos directos tipados según DTO DashboardMetricasPollingResponse
    visitasActivas: computed(() => query.data.value?.visitasActivas ?? null),
    encomiendasPendientes: computed(() => query.data.value?.encomiendasPendientes ?? null),
    autorizacionesPendientes: computed(() => query.data.value?.autorizacionesPendientes ?? null),
  };
}
