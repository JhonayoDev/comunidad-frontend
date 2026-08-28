import { describe, it, expect } from "vitest";
import { parsearCsv, normalizarFilas, COLUMNAS } from "@/utils/csvParser";
import { clavesColumnas } from "@/data/planillaColumnas";

const CSV_DEMO = `unidad;tipo_unidad;sector;nombre;email;rut;telefono;tipo_vinculo;es_ocupante;recibe_notificaciones;es_responsable;patente1;tipo_vehiculo1;marca1;modelo1;color1;est1;patente2;tipo_vehiculo2;marca2;modelo2;color2;est2;patente3;tipo_vehiculo3;marca3;modelo3;color3;est3
1;CASA;Sector A;Francisca Morales Díaz;francisca.morales@test.com;18.901.234-5;+56978901234;PROPIETARIO;SI;SI;SI;ABCD01;AUTO;Toyota;Corolla;Blanco;E-1;;;;;;;;
1;CASA;Sector A;Camila Reyes Vidal;camila.reyes@test.com;30.123.456-7;+56990123457;RESIDENTE_ADICIONAL;SI;SI;NO;;;;;;;;;;;;
3;CASA;Sector B;Hernán Vargas Soto;hernan.vargas@test.com;19.012.345-6;+56989012345;PROPIETARIO;SI;SI;SI;ABCD02;AUTO;Hyundai;Tucson;Gris;E-3;ABCD03;CAMIONETA;Chevrolet;Colorado;Plateado;E-2;`;

describe("csvParser", () => {
  it("detecta el delimitador ; y parsea encabezados normalizados", () => {
    const { encabezados, delimitador } = parsearCsv(CSV_DEMO);
    expect(delimitador).toBe(";");
    expect(encabezados).toEqual(clavesColumnas(COLUMNAS));
  });

  it("cuenta correctamente filas de datos (sin header ni vacías)", () => {
    const { filas } = parsearCsv(CSV_DEMO);
    expect(filas).toHaveLength(3);
  });

  it("normaliza filas al contrato persona-por-fila", () => {
    const { encabezados, filas } = parsearCsv(CSV_DEMO);
    const norm = normalizarFilas(encabezados, filas);
    expect(norm[0]).toMatchObject({
      unidad: "1",
      tipo_unidad: "CASA",
      nombre: "Francisca Morales Díaz",
      email: "francisca.morales@test.com",
      es_responsable: "SI",
      patente1: "ABCD01",
      est1: "E-1",
      patente2: "",
    });
  });

  it("soporta una persona con múltiples vehículos en columnas numeradas", () => {
    const { encabezados, filas } = parsearCsv(CSV_DEMO);
    const norm = normalizarFilas(encabezados, filas);
    const hernan = norm.find((f) => f.email === "hernan.vargas@test.com");
    expect(hernan.patente1).toBe("ABCD02");
    expect(hernan.patente2).toBe("ABCD03");
    expect(hernan.patente3).toBe("");
  });

  it("maneja comillas y BOM UTF-8", () => {
    const csv = '\uFEFFunidad;nombre\n"1";"Jhon, el Admin"\n';
    const { encabezados, filas } = parsearCsv(csv);
    expect(encabezados).toEqual(["unidad", "nombre"]);
    expect(filas[0][1]).toBe("Jhon, el Admin");
  });

  it("soporta delimitador coma y campos vacíos", () => {
    const csv = "unidad,tipo_unidad,nombre\n2,CASA,Sin vehículo\n";
    const { delimitador, encabezados, filas } = parsearCsv(csv);
    expect(delimitador).toBe(",");
    expect(encabezados).toEqual(["unidad", "tipo_unidad", "nombre"]);
    expect(filas[0][0]).toBe("2");
    expect(filas[0].length).toBe(3);
  });

  it("clavesColumnas devuelve las claves del esquema", () => {
    expect(clavesColumnas(COLUMNAS)).toEqual([
      "unidad", "tipo_unidad", "sector", "nombre", "email", "rut", "telefono",
      "tipo_vinculo", "es_ocupante", "recibe_notificaciones", "es_responsable",
      "patente1", "tipo_vehiculo1", "marca1", "modelo1", "color1", "est1",
      "patente2", "tipo_vehiculo2", "marca2", "modelo2", "color2", "est2",
      "patente3", "tipo_vehiculo3", "marca3", "modelo3", "color3", "est3",
    ]);
  });
});