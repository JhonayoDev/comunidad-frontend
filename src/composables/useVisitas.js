import { ref } from "vue";
import { visitasService } from "../services/visitasService";

const CACHE_KEY = "cache_visitas";

export function useVisitas() {
  const visitas = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function cargar(filtros = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await visitasService.getVisitas(filtros);
      visitas.value = response.data;
      // Guarda en caché solo sin filtros
      if (Object.keys(filtros).length === 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
      }
    } catch (e) {
      // Si falla la red, intenta el caché
      const cache = localStorage.getItem(CACHE_KEY);
      if (cache) {
        visitas.value = JSON.parse(cache);
        error.value = "Sin conexión — mostrando datos guardados";
      } else {
        error.value = "Sin conexión y no hay datos guardados";
      }
    } finally {
      loading.value = false;
    }
  }

  async function registrarSalida(visita) {
    try {
      await visitasService.registrarSalida(visita.id);
      visita.horaSalida = new Date().toISOString();
      return true;
    } catch (e) {
      return e.response?.data?.message || "Error al registrar salida";
    }
  }

  return { visitas, loading, error, cargar, registrarSalida };
}
