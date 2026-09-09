import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSetupPisos } from "@/composables/useSetupPisos";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({ condominioActualId: "cid-1" }),
}));

vi.mock("@/services/unidadesService", () => ({
  unidadesService: {
    getPisos: vi.fn(),
    crearPiso: vi.fn(),
    actualizarPiso: vi.fn(),
    desactivarPiso: vi.fn(),
  },
}));

import { unidadesService } from "@/services/unidadesService";

describe("useSetupPisos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga los pisos activos y los ordena por número (subterráneos primero)", async () => {
    unidadesService.getPisos.mockResolvedValue({
      data: [
        { id: "p1", numero: 1, nombre: "Piso 1", descripcion: "B", activo: true },
        { id: "p-1", numero: -1, nombre: "Subterráneo", descripcion: "A", activo: true },
        { id: "p10", numero: 10, nombre: "Piso 10", descripcion: "C", activo: true },
        { id: "p2", numero: 2, nombre: "Piso 2", descripcion: "D", activo: false },
      ],
    });
    const u = useSetupPisos();
    await u.cargar();
    expect(u.pisosHabilitados).toBe(true);
    expect(u.estado.items.map((x) => x.numero)).toEqual([-1, 1, 10]);
    expect(u.estado.items).toHaveLength(3); // el inactivo se excluye
    expect(u.estado.items[0].pisoId).toBe("p-1");
    expect(u.estado.items[0].esNuevo).toBe(false);
    expect(u.estado.items[0].original).toEqual({
      numero: -1,
      nombre: "Subterráneo",
      descripcion: "A",
    });
  });

  it("degrada con aviso si GET /pisos da 403 (cargo sin PISO_*)", async () => {
    unidadesService.getPisos.mockRejectedValue({ response: { status: 403 } });
    const u = useSetupPisos();
    await u.cargar();
    expect(u.pisosHabilitados).toBe(false);
    expect(u.estado.items).toEqual([]);
  });

  it("agregarFila crea una fila nueva; eliminarFila quita las nuevas y marca las existentes", () => {
    const u = useSetupPisos();
    u.estado.items = [
      { id: "a", pisoId: "p1", numero: 1, esNuevo: false, marcadoEliminar: false },
    ];
    u.agregarFila();
    expect(u.estado.items).toHaveLength(2);
    expect(u.estado.items[1].esNuevo).toBe(true);
    expect(u.estado.items[1].pisoId).toBeNull();

    u.eliminarFila(u.estado.items[1]);
    expect(u.estado.items).toHaveLength(1);

    u.eliminarFila(u.estado.items[0]);
    expect(u.estado.items[0].marcadoEliminar).toBe(true);
  });

  it("itemsValidos rechaza números vacíos y duplicados; permite eliminar todo", () => {
    const u = useSetupPisos();
    u.estado.items = [
      { id: "a", numero: 1, marcadoEliminar: false },
      { id: "b", numero: 1, marcadoEliminar: false },
    ];
    expect(u.itemsValidos).toBe(false);

    u.estado.items[1].numero = 2;
    expect(u.itemsValidos).toBe(true);

    u.estado.items[0].numero = null;
    expect(u.itemsValidos).toBe(false);

    u.estado.items = [
      { id: "a", numero: 1, marcadoEliminar: true },
      { id: "b", numero: 2, marcadoEliminar: true },
    ];
    expect(u.itemsValidos).toBe(true);
  });

  it("cambiado detecta cambios de número, nombre o descripción vs original", () => {
    const u = useSetupPisos();
    const x = {
      numero: 1,
      nombre: "A",
      descripcion: "d",
      original: { numero: 1, nombre: "A", descripcion: "d" },
    };
    expect(u.cambiado(x)).toBe(false);
    x.numero = 2;
    expect(u.cambiado(x)).toBe(true);
    x.numero = 1;
    x.nombre = "B";
    expect(u.cambiado(x)).toBe(true);
    x.nombre = "A";
    x.descripcion = "e";
    expect(u.cambiado(x)).toBe(true);
  });

  it("guardar crea nuevas, actualiza cambiadas y desactiva eliminadas", async () => {
    unidadesService.crearPiso.mockResolvedValue({ data: { id: "n1" } });
    unidadesService.actualizarPiso.mockResolvedValue({});
    unidadesService.desactivarPiso.mockResolvedValue({});
    const u = useSetupPisos();
    u.estado.items = [
      {
        id: "a",
        pisoId: "p1",
        numero: 1,
        nombre: "A",
        descripcion: "d",
        esNuevo: false,
        marcadoEliminar: false,
        original: { numero: 1, nombre: "A", descripcion: "d" },
      },
      {
        id: "b",
        pisoId: "p2",
        numero: 2,
        nombre: "B",
        descripcion: "d",
        esNuevo: false,
        marcadoEliminar: false,
        original: { numero: 2, nombre: "B", descripcion: "d2" },
      },
      {
        id: "c",
        pisoId: null,
        numero: 3,
        nombre: "C",
        descripcion: "",
        esNuevo: true,
        marcadoEliminar: false,
        original: null,
      },
      {
        id: "d",
        pisoId: "p3",
        numero: 4,
        nombre: "D",
        descripcion: "",
        esNuevo: false,
        marcadoEliminar: true,
        original: { numero: 4, nombre: "D", descripcion: "" },
      },
    ];
    const ok = await u.guardar();
    expect(ok).toBe(true);
    expect(unidadesService.crearPiso).toHaveBeenCalledWith("cid-1", {
      numero: 3,
      nombre: "C",
      descripcion: null,
    });
    expect(unidadesService.actualizarPiso).toHaveBeenCalledWith("cid-1", "p2", {
      numero: 2,
      nombre: "B",
      descripcion: "d",
      activo: true,
    });
    expect(unidadesService.desactivarPiso).toHaveBeenCalledWith("cid-1", "p3");
    expect(u.resultado).toEqual({ creados: 1, actualizados: 1, eliminados: 1 });
    expect(u.estado.items.some((x) => x.id === "d")).toBe(false);
    expect(u.estado.items.find((x) => x.id === "c").esNuevo).toBe(false);
  });

  it("un 409 al desactivar (piso en uso) se mapea a la fila sin abortar el resto", async () => {
    unidadesService.crearPiso.mockResolvedValue({ data: { id: "n1" } });
    unidadesService.desactivarPiso.mockRejectedValue({
      response: {
        data: {
          message:
            "El piso tiene 3 elemento(s) activo(s) asociado(s) (unidades: 3, bodegas: 0, estacionamientos: 0, espacios comunes: 0).",
        },
      },
    });
    const u = useSetupPisos();
    u.estado.items = [
      {
        id: "c",
        pisoId: null,
        numero: 3,
        nombre: "C",
        descripcion: "",
        esNuevo: true,
        marcadoEliminar: false,
        original: null,
      },
      {
        id: "d",
        pisoId: "p3",
        numero: 4,
        nombre: "D",
        descripcion: "",
        esNuevo: false,
        marcadoEliminar: true,
        original: { numero: 4, nombre: "D", descripcion: "" },
      },
    ];
    const ok = await u.guardar();
    expect(ok).toBe(false);
    expect(u.tieneErrores).toBe(true);
    const d = u.estado.items.find((x) => x.id === "d");
    expect(d.error).toContain("elemento(s) activo(s)");
    // La fila NO quedó eliminada: vuelve a su estado normal para reintentar.
    expect(d.marcadoEliminar).toBe(false);
    expect(u.estado.items.find((x) => x.id === "c").esNuevo).toBe(false);
    expect(u.resultado).toEqual({ creados: 1, actualizados: 0, eliminados: 0 });
  });

  it("un 409 al crear (número duplicado) se mapea a la fila y el resto continúa", async () => {
    unidadesService.crearPiso.mockRejectedValue({
      response: { data: { message: "Ya existe un piso con el número: 3" } },
    });
    unidadesService.actualizarPiso.mockResolvedValue({});
    const u = useSetupPisos();
    u.estado.items = [
      {
        id: "c",
        pisoId: null,
        numero: 3,
        nombre: "C",
        descripcion: "",
        esNuevo: true,
        marcadoEliminar: false,
        original: null,
      },
      {
        id: "b",
        pisoId: "p2",
        numero: 2,
        nombre: "B",
        descripcion: "d",
        esNuevo: false,
        marcadoEliminar: false,
        original: { numero: 2, nombre: "B", descripcion: "d2" },
      },
    ];
    const ok = await u.guardar();
    expect(ok).toBe(false);
    expect(u.estado.items.find((x) => x.id === "c").error).toContain("Ya existe");
    expect(unidadesService.actualizarPiso).toHaveBeenCalled();
    expect(u.resultado).toEqual({ creados: 0, actualizados: 1, eliminados: 0 });
  });
});
