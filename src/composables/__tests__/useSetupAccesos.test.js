import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSetupAccesos } from "@/composables/useSetupAccesos";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({ condominioActualId: "cid-1" }),
}));

vi.mock("@/services/encomiendasService", () => ({
  encomiendasService: {
    getAccesosEncomiendas: vi.fn(),
    crearAccesoEncomiendas: vi.fn(),
    actualizarAccesoEncomiendas: vi.fn(),
    eliminarAccesoEncomiendas: vi.fn(),
  },
}));

import { encomiendasService } from "@/services/encomiendasService";

describe("useSetupAccesos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga los accesos activos y los ordena naturalmente", async () => {
    encomiendasService.getAccesosEncomiendas.mockResolvedValue({
      data: [
        { id: "a2", nombre: "Portón 10", activo: true },
        { id: "a1", nombre: "Portón 2", activo: true },
        { id: "a0", nombre: "Portón 1", activo: true },
        { id: "ax", nombre: "Viejo", activo: false },
      ],
    });
    const u = useSetupAccesos();
    await u.cargar();
    expect(u.accesosHabilitados).toBe(true);
    expect(u.estado.items.map((x) => x.nombre)).toEqual([
      "Portón 1",
      "Portón 2",
      "Portón 10",
    ]);
    expect(u.estado.items).toHaveLength(3); // el inactivo se excluye
    expect(u.estado.items[0].accesoId).toBe("a0");
    expect(u.estado.items[0].esNuevo).toBe(false);
    expect(u.estado.items[0].original).toEqual({ nombre: "Portón 1" });
  });

  it("degrada con aviso si GET accesos da 403 (cargo sin ENCOMIENDA_*)", async () => {
    encomiendasService.getAccesosEncomiendas.mockRejectedValue({ response: { status: 403 } });
    const u = useSetupAccesos();
    await u.cargar();
    expect(u.accesosHabilitados).toBe(false);
    expect(u.estado.items).toEqual([]);
  });

  it("agregarFila crea una fila nueva; eliminarFila quita las nuevas y marca las existentes", () => {
    const u = useSetupAccesos();
    u.estado.items = [
      { id: "a", accesoId: "a1", nombre: "A", esNuevo: false, marcadoEliminar: false },
    ];
    u.agregarFila();
    expect(u.estado.items).toHaveLength(2);
    expect(u.estado.items[1].esNuevo).toBe(true);
    expect(u.estado.items[1].accesoId).toBeNull();

    u.eliminarFila(u.estado.items[1]);
    expect(u.estado.items).toHaveLength(1);

    u.eliminarFila(u.estado.items[0]);
    expect(u.estado.items[0].marcadoEliminar).toBe(true);
  });

  it("itemsValidos rechaza vacíos, duplicados y >25; permite eliminar todo", () => {
    const u = useSetupAccesos();
    u.estado.items = [
      { id: "a", nombre: "A", marcadoEliminar: false },
      { id: "b", nombre: "a", marcadoEliminar: false },
    ];
    expect(u.itemsValidos).toBe(false); // duplicado ignore-case

    u.estado.items[1].nombre = "B";
    expect(u.itemsValidos).toBe(true);

    u.estado.items[0].nombre = "";
    expect(u.itemsValidos).toBe(false);

    u.estado.items[0].nombre = "x".repeat(26);
    expect(u.itemsValidos).toBe(false);

    u.estado.items = [
      { id: "a", nombre: "A", marcadoEliminar: true },
      { id: "b", nombre: "B", marcadoEliminar: true },
    ];
    expect(u.itemsValidos).toBe(true);
  });

  it("cambiado detecta cambios de nombre vs original", () => {
    const u = useSetupAccesos();
    const x = { nombre: "A", original: { nombre: "A" } };
    expect(u.cambiado(x)).toBe(false);
    x.nombre = "B";
    expect(u.cambiado(x)).toBe(true);
  });

  it("hayCambios refleja pendientes y queda limpio tras guardar", async () => {
    encomiendasService.crearAccesoEncomiendas.mockResolvedValue({ data: { id: "n1" } });
    const u = useSetupAccesos();
    expect(u.hayCambios).toBe(false);
    expect(u.pendientes.total).toBe(0);

    u.estado.items = [
      {
        id: "c",
        accesoId: null,
        nombre: "C",
        esNuevo: true,
        marcadoEliminar: false,
        original: null,
      },
      {
        id: "b",
        accesoId: "a2",
        nombre: "B",
        esNuevo: false,
        marcadoEliminar: false,
        original: { nombre: "B2" },
      },
    ];
    expect(u.hayCambios).toBe(true);
    expect(u.pendientes).toMatchObject({ nuevas: 1, editadas: 1, eliminadas: 0, total: 2 });

    const ok = await u.guardar();
    expect(ok).toBe(true);
    expect(u.hayCambios).toBe(false);
    expect(u.pendientes.total).toBe(0);
  });

  it("guardar crea nuevas, actualiza cambiadas y desactiva eliminadas", async () => {
    encomiendasService.crearAccesoEncomiendas.mockResolvedValue({ data: { id: "n1" } });
    encomiendasService.actualizarAccesoEncomiendas.mockResolvedValue({});
    encomiendasService.eliminarAccesoEncomiendas.mockResolvedValue({});
    const u = useSetupAccesos();
    u.estado.items = [
      {
        id: "a",
        accesoId: "a1",
        nombre: "A",
        esNuevo: false,
        marcadoEliminar: false,
        original: { nombre: "A" },
      },
      {
        id: "b",
        accesoId: "a2",
        nombre: "B",
        esNuevo: false,
        marcadoEliminar: false,
        original: { nombre: "B2" },
      },
      {
        id: "c",
        accesoId: null,
        nombre: "C",
        esNuevo: true,
        marcadoEliminar: false,
        original: null,
      },
      {
        id: "d",
        accesoId: "a3",
        nombre: "D",
        esNuevo: false,
        marcadoEliminar: true,
        original: { nombre: "D" },
      },
    ];
    const ok = await u.guardar();
    expect(ok).toBe(true);
    expect(encomiendasService.crearAccesoEncomiendas).toHaveBeenCalledWith("cid-1", { nombre: "C" });
    expect(encomiendasService.actualizarAccesoEncomiendas).toHaveBeenCalledWith("cid-1", "a2", {
      nombre: "B",
    });
    expect(encomiendasService.eliminarAccesoEncomiendas).toHaveBeenCalledWith("cid-1", "a3");
    expect(u.resultado).toEqual({ creados: 1, actualizados: 1, eliminados: 1 });
    expect(u.estado.items.some((x) => x.id === "d")).toBe(false);
    expect(u.estado.items.find((x) => x.id === "c").esNuevo).toBe(false);
  });

  it("un fallo al desactivar se mapea a la fila sin abortar el resto", async () => {
    encomiendasService.crearAccesoEncomiendas.mockResolvedValue({ data: { id: "n1" } });
    encomiendasService.eliminarAccesoEncomiendas.mockRejectedValue({
      response: { data: { message: "No se pudo desactivar" } },
    });
    const u = useSetupAccesos();
    u.estado.items = [
      {
        id: "c",
        accesoId: null,
        nombre: "C",
        esNuevo: true,
        marcadoEliminar: false,
        original: null,
      },
      {
        id: "d",
        accesoId: "a3",
        nombre: "D",
        esNuevo: false,
        marcadoEliminar: true,
        original: { nombre: "D" },
      },
    ];
    const ok = await u.guardar();
    expect(ok).toBe(false);
    expect(u.tieneErrores).toBe(true);
    const d = u.estado.items.find((x) => x.id === "d");
    expect(d.error).toContain("No se pudo desactivar");
    // La fila NO quedó eliminada: vuelve a su estado normal para reintentar.
    expect(d.marcadoEliminar).toBe(false);
    expect(u.estado.items.find((x) => x.id === "c").esNuevo).toBe(false);
    expect(u.resultado).toEqual({ creados: 1, actualizados: 0, eliminados: 0 });
  });

  it("un 400 al crear (nombre duplicado) se mapea a la fila y el resto continúa", async () => {
    encomiendasService.crearAccesoEncomiendas.mockRejectedValue({
      response: { data: { message: "Ya existe un acceso con el nombre 'C'" } },
    });
    encomiendasService.actualizarAccesoEncomiendas.mockResolvedValue({});
    const u = useSetupAccesos();
    u.estado.items = [
      {
        id: "c",
        accesoId: null,
        nombre: "C",
        esNuevo: true,
        marcadoEliminar: false,
        original: null,
      },
      {
        id: "b",
        accesoId: "a2",
        nombre: "B",
        esNuevo: false,
        marcadoEliminar: false,
        original: { nombre: "B2" },
      },
    ];
    const ok = await u.guardar();
    expect(ok).toBe(false);
    expect(u.estado.items.find((x) => x.id === "c").error).toContain("Ya existe");
    expect(encomiendasService.actualizarAccesoEncomiendas).toHaveBeenCalled();
    expect(u.resultado).toEqual({ creados: 0, actualizados: 1, eliminados: 0 });
  });
});
