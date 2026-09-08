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

  // [SSE-REMOVAL] Polling reemplazo SSE operativo (DASHBOARD_GUARDIA/ADMIN, @RequiresModule CONTROL_ACCESO)
  getMetrics(condominioId) {
    return api.get(`/condominios/${condominioId}/dashboard/metrics`);
  },

  // [SSE-REMOVAL] Polling reemplazo SSE residente (DASHBOARD_RESIDENTE, @RequiresModule ENCOMIENDAS)
  getResidenteMetrics(condominioId) {
    return api.get(`/condominios/${condominioId}/dashboard/residente/metrics`);
  },
};
