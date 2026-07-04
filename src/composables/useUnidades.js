import { ref, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { unidadesService } from "@/services/unidadesService";

export function useUnidades() {
  const auth = useAuthStore();
  const unidades = ref([]);
  let cargadas = false;

  async function cargarUnidades() {
    const cid = auth.condominioActualId;
    if (!cid || cargadas) return;
    try {
      const { data } = await unidadesService.getUnidades(cid);
      unidades.value = data;
      cargadas = true;
    } catch (e) {
      console.error("Error al cargar unidades", e);
    }
  }

  return { unidades, cargarUnidades };
}
