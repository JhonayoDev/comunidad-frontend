import { ref, computed } from "vue";
import { notificacionesService } from "../services/notificacionesService";

const CACHE_KEY = "cache_notificaciones";

export function useNotificaciones() {
  const notificaciones = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const hayNoLeidas = computed(() =>
    notificaciones.value.some((n) => !n.leida),
  );

  async function cargar() {
    loading.value = true;
    error.value = null;
    try {
      const response = await notificacionesService.getTodasLasNotificaciones();
      notificaciones.value = response.data;
      localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
    } catch {
      const cache = localStorage.getItem(CACHE_KEY);
      if (cache) {
        notificaciones.value = JSON.parse(cache);
        error.value = "Sin conexión — mostrando datos guardados";
      } else {
        error.value = "Sin conexión y no hay datos guardados";
      }
    } finally {
      loading.value = false;
    }
  }

  async function marcarLeida(notif) {
    if (notif.leida) return;
    try {
      await notificacionesService.marcarLeida(notif.notificacionId);
      notif.leida = true;
      notif.fechaLectura = new Date().toISOString();
      // Actualiza caché
      localStorage.setItem(CACHE_KEY, JSON.stringify(notificaciones.value));
    } catch {
      // error silencioso
    }
  }

  async function marcarTodas() {
    try {
      await notificacionesService.marcarTodasLeidas();
      notificaciones.value.forEach((n) => (n.leida = true));
      localStorage.setItem(CACHE_KEY, JSON.stringify(notificaciones.value));
    } catch {
      // error silencioso
    }
  }

  return {
    notificaciones,
    loading,
    error,
    hayNoLeidas,
    cargar,
    marcarLeida,
    marcarTodas,
  };
}
