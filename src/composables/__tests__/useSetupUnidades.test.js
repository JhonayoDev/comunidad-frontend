import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSetupUnidades, TIPOS_UNIDAD_CREAR } from "@/composables/useSetupUnidades";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({ condominioActualId: "cid-1" }),
}));

vi.mock("@/services/unidadesService", () => ({
  unidadesService: {
    getSectores: vi.fn(),
    getPisos: vi.fn(),
    getCapacidad: vi.fn(),
    getUnidades: vi.fn(),
    crearSectoresBatch: vi.fn(),
    crearUnidadesBatch: vi.fn(),
    actualizarUnidad: vi.fn(),
    desactivarUnidad: vi.fn(),
  },
}));

import { unidadesService } from "@/services/unidadesService";

describe("useSetupUnidades", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    unidadesService.getPisos.mockResolvedValue({ data: [] });
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

  it("ordenarUnidades reordena con orden natural al salir de edición", () => {
    const u = useSetupUnidades();
    u.estado.unidades = [
      { id: "a", numero: "1", tipo: "CASA" },
      { id: "b", numero: "10", tipo: "CASA" },
      { id: "c", numero: "2", tipo: "CASA" },
      { id: "d", numero: "11", tipo: "CASA" },
    ];
    u.ordenarUnidades();
    expect(u.estado.unidades.map((x) => x.numero)).toEqual(["1", "2", "10", "11"]);
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

  it("fase 3: 'existente' no exige selección (la asignación ocurre en fase 4)", () => {
    const u = useSetupUnidades();
    u.estado.sectorOrigen = "existente";
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

  // ─── Reedición (V64) ───

  it("cargar entra en reedición si ya existen unidades (excluye CONDOMINIO e inactivas)", async () => {
    unidadesService.getSectores.mockResolvedValue({
      data: [{ id: "sec-1", nombre: "Torre A" }],
    });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    unidadesService.getUnidades.mockResolvedValue({
      data: [
        { id: "u1", numero: "1", tipo: "CASA", piso: 1, activo: true, sectorNombre: "Torre A" },
        { id: "u2", numero: "2", tipo: "DEPARTAMENTO", piso: 2, activo: true, sectorNombre: null },
        { id: "u3", numero: "Condominio", tipo: "CONDOMINIO", piso: null, activo: true, sectorNombre: null },
        { id: "u4", numero: "3", tipo: "CASA", piso: null, activo: false, sectorNombre: null },
      ],
    });
    const u = useSetupUnidades();
    await u.cargar();
    expect(u.modoReedicion).toBe(true);
    expect(u.estado.paso).toBe(5);
    expect(u.estado.sectorOrigen).toBe("existente");
    expect(u.estado.unidades.map((x) => x.numero)).toEqual(["1", "2"]);
    expect(u.estado.unidades[0].unidadId).toBe("u1");
    expect(u.estado.unidades[0].esNuevo).toBe(false);
    expect(u.estado.unidades[0].sectorRef).toBe("sec-1");
    expect(u.estado.unidades[1].sectorRef).toBeNull();
    expect(u.estado.tipo).toBe("CASA");
  });

  it("no entra en reedición si no hay unidades creadas", async () => {
    unidadesService.getSectores.mockResolvedValue({ data: [] });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    unidadesService.getUnidades.mockResolvedValue({ data: [] });
    const u = useSetupUnidades();
    await u.cargar();
    expect(u.modoReedicion).toBe(false);
    expect(u.estado.paso).toBe(1);
  });

  it("itemsValidos rechaza números vacíos o duplicados y permite eliminar todo", () => {
    const u = useSetupUnidades();
    u.estado.unidades = [
      { id: "a", numero: "1", tipo: "CASA", esNuevo: true, marcadoEliminar: false },
      { id: "b", numero: "1", tipo: "CASA", esNuevo: true, marcadoEliminar: false },
    ];
    expect(u.itemsValidos).toBe(false);
    u.estado.unidades[1].numero = "2";
    expect(u.itemsValidos).toBe(true);
    u.estado.unidades[0].numero = "";
    expect(u.itemsValidos).toBe(false);
    u.estado.unidades[0].marcadoEliminar = true;
    u.estado.unidades[1].marcadoEliminar = true;
    expect(u.itemsValidos).toBe(true);
  });

  it("enviar en reedición: batch de nuevas + PUT de editadas + desactivar eliminadas", async () => {
    unidadesService.getSectores.mockResolvedValue({ data: [] });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    unidadesService.getUnidades.mockResolvedValue({
      data: [
        { id: "u1", numero: "1", tipo: "CASA", piso: 1, activo: true, sectorNombre: null },
        { id: "u2", numero: "2", tipo: "CASA", piso: 2, activo: true, sectorNombre: null },
      ],
    });
    unidadesService.crearUnidadesBatch.mockResolvedValue({
      data: { creadas: [{ id: "u3", numero: "3" }] },
    });
    unidadesService.actualizarUnidad.mockResolvedValue({ data: {} });
    unidadesService.desactivarUnidad.mockResolvedValue({ data: {} });

    const u = useSetupUnidades();
    await u.cargar();
    expect(u.modoReedicion).toBe(true);

    // Editar la 1 (numero), eliminar la 2, agregar una nueva
    u.estado.unidades[0].numero = "10";
    u.estado.unidades[1].marcadoEliminar = true;
    u.agregarFila();
    u.estado.unidades[2].numero = "3";

    const ok = await u.enviar();
    expect(ok).toBe(true);
    expect(unidadesService.crearUnidadesBatch).toHaveBeenCalledWith("cid-1", {
      unidades: [{ numero: "3", tipo: "CASA", piso: null, sectorId: null }],
    });
    expect(unidadesService.actualizarUnidad).toHaveBeenCalledWith("cid-1", "u1", {
      numero: "10",
      tipo: "CASA",
      piso: 1,
      sectorId: null,
    });
    expect(unidadesService.desactivarUnidad).toHaveBeenCalledWith("cid-1", "u2");
    expect(u.resultado).toEqual({ creadas: 1, actualizadas: 1, eliminadas: 1 });
    expect(u.estado.unidades.some((x) => x.unidadId === "u2")).toBe(false);
  });

  it("enviar en reedición: el error de vínculos activos de un PUT se mapea a la fila", async () => {
    unidadesService.getSectores.mockResolvedValue({ data: [] });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    unidadesService.getUnidades.mockResolvedValue({
      data: [
        { id: "u1", numero: "1", tipo: "CASA", piso: 1, activo: true, sectorNombre: null },
      ],
    });
    unidadesService.actualizarUnidad.mockRejectedValue({
      response: {
        status: 409,
        data: {
          message:
            "La unidad tiene 2 vínculo(s) activo(s) y no se puede cambiar el número ni el tipo. Solo se puede asignar sector o piso.",
        },
      },
    });

    const u = useSetupUnidades();
    await u.cargar();
    u.estado.unidades[0].numero = "99";

    const ok = await u.enviar();
    expect(ok).toBe(false);
    expect(u.estado.unidades[0].error).toContain("vínculo(s) activo(s)");
    expect(u.error).toContain("vínculo(s) activo(s)");
  });

  it("enviar en reedición: eliminar todo vuelve al wizard de creación (fase 1)", async () => {
    unidadesService.getSectores.mockResolvedValue({ data: [] });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    unidadesService.getUnidades.mockResolvedValue({
      data: [
        { id: "u1", numero: "1", tipo: "CASA", piso: 1, activo: true, sectorNombre: null },
      ],
    });
    unidadesService.desactivarUnidad.mockResolvedValue({ data: {} });

    const u = useSetupUnidades();
    await u.cargar();
    expect(u.modoReedicion).toBe(true);
    u.estado.unidades[0].marcadoEliminar = true;

    const ok = await u.enviar();
    expect(ok).toBe(true);
    expect(unidadesService.desactivarUnidad).toHaveBeenCalledWith("cid-1", "u1");
    expect(u.modoReedicion).toBe(false);
    expect(u.estado.paso).toBe(1);
    expect(u.estado.unidades).toEqual([]);
    expect(u.resultado).toBeNull();
  });

  it("enviar en reedición: un 409 al desactivar revierte la fila y no aborta el resto", async () => {
    unidadesService.getSectores.mockResolvedValue({ data: [] });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    unidadesService.getUnidades.mockResolvedValue({
      data: [
        { id: "u1", numero: "1", tipo: "CASA", piso: 1, activo: true, sectorNombre: null },
        { id: "u2", numero: "2", tipo: "CASA", piso: 2, activo: true, sectorNombre: null },
      ],
    });
    unidadesService.desactivarUnidad
      .mockResolvedValueOnce({ data: {} })
      .mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            message: "La unidad 2 tiene 3 vínculo(s) activo(s) y no se puede desactivar",
          },
        },
      });

    const u = useSetupUnidades();
    await u.cargar();
    expect(u.modoReedicion).toBe(true);
    u.estado.unidades[0].marcadoEliminar = true;
    u.estado.unidades[1].marcadoEliminar = true;

    const ok = await u.enviar();
    expect(ok).toBe(false);
    expect(u.tieneErrores).toBe(true);
    // La fila que falló NO quedó eliminada: vuelve a su estado normal.
    const u2 = u.estado.unidades.find((x) => x.unidadId === "u2");
    expect(u2).toBeDefined();
    expect(u2.marcadoEliminar).toBe(false);
    expect(u2.error).toContain("vínculo(s) activo(s)");
    // La que sí se pudo desactivar se eliminó de la lista.
    expect(u.estado.unidades.some((x) => x.unidadId === "u1")).toBe(false);
    expect(u.resultado).toEqual({ creadas: 0, actualizadas: 0, eliminadas: 1 });
  });

  // ─── Catálogo de pisos (V66) ───

  it("cargar carga el catálogo de pisos declarados (GET /pisos) y expone opciones", async () => {
    unidadesService.getSectores.mockResolvedValue({ data: [] });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    unidadesService.getPisos.mockResolvedValue({
      data: [
        { id: "p1", numero: 1, nombre: "Primer piso", activo: true },
        { id: "p2", numero: -1, nombre: "Subterráneo", activo: true },
        { id: "p3", numero: 2, nombre: null, activo: false },
      ],
    });
    const u = useSetupUnidades();
    await u.cargar();
    expect(u.pisosHabilitados).toBe(true);
    expect(u.pisosDisponibles.map((p) => p.numero)).toEqual([1, -1]);
    expect(u.pisosOpciones).toEqual([
      { value: 1, label: "1 · Primer piso" },
      { value: -1, label: "-1 · Subterráneo" },
    ]);
    expect(u.pisosLista).toBe("1,-1");
  });

  it("degrada el catálogo de pisos si no hay permiso (403) → piso libre", async () => {
    unidadesService.getSectores.mockResolvedValue({ data: [] });
    unidadesService.getCapacidad.mockResolvedValue({ data: null });
    unidadesService.getPisos.mockRejectedValue({ response: { status: 403 } });
    const u = useSetupUnidades();
    await u.cargar();
    expect(u.pisosHabilitados).toBe(false);
    expect(u.pisosDisponibles).toEqual([]);
    expect(u.pisosOpciones).toEqual([]);
  });
});