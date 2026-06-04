import api from "./api";

export const notificacionesService = {
  getTodasLasNotificaciones() {
    return api.get("/notificaciones");
  },

  getNoLeidas() {
    return api.get("/notificaciones/no-leidas");
  },

  getBadge() {
    return api.get("/notificaciones/badge");
  },

  marcarLeida(notificacionId) {
    return api.put(`/notificaciones/${notificacionId}/leida`);
  },

  marcarTodasLeidas() {
    return api.put("/notificaciones/leida/todas");
  },
};
