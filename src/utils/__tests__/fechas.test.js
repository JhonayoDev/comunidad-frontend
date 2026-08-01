import { describe, it, expect } from "vitest";
import { formatearHora, formatearFecha } from "@/utils/fechas";

describe("fechas", () => {
  it("formatea hora corta", () => {
    expect(formatearHora("2026-08-01T21:30:00")).toContain(":30");
  });

  it("devuelve '' para fecha inválida (nunca lanza RangeError)", () => {
    expect(formatearHora(null)).toBe("");
    expect(formatearHora(undefined)).toBe("");
    expect(formatearHora("")).toBe("");
    expect(formatearHora("no-es-una-fecha")).toBe("");
    expect(formatearHora("999999-99-99")).toBe("");
  });

  it("devuelve '' para fecha inválida en el formateador de fecha", () => {
    expect(formatearFecha(undefined)).toBe("");
    expect(formatearFecha("basura")).toBe("");
  });

  it("formatea fecha sin lanzar (locale-agnóstico)", () => {
    expect(() => formatearFecha("2026-08-01")).not.toThrow();
    expect(formatearFecha("2026-08-01")).toContain("2026");
  });
});
