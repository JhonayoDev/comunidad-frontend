const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOMBRE_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ' .-]+$/;

export function limpiarRut(valor) {
  return String(valor || "").replace(/[^0-9kK]/g, "").toUpperCase();
}

function formatearCuerpo(cuerpo) {
  return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function digitoVerificador(cuerpo) {
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const dv = 11 - (suma % 11);
  if (dv === 11) return "0";
  if (dv === 10) return "K";
  return String(dv);
}

export function formatearRut(valor) {
  const limpio = limpiarRut(valor);
  if (!limpio) return "";
  if (limpio.length > 9) return formatearRut(limpio.slice(0, 9));
  if (/^\d+$/.test(limpio) && limpio.length <= 8) {
    return formatearCuerpo(limpio);
  }
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return `${formatearCuerpo(cuerpo)}-${dv}`;
}

export function formatearRutCompleto(valor) {
  const limpio = limpiarRut(valor);
  if (!limpio) return "";
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (digitoVerificador(cuerpo) === dv) {
    return `${formatearCuerpo(cuerpo)}-${dv}`;
  }
  return formatearRut(limpio);
}

export function rutValido(rut) {
  const limpio = limpiarRut(rut);
  if (limpio.length < 2 || limpio.length > 9) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;
  if (!/^[0-9K]$/.test(dv)) return false;
  return digitoVerificador(cuerpo) === dv;
}

export function normalizarRut(rut) {
  return formatearRutCompleto(rut);
}

export function limpiarTelefono(valor) {
  const s = String(valor || "");
  let d = s.replace(/\D/g, "");
  if (s.startsWith("+56")) {
    d = d.slice(2);
  } else if (d.startsWith("56") && d.length > 9) {
    d = d.slice(2);
  }
  if (d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 9);
}

export function formatearTelefono(valor) {
  const d = limpiarTelefono(valor);
  if (!d) return "";
  if (d.length <= 1) return `+56 ${d}`;
  if (d.length <= 5) return `+56 ${d[0]} ${d.slice(1)}`;
  return `+56 ${d[0]} ${d.slice(1, 5)} ${d.slice(5)}`;
}

export function telefonoChileValido(valor) {
  const d = limpiarTelefono(valor);
  return d.length === 9 && (d[0] === "2" || d[0] === "9");
}

export function normalizarTelefono(valor) {
  const d = limpiarTelefono(valor);
  return d ? `+56${d}` : "";
}

export function emailValido(email) {
  return EMAIL_REGEX.test(String(email || "").trim());
}

export function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function nombreValido(nombre) {
  const n = String(nombre || "").trim();
  if (n.length < 2) return false;
  return NOMBRE_REGEX.test(n);
}