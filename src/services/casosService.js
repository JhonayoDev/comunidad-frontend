import api from "./api";

export const casosService = {
  listar(condominioId, filtros = {}) {
    return api.get(`/condominios/${condominioId}/casos`, { params: filtros });
  },

  obtener(condominioId, id) {
    return api.get(`/condominios/${condominioId}/casos/${id}`);
  },

  abrir(condominioId, data) {
    return api.post(`/condominios/${condominioId}/casos`, data);
  },
};
