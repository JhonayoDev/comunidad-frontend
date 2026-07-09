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
};
