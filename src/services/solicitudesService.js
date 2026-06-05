import api from "./api";

export const solicitudesService = {
  getPendientes() {
    return api.get("/solicitudes-registro/pendientes");
  },

  getTodas() {
    return api.get("/solicitudes-registro");
  },

  crear(data) {
    return api.post("/solicitudes-registro", data);
  },

  aprobar(id) {
    return api.post(`/solicitudes-registro/${id}/aprobar`);
  },

  rechazar(id) {
    return api.post(`/solicitudes-registro/${id}/rechazar`);
  },
};
