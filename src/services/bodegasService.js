import api from "./api";

export const bodegasService = {
  getBodegas(condominioId) {
    return api.get(`/condominios/${condominioId}/bodegas`);
  },

  getBodega(condominioId, id) {
    return api.get(`/condominios/${condominioId}/bodegas/${id}`);
  },

  crearBodega(condominioId, data) {
    return api.post(`/condominios/${condominioId}/bodegas`, data);
  },

  actualizarBodega(condominioId, id, data) {
    return api.put(`/condominios/${condominioId}/bodegas/${id}`, data);
  },

  desactivarBodega(condominioId, id) {
    return api.patch(`/condominios/${condominioId}/bodegas/${id}/desactivar`);
  },

  crearBodegasBatch(condominioId, data) {
    return api.post(`/condominios/${condominioId}/bodegas/batch`, data);
  },
};