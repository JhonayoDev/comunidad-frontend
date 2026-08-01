import { ref } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { bitacoraService } from "@/services/bitacoraService";
import { formatearHora } from "@/utils/fechas";

export function useTurno() {
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const turnoLoading = ref(false);
  const turnoError = ref(null);
  const enviandoNovedad = ref(false);

  // ─── Estado del checklist dialog ──────────────────────────────────────
  const checklistDialogVisible = ref(false);
  const checklistItems = ref([]);
  const checklistTipo = ref(null);
  const checklistLoading = ref(false);

  const accionesLabels = {
    TURNO_INICIO: {
      label: "Iniciar turno",
      icon: "pi pi-play",
      severity: "success",
    },
    TURNO_FIN: {
      label: "Finalizar turno",
      icon: "pi pi-stop",
      severity: "danger",
    },
    COLACION_SALIDA: {
      label: "Salir a colación",
      icon: "pi pi-clock",
      severity: "warn",
    },
    COLACION_REGRESO: {
      label: "Regresar de colación",
      icon: "pi pi-check-circle",
      severity: "info",
    },
    NOVEDAD: {
      label: "Registrar novedad",
      icon: "pi pi-pencil",
      severity: "help",
    },
  };

  const confirmMessages = {
    TURNO_INICIO: "¿Desea iniciar su turno?",
    TURNO_FIN: "¿Desea finalizar su turno?",
    COLACION_SALIDA: "¿Desea comenzar su hora de colación?",
    COLACION_REGRESO: "¿Desea registrar su regreso de colación?",
  };

  //TODO: REVISAR LA SALIDA PARA EL HEADER DE LA CARD
  function eventoLabel(turno) {
    if (!turno?.enTurno) return null;
    const hora = formatearFecha(turno.ultimoEventoEn);
    if (turno.enColacion) return "Colación desde " + hora;
    return "Turno desde " + hora;
  }

  const { data: turno, refetch: cargarTurno } = useQuery({
    queryKey: ["miTurno", auth.condominioActualId],
    queryFn: async () => {
      const cid = auth.condominioActualId;
      if (!cid) return null;
      const res = await bitacoraService.miTurno(cid);
      return res.data;
    },
    enabled: !!auth.condominioActualId,
  });

  function formatearFecha(iso) {
    return formatearHora(iso);
  }

  const accionMutation = useMutation({
    mutationFn: async (payload) => {
      const cid = auth.condominioActualId;
      if (!cid) throw new Error("No hay condominio seleccionado");
      if (typeof payload === "string") {
        await bitacoraService.registrarEvento(cid, {
          tipo: payload,
          clasificacion: "NORMAL",
        });
      } else {
        await bitacoraService.registrarEvento(cid, {
          tipo: payload.tipo,
          clasificacion: "NORMAL",
          ...(payload.respuestas?.length
            ? { respuestas: payload.respuestas }
            : {}),
        });
      }
    },
    onMutate: () => {
      turnoLoading.value = true;
      turnoError.value = null;
    },
    onError: (e) => {
      console.error("Error al registrar acción de turno", e);
      turnoError.value = "Error al registrar acción en turno";
    },
    onSettled: () => {
      turnoLoading.value = false;
      queryClient.invalidateQueries({
        queryKey: ["miTurno", auth.condominioActualId],
      });
    },
  });

  const novedadMutation = useMutation({
    mutationFn: async (data) => {
      const cid = auth.condominioActualId;
      if (!cid) throw new Error("No hay condominio seleccionado");
      await bitacoraService.registrarEvento(cid, data);
    },
    onMutate: () => {
      enviandoNovedad.value = true;
      turnoError.value = null;
    },
    onError: (e) => {
      console.error("Error al registrar novedad", e);
      turnoError.value = "Error al registrar novedad";
    },
    onSettled: () => {
      enviandoNovedad.value = false;
      queryClient.invalidateQueries({
        queryKey: ["miTurno", auth.condominioActualId],
      });
    },
  });

  async function ejecutarAccion(tipo) {
    const cid = auth.condominioActualId;
    if (!cid) throw new Error("No hay condominio seleccionado");

    // Verificar si existe checklist para este tipo de evento
    checklistLoading.value = true;
    try {
      const res = await bitacoraService.obtenerChecklist(cid, tipo);
      const items = res?.data?.items;
      if (items && items.length > 0) {
        // Hay checklist → mostrar diálogo, pausar registro
        checklistItems.value = items;
        checklistTipo.value = tipo;
        checklistDialogVisible.value = true;
        return;
      }
    } catch (e) {
      // Si falla la consulta del checklist, registrar igual (sin respuestas)
      console.error("Error al verificar checklist para " + tipo, e);
    } finally {
      checklistLoading.value = false;
    }

    // Sin checklist → registrar directamente
    await accionMutation.mutateAsync(tipo);
  }

  async function confirmarConChecklist(respuestas) {
    if (!checklistTipo.value) return;
    await accionMutation.mutateAsync({
      tipo: checklistTipo.value,
      respuestas,
    });
    checklistDialogVisible.value = false;
    checklistTipo.value = null;
  }

  function cancelarChecklist() {
    checklistDialogVisible.value = false;
    checklistTipo.value = null;
    checklistItems.value = [];
  }

  async function registrarNovedad(data) {
    await novedadMutation.mutateAsync(data);
  }

  return {
    turno,
    turnoLoading,
    turnoError,
    enviandoNovedad,
    accionesLabels,
    confirmMessages,
    eventoLabel,
    cargarTurno,
    ejecutarAccion,
    registrarNovedad,
    formatearFecha,

    checklistDialogVisible,
    checklistItems,
    checklistLoading,
    checklistTipo,
    confirmarConChecklist,
    cancelarChecklist,
  };
}
