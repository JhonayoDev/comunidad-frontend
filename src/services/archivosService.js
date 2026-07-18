import api from "./api";

export const archivosService = {
  solicitarUrl(condominioId, data, config) {
    return api.post(`/condominios/${condominioId}/archivos/solicitar-url`, data, config);
  },

  confirmar(condominioId, data) {
    return api.post(`/condominios/${condominioId}/archivos/confirmar`, data);
  },

  driveUpload(condominioId, fileId, file) {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/condominios/${condominioId}/archivos/${fileId}/drive-upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  listar(condominioId, categoria) {
    return api.get(`/condominios/${condominioId}/archivos`, { params: { categoria } });
  },

  eliminar(condominioId, fileId) {
    return api.delete(`/condominios/${condominioId}/archivos/${fileId}`);
  },
};
