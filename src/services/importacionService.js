import api from "./api";

// Importación masiva de la planilla de integrantes (2 fases: preview + ejecutar).
// Contrato: docs/solicitudes-backend/SOLICITUD_IMPORTACION_PLANILLA_V3.md (V67).
export const importacionService = {
  // POST /importaciones/preview (multipart, campo `archivo`) — .csv/.xlsx
  previewArchivo(condominioId, archivo) {
    const form = new FormData();
    form.append("archivo", archivo);
    return api.post(`/condominios/${condominioId}/importaciones/preview`, form);
  },

  // POST /importaciones/preview (JSON) — entrada manual del wizard
  previewJson(condominioId, filas) {
    return api.post(`/condominios/${condominioId}/importaciones/preview`, { filas });
  },

  // POST /importaciones/{importacionId}/ejecutar — aplica las filas OK del preview
  ejecutar(condominioId, importacionId) {
    return api.post(`/condominios/${condominioId}/importaciones/${importacionId}/ejecutar`);
  },

  // GET /importaciones/plantilla — descarga plantilla_integrantes.csv
  async plantilla(condominioId) {
    const res = await api.get(`/condominios/${condominioId}/importaciones/plantilla`, {
      responseType: "blob",
    });
    return res.data;
  },
};