import { describe, it, expect } from "vitest";
import {
  digitoVerificador,
  formatearRut,
  formatearRutCompleto,
  rutValido,
  normalizarRut,
  formatearTelefono,
  limpiarTelefono,
  telefonoChileValido,
  normalizarTelefono,
  emailValido,
  normalizarEmail,
  nombreValido,
} from "@/utils/validadoresChile";

describe("RUT", () => {
  it("calcula el dígito verificador", () => {
    expect(digitoVerificador("12345678")).toBe("5");
    expect(digitoVerificador("1234567")).toBe("4");
    expect(digitoVerificador("40000000")).toBe("K");
    expect(digitoVerificador("11111111")).toBe("1");
  });

  it("formatea en vivo con puntos y guion", () => {
    expect(formatearRut("12345678")).toBe("12.345.678");
    expect(formatearRut("123456789")).toBe("12.345.678-9");
    expect(formatearRut("12345678k")).toBe("12.345.678-K");
    expect(formatearRut("12.345.678-9")).toBe("12.345.678-9");
    expect(formatearRut("")).toBe("");
    expect(formatearRut("abc")).toBe("");
  });

  it("formatea completo en blur (agrega guion si el DV es válido)", () => {
    expect(formatearRutCompleto("123456785")).toBe("12.345.678-5");
    expect(formatearRutCompleto("12345674")).toBe("1.234.567-4");
    expect(formatearRutCompleto("123456789")).toBe("12.345.678-9");
  });

  it("valida RUT por algoritmo", () => {
    expect(rutValido("12.345.678-5")).toBe(true);
    expect(rutValido("123456785")).toBe(true);
    expect(rutValido("1.234.567-4")).toBe(true);
    expect(rutValido("40.000.000-K")).toBe(true);
    expect(rutValido("40.000.000-k")).toBe(true);
    expect(rutValido("12.345.678-9")).toBe(false);
    expect(rutValido("11.111.111-5")).toBe(false);
    expect(rutValido("12345")).toBe(false);
    expect(rutValido("")).toBe(false);
    expect(rutValido(null)).toBe(false);
  });

  it("normaliza al formato canónico de la BD", () => {
    expect(normalizarRut("123456785")).toBe("12.345.678-5");
    expect(normalizarRut("12345674")).toBe("1.234.567-4");
  });
});

describe("Teléfono", () => {
  it("formatea en vivo móvil y fijo", () => {
    expect(formatearTelefono("912345678")).toBe("+56 9 1234 5678");
    expect(formatearTelefono("56912345678")).toBe("+56 9 1234 5678");
    expect(formatearTelefono("0912345678")).toBe("+56 9 1234 5678");
    expect(formatearTelefono("212345678")).toBe("+56 2 1234 5678");
    expect(formatearTelefono("")).toBe("");
  });

  it("no absorbe el prefijo +56 al re-procesar el valor formateado", () => {
    expect(formatearTelefono("+56 9")).toBe("+56 9");
    expect(formatearTelefono("+56 95")).toBe("+56 9 5");
    expect(formatearTelefono("+56 9 1234 5678")).toBe("+56 9 1234 5678");
    expect(limpiarTelefono("+56 9")).toBe("9");
    expect(limpiarTelefono("+56 9 1234 5678")).toBe("912345678");
  });

  it("valida teléfonos chilenos (móvil y fijo)", () => {
    expect(telefonoChileValido("912345678")).toBe(true);
    expect(telefonoChileValido("212345678")).toBe(true);
    expect(telefonoChileValido("+56 9 1234 5678")).toBe(true);
    expect(telefonoChileValido("12345678")).toBe(false);
    expect(telefonoChileValido("712345678")).toBe(false);
    expect(telefonoChileValido("")).toBe(false);
  });

  it("normaliza al formato +56XXXXXXXX de la BD", () => {
    expect(normalizarTelefono("+56 9 1234 5678")).toBe("+56912345678");
    expect(normalizarTelefono("212345678")).toBe("+56212345678");
  });
});

describe("Email", () => {
  it("valida emails", () => {
    expect(emailValido("juan@dominio.cl")).toBe(true);
    expect(emailValido("juan.perez@sub.dominio.com")).toBe(true);
    expect(emailValido("juan@dominio")).toBe(false);
    expect(emailValido("juan dominio.cl")).toBe(false);
    expect(emailValido("")).toBe(false);
    expect(emailValido(null)).toBe(false);
  });

  it("normaliza a minúsculas sin espacios", () => {
    expect(normalizarEmail("  Juan@Dominio.CL  ")).toBe("juan@dominio.cl");
  });
});

describe("Nombre", () => {
  it("valida nombres", () => {
    expect(nombreValido("Condominio Los Cipreses")).toBe(true);
    expect(nombreValido("María José")).toBe(true);
    expect(nombreValido("A")).toBe(false);
    expect(nombreValido("")).toBe(false);
    expect(nombreValido("123")).toBe(false);
    expect(nombreValido("Condominio@")).toBe(false);
  });
});