import { describe, it, expect } from "vitest";
import { compararUnidades, ordenarUnidades } from "@/utils/ordenamientoNatural";

describe("ordenamientoNatural", () => {
  it("ordena números de unidad en orden natural (no lexicográfico)", () => {
    const numeros = ["1", "10", "11", "12", "2", "20", "21", "3"];
    expect([...numeros].sort(compararUnidades)).toEqual([
      "1", "2", "3", "10", "11", "12", "20", "21",
    ]);
  });

  it("ordena una lista de unidades por su numero", () => {
    const unidades = [
      { id: "a", numero: "10" },
      { id: "b", numero: "2" },
      { id: "c", numero: "1" },
      { id: "d", numero: "11" },
    ];
    expect(ordenarUnidades(unidades).map((u) => u.numero)).toEqual([
      "1", "2", "10", "11",
    ]);
  });

  it("no muta la lista original", () => {
    const unidades = [{ numero: "10" }, { numero: "2" }];
    const ordenadas = ordenarUnidades(unidades);
    expect(unidades.map((u) => u.numero)).toEqual(["10", "2"]);
    expect(ordenadas.map((u) => u.numero)).toEqual(["2", "10"]);
  });

  it("maneja nombres alfanuméricos mixtos (prefijos y pisos)", () => {
    const nombres = ["Casa 10", "Casa 2", "A-1", "A-2", "B-10", "B-2"];
    expect([...nombres].sort(compararUnidades)).toEqual([
      "A-1", "A-2", "B-2", "B-10", "Casa 2", "Casa 10",
    ]);
  });

  it("deja los números antes que el texto (unidad CONDOMINIO al final)", () => {
    const numeros = ["Condominio Los Robles", "1", "2", "10"];
    expect([...numeros].sort(compararUnidades)).toEqual([
      "1", "2", "10", "Condominio Los Robles",
    ]);
  });

  it("tolera valores vacíos o nulos (van después de los números)", () => {
    const numeros = ["", null, "1", "2"];
    expect([...numeros].sort(compararUnidades)).toEqual(["1", "2", "", null]);
  });
});