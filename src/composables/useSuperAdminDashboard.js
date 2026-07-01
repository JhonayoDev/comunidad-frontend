import { ref, computed, onMounted } from "vue";
import { condominiosService } from "@/services/condominiosService";

export function useSuperAdminDashboard() {
  const condominios = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const busqueda = ref("");

  async function cargar() {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await condominiosService.getCondominios();
      condominios.value = data;
    } catch {
      error.value = "No se pudo cargar la lista de condominios";
    } finally {
      loading.value = false;
    }
  }

  const totalCondominios = computed(() => condominios.value.length);

  const condominiosFiltrados = computed(() => {
    const termino = busqueda.value.trim().toLowerCase();
    if (!termino) return condominios.value;
    return condominios.value.filter((c) =>
      c.nombre.toLowerCase().includes(termino),
    );
  });

  onMounted(cargar);

  return {
    condominios,
    condominiosFiltrados,
    totalCondominios,
    busqueda,
    loading,
    error,
    cargar,
  };
}
