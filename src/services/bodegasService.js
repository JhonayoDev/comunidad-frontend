import api from "./api";
import { compararUnidades } from "@/utils/ordenamientoNatural";

export const bodegasService = {
  async getBodegas(condominioId) {
    const res = await api.get(`/condominios/${condominioId}/bodegas`);
    // El backend ordena `nombre` como VARCHAR (lexicográfico: B-1, B-10, B-2...).
    // Se reordena en el frontend con orden natural (B-1, B-2, ..., B-10, B-11...).
    if (Array.isArray(res.data)) {
      res.data.sort((a, b) => compararUnidades(a.nombre, b.nombre));
    }
    return res;
  },

  getBodega(condominioId, id) {
    return api.get(`/condominios/${condominioId}/bodegas/${id}`);
  },

  crearBodega(condominioId, data) {
    return api.post(`/condominios/${condominioId}/bodegas`, data);
  },

  actualizarBodega(condominioId, id, data) {
    return api.put(`/condominios/${condominioId}/bodegas/${id}`, data);
  },

  desactivarBodega(condominioId, id) {
    return api.patch(`/condominios/${condominioId}/bodegas/${id}/desactivar`);
  },

  crearBodegasBatch(condominioId, data) {
    return api.post(`/condominios/${condominioId}/bodegas/batch`, data);
  },
};