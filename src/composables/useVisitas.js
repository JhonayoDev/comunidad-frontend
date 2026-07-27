import { ref } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { visitasService } from "../services/visitasService";

const CACHE_KEY = "cache_visitas";

export function useVisitas() {
  const auth = useAuthStore();
  const visitas = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function cargar(filtros = {}) {
    const cid = auth.condominioActualId;
    if (!cid) return;
    loading.value = true;
    error.value = null;
    try {
      const { patente, nombre, ...params } = filtros;
      const response = await visitasService.getVisitas(cid, params);
      let data = response.data;
      if (patente) {
        data = data.filter(v =>
          v.patenteVisitante?.toUpperCase().includes(patente.toUpperCase())
        );
      }
      if (nombre) {
        data = data.filter(v =>
          v.nombreVisitante?.toLowerCase().includes(nombre.toLowerCase())
        );
      }
      visitas.value = data;
      if (Object.keys(params).length === 0 && !patente && !nombre) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
      }
    } catch (e) {
      console.error("Error al cargar visitas:", e);
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
    const cid = auth.condominioActualId;
    if (!cid) return "Error: selecciona un condominio";
    try {
      await visitasService.registrarSalida(cid, visita.id);
      visita.estado = "FINALIZADO";
      visita.fechaSalida = new Date().toISOString();
      return true;
    } catch (e) {
      console.error("Error al registrar salida:", e);
      return e.response?.data?.message || "Error al registrar salida";
    }
  }

  return { visitas, loading, error, cargar, registrarSalida };
}
