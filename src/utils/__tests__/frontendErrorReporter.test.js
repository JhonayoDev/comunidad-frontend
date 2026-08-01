import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  instalarManejadorGlobalErrores,
  reportarError,
  marcarHito,
} from "@/utils/frontendErrorReporter";

describe("frontendErrorReporter", () => {
  let sendBeacon;

  beforeEach(() => {
    localStorage.clear();
    sendBeacon = vi.fn(() => true);
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeacon,
      configurable: true,
    });
    document.body.innerHTML = "";
    instalarManejadorGlobalErrores();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("registra un hito de boot en localStorage", () => {
    marcarHito("boot:test");

    const hitos = JSON.parse(localStorage.getItem("comunidad:frontend-hitos"));
    expect(hitos.at(-1).hito).toBe("boot:test");
  });

  it("persiste el error en localStorage y muestra overlay", () => {
    reportarError("test", new Error("boom"));

    const errores = JSON.parse(localStorage.getItem("comunidad:frontend-errors"));
    expect(errores.at(-1)).toMatchObject({
      origen: "test",
      mensaje: "boom",
    });

    const overlay = document.body.querySelector("[data-frontend-error]");
    expect(overlay).not.toBeNull();
    expect(overlay.querySelector("pre").textContent).toContain("boom");
  });

  it("limita la cantidad de errores persistidos", () => {
    for (let i = 0; i < 10; i += 1) reportarError("test", new Error(`e${i}`));

    const errores = JSON.parse(localStorage.getItem("comunidad:frontend-errors"));
    expect(errores.length).toBe(5);
    expect(errores[0].mensaje).toBe("e5");
  });

  it("captura window.onerror (error global de JS)", () => {
    window.dispatchEvent(
      new ErrorEvent("error", { error: new Error("js-muerto") }),
    );

    const errores = JSON.parse(localStorage.getItem("comunidad:frontend-errors"));
    expect(errores.at(-1).origen).toBe("window.onerror");
    expect(errores.at(-1).mensaje).toBe("js-muerto");
  });

  it("captura promesas rechazadas no manejadas", () => {
    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: new Promise(() => {}),
        reason: new Error("rechazada"),
      }),
    );

    const errores = JSON.parse(localStorage.getItem("comunidad:frontend-errors"));
    expect(errores.at(-1).origen).toBe("unhandledrejection");
  });

  it("captura errores de recurso (chunk 404) como 'recurso'", () => {
    const img = document.createElement("img");
    img.src = "/assets/roto.js";
    document.body.appendChild(img);
    img.dispatchEvent(new Event("error")); // los resource errors NO burbujean

    const errores = JSON.parse(localStorage.getItem("comunidad:frontend-errors"));
    expect(errores.at(-1).origen).toBe("recurso");
    expect(errores.at(-1).mensaje).toContain("roto.js");
  });

  it("hace beacon de los hitos y errores", () => {
    marcarHito("boot:beacon");
    reportarError("test", new Error("alerta"));

    expect(sendBeacon).toHaveBeenCalledWith(
      expect.stringContaining("/__frontend-boot"),
      expect.any(Blob),
    );
    expect(sendBeacon).toHaveBeenCalledWith(
      expect.stringContaining("/__frontend-error"),
      expect.any(Blob),
    );
  });
});
