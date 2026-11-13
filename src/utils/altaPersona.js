/**
 * Construcción del payload del alta atómica de persona (backend V85).
 *
 * El alta es una sola petición: identidad nueva (`persona`) o existente
 * (`personaId`) + una asociación obligatoria (`UNIDAD`, `CARGO` o
 * `PROVEEDOR`). El backend ignora `PENDIENTE` en el flujo normal, por eso la
 * UI no lo ofrece: las membresías pendientes solo nacen de importaciones o de
 * invitaciones.
 */

export const ASOCIACION_UNIDAD = "UNIDAD";
export const ASOCIACION_CARGO = "CARGO";
export const ASOCIACION_PROVEEDOR = "PROVEEDOR";

function fechaISO(valor) {
  if (!valor) return null;
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return valor.toISOString().slice(0, 10);
  }
  return String(valor).slice(0, 10);
}

function texto(valor) {
  const limpio = typeof valor === "string" ? valor.trim() : valor;
  return limpio ? limpio : null;
}

/**
 * Construye el objeto `asociacion` del contrato. Devuelve `null` si el tipo
 * no es válido.
 */
export function construirAsociacion(form = {}) {
  const tipo = form.asociacionTipo;
  if (tipo === ASOCIACION_UNIDAD) {
    return {
      tipo,
      unidad: {
        unidadId: form.unidadId || null,
        tipoVinculo: form.tipoVinculo || null,
        esOcupante: !!form.esOcupante,
        recibeNotificaciones: form.recibeNotificaciones !== false,
        esResponsable: !!form.esResponsable,
        fechaInicio: fechaISO(form.fechaInicio),
      },
    };
  }
  if (tipo === ASOCIACION_CARGO) {
    return {
      tipo,
      cargo: {
        cargo: form.cargo || null,
        fechaInicio: fechaISO(form.fechaInicio),
      },
    };
  }
  if (tipo === ASOCIACION_PROVEEDOR) {
    return {
      tipo,
      proveedor: {
        empresa: texto(form.empresa),
        rubro: texto(form.rubro),
        contacto: texto(form.contactoProveedor),
      },
    };
  }
  return null;
}

/**
 * Valida la asociación antes de enviar. Devuelve un mapa de errores por campo
 * (vacío si es válida).
 */
export function validarAsociacion(form = {}) {
  const errores = {};
  const tipo = form.asociacionTipo;
  if (!tipo) {
    errores.asociacionTipo = "Selecciona cómo se incorpora al condominio";
    return errores;
  }
  if (tipo !== ASOCIACION_PROVEEDOR && !fechaISO(form.fechaInicio)) {
    errores.fechaInicio = "Selecciona la fecha de inicio";
  }
  if (tipo === ASOCIACION_UNIDAD) {
    if (!form.unidadId) errores.unidadId = "Selecciona una unidad";
    if (!form.tipoVinculo) errores.tipoVinculo = "Selecciona el tipo de vínculo";
  }
  if (tipo === ASOCIACION_CARGO && !form.cargo) {
    errores.cargo = "Selecciona un cargo";
  }
  return errores;
}

/**
 * Construye el body de `POST /personas`.
 *
 * @param {object} opciones
 * @param {object|null} opciones.persona datos de identidad nueva
 * @param {string|null} opciones.personaId identidad existente a reutilizar
 * @param {object|null} opciones.asociacion resultado de `construirAsociacion`
 */
export function construirPayloadAlta({ persona, personaId, asociacion } = {}) {
  const body = {};
  if (personaId) {
    body.personaId = personaId;
  } else if (persona) {
    body.persona = {
      nombre: texto(persona.nombre),
      email: texto(persona.email),
      rut: texto(persona.rut),
      telefono: texto(persona.telefono),
    };
  }
  if (asociacion) body.asociacion = asociacion;
  return body;
}

/**
 * Normaliza el 409 recuperable del backend (`personaId` + `conflicto`).
 * Devuelve `null` si el error no es un conflicto de identidad.
 */
export function datosConflicto(error) {
  if (error?.response?.status !== 409) return null;
  const data = error.response.data || {};
  return {
    personaId: data.personaId || null,
    conflicto: data.conflicto || null,
    message: data.message || "Ya existe una persona con esos datos.",
  };
}

/**
 * Texto legible del tipo de participación resultante del alta.
 */
export function mensajeAlta(data) {
  const tipos = Array.isArray(data?.tiposParticipacion)
    ? data.tiposParticipacion
    : [];
  if (!tipos.length) return "Persona registrada en el condominio.";
  const etiquetas = tipos
    .map((tipo) => {
      const mapa = {
        PROPIETARIO: "propietario",
        ARRENDATARIO: "arrendatario",
        DEPENDIENTE: "dependiente",
        TRABAJADOR: "trabajador",
        ADMINISTRACION: "administración",
        PROVEEDOR: "proveedor",
      };
      return mapa[tipo] || tipo.toLowerCase();
    })
    .join(" y ");
  return `Persona registrada en el condominio como ${etiquetas}.`;
}
