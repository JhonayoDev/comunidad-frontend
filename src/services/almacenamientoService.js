import api from "./api";

export const almacenamientoService = {
  obtener(cid) {
    return api.get(`/condominios/${cid}/configuracion-almacenamiento`);
  },

  guardar(cid, data) {
    return api.put(`/condominios/${cid}/configuracion-almacenamiento`, data);
  },
};
