import { describe, it, expect } from "vitest";
import {
  MODOS_NUMERACION,
  generarNumeros,
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
