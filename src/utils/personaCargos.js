/**
 * Cargos activos por persona.
 *
 * `GET /condominios/{cid}/personas` expone un solo `cargo` por persona (el
 * primero que devuelve la consulta), así que quien acumula cargos —p. ej.
 * TESORERO + SECRETARIO + CONSERJE— aparece con uno solo. `GET .../miembros`
 * sí trae una fila por cargo activo y usa el mismo permiso (`PERSONA_VER`),
 * por lo que la vista cruza ambas fuentes.
 */

/**
 * Agrupa `MiembroResponse[]` (una fila por cargo) en
 * `{ [personaId]: ["TESORERO", "SECRETARIO"] }`, sin duplicados y sin cargos
 * inactivos.
 */
export function agruparCargosPorPersona(miembros) {
  const mapa = {};
  for (const miembro of Array.isArray(miembros) ? miembros : []) {
    if (!miembro?.personaId || !miembro?.cargo || miembro.activo === false) {
      continue;
    }
    const lista = mapa[miembro.personaId] || (mapa[miembro.personaId] = []);
    if (!lista.includes(miembro.cargo)) lista.push(miembro.cargo);
  }
  return mapa;
}

/**
 * Cargos a mostrar para una persona: todos los activos del cruce y, si el
 * cruce no está disponible (403, carga en curso o persona fuera de la
 * página), el `cargo` único que entrega el listado.
 */
export function cargosDePersona(persona, cargosPorPersona = {}) {
  if (!persona) return [];
  const cargos = persona.id ? cargosPorPersona[persona.id] : null;
  if (cargos?.length) return cargos;
  return persona.cargo ? [persona.cargo] : [];
}
