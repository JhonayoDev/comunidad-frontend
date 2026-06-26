import { ref } from "vue";

export function useDashboardAdmin() {
  const dashboard = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Ya no se usa directamente — ahora AdminDashboardView
  // llama al endpoint directamente con api.get()
  // Se mantiene para compatibilidad

  return { dashboard, loading, error };
}
const CACHE_KEY = "cache_dashboard_admin";

export function useDashboardAdmin() {
  const datos = ref({
    visitasActivas: 0,
    solicitudesPendientes: 0,
    totalUnidades: 0,
    // Placeholders — endpoints futuros
    encomiendasPendientes: 0,
    reclamosAbiertos: 0,
    deudaTotal: 0,
  });
  const loading = ref(false);
  const error = ref(null);

  async function cargar() {
    loading.value = true;
    error.value = null;
    try {
      const [resVisitas, resUnidades] = await Promise.all([
        visitasService.getVisitas({ activa: true }),
        unidadesService.getUnidades(),
      ]);

      datos.value.visitasActivas = resVisitas.data.length;
      datos.value.totalUnidades = resUnidades.data.filter(
        (u) => u.tipo === "CASA",
      ).length;

      localStorage.setItem(CACHE_KEY, JSON.stringify(datos.value));
    } catch {
      const cache = localStorage.getItem(CACHE_KEY);
      if (cache) {
        datos.value = JSON.parse(cache);
        error.value = "Sin conexión — mostrando datos guardados";
      } else {
        error.value = "Sin conexión y no hay datos guardados";
      }
    } finally {
      loading.value = false;
    }
  }

  return { datos, loading, error, cargar };
}
