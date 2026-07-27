import api from "./api";

export const personalService = {
  listar(cid) {
    return api.get(`/condominios/${cid}/personal`);
  },

  asignarRol(cid, data) {
    return api.put(`/condominios/${cid}/personal/roles`, data);
  },

  revocarAcceso(cid, usuarioId) {
    return api.delete(`/condominios/${cid}/personal/${usuarioId}`);
  },

  listarReglas(cid) {
    return api.get(`/condominios/${cid}/personal/reglas-notificacion`);
  },

  guardarRegla(cid, tipoNotificacion, data) {
    return api.put(`/condominios/${cid}/personal/reglas-notificacion/${tipoNotificacion}`, data);
  },

  eliminarRegla(cid, tipoNotificacion) {
    return api.delete(`/condominios/${cid}/personal/reglas-notificacion/${tipoNotificacion}`);
  },
};
