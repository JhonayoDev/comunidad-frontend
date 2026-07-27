import { ref, computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { condominiosService } from "@/services/condominiosService";

export function useSuperAdminDashboard() {
  const busqueda = ref("");

  const {
    data: condominios,
    isLoading: loading,
    error: queryError,
    refetch: cargar,
  } = useQuery({
    queryKey: ["superAdminCondominios"],
    queryFn: async () => {
      const { data } = await condominiosService.getCondominios();
      return data;
    },
  });

  const totalCondominios = computed(() => (condominios.value || []).length);

  const condominiosFiltrados = computed(() => {
    const termino = busqueda.value.trim().toLowerCase();
    if (!termino) return condominios.value || [];
    return (condominios.value || []).filter((c) =>
      c.nombre.toLowerCase().includes(termino),
    );
  });

  const error = computed(() => {
    if (queryError.value) return "No se pudo cargar la lista de condominios";
    return null;
  });

  return {
    condominiosFiltrados,
    totalCondominios,
    busqueda,
    loading,
    error,
    cargar,
  };
}