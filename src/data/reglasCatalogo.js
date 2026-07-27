export const REGLAS_CATALOGO = [
  { tipo: "VISITA_PREAUTORIZADA", audiencia: "GUARDIAS", canales: ["IN_APP"], prioridad: "ALTA", esObligatoria: true },
  { tipo: "VISITA_INGRESADA", audiencia: "UNIDAD", canales: ["IN_APP", "PUSH"], prioridad: "ALTA", esObligatoria: true },
  { tipo: "VISITA_RECHAZADA", audiencia: "UNIDAD", canales: ["IN_APP"], prioridad: "NORMAL", esObligatoria: false },
  { tipo: "ENCOMIENDA_RECIBIDA", audiencia: "UNIDAD", canales: ["IN_APP", "EMAIL", "PUSH"], prioridad: "NORMAL", esObligatoria: true },
  { tipo: "ENCOMIENDA_ENTREGADA", audiencia: "UNIDAD", canales: ["IN_APP"], prioridad: "BAJA", esObligatoria: false },
  { tipo: "RECLAMO_CREADO", audiencia: "COMITE", canales: ["IN_APP", "EMAIL", "PUSH"], prioridad: "ALTA", esObligatoria: true },
  { tipo: "RECLAMO_RESPONDIDO", audiencia: "PERSONA", canales: ["IN_APP", "EMAIL"], prioridad: "NORMAL", esObligatoria: false },
  { tipo: "RECLAMO_CERRADO", audiencia: "PERSONA", canales: ["IN_APP", "EMAIL"], prioridad: "NORMAL", esObligatoria: false },
  { tipo: "RESERVA_CREADA", audiencia: "ADMINISTRADORES", canales: ["EMAIL", "IN_APP", "PUSH"], prioridad: "NORMAL", esObligatoria: false },
  { tipo: "RESERVA_APROBADA", audiencia: "UNIDAD", canales: ["IN_APP", "EMAIL", "PUSH"], prioridad: "ALTA", esObligatoria: true },
  { tipo: "RESERVA_RECHAZADA", audiencia: "UNIDAD", canales: ["IN_APP", "EMAIL", "PUSH"], prioridad: "ALTA", esObligatoria: true },
  { tipo: "GASTO_COMUN_GENERADO", audiencia: "TODOS", canales: ["IN_APP", "EMAIL", "PUSH"], prioridad: "ALTA", esObligatoria: true },
  { tipo: "PAGO_REGISTRADO", audiencia: "UNIDAD", canales: ["IN_APP", "PUSH"], prioridad: "NORMAL", esObligatoria: false },
  { tipo: "DEUDA_VENCIDA", audiencia: "UNIDAD", canales: ["IN_APP", "EMAIL", "PUSH"], prioridad: "CRITICA", esObligatoria: true },
  { tipo: "ANUNCIO_GENERAL_PUBLICADO", audiencia: "TODOS", canales: ["IN_APP", "EMAIL", "PUSH"], prioridad: "NORMAL", esObligatoria: false },
  { tipo: "DOCUMENTO_PUBLICADO", audiencia: "TODOS", canales: ["IN_APP"], prioridad: "BAJA", esObligatoria: false },
];

export const AUDIENCIA_LABELS = {
  PERSONA: "Persona",
  UNIDAD: "Unidad",
  COMITE: "Comité",
  GUARDIAS: "Guardias",
  ADMINISTRADORES: "Administradores",
  PROPIETARIOS: "Propietarios",
  RESIDENTES: "Residentes",
  TODOS: "Todos",
};

export const PRIORIDAD_SEVERITY = {
  BAJA: "info",
  NORMAL: "warn",
  ALTA: "error",
  CRITICA: "danger",
};

export const CANAL_LABELS = {
  IN_APP: "App",
  EMAIL: "Email",
  PUSH: "Push",
};
