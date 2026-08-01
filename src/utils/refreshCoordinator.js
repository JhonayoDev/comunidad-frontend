/**
 * refreshCoordinator.js
 *
 * Coordinador ÚNICO de la rotación del access token.
 *
 * Resuelve el race-condition que tumbaba la sesión: el timer proactivo de 14
 * min (refreshScheduler) y el interceptor de 401 (api.js) refrescaban de forma
 * INDEPENDIENTE. Al volver de background (Warm Resume en iOS/Android), ambos
 * podían disparar /auth/refresh con el MISMO cookie casi al mismo tiempo →
 * el backend detectaba reúso, revocaba toda la familia de refresh tokens y la
 * sesión moría minutos después.
 *
 * Solución:
 * 1. Single-flight (promesa compartida): nunca dos refrescos en paralelo en el
 *    mismo contexto.
 * 2. Web Locks API: solo un contexto (PWA / pestaña / ventana) refresca a la
 *    vez; los demás esperan y usan el cookie ya rotado.
 * 3. Refresh preventivo en visibilitychange: al volver a foreground se renueva
 *    el token ANTES de que TanStack Query lance sus refetches (evita el burst
 *    de 401).
 * 4. Rotación sincronizada: cada token nuevo se persiste en IndexedDB (para el
 *    Service Worker) y se propaga por BroadcastChannel a los otros contextos.
 * 5. Timer proactivo reprogramado tras cada rotación.
 */

import { authService } from "@/services/authService";
import { accessToken } from "@/utils/tokenStore";
import { guardarTokenEnIDB } from "@/utils/idbTokenStore";
import {
  emitirTokenRotado,
  suscribirseARotacionToken,
} from "@/utils/tokenBroadcast";

// ─── Configuración ────────────────────────────────────────────────────────────

const INTERVALO_REFRESH_MS = 14 * 60 * 1000; // access token dura 15 min → refrescar a los 14
const UMBRAL_EXPIRACION_MS = 60 * 1000; // renovar si el token expira en menos de 60s
const LOCK_REFRESH = "comunidad:refresh";

// ─── Estado interno (privado al módulo) ───────────────────────────────────────

let timerRefresh = null;
let refreshInFlight = null;
let desuscribirBroadcast = null;
let iniciado = false;

// ─── Aplicar un token nuevo ───────────────────────────────────────────────────

function aplicarTokenNuevo(token) {
  accessToken.value = token;
  guardarTokenEnIDB(token).catch(() => {});
  emitirTokenRotado(token);
  scheduleProactiveRefresh();
}

// ─── Refresco con single-flight + lock cross-tab ──────────────────────────────

function hacerRefresh() {
  return authService
    .refresh()
    .then(({ data }) => {
      aplicarTokenNuevo(data.accessToken);
      return data.accessToken;
    })
    .catch((error) => {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || error?.message;
      console.error("[refresh] Fallo al refrescar token:", { status, mensaje });
      throw error;
    });
}

/**
 * Renueva el access token. Si ya hay un refresh en vuelo, devuelve la MISMA
 * promesa (single-flight). Usa Web Locks para que dos contextos del mismo
 * origen no refresquen a la vez con el mismo cookie.
 *
 * @returns {Promise<string>} el access token nuevo
 */
export function refrescarToken() {
  if (refreshInFlight) return refreshInFlight;

  let promesa;
  promesa = (async () => {
    try {
      if (navigator.locks?.request) {
        return await navigator.locks.request(LOCK_REFRESH, () => hacerRefresh());
      }
      return await hacerRefresh();
    } finally {
      if (refreshInFlight === promesa) refreshInFlight = null;
    }
  })();

  refreshInFlight = promesa;
  return promesa;
}

// ─── Timer proactivo ──────────────────────────────────────────────────────────

export function scheduleProactiveRefresh() {
  clearTimeout(timerRefresh);
  timerRefresh = setTimeout(() => {
    refrescarToken().catch(() => {
      // Si falla aquí (cookie ausente/revocada), el interceptor de 401
      // reintentará con el próximo request y llevará al login si persiste.
    });
  }, INTERVALO_REFRESH_MS);
}

export function clearProactiveRefresh() {
  clearTimeout(timerRefresh);
  timerRefresh = null;
}

// ─── Prevención en visibilitychange ───────────────────────────────────────────

/**
 * Milisegundos hasta la expiración del access token JWT (claim `exp`).
 * Devuelve Infinity si el token no es un JWT decodificable.
 */
export function msHastaExpiracion(token) {
  if (!token) return Infinity;
  try {
    const partePayload = token.split(".")[1];
    if (!partePayload) return Infinity;
    const base64 = base64UrlDecode(partePayload);
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (!payload?.exp) return Infinity;
    return payload.exp * 1000 - Date.now();
  } catch {
    return Infinity;
  }
}

function base64UrlDecode(valor) {
  const sinUrl = valor.replace(/-/g, "+").replace(/_/g, "/");
  const pad = sinUrl.length % 4;
  return sinUrl + (pad === 2 ? "==" : pad === 3 ? "=" : "");
}

/**
 * Refresca de inmediato si el token expira pronto o ya expiró.
 * Llamar cuando la app vuelve a primer plano (antes de los refetches de
 * TanStack Query, evitando el burst de 401).
 */
export async function verificarTokenAlDespertar() {
  if (!accessToken.value) return;
  if (msHastaExpiracion(accessToken.value) < UMBRAL_EXPIRACION_MS) {
    try {
      await refrescarToken();
    } catch {
      // El interceptor de 401 manejará el próximo request
    }
  }
}

// ─── Registro global ──────────────────────────────────────────────────────────

function manejarVisibilidad() {
  if (document.visibilityState === "visible") {
    verificarTokenAlDespertar();
  }
}

/**
 * Registra los listeners globales (visibilitychange + BroadcastChannel).
 * Llamar una sola vez al arrancar la app (main.js).
 */
export function iniciarCoordinadorRefresh() {
  if (iniciado) return;
  iniciado = true;
  document.addEventListener("visibilitychange", manejarVisibilidad);
  desuscribirBroadcast = suscribirseARotacionToken((token) =>
    aplicarTokenNuevo(token),
  );
}

export function detenerCoordinadorRefresh() {
  if (!iniciado) return;
  iniciado = false;
  document.removeEventListener("visibilitychange", manejarVisibilidad);
  desuscribirBroadcast?.();
  desuscribirBroadcast = null;
}
