import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSetupUnidades, TIPOS_UNIDAD_CREAR } from "@/composables/useSetupUnidades";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({ condominioActualId: "cid-1" }),
}));

vi.mock("@/services/unidadesService", () => ({
  unidadesService: {
    getSectores: vi.fn(),
    getCapacidad: vi.fn(),
    crearSectoresBatch: vi.fn(),
    crearUnidadesBatch: vi.fn(),
  },
}));

import { unidadesService } from "@/services/unidadesService";

describe("useSetupUnidades", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("expone los tipos de unidad creables (sin CONDOMINIO/ESTACIONAMIENTO/BODEGA)", () => {
    expect(TIPOS_UNIDAD_CREAR.map((t) => t.value)).toEqual([
      "CASA",
      "DEPARTAMENTO",
      "OTRO",
    ]);
  });

  it("valida la fase 1 (tipo y cantidad) y avanza a la 2", () => {
    const u = useSetupUnidades();
    u.estado.tipo = "DEPARTAMENTO";
    u.estado.cantidad = 4;
    expect(u.validoPaso(1)).toBe(true);
    u.siguiente();
    expect(u.estado.paso).toBe(2);
  });

  it("no avanza de la fase 1 sin cantidad válida", () => {
    const u = useSetupUnidades();
    u.estado.cantidad = 0;
    expect(u.validoPaso(1)).toBe(false);
    u.siguiente();
    expect(u.estado.paso).toBe(1);
  });

  it("genera las unidades en la transición de numeración a sectores (por-piso)", () => {
    const u = useSetupUnidades();
    u.estado.modo = "por-piso";
    u.estado.pisos = 2;
    u.estado.porPiso = 2;
    u.estado.paso = 2;
    u.siguiente();
    expect(u.estado.paso).toBe(3);
    expect(u.estado.unidades.map((x) => x.numero)).toEqual(["101", "102", "201", "202"]);
    expect(u.estado.unidades[0].piso).toBe(1);
    expect(u.estado.unidades[2].piso).toBe(2);
  });

  it("preserva la asignación por número al regenerar la lista", () => {
    const u = useSetupUnidades();
    u.estado.modo = "por-piso";
    u.estado.pisos = 1;
    u.estado.porPiso = 2;
    u.generarUnidades();
    u.estado.unidades[0].sectorRef = "sec-1";
    u.generarUnidades();
    expect(u.estado.unidades[0].sectorRef).toBe("sec-1");
    expect(u.estado.unidades[1].sectorRef).toBeNull();
  });

  it("fase 3: valida nombres de sectores nuevos únicos", () => {
    const u = useSetupUnidades();
    u.estado.sectorOrigen = "nuevo";
    u.estado.sectoresNuevos = [
      { uid: "a", nombre: "Torre A", descripcion: "" },
      { uid: "b", nombre: "Torre A", descripcion: "" },
    ];
    expect(u.validoPaso(3)).toBe(false);
    u.estado.sectoresNuevos[1].nombre = "Torre B";
    expect(u.validoPaso(3)).toBe(true);
  });

  it("fase 3: requiere sector existente si se elige esa opción", () => {
    const u = useSetupUnidades();
    u.estado.sectorOrigen = "existente";
    expect(u.validoPaso(3)).toBe(false);
    u.estado.sectorExistenteId = "uuid-sector";
    expect(u.validoPaso(3)).toBe(true);
  });

  it("asigna sector a una unidad y a todas", () => {
    const u = useSetupUnidades();
    u.estado.modo = "por-piso";
    u.estado.pisos = 1;
    u.estado.porPiso = 2;
    u.generarUnidades();
    u.asignarSector(u.estado.unidades[0].id, "sec-1");
    expect(u.estado.unidades[0].sectorRef).toBe("sec-1");
    u.asignarTodos("sec-2");
    expect(u.estado.unidades.every((x) => x.sectorRef === "sec-2")).toBe(true);
  });

  it("enviar crea sectores nuevos y luego el batch de unidades", async () => {
    unidadesService.getSectores.mockResolvedValue({ data: [] });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    unidadesService.crearSectoresBatch.mockResolvedValue({
      data: { creados: [{ id: "id-a", nombre: "Torre A" }] },
    });
    unidadesService.crearUnidadesBatch.mockResolvedValue({
      data: { creadas: [{ id: "u1", numero: "101" }] },
    });

    const u = useSetupUnidades();
    await u.cargar();
    u.estado.sectorOrigen = "nuevo";
    u.estado.sectoresNuevos = [{ uid: "a", nombre: "Torre A", descripcion: "" }];
    u.estado.modo = "por-piso";
    u.estado.pisos = 1;
    u.estado.porPiso = 1;
    u.generarUnidades();
    u.estado.unidades[0].sectorRef = "a";

    const ok = await u.enviar();
    expect(ok).toBe(true);
    expect(unidadesService.crearSectoresBatch).toHaveBeenCalledWith("cid-1", {
      sectores: [{ nombre: "Torre A", descripcion: "" }],
    });
    expect(unidadesService.crearUnidadesBatch).toHaveBeenCalledWith("cid-1", {
      unidades: [{ numero: "101", tipo: "CASA", piso: 1, sectorId: "id-a" }],
    });
    expect(u.resultado.creadas).toBe(1);
    expect(u.borradorRestaurado).toBe(false);
  });

  it("enviar con sectores existentes usa el id directo y omite el batch de sectores", async () => {
    unidadesService.crearUnidadesBatch.mockResolvedValue({
      data: { creadas: [{ id: "u1", numero: "1" }] },
    });
    const u = useSetupUnidades();
    u.estado.sectorOrigen = "existente";
    u.estado.sectorExistenteId = "sec-real";
    u.estado.modo = "correlativo";
    u.estado.desde = "1";
    u.estado.cantidad = 1;
    u.generarUnidades();
    u.estado.unidades[0].sectorRef = "sec-real";

    const ok = await u.enviar();
    expect(ok).toBe(true);
    expect(unidadesService.crearSectoresBatch).not.toHaveBeenCalled();
    expect(unidadesService.crearUnidadesBatch).toHaveBeenCalledWith("cid-1", {
      unidades: [{ numero: "1", tipo: "CASA", piso: null, sectorId: "sec-real" }],
    });
  });

  it("enviar mapea los errores 409 fila a fila en las unidades", async () => {
    unidadesService.crearUnidadesBatch.mockRejectedValue({
      response: {
        status: 409,
        data: {
          message: "1 unidad no pudo crearse",
          fields: [{ field: "unidades[1].numero", message: "Ya existe una unidad con el número: 2" }],
        },
      },
    });
    const u = useSetupUnidades();
    u.estado.modo = "correlativo";
    u.estado.desde = "1";
    u.estado.cantidad = 2;
    u.generarUnidades();

    const ok = await u.enviar();
    expect(ok).toBe(false);
    expect(u.error).toBe("1 unidad no pudo crearse");
    expect(u.estado.unidades[0].error).toBeNull();
    expect(u.estado.unidades[1].error).toContain("Ya existe una unidad con el número: 2");
  });

  it("degrada la fase de sectores si no hay permiso (403)", async () => {
    unidadesService.getSectores.mockRejectedValue({ response: { status: 403 } });
    unidadesService.getCapacidad.mockRejectedValue({ response: { status: 404 } });
    const u = useSetupUnidades();
    await u.cargar();
    expect(u.sectoresHabilitados).toBe(false);
    expect(u.estado.sectorOrigen).toBe("sin-sector");
    expect(u.validoPaso(3)).toBe(true);
  });

  it("descarta la agrupación del borrador si el cargo no tiene permisos SECTOR_*", async () => {
    sessionStorage.setItem(
      "comunidad:setup-unidades:cid-1",
      JSON.stringify({
        estado: {
          paso: 4,
          tipo: "DEPARTAMENTO",
          cantidad: 2,
          modo: "correlativo",
          desde: "1",
          sectorOrigen: "nuevo",
          sectoresNuevos: [{ uid: "sec-a", nombre: "Torre A", descripcion: "" }],
          unidades: [
            { id: "u1", numero: "1", piso: null, sectorRef: "sec-a" },
            { id: "u2", numero: "2", piso: null, sectorRef: "sec-a" },
          ],
        },
        sectoresExistentes: [],
      }),
    );
    unidadesService.getSectores.mockRejectedValue({ response: { status: 403 } });
    unidadesService.getCapacidad.mockRejectedValue({ response: { status: 404 } });
    const u = useSetupUnidades();
    await u.cargar();
    expect(u.borradorRestaurado).toBe(true);
    expect(u.estado.sectorOrigen).toBe("sin-sector");
    expect(u.estado.unidades.every((x) => x.sectorRef === null)).toBe(true);
  });
});
