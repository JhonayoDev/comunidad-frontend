import { ref } from "vue";
import { perfilService } from "../services/perfilService";

const CACHE_VINCULOS = "cache_vinculos";
const CACHE_VEHICULOS = "cache_vehiculos";

export function useResidente() {
  const vinculos = ref([]);
  const vehiculos = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Datos futuros — placeholders hasta que el backend los implemente
  const gastoComun = ref({
    periodo: "Mayo 2026",
    deudaActual: 0,
    fechaVencimiento: null,
    disponible: false, // false = placeholder
  });

  const encomiendas = ref({
    pendientes: 0,
    disponible: false,
  });

  const reservas = ref({
    activas: 0,
    disponible: false,
  });

  async function cargar() {
    loading.value = true;
    error.value = null;
    try {
      const [resVinculos, resVehiculos] = await Promise.all([
        perfilService.getMisVinculos(),
        perfilService.getMisVehiculos(),
      ]);
      vinculos.value = resVinculos.data;
      vehiculos.value = resVehiculos.data;
      localStorage.setItem(CACHE_VINCULOS, JSON.stringify(resVinculos.data));
      localStorage.setItem(CACHE_VEHICULOS, JSON.stringify(resVehiculos.data));
    } catch {
      const cv = localStorage.getItem(CACHE_VINCULOS);
      const ch = localStorage.getItem(CACHE_VEHICULOS);
      if (cv) vinculos.value = JSON.parse(cv);
      if (ch) vehiculos.value = JSON.parse(ch);
      if (cv || ch) {
        error.value = "Sin conexión — mostrando datos guardados";
      } else {
        error.value = "Sin conexión y no hay datos guardados";
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    vinculos,
    vehiculos,
    gastoComun,
    encomiendas,
    reservas,
    loading,
    error,
    cargar,
  };
}
