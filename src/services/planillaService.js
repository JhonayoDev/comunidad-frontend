import api from "./api";

// Snapshot batch de reedición (BE-6, briku#81): 1 fila por vínculo
// persona-unidad activo con persona, unidad y recursos (incluye ids de
// vínculo para editar/desvincular sin GET previo). Reemplaza los
// 2 GET × N unidades. Permiso VINCULO_VER.
export const planillaService = {
  reedicion(condominioId) {
    return api.get(`/condominios/${condominioId}/planilla/reedicion`);
  },
};
