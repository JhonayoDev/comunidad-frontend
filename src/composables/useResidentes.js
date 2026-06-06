import { ref } from "vue";
import { unidadesService } from "../services/unidadesService";
import api from "../services/api";

const CACHE_UNIDADES = "cache_unidades";
const CACHE_SECTORES = "cache_sectores";

export function useResidentes() {
  const unidades = ref([]);
  const sectores = ref([]);
  const vinculos = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function cargarUnidades() {
    loading.value = true;
    error.value = null;
    try {
      const [resUnidades, resSectores] = await Promise.all([
        unidadesService.getUnidades(),
        unidadesService.getSectores(),
      ]);
      unidades.value = resUnidades.data;
      sectores.value = resSectores.data;
      localStorage.setItem(CACHE_UNIDADES, JSON.stringify(resUnidades.data));
      localStorage.setItem(CACHE_SECTORES, JSON.stringify(resSectores.data));
    } catch {
      const cu = localStorage.getItem(CACHE_UNIDADES);
      const cs = localStorage.getItem(CACHE_SECTORES);
      if (cu) unidades.value = JSON.parse(cu);
      if (cs) sectores.value = JSON.parse(cs);
      if (cu || cs) {
        error.value = "Sin conexión — mostrando datos guardados";
      } else {
        error.value = "Sin conexión y no hay datos guardados";
      }
    } finally {
      loading.value = false;
    }
  }

  async function cargarVinculos(unidadId) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get(`/vinculos/unidad/${unidadId}`);
      vinculos.value = response.data;
    } catch {
      error.value = "Error al cargar los vínculos";
    } finally {
      loading.value = false;
    }
  }

  return {
    unidades,
    sectores,
    vinculos,
    loading,
    error,
    cargarUnidades,
    cargarVinculos,
  };
}
