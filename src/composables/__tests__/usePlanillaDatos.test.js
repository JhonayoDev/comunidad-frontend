import { describe, it, expect, beforeEach, vi } from "vitest";
import { validarFila, usePlanillaDatos } from "@/composables/usePlanillaDatos";
import {
  filaAPayload,
  filasCrudasADinamicas,
  esEstacionamientoVisita,
} from "@/data/planillaColumnas";
import { importacionService } from "@/services/importacionService";
import { unidadesService } from "@/services/unidadesService";
import { personasService } from "@/services/personasService";
import { vehiculosService } from "@/services/vehiculosService";
import { estacionamientosService } from "@/services/estacionamientosService";
import { bodegasService } from "@/services/bodegasService";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({ condominioActualId: "cid-1" }),
}));

vi.mock("@/services/importacionService", () => ({
  importacionService: {
    previewJson: vi.fn(),
    ejecutar: vi.fn(),
    plantilla: vi.fn(),
  },
}));

vi.mock("@/services/unidadesService", () => ({
  unidadesService: {
    getUnidades: vi.fn(),
    getUnidad: vi.fn(),
    getCapacidad: vi.fn(),
  },
}));

vi.mock("@/services/personasService", () => ({
  personasService: {
    listar: vi.fn(),
    vinculosUnidad: vi.fn(),
    actualizar: vi.fn(),
    desactivarVinculo: vi.fn(),
    crearVinculo: vi.fn(),
    actualizarRecibeNotificaciones: vi.fn(),
  },
}));

vi.mock("@/services/vehiculosService", () => ({
  vehiculosService: {
    listar: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    desactivar: vi.fn(),
  },
}));

vi.mock("@/services/estacionamientosService", () => ({
  estacionamientosService: {
    getEstacionamientos: vi.fn(),
    vinculos: vi.fn(),
    vincular: vi.fn(),
    desvincular: vi.fn(),
  },
}));

vi.mock("@/services/bodegasService", () => ({
  bodegasService: {
    getBodegas: vi.fn(),
    vinculos: vi.fn(),
    vincular: vi.fn(),
    desvincular: vi.fn(),
  },
}));

describe("planillaDatos - filaAPayload", () => {
  it("arma el payload anidado a partir de una fila dinámica (vehiculos[]/bodegas[])", () => {
    const p = filaAPayload({
      unidad: "1",
      tipo_unidad: "CASA",
      sector: "Sector A",
      nombre: "Francisca Morales Díaz",
      email: "francisca.morales@test.com",
      rut: "18.901.234-5",
      telefono: "+56978901234",
      tipo_vinculo: "PROPIETARIO",
      es_ocupante: "SI",
      recibe_notificaciones: "SI",
      es_responsable: "SI",
      vehiculos: [
        { uid: "v1", patente: "ABCD01", tipo: "AUTO", marca: "Toyota", modelo: "Corolla", color: "Blanco", estacionamiento: "E-1" },
        { uid: "v2", patente: "", tipo: "", marca: "", modelo: "", color: "", estacionamiento: "" },
      ],
      bodegas: [{ uid: "b1", nombre: "B-1" }],
    });
    expect(p.persona.nombre).toBe("Francisca Morales Díaz");
    expect(p.vinculo.esResponsable).toBe(true);
    expect(p.vehiculos).toHaveLength(1);
    expect(p.vehiculos[0]).toMatchObject({ patente: "ABCD01", estacionamiento: "E-1" });
    expect(p.bodegas).toEqual(["B-1"]);
  });

  it("normaliza una fila plana legacy (patente1..3) al payload", () => {
    const p = filaAPayload({
      unidad: "1",
      nombre: "X",
      email: "x@x.cl",
      tipo_vinculo: "PROPIETARIO",
      patente1: "ABCD01",
      est1: "E-1",
      bodega1: "B-1",
    });
    expect(p.vehiculos).toHaveLength(1);
    expect(p.vehiculos[0]).toMatchObject({ patente: "ABCD01", estacionamiento: "E-1" });
    expect(p.bodegas).toEqual(["B-1"]);
  });

  it("no incluye vehículos vacíos", () => {
    const p = filaAPayload({ unidad: "2", nombre: "X", email: "x@x.cl", vehiculos: [] });
    expect(p.vehiculos).toHaveLength(0);
  });
});

describe("planillaColumnas - filasCrudasADinamicas / esEstacionamientoVisita", () => {
  it("convierte filas planas CSV al shape dinámico", () => {
    const [f] = filasCrudasADinamicas([
      { unidad: "1", patente1: "ABCD01", tipo_vehiculo1: "AUTO", est1: "E-1", patente2: "", bodega1: "B-1", bodega2: "" },
    ]);
    expect(f.vehiculos).toHaveLength(1);
    expect(f.vehiculos[0]).toMatchObject({ patente: "ABCD01", tipo: "AUTO", estacionamiento: "E-1" });
    expect(f.bodegas).toHaveLength(1);
    expect(f.bodegas[0].nombre).toBe("B-1");
  });

  it("detecta estacionamientos de visitas por prefijo EV-", () => {
    expect(esEstacionamientoVisita("EV-1")).toBe(true);
    expect(esEstacionamientoVisita("ev-2")).toBe(true);
    expect(esEstacionamientoVisita("E-1")).toBe(false);
    expect(esEstacionamientoVisita("")).toBe(false);
  });
});

describe("planillaDatos - validarFila", () => {
  it("marca errores de campos obligatorios y email inválido", () => {
    const e = validarFila({ unidad: "", nombre: "", email: "malo", tipo_vinculo: "" });
    expect(e.some((x) => x.includes("Casa"))).toBe(true);
    expect(e.some((x) => x.includes("Nombre"))).toBe(true);
    expect(e.some((x) => x.includes("Email"))).toBe(true);
    expect(e.some((x) => x.includes("Vínculo"))).toBe(true);
  });

  it("pide tipo_unidad si la casa no existe en el condominio", () => {
    const e = validarFila(
      { unidad: "1", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO", tipo_unidad: "" },
      { unidadesExistentes: new Set(["2"]) },
    );
    expect(e.some((x) => x.includes("Tipo de unidad"))).toBe(true);
  });

  it("no pide tipo_unidad si la casa ya existe", () => {
    const e = validarFila(
      { unidad: "1", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO", tipo_unidad: "" },
      { unidadesExistentes: new Set(["1"]) },
    );
    expect(e.some((x) => x.includes("Tipo de unidad"))).toBe(false);
  });

  it("detecta patente duplicada en el archivo y existente en el condominio", () => {
    const e = validarFila(
      { unidad: "1", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO", vehiculos: [{ uid: "v1", patente: "ABCD01" }] },
      { patentesArchivo: new Set(["ABCD01"]), patentesExistentes: new Set(["XYZ99"]) },
    );
    expect(e.some((x) => x.includes("Patente duplicada"))).toBe(true);

    const e2 = validarFila(
      { unidad: "1", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO", vehiculos: [{ uid: "v1", patente: "ABCD01" }] },
      { patentesExistentes: new Set(["ABCD01"]) },
    );
    expect(e2.some((x) => x.includes("Patente ya registrada"))).toBe(true);
  });

  it("valida tipo de vehículo inválido en el arreglo", () => {
    const e = validarFila(
      { unidad: "1", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO", vehiculos: [{ uid: "v1", patente: "ABCD01", tipo: "NAVE" }] },
    );
    expect(e.some((x) => x.includes("Tipo de vehículo inválido"))).toBe(true);
  });

  it("normaliza filas planas legacy en validarFila", () => {
    const e = validarFila(
      { unidad: "1", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO", patente1: "ABCD01" },
      { patentesExistentes: new Set(["ABCD01"]) },
    );
    expect(e.some((x) => x.includes("Patente ya registrada"))).toBe(true);
  });

  it("detecta email ya registrado", () => {
    const e = validarFila(
      { unidad: "1", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO" },
      { emailsExistentes: new Set(["a@a.cl"]) },
    );
    expect(e.some((x) => x.includes("Email ya registrado"))).toBe(true);
  });

  it("valida RUT y teléfono chileno cuando vienen con valor", () => {
    const e = validarFila({
      unidad: "1",
      nombre: "A",
      email: "a@a.cl",
      tipo_vinculo: "PROPIETARIO",
      rut: "12.345.678-5",
      telefono: "+56 9 1234 5678",
    });
    expect(e.some((x) => x.includes("RUT"))).toBe(false);
    expect(e.some((x) => x.includes("Teléfono"))).toBe(false);
  });

  it("marca RUT y teléfono inválidos", () => {
    const e = validarFila({
      unidad: "1",
      nombre: "A",
      email: "a@a.cl",
      tipo_vinculo: "PROPIETARIO",
      rut: "12.345.678-1",
      telefono: "+56 2 1234",
    });
    expect(e.some((x) => x.includes("RUT inválido"))).toBe(true);
    expect(e.some((x) => x.includes("Teléfono inválido"))).toBe(true);
  });
});

describe("planillaDatos - usePlanillaDatos", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("agrega y elimina filas, y autoguarda borrador", () => {
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.agregarFila();
    expect(p.filas).toHaveLength(1);
    p.eliminarFila(p.filas[0].id);
    expect(p.filas).toHaveLength(0);
    const clave = `comunidad:planilla-borrador:${p.cid}`;
    expect(sessionStorage.getItem(clave)).toBe(null);
  });

  it("agrega y quita vehículos y bodegas por fila", () => {
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.agregarFila();
    const f = p.filas[0];
    expect(f.vehiculos).toEqual([]);
    expect(f.bodegas).toEqual([]);

    p.agregarVehiculo(f.id);
    p.agregarVehiculo(f.id);
    expect(f.vehiculos).toHaveLength(2);
    const uid = f.vehiculos[0].uid;
    p.quitarVehiculo(f.id, uid);
    expect(f.vehiculos).toHaveLength(1);

    p.agregarBodega(f.id);
    expect(f.bodegas).toHaveLength(1);
    p.quitarBodega(f.id, f.bodegas[0].uid);
    expect(f.bodegas).toHaveLength(0);
  });

  it("no marca patente duplicada contra la propia fila (solo entre filas)", () => {
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.agregarFila();
    p.filas[0].unidad = "1";
    p.filas[0].nombre = "A";
    p.filas[0].email = "a@a.cl";
    p.filas[0].tipo_vinculo = "PROPIETARIO";
    p.agregarVehiculo(p.filas[0].id);
    p.filas[0].vehiculos[0].patente = "ABCD01";

    const errores = p.filasConErrores[0].errores;
    expect(errores.some((x) => x.includes("Patente duplicada"))).toBe(false);

    p.agregarFila();
    p.filas[1].unidad = "2";
    p.filas[1].nombre = "B";
    p.filas[1].email = "b@b.cl";
    p.filas[1].tipo_vinculo = "PROPIETARIO";
    p.agregarVehiculo(p.filas[1].id);
    p.filas[1].vehiculos[0].patente = "ABCD01";

    const errores2 = p.filasConErrores[1].errores;
    expect(errores2.some((x) => x.includes("Patente duplicada"))).toBe(true);
  });

  it("cargarBorrador migra borradores legacy planos al shape dinámico", () => {
    const p = usePlanillaDatos({ cargarExistentes: false });
    sessionStorage.setItem(
      `comunidad:planilla-borrador:${p.cid}`,
      JSON.stringify({ filas: [{ id: "legacy-1", unidad: "1", patente1: "ABCD01", bodega1: "B-1" }] }),
    );
    expect(p.cargarBorrador()).toBe(true);
    expect(p.filas[0].vehiculos).toHaveLength(1);
    expect(p.filas[0].vehiculos[0].patente).toBe("ABCD01");
    expect(p.filas[0].bodegas[0].nombre).toBe("B-1");
  });

  it("marcarResponsable deja un solo responsable por casa", () => {
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.agregarFila();
    p.agregarFila();
    p.agregarFila();
    const [a, b, c] = p.filas;
    a.unidad = "1";
    b.unidad = "1";
    c.unidad = "2";
    p.marcarResponsable(a.id);
    expect(a.es_responsable).toBe("SI");
    expect(b.es_responsable).toBe("NO");
    expect(c.es_responsable).toBe("");
  });

  it("marcarResponsable fuerza recibe_notificaciones SI en el responsable", () => {
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.agregarFila();
    p.agregarFila();
    const [a, b] = p.filas;
    a.unidad = "1";
    b.unidad = "1";
    b.recibe_notificaciones = "NO";
    p.marcarResponsable(a.id);
    expect(a.recibe_notificaciones).toBe("SI");
    expect(b.recibe_notificaciones).toBe("NO");
  });

  it("buildPayload solo incluye filas válidas", () => {
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.agregarFila();
    p.agregarFila();
    const [a, b] = p.filas;
    Object.assign(a, { unidad: "1", tipo_unidad: "CASA", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO" });
    Object.assign(b, { unidad: "2", tipo_unidad: "CASA", nombre: "B", email: "b@b.cl", tipo_vinculo: "ARRENDATARIO" });
    const payload = p.buildPayload();
    expect(payload).toHaveLength(2);
    expect(payload[0].persona.email).toBe("a@a.cl");
  });

  it("preview llama al endpoint y guarda el borrador", async () => {
    importacionService.previewJson.mockResolvedValueOnce({
      data: {
        importacionId: "imp-1",
        totalFilas: 1,
        filasOk: 1,
        filasError: 0,
        filas: [{ numeroFila: 1, estado: "OK", unidad: "1", personaNombre: "A", personaEmail: "a@a.cl", tipoVinculo: "PROPIETARIO", errores: [] }],
      },
    });
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.agregarFila();
    Object.assign(p.filas[0], { unidad: "1", tipo_unidad: "CASA", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO" });
    await p.preview();
    expect(importacionService.previewJson).toHaveBeenCalledWith("cid-1", expect.any(Array));
    expect(p.previewData.importacionId).toBe("imp-1");
    expect(p.resultado).toBe(null);
  });

  it("ejecutar consume el borrador y guarda el resultado", async () => {
    importacionService.ejecutar.mockResolvedValueOnce({
      data: {
        importacionId: "imp-1",
        filasOk: 1,
        filasOmitidas: 0,
        filasError: 0,
        unidadesCreadas: 1,
        personasCreadas: 1,
        personasReutilizadas: 0,
        vinculosCreados: 1,
        vehiculosCreados: 1,
        estacionamientosVinculados: 1,
        bodegasVinculadas: 0,
        errores: [],
      },
    });
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.previewData = { importacionId: "imp-1", filasOk: 1 };
    await p.ejecutar();
    expect(importacionService.ejecutar).toHaveBeenCalledWith("cid-1", "imp-1");
    expect(p.resultado.filasOk).toBe(1);
    expect(p.previewData).toBe(null);
  });

  it("enviar hace preview + ejecutar en secuencia", async () => {
    importacionService.previewJson.mockResolvedValueOnce({
      data: { importacionId: "imp-2", totalFilas: 1, filasOk: 1, filasError: 0, filas: [] },
    });
    importacionService.ejecutar.mockResolvedValueOnce({
      data: { importacionId: "imp-2", filasOk: 1, filasOmitidas: 0, filasError: 0, unidadesCreadas: 1, personasCreadas: 1, personasReutilizadas: 0, vinculosCreados: 1, vehiculosCreados: 0, estacionamientosVinculados: 0, bodegasVinculadas: 0, errores: [] },
    });
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.agregarFila();
    Object.assign(p.filas[0], { unidad: "1", tipo_unidad: "CASA", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO" });
    await p.enviar();
    expect(importacionService.previewJson).toHaveBeenCalled();
    expect(importacionService.ejecutar).toHaveBeenCalledWith("cid-1", "imp-2");
    expect(p.resultado.filasOk).toBe(1);
  });

  it("enviar no ejecuta si el preview no tiene filas OK", async () => {
    importacionService.previewJson.mockResolvedValueOnce({
      data: { importacionId: "imp-3", totalFilas: 1, filasOk: 0, filasError: 1, filas: [] },
    });
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.agregarFila();
    Object.assign(p.filas[0], { unidad: "1", tipo_unidad: "CASA", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO" });
    await p.enviar();
    expect(importacionService.ejecutar).not.toHaveBeenCalled();
    expect(p.previewData.filasError).toBe(1);
  });

  it("asignarUnidad deriva tipo y sector desde la unidad seleccionada", () => {
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.unidades = [
      { numero: "1", tipo: "CASA", sectorNombre: "Sector A" },
      { numero: "2", tipo: "DEPARTAMENTO", sectorNombre: null },
    ];
    p.agregarFila();
    const f = p.filas[0];
    p.asignarUnidad(f.id, "1");
    expect(f.unidad).toBe("1");
    expect(f.tipo_unidad).toBe("CASA");
    expect(f.sector).toBe("Sector A");

    p.asignarUnidad(f.id, "2");
    expect(f.tipo_unidad).toBe("DEPARTAMENTO");
    expect(f.sector).toBe("");
  });

  it("reconstruye filas desde los vínculos existentes (re-entrada)", async () => {
    unidadesService.getUnidades.mockResolvedValueOnce({
      data: [{ id: "u1", numero: "1", tipo: "CASA", sectorNombre: "Sector A" }],
    });
    unidadesService.getCapacidad.mockResolvedValueOnce({ data: {} });
    personasService.listar.mockResolvedValueOnce({
      data: [{ id: "p1", nombre: "Juan Ramírez", email: "juan@x.cl", rut: "11.111.111-1", telefono: "+56 9 1111 1111" }],
    });
    vehiculosService.listar.mockResolvedValueOnce({
      data: [{ id: "vh1", patente: "ABCD01", tipo: "AUTO", marca: "Toyota", modelo: "Corolla", color: "Blanco", unidadId: "u1" }],
    });
    estacionamientosService.getEstacionamientos.mockResolvedValueOnce({ data: [] });
    bodegasService.getBodegas.mockResolvedValueOnce({ data: [] });
    personasService.vinculosUnidad.mockResolvedValueOnce({
      data: [{ id: "v1", personaId: "p1", personaNombre: "Juan Ramírez", tipo: "PROPIETARIO", esOcupante: true, recibeNotificaciones: true, esResponsable: true, activo: true }],
    });
    unidadesService.getUnidad.mockResolvedValueOnce({
      data: { id: "u1", numero: "1", tipo: "CASA", sectorNombre: "Sector A", bodegas: [{ bodegaId: "b1", nombre: "B-1", tipoVinculo: "PROPIETARIO" }], estacionamientos: [] },
    });

    const p = usePlanillaDatos({ cargarExistentes: true });
    await p.cargar();
    expect(p.modoReedicion).toBe(true);
    expect(p.filas).toHaveLength(1);
    const f = p.filas[0];
    expect(f.esNuevo).toBe(false);
    expect(f.nombre).toBe("Juan Ramírez");
    expect(f.tipo_vinculo).toBe("PROPIETARIO");
    expect(f.es_responsable).toBe("SI");
    expect(f.vehiculos[0]).toMatchObject({ patente: "ABCD01", __vehiculoId: "vh1" });
    expect(f.bodegas[0]).toMatchObject({ nombre: "B-1", __bodegaId: "b1" });
  });

  it("no marca email/patente ya registrada en filas existentes", () => {
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.emailsExistentes = new Set(["a@a.cl"]);
    p.patentesExistentes = new Set(["ABCD01"]);
    p.agregarFila();
    const f = p.filas[0];
    Object.assign(f, { unidad: "1", tipo_unidad: "CASA", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO", esNuevo: false });
    p.agregarVehiculo(f.id);
    f.vehiculos[0].patente = "ABCD01";
    const errores = p.filasConErrores[0].errores;
    expect(errores.some((x) => x.includes("Email ya registrado"))).toBe(false);
    expect(errores.some((x) => x.includes("Patente ya registrada"))).toBe(false);
  });

  it("buildPayload solo incluye filas nuevas en reedición", () => {
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.agregarFila();
    const nueva = p.filas[0];
    Object.assign(nueva, { unidad: "1", tipo_unidad: "CASA", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO" });
    p.agregarFila();
    const existente = p.filas[1];
    Object.assign(existente, { unidad: "2", tipo_unidad: "CASA", nombre: "B", email: "b@b.cl", tipo_vinculo: "ARRENDATARIO", esNuevo: false });
    const payload = p.buildPayload();
    expect(payload).toHaveLength(1);
    expect(payload[0].persona.email).toBe("a@a.cl");
  });

  it("marcarEliminar elimina filas nuevas y marca las existentes", () => {
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.agregarFila();
    const nueva = p.filas[0];
    p.agregarFila();
    const existente = p.filas[1];
    existente.esNuevo = false;
    p.marcarEliminar(nueva.id);
    expect(p.filas).toHaveLength(1);
    p.marcarEliminar(existente.id);
    expect(existente.marcadoEliminar).toBe(true);
    p.marcarEliminar(existente.id);
    expect(existente.marcadoEliminar).toBe(false);
  });

  it("cambiado detecta cambios en filas existentes", () => {
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.agregarFila();
    const f = p.filas[0];
    Object.assign(f, { unidad: "1", tipo_unidad: "CASA", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO", esNuevo: false });
    f.original = { unidad: "1", tipo_unidad: "CASA", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO", es_ocupante: "", recibe_notificaciones: "", es_responsable: "", sector: "", rut: "", telefono: "", vehiculos: [], bodegas: [] };
    expect(p.cambiado(f)).toBe(false);
    f.nombre = "B";
    expect(p.cambiado(f)).toBe(true);
  });

  it("enviar en reedición aplica ediciones y eliminaciones", async () => {
    importacionService.previewJson.mockResolvedValueOnce({
      data: { importacionId: "imp-r", totalFilas: 1, filasOk: 1, filasError: 0, filas: [] },
    });
    importacionService.ejecutar.mockResolvedValueOnce({
      data: { importacionId: "imp-r", filasOk: 1, filasOmitidas: 0, filasError: 0, errores: [] },
    });
    personasService.actualizarRecibeNotificaciones.mockResolvedValueOnce({ data: {} });

    const p = usePlanillaDatos({ cargarExistentes: false });
    p.modoReedicion = true;
    p.agregarFila();
    Object.assign(p.filas[0], { unidad: "1", tipo_unidad: "CASA", nombre: "Nuevo", email: "nuevo@x.cl", tipo_vinculo: "PROPIETARIO" });
    p.agregarFila();
    const editada = p.filas[1];
    Object.assign(editada, {
      unidad: "2", tipo_unidad: "CASA", nombre: "Antiguo", email: "antiguo@x.cl", tipo_vinculo: "PROPIETARIO",
      es_ocupante: "SI", recibe_notificaciones: "NO", es_responsable: "NO",
      esNuevo: false, __vinculoId: "v2", __personaId: "p2", __unidadId: "u2",
    });
    editada.original = { unidad: "2", tipo_unidad: "CASA", nombre: "Antiguo", email: "antiguo@x.cl", tipo_vinculo: "PROPIETARIO", es_ocupante: "SI", recibe_notificaciones: "NO", es_responsable: "NO", sector: "", rut: "", telefono: "", vehiculos: [], bodegas: [] };
    editada.recibe_notificaciones = "SI";

    await p.enviar();
    expect(importacionService.previewJson).toHaveBeenCalled();
    expect(importacionService.ejecutar).toHaveBeenCalled();
    expect(personasService.actualizarRecibeNotificaciones).toHaveBeenCalledWith("cid-1", "v2", true);
    expect(p.resultado.actualizadas).toBe(1);
  });

  it("enviar en reedición desactiva vínculos de filas eliminadas", async () => {
    personasService.desactivarVinculo.mockResolvedValueOnce({ data: {} });
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.modoReedicion = true;
    p.agregarFila();
    const f = p.filas[0];
    Object.assign(f, { unidad: "1", tipo_unidad: "CASA", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO", esNuevo: false, __vinculoId: "v1", __personaId: "p1", __unidadId: "u1", marcadoEliminar: true });
    await p.enviar();
    expect(personasService.desactivarVinculo).toHaveBeenCalledWith("cid-1", "v1");
    expect(p.filas).toHaveLength(0);
    expect(p.resultado.eliminadas).toBe(1);
  });

  it("enviar en reedición recrea el vínculo si cambia tipo/es_responsable", async () => {
    personasService.desactivarVinculo.mockResolvedValueOnce({ data: {} });
    personasService.crearVinculo.mockResolvedValueOnce({ data: { id: "v2" } });
    const p = usePlanillaDatos({ cargarExistentes: false });
    p.modoReedicion = true;
    p.agregarFila();
    const f = p.filas[0];
    Object.assign(f, { unidad: "1", tipo_unidad: "CASA", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO", es_ocupante: "SI", recibe_notificaciones: "SI", es_responsable: "NO", esNuevo: false, __vinculoId: "v1", __personaId: "p1", __unidadId: "u1" });
    f.original = { unidad: "1", tipo_unidad: "CASA", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO", es_ocupante: "SI", recibe_notificaciones: "SI", es_responsable: "SI", sector: "", rut: "", telefono: "", vehiculos: [], bodegas: [] };
    f.es_responsable = "NO";
    await p.enviar();
    expect(personasService.desactivarVinculo).toHaveBeenCalledWith("cid-1", "v1");
    expect(personasService.crearVinculo).toHaveBeenCalledWith("cid-1", expect.objectContaining({ personaId: "p1", unidadId: "u1", esResponsable: false }));
    expect(f.__vinculoId).toBe("v2");
  });
});