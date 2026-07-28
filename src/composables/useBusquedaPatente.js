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
  AUTORIZACION_SIN_VEHICULO: { label: "Sin vehículo", severity: "info", icon: "pi pi-user" },
};

export function useBusquedaPatente() {
  const auth = useAuthStore();
  const patente = ref("");
  const resultado = ref(null);
  const loading = ref(false);
  const errorMsg = ref("");
  const successMsg = ref("");

  const ingresoDialogVisible = ref(false);
  const registrando = ref(false);
  const ingresoForm = ref({
    unidadId: null,
    tipo: null,
    cantidadPersonas: 1,
  });
  const erroresForm = ref({});
  const registrandoSalida = ref(false);

  const tipoInfo = computed(() => {
    if (!resultado.value) return null;
    return tipoConfig[resultado.value.tipoResultado] || { label: resultado.value.tipoResultado, severity: "info", icon: "pi pi-info" };
  });

  async function consultar() {
    const cid = auth.condominioActualId;
    if (!cid || patente.value.length < 2) return;
    loading.value = true;
    resultado.value = null;
    errorMsg.value = "";
    successMsg.value = "";
    try {
      const { data } = await busquedaService.porPatente(cid, patente.value);
      resultado.value = data;
    } catch (e) {
      console.error("Error al buscar por patente:", e);
      errorMsg.value = "Error al consultar. Intente nuevamente.";
    } finally {
      loading.value = false;
    }
  }

  function tieneAccion(accion) {
    return resultado.value?.acciones?.includes(accion);
  }

  function abrirDialogIngreso() {
    ingresoForm.value = { unidadId: null, tipo: null, cantidadPersonas: 1 };
    erroresForm.value = {};
    ingresoDialogVisible.value = true;
  }

  async function confirmarIngreso() {
    const errs = {};
    if (!ingresoForm.value.unidadId) errs.unidadId = "Seleccione unidad destino";
    if (!ingresoForm.value.tipo) errs.tipo = "Seleccione tipo de visita";
    if (!ingresoForm.value.cantidadPersonas || ingresoForm.value.cantidadPersonas < 1) {
      errs.cantidadPersonas = "Mínimo 1 persona";
    }
    erroresForm.value = errs;
    if (Object.keys(errs).length) return;

    const cid = auth.condominioActualId;
    if (!cid) return;
    registrando.value = true;
    try {
      const body = {
        unidadId: ingresoForm.value.unidadId,
        nombreVisitante: resultado.value.titulo || patente.value,
        tipo: ingresoForm.value.tipo,
        cantidadPersonas: Number(ingresoForm.value.cantidadPersonas),
        patenteVisitante: patente.value,
      };
      if (resultado.value.tipoResultado === "PREAUTORIZACION" && resultado.value.referenciaId) {
        body.autorizacionId = resultado.value.referenciaId;
      }
      await accesosService.registrarIngreso(cid, body);
      successMsg.value = "Ingreso registrado correctamente";
      ingresoDialogVisible.value = false;
      resultado.value = null;
      patente.value = "";
    } catch (e) {
      console.error("Error al registrar ingreso:", e);
      errorMsg.value = e.response?.data?.message || "Error al registrar ingreso";
    } finally {
      registrando.value = false;
    }
  }

  function cerrarMensajes() {
    errorMsg.value = "";
    successMsg.value = "";
  }

  return {
    patente,
    resultado,
    loading,
    errorMsg,
    successMsg,
    tipoInfo,
    ingresoDialogVisible,
    registrando,
    ingresoForm,
    erroresForm,
    consultar,
    tieneAccion,
    abrirDialogIngreso,
    confirmarIngreso,
    cerrarMensajes,
  };
}
