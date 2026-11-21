import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// BroadcastChannel falso: el módulo cachea el canal en una variable privada,
// por eso cada test recarga el módulo (vi.resetModules) y usa una instancia
// nueva.
class CanalFalso {
  constructor(nombre) {
    this.nombre = nombre;
    this.enviados = [];
    this.oyentes = new Set();
    CanalFalso.ultimo = this;
  }

  postMessage(mensaje) {
    this.enviados.push(mensaje);
  }

  addEventListener(_tipo, callback) {
    this.oyentes.add(callback);
  }

  removeEventListener(_tipo, callback) {
    this.oyentes.delete(callback);
  }

  emitir(mensaje) {
    for (const oyente of this.oyentes) oyente({ data: mensaje });
  }
}

async function cargarModulo() {
  vi.resetModules();
  return import("@/utils/tokenBroadcast");
}

beforeEach(() => {
  CanalFalso.ultimo = null;
  vi.stubGlobal("BroadcastChannel", CanalFalso);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("tokenBroadcast — rotación de token", () => {
  it("publica el token rotado en el canal del origen", async () => {
    const { emitirTokenRotado } = await cargarModulo();

    emitirTokenRotado("token-123");

    expect(CanalFalso.ultimo.nombre).toBe("Briku:auth");
    expect(CanalFalso.ultimo.enviados).toEqual([
      { type: "token-rotado", token: "token-123" },
    ]);
  });

  it("solo entrega mensajes de token rotado con token", async () => {
    const { suscribirseARotacionToken } = await cargarModulo();
    const recibidos = [];
    suscribirseARotacionToken((token) => recibidos.push(token));

    const canal = CanalFalso.ultimo;
    canal.emitir({ type: "sesion-cerrada" });
    canal.emitir({ type: "token-rotado" });
    canal.emitir({ type: "token-rotado", token: "abc" });

    expect(recibidos).toEqual(["abc"]);
  });
});

describe("tokenBroadcast — cierre de sesión entre pestañas", () => {
  it("publica el aviso de sesión cerrada", async () => {
    const { emitirSesionCerrada } = await cargarModulo();

    emitirSesionCerrada();

    expect(CanalFalso.ultimo.enviados).toEqual([{ type: "sesion-cerrada" }]);
  });

  it("invoca al callback al recibir el aviso", async () => {
    const { suscribirseACierreSesion } = await cargarModulo();
    const callback = vi.fn();
    suscribirseACierreSesion(callback);

    const canal = CanalFalso.ultimo;
    canal.emitir({ type: "token-rotado", token: "xyz" });
    expect(callback).not.toHaveBeenCalled();

    canal.emitir({ type: "sesion-cerrada" });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("el desuscriptor deja de escuchar", async () => {
    const { suscribirseACierreSesion } = await cargarModulo();
    const callback = vi.fn();
    const desuscribir = suscribirseACierreSesion(callback);
    const canal = CanalFalso.ultimo;

    desuscribir();
    canal.emitir({ type: "sesion-cerrada" });

    expect(callback).not.toHaveBeenCalled();
    expect(canal.oyentes.size).toBe(0);
  });
});

describe("tokenBroadcast — navegador sin BroadcastChannel", () => {
  it("no rompe y devuelve un desuscriptor no-op", async () => {
    vi.stubGlobal("BroadcastChannel", undefined);
    const { emitirTokenRotado, emitirSesionCerrada, suscribirseACierreSesion } =
      await cargarModulo();

    expect(() => emitirTokenRotado("t")).not.toThrow();
    expect(() => emitirSesionCerrada()).not.toThrow();
    expect(typeof suscribirseACierreSesion(() => {})).toBe("function");
  });
});
