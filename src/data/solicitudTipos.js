/**
 * Registro de tipos de solicitud/reclamo.
 *
 * Cada tipo define:
 *  - `campos`: formulario preformado (la casa se elige aparte, opcional).
 *  - `prefill(perfil)`: valores iniciales (p. ej. RUT actual del perfil).
 *  - `validacion(datos)`: errores por campo antes de enviar.
 *  - `generarTitulo/generarDescripcion/generarPrioridad`: cómo se resume el
 *    formulario en los campos planos que exige el backend.
 *
 * El objeto `datos` viaja tal cual al backend (JSONB validado por tipo).
 */
import {
  formatearRut,
  formatearRutCompleto,
  limpiarRut,
  normalizarRut,
  rutValido,
} from "@/utils/validadoresChile";

export const MOTIVOS_CORRECCION_RUT = [
  { label: "Error de tipeo", value: "ERROR_TIPEO" },
  { label: "Cambio legal de RUT", value: "CAMBIO_LEGAL" },
  { label: "Otro", value: "OTRO" },
];

export const TIPOS_SOLICITUD = [
  {
    value: "CORRECCION_RUT",
    label: "Corrección de RUT",
    icon: "pi pi-id-card",
    categoria: "SOLICITUD",
    descripcion:
      "Solicita la corrección de tu RUT en el sistema. Requiere aprobación administrativa.",
    campos: [
      {
        key: "rutActual",
        label: "RUT actual",
        type: "rut",
        readonly: true,
        required: false,
        ayuda: "Tu RUT registrado actualmente en el sistema",
      },
      {
        key: "rutNuevo",
        label: "RUT corregido",
        type: "rut",
        required: true,
        ayuda: "El RUT correcto (con puntos y guion, ej: 12.345.678-9)",
      },
      {
        key: "motivo",
        label: "Motivo",
        type: "select",
        required: true,
        options: MOTIVOS_CORRECCION_RUT,
        ayuda: "Selecciona la razón de la corrección",
      },
      {
        key: "motivoOtro",
        label: "Especificar motivo",
        type: "text",
        required: false,
        showWhen: { campo: "motivo", valor: "OTRO" },
        ayuda: "Describe el motivo si seleccionaste 'Otro'",
      },
      {
        key: "evidenciaUrl",
        label: "URL de evidencia (opcional)",
        type: "url",
        required: false,
        ayuda: "Enlace a un documento que respalde la corrección (certificado, escritura, etc.)",
      },
    ],
    prefill: (perfil) => ({
      rutActual: perfil?.rut ? formatearRut(perfil.rut) : "",
    }),
    validacion: (datos) => {
      const errores = {};
      if (!datos.rutNuevo) {
        errores.rutNuevo = "El RUT corregido es obligatorio";
      } else if (!esRutChilenoValido(datos.rutNuevo)) {
        errores.rutNuevo = "El RUT corregido no es válido";
      } else if (
        datos.rutActual &&
        normalizarRut(datos.rutNuevo) === normalizarRut(datos.rutActual)
      ) {
        errores.rutNuevo = "El RUT corregido debe ser distinto del actual";
      }
      if (!datos.motivo) errores.motivo = "El motivo es obligatorio";
      if (datos.motivo === "OTRO" && !String(datos.motivoOtro || "").trim()) {
        errores.motivoOtro = "Debes especificar el motivo";
      }
      return errores;
    },
    generarTitulo: (datos) => {
      const rut = datos.rutNuevo ? ` (${formatearRut(datos.rutNuevo)})` : "";
      return `Corrección de RUT${rut}`;
    },
    generarDescripcion: (datos) => {
      const motivo = MOTIVOS_CORRECCION_RUT.find((m) => m.value === datos.motivo);
      const detalle = datos.motivo === "OTRO" ? datos.motivoOtro : motivo?.label;
      const partes = [`Motivo: ${detalle || "No especificado"}`];
      if (datos.evidenciaUrl) partes.push(`Evidencia: ${datos.evidenciaUrl}`);
      return partes.join("\n");
    },
    generarPrioridad: () => "NORMAL",
  },
  {
    value: "INSTALACION_FOCO",
    label: "Instalación de foco / iluminación",
    icon: "pi pi-lightbulb",
    categoria: "SOLICITUD",
    descripcion:
      "Solicita la instalación o reparación de luminarias en áreas comunes.",
    campos: [
      {
        key: "ubicacion",
        label: "Ubicación",
        type: "text",
        required: true,
        ayuda: "Sector, pasillo, escalera o área común específica",
      },
      {
        key: "descripcion",
        label: "Descripción",
        type: "textarea",
        required: true,
        ayuda: "Detalla qué se necesita (cambio de foco, nueva instalación, reparación)",
      },
      {
        key: "urgente",
        label: "Es urgente (riesgo de seguridad)",
        type: "boolean",
        required: false,
        ayuda: "Marca si existe riesgo para las personas mientras no se repara",
      },
    ],
    prefill: () => ({}),
    validacion: (datos) => {
      const errores = {};
      if (!String(datos.ubicacion || "").trim()) {
        errores.ubicacion = "La ubicación es obligatoria";
      }
      if (!String(datos.descripcion || "").trim()) {
        errores.descripcion = "La descripción es obligatoria";
      }
      return errores;
    },
    generarTitulo: (datos) => `Instalación de foco · ${datos.ubicacion}`,
    generarDescripcion: (datos) => datos.descripcion,
    generarPrioridad: (datos) => (datos.urgente ? "URGENTE" : "NORMAL"),
  },
  {
    value: "RECLAMO_MANTENCION",
    label: "Reclamo por mantención",
    icon: "pi pi-wrench",
    categoria: "RECLAMO",
    descripcion:
      "Reporta una falla o necesidad de mantención en áreas comunes o infraestructura.",
    campos: [
      {
        key: "ubicacion",
        label: "Ubicación",
        type: "text",
        required: true,
        ayuda: "Sector, torre, piso, área común o elemento específico",
      },
      {
        key: "tipoFalla",
        label: "Tipo de falla",
        type: "select",
        required: true,
        options: [
          { label: "Fuga de agua / humedad", value: "FUGA_AGUA" },
          { label: "Problema eléctrico", value: "ELECTRICO" },
          { label: "Ascensor / montacargas", value: "ASCENSOR" },
          { label: "Portería / acceso", value: "PORTERIA" },
          { label: "Jardín / áreas verdes", value: "JARDIN" },
          { label: "Piscina / quincho", value: "RECREACION" },
          { label: "Otro", value: "OTRO" },
        ],
      },
      {
        key: "descripcion",
        label: "Descripción detallada",
        type: "textarea",
        required: true,
        ayuda: "Describe el problema, cuándo comenzó y cualquier detalle relevante",
      },
      {
        key: "afectaSeguridad",
        label: "Afecta la seguridad de residentes",
        type: "boolean",
        required: false,
        ayuda: "Marca si el problema pone en riesgo a las personas",
      },
    ],
    prefill: () => ({}),
    validacion: (datos) => {
      const errores = {};
      if (!String(datos.ubicacion || "").trim()) {
        errores.ubicacion = "La ubicación es obligatoria";
      }
      if (!datos.tipoFalla) errores.tipoFalla = "El tipo de falla es obligatorio";
      if (!String(datos.descripcion || "").trim()) {
        errores.descripcion = "La descripción es obligatoria";
      }
      return errores;
    },
    generarTitulo: (datos) => `Reclamo por mantención · ${datos.ubicacion}`,
    generarDescripcion: (datos) => datos.descripcion,
    generarPrioridad: (datos) => (datos.afectaSeguridad ? "URGENTE" : "NORMAL"),
  },
  {
    value: "RECLAMO_RUIDOS",
    label: "Reclamo por ruidos molestos",
    icon: "pi pi-volume-up",
    categoria: "RECLAMO",
    descripcion:
      "Reporta ruidos que perturban la tranquilidad del condominio.",
    campos: [
      {
        key: "origen",
        label: "Origen del ruido",
        type: "select",
        required: true,
        options: [
          { label: "Unidad vecina", value: "UNIDAD_VECINA" },
          { label: "Área común", value: "AREA_COMUN" },
          { label: "Trabajos/obras", value: "OBRAS" },
          { label: "Externo al condominio", value: "EXTERNO" },
          { label: "No identificado", value: "NO_IDENTIFICADO" },
        ],
      },
      {
        key: "unidadOrigen",
        label: "Unidad de origen (si se conoce)",
        type: "text",
        required: false,
        showWhen: { campo: "origen", valor: "UNIDAD_VECINA" },
        ayuda: "Número de casa/departamento",
      },
      {
        key: "descripcion",
        label: "Descripción",
        type: "textarea",
        required: true,
        ayuda: "Tipo de ruido, horarios, frecuencia y cómo te afecta",
      },
      {
        key: "horario",
        label: "Horario habitual",
        type: "text",
        required: false,
        ayuda: "Ej: noches de fines de semana, madrugadas, etc.",
      },
    ],
    prefill: () => ({}),
    validacion: (datos) => {
      const errores = {};
      if (!datos.origen) errores.origen = "El origen es obligatorio";
      if (datos.origen === "UNIDAD_VECINA" && !String(datos.unidadOrigen || "").trim()) {
        errores.unidadOrigen = "Indica la unidad de origen";
      }
      if (!String(datos.descripcion || "").trim()) {
        errores.descripcion = "La descripción es obligatoria";
      }
      return errores;
    },
    generarTitulo: (datos) => `Reclamo por ruidos · ${labelOrigenRuido(datos.origen)}`,
    generarDescripcion: (datos) => datos.descripcion,
    generarPrioridad: () => "NORMAL",
  },
  {
    value: "OTRO",
    label: "Otro tipo de solicitud o reclamo",
    icon: "pi pi-file",
    categoria: "SOLICITUD",
    descripcion:
      "Para cualquier solicitud o reclamo que no encaje en las categorías anteriores.",
    campos: [
      {
        key: "titulo",
        label: "Título",
        type: "text",
        required: true,
        ayuda: "Resume tu solicitud en una frase",
      },
      {
        key: "descripcion",
        label: "Descripción",
        type: "textarea",
        required: true,
        ayuda: "Explica con detalle lo que necesitas",
      },
    ],
    prefill: () => ({}),
    validacion: (datos) => {
      const errores = {};
      if (!String(datos.titulo || "").trim()) {
        errores.titulo = "El título es obligatorio";
      }
      if (!String(datos.descripcion || "").trim()) {
        errores.descripcion = "La descripción es obligatoria";
      }
      return errores;
    },
    generarTitulo: (datos) => datos.titulo,
    generarDescripcion: (datos) => datos.descripcion,
    generarPrioridad: () => "NORMAL",
  },
];

export const CATEGORIAS_SOLICITUD = [
  { label: "Solicitud", value: "SOLICITUD" },
  { label: "Reclamo", value: "RECLAMO" },
];

export const GRUPOS_ESTADO_SOLICITUD = [
  { label: "Abiertas", value: "ABIERTA" },
  { label: "Cerradas", value: "CERRADA" },
];

export const ESTADOS_SOLICITUD = [
  { label: "Recibida", value: "RECIBIDA" },
  { label: "En revisión", value: "EN_REVISION" },
  { label: "Observada", value: "OBSERVADA" },
  { label: "Resuelta", value: "RESUELTA" },
  { label: "Rechazada", value: "RECHAZADA" },
  { label: "Cancelada", value: "CANCELADA" },
];

export const ESTADOS_ABIERTOS = ["RECIBIDA", "EN_REVISION", "OBSERVADA"];

export const PRIORIDADES_SOLICITUD = [
  { label: "Informativa", value: "INFO" },
  { label: "Normal", value: "NORMAL" },
  { label: "Urgente", value: "URGENTE" },
  { label: "Emergencia", value: "EMERGENCIA" },
];

export function getTipoSolicitud(value) {
  return TIPOS_SOLICITUD.find((t) => t.value === value) || null;
}

export function getTiposPorCategoria(categoria) {
  return TIPOS_SOLICITUD.filter((t) => t.categoria === categoria);
}

export function labelTipoSolicitud(value) {
  return getTipoSolicitud(value)?.label || value;
}

export function labelEstadoSolicitud(value) {
  return ESTADOS_SOLICITUD.find((e) => e.value === value)?.label || value;
}

export function labelGrupoEstadoSolicitud(value) {
  return GRUPOS_ESTADO_SOLICITUD.find((g) => g.value === value)?.label || value;
}

export function labelCategoriaSolicitud(value) {
  return CATEGORIAS_SOLICITUD.find((c) => c.value === value)?.label || value;
}

export function labelPrioridadSolicitud(value) {
  return PRIORIDADES_SOLICITUD.find((p) => p.value === value)?.label || value;
}

export function labelOrigenRuido(value) {
  const opciones = getTipoSolicitud("RECLAMO_RUIDOS")?.campos.find(
    (c) => c.key === "origen",
  )?.options;
  return opciones?.find((o) => o.value === value)?.label || value || "Sin especificar";
}

export function etiquetaCampo(tipo, key) {
  const campo = getTipoSolicitud(tipo)?.campos.find((c) => c.key === key);
  if (campo) return campo.label;
  if (key === "resolucion") return "Resolución";
  return key;
}

export function valorLegibleCampo(tipo, campo, valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  if (campo?.type === "boolean") return valor ? "Sí" : "No";
  if (campo?.type === "select") {
    return campo.options?.find((o) => o.value === valor)?.label || valor;
  }
  return String(valor);
}

/** Un campo condicional se muestra solo si `showWhen` coincide con `datos`. */
export function esCampoVisible(campo, datos) {
  if (!campo?.showWhen) return true;
  const valor = datos?.[campo.showWhen.campo];
  return valor === campo.showWhen.valor;
}

/** RUT chileno: estructura 6-8 dígitos + DV correcto (misma regla del backend). */
export function esRutChilenoValido(rut) {
  if (!rutValido(rut)) return false;
  const cuerpo = limpiarRut(rut).slice(0, -1);
  return cuerpo.length >= 6 && cuerpo.length <= 8;
}

/**
 * Copia los valores del formulario al objeto `datos` que consume el backend.
 * Normaliza RUT y recorta espacios; los valores vacíos quedan como null.
 */
export function construirDatos(tipoValue, form = {}) {
  const tipo = getTipoSolicitud(tipoValue);
  if (!tipo) return {};

  const datos = {};
  for (const campo of tipo.campos) {
    let valor = form[campo.key];

    if (campo.type === "boolean") {
      datos[campo.key] = Boolean(valor);
      continue;
    }

    if (campo.type === "rut") {
      valor = valor ? formatearRutCompleto(valor) : "";
    }

    if (typeof valor === "string") valor = valor.trim();
    if (valor === "") continue;
    datos[campo.key] = valor;
  }
  return datos;
}

/**
 * Payload exacto de `POST /condominios/{cid}/solicitudes`.
 * El backend fuerza persona y creador desde el token; aquí solo viajan los
 * datos de la plantilla, la unidad opcional y el resumen plano.
 */
export function construirPayload(tipoValue, form = {}, { unidadId = null } = {}) {
  const tipo = getTipoSolicitud(tipoValue);
  if (!tipo) throw new Error(`Tipo de solicitud desconocido: ${tipoValue}`);

  const datos = construirDatos(tipo.value, form);
  const titulo =
    (tipo.generarTitulo ? tipo.generarTitulo(datos) : tipo.label) || tipo.label;
  const descripcion = tipo.generarDescripcion
    ? tipo.generarDescripcion(datos)
    : null;

  return {
    categoria: tipo.categoria,
    tipo: tipo.value,
    titulo: String(titulo).slice(0, 255),
    descripcion: descripcion ? String(descripcion) : null,
    prioridad: tipo.generarPrioridad
      ? tipo.generarPrioridad(datos)
      : "NORMAL",
    unidadId: unidadId || null,
    datos,
  };
}
