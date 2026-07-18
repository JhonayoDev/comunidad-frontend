import { ref } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { archivosService } from "../services/archivosService";

const CATEGORIAS = ["FINANZAS", "ENCOMIENDA", "BITACORA", "DOCUMENTO", "AVATAR", "OTRO"];

const CATEGORIA_LABELS = {
  FINANZAS: "Finanzas",
  ENCOMIENDA: "Encomiendas",
  BITACORA: "Bitácora",
  DOCUMENTO: "Documentos",
  AVATAR: "Avatares",
  OTRO: "Otros",
};

export function useArchivos() {
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const error = ref(null);
  const categoriaSeleccionada = ref("DOCUMENTO");

  const archivosQuery = useQuery({
    queryKey: ["archivos", auth.condominioActualId, categoriaSeleccionada],
    queryFn: async () => {
      const cid = auth.condominioActualId;
      if (!cid) return [];
      const response = await archivosService.listar(cid, categoriaSeleccionada.value);
      return response.data;
    },
    enabled: !!auth.condominioActualId,
  });

  async function listar(categoria) {
    if (categoria) categoriaSeleccionada.value = categoria;
    await archivosQuery.refetch();
  }

  const solicitarUrlMutation = useMutation({
    mutationFn: async (data) => {
      const cid = auth.condominioActualId;
      if (!cid) throw new Error("selecciona un condominio");
      const response = await archivosService.solicitarUrl(cid, data);
      return response.data;
    },
    onError: (err) => {
      console.error("Error al solicitar URL de subida:", err);
    },
  });

  const confirmarMutation = useMutation({
    mutationFn: async (data) => {
      const cid = auth.condominioActualId;
      if (!cid) throw new Error("selecciona un condominio");
      const response = await archivosService.confirmar(cid, data);
      return response.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["archivos", auth.condominioActualId] });
    },
    onError: (err) => {
      console.error("Error al confirmar subida:", err);
    },
  });

  const driveUploadMutation = useMutation({
    mutationFn: async ({ fileId, file }) => {
      const cid = auth.condominioActualId;
      if (!cid) throw new Error("selecciona un condominio");
      const response = await archivosService.driveUpload(cid, fileId, file);
      return response.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["archivos", auth.condominioActualId] });
    },
    onError: (err) => {
      console.error("Error en subida Drive:", err);
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: async (fileId) => {
      const cid = auth.condominioActualId;
      if (!cid) throw new Error("selecciona un condominio");
      await archivosService.eliminar(cid, fileId);
    },
    onMutate: async (fileId) => {
      await queryClient.cancelQueries({ queryKey: ["archivos", auth.condominioActualId] });
      const previousData = queryClient.getQueriesData({ queryKey: ["archivos", auth.condominioActualId] });
      queryClient.setQueriesData({ queryKey: ["archivos", auth.condominioActualId] }, (old) => {
        if (!old) return old;
        return old.filter((f) => f.id !== fileId);
      });
      return { previousData };
    },
    onError: (err, fileId, context) => {
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
      console.error("Error al eliminar archivo:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["archivos", auth.condominioActualId] });
    },
  });

  async function subirArchivo({ archivo, categoria, recursoTipo, recursoId, idempotencyKey }) {
    try {
      const nombreArchivo = archivo.name;
      const contentType = archivo.type || "application/octet-stream";
      const config = idempotencyKey
        ? { headers: { "Idempotency-Key": idempotencyKey } }
        : {};

      const solicitud = await archivosService.solicitarUrl(auth.condominioActualId, {
        categoria,
        nombreArchivo,
        contentType,
        recursoTipo: recursoTipo || null,
        recursoId: recursoId || null,
      }, config);
      const { fileId, uploadUrl, method, proveedor } = solicitud.data;

      if (proveedor === "GOOGLE_DRIVE") {
        await driveUploadMutation.mutateAsync({ fileId, file: archivo });
      } else {
        await fetch(uploadUrl, { method, body: archivo, headers: { "Content-Type": contentType } });

        await confirmarMutation.mutateAsync({
          fileId,
          tamanoBytes: archivo.size,
        });
      }

      return true;
    } catch (e) {
      error.value = e.response?.data?.message || "Error al subir archivo";
      console.error("Error en subirArchivo:", e);
      return false;
    }
  }

  async function eliminar(fileId) {
    try {
      await eliminarMutation.mutateAsync(fileId);
      return true;
    } catch (e) {
      error.value = e.response?.data?.message || "Error al eliminar archivo";
      return false;
    }
  }

  const loading = archivosQuery.isLoading;
  const archivos = archivosQuery.data || [];

  return {
    archivos,
    loading,
    error,
    categoriaSeleccionada,
    listar,
    subirArchivo,
    eliminar,
    CATEGORIAS,
    CATEGORIA_LABELS,
  };
}
