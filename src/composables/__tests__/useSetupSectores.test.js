import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSetupSectores } from "@/composables/useSetupSectores";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({ condominioActualId: "cid-1" }),
}));

vi.mock("@/services/unidadesService", () => ({
  unidadesService: {
    getSectores: vi.fn(),
    crearSector: vi.fn(),
    actualizarSector: vi.fn(),
    desactivarSector: vi.fn(),
  },
}));

import { unidadesService } from "@/services/unidadesService";

describe("useSetupSectores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga los sectores activos y los ordena naturalmente", async () => {
    unidadesService.getSectores.mockResolvedValue({
      data: [
        { id: "s2", nombre: "Sector 10", descripcion: "B", activo: true },
        { id: "s1", nombre: "Sector 2", descripcion: "A", activo: true },
        { id: "s3", nombre: "Sector 1", descripcion: "C", activo: true },
        { id: "s4", nombre: "Sector viejo", descripcion: "D", activo: false },
      ],
    });
    const u = useSetupSectores();
    await u.cargar();
    expect(u.sectoresHabilitados).toBe(true);
    expect(u.estado.items.map((x) => x.nombre)).toEqual([
      "Sector 1",
      "Sector 2",
      "Sector 10",
    ]);
    expect(u.estado.items).toHaveLength(3); // el inactivo se excluye
    expect(u.estado.items[0].sectorId).toBe("s3");
    expect(u.estado.items[0].esNuevo).toBe(false);
    expect(u.estado.items[0].original).toEqual({ nombre: "Sector 1", descripcion: "C" });
  });

  it("degrada con aviso si GET /sectores da 403 (cargo sin SECTOR_*)", async () => {
    unidadesService.getSectores.mockRejectedValue({ response: { status: 403 } });
    const u = useSetupSectores();
    await u.cargar();
    expect(u.sectoresHabilitados).toBe(false);
    expect(u.estado.items).toEqual([]);
  });

  it("agregarFila crea una fila nueva; eliminarFila quita las nuevas y marca las existentes", () => {
    const u = useSetupSectores();
    u.estado.items = [
      { id: "a", sectorId: "s1", nombre: "A", esNuevo: false, marcadoEliminar: false },
    ];
    u.agregarFila();
    expect(u.estado.items).toHaveLength(2);
    expect(u.estado.items[1].esNuevo).toBe(true);
    expect(u.estado.items[1].sectorId).toBeNull();

    u.eliminarFila(u.estado.items[1]);
    expect(u.estado.items).toHaveLength(1);

    u.eliminarFila(u.estado.items[0]);
    expect(u.estado.items[0].marcadoEliminar).toBe(true);
  });

  it("itemsValidos rechaza nombres vacíos y duplicados; permite eliminar todo", () => {
    const u = useSetupSectores();
    u.estado.items = [
      { id: "a", nombre: "A", marcadoEliminar: false },
      { id: "b", nombre: "A", marcadoEliminar: false },
    ];
    expect(u.itemsValidos).toBe(false);

    u.estado.items[1].nombre = "B";
    expect(u.itemsValidos).toBe(true);

    u.estado.items[0].nombre = "";
    expect(u.itemsValidos).toBe(false);

    u.estado.items = [
      { id: "a", nombre: "A", marcadoEliminar: true },
      { id: "b", nombre: "B", marcadoEliminar: true },
    ];
    expect(u.itemsValidos).toBe(true);
  });

  it("cambiado detecta cambios de nombre o descripción vs original", () => {
    const u = useSetupSectores();
    const x = { nombre: "A", descripcion: "d", original: { nombre: "A", descripcion: "d" } };
    expect(u.cambiado(x)).toBe(false);
    x.nombre = "B";
    expect(u.cambiado(x)).toBe(true);
    x.nombre = "A";
    x.descripcion = "e";
    expect(u.cambiado(x)).toBe(true);
  });

  it("guardar crea nuevas, actualiza cambiadas y desactiva eliminadas", async () => {
    unidadesService.crearSector.mockResolvedValue({ data: { id: "n1" } });
    unidadesService.actualizarSector.mockResolvedValue({});
    unidadesService.desactivarSector.mockResolvedValue({});
    const u = useSetupSectores();
    u.estado.items = [
      {
        id: "a",
        sectorId: "s1",
        nombre: "A",
        descripcion: "d",
        esNuevo: false,
        marcadoEliminar: false,
        original: { nombre: "A", descripcion: "d" },
      },
      {
        id: "b",
        sectorId: "s2",
        nombre: "B",
        descripcion: "d",
        esNuevo: false,
        marcadoEliminar: false,
        original: { nombre: "B", descripcion: "d2" },
      },
      {
        id: "c",
        sectorId: null,
        nombre: "C",
        descripcion: "",
        esNuevo: true,
        marcadoEliminar: false,
        original: null,
      },
      {
        id: "d",
        sectorId: "s3",
        nombre: "D",
        descripcion: "",
        esNuevo: false,
        marcadoEliminar: true,
        original: { nombre: "D", descripcion: "" },
      },
    ];
    const ok = await u.guardar();
    expect(ok).toBe(true);
    expect(unidadesService.crearSector).toHaveBeenCalledWith("cid-1", { nombre: "C", descripcion: "" });
    expect(unidadesService.actualizarSector).toHaveBeenCalledWith("cid-1", "s2", {
      nombre: "B",
      descripcion: "d",
      activo: true,
    });
    expect(unidadesService.desactivarSector).toHaveBeenCalledWith("cid-1", "s3");
    expect(u.resultado).toEqual({ creados: 1, actualizados: 1, eliminados: 1 });
    expect(u.estado.items.some((x) => x.id === "d")).toBe(false);
    expect(u.estado.items.find((x) => x.id === "c").esNuevo).toBe(false);
  });

  it("un 409 al desactivar (sector en uso) se mapea a la fila sin abortar el resto", async () => {
    unidadesService.crearSector.mockResolvedValue({ data: { id: "n1" } });
    unidadesService.desactivarSector.mockRejectedValue({
      response: { data: { message: "El sector D tiene 3 unidades activas" } },
    });
    const u = useSetupSectores();
    u.estado.items = [
      {
        id: "c",
        sectorId: null,
        nombre: "C",
        descripcion: "",
        esNuevo: true,
        marcadoEliminar: false,
        original: null,
      },
      {
        id: "d",
        sectorId: "s3",
        nombre: "D",
        descripcion: "",
        esNuevo: false,
        marcadoEliminar: true,
        original: { nombre: "D", descripcion: "" },
      },
    ];
    const ok = await u.guardar();
    expect(ok).toBe(false);
    expect(u.tieneErrores).toBe(true);
    const d = u.estado.items.find((x) => x.id === "d");
    expect(d.error).toContain("3 unidades activas");
    // La fila NO quedó eliminada: vuelve a su estado normal para reintentar.
    expect(d.marcadoEliminar).toBe(false);
    expect(u.estado.items.find((x) => x.id === "c").esNuevo).toBe(false);
    expect(u.resultado).toEqual({ creados: 1, actualizados: 0, eliminados: 0 });
  });

  it("un 409 al crear (nombre duplicado) se mapea a la fila y el resto continúa", async () => {
    unidadesService.crearSector.mockRejectedValue({
      response: { data: { message: "Ya existe un sector con el nombre 'C'" } },
    });
    unidadesService.actualizarSector.mockResolvedValue({});
    const u = useSetupSectores();
    u.estado.items = [
      {
        id: "c",
        sectorId: null,
        nombre: "C",
        descripcion: "",
        esNuevo: true,
        marcadoEliminar: false,
        original: null,
      },
      {
        id: "b",
        sectorId: "s2",
        nombre: "B",
        descripcion: "d",
        esNuevo: false,
        marcadoEliminar: false,
        original: { nombre: "B", descripcion: "d2" },
      },
    ];
    const ok = await u.guardar();
    expect(ok).toBe(false);
    expect(u.estado.items.find((x) => x.id === "c").error).toContain("Ya existe");
    expect(unidadesService.actualizarSector).toHaveBeenCalled();
    expect(u.resultado).toEqual({ creados: 0, actualizados: 1, eliminados: 0 });
  });
});