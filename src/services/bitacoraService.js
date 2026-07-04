import api from "./api";

export const bitacoraService = {
  miTurno(condominioId) {
    return api.get(`/condominios/${condominioId}/bitacora/mi-turno`);
  },

  registrarEvento(condominioId, data) {
    return api.post(`/condominios/${condominioId}/bitacora`, data);
  },

  listar(condominioId, filtros = {}) {
    return api.get(`/condominios/${condominioId}/bitacora`, { params: filtros });
  },

  obtener(condominioId, id) {
    return api.get(`/condominios/${condominioId}/bitacora/${id}`);
  },
};
