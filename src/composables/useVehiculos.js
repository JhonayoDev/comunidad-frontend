import { ref } from "vue";
import { visitasService } from "../services/visitasService";
import api from "../services/api";

const CACHE_KEY = "cache_vehiculos";

export function useVehiculos() {
  const vehiculos = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function cargar(filtros = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get("/vehiculos", { params: filtros });
      vehiculos.value = response.data;
      if (Object.keys(filtros).length === 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
      }
    } catch {
      const cache = localStorage.getItem(CACHE_KEY);
      if (cache) {
        vehiculos.value = JSON.parse(cache);
        error.value = "Sin conexión — mostrando datos guardados";
      } else {
        error.value = "Sin conexión y no hay datos guardados";
      }
    } finally {
      loading.value = false;
    }
  }

  async function consultaRapida(patente) {
    try {
      const response = await visitasService.consultaRapida(patente);
      return response.data;
    } catch (e) {
      if (e.response?.status === 404) return null;
      throw e;
    }
  }

  return { vehiculos, loading, error, cargar, consultaRapida };
}
