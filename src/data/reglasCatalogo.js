export const REGLAS_CATALOGO = [
  { tipo: "VISITA_PREAUTORIZADA", audiencia: "GUARDIAS_EN_TURNO", canales: ["IN_APP"], prioridad: "ALTA", esObligatoriaInapp: true, esObligatoriaEmail: false, esObligatoriaPush: false, visibleUsuario: false },
  { tipo: "VISITA_INGRESADA", audiencia: "UNIDAD", canales: ["IN_APP", "PUSH"], prioridad: "ALTA", esObligatoriaInapp: false, esObligatoriaEmail: false, esObligatoriaPush: false, visibleUsuario: true },
  { tipo: "VISITA_RECHAZADA", audiencia: "UNIDAD", canales: ["IN_APP"], prioridad: "NORMAL", esObligatoriaInapp: false, esObligatoriaEmail: false, esObligatoriaPush: false, visibleUsuario: true },
  { tipo: "ENCOMIENDA_RECIBIDA", audiencia: "UNIDAD_OCUPANTES", canales: ["IN_APP", "EMAIL", "PUSH"], prioridad: "NORMAL", esObligatoriaInapp: true, esObligatoriaEmail: true, esObligatoriaPush: false, visibleUsuario: true },
  { tipo: "ENCOMIENDA_ENTREGADA", audiencia: "UNIDAD", canales: ["IN_APP"], prioridad: "BAJA", esObligatoriaInapp: false, esObligatoriaEmail: false, esObligatoriaPush: false, visibleUsuario: true },
  { tipo: "RECLAMO_CREADO", audiencia: "COMITE", canales: ["IN_APP", "EMAIL", "PUSH"], prioridad: "ALTA", esObligatoriaInapp: true, esObligatoriaEmail: true, esObligatoriaPush: false, visibleUsuario: false },
  { tipo: "RECLAMO_RESPONDIDO", audiencia: "PERSONA", canales: ["IN_APP", "EMAIL"], prioridad: "NORMAL", esObligatoriaInapp: false, esObligatoriaEmail: false, esObligatoriaPush: false, visibleUsuario: true },
  { tipo: "RECLAMO_CERRADO", audiencia: "PERSONA", canales: ["IN_APP", "EMAIL"], prioridad: "NORMAL", esObligatoriaInapp: false, esObligatoriaEmail: false, esObligatoriaPush: false, visibleUsuario: true },
  { tipo: "RESERVA_CREADA", audiencia: "ADMINISTRADORES", canales: ["IN_APP", "EMAIL"], prioridad: "NORMAL", esObligatoriaInapp: false, esObligatoriaEmail: false, esObligatoriaPush: false, visibleUsuario: false },
  { tipo: "RESERVA_APROBADA", audiencia: "UNIDAD", canales: ["IN_APP", "EMAIL", "PUSH"], prioridad: "ALTA", esObligatoriaInapp: true, esObligatoriaEmail: true, esObligatoriaPush: false, visibleUsuario: true },
  { tipo: "RESERVA_RECHAZADA", audiencia: "UNIDAD", canales: ["IN_APP", "EMAIL", "PUSH"], prioridad: "ALTA", esObligatoriaInapp: true, esObligatoriaEmail: true, esObligatoriaPush: false, visibleUsuario: true },
  { tipo: "GASTO_COMUN_GENERADO", audiencia: "TODOS", canales: ["IN_APP", "EMAIL", "PUSH"], prioridad: "ALTA", esObligatoriaInapp: true, esObligatoriaEmail: true, esObligatoriaPush: false, visibleUsuario: true },
  { tipo: "PAGO_REGISTRADO", audiencia: "UNIDAD", canales: ["IN_APP", "PUSH"], prioridad: "NORMAL", esObligatoriaInapp: false, esObligatoriaEmail: false, esObligatoriaPush: false, visibleUsuario: true },
  { tipo: "DEUDA_VENCIDA", audiencia: "UNIDAD", canales: ["IN_APP", "EMAIL", "PUSH"], prioridad: "CRITICA", esObligatoriaInapp: true, esObligatoriaEmail: true, esObligatoriaPush: true, visibleUsuario: true },
  { tipo: "ANUNCIO_GENERAL_PUBLICADO", audiencia: "TODOS", canales: ["IN_APP", "EMAIL", "PUSH"], prioridad: "NORMAL", esObligatoriaInapp: false, esObligatoriaEmail: false, esObligatoriaPush: false, visibleUsuario: true },
  { tipo: "DOCUMENTO_PUBLICADO", audiencia: "TODOS", canales: ["IN_APP"], prioridad: "BAJA", esObligatoriaInapp: false, esObligatoriaEmail: false, esObligatoriaPush: false, visibleUsuario: true },
];

export const AUDIENCIA_LABELS = {
  PERSONA: "Persona",
  UNIDAD: "Unidad",
  UNIDAD_OCUPANTES: "Ocupantes de la unidad",
  UNIDAD_TITULAR: "Titular de la unidad",
  COMITE: "Comité",
  GUARDIAS: "Guardias",
  GUARDIAS_EN_TURNO: "Guardias en turno",
  ADMINISTRADORES: "Administradores",
  PROPIETARIOS: "Propietarios",
  RESIDENTES: "Residentes",
  TODOS: "Todos",
};

export const AUDIENCIA_DESC = {
  PERSONA: "Una persona específica (identificada por su ID), por ejemplo quien originó el evento.",
  UNIDAD: "Todas las personas vinculadas a la unidad involucrada que tengan notificaciones habilitadas (ocupantes, propietario no residente, adicionales).",
  UNIDAD_OCUPANTES: "Solo los ocupantes actuales de la unidad (quienes viven físicamente ahí y tienen notificaciones habilitadas). Excluye al propietario no residente.",
  UNIDAD_TITULAR: "Solo el titular de la unidad: propietario o arrendatario, con notificaciones habilitadas. Excluye residentes adicionales.",
  COMITE: "Miembros del comité: presidente, tesorero, secretario y delegado (miembros activos).",
  GUARDIAS: "Personal de portería y seguridad: guardias y conserjes del condominio.",
  GUARDIAS_EN_TURNO: "Solo los guardias/conserjes que están efectivamente en turno según la bitácora. Si ninguno está, se notifica a todos los guardias para no perder avisos críticos.",
  ADMINISTRADORES: "Los administradores del condominio (cargo ADMINISTRADOR activo).",
  PROPIETARIOS: "Solo propietarios con vínculo activo y notificaciones habilitadas en alguna unidad.",
  RESIDENTES: "Todos los ocupantes del condominio (quienes viven en sus unidades y tienen notificaciones habilitadas).",
  TODOS: "Todos los miembros del condominio: vínculos activos + miembros con cargo activo.",
};

export const PRIORIDAD_SEVERITY = {
  BAJA: "info",
  NORMAL: "warn",
  ALTA: "error",
  CRITICA: "danger",
};

export const PRIORIDAD_DESC = {
  BAJA: "Urgencia baja: se guarda en la notificación como informativa.",
  NORMAL: "Urgencia normal: notificación habitual.",
  ALTA: "Urgencia alta: notificación importante.",
  CRITICA: "Urgencia crítica: notificación de máxima prioridad.",
};

export const CANAL_LABELS = {
  IN_APP: "App",
  EMAIL: "Email",
  PUSH: "Push",
};

export const CANAL_DESC = {
  IN_APP: "Bandeja de notificaciones dentro de la app.",
  EMAIL: "Correo electrónico del destinatario.",
  PUSH: "Notificación push al dispositivo (PWA instalada).",
};
