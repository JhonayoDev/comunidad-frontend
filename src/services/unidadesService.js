import api from "./api";

export const unidadesService = {
  getUnidades(condominioId) {
    return api.get(`/condominios/${condominioId}/unidades`);
  },

  getUnidad(condominioId, id) {
    return api.get(`/condominios/${condominioId}/unidades/${id}`);
  },

  getSectores(condominioId) {
    return api.get(`/condominios/${condominioId}/sectores`);
  },
};
