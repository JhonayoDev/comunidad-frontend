import { ref } from "vue";
import { encomiendасService } from "../services/encomiendасService";

const CACHE_KEY = "cache_encomiendas";

export function useEncomiendas() {
  const encomiendas = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function cargar(filtros = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await encomiendасService.getEncomiendas(filtros);
      encomiendas.value = response.data;
      if (Object.keys(filtros).length === 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
      }
    } catch {
      const cache = localStorage.getItem(CACHE_KEY);
      if (cache) {
        encomiendas.value = JSON.parse(cache);
        error.value = "Sin conexión — mostrando datos guardados";
      } else {
        error.value = "Sin conexión y no hay datos guardados";
      }
    } finally {
      loading.value = false;
    }
  }

  async function entregar(encomienda) {
    try {
      await encomiendасService.entregar(encomienda.id);
      encomienda.estado = "ENTREGADA";
      encomienda.fechaEntrega = new Date().toISOString();
      return true;
    } catch (e) {
      return e.response?.data?.message || "Error al registrar entrega";
    }
  }

  return { encomiendas, loading, error, cargar, entregar };
}
