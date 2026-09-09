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
        return {
          ...defaultRule,
          canales: [...defaultRule.canales],
          esSobrescritura: false,
          habilitada: true,
        };
      }
      return {
        tipo: defaultRule.tipo,
        audiencia: override.audiencia || defaultRule.audiencia,
        canales: override.canales?.length ? [...override.canales] : [...defaultRule.canales],
        prioridad: override.prioridad || defaultRule.prioridad,
        esObligatoriaInapp: override.esObligatoriaInapp ?? defaultRule.esObligatoriaInapp,
        esObligatoriaEmail: override.esObligatoriaEmail ?? defaultRule.esObligatoriaEmail,
        esObligatoriaPush: override.esObligatoriaPush ?? defaultRule.esObligatoriaPush,
        visibleUsuario: override.visibleUsuario ?? defaultRule.visibleUsuario,
        esSobrescritura: true,
        habilitada: override.habilitada ?? true,
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

  // El backend hace upsert pisando TODOS los campos (null = heredar del
  // catálogo global). Para no perder config (ej. cambiar canales re-habilita
  // una regla deshabilitada), siempre se envía el estado completo combinado.
  function payloadCompleto(regla) {
    return {
      audiencia: regla.audiencia,
      canales: regla.canales,
      prioridad: regla.prioridad,
      esObligatoriaInapp: regla.esObligatoriaInapp,
      esObligatoriaEmail: regla.esObligatoriaEmail,
      esObligatoriaPush: regla.esObligatoriaPush,
      visibleUsuario: regla.visibleUsuario,
      habilitada: regla.habilitada,
    };
  }

  async function actualizarRegla(regla) {
    try {
      await guardarReglaMutation.mutateAsync({
        tipoNotificacion: regla.tipo,
        data: payloadCompleto(regla),
      });
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
