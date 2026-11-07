/**
 * Etiquetas legibles de los cargos del condominio.
 * El backend entrega el código (`SECRETARIO`, `PRESIDENTE`, ...); la UI
 * muestra el nombre con formato humano.
 */
export const CARGO_LABELS = {
  ADMINISTRADOR: "Administrador",
  PRESIDENTE: "Presidente",
  TESORERO: "Tesorero",
  SECRETARIO: "Secretario",
  DELEGADO: "Delegado",
  CONSERJE: "Conserje",
  GUARDIA: "Guardia",
  MANTENCION: "Mantención",
  JARDINERO: "Jardinero",
};

export function labelCargo(cargo) {
  if (!cargo) return "";
  return CARGO_LABELS[cargo] || cargo;
}
