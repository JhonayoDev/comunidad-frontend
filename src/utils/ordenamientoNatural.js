// Comparador de orden natural para números de unidad (y nombres con prefijos).
// El backend ordena `numero` como VARCHAR (lexicográfico): "1", "10", "11",
// "2", "20"... Este comparador ordena por chunks: los segmentos numéricos se
// comparan como números y el texto lexicográficamente (los números van antes
// que el texto). Resultado: 1, 2, 3, ..., 10, 11, ..., 20, 21.

const CHUNK_NUMERICO = /^\d+$/;

function chunksDe(valor) {
  return String(valor ?? "").match(/\d+|\D+/g) || [];
}

export function compararUnidades(a, b) {
  const ca = chunksDe(a);
  const cb = chunksDe(b);
  const n = Math.max(ca.length, cb.length);
  for (let i = 0; i < n; i += 1) {
    const x = ca[i] ?? "";
    const y = cb[i] ?? "";
    if (x === y) continue;
    const xn = CHUNK_NUMERICO.test(x);
    const yn = CHUNK_NUMERICO.test(y);
    if (xn && yn) return Number(x) - Number(y);
    if (xn) return -1; // números antes que texto
    if (yn) return 1;
    return x < y ? -1 : 1;
  }
  return 0;
}

export function ordenarUnidades(lista) {
  return [...(lista || [])].sort((a, b) => compararUnidades(a.numero, b.numero));
}