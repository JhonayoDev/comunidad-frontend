import api from "./api";

export const permisosService = {
  getPermisos(condominioId) {
    return api.get("/me/permisos", { params: { condominioId } });
  },
};
