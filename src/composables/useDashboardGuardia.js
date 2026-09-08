import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/services/dashboardService";
import { autorizacionesService } from "@/services/autorizacionesService";
import { computed } from "vue";

// [SSE-REMOVAL] Dashboard guardia sin SSE: snapshot + listas con polling fijo.
// Las métricas en vivo (visitas/encomiendas/autorizacionesPendientes) vienen
// de GET /dashboard/metrics vía useDashboardMetrics (30s). El snapshot
// /dashboard/guardia y la lista de autorizaciones se refrescan en background
// con refetchInterval 30s (refetchIntervalInBackground false en metrics).

export function useDashboardGuardia() {
  const auth = useAuthStore();

  const dashboardQuery = useQuery({
    queryKey: ["dashboardGuardia", auth.condominioActualId],
    queryFn: async () => {
      const { data } = await dashboardService.guardia(auth.condominioActualId);
      return data;
    },
    enabled: !!auth.condominioActualId,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });

  const autorizacionesQuery = useQuery({
    queryKey: ["autorizacionesPendientes", auth.condominioActualId],
    queryFn: async () => {
      const { data } = await autorizacionesService.listar(
        auth.condominioActualId,
        { estado: "PENDIENTE" },
      );
      return data || [];
    },
    enabled: !!auth.condominioActualId,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });

  const loading = dashboardQuery.isLoading || autorizacionesQuery.isLoading;

  const error =
    dashboardQuery.isError || autorizacionesQuery.isError
      ? "Error al cargar el dashboard"
      : null;

  const dashboard = computed(() => dashboardQuery.data);
  const autorizaciones = computed(() => autorizacionesQuery.data ?? []);

  function severityEstado(estado) {
    if (estado === "ACTIVO") return "success";
    if (estado === "FINALIZADO") return "info";
    if (estado === "RECHAZADO") return "danger";
    return "warn";
  }

  function cargarDashboard() {
    dashboardQuery.refetch();
    autorizacionesQuery.refetch();
  }

  return {
    dashboard,
    autorizaciones,
    loading,
    error,
    cargarDashboard,
    severityEstado,
  };
}

