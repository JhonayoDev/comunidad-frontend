import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSetupEntidades, PASOS_ENTIDADES } from "@/composables/useSetupEntidades";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({ condominioActualId: "cid-1" }),
}));

vi.mock("@/services/unidadesService", () => ({
  unidadesService: {
    getSectores: vi.fn(),
    getCapacidad: vi.fn(),
    crearSectoresBatch: vi.fn(),
  },
}));

vi.mock("@/services/estacionamientosService", () => ({
  estacionamientosService: {
    crearEstacionamientosBatch: vi.fn(),
  },
}));

vi.mock("@/services/bodegasService", () => ({
  bodegasService: {
    crearBodegasBatch: vi.fn(),
  },
}));

import { unidadesService } from "@/services/unidadesService";
import { estacionamientosService } from "@/services/estacionamientosService";
import { bodegasService } from "@/services/bodegasService";

describe("useSetupEntidades", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("expone las 5 fases del wizard", () => {
    expect(PASOS_ENTIDADES).toHaveLength(5);
    expect(PASOS_ENTIDADES[0].label).toBe("Cantidad y prefijo");
  });

  it("valida la fase 1 (cantidad) y avanza a la 2", () => {
    const u = useSetupEntidades({ entidad: "estacionamiento" });
    u.estado.cantidad = 4;
    expect(u.validoPaso(1)).toBe(true);
    u.siguiente();
    expect(u.estado.paso).toBe(2);
  });

  it("no avanza de la fase 1 sin cantidad válida", () => {
    const u = useSetupEntidades({ entidad: "estacionamiento" });
    u.estado.cantidad = 0;
    expect(u.validoPaso(1)).toBe(false);
    u.siguiente();
    expect(u.estado.paso).toBe(1);
  });

  it("genera los ítems en la transición de numeración a sectores (por-piso con subterráneos)", () => {
    const u = useSetupEntidades({ entidad: "estacionamiento" });
    u.estado.modo = "por-piso";
    u.estado.pisos = "1,-1";
    u.estado.porPiso = 2;
    u.estado.paso = 2;
    u.siguiente();
    expect(u.estado.paso).toBe(3);
    expect(u.estado.items.map((x) => x.nombre)).toEqual(["E-1", "E-2", "E-3", "E-4"]);
    expect(u.estado.items[0].piso).toBe(1);
    expect(u.estado.items[2].piso).toBe(-1);
  });

  it("correlativo usa el prefijo editable (EV- para visitas)", () => {
    const u = useSetupEntidades({ entidad: "estacionamiento" });
    u.estado.prefijo = "EV-";
    u.estado.modo = "correlativo";
    u.estado.desde = "1";
    u.estado.cantidad = 2;
    u.generarItems();
    expect(u.estado.items.map((x) => x.nombre)).toEqual(["EV-1", "EV-2"]);
  });

  it("preserva la asignación por nombre al regenerar la lista", () => {
    const u = useSetupEntidades({ entidad: "estacionamiento" });
    u.estado.modo = "por-piso";
    u.estado.pisos = "1";
    u.estado.porPiso = 2;
    u.generarItems();
    u.estado.items[0].sectorRef = "sec-1";
    u.generarItems();
    expect(u.estado.items[0].sectorRef).toBe("sec-1");
    expect(u.estado.items[1].sectorRef).toBeNull();
  });

  it("fase 3: valida nombres de sectores nuevos únicos", () => {
    const u = useSetupEntidades({ entidad: "estacionamiento" });
    u.estado.sectorOrigen = "nuevo";
    u.estado.sectoresNuevos = [
      { uid: "a", nombre: "Torre A", descripcion: "" },
      { uid: "b", nombre: "Torre A", descripcion: "" },
    ];
    expect(u.validoPaso(3)).toBe(false);
    u.estado.sectoresNuevos[1].nombre = "Torre B";
    expect(u.validoPaso(3)).toBe(true);
  });

  it("asigna sector a un ítem y a todos", () => {
    const u = useSetupEntidades({ entidad: "estacionamiento" });
    u.estado.modo = "por-piso";
    u.estado.pisos = "1";
    u.estado.porPiso = 2;
    u.generarItems();
    u.asignarSector(u.estado.items[0].id, "sec-1");
    expect(u.estado.items[0].sectorRef).toBe("sec-1");
    u.asignarTodos("sec-2");
    expect(u.estado.items.every((x) => x.sectorRef === "sec-2")).toBe(true);
  });

  it("enviar crea sectores nuevos y luego el batch de estacionamientos", async () => {
    unidadesService.getSectores.mockResolvedValue({ data: [] });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    unidadesService.crearSectoresBatch.mockResolvedValue({
      data: { creados: [{ id: "id-a", nombre: "Estacionamiento Torre A" }] },
    });
    estacionamientosService.crearEstacionamientosBatch.mockResolvedValue({
      data: { creados: [{ id: "e1", nombre: "E-1" }] },
    });

    const u = useSetupEntidades({ entidad: "estacionamiento" });
    await u.cargar();
    u.estado.sectorOrigen = "nuevo";
    u.estado.sectoresNuevos = [{ uid: "a", nombre: "Estacionamiento Torre A", descripcion: "" }];
    u.estado.modo = "por-piso";
    u.estado.pisos = "1";
    u.estado.porPiso = 1;
    u.generarItems();
    u.estado.items[0].sectorRef = "a";

    const ok = await u.enviar();
    expect(ok).toBe(true);
    expect(unidadesService.crearSectoresBatch).toHaveBeenCalledWith("cid-1", {
      sectores: [{ nombre: "Estacionamiento Torre A", descripcion: "" }],
    });
    expect(estacionamientosService.crearEstacionamientosBatch).toHaveBeenCalledWith("cid-1", {
      estacionamientos: [{ nombre: "E-1", piso: 1, sectorId: "id-a" }],
    });
    expect(u.resultado.creadas).toBe(1);
    expect(u.borradorRestaurado).toBe(false);
  });

  it("enviar de bodegas usa el servicio y la clave correctos", async () => {
    bodegasService.crearBodegasBatch.mockResolvedValue({
      data: { creados: [{ id: "b1", nombre: "B-1" }] },
    });
    const u = useSetupEntidades({ entidad: "bodega" });
    u.estado.modo = "correlativo";
    u.estado.desde = "1";
    u.estado.cantidad = 1;
    u.generarItems();

    const ok = await u.enviar();
    expect(ok).toBe(true);
    expect(bodegasService.crearBodegasBatch).toHaveBeenCalledWith("cid-1", {
      bodegas: [{ nombre: "B-1", piso: null, sectorId: null }],
    });
  });

  it("enviar con sectores existentes usa el id directo y omite el batch de sectores", async () => {
    estacionamientosService.crearEstacionamientosBatch.mockResolvedValue({
      data: { creados: [{ id: "e1", nombre: "E-1" }] },
    });
    const u = useSetupEntidades({ entidad: "estacionamiento" });
    u.estado.sectorOrigen = "existente";
    u.estado.sectorExistenteId = "sec-real";
    u.estado.modo = "correlativo";
    u.estado.desde = "1";
    u.estado.cantidad = 1;
    u.generarItems();
    u.estado.items[0].sectorRef = "sec-real";

    const ok = await u.enviar();
    expect(ok).toBe(true);
    expect(unidadesService.crearSectoresBatch).not.toHaveBeenCalled();
    expect(estacionamientosService.crearEstacionamientosBatch).toHaveBeenCalledWith("cid-1", {
      estacionamientos: [{ nombre: "E-1", piso: null, sectorId: "sec-real" }],
    });
  });

  it("enviar mapea los errores 409 fila a fila en los ítems", async () => {
    estacionamientosService.crearEstacionamientosBatch.mockRejectedValue({
      response: {
        status: 409,
        data: {
          message: "1 estacionamiento no pudo crearse",
          fields: [{ field: "estacionamientos[1].nombre", message: "Ya existe un estacionamiento con el nombre: E-2" }],
        },
      },
    });
    const u = useSetupEntidades({ entidad: "estacionamiento" });
    u.estado.modo = "correlativo";
    u.estado.desde = "1";
    u.estado.cantidad = 2;
    u.generarItems();

    const ok = await u.enviar();
    expect(ok).toBe(false);
    expect(u.error).toBe("1 estacionamiento no pudo crearse");
    expect(u.estado.items[0].error).toBeNull();
    expect(u.estado.items[1].error).toContain("Ya existe un estacionamiento con el nombre: E-2");
  });

  it("degrada la fase de sectores si no hay permiso (403)", async () => {
    unidadesService.getSectores.mockRejectedValue({ response: { status: 403 } });
    unidadesService.getCapacidad.mockRejectedValue({ response: { status: 404 } });
    const u = useSetupEntidades({ entidad: "estacionamiento" });
    await u.cargar();
    expect(u.sectoresHabilitados).toBe(false);
    expect(u.estado.sectorOrigen).toBe("sin-sector");
    expect(u.validoPaso(3)).toBe(true);
  });

  it("restaura el borrador por entidad (clave separada)", async () => {
    sessionStorage.setItem(
      "comunidad:setup-estacionamientos:cid-1",
      JSON.stringify({
        estado: {
          paso: 4,
          prefijo: "E-",
          cantidad: 2,
          modo: "correlativo",
          desde: "1",
          sectorOrigen: "sin-sector",
          items: [
            { id: "i1", nombre: "E-1", piso: null, sectorRef: null },
            { id: "i2", nombre: "E-2", piso: null, sectorRef: null },
          ],
        },
        sectoresExistentes: [],
      }),
    );
    unidadesService.getSectores.mockResolvedValue({ data: [] });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    const u = useSetupEntidades({ entidad: "estacionamiento" });
    await u.cargar();
    expect(u.borradorRestaurado).toBe(true);
    expect(u.estado.items).toHaveLength(2);
    expect(u.estado.items[0].nombre).toBe("E-1");
  });
});