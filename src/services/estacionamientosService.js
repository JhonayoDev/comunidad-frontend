import api from "./api";
import { compararUnidades } from "@/utils/ordenamientoNatural";

export const estacionamientosService = {
  async getEstacionamientos(condominioId) {
    const res = await api.get(`/condominios/${condominioId}/estacionamientos`);
    // El backend ordena `nombre` como VARCHAR (lexicográfico: E-1, E-10, E-2...).
    // Se reordena en el frontend con orden natural (E-1, E-2, ..., E-10, E-11...).
    if (Array.isArray(res.data)) {
      res.data.sort((a, b) => compararUnidades(a.nombre, b.nombre));
    }
    return res;
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
    return api.post(`/condominios/${condominioId}/estacionamientos/batch`, data, { timeout: 15000 });
  },

  vinculos(condominioId, id) {
    return api.get(`/condominios/${condominioId}/estacionamientos/${id}/vinculos`);
  },

  vincular(condominioId, id, data) {
    return api.post(`/condominios/${condominioId}/estacionamientos/${id}/vinculos`, data);
  },

  desvincular(condominioId, id, vinculoId) {
    return api.patch(
      `/condominios/${condominioId}/estacionamientos/${id}/vinculos/${vinculoId}/desactivar`,
    );
  },
};