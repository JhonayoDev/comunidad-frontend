import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { perfilService } from "@/services/perfilService";

export function useNotificationBadge() {
  const auth = useAuthStore();

  const { data: notifCount, refetch: actualizarBadge } = useQuery({
    queryKey: ["notificacionesBadge", auth.condominioActualId],
    queryFn: async () => {
      const cid = auth.condominioActualId;
      if (!cid) return 0;
      const { data } = await perfilService.getBadgeNotificaciones(cid);
      return data.noLeidas;
    },
    refetchInterval: 30_000,
    enabled: !!auth.condominioActualId,
  });

  return { notifCount, actualizarBadge };
}