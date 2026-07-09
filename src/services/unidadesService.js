import api from "./api";

export const unidadesService = {
  getUnidades(condominioId) {
    return api.get(`/condominios/${condominioId}/unidades`);
  },

  getUnidad(condominioId, id) {
    return api.get(`/condominios/${condominioId}/unidades/${id}`);
  },

  crearUnidad(condominioId, data) {
    return api.post(`/condominios/${condominioId}/unidades`, data);
  },

  actualizarUnidad(condominioId, id, data) {
    return api.put(`/condominios/${condominioId}/unidades/${id}`, data);
  },

  desactivarUnidad(condominioId, id) {
    return api.patch(`/condominios/${condominioId}/unidades/${id}/desactivar`);
  },

  getSectores(condominioId) {
    return api.get(`/condominios/${condominioId}/sectores`);
  },
};
