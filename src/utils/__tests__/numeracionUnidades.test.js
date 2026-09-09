import { describe, it, expect } from "vitest";
import {
  MODOS_NUMERACION,
  generarNumeros,
  generarNombres,
  parsearListaPersonalizada,
} from "@/utils/numeracionUnidades";

describe("numeracionUnidades", () => {
  describe("correlativo", () => {
    it("genera la secuencia desde el número inicial", () => {
      expect(generarNumeros("correlativo", { desde: "1", cantidad: 5 })).toEqual([
        { numero: "1", piso: null },
        { numero: "2", piso: null },
        { numero: "3", piso: null },
        { numero: "4", piso: null },
        { numero: "5", piso: null },
      ]);
    });

    it("soporta casas numeradas desde 1001", () => {
      const items = generarNumeros("correlativo", { desde: "1001", cantidad: 3 });
      expect(items.map((i) => i.numero)).toEqual(["1001", "1002", "1003"]);
      expect(items[0].piso).toBeNull();
    });

    it("devuelve [] si el número inicial es inválido", () => {
      expect(generarNumeros("correlativo", { desde: "abc", cantidad: 3 })).toEqual([]);
      expect(generarNumeros("correlativo", { desde: "1", cantidad: 0 })).toEqual([]);
    });
  });

  describe("por-piso", () => {
    it("genera 101-106 y 201-206 derivando el piso", () => {
      expect(generarNumeros("por-piso", { pisos: 2, porPiso: 6 })).toEqual([
        { numero: "101", piso: 1 },
        { numero: "102", piso: 1 },
        { numero: "103", piso: 1 },
        { numero: "104", piso: 1 },
        { numero: "105", piso: 1 },
        { numero: "106", piso: 1 },
        { numero: "201", piso: 2 },
        { numero: "202", piso: 2 },
        { numero: "203", piso: 2 },
        { numero: "204", piso: 2 },
        { numero: "205", piso: 2 },
        { numero: "206", piso: 2 },
      ]);
    });

    it("devuelve [] si pisos o porPiso no son positivos", () => {
      expect(generarNumeros("por-piso", { pisos: 0, porPiso: 4 })).toEqual([]);
      expect(generarNumeros("por-piso", { pisos: 2, porPiso: -1 })).toEqual([]);
    });
  });

  describe("personalizado", () => {
    it("parsea líneas y comas, deduplicando y descartando vacíos", () => {
      expect(
        parsearListaPersonalizada("A1\nA2, A3\n\nA2"),
      ).toEqual(["A1", "A2", "A3"]);
    });

    it("genera ítems sin piso", () => {
      expect(generarNumeros("personalizado", { lista: "A1\nA2" })).toEqual([
        { numero: "A1", piso: null },
        { numero: "A2", piso: null },
      ]);
    });

    it("devuelve [] con lista vacía", () => {
      expect(generarNumeros("personalizado", { lista: "  \n" })).toEqual([]);
    });
  });

  it("expone los modos con label y descripcion", () => {
    expect(MODOS_NUMERACION.map((m) => m.value)).toEqual([
      "correlativo",
      "por-piso",
      "personalizado",
    ]);
    expect(MODOS_NUMERACION[1].label).toBe("Por piso");
  });
});

describe("generarNombres (estacionamientos/bodegas)", () => {
  it("correlativo: prefijo + secuencia desde el inicial, sin piso", () => {
    expect(generarNombres("E-", "correlativo", { desde: "1", cantidad: 3 })).toEqual([
      { nombre: "E-1", piso: null },
      { nombre: "E-2", piso: null },
      { nombre: "E-3", piso: null },
    ]);
  });

  it("correlativo: prefijo EV- para estacionamientos de visitas", () => {
    expect(generarNombres("EV-", "correlativo", { desde: "1", cantidad: 2 }).map((x) => x.nombre)).toEqual([
      "EV-1",
      "EV-2",
    ]);
  });

  it("correlativo: devuelve [] si el inicial o la cantidad son inválidos", () => {
    expect(generarNombres("E-", "correlativo", { desde: "abc", cantidad: 3 })).toEqual([]);
    expect(generarNombres("E-", "correlativo", { desde: "1", cantidad: 0 })).toEqual([]);
  });

  it("por-piso: nombres correlativos globales con piso en la columna (incluye subterráneos)", () => {
    expect(generarNombres("E-", "por-piso", { pisos: "1,2,-1", porPiso: 2 })).toEqual([
      { nombre: "E-1", piso: 1 },
      { nombre: "E-2", piso: 1 },
      { nombre: "E-3", piso: 2 },
      { nombre: "E-4", piso: 2 },
      { nombre: "E-5", piso: -1 },
      { nombre: "E-6", piso: -1 },
    ]);
  });

  it("por-piso: devuelve [] si la lista de pisos o porPiso son inválidos", () => {
    expect(generarNombres("E-", "por-piso", { pisos: "", porPiso: 2 })).toEqual([]);
    expect(generarNombres("E-", "por-piso", { pisos: "1,abc", porPiso: 2 })).toEqual([]);
    expect(generarNombres("E-", "por-piso", { pisos: "1", porPiso: 0 })).toEqual([]);
  });

  it("personalizado: usa la lista tal cual, sin piso", () => {
    expect(generarNombres("E-", "personalizado", { lista: "E-7\nEV-3" })).toEqual([
      { nombre: "E-7", piso: null },
      { nombre: "EV-3", piso: null },
    ]);
  });

  it("personalizado: devuelve [] con lista vacía", () => {
    expect(generarNombres("E-", "personalizado", { lista: "  \n" })).toEqual([]);
  });
});
