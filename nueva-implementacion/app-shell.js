/**
 * app-shell.js
 *
 * Punto de integración del sistema push en la aplicación.
 *
 * ESTE ARCHIVO ES UN EJEMPLO DE INTEGRACIÓN — no es un archivo standalone.
 * Muestra cómo conectar PushManager y NotificationBanner con el ciclo
 * de vida de autenticación de la SPA.
 *
 * Adaptar según el framework/store que use el proyecto frontend
 * (vanilla JS, Vue, React, etc.). Los conceptos son los mismos.
 *
 * Flujo completo:
 *
 *   LOGIN EXITOSO
 *       │
 *       ▼
 *   PushManager.inicializar()
 *       ├── permiso 'granted'  → suscribir push → detener polling
 *       ├── permiso 'denied'   → polling lento (5 min)
 *       └── permiso 'default'  → polling moderado (2 min) → montar banner
 *
 *   USUARIO TOCA BANNER "Activar"
 *       │
 *       ▼
 *   PushManager.solicitarPermiso()
 *       ├── 'granted' → suscribir → detener polling → ocultar banner
 *       └── 'denied'  → ocultar banner → polling lento
 *
 *   LOGOUT
 *       │
 *       ▼
 *   PushManager.destruir() → dar de baja en backend + navigator
 *   NotificationBanner.desmontar()
 *
 *   TOQUE EN NOTIFICACIÓN NATIVA
 *       │
 *       ▼
 *   Evento 'comunidad:navegar' → router.push(url)
 */

'use strict';

import { PushManager }          from './push-manager.js';
import { NotificationBanner }  from './notification-banner.js';

// ─── Estado de la app (adaptar al store real) ─────────────────────────────────

let _accessToken  = null;
let _condominioId = null;
let _badgeCount   = 0;

// ─── Hook de login ────────────────────────────────────────────────────────────

/**
 * Llamar inmediatamente después de recibir la respuesta exitosa del login.
 *
 * @param {object} loginResponse  Cuerpo JSON de POST /api/v1/auth/login:
 *                                { accessToken, personaId, nombre, email,
 *                                  condominioId, condominioNombre, roles }
 */
export async function onLoginExitoso(loginResponse) {
  _accessToken  = loginResponse.accessToken;
  _condominioId = loginResponse.condominioId;

  // 1. Inicializar el sistema push con el callback de actualización del badge
  await PushManager.inicializar(
    _accessToken,
    _condominioId,
    (count) => actualizarBadge(count)  // ← Conectar al store/UI real
  );

  // 2. Montar el banner SOLO si el permiso nunca fue solicitado.
  //    El banner internamente verifica PushManager.estadoPermiso === 'default'.
  NotificationBanner.montar({
    accessToken:  _accessToken,
    onActivado:   () => {
      console.info('[App] Push activado por el usuario desde el banner.');
      // Opcionalmente mostrar un toast de confirmación.
    },
    onDescartado: () => {
      console.info('[App] Usuario descartó el banner de notificaciones.');
      // No hacer nada — el polling ya está activo como fallback.
    },
  });

  // 3. Escuchar el evento de navegación que emite el SW al tocar una notificación
  window.addEventListener('comunidad:navegar', onNavegacionDesdeSW);
}

// ─── Hook de logout ───────────────────────────────────────────────────────────

/**
 * Llamar al cerrar sesión (antes de limpiar el token del store).
 */
export async function onLogout() {
  window.removeEventListener('comunidad:navegar', onNavegacionDesdeSW);

  await PushManager.destruir(_accessToken);
  NotificationBanner.desmontar();

  _accessToken  = null;
  _condominioId = null;
  _badgeCount   = 0;
  actualizarBadge(0);
}

// ─── Hook del botón "Activar notificaciones" en Configuración ────────────────

/**
 * Para el caso donde el usuario denegó el permiso y luego quiere
 * reactivar desde la página de configuración de su cuenta.
 *
 * IMPORTANTE: Los navegadores no permiten que JavaScript re-solicite
 * el permiso si el usuario lo denegó explícitamente. Debemos redirigirlo
 * a la configuración del navegador.
 *
 * Este botón solo aparece en la UI cuando estadoPermiso === 'denied'.
 */
export function onBotonConfigurarNotificaciones() {
  const estado = PushManager.estadoPermiso;

  if (estado === 'denied') {
    // No podemos solicitar el permiso programáticamente.
    // Mostrar instrucciones al usuario.
    mostrarInstruccionesReactivar();
  } else if (estado === 'default') {
    // Nunca se preguntó — solicitar ahora (requiere gesto de usuario, así que está OK)
    PushManager.solicitarPermiso(_accessToken);
  }
}

// ─── Navegación desde SW ──────────────────────────────────────────────────────

function onNavegacionDesdeSW(event) {
  const { url, notificacionId } = event.detail;

  // Adaptar según el router del proyecto:
  // Vue Router:   router.push(url)
  // React Router: navigate(url)
  // Vanilla:      window.location.href = url
  console.info('[App] Navegando a', url, 'por clic en notificación push.');

  // Marcar la notificación como leída si se tiene el ID
  if (notificacionId) {
    marcarNotificacionLeida(notificacionId);
  }
}

// ─── Helpers de UI ───────────────────────────────────────────────────────────

function actualizarBadge(count) {
  _badgeCount = count;

  // Adaptar al mecanismo de UI real (store reactivo, DOM directo, etc.)
  // Ejemplo vanilla:
  const badgeEl = document.querySelector('[data-badge="notificaciones"]');
  if (badgeEl) {
    badgeEl.textContent = count > 0 ? String(count > 99 ? '99+' : count) : '';
    badgeEl.hidden      = count === 0;
  }

  // Ejemplo con Navigator Badge API (Android/desktop Chrome)
  if ('setAppBadge' in navigator && count >= 0) {
    if (count > 0) {
      navigator.setAppBadge(count).catch(() => {});
    } else {
      navigator.clearAppBadge().catch(() => {});
    }
  }
}

async function marcarNotificacionLeida(notificacionId) {
  if (!_accessToken || !_condominioId) return;

  try {
    await fetch(
      `/api/v1/condominios/${_condominioId}/notificaciones/${notificacionId}/leida`,
      {
        method:  'PATCH',
        headers: { 'Authorization': `Bearer ${_accessToken}` },
      }
    );
    // Decrementar el badge local
    actualizarBadge(Math.max(0, _badgeCount - 1));
  } catch {
    // No crítico — la notificación quedará como no leída, el usuario puede marcarla manualmente.
  }
}

function mostrarInstruccionesReactivar() {
  // Adaptar al sistema de modales/toasts del proyecto.
  // Mensaje sugerido:
  const mensaje = [
    'Las notificaciones están bloqueadas en tu navegador.',
    '',
    'Para reactivarlas:',
    '1. Haz clic en el candado (🔒) en la barra de dirección.',
    '2. Busca "Notificaciones" y cámbialo a "Permitir".',
    '3. Recarga la página.',
  ].join('\n');

  alert(mensaje); // Reemplazar con modal propio
}
