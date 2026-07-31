import api from "./api";

export const encomiendasService = {
  getEncomiendas(condominioId, filtros = {}) {
    return api.get(`/condominios/${condominioId}/encomiendas`, { params: filtros });
  },

  getActivas(condominioId) {
    return api.get(`/condominios/${condominioId}/encomiendas/activas`);
  },

  getEncomienda(condominioId, id) {
    return api.get(`/condominios/${condominioId}/encomiendas/${id}`);
  },

  registrar(condominioId, data) {
    return api.post(`/condominios/${condominioId}/encomiendas`, data);
  },

  entregar(condominioId, id, data) {
    return api.patch(`/condominios/${condominioId}/encomiendas/${id}/entregar`, data);
  },

  cerrar(condominioId, id) {
    return api.patch(`/condominios/${condominioId}/encomiendas/${id}/cerrar`);
  },

  getMisEncomiendas(condominioId) {
    return api.get(`/condominios/${condominioId}/mis-encomiendas`);
  },

  getAccesosEncomiendas(condominioId) {
    return api.get(`/condominios/${condominioId}/encomiendas/accesos`);
  },
};
