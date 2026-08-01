import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/services/dashboardService";
import { autorizacionesService } from "@/services/autorizacionesService";
import { useMetricasTiempoReal } from "@/composables/useMetricasTiempoReal";
import { computed } from "vue";

export function useDashboardGuardia() {
  const auth = useAuthStore();
  const { refetchIntervalMetrica } = useMetricasTiempoReal();

  const dashboardQuery = useQuery({
    queryKey: ["dashboardGuardia", auth.condominioActualId],
    queryFn: async () => {
      const { data } = await dashboardService.guardia(auth.condominioActualId);
      return data;
    },
    enabled: !!auth.condominioActualId,
    refetchInterval: refetchIntervalMetrica,
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
    refetchInterval: refetchIntervalMetrica,
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

