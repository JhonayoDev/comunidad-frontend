import api from "./api";

export const adminService = {
  // ── Métricas globales ──────────────────────────────────────────
  getMetrics() {
    return api.get("/admin/metrics");
  },

  // ── Condominios ────────────────────────────────────────────────
  listarCondominios(params = {}) {
    return api.get("/admin/condominios", { params });
  },

  obtenerCondominio(id) {
    return api.get(`/admin/condominios/${id}`);
  },

  crearCondominio(data) {
    return api.post("/admin/condominios", data);
  },

  actualizarCondominio(id, data) {
    return api.patch(`/admin/condominios/${id}`, data);
  },

  suspenderCondominio(id, data) {
    return api.post(`/admin/condominios/${id}/suspender`, data);
  },

  reactivarCondominio(id) {
    return api.post(`/admin/condominios/${id}/reactivar`);
  },

  // ── Módulos ────────────────────────────────────────────────────
  listarModulos(condominioId) {
    return api.get(`/admin/condominios/${condominioId}/modulos`);
  },

  actualizarModulos(condominioId, data) {
    return api.put(`/admin/condominios/${condominioId}/modulos`, data);
  },

  // ── Suscripción ────────────────────────────────────────────────
  historialSuscripcion(condominioId) {
    return api.get(`/admin/condominios/${condominioId}/suscripcion`);
  },

  cambiarPlan(condominioId, data) {
    return api.put(`/admin/condominios/${condominioId}/suscripcion/plan`, data);
  },

  registrarPagoSuscripcion(condominioId, data) {
    return api.post(`/admin/condominios/${condominioId}/suscripcion/pago`, data);
  },

  // ── Onboarding ─────────────────────────────────────────────────
  listarOnboarding(condominioId) {
    return api.get(`/admin/condominios/${condominioId}/onboarding`);
  },

  completarTareaOnboarding(condominioId, codigo) {
    return api.post(`/admin/condominios/${condominioId}/onboarding/tareas/${codigo}/completar`);
  },

  // ── Auditoría ──────────────────────────────────────────────────
  listarAuditoria(params = {}) {
    return api.get("/admin/auditoria", { params });
  },

  auditoriaPorCondominio(condominioId, params = {}) {
    return api.get(`/admin/condominios/${condominioId}/auditoria`, { params });
  },

  // ── Usuarios ───────────────────────────────────────────────────
  listarUsuarios(condominioId, params = {}) {
    return api.get(`/admin/condominios/${condominioId}/usuarios`, { params });
  },

  activarUsuario(condominioId, usuarioId) {
    return api.patch(`/admin/condominios/${condominioId}/usuarios/${usuarioId}/activar`);
  },

  desactivarUsuario(condominioId, usuarioId) {
    return api.patch(`/admin/condominios/${condominioId}/usuarios/${usuarioId}/desactivar`);
  },

  asignarRol(condominioId, usuarioId, rolCodigo) {
    return api.post(`/admin/condominios/${condominioId}/usuarios/${usuarioId}/roles/${rolCodigo}`);
  },

  revocarRol(condominioId, usuarioId, rolCodigo) {
    return api.delete(`/admin/condominios/${condominioId}/usuarios/${usuarioId}/roles/${rolCodigo}`);
  },

  // ── Planes ─────────────────────────────────────────────────────
  listarPlanes() {
    return api.get("/admin/planes");
  },

  crearPlan(data) {
    return api.post("/admin/planes", data);
  },

  actualizarPlan(id, data) {
    return api.put(`/admin/planes/${id}`, data);
  },

  desactivarPlan(id) {
    return api.patch(`/admin/planes/${id}/desactivar`);
  },
};
