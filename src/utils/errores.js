/**
 * errores.js — helpers de errores de API para la UI.
 *
 * Centralizan la detección de casos especiales del backend (403 por módulo no
 * contratado, 409 por límite de plan) y la extracción de mensajes legibles.
 * Son funciones puras: no lanzan ni detienen la app — solo enriquecen el error
 * para que cada vista decida cómo degradar.
 */

import { ref } from "vue";

const MODULO_NO_SUSCRITO = "no tiene suscrito el módulo";
const PERIODO_GRACIA = "período de gracia";

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
 * ¿El error es un 403 por período de gracia (pago pendiente)?
 * El backend responde 403 con message "El condominio está en período de
 * gracia por pago pendiente. Solo se permite consultar información…".
 * En gracia los GET funcionan y los POST/PUT/PATCH se rechazan: la UI debe
 * mostrarlo con banner propio en vez de un error por fila.
 */
export function esPeriodoGracia(error) {
  if (error?.periodoGracia === true) return true;
  const message = error?.response?.data?.message;
  return (
    error?.response?.status === 403 &&
    typeof message === "string" &&
    message.includes(PERIODO_GRACIA)
  );
}

// Flag persistido de gracia por condominio (module scope, reactivo +
// localStorage): permite avisar en dashboard/setup aunque el 403 se haya
// visto en otra vista o sesión. Se limpia con la primera escritura exitosa.
const condominiosEnGracia = ref(new Set());

function claveGracia(cid) {
  return `comunidad:gracia:${cid}`;
}

export function marcarGracia(cid) {
  if (!cid) return;
  condominiosEnGracia.value.add(cid);
  try {
    localStorage.setItem(claveGracia(cid), "1");
  } catch (e) {
    console.error("Error al persistir período de gracia", e);
  }
}

export function limpiarGracia(cid) {
  if (!cid) return;
  condominiosEnGracia.value.delete(cid);
  try {
    localStorage.removeItem(claveGracia(cid));
  } catch (e) {
    console.error("Error al limpiar período de gracia", e);
  }
}

export function enGracia(cid) {
  if (!cid) return false;
  if (condominiosEnGracia.value.has(cid)) return true;
  try {
    if (localStorage.getItem(claveGracia(cid))) {
      condominiosEnGracia.value.add(cid);
      return true;
    }
  } catch (e) {
    console.error("Error al leer período de gracia", e);
  }
  return false;
}

/**
 * ¿El error es un 409 por límite de plan (unidadLimit / usuarioLimit)?
 */
export function esErrorPlan(error) {
  return error?.response?.status === 409;
}

/**
 * ¿El error es por timeout de red (axios ECONNABORTED)?
 * Se distingue del 5xx por el código y el mensaje "timeout of Xms exceeded".
 */
export function esErrorTimeout(error) {
  return (
    error?.code === "ECONNABORTED" ||
    /timeout of \d+ms exceeded/i.test(error?.message || "")
  );
}

/**
 * Extrae un mensaje legible del error. Prioriza el message del backend
 * (ErrorResponse), luego el mensaje nativo y finalmente un fallback.
 * Para timeouts devuelve un mensaje a nivel usuario, sin exponer infra.
 */
export function mensajeError(error, fallback = "Error inesperado") {
  if (esErrorTimeout(error)) {
    return "La operación está tardando más de lo esperado. Por favor, intenta nuevamente en unos segundos.";
  }
  const msg = error?.response?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  return error?.message || fallback;
}