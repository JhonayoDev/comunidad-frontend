import { ref } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { bitacoraService } from "@/services/bitacoraService";

export function useTurno() {
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const turnoLoading = ref(false);
  const turnoError = ref(null);
  const enviandoNovedad = ref(false);

  const accionesLabels = {
    TURNO_INICIO: { label: "Iniciar turno", icon: "pi pi-play", severity: "success" },
    TURNO_FIN: { label: "Finalizar turno", icon: "pi pi-stop", severity: "danger" },
    COLACION_SALIDA: { label: "Salir a colación", icon: "pi pi-clock", severity: "warn" },
    COLACION_REGRESO: { label: "Regresar de colación", icon: "pi pi-check-circle", severity: "info" },
    NOVEDAD: { label: "Registrar novedad", icon: "pi pi-pencil", severity: "help" },
  };

  const confirmMessages = {
    TURNO_INICIO: "¿Seguro que deseas iniciar tu turno?",
    TURNO_FIN: "¿Seguro que deseas finalizar tu turno?",
    COLACION_SALIDA: "¿Seguro que deseas comenzar tu hora de colación?",
    COLACION_REGRESO: "¿Seguro que deseas registrar tu regreso de colación?",
  };

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
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  }

  const accionMutation = useMutation({
    mutationFn: async (tipo) => {
      const cid = auth.condominioActualId;
      if (!cid) throw new Error("No hay condominio seleccionado");
      await bitacoraService.registrarEvento(cid, { tipo, clasificacion: "NORMAL" });
    },
    onMutate: () => {
      turnoLoading.value = true;
      turnoError.value = null;
    },
    onError: (e) => {
      console.error("Error al registrar acción de turno", e);
      turnoError.value = "Error al registrar acción de turno";
    },
    onSettled: () => {
      turnoLoading.value = false;
      queryClient.invalidateQueries({ queryKey: ["miTurno", auth.condominioActualId] });
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
      queryClient.invalidateQueries({ queryKey: ["miTurno", auth.condominioActualId] });
    },
  });

  async function ejecutarAccion(tipo) {
    await accionMutation.mutateAsync(tipo);
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
  };
}
