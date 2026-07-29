import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/services/dashboardService";
import { encomiendasService } from "@/services/encomiendasService";
import { autorizacionesService } from "@/services/autorizacionesService";
import { visitasService } from "@/services/visitasService";
import { computed } from "vue";

export function useDashboardGuardia() {
  const auth = useAuthStore();

  const dashboardQuery = useQuery({
    queryKey: ["dashboardGuardia", auth.condominioActualId],
    queryFn: async () => {
      const { data } = await dashboardService.guardia(auth.condominioActualId);
      return data;
    },
    enabled: !!auth.condominioActualId,
  });

  const encomiendasQuery = useQuery({
    queryKey: ["encomiendasPendientes", auth.condominioActualId],
    queryFn: async () => {
      const { data } = await encomiendasService.getEncomiendas(
        auth.condominioActualId,
        { estado: "PENDIENTE" },
      );
      return data || [];
    },
    enabled: !!auth.condominioActualId,
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
  });

  const conteoActivosQuery = useQuery({
    queryKey: ["conteoActivos", auth.condominioActualId],
    queryFn: async () => {
      const { data } = await visitasService.getConteoActivos(auth.condominioActualId);
      return data;
    },
    enabled: !!auth.condominioActualId,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
    retry: 3,
    retryDelay: 1_000,
  });

  const loading =
    dashboardQuery.isLoading ||
    encomiendasQuery.isLoading ||
    autorizacionesQuery.isLoading ||
    conteoActivosQuery.isLoading;

  const error =
    dashboardQuery.isError ||
    encomiendasQuery.isError ||
    autorizacionesQuery.isError ||
    conteoActivosQuery.isError
      ? "Error al cargar el dashboard"
      : null;

  const dashboard = computed(() => dashboardQuery.data ?? []);
  const encomiendas = computed(() => encomiendasQuery.data ?? []);
  const autorizaciones = computed(() => autorizacionesQuery.data ?? []);
  const accesosActivos = computed(() => conteoActivosQuery.data?.activosAhora ?? 0);

  function severityEstado(estado) {
    if (estado === "ACTIVO") return "success";
    if (estado === "FINALIZADO") return "info";
    if (estado === "RECHAZADO") return "danger";
    return "warn";
  }

  function cargarDashboard() {
    dashboardQuery.refetch();
    encomiendasQuery.refetch();
    autorizacionesQuery.refetch();
    conteoActivosQuery.refetch();
  }

  return {
    dashboard,
    encomiendas,
    autorizaciones,
    accesosActivos,
    loading,
    error,
    cargarDashboard,
    severityEstado,
  };
}

