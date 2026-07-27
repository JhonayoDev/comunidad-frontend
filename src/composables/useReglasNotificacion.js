import { ref, computed } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { personalService } from "../services/personalService";
import { REGLAS_CATALOGO } from "../data/reglasCatalogo";

export function useReglasNotificacion() {
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const error = ref(null);

  const queryKey = computed(() => ["reglas-notificacion", auth.condominioActualId]);

  const { data: sobreescrituras, isLoading: loading, refetch: cargar } = useQuery({
    queryKey,
    queryFn: async () => {
      const cid = auth.condominioActualId;
      if (!cid) return [];
      const { data } = await personalService.listarReglas(cid);
      return data;
    },
    enabled: !!auth.condominioActualId,
  });

  const reglasCombinadas = computed(() => {
    const overrides = sobreescrituras.value || [];
    return REGLAS_CATALOGO.map((defaultRule) => {
      const override = overrides.find((o) => o.tipoNotificacion === defaultRule.tipo);
      if (!override) {
        return { ...defaultRule, esSobrescritura: false, habilitada: true };
      }
      const habilitada = override.habilitada !== null ? override.habilitada : true;
      return {
        tipo: defaultRule.tipo,
        audiencia: override.audiencia || defaultRule.audiencia,
        canales: override.canales ? override.canales.split(",") : [...defaultRule.canales],
        prioridad: override.prioridad || defaultRule.prioridad,
        esObligatoria: defaultRule.esObligatoria,
        esSobrescritura: true,
        habilitada,
      };
    });
  });

  const guardarReglaMutation = useMutation({
    mutationFn: async ({ tipoNotificacion, data }) => {
      const cid = auth.condominioActualId;
      if (!cid) throw new Error("selecciona un condominio");
      await personalService.guardarRegla(cid, tipoNotificacion, data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.value });
    },
    onError: (err) => {
      console.error("Error al guardar regla:", err);
    },
  });

  const eliminarReglaMutation = useMutation({
    mutationFn: async (tipoNotificacion) => {
      const cid = auth.condominioActualId;
      if (!cid) throw new Error("selecciona un condominio");
      await personalService.eliminarRegla(cid, tipoNotificacion);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.value });
    },
    onError: (err) => {
      console.error("Error al eliminar regla:", err);
    },
  });

  async function actualizarRegla(tipoNotificacion, data) {
    try {
      await guardarReglaMutation.mutateAsync({ tipoNotificacion, data });
      return true;
    } catch (e) {
      error.value = e.response?.data?.message || "Error al guardar regla";
      return false;
    }
  }

  async function restaurarRegla(tipoNotificacion) {
    try {
      await eliminarReglaMutation.mutateAsync(tipoNotificacion);
      return true;
    } catch (e) {
      error.value = e.response?.data?.message || "Error al restaurar regla";
      return false;
    }
  }

  return {
    reglas: reglasCombinadas,
    loading,
    error,
    cargar,
    actualizarRegla,
    restaurarRegla,
  };
}
