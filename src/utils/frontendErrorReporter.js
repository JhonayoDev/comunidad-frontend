/**
 * frontendErrorReporter.js
 *
 * Captura errores globales del frontend para que un crash de render NUNCA
 * termine en pantalla blanca silenciosa (como ocurrió en la PWA iOS). Cada
 * error no manejado:
 *
 *   1. Se imprime en consola con detalle completo.
 *   2. Se muestra en un overlay DOM crudo (independiente de Vue — funciona
 *      incluso si Vue crasheó antes de montar). Con botón "Copiar" para
 *      pegar el detalle sin necesidad de Web Inspector.
 *   3. Se persiste en localStorage (últimos errores + últimos hitos de boot)
 *      para inspección posterior.
 *   4. Se reporta al servidor vía `sendBeacon` a rutas no manejadas del mismo
 *      origen (`/__frontend-error`, `/__frontend-boot`) — quedan en los access
 *      logs del hosting (Coolify/Nginx/Cloudflare) para diagnóstico remoto.
 *
 * Uso (main.js):
 *   import { instalarManejadorGlobalErrores, reportarError, marcarHito } from "./utils/frontendErrorReporter";
 *   instalarManejadorGlobalErrores();   // primero, antes de que evalúen otros módulos
 *   marcarHito("boot:main");
 *   ...
 *   app.config.errorHandler = (err, _instancia, info) => reportarError(`vue:${info}`, err);
 *   app.mount("#app");
 *   marcarHito("boot:mounted");
 */

const CLAVE_ERRORES = "briku:frontend-errors";
const CLAVE_HITOS = "briku:frontend-hitos";
const MAX_ERRORES = 5;
const MAX_HITOS = 20;
const MAX_STACK_LENGTH = 2000;
const RUTA_ERROR = "/__frontend-error";
const RUTA_BOOT = "/__frontend-boot";

let instalado = false;
let overlayEl = null;

// ─── Persistencia (localStorage con guardas para Safari privado) ─────────────

function leerJSON(clave, fallback) {
  try {
    const raw = localStorage.getItem(clave);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function escribirJSON(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* almacenamiento no disponible (modo privado / quota) */
  }
}

// ─── Beacon al servidor (best-effort) ────────────────────────────────────────

function beacon(ruta, texto) {
  try {
    const url = `${ruta}?ts=${Date.now()}`;
    const cuerpo = new Blob([texto], { type: "text/plain;charset=UTF-8" });
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(url, cuerpo);
      return;
    }
    fetch(url, { method: "POST", body: cuerpo, keepalive: true }).catch(() => {});
  } catch {
    /* sin red / API ausente — el diagnóstico local sigue disponible */
  }
}

// ─── Hitos de boot ───────────────────────────────────────────────────────────

/**
 * Registra un hito del ciclo de vida (boot:main, boot:mounted, ...).
 * Útil para distinguir "el JS nunca cargó" de "cargó y crasheó" cuando el
 * usuario reporta pantalla blanca.
 */
export function marcarHito(hito) {
  const hitos = leerJSON(CLAVE_HITOS, []);
  hitos.push({ ts: new Date().toISOString(), hito });
  escribirJSON(CLAVE_HITOS, hitos.slice(-MAX_HITOS));
  beacon(RUTA_BOOT, JSON.stringify({ hito }));
}

// ─── Normalización del error ─────────────────────────────────────────────────

function extraerMensaje(error) {
  if (error instanceof Error) return error.message || error.name || "Error";
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error) || "Error";
  } catch {
    return String(error);
  }
}

function extraerStack(error) {
  if (error instanceof Error && error.stack) return String(error.stack);
  return "";
}

// ─── Overlay DOM (no depende de Vue) ─────────────────────────────────────────

function crearOverlay() {
  const div = document.createElement("div");
  div.setAttribute("data-frontend-error", "");
  div.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;background:rgba(15,23,42,.96);" +
    "color:#f8fafc;display:flex;align-items:flex-start;justify-content:center;" +
    "padding:24px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;" +
    "overflow:auto;";

  const box = document.createElement("div");
  box.style.cssText =
    "max-width:560px;width:100%;background:#0f172a;border:1px solid #ef4444;" +
    "border-radius:12px;padding:16px;";

  const titulo = document.createElement("p");
  titulo.textContent = "Error en la aplicación";
  titulo.style.cssText = "color:#f87171;font-weight:700;font-size:14px;margin:0 0 8px;";

  const cuerpo = document.createElement("pre");
  cuerpo.style.cssText =
    "white-space:pre-wrap;word-break:break-word;margin:0 0 12px;line-height:1.5;";

  const botones = document.createElement("div");
  botones.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;";

  const copiar = document.createElement("button");
  copiar.type = "button";
  copiar.textContent = "Copiar error";
  copiar.style.cssText = "cursor:pointer;";

  const cerrar = document.createElement("button");
  cerrar.type = "button";
  cerrar.textContent = "Cerrar";
  cerrar.style.cssText = "cursor:pointer;";

  botones.appendChild(copiar);
  botones.appendChild(cerrar);

  box.appendChild(titulo);
  box.appendChild(cuerpo);
  box.appendChild(botones);
  div.appendChild(box);
  document.body.appendChild(div);

  copiar.addEventListener("click", () => {
    navigator.clipboard?.writeText(cuerpo.textContent || "").catch(() => {});
  });
  cerrar.addEventListener("click", () => {
    div.remove();
    overlayEl = null;
  });

  return div;
}

function mostrarOverlay(entrada) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mostrarOverlay(entrada), { once: true });
    return;
  }
  if (!overlayEl) overlayEl = crearOverlay();
  const pre = overlayEl.querySelector("pre");
  if (pre) pre.textContent = `${entrada.origen}\n${entrada.mensaje}\n\n${entrada.stack}`.trim();
}

// ─── Reporte ─────────────────────────────────────────────────────────────────

export function reportarError(origen, error, info) {
  let entrada;
  try {
    const mensaje = info ? `[${info}] ${extraerMensaje(error)}` : extraerMensaje(error);
    const stack = extraerStack(error).slice(0, MAX_STACK_LENGTH);
    entrada = {
      ts: new Date().toISOString(),
      origen,
      mensaje,
      stack,
    };

    console.error(`[frontend] Error global (${origen}):`, error);

    const errores = leerJSON(CLAVE_ERRORES, []);
    errores.push(entrada);
    escribirJSON(CLAVE_ERRORES, errores.slice(-MAX_ERRORES));

    beacon(RUTA_ERROR, JSON.stringify(entrada));

    if (typeof document !== "undefined") mostrarOverlay(entrada);
  } catch (e) {
    // El reportero nunca debe crashear — si algo falla, solo consola.
    // eslint-disable-next-line no-console
    console.error("[frontendErrorReporter] Falló al reportar:", e);
  }
  return entrada;
}

// ─── Registro de listeners globales ──────────────────────────────────────────

function manejarErrorEvent(evento) {
  const error = evento?.error;
  const objetivo = evento?.target;

  // Error de recurso (chunk 404, script/imagen): el objeto `error` viene vacío
  // y el target es el elemento que falló.
  if (objetivo && objetivo !== window && !error) {
    const tag = objetivo.tagName || "recurso";
    const src = objetivo.src || objetivo.href || "";
    reportarError("recurso", new Error(`Falló al cargar ${tag}: ${src}`));
    return;
  }

  if (error) reportarError("window.onerror", error);
}

function manejarRechazo(evento) {
  const razon = evento?.reason;
  if (razon instanceof Error) {
    reportarError("unhandledrejection", razon);
  } else {
    reportarError("unhandledrejection", new Error(extraerMensaje(razon)));
  }
}

export function instalarManejadorGlobalErrores() {
  if (instalado) return;
  instalado = true;

  if (typeof window !== "undefined") {
    // Fase de captura: los errores de recurso (chunk 404) no burbujean, solo
    // se pueden interceptar durante el descenso desde window.
    window.addEventListener("error", manejarErrorEvent, true);
    window.addEventListener("unhandledrejection", manejarRechazo);
  }

  marcarHito("boot:reporter");
}

// Auto-install: este módulo es el PRIMER import de main.js, así que su cuerpo
// se evalúa antes que vue/router/etc. Instalar aquí atrapa errores en tiempo
// de evaluación de los demás módulos (import-time), no solo los de runtime.
instalarManejadorGlobalErrores();
