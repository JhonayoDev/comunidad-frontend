import api from "./api";

// Espacios comunes del condominio (wizard setup, espejo Pisos/Accesos).
// Sin batch en el backend: POST/PUT/DELETE(PATCH desactivar) individuales.
// Vínculos unidad ↔ espacio para colgarlos del condominio.
export const espaciosService = {
  getEspacios(condominioId) {
    return api.get(`/condominios/${condominioId}/espacios-comunes`);
  },

  crearEspacio(condominioId, data) {
    return api.post(`/condominios/${condominioId}/espacios-comunes`, data);
  },

  actualizarEspacio(condominioId, id, data) {
    return api.put(`/condominios/${condominioId}/espacios-comunes/${id}`, data);
  },

  desactivarEspacio(condominioId, id) {
    return api.patch(`/condominios/${condominioId}/espacios-comunes/${id}/desactivar`);
  },

  vinculos(condominioId, id) {
    return api.get(`/condominios/${condominioId}/espacios-comunes/${id}/vinculos`);
  },

  vincular(condominioId, id, data) {
    return api.post(`/condominios/${condominioId}/espacios-comunes/${id}/vinculos`, data);
  },

  desvincular(condominioId, id, vinculoId) {
    return api.patch(
      `/condominios/${condominioId}/espacios-comunes/${id}/vinculos/${vinculoId}/desactivar`,
    );
  },
};
