export const ESTADO_PERSONA = {
  SIN_USUARIO: "SIN_USUARIO",
  SETUP_PENDIENTE: "SETUP_PENDIENTE",
  CAMBIO_PENDIENTE: "CAMBIO_PENDIENTE",
  ACTIVO: "ACTIVO",
};

const ESTADOS = {
  [ESTADO_PERSONA.SIN_USUARIO]: {
    key: ESTADO_PERSONA.SIN_USUARIO,
    label: "Sin usuario",
    severity: "secondary",
  },
  [ESTADO_PERSONA.SETUP_PENDIENTE]: {
    key: ESTADO_PERSONA.SETUP_PENDIENTE,
    label: "Setup pendiente",
    severity: "warn",
  },
  [ESTADO_PERSONA.CAMBIO_PENDIENTE]: {
    key: ESTADO_PERSONA.CAMBIO_PENDIENTE,
    label: "Cambio de email pendiente",
    severity: "warn",
  },
  [ESTADO_PERSONA.ACTIVO]: {
    key: ESTADO_PERSONA.ACTIVO,
    label: "Activo",
    severity: "success",
  },
};

export function estadoUsuarioPersona(persona) {
  if (!persona?.tieneUsuario) return { ...ESTADOS[ESTADO_PERSONA.SIN_USUARIO] };
  if (!persona.passwordSetAt) {
    return { ...ESTADOS[ESTADO_PERSONA.SETUP_PENDIENTE] };
  }
  if (persona.emailCambioPendiente) {
    return { ...ESTADOS[ESTADO_PERSONA.CAMBIO_PENDIENTE] };
  }
  return { ...ESTADOS[ESTADO_PERSONA.ACTIVO] };
}

export function esPreActivacionPersona(persona) {
  return !persona?.tieneUsuario || !persona.passwordSetAt;
}

export function validarMotivoCambioEmail(motivo) {
  const texto = String(motivo || "").trim();
  if (texto.length < 10) {
    return "Ingresa un motivo de al menos 10 caracteres";
  }
  if (texto.length > 500) {
    return "El motivo no puede superar los 500 caracteres";
  }
  return null;
}

export function mensajeCambioEmail(respuesta, emailFallback = "") {
  if (respuesta?.estado === "PENDIENTE_VERIFICACION") {
    const destino = respuesta?.emailPendiente || emailFallback;
    return `Correo de verificación enviado a ${destino}. La cuenta quedará pendiente hasta confirmar.`;
  }
  return "Email actualizado. No se envió correo automático.";
}
