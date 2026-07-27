import api from "./api";

export const solicitudesService = {
  getPendientes(condominioId) {
    return api.get(`/condominios/${condominioId}/solicitudes-registro`, { params: { estado: "PENDIENTE" } });
  },

  getTodas(condominioId) {
    return api.get(`/condominios/${condominioId}/solicitudes-registro`);
  },

  crear(condominioId, data) {
    return api.post(`/condominios/${condominioId}/solicitudes-registro`, data);
  },

  aprobar(condominioId, id) {
    return api.post(`/condominios/${condominioId}/solicitudes-registro/${id}/aprobar`);
  },

  rechazar(condominioId, id) {
    return api.post(`/condominios/${condominioId}/solicitudes-registro/${id}/rechazar`);
  },
};
