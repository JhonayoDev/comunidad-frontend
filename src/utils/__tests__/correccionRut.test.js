import { describe, it, expect } from "vitest";
import {
  correccionRutHabilitada,
  estadoCorreccionRut,
} from "@/utils/correccionRut";

const AHORA = new Date("2026-11-06T12:00:00.000Z");

describe("correccionRut · habilitación temporal", () => {
  it("no está habilitada cuando /me no trae la fecha", () => {
    expect(correccionRutHabilitada({}, AHORA)).toEqual({
      habilitada: false,
      hasta: null,
    });
    expect(correccionRutHabilitada(null, AHORA).habilitada).toBe(false);
  });

  it("no está habilitada con una fecha inválida", () => {
    expect(
      correccionRutHabilitada({ rutCorreccionHabilitadaHasta: "no-es-fecha" }, AHORA),
    ).toEqual({ habilitada: false, hasta: null });
  });

  it("no está habilitada cuando la ventana ya expiró", () => {
    const res = correccionRutHabilitada(
      { rutCorreccionHabilitadaHasta: "2026-11-06T11:59:59.000Z" },
      AHORA,
    );
    expect(res.habilitada).toBe(false);
    expect(res.hasta).toBeInstanceOf(Date);
  });

  it("está habilitada mientras la ventana siga vigente", () => {
    const res = correccionRutHabilitada(
      { rutCorreccionHabilitadaHasta: "2026-11-09T12:00:00.000Z" },
      AHORA,
    );
    expect(res.habilitada).toBe(true);
    expect(res.hasta.toISOString()).toBe("2026-11-09T12:00:00.000Z");
  });
});

describe("correccionRut · estado para administración", () => {
  it("traduce cada estado del backend", () => {
    expect(estadoCorreccionRut({ estado: "VIGENTE" })).toEqual({
      label: "Vigente",
      severity: "success",
    });
    expect(estadoCorreccionRut({ estado: "CONSUMIDA" }).label).toBe("Usada");
    expect(estadoCorreccionRut({ estado: "REVOCADA" }).label).toBe("Revocada");
    expect(estadoCorreccionRut({ estado: "EXPIRADA" }).label).toBe("Expirada");
  });

  it("cae a 'Sin habilitación' cuando no hay registro o el estado es desconocido", () => {
    expect(estadoCorreccionRut(null)).toEqual({
      label: "Sin habilitación",
      severity: "secondary",
    });
    expect(estadoCorreccionRut({ estado: "OTRO" }).label).toBe(
      "Sin habilitación",
    );
  });
});
