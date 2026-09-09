// Parser CSV incremental y puro, sin dependencias.
// Soporta: delimitador ";" o "," (autodetectado en la primera fila),
// campos entre comillas dobles (con comillas escapadas ""), saltos de
// línea dentro de campos, CRLF/LF y BOM UTF-8.
//
// El formato de la planilla es persona-por-fila: una fila = una persona
// vinculada a una unidad, con columnas fijas para vehículos/estacionamientos
// (patente1..3, est1..3) y bodegas (bodega1..3 si aplica). El esquema de
// columnas vive en src/data/planillaColumnas.js (fuente única).

import { COLUMNAS_DEFAULT, clavesColumnas } from "@/data/planillaColumnas";

function detectarDelimitador(texto) {
  const primeraLinea = texto.slice(0, texto.indexOf("\n") === -1 ? texto.length : texto.indexOf("\n"));
  const cuenta = (c) => primeraLinea.split(c).length - 1;
  return cuenta(";") >= cuenta(",") ? ";" : ",";
}

function parsearLinea(linea, delim) {
  const campos = [];
  let campo = "";
  let dentroComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const ch = linea[i];
    if (dentroComillas) {
      if (ch === '"') {
        if (linea[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          dentroComillas = false;
        }
      } else {
        campo += ch;
      }
    } else if (ch === '"') {
      dentroComillas = true;
    } else if (ch === delim) {
      campos.push(campo);
      campo = "";
    } else {
      campo += ch;
    }
  }
  campos.push(campo);
  return campos;
}

export function parsearCsv(texto) {
  const sinBom = texto.replace(/^\uFEFF/, "").replace(/^\uFFFD/, "");
  const delim = detectarDelimitador(sinBom);

  // Acumulador incremental de líneas (maneja campos multilínea entre comillas).
  const filas = [];
  let buffer = "";
  const lineas = sinBom.split(/\r\n|\r|\n/);
  for (const linea of lineas) {
    buffer = buffer ? `${buffer}\n${linea}` : linea;
    const comillas = buffer.split('"').length - 1;
    if (comillas % 2 !== 0) continue; // campo abierto — sigue acumulando
    filas.push(parsearLinea(buffer, delim));
    buffer = "";
  }
  if (buffer) filas.push(parsearLinea(buffer, delim));

  if (!filas.length) return { encabezados: [], filas: [] };

  const encabezados = filas[0].map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, "")
  );
  const filasDatos = filas.slice(1).filter((f) => f.some((c) => c.trim() !== ""));

  return { encabezados, filas: filasDatos, delimitador: delim };
}

// Normaliza las filas al contrato de columnas esperado (orden + nulos).
// `columnas` es el esquema de src/data/planillaColumnas.js (default sin bodegas).
export function normalizarFilas(encabezados, filas, columnas = COLUMNAS_DEFAULT) {
  const claves = clavesColumnas(columnas);
  const idx = (nombre) => encabezados.indexOf(nombre);
  return filas.map((f) => {
    const obtener = (nombre) => {
      const i = idx(nombre);
      return i >= 0 && i < f.length ? (f[i] ?? "").trim() : "";
    };
    return Object.fromEntries(claves.map((c) => [c, obtener(c)]));
  });
}

export { COLUMNAS_DEFAULT as COLUMNAS };