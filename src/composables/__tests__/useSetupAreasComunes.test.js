import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSetupAreasComunes } from "@/composables/useSetupAreasComunes";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({ condominioActualId: "cid-1" }),
}));

vi.mock("@/services/espaciosService", () => ({
  espaciosService: {
    getEspacios: vi.fn(),
    crearEspacio: vi.fn(),
    actualizarEspacio: vi.fn(),
    desactivarEspacio: vi.fn(),
    vinculos: vi.fn(),
    vincular: vi.fn(),
    desvincular: vi.fn(),
  },
}));

vi.mock("@/services/estacionamientosService", () => ({
  estacionamientosService: {
    getEstacionamientos: vi.fn(),
    actualizarEstacionamiento: vi.fn(),
  },
}));

vi.mock("@/services/unidadesService", () => ({
  unidadesService: {
    getSectores: vi.fn(),
    getPisos: vi.fn(),
    getUnidades: vi.fn(),
  },
}));

import { espaciosService } from "@/services/espaciosService";
import { estacionamientosService } from "@/services/estacionamientosService";
import { unidadesService } from "@/services/unidadesService";

function mocksBase() {
  espaciosService.getEspacios.mockResolvedValue({ data: [] });
  estacionamientosService.getEstacionamientos.mockResolvedValue({ data: [] });
  unidadesService.getSectores.mockResolvedValue({ data: [] });
  unidadesService.getPisos.mockResolvedValue({ data: [] });
  unidadesService.getUnidades.mockResolvedValue({
    data: [{ id: "uc", numero: "0", tipo: "CONDOMINIO" }],
  });
}

describe("useSetupAreasComunes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocksBase();
  });

  it("carga espacios con vínculo, filtra EV- y resuelve catálogos", async () => {
    espaciosService.getEspacios.mockResolvedValue({
      data: [{ id: "e1", nombre: "Quincho", tipo: "QUINCHO", piso: 1, sectorId: null, activo: true }],
    });
    espaciosService.vinculos.mockResolvedValue({
      data: [{ id: "w1", unidadId: "uc", activo: true }],
    });
    estacionamientosService.getEstacionamientos.mockResolvedValue({
      data: [
        { id: "s1", nombre: "EV-1", piso: null, activo: true },
        { id: "s2", nombre: "E-1", piso: null, activo: true },
      ],
    });
    unidadesService.getSectores.mockResolvedValue({
      data: [{ id: "sec1", nombre: "Norte", activo: true }],
    });
    unidadesService.getPisos.mockResolvedValue({
      data: [{ id: "p1", numero: -1, nombre: "Subt.", activo: true }],
    });
    const u = useSetupAreasComunes();
    await u.cargar();
    expect(u.espaciosHabilitados).toBe(true);
    expect(u.estado.items).toHaveLength(1);
    expect(u.estado.visitas.map((x) => x.nombre)).toEqual(["EV-1"]);
    expect(u.sectoresOpciones).toEqual([{ value: "sec1", label: "Norte" }]);
    expect(u.pisosOpciones).toEqual([{ value: -1, label: "-1 · Subt." }]);
  });

  it("degrada con aviso si GET espacios da 403", async () => {
    espaciosService.getEspacios.mockRejectedValue({ response: { status: 403 } });
    const u = useSetupAreasComunes();
    await u.cargar();
    expect(u.espaciosHabilitados).toBe(false);
    expect(u.estado.items).toEqual([]);
  });

  it("motivoBloqueo explica duplicados, vacíos y pisos inválidos", () => {
    const u = useSetupAreasComunes();
    expect(u.motivoBloqueo).toBe(null);
    u.estado.items = [
      { id: "a", nombre: "Q", esNuevo: true, marcadoEliminar: false },
      { id: "b", nombre: "q", esNuevo: true, marcadoEliminar: false },
    ];
    expect(u.motivoBloqueo).toContain("duplicado");
    expect(u.esDuplicado(u.estado.items[0])).toBe(true);
    u.estado.items[1].nombre = "";
    expect(u.motivoBloqueo).toContain("sin nombre");
    expect(u.esDuplicado(u.estado.items[0])).toBe(false);
  });

  it("itemsValidos rechaza vacíos, duplicados y >60", () => {
    const u = useSetupAreasComunes();
    u.estado.items = [
      { id: "a", nombre: "A", esNuevo: true, marcadoEliminar: false },
      { id: "b", nombre: "a", esNuevo: true, marcadoEliminar: false },
    ];
    expect(u.itemsValidos).toBe(false);
    u.estado.items[1].nombre = "B";
    expect(u.itemsValidos).toBe(true);
    u.estado.items[0].nombre = "x".repeat(61);
    expect(u.itemsValidos).toBe(false);
  });

  it("hayCambios cuenta espacios y visitas", () => {
    const u = useSetupAreasComunes();
    expect(u.hayCambios).toBe(false);
    u.estado.items = [
      { id: "a", nombre: "A", esNuevo: true, marcadoEliminar: false, original: null },
    ];
    u.estado.visitas = [
      { id: "v", estId: "s1", nombre: "EV-1", piso: 1, sectorId: null, original: { piso: null, sectorId: null } },
    ];
    expect(u.pendientes).toMatchObject({ nuevas: 1, visitas: 1, total: 2 });
    expect(u.hayCambios).toBe(true);
  });

  it("guardar crea (el backend vincula al condominio) y actualiza EV", async () => {
    espaciosService.crearEspacio.mockResolvedValue({ data: { id: "e9" } });
    estacionamientosService.actualizarEstacionamiento.mockResolvedValue({});
    const u = useSetupAreasComunes();
    u.estado.items = [
      {
        id: "a",
        nombre: "Quincho",
        tipo: "QUINCHO",
        piso: null,
        sectorId: null,
        error: null,
        espacioId: null,
        esNuevo: true,
        marcadoEliminar: false,
        original: null,
      },
    ];
    u.estado.visitas = [
      { id: "v", estId: "s1", nombre: "EV-1", piso: -1, sectorId: null, error: null, original: { piso: null, sectorId: null } },
    ];
    const ok = await u.guardar();
    expect(ok).toBe(true);
    expect(espaciosService.crearEspacio).toHaveBeenCalledWith("cid-1", {
      nombre: "Quincho",
      tipo: "QUINCHO",
      piso: null,
      sectorId: null,
    });
    // Sin vincular manual: el backend lo gestiona (rechaza PROPIETARIO manual).
    expect(espaciosService.vincular).not.toHaveBeenCalled();
    expect(estacionamientosService.actualizarEstacionamiento).toHaveBeenCalledWith("cid-1", "s1", {
      nombre: "EV-1",
      piso: -1,
      sectorId: null,
    });
    expect(u.resultado).toEqual({ creados: 1, actualizados: 0, eliminados: 0, visitas: 1 });
    expect(u.estado.items[0].esNuevo).toBe(false);
  });

  it("un 400 al crear (duplicado) se mapea a la fila sin abortar visitas", async () => {
    espaciosService.crearEspacio.mockRejectedValue({
      response: { data: { message: "Ya existe un espacio con el nombre 'Q'" } },
    });
    estacionamientosService.actualizarEstacionamiento.mockResolvedValue({});
    const u = useSetupAreasComunes();
    u.estado.items = [
      {
        id: "a",
        nombre: "Q",
        tipo: "OTRO",
        piso: null,
        sectorId: null,
        error: null,
        espacioId: null,
        esNuevo: true,
        marcadoEliminar: false,
        original: null,
      },
    ];
    u.estado.visitas = [
      { id: "v", estId: "s1", nombre: "EV-1", piso: 1, sectorId: null, error: null, original: { piso: null, sectorId: null } },
    ];
    const ok = await u.guardar();
    expect(ok).toBe(false);
    expect(u.estado.items[0].error).toContain("Ya existe");
    expect(estacionamientosService.actualizarEstacionamiento).toHaveBeenCalled();
    expect(u.resultado).toEqual({ creados: 0, actualizados: 0, eliminados: 0, visitas: 1 });
  });

  it("editar nombre actualiza sin tocar vínculos (backend automático)", async () => {
    espaciosService.actualizarEspacio.mockResolvedValue({});
    const u = useSetupAreasComunes();
    u.estado.items = [
      {
        id: "a",
        nombre: "Q2",
        tipo: "OTRO",
        piso: null,
        sectorId: null,
        error: null,
        espacioId: "e1",
        esNuevo: false,
        marcadoEliminar: false,
        original: { nombre: "Q", tipo: "OTRO", piso: null, sectorId: null },
      },
    ];
    const ok = await u.guardar();
    expect(ok).toBe(true);
    expect(espaciosService.actualizarEspacio).toHaveBeenCalledWith("cid-1", "e1", {
      nombre: "Q2",
      tipo: "OTRO",
      piso: null,
      sectorId: null,
    });
    expect(espaciosService.desvincular).not.toHaveBeenCalled();
    expect(u.resultado.actualizados).toBe(1);
  });
});
