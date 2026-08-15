/**
 * numeracionUnidades.js — generación de números de unidad para el wizard de
 * configuración (paso "Unidades").
 *
 * Funciones puras: reciben el modo de numeración y sus opciones, devuelven un
 * array de ítems `{ numero, piso }` listos para el batch de unidades.
 *
 * Modos:
 *  - correlativo: secuencia desde un número inicial (1, 2, 3, ...). Sin piso.
 *  - por-piso:    piso × 100 + correlativo dentro del piso (101-106, 201-206).
 *                 El piso se deriva automáticamente.
 *  - personalizado: lista explícita escrita por el usuario (uno por línea o
 *                 separados por coma). Sin piso.
 */

export const MODOS_NUMERACION = [
  {
    value: "correlativo",
    label: "Correlativo",
    descripcion: "1, 2, 3, ... desde un número inicial",
  },
  {
    value: "por-piso",
    label: "Por piso",
    descripcion: "101-106, 201-206, ... (piso × 100 + unidad)",
  },
  {
    value: "personalizado",
    label: "Personalizado",
    descripcion: "Escribe cada número manualmente",
  },
];

/**
 * Normaliza una lista de números "personalizados" (una por línea o separados
 * por coma). Devuelve strings únicos en orden, sin vacíos.
 */
export function parsearListaPersonalizada(texto) {
  const vistos = new Set();
  const resultado = [];
  String(texto || "")
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => {
      if (!vistos.has(s)) {
        vistos.add(s);
        resultado.push(s);
      }
    });
  return resultado;
}

/**
 * Genera los ítems `{ numero, piso }` según el modo.
 * Si las opciones son inválidas devuelve [].
 */
export function generarNumeros(modo, opciones = {}) {
  switch (modo) {
    case "correlativo": {
      const base = parseInt(opciones.desde, 10);
      const cantidad = Number(opciones.cantidad);
      if (!Number.isFinite(base) || !Number.isFinite(cantidad) || cantidad <= 0) {
        return [];
      }
      return Array.from({ length: cantidad }, (_, i) => ({
        numero: String(base + i),
        piso: null,
      }));
    }
    case "por-piso": {
      const pisos = Number(opciones.pisos);
      const porPiso = Number(opciones.porPiso);
      if (!Number.isFinite(pisos) || !Number.isFinite(porPiso) || pisos <= 0 || porPiso <= 0) {
        return [];
      }
      const items = [];
      for (let p = 1; p <= pisos; p++) {
        for (let n = 1; n <= porPiso; n++) {
          items.push({ numero: String(p * 100 + n), piso: p });
        }
      }
      return items;
    }
    case "personalizado": {
      return parsearListaPersonalizada(opciones.lista).map((numero) => ({
        numero,
        piso: null,
      }));
    }
    default:
      return [];
  }
}
