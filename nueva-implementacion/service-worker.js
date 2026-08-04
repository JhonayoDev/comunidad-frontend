/**
 * service-worker.js
 *
 * Service Worker de Briku PWA.
 * Scope: '/' — aplica a todo el dominio (configurado en push-manager.js).
 *
 * Responsabilidades en este archivo:
 * 1. Evento 'push'          → deserializar payload y mostrar notificación nativa.
 * 2. Evento 'notificationclick' → enfocar o abrir la app en la ruta correcta.
 * 3. Evento 'pushsubscriptionchange' → renovar la suscripción automáticamente
 *                                       cuando el push service la rota.
 *
 * Lo que NO hace este SW (por ahora — Hito 3):
 * - Cache de assets (offline-first). Se agrega en una sprint futura.
 * - Background sync. Se agrega cuando se implemente modo offline.
 *
 * Compatibilidad:
 * - Chrome 50+, Firefox 44+, Edge 17+, Safari 16+ (macOS/iOS)
 * - El push en Safari/iOS requiere que el usuario agregue la app al home screen.
 */

"use strict";

// ─── Constantes ───────────────────────────────────────────────────────────────

/**
 * Mapa de TipoRecurso (enum del backend) a ruta del frontend.
 * Cuando el usuario toca la notificación, el SW abre esta ruta
 * pasando el condominioId y el recursoId del payload.
 *
 * Sincronizar con TipoRecurso.java si se agregan nuevos valores.
 */
const RUTAS_POR_RECURSO = {
  ENCOMIENDA: "/encomiendas",
  VISITA: "/accesos",
  GASTO_COMUN: "/gastos-comunes",
  PAGO: "/finanzas",
  RECLAMO: "/casos",
  RESERVA: "/reservas",
  COMUNICADO: "/anuncios",
  DOCUMENTO: "/documentos",
  NONE: "/notificaciones",
};

const ICON_DEFAULT = "/icons/icon-192x192.png";
const BADGE_ICON = "/icons/badge-72x72.png";
const NOTIF_TAG_BASE = "Briku-notif";

// ─── Ciclo de vida del SW ─────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  // Activar inmediatamente sin esperar a que se cierren las pestañas anteriores.
  // Seguro porque no manejamos cache de assets en esta versión.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Tomar control de todas las pestañas abiertas sin recargar.
  event.waitUntil(self.clients.claim());
});

// ─── Evento push ─────────────────────────────────────────────────────────────

/**
 * Se dispara cuando el push service entrega un mensaje.
 * El payload viene del WebPushPayload.java del backend:
 * {
 *   "titulo":         "Encomienda recibida",
 *   "cuerpo":         "Tienes una encomienda en portería.",
 *   "tipoRecurso":    "ENCOMIENDA",
 *   "recursoId":      "uuid-del-recurso",
 *   "condominioId":   "uuid-del-condominio",
 *   "notificacionId": "uuid-de-la-notificacion"
 * }
 */
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.warn("[SW] Evento push sin payload — ignorado.");
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    console.error("[SW] Payload push con JSON inválido:", e);
    return;
  }

  const {
    titulo,
    cuerpo,
    tipoRecurso,
    recursoId,
    condominioId,
    notificacionId,
  } = payload;

  const opciones = {
    body: cuerpo ?? "Tienes una nueva notificación.",
    icon: ICON_DEFAULT,
    badge: BADGE_ICON,
    // tag agrupa notificaciones del mismo tipo — evita apilar decenas de notifs.
    // Si llegan dos ENCOMIENDA antes de que el usuario las vea, se reemplaza la anterior.
    tag: `${NOTIF_TAG_BASE}-${tipoRecurso ?? "NONE"}`,
    // renotify: true → reproducir sonido/vibración aunque el tag ya exista.
    renotify: true,
    // data se pasa al evento notificationclick para construir la ruta.
    data: { tipoRecurso, recursoId, condominioId, notificacionId },
    // vibrate: patrón de vibración en ms [vibrar, pausa, vibrar]
    vibrate: [200, 100, 200],
    // requireInteraction: false → la notificación se descarta automáticamente en desktop.
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(titulo ?? "Briku", opciones),
  );
});

// ─── Evento notificationclick ─────────────────────────────────────────────────

/**
 * Se dispara cuando el usuario toca la notificación.
 * Comportamiento:
 * 1. Cerrar la notificación.
 * 2. Si la app ya está abierta en alguna pestaña → enfocarla y navegar.
 * 3. Si no está abierta → abrir una nueva pestaña en la ruta correcta.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const { tipoRecurso, recursoId, condominioId, notificacionId } =
    event.notification.data ?? {};
  const url = construirUrl(tipoRecurso, recursoId, condominioId);

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientesList) => {
        // Buscar una pestaña ya abierta con el mismo origen
        const clienteExistente = clientesList.find((c) =>
          c.url.startsWith(self.location.origin),
        );

        if (clienteExistente) {
          // Enfocar la pestaña existente y enviarle la ruta para navegación SPA
          return clienteExistente.focus().then((cliente) => {
            cliente.postMessage({
              tipo: "NAVEGAR",
              url,
              notificacionId, // para que la app la marque leída
            });
          });
        }

        // No hay pestaña abierta → abrir la app en la ruta correcta
        return self.clients.openWindow(url);
      }),
  );
});

// ─── Evento pushsubscriptionchange ────────────────────────────────────────────

/**
 * Se dispara cuando el push service rota la suscripción del navegador.
 * Esto puede ocurrir cuando el usuario ha estado mucho tiempo sin abrir la app
 * o cuando el push service (FCM, Mozilla) renueva sus certificados.
 *
 * Flujo:
 * 1. El SW recibe la nueva suscripción del navegador.
 * 2. Intenta enviarla al backend usando las credenciales guardadas en IndexedDB.
 * 3. Si no hay credenciales guardadas (usuario cerró sesión), la suscripción
 *    se pierde silenciosamente — se renovará cuando el usuario vuelva a iniciar sesión.
 */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const nuevaSuscripcion = await self.registration.pushManager.subscribe(
          event.oldSubscription?.options ?? { userVisibleOnly: true },
        );

        // Leer el access token guardado en IndexedDB (no localStorage — no disponible en SW)
        const token = await leerTokenDeIDB();
        if (!token) {
          console.warn(
            "[SW] pushsubscriptionchange: sin token guardado. Suscripción pendiente hasta el próximo login.",
          );
          return;
        }

        await registrarSuscripcionEnBackend(nuevaSuscripcion, token);
        console.info("[SW] Suscripción push renovada exitosamente.");
      } catch (e) {
        console.error("[SW] Error al renovar suscripción push:", e);
      }
    })(),
  );
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Construye la URL de destino cuando el usuario toca la notificación.
 * Formato: /condominios/{condominioId}/{ruta}/{recursoId}
 * Si no hay recursoId, navega al listado del tipo de recurso.
 */
function construirUrl(tipoRecurso, recursoId, condominioId) {
  const base = self.location.origin;
  const ruta = RUTAS_POR_RECURSO[tipoRecurso] ?? RUTAS_POR_RECURSO.NONE;
  const prefix = condominioId ? `/condominios/${condominioId}` : "";

  if (recursoId && tipoRecurso !== "NONE") {
    return `${base}${prefix}${ruta}/${recursoId}`;
  }
  return `${base}${prefix}${ruta}`;
}

/**
 * Lee el access token desde IndexedDB (la única API de storage disponible en SW).
 * La app guarda el token en IDB en push-manager.js después del login.
 */
async function leerTokenDeIDB() {
  return new Promise((resolve) => {
    const req = indexedDB.open("Briku-auth", 1);
    req.onerror = () => resolve(null);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("tokens")) {
        resolve(null);
        return;
      }
      const tx = db.transaction("tokens", "readonly");
      const store = tx.objectStore("tokens");
      const get = store.get("accessToken");
      get.onsuccess = () => resolve(get.result ?? null);
      get.onerror = () => resolve(null);
    };
  });
}

/**
 * Registra la suscripción push renovada en el backend.
 * Reutiliza la misma lógica que push-manager.js — duplicado intencional
 * porque el SW no puede importar módulos ES del proyecto principal
 * sin configuración adicional de bundler.
 */
async function registrarSuscripcionEnBackend(suscripcion, token) {
  const { endpoint, keys } = suscripcion.toJSON();
  const dispositivo = navigator.userAgent.substring(0, 100);

  const respuesta = await fetch("/api/v1/push/suscripciones", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
      `Backend respondió ${respuesta.status} al registrar suscripción renovada.`,
    );
  }
}
