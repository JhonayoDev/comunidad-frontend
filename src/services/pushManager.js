/**
 * pushManager.js
 *
 * Módulo singleton responsable de toda la lógica push del lado del cliente:
 *
 * 1. Registro del Service Worker.
 * 2. Detección del estado de permiso (granted / denied / default).
 * 3. Suscripción push con la clave VAPID del backend.
 * 4. Envío de la suscripción al backend.
 * 5. Gestión del fallback de polling adaptativo según el estado de permiso.
 * 6. Escritura del access token en IndexedDB para uso del SW.
 *
 * Uso (después del login exitoso en authStore):
 *
 *   import { PushManager } from '@/services/pushManager';
 *   await PushManager.inicializar(accessToken, condominioId, onBadgeUpdate);
 *
 * Al cerrar sesión:
 *
 *   await PushManager.destruir();
 */

import { accessToken as tokenRef } from "@/utils/tokenStore";
import { guardarTokenEnIDB, limpiarTokenEnIDB } from "@/utils/idbTokenStore";
import { esErrorModuloNoContratado } from "@/utils/errores";

// ─── Configuración ────────────────────────────────────────────────────────────

const CONFIG = {
  SW_PATH: "/service-worker.js",
  SW_SCOPE: "/",
  API_BASE: import.meta.env.VITE_API_URL || "/api/v1",
  // Intervalos de polling de fallback (ms)
  POLLING_LENTO_MS: 5 * 60 * 1000, // 5 min — cuando el permiso está denegado
  POLLING_MODERADO_MS: 2 * 60 * 1000, // 2 min — cuando nunca se ha pedido permiso
};

// ─── Estado interno (privado al módulo) ───────────────────────────────────────

/** @type {ServiceWorkerRegistration | null} */
let _registration = null;

/** @type {number | null} ID del setInterval de fallback */
let _pollingIntervalId = null;

/** @type {string | null} Condominio activo para construir URL del badge */
let _condominioId = null;

/** @type {Function | null} Callback para actualizar el badge en la UI */
let _onBadgeUpdate = null;

/** @type {EventListenerOrEventListenerObject | null} Handler visibilitychange */
let _onVisibilityChange = null;

/** @type {boolean} Módulo COMUNICACION no contratado → detener polling de badge */
let _moduloNoContratado = false;

// ─── API pública ──────────────────────────────────────────────────────────────

export const PushManager = {
  /**
   * Punto de entrada principal. Llamar inmediatamente después del login.
   *
   * @param {string} condominioId UUID del condominio activo.
   * @param {Function} [onBadgeUpdate] Callback(count: number) para actualizar el badge en la UI.
   */
  async inicializar(condominioId, onBadgeUpdate) {
    _condominioId = condominioId;
    _onBadgeUpdate = onBadgeUpdate;
    _moduloNoContratado = false;

    // Guardar el token en IDB para que el SW pueda usarlo en pushsubscriptionchange
    if (tokenRef.value) {
      await guardarTokenEnIDB(tokenRef.value);
    }

    // Escuchar mensajes del SW (navegación tras tocar notificación)
    navigator.serviceWorker?.addEventListener("message", manejarMensajeSW);

    if (!esPushSoportado()) {
      console.info(
        "[PushManager] Push no soportado. Activando polling moderado.",
      );
      iniciarFallback(CONFIG.POLLING_MODERADO_MS);
      return;
    }

    try {
      _registration = await registrarServiceWorker();
    } catch (e) {
      console.error("[PushManager] Error al registrar SW:", e);
      iniciarFallback(CONFIG.POLLING_MODERADO_MS);
      return;
    }

    if (!_registration) {
      iniciarFallback(CONFIG.POLLING_MODERADO_MS);
      return;
    }

    // Evaluar el estado de permiso actual
    const permiso = Notification.permission;
    console.info(`[PushManager] Estado de permiso: ${permiso}`);

    if (permiso === "granted") {
      await suscribirYRegistrar();
      // sin polling — badge se actualiza vía push event o visibilitychange
      iniciarVisibilityChangeListener();
      // Fetch inicial del badge
      await consultarBadge();
    } else if (permiso === "denied") {
      console.info("[PushManager] Permiso denegado. Polling lento (5 min).");
      iniciarFallback(CONFIG.POLLING_LENTO_MS);
    } else {
      // 'default' — nunca se preguntó. Polling moderado + banner de invitación.
      console.info(
        "[PushManager] Permiso no solicitado aún. Polling moderado (2 min).",
      );
      iniciarFallback(CONFIG.POLLING_MODERADO_MS);
    }
  },

  /**
   * Solicita el permiso al usuario y, si lo concede, suscribe y registra.
   * Llamar SOLO desde una interacción explícita del usuario (clic en botón/banner).
   *
   * @returns {Promise<'granted'|'denied'|'default'>} Estado resultante del permiso.
   */
  async solicitarPermiso() {
    if (!esPushSoportado()) return "default";

    const permiso = await Notification.requestPermission();
    console.info(`[PushManager] Permiso solicitado. Resultado: ${permiso}`);

    if (permiso === "granted") {
      await suscribirYRegistrar();
      detenerFallbackCompleto();
      // Fetch inicial del badge ahora que tenemos push
      await consultarBadge();
    }

    return permiso;
  },

  /**
   * Da de baja la suscripción push en el navegador y la elimina del backend.
   * Llamar al cerrar sesión o cuando el usuario deshabilita las notificaciones.
   */
  async destruir() {
    detenerFallbackCompleto();

    await limpiarTokenEnIDB();
    navigator.serviceWorker?.removeEventListener("message", manejarMensajeSW);

    if (!_registration) {
      _registration = null;
      _condominioId = null;
      _onBadgeUpdate = null;
      return;
    }

    try {
      const suscripcion = await _registration.pushManager.getSubscription();
      if (suscripcion) {
        await darDeBajaEnBackend(suscripcion.endpoint);
        await suscripcion.unsubscribe();
        console.info(
          "[PushManager] Suscripción eliminada del navegador y del backend.",
        );
      }
    } catch (e) {
      console.warn("[PushManager] Error al dar de baja:", e);
    }

    _registration = null;
    _condominioId = null;
    _onBadgeUpdate = null;
  },

  /**
   * Desuscribe la suscripción push sin destruir el resto del estado.
   * A diferencia de destruir(), conserva:
   * - El registro del SW
   * - El token en IndexedDB
   * - Los listeners de mensajes del SW
   *
   * Útil para toggle ON/OFF desde Configuración sin cerrar sesión.
   */
  async desuscribir() {
    if (!_registration) return;

    try {
      const suscripcion = await _registration.pushManager.getSubscription();
      if (suscripcion) {
        await darDeBajaEnBackend(suscripcion.endpoint);
        await suscripcion.unsubscribe();
        console.info("[PushManager] Suscripción eliminada (toggle off).");
      }
    } catch (e) {
      console.warn("[PushManager] Error al desuscribir:", e);
    }
  },

  /**
   * Retorna true si el navegador soporta Web Push y el permiso está concedido.
   */
  get estaActivo() {
    return esPushSoportado() && Notification.permission === "granted";
  },

  /**
   * Retorna el estado actual del permiso de notificaciones.
   * 'granted' | 'denied' | 'default' | 'no-soportado'
   */
  get estadoPermiso() {
    if (!esPushSoportado()) return "no-soportado";
    return Notification.permission;
  },

  /**
   * Fuerza una consulta del badge desde la UI (ej. al entrar a la app).
   * Útil para sincronizar el contador al cargar la página.
   */
  async refrescarBadge() {
    await consultarBadge();
  },
};

// ─── Service Worker ───────────────────────────────────────────────────────────

async function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const reg = await navigator.serviceWorker.register(CONFIG.SW_PATH, {
      scope: CONFIG.SW_SCOPE,
    });
    console.info("[PushManager] Service Worker registrado. scope=", reg.scope);
    return reg;
  } catch (e) {
    console.error("[PushManager] Error al registrar SW:", e);
    throw e;
  }
}

function manejarMensajeSW(event) {
  if (event.data?.tipo === "NAVEGAR") {
    // El SW pide navegar tras clic en notificación.
    // La app principal maneja esto a través del router SPA.
    window.dispatchEvent(
      new CustomEvent("Briku:navegar", {
        detail: {
          url: event.data.url,
          notificacionId: event.data.notificacionId,
        },
      }),
    );
  }
}

// ─── Suscripción push ─────────────────────────────────────────────────────────

async function suscribirYRegistrar() {
  if (!_registration || !tokenRef.value) {
    console.warn("[PushManager] No se puede suscribir: sin SW o token.");
    return;
  }

  try {
    const vapidKey = await obtenerVapidKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    let suscripcion = await _registration.pushManager.getSubscription();

    if (!suscripcion) {
      suscripcion = await _registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      console.info("[PushManager] Nueva suscripción push creada.");
    } else {
      console.info("[PushManager] Suscripción push preexistente reutilizada.");
    }

    await registrarSuscripcionEnBackend(suscripcion);
  } catch (e) {
    console.error("[PushManager] Error al suscribir:", e);
  }
}

async function obtenerVapidKey() {
  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (envKey) {
    console.info("[PushManager] Usando VAPID key del entorno.");
    return envKey;
  }

  console.info("[PushManager] Solicitando VAPID key al backend...");
  const respuesta = await fetch(`${CONFIG.API_BASE}/push/vapid-key`, {
    headers: { Authorization: `Bearer ${tokenRef.value}` },
  });

  if (!respuesta.ok) {
    throw new Error(`Error al obtener VAPID key: HTTP ${respuesta.status}`);
  }

  const { publicKey } = await respuesta.json();
  if (!publicKey) {
    throw new Error("VAPID key vacía recibida del backend.");
  }
  return publicKey;
}

async function registrarSuscripcionEnBackend(suscripcion) {
  const { endpoint, keys } = suscripcion.toJSON();
  const dispositivo = buildDispositivoString();

  const respuesta = await fetch(`${CONFIG.API_BASE}/push/suscripciones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenRef.value}`,
    },
    body: JSON.stringify({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      dispositivo,
    }),
  });

  if (!respuesta.ok) {
    throw new Error(
      `Error al registrar suscripción en backend: HTTP ${respuesta.status}`,
    );
  }

  console.info("[PushManager] Suscripción registrada en el backend.");
}

async function darDeBajaEnBackend(endpoint) {
  const url = `${CONFIG.API_BASE}/push/suscripciones?endpoint=${encodeURIComponent(endpoint)}`;
  await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tokenRef.value}` },
  });
}

// ─── Fallback de polling adaptativo ───────────────────────────────────────────

/**
 * Inicia el polling periódico al endpoint /badge.
 * Solo se usa cuando el permiso NO es 'granted'.
 *
 * Comportamiento:
 * - Escucha visibilitychange para refrescar al volver a la pestaña.
 * - Primera consulta inmediata al iniciar.
 */
function iniciarFallback(intervaloMs) {
  detenerFallbackCompleto();

  // Primera consulta inmediata
  consultarBadge();

  // Consulta periódica
  _pollingIntervalId = setInterval(() => {
    consultarBadge();
  }, intervaloMs);

  // Consulta adicional al volver a la pestaña
  _onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      consultarBadge();
    }
  };
  document.addEventListener("visibilitychange", _onVisibilityChange);

  console.info(
    `[PushManager] Fallback polling activo. Intervalo: ${intervaloMs / 1000}s`,
  );
}

/**
 * Escucha visibilitychange sin polling de intervalo.
 * Se usa cuando el permiso es 'granted' — solo se consulta al volver a la pestaña.
 */
function iniciarVisibilityChangeListener() {
  detenerFallbackCompleto();

  _onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      consultarBadge();
    }
  };
  document.addEventListener("visibilitychange", _onVisibilityChange);
}

function detenerFallbackCompleto() {
  if (_pollingIntervalId !== null) {
    clearInterval(_pollingIntervalId);
    _pollingIntervalId = null;
  }
  if (_onVisibilityChange) {
    document.removeEventListener("visibilitychange", _onVisibilityChange);
    _onVisibilityChange = null;
  }
}

async function consultarBadge() {
  if (!_condominioId || !tokenRef.value || !_onBadgeUpdate) return;
  if (_moduloNoContratado) return;

  try {
    const respuesta = await fetch(
      `${CONFIG.API_BASE}/condominios/${_condominioId}/notificaciones/badge`,
      {
        headers: { Authorization: `Bearer ${tokenRef.value}` },
      },
    );
    if (respuesta.ok) {
      const { noLeidas } = await respuesta.json();
      _onBadgeUpdate(noLeidas ?? 0);

      // App Badge nativo (Android/Chrome desktop)
      if ("setAppBadge" in navigator) {
        if (noLeidas > 0) {
          navigator.setAppBadge(noLeidas).catch(() => {});
        } else {
          navigator.clearAppBadge().catch(() => {});
        }
      }
    } else if (respuesta.status === 403) {
      // Módulo COMUNICACION no contratado: el badge no existe. Detener el
      // polling de fallback para no pedir en bucle (módulo accesorio, la app
      // sigue viva). Se reintentará al reinicializar (login/cambio de condominio).
      const body = await respuesta.json().catch(() => null);
      if (esErrorModuloNoContratado({ response: { status: 403, data: body } })) {
        _moduloNoContratado = true;
        detenerFallbackCompleto();
        console.info(
          "[PushManager] Módulo COMUNICACION no contratado — polling de badge detenido.",
        );
      }
    }
  } catch {
    // Error de red — silencioso, reintento en el próximo ciclo
  }
}

// ─── IndexedDB — token para uso del SW ───────────────────────────────────────

/**
 * El Service Worker no tiene acceso a localStorage, por lo que el access token
 * se guarda en IndexedDB para que el SW lo lea en pushsubscriptionchange.
 *
 * La implementación vive en utils/idbTokenStore.js (compartida con
 * refreshCoordinator.js, que mantiene el token fresco en cada rotación).
 */

// ─── Utilidades ───────────────────────────────────────────────────────────────

function esPushSoportado() {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function buildDispositivoString() {
  const ua = navigator.userAgent;
  const browser =
    ua.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)?.[0] ?? "Navegador";
  const os = ua.match(/\(([^)]+)\)/)?.[1]?.split(";")[0] ?? "OS desconocido";
  return `${browser} / ${os}`.substring(0, 200);
}

/**
 * Convierte la clave VAPID pública de Base64url a Uint8Array.
 * Requerido por PushManager.subscribe({ applicationServerKey }).
 */
function urlBase64ToUint8Array(base64String) {
  if (!base64String || typeof base64String !== "string") {
    throw new Error(`Clave VAPID inválida recibida: ${base64String}`);
  }

  const cleanKey = base64String.replace(/['"\s]/g, "").trim();

  const padding = "=".repeat((4 - (cleanKey.length % 4)) % 4);
  const base64 = (cleanKey + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
