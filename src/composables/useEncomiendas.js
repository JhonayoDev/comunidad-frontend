import { ref } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { encomiendasService } from "../services/encomiendasService";

const CACHE_KEY = "cache_encomiendas";

export function useEncomiendas() {
  const auth = useAuthStore();
  const encomiendas = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function cargar(filtros = {}) {
    const cid = auth.condominioActualId;
    if (!cid) return;
    loading.value = true;
    error.value = null;
    try {
      const response = await encomiendasService.getEncomiendas(cid, filtros);
      encomiendas.value = response.data;
      if (Object.keys(filtros).length === 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
      }
    } catch (e) {
      console.error("Error al cargar encomiendas:", e);
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

  async function entregar(encomienda, nombreRetira, rutRetira) {
    const cid = auth.condominioActualId;
    if (!cid) return "Error: selecciona un condominio";
    try {
      await encomiendasService.entregar(cid, encomienda.id, {
        nombreRetira,
        rutRetira,
      });
      encomienda.estado = "ENTREGADA";
      return true;
    } catch (e) {
      console.error("Error al entregar encomienda:", e);
      return e.response?.data?.message || "Error al registrar entrega";
    }
  }

  return { encomiendas, loading, error, cargar, entregar };
}
