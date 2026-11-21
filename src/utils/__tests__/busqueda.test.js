import { describe, it, expect } from "vitest";
import {
  coincidePersona,
  esEmailCompleto,
  esRutCompleto,
  identidadDeBusqueda,
  normalizarRutBusqueda,
  normalizarTexto,
  tokensDeBusqueda,
} from "@/utils/busqueda";

const CINTYA = {
  nombre: "Cintya Muñoz Pérez",
  email: "cintya@gmail.com",
  rut: "12.345.678-5",
  telefono: "+56 9 1234 5678",
  cargo: null,
  unidadPrincipal: null,
  tiposParticipacion: [],
};

describe("normalizarTexto", () => {
  it("pasa a minúsculas, quita acentos y colapsa espacios", () => {
    expect(normalizarTexto("  MUÑOZ   Pérez ")).toBe("munoz perez");
    expect(normalizarTexto(null)).toBe("");
  });
});

describe("normalizarRutBusqueda", () => {
  it("deja solo dígitos y DV en mayúscula", () => {
    expect(normalizarRutBusqueda("12.345.678-k")).toBe("12345678K");
    expect(normalizarRutBusqueda("")).toBe("");
  });
});

describe("tokensDeBusqueda", () => {
  it("separa por espacios y normaliza", () => {
    expect(tokensDeBusqueda("  Juan   Pérez ")).toEqual(["juan", "perez"]);
    expect(tokensDeBusqueda("")).toEqual([]);
  });
});

describe("coincidePersona", () => {
  it("encuentra por nombre sin acentos y en cualquier orden", () => {
    expect(coincidePersona(CINTYA, "cintya munoz")).toBe(true);
    expect(coincidePersona(CINTYA, "munoz cintya")).toBe(true);
    expect(coincidePersona(CINTYA, "PÉREZ")).toBe(true);
  });

  it("encuentra por email sin distinguir mayúsculas", () => {
    expect(coincidePersona(CINTYA, "CINTYA@GMAIL.COM")).toBe(true);
    expect(coincidePersona(CINTYA, "cintya@gmail.com")).toBe(true);
  });

  it("encuentra por RUT completo, con o sin formato", () => {
    expect(coincidePersona(CINTYA, "12.345.678-5")).toBe(true);
    expect(coincidePersona(CINTYA, "12345678")).toBe(true);
  });

  it("encuentra por RUT parcial (el backend no lo permite)", () => {
    expect(coincidePersona(CINTYA, "12345")).toBe(true);
    expect(coincidePersona(CINTYA, "2345")).toBe(true);
  });

  it("encuentra por teléfono en cualquier formato", () => {
    expect(coincidePersona(CINTYA, "1234")).toBe(true);
    expect(coincidePersona(CINTYA, "+56 9 1234")).toBe(true);
  });

  it("encuentra por cargo y por casa", () => {
    expect(
      coincidePersona({ ...CINTYA, cargo: "JARDINERO" }, "jardinero"),
    ).toBe(true);
    expect(
      coincidePersona({ ...CINTYA, unidadPrincipal: "Casa 12" }, "12"),
    ).toBe(true);
  });

  it("busca también en las etiquetas derivadas (participación y estado)", () => {
    expect(coincidePersona(CINTYA, "propietario", ["Propietario"])).toBe(true);
    expect(coincidePersona(CINTYA, "inactiva", ["Inactiva"])).toBe(true);
  });

  it("exige que todos los tokens coincidan", () => {
    expect(coincidePersona(CINTYA, "cintya pedro")).toBe(false);
    expect(coincidePersona(CINTYA, "pedro")).toBe(false);
  });

  it("con consulta vacía deja pasar a todas las personas", () => {
    expect(coincidePersona(CINTYA, "")).toBe(true);
    expect(coincidePersona(CINTYA, "   ")).toBe(true);
  });

  it("tolera persona nula", () => {
    expect(coincidePersona(null, "cintya")).toBe(false);
  });

  it("ignora puntuación en los bordes del token", () => {
    expect(coincidePersona(CINTYA, "cintya,")).toBe(true);
  });
});

describe("detección de identidad global", () => {
  it("reconoce un email completo", () => {
    expect(esEmailCompleto("cintya@gmail.com")).toBe(true);
    expect(esEmailCompleto("cintya@")).toBe(false);
  });

  it("reconoce un RUT completo y válido", () => {
    expect(esRutCompleto("12.345.678-5")).toBe(true);
    expect(esRutCompleto("12.345.678-9")).toBe(false);
    expect(esRutCompleto("12345")).toBe(false);
  });

  it("devuelve el tipo y el valor normalizado", () => {
    expect(identidadDeBusqueda(" Cintya@Gmail.com ")).toEqual({
      tipo: "email",
      valor: "cintya@gmail.com",
    });
    expect(identidadDeBusqueda("12345678-5")).toEqual({
      tipo: "rut",
      valor: "12.345.678-5",
    });
  });

  it("no detecta identidad con un nombre o un email incompleto", () => {
    expect(identidadDeBusqueda("Cintya Muñoz")).toBeNull();
    expect(identidadDeBusqueda("cintya@")).toBeNull();
    expect(identidadDeBusqueda("")).toBeNull();
  });
});
