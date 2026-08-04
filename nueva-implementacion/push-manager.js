/**
 * push-manager.js
 *
 * Módulo singleton responsable de toda la lógica push del lado del cliente:
 *
 * 1. Registro del Service Worker.
 * 2. Detección del estado de permiso (granted / denied / default).
 * 3. Suscripción push con la clave VAPID del backend.
 * 4. Envío de la suscripción al backend.
 * 5. Gestión del fallback de polling cuando el push no está disponible.
 * 6. Escritura del access token en IndexedDB para uso del SW.
 *
 * Uso (después del login exitoso):
 *
 *   import { PushManager } from './push-manager.js';
 *   await PushManager.inicializar(accessToken, condominioId);
 *
 * Al cerrar sesión:
 *
 *   await PushManager.destruir(accessToken);
 */

"use strict";

// ─── Configuración ────────────────────────────────────────────────────────────

const CONFIG = {
  SW_PATH: "/service-worker.js",
  SW_SCOPE: "/",
  API_BASE: "/api/v1",
  // Intervalos de polling de fallback (ms)
  POLLING_LENTO_MS: 5 * 60 * 1000, // 5 min — cuando el permiso está denegado
  POLLING_MODERADO_MS: 2 * 60 * 1000, // 2 min — cuando nunca se ha pedido permiso
  // Nombre de la BD IndexedDB donde se guarda el token para el SW
  IDB_NAME: "Briku-auth",
  IDB_VERSION: 1,
  IDB_STORE: "tokens",
};

// ─── Estado interno (privado al módulo) ───────────────────────────────────────

let _registration = null; // ServiceWorkerRegistration activo
let _pollingIntervalId = null; // ID del setInterval de fallback
let _condominioId = null; // Necesario para construir la URL del badge

// ─── API pública ──────────────────────────────────────────────────────────────

export const PushManager = {
  /**
   * Punto de entrada principal. Llamar inmediatamente después del login.
   *
   * @param {string} accessToken  JWT del usuario autenticado.
   * @param {string} condominioId UUID del condominio activo.
   * @param {Function} onBadgeUpdate  Callback(count: number) para actualizar el badge en la UI.
   */
  async inicializar(accessToken, condominioId, onBadgeUpdate) {
    _condominioId = condominioId;

    // Guardar el token en IDB para que el SW pueda usarlo en pushsubscriptionchange
    await guardarTokenEnIDB(accessToken);

    // Escuchar mensajes del SW (navegación tras tocar notificación)
    navigator.serviceWorker?.addEventListener("message", manejarMensajeSW);

    if (!esPushSoportado()) {
      console.info(
        "[Push] Push no soportado en este navegador. Activando polling moderado.",
      );
      iniciarFallback(
        CONFIG.POLLING_MODERADO_MS,
        accessToken,
        condominioId,
        onBadgeUpdate,
      );
      return;
    }

    // Registrar el SW si aún no está registrado
    _registration = await registrarServiceWorker();

    // Evaluar el estado de permiso actual
    const permiso = Notification.permission;
    console.info(`[Push] Estado de permiso: ${permiso}`);

    if (permiso === "granted") {
      await suscribirYRegistrar(accessToken);
      detenerFallback(); // Asegurar que no quede polling activo
    } else if (permiso === "denied") {
      console.info("[Push] Permiso denegado. Activando polling lento (5 min).");
      iniciarFallback(
        CONFIG.POLLING_LENTO_MS,
        accessToken,
        condominioId,
        onBadgeUpdate,
      );
    } else {
      // 'default' — nunca se preguntó. Polling moderado + mostrar banner de invitación.
      console.info(
        "[Push] Permiso no solicitado aún. Activando polling moderado (2 min).",
      );
      iniciarFallback(
        CONFIG.POLLING_MODERADO_MS,
        accessToken,
        condominioId,
        onBadgeUpdate,
      );
      // El banner se muestra desde la UI — PushManager.solicitarPermiso() es el siguiente paso.
    }
  },

  /**
   * Solicita el permiso al usuario y, si lo concede, suscribe y registra.
   * Llamar SOLO desde una interacción explícita del usuario (clic en botón/banner).
   * Los navegadores modernos ignoran la solicitud si no hay gesto de usuario previo.
   *
   * @param {string} accessToken  JWT del usuario autenticado.
   * @returns {Promise<'granted'|'denied'|'default'>}  El estado resultante del permiso.
   */
  async solicitarPermiso(accessToken) {
    if (!esPushSoportado()) return "default";

    const permiso = await Notification.requestPermission();
    console.info(`[Push] Permiso solicitado. Resultado: ${permiso}`);

    if (permiso === "granted") {
      await suscribirYRegistrar(accessToken);
      detenerFallback();
    }

    return permiso;
  },

  /**
   * Da de baja la suscripción push en el navegador y la elimina del backend.
   * Llamar al cerrar sesión o cuando el usuario deshabilita las notificaciones.
   *
   * @param {string} accessToken  JWT del usuario autenticado.
   */
  async destruir(accessToken) {
    detenerFallback();
    await limpiarTokenDeIDB();
    navigator.serviceWorker?.removeEventListener("message", manejarMensajeSW);

    if (!_registration) return;

    try {
      const suscripcion = await _registration.pushManager.getSubscription();
      if (suscripcion) {
        // Notificar al backend antes de desuscribir el navegador
        await darDeBajaEnBackend(suscripcion.endpoint, accessToken);
        await suscripcion.unsubscribe();
        console.info(
          "[Push] Suscripción eliminada del navegador y del backend.",
        );
      }
    } catch (e) {
      // Error no fatal: si falla la baja en el backend, el SW limpiará el 410 Gone
      // en el próximo envío push.
      console.warn("[Push] Error al dar de baja la suscripción:", e);
    }

    _registration = null;
  },

  /**
   * Retorna true si el navegador soporta Web Push y el permiso está concedido.
   * Útil para que la UI decida si mostrar el botón "Activar notificaciones".
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
};

// ─── Service Worker ───────────────────────────────────────────────────────────

async function registrarServiceWorker() {
  try {
    const reg = await navigator.serviceWorker.register(CONFIG.SW_PATH, {
      scope: CONFIG.SW_SCOPE,
    });
    console.info("[Push] Service Worker registrado. scope=", reg.scope);
    return reg;
  } catch (e) {
    console.error("[Push] Error al registrar Service Worker:", e);
    throw e;
  }
}

function manejarMensajeSW(event) {
  if (event.data?.tipo === "NAVEGAR") {
    // El SW nos pide navegar a una ruta tras el clic en la notificación.
    // La app principal maneja esto a través del router de SPA.
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

async function suscribirYRegistrar(accessToken) {
  try {
    // Obtener la clave VAPID pública del backend
    const vapidKey = await obtenerVapidKey(accessToken);
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    // Verificar si ya existe una suscripción activa
    let suscripcion = await _registration.pushManager.getSubscription();

    if (!suscripcion) {
      suscripcion = await _registration.pushManager.subscribe({
        userVisibleOnly: true, // Requerido por Chrome — promesa de mostrar notif al usuario
        applicationServerKey,
      });
      console.info("[Push] Nueva suscripción push creada.");
    } else {
      console.info("[Push] Suscripción push preexistente reutilizada.");
    }

    // Registrar en el backend (idempotente — no falla si ya existe)
    await registrarSuscripcionEnBackend(suscripcion, accessToken);
  } catch (e) {
    console.error("[Push] Error al suscribir al push service:", e);
    // No propagar — un fallo en la suscripción no debe romper la carga de la app.
  }
}

async function obtenerVapidKey(accessToken) {
  const respuesta = await fetch(`${CONFIG.API_BASE}/push/vapid-key`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!respuesta.ok) {
    throw new Error(`Error al obtener VAPID key: HTTP ${respuesta.status}`);
  }

  const { publicKey } = await respuesta.json();
  return publicKey;
}

async function registrarSuscripcionEnBackend(suscripcion, accessToken) {
  const { endpoint, keys } = suscripcion.toJSON();
  const dispositivo = buildDispositivoString();

  const respuesta = await fetch(`${CONFIG.API_BASE}/push/suscripciones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
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

  console.info("[Push] Suscripción registrada en el backend.");
}

async function darDeBajaEnBackend(endpoint, accessToken) {
  const url = `${CONFIG.API_BASE}/push/suscripciones?endpoint=${encodeURIComponent(endpoint)}`;
  await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ─── Fallback de polling ──────────────────────────────────────────────────────

/**
 * Inicia un polling periódico al endpoint /badge para mantener actualizado
 * el contador de notificaciones cuando el push no está disponible.
 *
 * Adicionalmente, escucha el evento 'visibilitychange' para consultar
 * el badge inmediatamente cuando el usuario vuelve a enfocar la pestaña.
 *
 * @param {number}   intervaloMs     Frecuencia del polling en milisegundos.
 * @param {string}   accessToken     JWT del usuario.
 * @param {string}   condominioId    UUID del condominio activo.
 * @param {Function} onBadgeUpdate   Callback(count: number) para actualizar la UI.
 */
function iniciarFallback(
  intervaloMs,
  accessToken,
  condominioId,
  onBadgeUpdate,
) {
  if (!onBadgeUpdate) return;

  detenerFallback(); // Limpiar cualquier intervalo previo

  const consultarBadge = async () => {
    try {
      const respuesta = await fetch(
        `${CONFIG.API_BASE}/condominios/${condominioId}/notificaciones/badge`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (respuesta.ok) {
        const { noLeidas } = await respuesta.json();
        onBadgeUpdate(noLeidas);
      }
    } catch {
      // Error de red — silencioso, se reintenta en el próximo intervalo.
    }
  };

  // Primera consulta inmediata
  consultarBadge();

  // Consulta periódica
  _pollingIntervalId = setInterval(consultarBadge, intervaloMs);

  // Consulta adicional al volver a enfocar la pestaña
  document.addEventListener(
    "visibilitychange",
    (_onVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        await consultarBadge();
      }
    }),
  );

  console.info(
    `[Push] Fallback polling activo. Intervalo: ${intervaloMs / 1000}s`,
  );
}

let _onVisibilityChange = null;

function detenerFallback() {
  if (_pollingIntervalId !== null) {
    clearInterval(_pollingIntervalId);
    _pollingIntervalId = null;
  }
  if (_onVisibilityChange) {
    document.removeEventListener("visibilitychange", _onVisibilityChange);
    _onVisibilityChange = null;
  }
}

// ─── IndexedDB — token para uso del SW ───────────────────────────────────────

/**
 * Guarda el access token en IndexedDB.
 * El Service Worker lo lee en el evento pushsubscriptionchange para
 * renovar la suscripción automáticamente sin intervención del usuario.
 *
 * No usamos localStorage porque el SW no tiene acceso a él.
 */
async function guardarTokenEnIDB(token) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(CONFIG.IDB_NAME, CONFIG.IDB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(CONFIG.IDB_STORE)) {
        db.createObjectStore(CONFIG.IDB_STORE);
      }
    };

    req.onerror = () => reject(req.error);

    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(CONFIG.IDB_STORE, "readwrite");
      const store = tx.objectStore(CONFIG.IDB_STORE);
      store.put(token, "accessToken");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
}

async function limpiarTokenDeIDB() {
  return new Promise((resolve) => {
    const req = indexedDB.open(CONFIG.IDB_NAME, CONFIG.IDB_VERSION);
    req.onerror = () => resolve();
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CONFIG.IDB_STORE)) {
        resolve();
        return;
      }
      const tx = db.transaction(CONFIG.IDB_STORE, "readwrite");
      const store = tx.objectStore(CONFIG.IDB_STORE);
      store.delete("accessToken");
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    };
  });
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

/**
 * Verifica que el navegador soporte todos los APIs necesarios para Web Push.
 * - ServiceWorker: para el SW
 * - PushManager: para suscripciones push
 * - Notification: para mostrar notificaciones nativas
 */
function esPushSoportado() {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Construye una descripción legible del navegador/OS para el campo 'dispositivo'.
 * Se guarda en BD solo como referencia informativa — no afecta la lógica.
 */
function buildDispositivoString() {
  const ua = navigator.userAgent;
  // Parseo simple — suficiente para mostrar "Chrome 124 / Windows"
  const browser =
    ua.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)?.[0] ?? "Navegador";
  const os = ua.match(/\(([^)]+)\)/)?.[1]?.split(";")[0] ?? "OS desconocido";
  return `${browser} / ${os}`.substring(0, 200);
}

/**
 * Convierte la clave VAPID pública de Base64url a Uint8Array.
 * Requerido por PushManager.subscribe({ applicationServerKey }).
 *
 * Esta es la conversión estándar para Web Push — se encuentra en
 * casi toda documentación del tema.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    buffer[i] = rawData.charCodeAt(i);
  }
  return buffer;
}
