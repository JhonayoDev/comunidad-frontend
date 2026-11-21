import { describe, it, expect } from "vitest";
import {
  agruparCargosPorPersona,
  cargosDePersona,
} from "@/utils/personaCargos";

const miembro = (personaId, cargo, activo = true) => ({
  id: `${personaId}-${cargo}`,
  personaId,
  personaNombre: "Juan Ramírez",
  cargo,
  activo,
});

describe("agruparCargosPorPersona", () => {
  it("agrupa todos los cargos activos de una persona", () => {
    const mapa = agruparCargosPorPersona([
      miembro("p1", "TESORERO"),
      miembro("p1", "SECRETARIO"),
      miembro("p1", "CONSERJE"),
    ]);

    expect(mapa).toEqual({
      p1: ["TESORERO", "SECRETARIO", "CONSERJE"],
    });
  });

  it("separa los cargos por persona y no duplica", () => {
    const mapa = agruparCargosPorPersona([
      miembro("p1", "PRESIDENTE"),
      miembro("p2", "GUARDIA"),
      miembro("p1", "PRESIDENTE"),
    ]);

    expect(mapa.p1).toEqual(["PRESIDENTE"]);
    expect(mapa.p2).toEqual(["GUARDIA"]);
  });

  it("ignora cargos inactivos y filas incompletas", () => {
    const mapa = agruparCargosPorPersona([
      miembro("p1", "TESORERO", false),
      { personaId: "p1", activo: true },
      { cargo: "SECRETARIO", activo: true },
      null,
    ]);

    expect(mapa).toEqual({});
    expect(agruparCargosPorPersona(undefined)).toEqual({});
  });
});

describe("cargosDePersona", () => {
  const persona = { id: "p1", cargo: "SECRETARIO" };
  const mapa = { p1: ["TESORERO", "SECRETARIO", "CONSERJE"] };

  it("prioriza el cruce con miembros", () => {
    expect(cargosDePersona(persona, mapa)).toEqual([
      "TESORERO",
      "SECRETARIO",
      "CONSERJE",
    ]);
  });

  it("cae al cargo único del listado si no hay cruce", () => {
    expect(cargosDePersona(persona, {})).toEqual(["SECRETARIO"]);
    expect(cargosDePersona({ id: "p9", cargo: "GUARDIA" }, mapa)).toEqual([
      "GUARDIA",
    ]);
  });

  it("devuelve lista vacía sin persona o sin datos", () => {
    expect(cargosDePersona(null, mapa)).toEqual([]);
    expect(cargosDePersona({ id: "p2" }, mapa)).toEqual([]);
  });
});
