import api from "./api";

export const vehiculosService = {
  listar(condominioId, params = {}) {
    return api.get(`/condominios/${condominioId}/vehiculos`, { params });
  },

  obtener(condominioId, id) {
    return api.get(`/condominios/${condominioId}/vehiculos/${id}`);
  },

  crear(condominioId, data) {
    return api.post(`/condominios/${condominioId}/vehiculos`, data);
  },

  actualizar(condominioId, id, data) {
    return api.put(`/condominios/${condominioId}/vehiculos/${id}`, data);
  },

  desactivar(condominioId, id) {
    return api.patch(`/condominios/${condominioId}/vehiculos/${id}/desactivar`);
  },
};
