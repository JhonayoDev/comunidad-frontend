import { describe, it, expect, beforeEach, vi } from "vitest";
import { validarFila, usePlanillaDatos } from "@/composables/usePlanillaDatos";
import { filaAPayload } from "@/data/planillaColumnas";

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({ condominioActualId: "cid-1" }),
}));

describe("planillaDatos - filaAPayload", () => {
  it("arma el payload anidado a partir de una fila plana", () => {
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
      patente1: "ABCD01",
      tipo_vehiculo1: "AUTO",
      marca1: "Toyota",
      modelo1: "Corolla",
      color1: "Blanco",
      est1: "E-1",
      patente2: "",
      bodega1: "B-1",
    });
    expect(p.persona.nombre).toBe("Francisca Morales Díaz");
    expect(p.vinculo.esResponsable).toBe(true);
    expect(p.vehiculos).toHaveLength(1);
    expect(p.vehiculos[0]).toMatchObject({ patente: "ABCD01", estacionamiento: "E-1" });
    expect(p.bodegas).toEqual(["B-1"]);
  });

  it("no incluye vehículos vacíos", () => {
    const p = filaAPayload({ unidad: "2", nombre: "X", email: "x@x.cl", patente1: "", patente2: "", patente3: "" });
    expect(p.vehiculos).toHaveLength(0);
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
      { unidad: "1", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO", patente1: "ABCD01" },
      { patentesArchivo: new Set(["ABCD01"]), patentesExistentes: new Set(["XYZ99"]) },
    );
    expect(e.some((x) => x.includes("Patente duplicada"))).toBe(true);

    const e2 = validarFila(
      { unidad: "1", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO", patente1: "ABCD01" },
      { patentesExistentes: new Set(["ABCD01"]) },
    );
    expect(e2.some((x) => x.includes("Patente ya registrada"))).toBe(true);
  });

  it("detecta email ya registrado", () => {
    const e = validarFila(
      { unidad: "1", nombre: "A", email: "a@a.cl", tipo_vinculo: "PROPIETARIO" },
      { emailsExistentes: new Set(["a@a.cl"]) },
    );
    expect(e.some((x) => x.includes("Email ya registrado"))).toBe(true);
  });
});

describe("planillaDatos - usePlanillaDatos", () => {
  beforeEach(() => {
    sessionStorage.clear();
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
});