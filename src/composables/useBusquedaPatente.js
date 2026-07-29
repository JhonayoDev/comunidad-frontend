import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { busquedaService } from "@/services/busquedaService";
import { accesosService } from "@/services/accesosService";

const tipoConfig = {
  VEHICULO_RESIDENTE: { label: "Residente", severity: "success", icon: "pi pi-home" },
  PREAUTORIZACION: { label: "Pre-autorizado", severity: "info", icon: "pi pi-verified" },
  VEHICULO_FRECUENTE: { label: "Frecuente", severity: "warn", icon: "pi pi-history" },
  DESCONOCIDO: { label: "Desconocido", severity: "danger", icon: "pi pi-exclamation-triangle" },
  PERSONA_RESIDENTE: { label: "Residente", severity: "success", icon: "pi pi-user" },
};

export function useBusquedaPatente() {
  const auth = useAuthStore();
  const patente = ref("");
  const resultados = ref([]);
  const indiceSeleccionado = ref(-1);
  const loading = ref(false);
  const errorMsg = ref("");
  const successMsg = ref("");
  const hayMas = ref(false);

  const accesoSalida = ref(null);
  const salidaDialogVisible = ref(false);
  const confirmandoSalida = ref(false);
  const salidaError = ref("");

  const resultadoSeleccionado = computed(() => {
    if (indiceSeleccionado.value < 0 || indiceSeleccionado.value >= resultados.value.length) return null;
    return resultados.value[indiceSeleccionado.value];
  });

  const tipoInfo = computed(() => {
    if (!resultadoSeleccionado.value) return null;
    return tipoConfig[resultadoSeleccionado.value.tipoResultado]
      || { label: resultadoSeleccionado.value.tipoResultado, severity: "info", icon: "pi pi-info" };
  });

  function tipoLabel(res) {
    if (!res) return "";
    return tipoConfig[res.tipoResultado]?.label || res.tipoResultado;
  }

  function tipoSeverity(res) {
    if (!res) return "info";
    return tipoConfig[res.tipoResultado]?.severity || "info";
  }

  async function consultar() {
    const cid = auth.condominioActualId;
    if (!cid || patente.value.length < 2) return;
    loading.value = true;
    resultados.value = [];
    indiceSeleccionado.value = -1;
    accesoSalida.value = null;
    errorMsg.value = "";
    successMsg.value = "";
    hayMas.value = false;
    try {
      const [busquedaRes, accesosRes] = await Promise.all([
        busquedaService.porPatente(cid, patente.value),
        accesosService.listar(cid, { estado: "ACTIVO" }),
      ]);
      const envelope = busquedaRes.data;
      resultados.value = envelope.resultados || [];
      hayMas.value = envelope.hayMas || false;

      const activo = (accesosRes.data || []).find(
        (a) => a.patenteVisitante?.toUpperCase() === patente.value.toUpperCase()
      );
      accesoSalida.value = activo || null;

      if (resultados.value.length === 1 && resultados.value[0].tipoResultado !== "DESCONOCIDO") {
        indiceSeleccionado.value = 0;
      }
    } catch (e) {
      console.error("Error al consultar:", e);
      errorMsg.value = "Error al consultar. Intente nuevamente.";
    } finally {
      loading.value = false;
    }
  }

  function tieneAccion(accion, res) {
    const target = res || resultadoSeleccionado.value;
    return target?.acciones?.includes(accion);
  }

  function toggleExpand(idx) {
    indiceSeleccionado.value = indiceSeleccionado.value === idx ? -1 : idx;
  }

  function limpiar() {
    resultados.value = [];
    indiceSeleccionado.value = -1;
    accesoSalida.value = null;
    patente.value = "";
    errorMsg.value = "";
    successMsg.value = "";
    hayMas.value = false;
  }

  function cerrarMensajes() {
    errorMsg.value = "";
    successMsg.value = "";
  }

  let debounceId = null;
  function buscarMas(nuevaPatente) {
    if (debounceId) clearTimeout(debounceId);
    if (nuevaPatente.length < 2) return;
    if (nuevaPatente === patente.value) return;
    debounceId = setTimeout(() => {
      patente.value = nuevaPatente;
      consultar();
    }, 400);
  }

  function abrirDialogSalida() {
    salidaError.value = "";
    salidaDialogVisible.value = true;
  }

  async function confirmarSalida(observacion) {
    const cid = auth.condominioActualId;
    if (!cid || !accesoSalida.value) return;
    confirmandoSalida.value = true;
    try {
      const body = observacion ? { observacion } : {};
      await accesosService.registrarSalida(cid, accesoSalida.value.id, body);
      successMsg.value = "Salida registrada correctamente";
      salidaDialogVisible.value = false;
      limpiar();
    } catch (e) {
      console.error("Error al registrar salida:", e);
      salidaError.value = e.response?.data?.message || "Error al registrar salida";
    } finally {
      confirmandoSalida.value = false;
    }
  }

  return {
    patente,
    resultados,
    resultadoSeleccionado,
    indiceSeleccionado,
    loading,
    errorMsg,
    successMsg,
    tipoInfo,
    hayMas,
    accesoSalida,
    salidaDialogVisible,
    confirmandoSalida,
    salidaError,
    consultar,
    limpiar,
    tieneAccion,
    toggleExpand,
    abrirDialogSalida,
    confirmarSalida,
    cerrarMensajes,
    buscarMas,
    tipoLabel,
    tipoSeverity,
  };
}
