import api from "./api";

export const estacionamientosService = {
  getEstacionamientos(condominioId) {
    return api.get(`/condominios/${condominioId}/estacionamientos`);
  },

  getEstacionamiento(condominioId, id) {
    return api.get(`/condominios/${condominioId}/estacionamientos/${id}`);
  },

  crearEstacionamiento(condominioId, data) {
    return api.post(`/condominios/${condominioId}/estacionamientos`, data);
  },

  actualizarEstacionamiento(condominioId, id, data) {
    return api.put(`/condominios/${condominioId}/estacionamientos/${id}`, data);
  },

  desactivarEstacionamiento(condominioId, id) {
    return api.patch(`/condominios/${condominioId}/estacionamientos/${id}/desactivar`);
  },

  crearEstacionamientosBatch(condominioId, data) {
    return api.post(`/condominios/${condominioId}/estacionamientos/batch`, data);
  },
};