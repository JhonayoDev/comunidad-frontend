// ─── Parser SSE puro ─────────────────────────────────────────────────────────
// Parsea el cuerpo de una respuesta text/event-stream recibida por fetch() +
// ReadableStream. Es una función factory porque el parseo es incremental: el
// buffer de la "última línea incompleta" vive dentro del closure y se consume
// a medida que llegan chunks.
//
// Cumple la especificación SSE (event-stream) para el subconjunto que usa el
// backend de comunidad:
//   - Línea de comentario  `:ping` → se ignora (heartbeat keep-alive).
//   - Campo `event:` → nombre del evento.
//   - Campo `data:` → dato; varias líneas `data:` se unen con "\n".
//   - Frame terminado por línea en blanco.
//   - Terminaciones de línea: \n, \r\n y \r (se normalizan).

const CAMPO_EVENTO = "event";
const CAMPO_DATA = "data";

/** Parsea un frame completo (sin línea en blanco final) a {event, data}. */
function parsearFrame(frame) {
  let eventName = "message";
  const dataLines = [];

  for (const linea of frame.split("\n")) {
    if (linea === "") continue;
    if (linea.startsWith(":")) continue;

    const colonIndex = linea.indexOf(":");
    const campo = colonIndex === -1 ? linea : linea.slice(0, colonIndex);
    const valor = colonIndex === -1 ? "" : linea.slice(colonIndex + 1).replace(/^ /, "");

    if (campo === CAMPO_EVENTO) {
      eventName = valor;
    } else if (campo === CAMPO_DATA) {
      dataLines.push(valor);
    }
  }

  if (dataLines.length === 0) return null;
  return { event: eventName, data: dataLines.join("\n") };
}

/**
 * Factory del parser incremental.
 *
 * @returns {Function} recibe un chunk decodificado (string) y devuelve un
 * array de frames completos parseados como `{ event, data }`. Los frames
 * incompletos quedan en el buffer interno.
 */
export function crearParserSse() {
  let buffer = "";

  return function parsearSse(chunk) {
    buffer = (buffer + chunk)
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

    const frames = buffer.split("\n\n");
    buffer = frames.pop();

    const eventos = [];
    for (const frame of frames) {
      const evento = parsearFrame(frame);
      if (evento) eventos.push(evento);
    }
    return eventos;
  };
}
