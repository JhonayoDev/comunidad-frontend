import { describe, it, expect, vi } from "vitest";
import { useBusquedaPersona } from "@/composables/useBusquedaPersona";

const PERSONA = {
  id: "p-1",
  nombre: "Cintya Pérez",
  email: "cintya@gmail.com",
  rut: "12.345.678-5",
  telefono: null,
  activo: true,
  membresias: [
    {
      condominioId: "c-1",
      condominioNombre: "Los Aromos",
      estado: "ACTIVO",
      tipoAlta: "RESIDENTE",
    },
  ],
};

function servicio(overrides = {}) {
  return {
    buscar: vi.fn().mockResolvedValue({ data: PERSONA }),
    ...overrides,
  };
}

describe("useBusquedaPersona", () => {
  it("busca por email y expone la persona con sus membresías", async () => {
    const api = servicio();
    const busqueda = useBusquedaPersona({ service: api });

    const encontrada = await busqueda.buscarPorEmail("cid", "cintya@gmail.com");

    expect(api.buscar).toHaveBeenCalledWith("cid", {
      email: "cintya@gmail.com",
    });
    expect(encontrada).toEqual(PERSONA);
    expect(busqueda.persona.value).toEqual(PERSONA);
    expect(busqueda.consultado.value).toBe(true);
    expect(busqueda.noEncontrada.value).toBe(false);
    expect(busqueda.error.value).toBeNull();
    expect(busqueda.buscando.value).toBe(false);
  });

  it("busca por RUT", async () => {
    const api = servicio();
    const busqueda = useBusquedaPersona({ service: api });

    await busqueda.buscarPorRut("cid", "12345678-5");

    expect(api.buscar).toHaveBeenCalledWith("cid", { rut: "12345678-5" });
  });

  it("marca noEncontrada cuando el backend responde 404", async () => {
    const api = servicio({
      buscar: vi.fn().mockRejectedValue({ response: { status: 404 } }),
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
      buscar: vi.fn().mockRejectedValue(error),
    });
    const busqueda = useBusquedaPersona({ service: api });

    const encontrada = await busqueda.buscarPorEmail("cid", "x@correo.cl");

    expect(encontrada).toBeNull();
    expect(busqueda.error.value?.response?.status).toBe(500);
    expect(busqueda.noEncontrada.value).toBe(false);
  });

  it("descarta el resultado de una búsqueda anterior (anti-race)", async () => {
    let resolverPrimera;
    let resolverSegunda;
    const api = servicio({
      buscar: vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolverPrimera = resolve;
            }),
        )
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolverSegunda = resolve;
            }),
        ),
    });
    const busqueda = useBusquedaPersona({ service: api });

    const primera = busqueda.buscarPorEmail("cid", "vieja@correo.cl");
    const segunda = busqueda.buscarPorEmail("cid", "nueva@correo.cl");

    resolverSegunda({ data: { ...PERSONA, id: "p-2" } });
    await segunda;
    resolverPrimera({ data: PERSONA });
    await primera;

    expect(busqueda.persona.value?.id).toBe("p-2");
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
