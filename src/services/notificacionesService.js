import api from "./api";

export const notificacionesService = {
  getTodas(condominioId) {
    return api.get(`/condominios/${condominioId}/notificaciones`);
  },

  getBadge(condominioId) {
    return api.get(`/condominios/${condominioId}/notificaciones/badge`);
  },

  marcarLeida(condominioId, notificacionId) {
    return api.patch(
      `/condominios/${condominioId}/notificaciones/${notificacionId}/leida`,
    );
  },

  marcarTodasLeidas(condominioId) {
    return api.patch(
      `/condominios/${condominioId}/notificaciones/todas-leidas`,
    );
  },
};
