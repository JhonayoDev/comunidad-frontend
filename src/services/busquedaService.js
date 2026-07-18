import api from "./api";

export const busquedaService = {
  porPatente(condominioId, patente) {
    return api.get(`/condominios/${condominioId}/busqueda/por-patente`, { params: { patente } });
  },

  historialAccesos(condominioId, params = {}) {
    return api.get(`/condominios/${condominioId}/busqueda/historial-accesos`, { params });
  },

  residentesPorUnidad(condominioId, unidadId) {
    return api.get(`/condominios/${condominioId}/busqueda/unidades/${unidadId}/residentes`);
  },
};
