import api from "./api";

export const perfilService = {
  getMiPerfil() {
    return api.get("/me");
  },

  getBadgeNotificaciones() {
    return api.get("/notificaciones/badge");
  },
};
