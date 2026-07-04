import api from "./api";

export const perfilService = {
  getMiPerfil() {
    return api.get("/me");
  },

  getBadgeNotificaciones(condominioId) {
    return api.get(`/condominios/${condominioId}/notificaciones/badge`);
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

  actualizarMe(data) {
    return api.put("/me", data);
  },

  getDashboardResidente(condominioId) {
    return api.get(`/condominios/${condominioId}/dashboard/residente`);
  },
};
