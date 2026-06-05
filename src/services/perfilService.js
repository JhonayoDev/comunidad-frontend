import api from "./api";

export const perfilService = {
  getMiPerfil() {
    return api.get("/me");
  },

  getMisVinculos() {
    return api.get("/me/vinculos");
  },

  getMisVehiculos() {
    return api.get("/me/vehiculos");
  },

  getBadgeNotificaciones() {
    return api.get("/notificaciones/badge");
  },

  cambiarPassword(data) {
    return api.put("/me/password", data);
  },

  solicitarCambioEmail(emailNuevo) {
    return api.post("/me/email/solicitar", { emailNuevo });
  },

  verificarCambioEmail(token) {
    return api.post("/me/email/verificar", { token });
  },

  // Futuro — dashboard residente agregado
  getDashboard() {
    return api.get("/dashboard/residente");
  },
};
