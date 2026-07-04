import { ref, computed } from "vue";
import { notificacionesService } from "../services/notificacionesService";
import { useAuthStore } from "../stores/authStore";

export function useNotificaciones() {
  const auth = useAuthStore();
  const condominioId = auth.condominioActualId;

  const notificaciones = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const hayNoLeidas = computed(() =>
    notificaciones.value.some((n) => !n.leida),
  );

  async function cargar() {
    if (!condominioId) return;
    loading.value = true;
    error.value = null;
    try {
      const response = await notificacionesService.getTodas(condominioId);
      notificaciones.value = response.data;
    } catch (e) {
      console.error("Error al cargar notificaciones", e);
      error.value = "Error al cargar notificaciones";
    } finally {
      loading.value = false;
    }
  }

  async function marcarLeida(notif) {
    if (notif.leida || !condominioId) return;
    try {
      await notificacionesService.marcarLeida(condominioId, notif.id);
      notif.leida = true;
      notif.fechaLectura = new Date().toISOString();
    } catch (e) {
      console.error("Error al marcar notificación como leída", e);
    }
  }

  async function marcarTodas() {
    if (!condominioId) return;
    try {
      await notificacionesService.marcarTodasLeidas(condominioId);
      notificaciones.value.forEach((n) => (n.leida = true));
    } catch (e) {
      console.error("Error al marcar todas como leídas", e);
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
