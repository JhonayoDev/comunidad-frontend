import api from "./api";

export const encomiendasService = {
  getEncomiendas(condominioId, filtros = {}) {
    return api.get(`/condominios/${condominioId}/encomiendas`, { params: filtros });
  },

  getEncomienda(condominioId, id) {
    return api.get(`/condominios/${condominioId}/encomiendas/${id}`);
  },

  registrar(condominioId, data) {
    return api.post(`/condominios/${condominioId}/encomiendas`, data);
  },

  entregar(condominioId, id) {
    return api.post(`/condominios/${condominioId}/encomiendas/${id}/entregar`);
  },

  getMisEncomiendas(condominioId) {
    return api.get(`/condominios/${condominioId}/mis-encomiendas`);
  },
};
