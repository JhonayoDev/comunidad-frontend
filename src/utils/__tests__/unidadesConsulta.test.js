import { describe, it, expect } from "vitest";
import {
  construirIndice,
  contarRecursos,
  esUnidadCondominio,
  filtrarUnidades,
  opcionesPiso,
  opcionesSector,
  opcionesTipoUnidad,
  ordenarVinculos,
  paginarUnidades,
  personaPrincipal,
  recursosDeUnidad,
  resumenCondominio,
} from "@/utils/unidadesConsulta";

const unidad = (numero, extra = {}) => ({
  id: `u-${numero}`,
  numero: String(numero),
  tipo: "CASA",
  activo: true,
  piso: null,
  sectorNombre: null,
  ...extra,
});

const vinculoBien = (unidadId, vinculoId, extra = {}) => ({
  unidadId,
  vinculoId,
  unidadNumero: unidadId,
  tipoUnidad: "CASA",
  fechaInicio: null,
  fechaFin: null,
  ...extra,
});

const estacionamiento = (id, nombre, propietario, extra = {}) => ({
  id,
  nombre,
  piso: null,
  activo: true,
  propietario,
  arrendatarioEfectivo: null,
  arrendatariosFuturos: [],
  ...extra,
});

describe("esUnidadCondominio", () => {
  it("reconoce solo la unidad CONDOMINIO", () => {
    expect(esUnidadCondominio({ tipo: "CONDOMINIO" })).toBe(true);
    expect(esUnidadCondominio({ tipo: "CASA" })).toBe(false);
    expect(esUnidadCondominio(null)).toBe(false);
  });
});

describe("construirIndice", () => {
  it("asocia estacionamientos, bodegas, áreas y vehículos a su unidad", () => {
    const indice = construirIndice({
      estacionamientos: [
        estacionamiento("e1", "E-1", vinculoBien("u-1", "ve1")),
        estacionamiento("e2", "E-2", null, {
          arrendatarioEfectivo: vinculoBien("u-2", "ve2"),
          arrendatariosFuturos: [vinculoBien("u-3", "ve3")],
        }),
      ],
      bodegas: [{ id: "b1", nombre: "B-1", activo: true, propietario: vinculoBien("u-1", "vb1") }],
      espacios: [{ id: "a1", nombre: "Quincho", tipo: "QUINCHO", activo: true, propietario: vinculoBien("cond", "va1") }],
      vehiculos: [
        { id: "v1", patente: "ABCD12", tipo: "AUTO", unidadId: "u-1", activo: true },
        { id: "v2", patente: "ZZZZ99", tipo: "MOTO", unidadId: "u-1", activo: false },
        { id: "v3", patente: "BBBB34", tipo: "CAMIONETA", unidadId: "u-2", activo: true },
      ],
    });

    expect(indice.porUnidad["u-1"].estacionamientos).toHaveLength(1);
    expect(indice.porUnidad["u-1"].bodegas[0].nombre).toBe("B-1");
    expect(indice.porUnidad["u-1"].vehiculos.map((v) => v.patente)).toEqual(["ABCD12"]);
    expect(indice.porUnidad["u-2"].estacionamientos[0].rol).toBe("ARRENDATARIO");
    expect(indice.porUnidad["u-3"].estacionamientos[0].rol).toBe("ARRENDATARIO_FUTURO");
    expect(indice.porUnidad["cond"].espacios[0].nombre).toBe("Quincho");
  });

  it("ignora bienes inactivos y no duplica un bien en la misma unidad", () => {
    const indice = construirIndice({
      estacionamientos: [
        estacionamiento("e1", "E-1", vinculoBien("u-1", "ve1"), { activo: false }),
        estacionamiento("e2", "E-2", vinculoBien("u-1", "ve2"), {
          arrendatarioEfectivo: vinculoBien("u-1", "ve2b"),
        }),
      ],
    });

    expect(indice.porUnidad["u-1"].estacionamientos).toHaveLength(1);
    expect(indice.porUnidad["u-1"].estacionamientos[0].rol).toBe("PROPIETARIO");
  });

  it("entrega listas vacías para una unidad sin recursos", () => {
    const indice = construirIndice({});
    expect(recursosDeUnidad(indice, "u-9")).toEqual({
      vehiculos: [],
      estacionamientos: [],
      bodegas: [],
      espacios: [],
    });
  });
});

describe("contarRecursos", () => {
  it("cuenta los recursos indexados por unidad", () => {
    const indice = construirIndice({
      vehiculos: [{ id: "v1", patente: "A", unidadId: "u-1", activo: true }],
      bodegas: [{ id: "b1", nombre: "B-1", activo: true, propietario: vinculoBien("u-1", "vb") }],
    });
    expect(contarRecursos(indice, "u-1")).toEqual({
      vehiculos: 1,
      estacionamientos: 0,
      bodegas: 1,
      espacios: 0,
    });
    expect(contarRecursos(indice, "u-2")).toEqual({
      vehiculos: 0,
      estacionamientos: 0,
      bodegas: 0,
      espacios: 0,
    });
  });
});

describe("resumenCondominio", () => {
  it("cuenta datos reales y separa estacionamientos de visita", () => {
    const resumen = resumenCondominio({
      unidades: [
        unidad(1),
        unidad(2, { tipo: "DEPARTAMENTO" }),
        unidad("COND", { tipo: "CONDOMINIO" }),
        unidad(3, { activo: false }),
      ],
      estacionamientos: [
        { id: "1", nombre: "E-1", activo: true },
        { id: "2", nombre: "E-2", activo: true },
        { id: "3", nombre: "EV-1", activo: true },
        { id: "4", nombre: "EV-2", activo: false },
      ],
      bodegas: [
        { id: "b1", nombre: "oficina", activo: true },
        { id: "b2", nombre: "B-2", activo: false },
      ],
      espacios: [
        { id: "a1", nombre: "Quincho", activo: true },
        { id: "a2", nombre: "Piscina", activo: true },
        { id: "a3", nombre: "Sala", activo: false },
      ],
    });

    expect(resumen).toEqual({
      unidades: 2,
      estacionamientos: { total: 3, residentes: 2, visitas: 1 },
      bodegas: 1,
      areasComunes: 2,
    });
  });
});

describe("filtrarUnidades", () => {
  const unidades = [
    unidad(100),
    unidad(10),
    unidad(1000),
    unidad(2),
    unidad(200, { tipo: "DEPARTAMENTO", sectorNombre: "B", piso: 2 }),
    unidad("COND", { tipo: "CONDOMINIO" }),
  ];

  it("excluye CONDOMINIO e inactivas y ordena naturalmente", () => {
    const lista = filtrarUnidades([...unidades, unidad(3, { activo: false })]);
    expect(lista.map((u) => u.numero)).toEqual(["2", "10", "100", "200", "1000"]);
  });

  it("pone primero la coincidencia exacta de número", () => {
    const lista = filtrarUnidades(unidades, { q: "100" });
    expect(lista.map((u) => u.numero)).toEqual(["100", "1000"]);
  });

  it("filtra por tipo, sector y piso", () => {
    expect(filtrarUnidades(unidades, { tipo: "DEPARTAMENTO" }).map((u) => u.numero)).toEqual(["200"]);
    expect(filtrarUnidades(unidades, { sector: "B" }).map((u) => u.numero)).toEqual(["200"]);
    expect(filtrarUnidades(unidades, { piso: 2 }).map((u) => u.numero)).toEqual(["200"]);
  });

  it("busca por texto ignorando acentos y por número parcial", () => {
    const lista = filtrarUnidades(
      [unidad(1, { sectorNombre: "Edificio Ñuñoa" }), unidad(2, { sectorNombre: "Los Robles" })],
      { q: "nunoa" },
    );
    expect(lista.map((u) => u.numero)).toEqual(["1"]);
    expect(filtrarUnidades(unidades, { q: "20" }).map((u) => u.numero)).toEqual(["200"]);
  });

  it("devuelve todo cuando la consulta está vacía", () => {
    expect(filtrarUnidades(unidades, { q: "   " })).toHaveLength(5);
  });
});

describe("opciones de filtro", () => {
  const unidades = [
    unidad(1, { sectorNombre: "B" }),
    unidad(2, { sectorNombre: "A", piso: 2 }),
    unidad(3, { sectorNombre: "A", piso: -1 }),
    unidad("COND", { tipo: "CONDOMINIO" }),
  ];

  it("sectores únicos sin CONDOMINIO", () => {
    expect(opcionesSector(unidades).map((o) => o.value)).toEqual(["A", "B"]);
  });

  it("pisos únicos ordenados de subterráneo a superior", () => {
    expect(opcionesPiso(unidades).map((o) => o.value)).toEqual([-1, 2]);
  });

  it("tipos presentes sin CONDOMINIO", () => {
    expect(opcionesTipoUnidad(unidades).map((o) => o.value)).toEqual(["CASA"]);
  });
});

describe("paginarUnidades", () => {
  const lista = Array.from({ length: 30 }, (_, i) => unidad(i + 1));

  it("entrega la página pedida y el first de PrimeVue", () => {
    const pagina = paginarUnidades(lista, 2, 25);
    expect(pagina.items).toHaveLength(5);
    expect(pagina.page).toBe(2);
    expect(pagina.first).toBe(25);
    expect(pagina.paginas).toBe(2);
    expect(pagina.total).toBe(30);
  });

  it("sanea páginas fuera de rango", () => {
    expect(paginarUnidades(lista, 99, 25).page).toBe(2);
    expect(paginarUnidades(lista, 0, 25).page).toBe(1);
    expect(paginarUnidades([], 3, 25)).toMatchObject({ items: [], page: 1, total: 0 });
  });
});

describe("ordenarVinculos / personaPrincipal", () => {
  const vinculos = [
    { id: "3", personaNombre: "Zoe", tipo: "RESIDENTE_ADICIONAL" },
    { id: "1", personaNombre: "Ana", tipo: "ARRENDATARIO" },
    { id: "2", personaNombre: "Luis", tipo: "PROPIETARIO" },
  ];

  it("ordena por tipo de vínculo y nombre", () => {
    expect(ordenarVinculos(vinculos).map((v) => v.id)).toEqual(["2", "1", "3"]);
  });

  it("elige propietario como persona principal", () => {
    expect(personaPrincipal(vinculos).personaNombre).toBe("Luis");
    expect(personaPrincipal([])).toBeNull();
  });
});
