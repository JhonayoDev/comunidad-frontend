/**
 * fechas.js
 *
 * Formateadores de fecha/hora con guard contra fechas inválidas. `new Date(x).toLocale*`
 * lanza `RangeError: Invalid time value` si `x` es `null`/`undefined`/malformado, y ese
 * error durante un render del dashboard se convierte en pantalla blanca. Todos los
 * formateadores devuelven `""` cuando la fecha no es parseable.
 */

function parsearFecha(iso) {
  if (iso == null || iso === "") return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Hora corta HH:mm (o "" si la fecha es inválida). */
export function formatearHora(iso) {
  const d = parsearFecha(iso);
  return d
    ? d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
    : "";
}

/** Fecha corta en español (o "" si la fecha es inválida). */
export function formatearFecha(iso) {
  const d = parsearFecha(iso);
  return d
    ? d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })
    : "";
}
