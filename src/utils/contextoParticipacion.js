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
  if (clave === "guardia") return "Guardia";
  if (CONTEXT_LABELS[clave]) return CONTEXT_LABELS[clave];
  if (cargo && clave === cargo.toLowerCase()) return labelCargo(cargo);
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

  const esTrabajador =
    rolContextual === "TRABAJADOR" || clavesDeCargos.includes("trabajador");
  const esGuardia =
    rolContextual === "GUARDIA" || clavesDeCargos.includes("guardia");
  const esProveedor =
    rolContextual === "PROVEEDOR" ||
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
 * participación residencial; si no hay, el cargo activo; luego el portal
 * derivado por el backend (trabajador/proveedor); y residente como fallback.
 */
export function contextoInicial({
  tiposParticipacion = [],
  cargo = null,
  cargos = null,
  rolContextual = null,
} = {}) {
  if (esResidencial(tiposParticipacion)) return "residente";

  const contextoDelCargo = contextoDeCargo(
    cargosActivos({ cargo, cargos })[0],
  );
  if (contextoDelCargo) return contextoDelCargo;

  if (rolContextual === "GUARDIA") return "guardia";
  if (rolContextual === "TRABAJADOR") return "trabajador";
  if (rolContextual === "PROVEEDOR") return "proveedor";
  return "residente";
}
