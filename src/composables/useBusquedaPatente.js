import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { busquedaService } from "@/services/busquedaService";
import { accesosService } from "@/services/accesosService";

const tipoConfig = {
  VEHICULO_RESIDENTE: {
    label: "Residente",
    severity: "success",
    icon: "pi pi-home",
  },
  PREAUTORIZACION: {
    label: "Pre-autorizado",
    severity: "info",
    icon: "pi pi-verified",
  },
  VEHICULO_FRECUENTE: {
    label: "Frecuente",
    severity: "warn",
    icon: "pi pi-history",
  },
  DESCONOCIDO: {
    label: "Desconocido",
    severity: "danger",
    icon: "pi pi-exclamation-triangle",
  },
  PERSONA_RESIDENTE: {
    label: "Residente",
    severity: "success",
    icon: "pi pi-user",
  },
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

  const accesosActivos = ref([]);
  const accesoSalida = ref(null);
  const salidaDialogVisible = ref(false);
  const confirmandoSalida = ref(false);
  const salidaError = ref("");
  const tiposUltimoIngreso = ref({});

  const resultadoSeleccionado = computed(() => {
    if (
      indiceSeleccionado.value < 0 ||
      indiceSeleccionado.value >= resultados.value.length
    )
      return null;
    return resultados.value[indiceSeleccionado.value];
  });

  const tipoInfo = computed(() => {
    if (!resultadoSeleccionado.value) return null;
    return (
      tipoConfig[resultadoSeleccionado.value.tipoResultado] || {
        label: resultadoSeleccionado.value.tipoResultado,
        severity: "info",
        icon: "pi pi-info",
      }
    );
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
    if (!cid || patente.value.length < 3) return;
    loading.value = true;
    resultados.value = [];
    indiceSeleccionado.value = -1;
    accesosActivos.value = [];
    accesoSalida.value = null;
    errorMsg.value = "";
    successMsg.value = "";
    hayMas.value = false;
    try {
      const [busquedaRes, accesosRes] = await Promise.all([
        busquedaService.porPatente(cid, patente.value),
        accesosService.listar(cid, { estado: "ACTIVO", size: 40 }),
      ]);
      const envelope = busquedaRes.data;
      resultados.value = envelope.resultados || [];
      hayMas.value = envelope.hayMas || false;

      accesosActivos.value = accesosRes.data?.content || [];

      const frecConRef = resultados.value.filter(
        r => r.tipoResultado === "VEHICULO_FRECUENTE" && r.referenciaId
      );
      if (frecConRef.length) {
        const tipos = await Promise.all(
          frecConRef.map(r =>
            accesosService.obtener(cid, r.referenciaId)
              .then(res => ({ id: r.referenciaId, tipo: res.data.tipo }))
              .catch(() => null)
          )
        );
        const map = {};
        tipos.forEach(t => { if (t) map[t.id] = t.tipo; });
        tiposUltimoIngreso.value = map;
      } else {
        tiposUltimoIngreso.value = {};
      }

      if (
        resultados.value.length === 1 &&
        resultados.value[0].tipoResultado !== "DESCONOCIDO"
      ) {
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

  function cerrarMensajes() {
    errorMsg.value = "";
    successMsg.value = "";
  }

  function extraerPatenteDeResultado(res) {
    if (!res) return patente.value;
    const m = res.subtitulo?.match(/Coincidencia parcial:\s*(\S+)/);
    return m ? m[1] : patente.value;
  }

  function getAccesoActivoDeResultado(res) {
    if (!res || !accesosActivos.value.length) return null;
    const p = extraerPatenteDeResultado(res);
    if (!p || p.length < 2) return null;
    const upper = p.toUpperCase();
    return accesosActivos.value.find(
      (a) =>
        a.patenteVisitante?.toUpperCase() === upper &&
        a.unidadNumero === res.unidadNumero
    ) || null;
  }

  function tieneAccesoActivo(res) {
    return getAccesoActivoDeResultado(res) !== null;
  }

  function getTipoVisita(res) {
    const activo = getAccesoActivoDeResultado(res);
    return activo?.tipo || null;
  }

  function getUltimoTipo(res) {
    if (!res || !res.referenciaId) return null;
    return tiposUltimoIngreso.value[res.referenciaId] || null;
  }

  function getTagInfo(res) {
    if (!res) return { label: "", severity: "info", icon: "pi pi-info" };
    if (tieneAccesoActivo(res)) {
      return { label: "Activo", severity: "success", icon: "pi pi-check-circle" };
    }
    return tipoConfig[res.tipoResultado] || { label: res.tipoResultado, severity: "info", icon: "pi pi-info" };
  }

  //let debounceId = null;
  // function buscarMas(nuevaPatente) {
  //   if (debounceId) clearTimeout(debounceId);
  //   if (nuevaPatente.length < 3) return;
  //   if (nuevaPatente === patente.value) return;
  //   debounceId = setTimeout(() => {
  //     patente.value = nuevaPatente;
  //     consultar();
  //   }, 650);
  // }
  let debounceId = null;
  function buscarMas() {
    if (debounceId) clearTimeout(debounceId);
    if (patente.value.length < 3) return;
    debounceId = setTimeout(() => {
      consultar();
    }, 650);
  }

  function limpiar() {
    if (debounceId) clearTimeout(debounceId);
    resultados.value = [];
    indiceSeleccionado.value = -1;
    accesosActivos.value = [];
    tiposUltimoIngreso.value = {};
    accesoSalida.value = null;
    patente.value = "";
    errorMsg.value = "";
    successMsg.value = "";
    hayMas.value = false;
  }

  function abrirDialogSalida(res) {
    const activo = getAccesoActivoDeResultado(res);
    if (!activo) return;
    accesoSalida.value = activo;
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
      salidaError.value =
        e.response?.data?.message || "Error al registrar salida";
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
    accesosActivos,
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
    extraerPatenteDeResultado,
    getAccesoActivoDeResultado,
    tieneAccesoActivo,
    getTipoVisita,
    getUltimoTipo,
    getTagInfo,
  };
}
