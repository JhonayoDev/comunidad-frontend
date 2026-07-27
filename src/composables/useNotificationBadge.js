/**
 * useNotificationBadge.js
 *
 * Composable de badge de notificaciones con polling adaptativo.
 *
 * El polling es gestionado por PushManager según el estado del permiso:
 * - 'granted':       Sin polling. Badge actualizado vía Push Event o visibilitychange.
 * - 'default':       Polling cada 2 min (moderado).
 * - 'denied':        Polling cada 5 min (lento).
 * - 'no-soportado':  Polling cada 2 min (moderado).
 *
 * Uso:
 *
 *   const { notifCount } = useNotificationBadge();
 *
 * La inicialización del PushManager se maneja automáticamente desde authStore
 * (login / tryRestoreSession / seleccionarCondominio).
 */

import { usePushNotifications } from "./usePushNotifications";

export function useNotificationBadge() {
  const { badgeCount } = usePushNotifications();

  return { notifCount: badgeCount };
}
