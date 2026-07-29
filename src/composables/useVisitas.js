import { ref } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { visitasService } from "../services/visitasService";

let peticionId = 0;

export function useVisitas() {
  const auth = useAuthStore();
  const visitas = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const pagina = ref(0);
  const tamano = ref(20);
  const totalElementos = ref(0);

  async function cargar(filtros = {}) {
    const cid = auth.condominioActualId;
    if (!cid) return;
    const id = ++peticionId;
    loading.value = true;
    error.value = null;
    try {
      const params = { page: pagina.value, size: tamano.value, ...filtros };
      Object.keys(params).forEach((k) => { if (params[k] == null || params[k] === "") delete params[k]; });
      const response = await visitasService.getVisitas(cid, params);
      if (id !== peticionId) return;
      const data = Array.isArray(response.data) ? response.data : response.data?.content || [];
      totalElementos.value = response.data?.totalElements ?? data.length;
      visitas.value = data;
    } catch (e) {
      if (id !== peticionId) return;
      console.error("Error al cargar visitas:", e);
      error.value = "Error al cargar visitas";
    } finally {
      if (id === peticionId) loading.value = false;
    }
  }

  async function registrarSalida(visita, observacion) {
    const cid = auth.condominioActualId;
    if (!cid) return "Error: selecciona un condominio";
    try {
      const body = observacion ? { observacion } : undefined;
      await visitasService.registrarSalida(cid, visita.id, body);
      visita.estado = "FINALIZADO";
      visita.fechaSalida = new Date().toISOString();
      return true;
    } catch (e) {
      console.error("Error al registrar salida:", e);
      return e.response?.data?.message || "Error al registrar salida";
    }
  }

  function alCambiarPagina(event) {
    pagina.value = event.page;
    tamano.value = event.rows;
    cargar({ estado: "ACTIVO" });
  }

  return { visitas, loading, error, pagina, tamano, totalElementos, cargar, registrarSalida, alCambiarPagina };
}