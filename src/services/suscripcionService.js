import api from "./api";

// Estado de suscripción del condominio (billing contacts: rol ADMINISTRADOR
// global o cargos ADMINISTRADOR/PRESIDENTE/TESORERO). El backend responde 403
// neutral al resto; el composable solo consulta cuando corresponde.
export const suscripcionService = {
  getEstado(condominioId) {
    return api.get(`/condominios/${condominioId}/suscripcion/estado`);
  },
};
