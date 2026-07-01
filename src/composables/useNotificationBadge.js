import { ref, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { perfilService } from "@/services/perfilService";

const POLL_INTERVAL_MS = 30000;

export function useNotificationBadge() {
  const auth = useAuthStore();
  const notifCount = ref(0);
  let intervalId = null;

  async function actualizarBadge() {
    const cid = auth.condominioActualId;
    if (!cid) return;
    try {
      const { data } = await perfilService.getBadgeNotificaciones(cid);
      notifCount.value = data.noLeidas;
    } catch {
      // Silencioso: el badge no es crítico para el resto de la app
    }
  }

  onMounted(() => {
    actualizarBadge();
    intervalId = setInterval(actualizarBadge, POLL_INTERVAL_MS);
  });

  onUnmounted(() => {
    clearInterval(intervalId);
  });

  return { notifCount, actualizarBadge };
}
