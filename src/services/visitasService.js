import api from "./api";

export const visitasService = {
  registrarIngreso(condominioId, data) {
    return api.post(`/condominios/${condominioId}/accesos/ingresar`, data);
  },

  registrarSalida(condominioId, id) {
    return api.patch(`/condominios/${condominioId}/accesos/${id}/salida`);
  },

  getVisitas(condominioId, filtros = {}) {
    return api.get(`/condominios/${condominioId}/accesos`, { params: filtros });
  },

  getVisita(condominioId, id) {
    return api.get(`/condominios/${condominioId}/accesos/${id}`);
  },

  getVisitasFrecuentes(condominioId, patente) {
    return api.get(`/condominios/${condominioId}/accesos/frecuentes`, { params: { patente } });
  },

  consultaRapida(condominioId, patente) {
    return api.get(`/condominios/${condominioId}/busqueda/por-patente`, { params: { patente } });
  },
};
