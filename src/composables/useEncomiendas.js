import { ref } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { encomiendasService } from "../services/encomiendasService";
import { archivosService } from "../services/archivosService";
import { usePaginacion } from "./usePaginacion";
import { comprimirImagen } from "../utils/imageCompressor";

export function useEncomiendas() {
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const pag = usePaginacion();
  const error = ref(null);
  const filtrosActuales = ref({});

  const encomiendasQuery = useQuery({
    queryKey: ["encomiendas", auth.condominioActualId, pag.paramsPaginacion, filtrosActuales],
    queryFn: async () => {
      const cid = auth.condominioActualId;
      if (!cid) return;
      const response = await encomiendasService.getEncomiendas(cid, {
        ...filtrosActuales.value,
        ...pag.paramsPaginacion.value,
      });
      pag.actualizar(response.data);
      return response.data;
    },
    enabled: !!auth.condominioActualId,
  });

  async function cargar(filtros = {}) {
    filtrosActuales.value = filtros;
    await encomiendasQuery.refetch();
  }

  const registrarMutation = useMutation({
    mutationFn: async ({ formData, archivo }) => {
      const cid = auth.condominioActualId;
      if (!cid) throw new Error("selecciona un condominio");

      let fileId = null;

      if (archivo) {
        const compressed = await comprimirImagen(archivo);

        const solicitud = await archivosService.solicitarUrl(cid, {
          categoria: "ENCOMIENDA",
          nombreArchivo: archivo.name,
          contentType: "image/jpeg",
          recursoTipo: "ENCOMIENDA",
          recursoId: null,
        });
        const { fileId: fid, uploadUrl, method } = solicitud.data;

        await fetch(uploadUrl, { method, body: compressed, headers: { "Content-Type": "image/jpeg" } });

        await archivosService.confirmar(cid, { fileId: fid, tamanoBytes: compressed.size });

        fileId = fid;
      }

      await encomiendasService.registrar(cid, { ...formData, fileId });
    },
    onError: (err) => {
      console.error("Error al registrar encomienda:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["encomiendas", auth.condominioActualId] });
      queryClient.invalidateQueries({ queryKey: ["encomiendasPendientes", auth.condominioActualId] });
    },
  });

  const detalleQuery = useQuery({
    queryKey: ["encomienda-detalle", auth.condominioActualId, ref(null)],
    queryFn: () => null,
    enabled: false,
  });

  async function obtenerDetalle(encomiendaId) {
    const cid = auth.condominioActualId;
    if (!cid) return null;
    try {
      const { data } = await encomiendasService.getEncomienda(cid, encomiendaId);
      return data;
    } catch (e) {
      console.error("Error al obtener detalle de encomienda:", e);
      return null;
    }
  }

  const entregarMutation = useMutation({
    mutationFn: async ({ encomienda, nombreRetira, rutRetira }) => {
      const cid = auth.condominioActualId;
      if (!cid) throw new Error("selecciona un condominio");
      await encomiendasService.entregar(cid, encomienda.id, { nombreRetira, rutRetira });
      return encomienda;
    },
    onMutate: async ({ encomienda }) => {
      await queryClient.cancelQueries({ queryKey: ["encomiendas", auth.condominioActualId] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ["encomiendas", auth.condominioActualId] });
      queryClient.setQueriesData({ queryKey: ["encomiendas", auth.condominioActualId] }, (old) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.map((e) => e.id === encomienda.id ? { ...e, estado: "ENTREGADA" } : e) };
      });
      return { previousQueries };
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      console.error("Error al entregar encomienda:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["encomiendas", auth.condominioActualId] });
      queryClient.invalidateQueries({ queryKey: ["encomiendasPendientes", auth.condominioActualId] });
    },
  });

  async function registrar(formData, archivo) {
    try {
      await registrarMutation.mutateAsync({ formData, archivo });
      return true;
    } catch (e) {
      return e.response?.data?.message || "Error al registrar encomienda";
    }
  }

  async function entregar(encomienda, nombreRetira, rutRetira) {
    try {
      await entregarMutation.mutateAsync({ encomienda, nombreRetira, rutRetira });
      return true;
    } catch (e) {
      return e.response?.data?.message || "Error al registrar entrega";
    }
  }

  const loading = encomiendasQuery.isLoading;
  const encomiendas = pag.contenido;

  return {
    encomiendas,
    loading,
    error,
    cargar,
    registrar,
    entregar,
    obtenerDetalle,
    pag,
  };
}
