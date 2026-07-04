import api from "./api";

export const accesosService = {
  listar(condominioId, filtros = {}) {
    return api.get(`/condominios/${condominioId}/accesos`, { params: filtros });
  },

  obtener(condominioId, id) {
    return api.get(`/condominios/${condominioId}/accesos/${id}`);
  },

  registrarIngreso(condominioId, data) {
    return api.post(`/condominios/${condominioId}/accesos/ingresar`, data);
  },

  registrarSalida(condominioId, id, data = {}) {
    return api.patch(`/condominios/${condominioId}/accesos/${id}/salida`, data);
  },
};
