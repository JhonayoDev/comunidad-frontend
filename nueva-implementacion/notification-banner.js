/**
 * notification-banner.js
 *
 * Componente UI para solicitar el permiso de notificaciones al usuario.
 *
 * Diseño:
 * - Se muestra solo cuando el permiso está en estado 'default'
 *   (nunca se ha preguntado).
 * - NO se muestra si el permiso fue denegado — el usuario tomó
 *   una decisión explícita. Solo mostrar en Configuración de cuenta.
 * - No se vuelve a mostrar si el usuario lo descartó en esta sesión
 *   (se guarda en sessionStorage para no persitir entre sesiones).
 * - Se destruye completamente del DOM una vez que el usuario decide.
 *
 * Integración (llamar después de PushManager.inicializar()):
 *
 *   import { NotificationBanner } from './notification-banner.js';
 *
 *   // El banner se auto-muestra si el permiso es 'default'
 *   NotificationBanner.montar({
 *     accessToken,
 *     onActivado: () => console.log('Push activado'),
 *     onDescartado: () => console.log('Usuario descartó el banner'),
 *   });
 *
 * El componente inserta su propio HTML/CSS — no requiere dependencias
 * de framework. Compatible con cualquier setup frontend.
 */

'use strict';

import { PushManager } from './push-manager.js';

const STORAGE_KEY_DESCARTADO = 'comunidad:push-banner-descartado';
const BANNER_ID              = 'comunidad-push-banner';

export const NotificationBanner = {

  /**
   * Monta el banner si las condiciones son correctas.
   *
   * @param {object}   opciones
   * @param {string}   opciones.accessToken   JWT activo del usuario.
   * @param {Function} [opciones.onActivado]  Callback cuando el usuario acepta.
   * @param {Function} [opciones.onDescartado] Callback cuando el usuario descarta.
   */
  montar({ accessToken, onActivado, onDescartado } = {}) {
    // Condiciones para NO mostrar el banner:
    if (PushManager.estadoPermiso !== 'default')          return; // Ya decidió
    if (PushManager.estadoPermiso === 'no-soportado')     return; // Navegador sin soporte
    if (sessionStorage.getItem(STORAGE_KEY_DESCARTADO))   return; // Descartó en esta sesión
    if (document.getElementById(BANNER_ID))               return; // Ya está montado

    inyectarEstilos();
    const banner = crearElementoBanner();
    document.body.appendChild(banner);

    // Animar entrada tras el primer frame para activar la transición CSS
    requestAnimationFrame(() => {
      requestAnimationFrame(() => banner.classList.add('comunidad-banner--visible'));
    });

    // ── Acción: Activar notificaciones ────────────────────────────────────────
    banner.querySelector('[data-accion="activar"]')
      .addEventListener('click', async () => {
        const permiso = await PushManager.solicitarPermiso(accessToken);
        desmontar(banner);

        if (permiso === 'granted') {
          onActivado?.();
        } else if (permiso === 'denied') {
          // El usuario denegó desde el diálogo del navegador.
          // No mostramos mensaje de error — es una elección válida.
          onDescartado?.();
        }
      });

    // ── Acción: Descartar (en esta sesión) ───────────────────────────────────
    banner.querySelector('[data-accion="descartar"]')
      .addEventListener('click', () => {
        sessionStorage.setItem(STORAGE_KEY_DESCARTADO, '1');
        desmontar(banner);
        onDescartado?.();
      });
  },

  /**
   * Elimina el banner del DOM si está presente.
   * Útil para limpiarlo al cerrar sesión.
   */
  desmontar() {
    const banner = document.getElementById(BANNER_ID);
    if (banner) desmontar(banner);
  },
};

// ─── DOM ──────────────────────────────────────────────────────────────────────

function crearElementoBanner() {
  const div = document.createElement('div');
  div.id        = BANNER_ID;
  div.className = 'comunidad-banner';
  div.setAttribute('role', 'alert');
  div.setAttribute('aria-live', 'polite');

  div.innerHTML = `
    <div class="comunidad-banner__icono" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
           xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
              fill="currentColor"/>
      </svg>
    </div>
    <div class="comunidad-banner__texto">
      <strong>Activa las notificaciones</strong>
      <span>Recibe alertas de visitas, encomiendas y avisos al instante.</span>
    </div>
    <div class="comunidad-banner__acciones">
      <button class="comunidad-banner__btn comunidad-banner__btn--activar"
              data-accion="activar"
              type="button">
        Activar
      </button>
      <button class="comunidad-banner__btn comunidad-banner__btn--descartar"
              data-accion="descartar"
              type="button"
              aria-label="Descartar banner de notificaciones">
        Ahora no
      </button>
    </div>
  `;

  return div;
}

function desmontar(banner) {
  banner.classList.remove('comunidad-banner--visible');
  // Esperar la transición antes de eliminar del DOM
  banner.addEventListener('transitionend', () => banner.remove(), { once: true });
  // Fallback por si la transición no se dispara (display:none, etc.)
  setTimeout(() => banner.remove(), 400);
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

function inyectarEstilos() {
  if (document.getElementById('comunidad-banner-styles')) return;

  const style = document.createElement('style');
  style.id = 'comunidad-banner-styles';
  style.textContent = `
    .comunidad-banner {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%) translateY(120%);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      background: #1e293b;
      color: #f8fafc;
      border-radius: 0.75rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      max-width: min(480px, calc(100vw - 2rem));
      width: 100%;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: inherit;
      font-size: 0.875rem;
    }

    .comunidad-banner--visible {
      transform: translateX(-50%) translateY(0);
    }

    .comunidad-banner__icono {
      flex-shrink: 0;
      color: #60a5fa;
    }

    .comunidad-banner__texto {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
    }

    .comunidad-banner__texto strong {
      font-weight: 600;
      line-height: 1.3;
    }

    .comunidad-banner__texto span {
      color: #94a3b8;
      font-size: 0.8125rem;
      line-height: 1.4;
    }

    .comunidad-banner__acciones {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      flex-shrink: 0;
    }

    .comunidad-banner__btn {
      border: none;
      border-radius: 0.5rem;
      padding: 0.4rem 0.875rem;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.15s ease;
      font-family: inherit;
    }

    .comunidad-banner__btn:hover { opacity: 0.85; }
    .comunidad-banner__btn:focus-visible {
      outline: 2px solid #60a5fa;
      outline-offset: 2px;
    }

    .comunidad-banner__btn--activar {
      background: #3b82f6;
      color: #ffffff;
    }

    .comunidad-banner__btn--descartar {
      background: transparent;
      color: #94a3b8;
    }

    @media (max-width: 480px) {
      .comunidad-banner {
        flex-direction: column;
        align-items: flex-start;
        bottom: 0;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        left: 0;
        transform: translateY(110%);
        max-width: 100%;
      }

      .comunidad-banner--visible {
        transform: translateY(0);
      }

      .comunidad-banner__acciones {
        flex-direction: row;
        width: 100%;
        justify-content: flex-end;
      }
    }
  `;

  document.head.appendChild(style);
}
