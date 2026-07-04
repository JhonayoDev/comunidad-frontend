import api from "./api";

export const autorizacionesService = {
  listar(condominioId, filtros = {}) {
    return api.get(`/condominios/${condominioId}/autorizaciones`, {
      params: filtros,
    });
  },

  obtener(condominioId, id) {
    return api.get(`/condominios/${condominioId}/autorizaciones/${id}`);
  },

  cancelar(condominioId, id) {
    return api.patch(
      `/condominios/${condominioId}/autorizaciones/${id}/cancelar`,
    );
  },
};
