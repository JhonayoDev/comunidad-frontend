/**
 * Catálogo de membresía persona-condominio (backend V85).
 *
 * La membresía es la puerta de entrada explícita al condominio. `tipoAlta` es
 * el tipo con el que se dio de alta la persona; `tiposParticipacion` es el
 * conjunto derivado (no excluyente) que devuelve la API.
 */

export const ESTADOS_MEMBRESIA = [
  { value: "ACTIVO", label: "Activas", singular: "Activa", severity: "success" },
  {
    value: "PENDIENTE",
    label: "Pendientes de asociar",
    singular: "Pendiente de asociar",
    severity: "warn",
  },
  {
    value: "INACTIVO",
    label: "Inactivas",
    singular: "Inactiva",
    severity: "secondary",
  },
];

export const TIPOS_PARTICIPACION = [
  { value: "PROPIETARIO", label: "Propietario", severity: "info" },
  { value: "ARRENDATARIO", label: "Arrendatario", severity: "info" },
  { value: "DEPENDIENTE", label: "Dependiente", severity: "secondary" },
  { value: "TRABAJADOR", label: "Trabajador", severity: "warn" },
  { value: "ADMINISTRACION", label: "Administración", severity: "success" },
  { value: "PROVEEDOR", label: "Proveedor", severity: "contrast" },
];

export const TIPOS_ALTA = [
  { value: "RESIDENTE", label: "Residente" },
  { value: "PROPIETARIO", label: "Propietario" },
  { value: "DEPENDIENTE", label: "Dependiente" },
  { value: "TRABAJADOR", label: "Trabajador" },
  { value: "PROVEEDOR", label: "Proveedor" },
  { value: "ADMINISTRADOR_EXTERNO", label: "Administrador externo" },
];

export const TIPOS_ASOCIACION = [
  {
    value: "UNIDAD",
    label: "A una unidad",
    descripcion: "Propietario, arrendatario o residente adicional.",
    icon: "pi pi-home",
  },
  {
    value: "CARGO",
    label: "A un cargo",
    descripcion: "Trabajador del condominio (jardinero, aseo, conserje, guardia…).",
    icon: "pi pi-briefcase",
  },
  {
    value: "PROVEEDOR",
    label: "Proveedor externo",
    descripcion: "Servicio recurrente sin unidad ni cargo.",
    icon: "pi pi-truck",
  },
];

/** Cargos que representan trabajo operativo (no comité). */
export const CARGOS_TRABAJADOR = [
  { value: "CONSERJE", label: "Conserje" },
  { value: "GUARDIA", label: "Guardia" },
  { value: "MANTENCION", label: "Mantención / aseo" },
  { value: "JARDINERO", label: "Jardinero" },
];

/** Todos los cargos del enum `CargoCondominio`. */
export const CARGOS_ASOCIABLES = [
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "PRESIDENTE", label: "Presidente" },
  { value: "TESORERO", label: "Tesorero" },
  { value: "SECRETARIO", label: "Secretario" },
  { value: "DELEGADO", label: "Delegado" },
  ...CARGOS_TRABAJADOR,
];

export const TIPOS_VINCULO_UNIDAD = [
  { value: "PROPIETARIO", label: "Propietario" },
  { value: "ARRENDATARIO", label: "Arrendatario" },
  { value: "RESIDENTE_ADICIONAL", label: "Residente adicional" },
];

const PARTICIPACION_POR_VALOR = Object.fromEntries(
  TIPOS_PARTICIPACION.map((tipo) => [tipo.value, tipo]),
);
const ESTADO_POR_VALOR = Object.fromEntries(
  ESTADOS_MEMBRESIA.map((estado) => [estado.value, estado]),
);
const TIPO_ALTA_POR_VALOR = Object.fromEntries(
  TIPOS_ALTA.map((tipo) => [tipo.value, tipo]),
);

export function labelTipoParticipacion(valor) {
  if (!valor) return "";
  return PARTICIPACION_POR_VALOR[valor]?.label || valor;
}

export function severityTipoParticipacion(valor) {
  return PARTICIPACION_POR_VALOR[valor]?.severity || "secondary";
}

export function labelEstadoMembresia(valor) {
  if (!valor) return "";
  return ESTADO_POR_VALOR[valor]?.singular || valor;
}

export function severityEstadoMembresia(valor) {
  return ESTADO_POR_VALOR[valor]?.severity || "secondary";
}

export function labelTipoAlta(valor) {
  if (!valor) return "";
  return TIPO_ALTA_POR_VALOR[valor]?.label || valor;
}

/**
 * Un tipo de participación es "de residencia" si implica vivir o tener
 * propiedad en el condominio. Se usa para decidir si corresponde el portal
 * de residente cuando el rol contextual no viene informado.
 */
export function esParticipacionResidencial(tipos = []) {
  return tipos.some((tipo) =>
    ["PROPIETARIO", "ARRENDATARIO", "DEPENDIENTE"].includes(tipo),
  );
}
