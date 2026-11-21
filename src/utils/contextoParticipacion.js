import { labelCargo } from "@/data/cargos";

/**
 * Mapa cargo → clave del contexto (portal).
 *
 * El contrato actual del backend entrega un solo cargo activo por condominio
 * (`cargo` + `rolContextual`), pero una persona puede tener varios cargos. En
 * cuanto el backend exponga la lista (`cargos`), los helpers la aceptan y
 * generan una píldora por cada espacio; varios cargos comparten espacio:
 * - `GUARDIA` y `CONSERJE` → portal de guardia.
 * - `JARDINERO` y `MANTENCION` → portal de trabajador.
 * - El comité y el administrador tienen cada uno su propio espacio.
 */
export const CONTEXTO_POR_CARGO = {
  ADMINISTRADOR: "administrador",
  PRESIDENTE: "presidente",
  TESORERO: "tesorero",
  SECRETARIO: "secretario",
  DELEGADO: "delegado",
  GUARDIA: "guardia",
  CONSERJE: "guardia",
  JARDINERO: "trabajador",
  MANTENCION: "trabajador",
};

/**
 * Dashboard al que navega cada contexto al activarse desde el header.
 * Debe corresponder a rutas existentes en el router.
 */
export const CONTEXT_DASHBOARDS = {
  residente: "Inicio",
  presidente: "Dashboard",
  tesorero: "FinanzasDashboard",
  secretario: "Dashboard",
  delegado: "Dashboard",
  administrador: "Dashboard",
  guardia: "GuardiaDashboard",
  trabajador: "TrabajadorDashboard",
  proveedor: "ProveedorDashboard",
};

const CONTEXT_LABELS = {
  residente: "Residente",
  guardia: "Guardia",
  trabajador: "Trabajador",
  proveedor: "Proveedor",
};

const TIPOS_RESIDENCIALES = ["PROPIETARIO", "ARRENDATARIO", "DEPENDIENTE"];

/**
 * Clave de contexto para un cargo. Devuelve `null` sin cargo; los cargos no
 * catalogados caen a su código en minúsculas para no perder el espacio.
 */
export function contextoDeCargo(cargo) {
  if (!cargo) return null;
  return CONTEXTO_POR_CARGO[cargo] || cargo.toLowerCase();
}

function etiquetaDeContexto(clave, cargo) {
  // Si el contexto proviene de un cargo, manda su etiqueta del catálogo:
  // CONSERJE → "Conserje", GUARDIA → "Guardia", JARDINERO → "Jardinero".
  // El portal (clave) se comparte, pero la píldora muestra el cargo real.
  if (cargo && clave === contextoDeCargo(cargo)) {
    return labelCargo(cargo) || clave;
  }
  if (CONTEXT_LABELS[clave]) return CONTEXT_LABELS[clave];
  return clave;
}

/**
 * Cargos activos del condominio. Prioriza `cargo` (contrato actual) y suma la
 * lista `cargos` cuando el backend la entregue, sin duplicados. Mantener
 * `cargo` primero preserva el portal inicial de siempre.
 */
function cargosActivos({ cargo = null, cargos = null } = {}) {
  const lista = Array.isArray(cargos) ? [...cargos] : [];
  if (cargo && !lista.includes(cargo)) lista.unshift(cargo);
  return lista;
}

/**
 * Roles de portal que informa el backend (`rolesContextuales`, derivados de
 * los cargos) más el `rolContextual` único por compatibilidad.
 */
function rolesPortal({ rolContextual = null, rolesContextuales = null } = {}) {
  const lista = Array.isArray(rolesContextuales)
    ? rolesContextuales.filter(Boolean)
    : [];
  if (rolContextual && !lista.includes(rolContextual)) {
    lista.unshift(rolContextual);
  }
  return lista;
}

function esResidencial(tiposParticipacion) {
  return (tiposParticipacion || []).some((tipo) =>
    TIPOS_RESIDENCIALES.includes(tipo),
  );
}

/**
 * Contextos de participación disponibles para el header. Un usuario puede ser
 * residente y guardia a la vez: la participación residencial y el cargo son
 * espacios separados. Sin ninguna señal contextual se ofrece "Residente".
 */
export function construirContextos({
  tiposParticipacion = [],
  cargo = null,
  cargos = null,
  rolContextual = null,
  rolesContextuales = null,
} = {}) {
  const claves = [];
  const agregar = (clave) => {
    if (clave && !claves.includes(clave)) claves.push(clave);
  };

  const activos = cargosActivos({ cargo, cargos });
  const clavesDeCargos = activos.map(contextoDeCargo).filter(Boolean);
  const cargoPorClave = new Map();
  for (let i = 0; i < clavesDeCargos.length; i += 1) {
    if (!cargoPorClave.has(clavesDeCargos[i])) {
      cargoPorClave.set(clavesDeCargos[i], activos[i]);
    }
  }

  const roles = rolesPortal({ rolContextual, rolesContextuales });
  const esTrabajador =
    roles.includes("TRABAJADOR") || clavesDeCargos.includes("trabajador");
  const esGuardia =
    roles.includes("GUARDIA") || clavesDeCargos.includes("guardia");
  const esProveedor =
    roles.includes("PROVEEDOR") ||
    (tiposParticipacion || []).includes("PROVEEDOR");
  const tieneContextoPropio =
    clavesDeCargos.length > 0 || esTrabajador || esGuardia || esProveedor;

  if (esResidencial(tiposParticipacion) || !tieneContextoPropio) {
    agregar("residente");
  }
  clavesDeCargos.forEach(agregar);
  if (esGuardia) agregar("guardia");
  if (esTrabajador) agregar("trabajador");
  if (esProveedor) agregar("proveedor");
  if (!claves.length) agregar("residente");

  return claves.map((clave) => ({
    key: clave,
    label: etiquetaDeContexto(clave, cargoPorClave.get(clave)),
  }));
}

/**
 * Contexto con el que se entra a un condominio recién seleccionado: manda la
 * participación residencial; si no hay, el cargo principal; luego el portal
 * derivado por el backend (trabajador/proveedor); y residente como fallback.
 */
export function contextoInicial({
  tiposParticipacion = [],
  cargo = null,
  cargos = null,
  rolContextual = null,
  rolesContextuales = null,
} = {}) {
  if (esResidencial(tiposParticipacion)) return "residente";

  const contextoDelCargo = contextoDeCargo(
    cargosActivos({ cargo, cargos })[0],
  );
  if (contextoDelCargo) return contextoDelCargo;

  const roles = rolesPortal({ rolContextual, rolesContextuales });
  if (roles.includes("GUARDIA")) return "guardia";
  if (roles.includes("TRABAJADOR")) return "trabajador";
  if (roles.includes("PROVEEDOR")) return "proveedor";
  return "residente";
}
