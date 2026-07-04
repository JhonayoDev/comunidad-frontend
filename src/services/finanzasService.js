import api from "./api";

export const finanzasService = {
  dashboard(cid) {
    return api.get(`/condominios/${cid}/finanzas/dashboard`);
  },

  listarGastos(cid, params = {}) {
    return api.get(`/condominios/${cid}/finanzas/gastos`, { params });
  },

  crearGasto(cid, data) {
    return api.post(`/condominios/${cid}/finanzas/gastos`, data);
  },

  anularGasto(cid, id, motivo) {
    return api.patch(`/condominios/${cid}/finanzas/gastos/${id}/anular`, { motivo });
  },

  listarCuentas(cid) {
    return api.get(`/condominios/${cid}/finanzas/cuentas`);
  },

  crearCuenta(cid, data) {
    return api.post(`/condominios/${cid}/finanzas/cuentas`, data);
  },

  actualizarCuenta(cid, id, data) {
    return api.put(`/condominios/${cid}/finanzas/cuentas/${id}`, data);
  },

  desactivarCuenta(cid, id) {
    return api.patch(`/condominios/${cid}/finanzas/cuentas/${id}/desactivar`);
  },

  listarCategorias(cid, params = {}) {
    return api.get(`/condominios/${cid}/finanzas/categorias`, { params });
  },

  listarLedger(cid, params = {}) {
    return api.get(`/condominios/${cid}/finanzas/ledger`, { params });
  },

  listarGastosComunes(cid) {
    return api.get(`/condominios/${cid}/gastos-comunes`);
  },

  obtenerGastoComun(cid, id) {
    return api.get(`/condominios/${cid}/gastos-comunes/${id}`);
  },

  crearGastoComun(cid, data) {
    return api.post(`/condominios/${cid}/gastos-comunes`, data);
  },

  pagarCuota(cid, cuotaId, data = {}) {
    return api.patch(`/condominios/${cid}/gastos-comunes/cuotas/${cuotaId}/pagar`, data);
  },

  listarCargosAdicionales(cid, params = {}) {
    return api.get(`/condominios/${cid}/finanzas/cargos-adicionales`, { params });
  },

  crearCargoAdicional(cid, data) {
    return api.post(`/condominios/${cid}/finanzas/cargos-adicionales`, data);
  },

  anularCargoAdicional(cid, id, motivo) {
    return api.patch(`/condominios/${cid}/finanzas/cargos-adicionales/${id}/anular`, { motivo });
  },

  listarPagos(cid, params = {}) {
    return api.get(`/condominios/${cid}/finanzas/pagos`, { params });
  },

  crearPago(cid, data) {
    return api.post(`/condominios/${cid}/finanzas/pagos`, data);
  },

  listarPlantillas(cid) {
    return api.get(`/condominios/${cid}/finanzas/plantillas-gasto`);
  },

  crearPlantilla(cid, data) {
    return api.post(`/condominios/${cid}/finanzas/plantillas-gasto`, data);
  },

  actualizarPlantilla(cid, id, data) {
    return api.put(`/condominios/${cid}/finanzas/plantillas-gasto/${id}`, data);
  },

  eliminarPlantilla(cid, id) {
    return api.delete(`/condominios/${cid}/finanzas/plantillas-gasto/${id}`);
  },
};
