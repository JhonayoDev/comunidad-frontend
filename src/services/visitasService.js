import api from "./api";

export const visitasService = {
  registrarIngreso(data) {
    return api.post("/visitas", data);
  },

  registrarSalida(id) {
    return api.put(`/visitas/${id}/salida`);
  },

  getVisitas(filtros = {}) {
    return api.get("/visitas", { params: filtros });
  },

  getVisita(id) {
    return api.get(`/visitas/${id}`);
  },

  getVisitasFrecuentes(patente) {
    return api.get("/visitas/frecuente", { params: { patente } });
  },

  consultaRapida(patente) {
    return api.get("/vehiculos/consulta-rapida", { params: { patente } });
  },
};
