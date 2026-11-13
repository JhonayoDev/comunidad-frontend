import { describe, it, expect } from "vitest";
import {
  ESTADOS_MEMBRESIA,
  TIPOS_PARTICIPACION,
  TIPOS_ASOCIACION,
  CARGOS_TRABAJADOR,
  CARGOS_ASOCIABLES,
  labelTipoParticipacion,
  severityTipoParticipacion,
  labelEstadoMembresia,
  severityEstadoMembresia,
  labelTipoAlta,
  esParticipacionResidencial,
} from "@/data/membresia";

describe("membresia", () => {
  it("catálogo de estados conoce ACTIVO, PENDIENTE e INACTIVO", () => {
    const valores = ESTADOS_MEMBRESIA.map((e) => e.value);
    expect(valores).toEqual(["ACTIVO", "PENDIENTE", "INACTIVO"]);
  });

  it("etiqueta y severidad de los tipos de participación", () => {
    expect(labelTipoParticipacion("PROPIETARIO")).toBe("Propietario");
    expect(labelTipoParticipacion("TRABAJADOR")).toBe("Trabajador");
    expect(labelTipoParticipacion("PROVEEDOR")).toBe("Proveedor");
    expect(labelTipoParticipacion("DESCONOCIDO")).toBe("DESCONOCIDO");
    expect(severityTipoParticipacion("TRABAJADOR")).toBe("warn");
    expect(severityTipoParticipacion("NOPE")).toBe("secondary");
  });

  it("etiqueta singular de estados de membresía", () => {
    expect(labelEstadoMembresia("ACTIVO")).toBe("Activa");
    expect(labelEstadoMembresia("PENDIENTE")).toBe("Pendiente de asociar");
    expect(labelEstadoMembresia("INACTIVO")).toBe("Inactiva");
    expect(severityEstadoMembresia("INACTIVO")).toBe("secondary");
  });

  it("etiqueta el tipo de alta", () => {
    expect(labelTipoAlta("ADMINISTRADOR_EXTERNO")).toBe(
      "Administrador externo",
    );
    expect(labelTipoAlta("TRABAJADOR")).toBe("Trabajador");
    expect(labelTipoAlta(null)).toBe("");
  });

  it("considera residencial solo propietario, arrendatario o dependiente", () => {
    expect(esParticipacionResidencial(["PROPIETARIO"])).toBe(true);
    expect(esParticipacionResidencial(["ARRENDATARIO"])).toBe(true);
    expect(esParticipacionResidencial(["DEPENDIENTE"])).toBe(true);
    expect(esParticipacionResidencial(["TRABAJADOR"])).toBe(false);
    expect(esParticipacionResidencial(["PROVEEDOR"])).toBe(false);
    expect(esParticipacionResidencial([])).toBe(false);
  });

  it("expone tres formas de asociación y los cargos reales", () => {
    expect(TIPOS_ASOCIACION.map((t) => t.value)).toEqual([
      "UNIDAD",
      "CARGO",
      "PROVEEDOR",
    ]);
    expect(CARGOS_TRABAJADOR.map((c) => c.value)).toContain("JARDINERO");
    expect(CARGOS_ASOCIABLES.map((c) => c.value)).toContain("PRESIDENTE");
    expect(TIPOS_PARTICIPACION.map((t) => t.value)).not.toContain(
      "INSTALACION_FOCO",
    );
  });
});
