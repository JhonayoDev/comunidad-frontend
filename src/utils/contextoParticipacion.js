import { labelCargo } from "@/data/cargos";

/**
 * Mapa cargo → clave del contexto (portal).
 *
 * El backend entrega un solo cargo activo por condominio y un `rolContextual`;
 * varios cargos comparten espacio de trabajo:
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
  rolContextual = null,
} = {}) {
  const claves = [];
  const agregar = (clave) => {
    if (clave && !claves.includes(clave)) claves.push(clave);
  };

  const contextoDelCargo = contextoDeCargo(cargo);
  const esTrabajador =
    rolContextual === "TRABAJADOR" || contextoDelCargo === "trabajador";
  const esGuardia =
    rolContextual === "GUARDIA" || contextoDelCargo === "guardia";
  const esProveedor =
    rolContextual === "PROVEEDOR" ||
    (tiposParticipacion || []).includes("PROVEEDOR");
  const tieneContextoPropio =
    Boolean(contextoDelCargo) || esTrabajador || esGuardia || esProveedor;

  if (esResidencial(tiposParticipacion) || !tieneContextoPropio) {
    agregar("residente");
  }
  agregar(contextoDelCargo);
  if (esGuardia) agregar("guardia");
  if (esTrabajador) agregar("trabajador");
  if (esProveedor) agregar("proveedor");
  if (!claves.length) agregar("residente");

  return claves.map((clave) => ({
    key: clave,
    label: etiquetaDeContexto(clave, cargo),
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
  rolContextual = null,
} = {}) {
  if (esResidencial(tiposParticipacion)) return "residente";

  const contextoDelCargo = contextoDeCargo(cargo);
  if (contextoDelCargo) return contextoDelCargo;

  if (rolContextual === "GUARDIA") return "guardia";
  if (rolContextual === "TRABAJADOR") return "trabajador";
  if (rolContextual === "PROVEEDOR") return "proveedor";
  return "residente";
}
