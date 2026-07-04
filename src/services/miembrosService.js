import api from "./api";

export const miembrosService = {
  listar(cid) {
    return api.get(`/condominios/${cid}/miembros`);
  },

  asignar(cid, data) {
    return api.post(`/condominios/${cid}/miembros`, data);
  },

  desactivar(cid, id) {
    return api.patch(`/condominios/${cid}/miembros/${id}/desactivar`);
  },
};
