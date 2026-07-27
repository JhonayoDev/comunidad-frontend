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

  agregarSeguimiento(condominioId, casoId, data) {
    return api.post(`/condominios/${condominioId}/casos/${casoId}/seguimientos`, data);
  },

  cerrar(condominioId, casoId, resumenCierre) {
    return api.patch(`/condominios/${condominioId}/casos/${casoId}/cerrar`, { resumenCierre });
  },

  vincularRecurso(condominioId, casoId, data) {
    return api.post(`/condominios/${condominioId}/casos/${casoId}/referencias`, data);
  },
};
