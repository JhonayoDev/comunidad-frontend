import api from "./api";

export const personasService = {
  listar(cid) {
    return api.get(`/condominios/${cid}/personas`);
  },

  obtener(cid, id) {
    return api.get(`/condominios/${cid}/personas/${id}`);
  },

  buscarPorEmail(cid, email) {
    return api.get(`/condominios/${cid}/personas/buscar`, { params: { email } });
  },

  crear(cid, data) {
    return api.post(`/condominios/${cid}/personas`, data);
  },

  actualizar(cid, id, data) {
    return api.put(`/condominios/${cid}/personas/${id}`, data);
  },

  desactivar(cid, id) {
    return api.patch(`/condominios/${cid}/personas/${id}/desactivar`);
  },

  vinculosUnidad(cid, unidadId) {
    return api.get(`/condominios/${cid}/unidades/${unidadId}/vinculos`);
  },

  crearVinculo(cid, data) {
    return api.post(`/condominios/${cid}/vinculos`, data);
  },

  desactivarVinculo(cid, id) {
    return api.patch(`/condominios/${cid}/vinculos/${id}/desactivar`);
  },

  crearUsuario(cid, personaId, data) {
    return api.post(`/condominios/${cid}/personas/${personaId}/usuario`, data);
  },

  activarUsuario(cid, usuarioId) {
    return api.patch(`/condominios/${cid}/usuarios/${usuarioId}/activar`);
  },

  desactivarUsuario(cid, usuarioId) {
    return api.patch(`/condominios/${cid}/usuarios/${usuarioId}/desactivar`);
  },

  getPreferenciasNotificacion() {
    return api.get("/me/notificaciones/preferencias");
  },

  actualizarPreferenciaNotificacion(tipo, data) {
    return api.put(`/me/notificaciones/preferencias/${tipo}`, data);
  },
};
