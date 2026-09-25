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

  // Puntos de recepción del condominio (wizard setup, espejo Sectores/Pisos).
  // Sin batch en el backend: POST/PUT/DELETE individuales. El DELETE desactiva
  // (soft). El duplicado de nombre da 400 con mensaje (mapeado a la fila).
  crearAccesoEncomiendas(condominioId, data) {
    return api.post(`/condominios/${condominioId}/encomiendas/accesos`, data);
  },

  actualizarAccesoEncomiendas(condominioId, id, data) {
    return api.put(`/condominios/${condominioId}/encomiendas/accesos/${id}`, data);
  },

  eliminarAccesoEncomiendas(condominioId, id) {
    return api.delete(`/condominios/${condominioId}/encomiendas/accesos/${id}`);
  },
};
