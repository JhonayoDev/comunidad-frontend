import {
  emailValido,
  limpiarRut,
  normalizarEmail,
  normalizarRut,
  rutValido,
} from "@/utils/validadoresChile";

/**
 * Utilidades de búsqueda de personas.
 *
 * La búsqueda local de la vista debe tolerar acentos, formato de RUT y
 * teléfono, y varias palabras en cualquier orden. El `LIKE` del backend no
 * normaliza acentos y `RutUtil.normalizar` rompe las búsquedas parciales, así
 * que esas reglas viven en el cliente.
 */

/** Minúsculas, sin acentos, con espacios colapsados. */
export function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Solo dígitos y DV en mayúscula: "12.345.678-k" → "12345678K". */
export function normalizarRutBusqueda(valor) {
  return limpiarRut(valor);
}

/** Cantidad mínima de dígitos para intentar comparar un RUT o teléfono. */
const MIN_DIGITOS_PARCIAL = 3;

function digitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

/**
 * Divide la consulta en tokens normalizados. Cada token debe coincidir para
 * que la persona pase el filtro (AND), lo que permite buscar "perez juan".
 */
export function tokensDeBusqueda(consulta) {
  const texto = normalizarTexto(consulta);
  return texto ? texto.split(" ").filter(Boolean) : [];
}

function coincideToken(token, campos, rut, telefono) {
  const tokenTexto = normalizarTexto(token).replace(/^[.,;:()]+|[.,;:()]+$/g, "");
  if (!tokenTexto) return true;

  if (campos.some((campo) => campo.includes(tokenTexto))) return true;

  const tokenDigitos = digitos(token);
  if (tokenDigitos.length >= MIN_DIGITOS_PARCIAL) {
    if (telefono.includes(tokenDigitos)) return true;
    if (rut) {
      // Acepta RUT completo con DV o solo el cuerpo (la búsqueda parcial del
      // backend no funciona, en cliente sí).
      const cuerpo = rut.slice(0, -1);
      if (rut.includes(tokenDigitos) || cuerpo.startsWith(tokenDigitos)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * ¿La persona coincide con la consulta?
 *
 * @param {object} persona resumen de persona (nombre, email, rut, teléfono,
 *   cargo, unidad principal…)
 * @param {string} consulta texto libre
 * @param {string[]} camposExtra etiquetas derivadas que también deben ser
 *   buscables (tipos de participación, estado de membresía…)
 */
export function coincidePersona(persona, consulta, camposExtra = []) {
  const tokens = tokensDeBusqueda(consulta);
  if (!tokens.length) return true;
  if (!persona) return false;

  const campos = [
    persona.nombre,
    persona.email,
    persona.emailCambioPendiente,
    persona.telefono,
    persona.cargo,
    persona.unidadPrincipal,
    ...camposExtra,
  ].map(normalizarTexto);

  const rut = normalizarRutBusqueda(persona.rut);
  const telefono = digitos(persona.telefono);

  return tokens.every((token) => coincideToken(token, campos, rut, telefono));
}

/** Email con estructura completa (nombre@dominio). */
export function esEmailCompleto(valor) {
  return emailValido(valor);
}

/** RUT completo y con dígito verificador válido. */
export function esRutCompleto(valor) {
  return rutValido(valor);
}

/**
 * Detecta si la consulta ya permite buscar la identidad global (el backend
 * exige email o RUT exactos). Devuelve `{ tipo, valor }` o `null`.
 */
export function identidadDeBusqueda(valor) {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  if (esEmailCompleto(texto)) {
    return { tipo: "email", valor: normalizarEmail(texto) };
  }
  if (esRutCompleto(texto)) {
    return { tipo: "rut", valor: normalizarRut(texto) };
  }
  return null;
}
