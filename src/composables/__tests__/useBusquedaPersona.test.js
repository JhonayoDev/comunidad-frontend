import { describe, it, expect, vi } from "vitest";
import { useBusquedaPersona } from "@/composables/useBusquedaPersona";

const PERSONA = {
  id: "p-1",
  nombre: "Cintya Pérez",
  email: "cintya@gmail.com",
  rut: "12.345.678-5",
  telefono: null,
  activo: true,
  tieneUsuario: false,
};

function servicio(overrides = {}) {
  return {
    buscarPorEmail: vi.fn().mockResolvedValue({ data: PERSONA }),
    crear: vi.fn().mockResolvedValue({ data: PERSONA }),
    ...overrides,
  };
}

describe("useBusquedaPersona", () => {
  it("encuentra una persona por email", async () => {
    const api = servicio();
    const busqueda = useBusquedaPersona({ service: api });

    const encontrada = await busqueda.buscarPorEmail("cid", "cintya@gmail.com");

    expect(api.buscarPorEmail).toHaveBeenCalledWith("cid", "cintya@gmail.com");
    expect(encontrada).toEqual(PERSONA);
    expect(busqueda.persona.value).toEqual(PERSONA);
    expect(busqueda.consultado.value).toBe(true);
    expect(busqueda.noEncontrada.value).toBe(false);
    expect(busqueda.error.value).toBeNull();
    expect(busqueda.buscando.value).toBe(false);
  });

  it("marca noEncontrada cuando el backend responde 404", async () => {
    const api = servicio({
      buscarPorEmail: vi
        .fn()
        .mockRejectedValue({ response: { status: 404 } }),
    });
    const busqueda = useBusquedaPersona({ service: api });

    const encontrada = await busqueda.buscarPorEmail("cid", "nadie@correo.cl");

    expect(encontrada).toBeNull();
    expect(busqueda.noEncontrada.value).toBe(true);
    expect(busqueda.error.value).toBeNull();
    expect(busqueda.consultado.value).toBe(true);
  });

  it("expone el error cuando la búsqueda falla por otra razón", async () => {
    const error = { response: { status: 500 } };
    const api = servicio({
      buscarPorEmail: vi.fn().mockRejectedValue(error),
    });
    const busqueda = useBusquedaPersona({ service: api });

    const encontrada = await busqueda.buscarPorEmail("cid", "x@correo.cl");

    expect(encontrada).toBeNull();
    expect(busqueda.error.value?.response?.status).toBe(500);
    expect(busqueda.noEncontrada.value).toBe(false);
  });

  it("crea la persona cuando no existe", async () => {
    const api = servicio();
    const busqueda = useBusquedaPersona({ service: api });

    const resultado = await busqueda.crearOReutilizar("cid", {
      nombre: "Cintya Pérez",
      email: "cintya@gmail.com",
    });

    expect(resultado).toEqual({ persona: PERSONA, reutilizada: false });
    expect(api.crear).toHaveBeenCalledTimes(1);
    expect(api.buscarPorEmail).not.toHaveBeenCalled();
  });

  it("reutiliza la persona existente cuando el alta responde 409", async () => {
    const api = servicio({
      crear: vi.fn().mockRejectedValue({ response: { status: 409 } }),
    });
    const busqueda = useBusquedaPersona({ service: api });

    const resultado = await busqueda.crearOReutilizar("cid", {
      nombre: "Cintya Pérez",
      email: "cintya@gmail.com",
    });

    expect(resultado).toEqual({ persona: PERSONA, reutilizada: true });
    expect(api.buscarPorEmail).toHaveBeenCalledWith("cid", "cintya@gmail.com");
    expect(busqueda.persona.value).toEqual(PERSONA);
  });

  it("relanza el 409 si no logra recuperar la persona por email", async () => {
    const conflicto = { response: { status: 409 } };
    const api = servicio({
      crear: vi.fn().mockRejectedValue(conflicto),
      buscarPorEmail: vi
        .fn()
        .mockRejectedValue({ response: { status: 404 } }),
    });
    const busqueda = useBusquedaPersona({ service: api });

    await expect(
      busqueda.crearOReutilizar("cid", {
        nombre: "Duplicada",
        email: "duplicada@correo.cl",
      }),
    ).rejects.toBe(conflicto);
  });

  it("limpiar reinicia el estado de la búsqueda", async () => {
    const api = servicio();
    const busqueda = useBusquedaPersona({ service: api });

    await busqueda.buscarPorEmail("cid", "cintya@gmail.com");
    busqueda.limpiar();

    expect(busqueda.persona.value).toBeNull();
    expect(busqueda.consultado.value).toBe(false);
    expect(busqueda.noEncontrada.value).toBe(false);
    expect(busqueda.error.value).toBeNull();
    expect(busqueda.buscando.value).toBe(false);
  });
});
