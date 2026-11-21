/**
 * tokenBroadcast.js
 *
 * Canal BroadcastChannel para coordinar la rotación del access token y el
 * cierre de sesión entre contextos del mismo origen (PWA standalone + pestaña
 * del navegador, o dos ventanas). Previene que dos contextos refresquen con el
 * MISMO cookie y disparen el reuse-detection del backend (que revoca toda la
 * familia de refresh tokens).
 *
 * El token rotado se propaga a las otras pestañas para que actualicen su
 * memoria e IndexedDB sin reintentar un refresh con la cookie stale.
 *
 * Regla de oro: un contexto que RECIBE un mensaje de estado nunca lo reemite
 * (evita el ping-pong infinito entre pestañas). Solo lo emite quien origina
 * el cambio.
 */

const CHANNEL_NAME = "Briku:auth";
const MENSAJE_TOKEN_ROTADO = "token-rotado";
const MENSAJE_SESION_CERRADA = "sesion-cerrada";

let canal = null;

function obtenerCanal() {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!canal) canal = new BroadcastChannel(CHANNEL_NAME);
  return canal;
}

export function emitirTokenRotado(token) {
  const c = obtenerCanal();
  if (!c) return;
  c.postMessage({ type: MENSAJE_TOKEN_ROTADO, token });
}

export function suscribirseARotacionToken(callback) {
  const c = obtenerCanal();
  if (!c) return () => {};

  const handler = (event) => {
    if (event.data?.type === MENSAJE_TOKEN_ROTADO && event.data.token) {
      callback(event.data.token);
    }
  };

  c.addEventListener("message", handler);
  return () => c.removeEventListener("message", handler);
}

/**
 * Avisa a los demás contextos del origen que la sesión terminó (logout
 * explícito). El refresh token lo revoca el backend; esto corta el access
 * token en memoria de las otras pestañas en vez de dejarlo vivo hasta que
 * expire (~15 min).
 */
export function emitirSesionCerrada() {
  const c = obtenerCanal();
  if (!c) return;
  c.postMessage({ type: MENSAJE_SESION_CERRADA });
}

export function suscribirseACierreSesion(callback) {
  const c = obtenerCanal();
  if (!c) return () => {};

  const handler = (event) => {
    if (event.data?.type === MENSAJE_SESION_CERRADA) callback();
  };

  c.addEventListener("message", handler);
  return () => c.removeEventListener("message", handler);
}
