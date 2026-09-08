import api from "./api";

export const dashboardService = {
  admin(condominioId) {
    return api.get(`/condominios/${condominioId}/dashboard/admin`);
  },

  finanzas(condominioId) {
    return api.get(`/condominios/${condominioId}/dashboard/finanzas`);
  },

  guardia(condominioId) {
    return api.get(`/condominios/${condominioId}/dashboard/guardia`);
  },

  // Polling operativo (DASHBOARD_GUARDIA/ADMIN, @RequiresModule CONTROL_ACCESO, Cache-Control no-cache)
  getMetrics(condominioId) {
    return api.get(`/condominios/${condominioId}/dashboard/metrics`);
  },

  // Polling residente (DASHBOARD_RESIDENTE, @RequiresModule ENCOMIENDAS, Cache-Control no-cache)
  getResidenteMetrics(condominioId) {
    return api.get(`/condominios/${condominioId}/dashboard/residente/metrics`);
  },
};
