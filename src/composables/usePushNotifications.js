/**
 * usePushNotifications.js
 *
 * Composable Vue 3 que envuelve PushManager para exponer estado reactivo.
 *
 * Estado compartido a nivel de módulo (singleton reactivo):
 * - badgeCount, estaActivo, estadoPermiso, error
 *
 * Uso en componentes:
 *
 *   const { badgeCount, estaActivo, estadoPermiso, solicitarPermiso } = usePushNotifications();
 *
 * Uso en stores o setup:
 *
 *   const push = usePushNotifications();
 *   push.inicializar(condominioId);
 */

import { ref } from "vue";
import { PushManager } from "@/services/pushManager";

// ─── Estado reactivo compartido (nivel módulo) ─────────────────────────────────
// Todas las instancias del composable comparten el mismo estado.

/** @type {import("vue").Ref<number>} */
const badgeCount = ref(0);

/** @type {import("vue").Ref<boolean>} */
const estaActivo = ref(PushManager.estaActivo);

/** @type {import("vue").Ref<string>} */
const estadoPermiso = ref(PushManager.estadoPermiso);

/** @type {import("vue").Ref<string|null>} */
const error = ref(null);

// ─── Composable ───────────────────────────────────────────────────────────────

export function usePushNotifications() {
  /**
   * Inicializa PushManager tras un login exitoso.
   * El accessToken se toma automáticamente del tokenStore.
   *
   * @param {string} condominioId UUID del condominio activo.
   */
  async function inicializar(condominioId) {
    if (!condominioId) {
      console.warn("[usePushNotifications] condominioId no proporcionado.");
      return;
    }

    try {
      await PushManager.inicializar(condominioId, (count) => {
        badgeCount.value = count;
      });
      estaActivo.value = PushManager.estaActivo;
      estadoPermiso.value = PushManager.estadoPermiso;
      error.value = null;
      console.info("[usePushNotifications] PushManager inicializado.");
    } catch (e) {
      error.value = e.message || "Error al inicializar notificaciones push";
      console.error("[usePushNotifications]", e);
    }
  }

  /**
   * Solicita permiso de notificaciones al usuario.
   * Debe llamarse desde un gesto de usuario (clic en botón).
   * Actualiza el estado reactivo automáticamente.
   */
  async function solicitarPermiso() {
    try {
      const permiso = await PushManager.solicitarPermiso();
      estaActivo.value = PushManager.estaActivo;
      estadoPermiso.value = PushManager.estadoPermiso;
      error.value = null;
      return permiso;
    } catch (e) {
      error.value = e.message || "Error al solicitar permiso";
      console.error("[usePushNotifications]", e);
      return "default";
    }
  }

  /**
   * Desuscribe el push sin destruir el estado completo.
   * Útil para toggle OFF desde Configuración.
   */
  async function desuscribir() {
    try {
      await PushManager.desuscribir();
      estaActivo.value = PushManager.estaActivo;
      estadoPermiso.value = PushManager.estadoPermiso;
    } catch (e) {
      console.error("[usePushNotifications] Error al desuscribir:", e);
    }
  }

  /**
   * Destruye la suscripción push y limpia el estado.
   * Llamar al cerrar sesión.
   */
  async function destruir() {
    try {
      await PushManager.destruir();
      badgeCount.value = 0;
      estaActivo.value = false;
      estadoPermiso.value = PushManager.estadoPermiso;
      error.value = null;
      console.info("[usePushNotifications] PushManager destruido.");
    } catch (e) {
      console.error("[usePushNotifications] Error al destruir:", e);
    }
  }

  /**
   * Fuerza una consulta del badge al backend.
   */
  async function refrescarBadge() {
    await PushManager.refrescarBadge();
  }

  return {
    badgeCount,
    estaActivo,
    estadoPermiso,
    error,
    inicializar,
    solicitarPermiso,
    desuscribir,
    destruir,
    refrescarBadge,
  };
}
