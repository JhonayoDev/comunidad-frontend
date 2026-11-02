import { describe, it, expect } from "vitest";
import {
  ESTADO_PERSONA,
  estadoUsuarioPersona,
  esPreActivacionPersona,
  validarMotivoCambioEmail,
  mensajeCambioEmail,
} from "@/utils/personaEmail";

describe("personaEmail", () => {
  it("clasifica persona sin usuario", () => {
    const estado = estadoUsuarioPersona({ tieneUsuario: false });
    expect(estado.key).toBe(ESTADO_PERSONA.SIN_USUARIO);
    expect(estado.label).toBe("Sin usuario");
  });

  it("clasifica usuario sin contraseña como setup pendiente", () => {
    const estado = estadoUsuarioPersona({
      tieneUsuario: true,
      passwordSetAt: null,
    });
    expect(estado.key).toBe(ESTADO_PERSONA.SETUP_PENDIENTE);
  });

  it("prioriza setup pendiente sobre cambio pendiente", () => {
    const estado = estadoUsuarioPersona({
      tieneUsuario: true,
      passwordSetAt: null,
      emailCambioPendiente: "nuevo@correo.cl",
    });
    expect(estado.key).toBe(ESTADO_PERSONA.SETUP_PENDIENTE);
  });

  it("clasifica cambio de email pendiente", () => {
    const estado = estadoUsuarioPersona({
      tieneUsuario: true,
      passwordSetAt: "2026-11-02T10:00:00",
      emailCambioPendiente: "nuevo@correo.cl",
    });
    expect(estado.key).toBe(ESTADO_PERSONA.CAMBIO_PENDIENTE);
  });

  it("clasifica usuario activo", () => {
    const estado = estadoUsuarioPersona({
      tieneUsuario: true,
      passwordSetAt: "2026-11-02T10:00:00",
    });
    expect(estado.key).toBe(ESTADO_PERSONA.ACTIVO);
  });

  it("detecta pre-activación", () => {
    expect(esPreActivacionPersona({ tieneUsuario: false })).toBe(true);
    expect(
      esPreActivacionPersona({ tieneUsuario: true, passwordSetAt: null }),
    ).toBe(true);
    expect(
      esPreActivacionPersona({
        tieneUsuario: true,
        passwordSetAt: "2026-11-02T10:00:00",
      }),
    ).toBe(false);
  });

  it("valida motivo obligatorio y largo máximo", () => {
    expect(validarMotivoCambioEmail("")).toMatch(/al menos 10/);
    expect(validarMotivoCambioEmail("corto")).toMatch(/al menos 10/);
    expect(validarMotivoCambioEmail("x".repeat(501))).toMatch(/500/);
    expect(validarMotivoCambioEmail("Correo mal ingresado")).toBeNull();
  });

  it("arma mensaje de éxito según el estado del backend", () => {
    expect(
      mensajeCambioEmail(
        { estado: "PENDIENTE_VERIFICACION", emailPendiente: "nuevo@correo.cl" },
        "fallback@correo.cl",
      ),
    ).toContain("nuevo@correo.cl");
    expect(mensajeCambioEmail({ estado: "ACTUALIZADO" })).toContain(
      "No se envió correo automático",
    );
  });
});
