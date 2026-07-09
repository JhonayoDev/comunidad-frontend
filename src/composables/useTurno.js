import { ref, reactive, onUnmounted } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "@/stores/authStore";
import { bitacoraService } from "@/services/bitacoraService";

export function useTurno() {
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const tiempoTranscurrido = ref("");
  const turnoLoading = ref(false);
  const turnoError = ref(null);
  const showNovedadDialog = ref(false);
  const enviandoNovedad = ref(false);
  const nuevaNovedad = reactive({
    tipo: "NOVEDAD",
    clasificacion: "NORMAL",
    observaciones: "",
    fotoUrl: "",
  });
  let timerInterval = null;

  const accionesLabels = {
    TURNO_INICIO: { label: "Iniciar turno", icon: "pi pi-play", severity: "success" },
    TURNO_FIN: { label: "Finalizar turno", icon: "pi pi-stop", severity: "danger" },
    COLACION_SALIDA: { label: "Salir a colación", icon: "pi pi-clock", severity: "warn" },
    COLACION_REGRESO: { label: "Regresar de colación", icon: "pi pi-check-circle", severity: "info" },
    NOVEDAD: { label: "Registrar novedad", icon: "pi pi-pencil", severity: "help" },
  };

  const clasificaciones = [
    { label: "Normal", value: "NORMAL" },
    { label: "Urgente", value: "URGENTE" },
    { label: "Emergencia", value: "EMERGENCIA" },
    { label: "Informativo", value: "INFO" },
  ];

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

  function actualizarTiempo() {
    if (!turno.value?.ultimoEventoEn) {
      tiempoTranscurrido.value = "";
      return;
    }
    const desde = new Date(turno.value.ultimoEventoEn);
    const ahora = new Date();
    const diff = Math.floor((ahora - desde) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    tiempoTranscurrido.value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function iniciarTimer() {
    detenerTimer();
    if (turno.value?.enTurno) {
      actualizarTiempo();
      timerInterval = setInterval(actualizarTiempo, 1000);
    } else {
      tiempoTranscurrido.value = "";
    }
  }

  function detenerTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

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
    mutationFn: async () => {
      if (!nuevaNovedad.observaciones.trim()) throw new Error("Observaciones requeridas");
      const cid = auth.condominioActualId;
      if (!cid) throw new Error("No hay condominio seleccionado");
      await bitacoraService.registrarEvento(cid, {
        tipo: nuevaNovedad.tipo,
        clasificacion: nuevaNovedad.clasificacion,
        observaciones: nuevaNovedad.observaciones,
        fotoUrl: nuevaNovedad.fotoUrl || null,
      });
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
      showNovedadDialog.value = false;
      nuevaNovedad.tipo = "NOVEDAD";
      nuevaNovedad.clasificacion = "NORMAL";
      nuevaNovedad.observaciones = "";
      nuevaNovedad.fotoUrl = "";
      queryClient.invalidateQueries({ queryKey: ["miTurno", auth.condominioActualId] });
    },
  });

  async function ejecutarAccion(tipo) {
    if (tipo === "NOVEDAD") {
      showNovedadDialog.value = true;
      return;
    }
    await accionMutation.mutateAsync(tipo);
  }

  async function registrarNovedad() {
    await novedadMutation.mutateAsync();
  }

  function onTurnoChange() {
    iniciarTimer();
  }

  onUnmounted(detenerTimer);

  return {
    turno,
    tiempoTranscurrido,
    turnoLoading,
    turnoError,
    showNovedadDialog,
    enviandoNovedad,
    nuevaNovedad,
    accionesLabels,
    clasificaciones,
    cargarTurno,
    ejecutarAccion,
    registrarNovedad,
    formatearFecha,
  };
}