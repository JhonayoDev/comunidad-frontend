import api from "./api";

export const unidadesService = {
  getUnidades() {
    return api.get("/residentes/unidades");
  },

  getUnidad(id) {
    return api.get(`/residentes/unidades/${id}`);
  },

  getSectores() {
    return api.get("/residentes/sectores");
  },
};
