import api from "./api";

export const solicitudesService = {
  // Residente
  listarMis(condominioId, filtros = {}) {
    return api.get(`/condominios/${condominioId}/mis-solicitudes`, { params: filtros });
  },

  obtenerMis(condominioId, solicitudId) {
    return api.get(`/condominios/${condominioId}/mis-solicitudes/${solicitudId}`);
  },

  agregarSeguimientoResidente(condominioId, solicitudId, data) {
    return api.post(`/condominios/${condominioId}/mis-solicitudes/${solicitudId}/seguimientos`, data);
  },

  cancelar(condominioId, solicitudId) {
    return api.patch(`/condominios/${condominioId}/mis-solicitudes/${solicitudId}/cancelar`);
  },

  // Administración
  listar(condominioId, filtros = {}) {
    return api.get(`/condominios/${condominioId}/solicitudes`, { params: filtros });
  },

  obtener(condominioId, solicitudId) {
    return api.get(`/condominios/${condominioId}/solicitudes/${solicitudId}`);
  },

  crear(condominioId, data) {
    return api.post(`/condominios/${condominioId}/solicitudes`, data);
  },

  actualizar(condominioId, solicitudId, data) {
    return api.patch(`/condominios/${condominioId}/solicitudes/${solicitudId}`, data);
  },

  agregarSeguimiento(condominioId, solicitudId, data) {
    return api.post(`/condominios/${condominioId}/solicitudes/${solicitudId}/seguimientos`, data);
  },

  resolver(condominioId, solicitudId, data) {
    return api.post(`/condominios/${condominioId}/solicitudes/${solicitudId}/resolver`, data);
  },

  vincularCaso(condominioId, solicitudId, data) {
    return api.post(`/condominios/${condominioId}/solicitudes/${solicitudId}/vincular-caso`, data);
  },

  desvincularCaso(condominioId, solicitudId) {
    return api.delete(`/condominios/${condominioId}/solicitudes/${solicitudId}/vincular-caso`);
  },

  crearCaso(condominioId, solicitudId, data) {
    return api.post(`/condominios/${condominioId}/solicitudes/${solicitudId}/crear-caso`, data);
  },
};