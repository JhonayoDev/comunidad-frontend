import api from "./api";

export const personasService = {
  /**
   * Lista personas por membresía en el condominio.
   *
   * @param {string} cid
   * @param {object} [params] `estado` (ACTIVO|PENDIENTE|INACTIVO|TODOS),
   *   `tipoParticipacion` (PROPIETARIO|ARRENDATARIO|DEPENDIENTE|TRABAJADOR|
   *   ADMINISTRACION|PROVEEDOR) y `q` (nombre/email/RUT).
   */
  listar(cid, params = {}) {
    return api.get(`/condominios/${cid}/personas`, { params });
  },

  obtener(cid, id) {
    return api.get(`/condominios/${cid}/personas/${id}`);
  },

  /**
   * Búsqueda global por email o RUT. El backend exige exactamente uno de los
   * dos y devuelve las membresías de la persona en todos los condominios.
   */
  buscar(cid, params) {
    return api.get(`/condominios/${cid}/personas/buscar`, { params });
  },

  buscarPorEmail(cid, email) {
    return api.get(`/condominios/${cid}/personas/buscar`, {
      params: { email },
    });
  },

  buscarPorRut(cid, rut) {
    return api.get(`/condominios/${cid}/personas/buscar`, {
      params: { rut },
    });
  },

  /**
   * Alta atómica: `{ persona }` o `{ personaId }` + `asociacion`.
   * Un 409 de email/RUT devuelve `personaId` y `conflicto` para reintentar.
   */
  crear(cid, data) {
    return api.post(`/condominios/${cid}/personas`, data);
  },

  actualizar(cid, id, data) {
    return api.put(`/condominios/${cid}/personas/${id}`, data);
  },

  actualizarMembresia(cid, id, data) {
    return api.patch(`/condominios/${cid}/personas/${id}/membresia`, data);
  },

  /**
   * Agrega un vínculo/cargo/proveedor a una membresía existente. Si estaba
   * PENDIENTE, el backend la activa.
   */
  agregarAsociacion(cid, id, asociacion) {
    return api.post(
      `/condominios/${cid}/personas/${id}/asociaciones`,
      asociacion,
    );
  },

  reactivar(cid, id) {
    return api.patch(`/condominios/${cid}/personas/${id}/reactivar`);
  },

  /**
   * Baja LOCAL del condominio: no desactiva la identidad global ni la cuenta
   * en otros condominios.
   */
  desactivar(cid, id, data) {
    return api.patch(
      `/condominios/${cid}/personas/${id}/desactivar`,
      data || {},
    );
  },

  cambiarEmail(cid, id, data) {
    return api.patch(`/condominios/${cid}/personas/${id}/email`, data);
  },

  reenviarVerificacionEmail(cid, id) {
    return api.post(`/condominios/${cid}/personas/${id}/email/reenviar`);
  },

  habilitarCorreccionRut(cid, personaId, data) {
    return api.post(
      `/condominios/${cid}/personas/${personaId}/correccion-rut/habilitar`,
      data,
    );
  },

  revocarCorreccionRut(cid, personaId) {
    return api.patch(
      `/condominios/${cid}/personas/${personaId}/correccion-rut/revocar`,
    );
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

  actualizarRecibeNotificaciones(cid, vinculoId, recibeNotificaciones) {
    return api.patch(
      `/condominios/${cid}/vincular-persona-unidad/${vinculoId}/recibe-notificaciones`,
      { recibeNotificaciones },
    );
  },

  crearUsuario(cid, personaId, data) {
    return api.post(`/condominios/${cid}/personas/${personaId}/usuario`, data);
  },

  reenviarSetup(cid, personaId) {
    return api.post(`/condominios/${cid}/personas/${personaId}/usuario/reconfigurar`);
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
