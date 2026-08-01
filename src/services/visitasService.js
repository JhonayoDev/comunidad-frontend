import api from "./api";

export const visitasService = {
  registrarIngreso(condominioId, data) {
    return api.post(`/condominios/${condominioId}/accesos/ingresar`, data);
  },

  registrarSalida(condominioId, id, data) {
    return api.patch(`/condominios/${condominioId}/accesos/${id}/salida`, data);
  },

  getVisitas(condominioId, filtros = {}) {
    return api.get(`/condominios/${condominioId}/accesos`, { params: filtros });
  },

  getVisita(condominioId, id) {
    return api.get(`/condominios/${condominioId}/accesos/${id}`);
  },
};
