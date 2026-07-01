import api from "./api";

export const condominiosService = {
  getCondominios() {
    return api.get("/me/condominios");
  },
};
