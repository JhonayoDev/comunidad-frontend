import { describe, it, expect } from "vitest";
import {
  esErrorModuloNoContratado,
  esErrorPlan,
  mensajeError,
} from "@/utils/errores";

describe("errores", () => {
  describe("esErrorModuloNoContratado", () => {
    it("detecta el 403 por módulo no suscrito por el message del backend", () => {
      const error = {
        response: {
          status: 403,
          data: {
            message: "El condominio no tiene suscrito el módulo COMUNICACION",
          },
        },
      };
      expect(esErrorModuloNoContratado(error)).toBe(true);
    });

    it("respeta la bandera moduleNotSubscribed adjuntada por el interceptor", () => {
      expect(esErrorModuloNoContratado({ moduleNotSubscribed: true })).toBe(true);
    });

    it("NO confunde un 403 por permisos con uno por módulo", () => {
      const error = {
        response: {
          status: 403,
          data: { message: "No tienes permisos para realizar esta acción" },
        },
      };
      expect(esErrorModuloNoContratado(error)).toBe(false);
    });

    it("devuelve false ante errores sin status 403", () => {
      expect(esErrorModuloNoContratado({ response: { status: 500 } })).toBe(false);
      expect(esErrorModuloNoContratado(null)).toBe(false);
      expect(esErrorModuloNoContratado(undefined)).toBe(false);
    });
  });

  describe("esErrorPlan", () => {
    it("detecta el 409 por límite de plan", () => {
      expect(esErrorPlan({ response: { status: 409 } })).toBe(true);
    });

    it("devuelve false ante otros códigos", () => {
      expect(esErrorPlan({ response: { status: 400 } })).toBe(false);
      expect(esErrorPlan(null)).toBe(false);
    });
  });

  describe("mensajeError", () => {
    it("prioriza el message del backend", () => {
      const error = {
        response: { data: { message: "El plan permite hasta 100 unidades" } },
      };
      expect(mensajeError(error, "fallback")).toBe("El plan permite hasta 100 unidades");
    });

    it("cae al mensaje nativo y luego al fallback", () => {
      expect(mensajeError({ message: "network" }, "fb")).toBe("network");
      expect(mensajeError(null, "fb")).toBe("fb");
      expect(mensajeError({ response: { data: { message: "" } } }, "fb")).toBe("fb");
    });
  });
});