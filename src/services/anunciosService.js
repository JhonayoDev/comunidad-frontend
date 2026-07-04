import api from "./api";

export const anunciosService = {
  listarVigentes(cid) {
    return api.get(`/condominios/${cid}/anuncios`);
  },

  listarTodos(cid) {
    return api.get(`/condominios/${cid}/anuncios/todos`);
  },

  crear(cid, data) {
    return api.post(`/condominios/${cid}/anuncios`, data);
  },
};
