import { describe, it, expect } from "vitest";
import {
  ASOCIACION_UNIDAD,
  ASOCIACION_CARGO,
  ASOCIACION_PROVEEDOR,
  construirAsociacion,
  validarAsociacion,
  construirPayloadAlta,
  datosConflicto,
  mensajeAlta,
} from "@/utils/altaPersona";

const FECHA = "2026-11-13";

describe("altaPersona.construirAsociacion", () => {
  it("construye una asociación a unidad", () => {
    const asociacion = construirAsociacion({
      asociacionTipo: ASOCIACION_UNIDAD,
      unidadId: "u-1",
      tipoVinculo: "PROPIETARIO",
      fechaInicio: FECHA,
      esOcupante: true,
      recibeNotificaciones: false,
      esResponsable: true,
    });

    expect(asociacion).toEqual({
      tipo: "UNIDAD",
      unidad: {
        unidadId: "u-1",
        tipoVinculo: "PROPIETARIO",
        esOcupante: true,
        recibeNotificaciones: false,
        esResponsable: true,
        fechaInicio: FECHA,
      },
    });
  });

  it("recibe notificaciones por defecto", () => {
    const asociacion = construirAsociacion({
      asociacionTipo: ASOCIACION_UNIDAD,
      unidadId: "u-1",
      tipoVinculo: "ARRENDATARIO",
      fechaInicio: FECHA,
    });
    expect(asociacion.unidad.recibeNotificaciones).toBe(true);
  });

  it("construye una asociación a cargo", () => {
    const asociacion = construirAsociacion({
      asociacionTipo: ASOCIACION_CARGO,
      cargo: "JARDINERO",
      fechaInicio: FECHA,
    });
    expect(asociacion).toEqual({
      tipo: "CARGO",
      cargo: { cargo: "JARDINERO", fechaInicio: FECHA },
    });
  });

  it("construye una asociación de proveedor sin fecha", () => {
    const asociacion = construirAsociacion({
      asociacionTipo: ASOCIACION_PROVEEDOR,
      empresa: "  Jardines SpA  ",
      rubro: "Jardinería",
      contactoProveedor: "   ",
    });
    expect(asociacion).toEqual({
      tipo: "PROVEEDOR",
      proveedor: {
        empresa: "Jardines SpA",
        rubro: "Jardinería",
        contacto: null,
      },
    });
  });

  it("devuelve null para un tipo desconocido", () => {
    expect(construirAsociacion({ asociacionTipo: "OTRO" })).toBeNull();
  });
});

describe("altaPersona.validarAsociacion", () => {
  it("exige tipo de asociación", () => {
    expect(validarAsociacion({}).asociacionTipo).toBeTruthy();
  });

  it("exige unidad y tipo de vínculo", () => {
    const errores = validarAsociacion({
      asociacionTipo: ASOCIACION_UNIDAD,
      fechaInicio: FECHA,
    });
    expect(errores.unidadId).toBeTruthy();
    expect(errores.tipoVinculo).toBeTruthy();
    expect(errores.fechaInicio).toBeUndefined();
  });

  it("exige fecha y cargo en la asociación a cargo", () => {
    const errores = validarAsociacion({
      asociacionTipo: ASOCIACION_CARGO,
      cargo: null,
    });
    expect(errores.cargo).toBeTruthy();
    expect(errores.fechaInicio).toBeTruthy();
  });

  it("no exige fecha para proveedor", () => {
    expect(
      validarAsociacion({ asociacionTipo: ASOCIACION_PROVEEDOR }),
    ).toEqual({});
  });
});

describe("altaPersona.construirPayloadAlta", () => {
  it("envía identidad nueva + asociación", () => {
    const payload = construirPayloadAlta({
      persona: {
        nombre: "  Ana  ",
        email: "ana@correo.cl",
        rut: "",
        telefono: " ",
      },
      asociacion: { tipo: "CARGO" },
    });
    expect(payload).toEqual({
      persona: {
        nombre: "Ana",
        email: "ana@correo.cl",
        rut: null,
        telefono: null,
      },
      asociacion: { tipo: "CARGO" },
    });
  });

  it("envía personaId cuando se reutiliza una identidad", () => {
    const payload = construirPayloadAlta({
      personaId: "p-1",
      asociacion: { tipo: "UNIDAD" },
    });
    expect(payload).toEqual({
      personaId: "p-1",
      asociacion: { tipo: "UNIDAD" },
    });
    expect(payload.persona).toBeUndefined();
  });
});

describe("altaPersona.datosConflicto", () => {
  it("extrae personaId y conflicto de un 409", () => {
    const conflicto = datosConflicto({
      response: {
        status: 409,
        data: {
          personaId: "p-9",
          conflicto: "EMAIL",
          message: "Ya existe una persona con ese email.",
        },
      },
    });
    expect(conflicto).toEqual({
      personaId: "p-9",
      conflicto: "EMAIL",
      message: "Ya existe una persona con ese email.",
    });
  });

  it("devuelve null si no es 409", () => {
    expect(datosConflicto({ response: { status: 400 } })).toBeNull();
    expect(datosConflicto(new Error("boom"))).toBeNull();
  });
});

describe("altaPersona.mensajeAlta", () => {
  it("describe los tipos de participación resultantes", () => {
    expect(
      mensajeAlta({ tiposParticipacion: ["TRABAJADOR", "ADMINISTRACION"] }),
    ).toBe("Persona registrada en el condominio como trabajador y administración.");
  });

  it("usa un mensaje genérico sin tipos", () => {
    expect(mensajeAlta({})).toBe("Persona registrada en el condominio.");
  });
});
