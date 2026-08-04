/**
 * errores.js — helpers de errores de API para la UI.
 *
 * Centralizan la detección de casos especiales del backend (403 por módulo no
 * contratado, 409 por límite de plan) y la extracción de mensajes legibles.
 * Son funciones puras: no lanzan ni detienen la app — solo enriquecen el error
 * para que cada vista decida cómo degradar.
 */

const MODULO_NO_SUSCRITO = "no tiene suscrito el módulo";

/**
 * ¿El error es un 403 por módulo no contratado (gating @RequiresModule)?
 * El backend responde 403 con message "El condominio no tiene suscrito el
 * módulo X". Se distingue del 403 por permisos por el texto del message.
 */
export function esErrorModuloNoContratado(error) {
  if (error?.moduleNotSubscribed === true) return true;
  const message = error?.response?.data?.message;
  return (
    error?.response?.status === 403 &&
    typeof message === "string" &&
    message.includes(MODULO_NO_SUSCRITO)
  );
}

/**
 * ¿El error es un 409 por límite de plan (unidadLimit / usuarioLimit)?
 */
export function esErrorPlan(error) {
  return error?.response?.status === 409;
}

/**
 * Extrae un mensaje legible del error. Prioriza el message del backend
 * (ErrorResponse), luego el mensaje nativo y finalmente un fallback.
 */
export function mensajeError(error, fallback = "Error inesperado") {
  const msg = error?.response?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  return error?.message || fallback;
}