import { describe, it, expect, beforeEach, vi } from "vitest";
import { useUnidadesConsulta } from "@/composables/useUnidadesConsulta";

let permisos = [];
vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({
    condominioActualId: "cid-1",
    permisos,
  }),
}));

vi.mock("@/services/unidadesService", () => ({
  unidadesService: { getUnidades: vi.fn() },
}));
vi.mock("@/services/estacionamientosService", () => ({
  estacionamientosService: { getEstacionamientos: vi.fn() },
}));
vi.mock("@/services/bodegasService", () => ({
  bodegasService: { getBodegas: vi.fn() },
}));
vi.mock("@/services/espaciosService", () => ({
  espaciosService: { getEspacios: vi.fn() },
}));
vi.mock("@/services/vehiculosService", () => ({
  vehiculosService: {
    listar: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    desactivar: vi.fn(),
  },
}));
vi.mock("@/services/personasService", () => ({
  personasService: {
    vinculosUnidad: vi.fn(),
    obtener: vi.fn(),
    actualizar: vi.fn(),
    desactivar: vi.fn(),
    desactivarVinculo: vi.fn(),
  },
}));

import { unidadesService } from "@/services/unidadesService";
import { estacionamientosService } from "@/services/estacionamientosService";
import { bodegasService } from "@/services/bodegasService";
import { espaciosService } from "@/services/espaciosService";
import { vehiculosService } from "@/services/vehiculosService";
import { personasService } from "@/services/personasService";

const ok = (data) => ({ data });

function prepararListados() {
  unidadesService.getUnidades.mockResolvedValue(
    ok([
      { id: "u1", numero: "1", tipo: "CASA", activo: true },
      { id: "u2", numero: "2", tipo: "CASA", activo: true },
      { id: "cond", numero: "CONDOMINIO", tipo: "CONDOMINIO", activo: true },
    ]),
  );
  estacionamientosService.getEstacionamientos.mockResolvedValue(
    ok([
      { id: "e1", nombre: "E-1", activo: true, propietario: { unidadId: "u1", vinculoId: "ve1" } },
      { id: "e2", nombre: "EV-1", activo: true, propietario: { unidadId: "cond", vinculoId: "ve2" } },
    ]),
  );
  bodegasService.getBodegas.mockResolvedValue(
    ok([{ id: "b1", nombre: "B-1", activo: true, propietario: { unidadId: "u1", vinculoId: "vb1" } }]),
  );
  espaciosService.getEspacios.mockResolvedValue(
    ok([{ id: "a1", nombre: "Quincho", tipo: "QUINCHO", activo: true, propietario: { unidadId: "cond", vinculoId: "va1" } }]),
  );
  vehiculosService.listar.mockResolvedValue(
    ok([{ id: "v1", patente: "ABCD12", tipo: "AUTO", unidadId: "u1", activo: true }]),
  );
}

describe("useUnidadesConsulta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permisos = [];
    prepararListados();
  });

  it("carga los 5 listados, indexa recursos y calcula el resumen real", async () => {
    const u = useUnidadesConsulta();
    await u.cargar();

    expect(u.cargando.value).toBe(false);
    expect(u.errorCarga.value).toBeNull();
    expect(u.unidades.value).toHaveLength(3);
    expect(u.resumen.value).toEqual({
      unidades: 2,
      estacionamientos: { total: 2, residentes: 1, visitas: 1 },
      bodegas: 1,
      areasComunes: 1,
    });
    expect(u.recursosCondominio.value.estacionamientos[0].nombre).toBe("EV-1");
    expect(u.vehiculosDe("u1").map((v) => v.id)).toEqual(["v1"]);
  });

  it("degrada los listados auxiliares y conserva las unidades", async () => {
    estacionamientosService.getEstacionamientos.mockRejectedValue({
      response: { status: 403 },
    });
    const u = useUnidadesConsulta();
    await u.cargar();

    expect(u.unidades.value).toHaveLength(3);
    expect(u.estacionamientos.value).toEqual([]);
    expect(u.advertencias.value).toEqual(["No se pudo cargar estacionamientos."]);
    expect(u.errorCarga.value).toBeNull();
  });

  it("marca error de carga si falla el listado crítico de unidades", async () => {
    unidadesService.getUnidades.mockRejectedValue({
      response: { data: { message: "Sin permiso" } },
    });
    const u = useUnidadesConsulta();
    await u.cargar();

    expect(u.errorCarga.value).toBe("Sin permiso");
    expect(u.cargando.value).toBe(false);
  });

  it("no consulta vínculos sin VINCULO_VER y los cachea con el permiso", async () => {
    const u = useUnidadesConsulta();
    expect(await u.cargarVinculos("u1")).toEqual([]);
    expect(personasService.vinculosUnidad).not.toHaveBeenCalled();

    permisos = ["VINCULO_VER"];
    const u2 = useUnidadesConsulta();
    personasService.vinculosUnidad.mockResolvedValue(
      ok([{ id: "v1", personaId: "p1", personaNombre: "Ana", unidadId: "u1" }]),
    );

    expect(await u2.cargarVinculos("u1")).toHaveLength(1);
    expect(await u2.cargarVinculos("u1")).toHaveLength(1);
    expect(personasService.vinculosUnidad).toHaveBeenCalledTimes(1);
    expect(u2.vinculosDe("u1")[0].personaNombre).toBe("Ana");
  });

  it("expone la carga fallida de vínculos sin romper la vista", async () => {
    permisos = ["VINCULO_VER"];
    personasService.vinculosUnidad.mockRejectedValue({
      response: { data: { message: "No se pudo leer" } },
    });
    const u = useUnidadesConsulta();
    await u.cargarVinculos("u1");

    expect(u.vinculosDe("u1")).toEqual([]);
    expect(u.errorVinculos.u1).toBe("No se pudo leer");
  });

  it("actualiza el nombre en la caché al editar la persona", async () => {
    personasService.actualizar.mockResolvedValue(ok({ nombre: "Ana Pérez" }));
    const u = useUnidadesConsulta();
    u.vinculosPorUnidad.u1 = [
      { id: "v1", personaId: "p1", personaNombre: "Ana", unidadId: "u1" },
    ];

    await u.actualizarPersona("p1", { nombre: "Ana Pérez", telefono: "" });

    expect(personasService.actualizar).toHaveBeenCalledWith("cid-1", "p1", {
      nombre: "Ana Pérez",
      telefono: "",
    });
    expect(u.vinculosPorUnidad.u1[0].personaNombre).toBe("Ana Pérez");
  });

  it("desvincula una persona de la casa y actualiza la caché", async () => {
    personasService.desactivarVinculo.mockResolvedValue(ok(null));
    const u = useUnidadesConsulta();
    u.vinculosPorUnidad.u1 = [
      { id: "v1", personaId: "p1", unidadId: "u1" },
      { id: "v2", personaId: "p2", unidadId: "u1" },
    ];

    await u.desvincularPersonaDeUnidad({ id: "v1", unidadId: "u1" });

    expect(personasService.desactivarVinculo).toHaveBeenCalledWith("cid-1", "v1");
    expect(u.vinculosPorUnidad.u1.map((v) => v.id)).toEqual(["v2"]);
  });

  it("quita la persona del condominio con motivo y limpia todas las casas cacheadas", async () => {
    personasService.desactivar.mockResolvedValue(ok(null));
    const u = useUnidadesConsulta();
    u.vinculosPorUnidad.u1 = [{ id: "v1", personaId: "p1", unidadId: "u1" }];
    u.vinculosPorUnidad.u2 = [
      { id: "v2", personaId: "p1", unidadId: "u2" },
      { id: "v3", personaId: "p2", unidadId: "u2" },
    ];

    await u.quitarPersonaDelCondominio("p1", "  mudanza  ");

    expect(personasService.desactivar).toHaveBeenCalledWith("cid-1", "p1", {
      motivo: "mudanza",
    });
    expect(u.vinculosPorUnidad.u1).toEqual([]);
    expect(u.vinculosPorUnidad.u2.map((v) => v.id)).toEqual(["v3"]);
  });

  it("gestiona vehículos: desvincular, mover y crear sin recargar", async () => {
    const u = useUnidadesConsulta();
    await u.cargar();

    vehiculosService.actualizar.mockResolvedValue(
      ok({ id: "v1", unidadId: "u2", patente: "ABCD12", activo: true }),
    );
    await u.moverVehiculo(
      { id: "v1", tipo: "AUTO", marca: "X", modelo: "Y", color: "Z" },
      "u2",
    );
    expect(vehiculosService.actualizar).toHaveBeenCalledWith("cid-1", "v1", {
      tipo: "AUTO",
      unidadId: "u2",
      marca: "X",
      modelo: "Y",
      color: "Z",
    });
    expect(u.vehiculosDe("u2").map((v) => v.id)).toEqual(["v1"]);

    vehiculosService.desactivar.mockResolvedValue(ok(null));
    await u.desvincularVehiculo({ id: "v1" });
    expect(u.vehiculos.value).toEqual([]);

    vehiculosService.crear.mockResolvedValue(
      ok({ id: "v9", unidadId: "u1", patente: "NEW123", activo: true }),
    );
    await u.crearVehiculo({ patente: "NEW123", tipo: "AUTO", unidadId: "u1" });
    expect(u.vehiculosDe("u1").map((v) => v.id)).toEqual(["v9"]);
  });

  it("lista los vehículos de otras casas para moverlos", async () => {
    const u = useUnidadesConsulta();
    await u.cargar();

    expect(u.vehiculosFueraDe("u1")).toEqual([]);
    expect(u.vehiculosFueraDe("u2").map((v) => v.id)).toEqual(["v1"]);
  });

  it("publica los permisos reales del condominio", () => {
    permisos = [
      "VINCULO_VER",
      "VINCULO_ELIMINAR",
      "PERSONA_EDITAR",
      "PERSONA_ELIMINAR",
      "VEHICULO_VER",
      "VEHICULO_CREAR",
      "VEHICULO_EDITAR",
      "VEHICULO_ELIMINAR",
    ];
    const u = useUnidadesConsulta();
    expect(u.puedeVerVinculos.value).toBe(true);
    expect(u.puedeDesvincular.value).toBe(true);
    expect(u.puedeQuitarPersona.value).toBe(true);
    expect(u.puedeCrearVehiculo.value).toBe(true);
    expect(u.puedeEditarVehiculo.value).toBe(true);
    expect(u.puedeEliminarVehiculo.value).toBe(true);
  });
});
