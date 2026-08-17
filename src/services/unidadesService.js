import api from "./api";
import { compararUnidades } from "@/utils/ordenamientoNatural";

export const unidadesService = {
  async getUnidades(condominioId) {
    const res = await api.get(`/condominios/${condominioId}/unidades`);
    // El backend ordena `numero` como VARCHAR (lexicográfico: 1, 10, 11, 2...).
    // Se reordena en el frontend con orden natural (1, 2, 3, ..., 10, 11...).
    if (Array.isArray(res.data)) {
      res.data.sort((a, b) => compararUnidades(a.numero, b.numero));
    }
    return res;
  },

  getUnidad(condominioId, id) {
    return api.get(`/condominios/${condominioId}/unidades/${id}`);
  },

  crearUnidad(condominioId, data) {
    return api.post(`/condominios/${condominioId}/unidades`, data);
  },

  actualizarUnidad(condominioId, id, data) {
    return api.put(`/condominios/${condominioId}/unidades/${id}`, data);
  },

  desactivarUnidad(condominioId, id) {
    return api.patch(`/condominios/${condominioId}/unidades/${id}/desactivar`);
  },

  getSectores(condominioId) {
    return api.get(`/condominios/${condominioId}/sectores`);
  },

  crearSector(condominioId, data) {
    return api.post(`/condominios/${condominioId}/sectores`, data);
  },

  crearSectoresBatch(condominioId, data) {
    return api.post(`/condominios/${condominioId}/sectores/batch`, data);
  },

  crearUnidadesBatch(condominioId, data) {
    return api.post(`/condominios/${condominioId}/unidades/batch`, data);
  },

  getCapacidad(condominioId) {
    return api.get(`/condominios/${condominioId}/capacidad-unidades`);
  },
};
