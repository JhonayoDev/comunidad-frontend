import { useNotificaciones } from "./useNotificaciones";

export function useNotificationBadge() {
  const { noLeidasCount, syncNotificaciones, syncLoading, refreshSync } = useNotificaciones();

  return { notifCount: noLeidasCount, syncNotificaciones, syncLoading, refreshSync };
}
