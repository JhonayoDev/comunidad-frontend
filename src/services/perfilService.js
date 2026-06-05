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

  // Futuro — dashboard residente agregado
  getDashboard() {
    return api.get("/dashboard/residente");
  },
};
