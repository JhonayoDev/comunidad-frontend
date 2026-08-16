import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/services/dashboardService";
import { unidadesService } from "@/services/unidadesService";

export const SETUP_PASOS = [
  {
    key: "unidades",
    label: "Unidades",
    descripcion: "Crea las unidades del condominio",
    icon: "pi pi-home",
    routeName: "SetupUnidades",
  },
  {
    key: "estacionamientos",
    label: "Estacionamientos",
    descripcion: "Crea los estacionamientos del condominio",
    icon: "pi pi-car",
    routeName: "SetupEstacionamientos",
  },
  {
    key: "bodegas",
    label: "Bodegas",
    descripcion: "Crea las bodegas del condominio (si aplican)",
    icon: "pi pi-box",
    routeName: "SetupBodegas",
  },
  {
    key: "planilla",
    label: "Planilla",
    descripcion: "Registra integrantes, vehículos y estacionamientos",
    icon: "pi pi-users",
    routeName: "SetupPlanilla",
  },
  {
    key: "accesos",
    label: "Accesos",
    descripcion: "Configura los accesos del condominio",
    icon: "pi pi-shield",
    routeName: "SetupAccesos",
  },
  {
    key: "areas-comunes",
    label: "Áreas comunes",
    descripcion: "Define las áreas comunes del condominio",
    icon: "pi pi-building",
    routeName: "SetupAreasComunes",
  },
  {
    key: "cargos",
    label: "Cargos",
    descripcion: "Asigna la directiva de gestión",
    icon: "pi pi-briefcase",
    routeName: "SetupCargos",
  },
  {
    key: "personal",
    label: "Personal",
    descripcion: "Registra el personal de trabajo",
    icon: "pi pi-id-card",
    routeName: "SetupPersonal",
  },
];

export function useSetupConfiguracion() {
  const auth = useAuthStore();
  const cargando = ref(true);
  const error = ref(null);
  const totales = ref({ unidades: 0, residentesActivos: 0, vehiculos: 0 });
  const capacidad = ref(null);

  async function cargar() {
    const cid = auth.condominioActualId;
    if (!cid) {
      cargando.value = false;
      return;
    }
    cargando.value = true;
    error.value = null;
    try {
      const { data } = await dashboardService.admin(cid);
      totales.value = data?.totales || { unidades: 0, residentesActivos: 0, vehiculos: 0 };
    } catch (e) {
      console.error("Error al cargar el estado de configuración", e);
      error.value = "No se pudo cargar el estado de configuración";
    }
    try {
      const capRes = await unidadesService.getCapacidad(cid);
      capacidad.value = capRes.data;
    } catch (e) {
      if (e?.response?.status !== 404) {
        console.error("Error al cargar la capacidad del condominio", e);
      }
      capacidad.value = null;
    } finally {
      cargando.value = false;
    }
  }

  // "Aplica" si hay capacidad declarada o ya existen creados.
  function aplicaEntidad(tipo) {
    const cap = capacidad.value;
    if (!cap) return false;
    const c = tipo === "estacionamiento" ? cap.capacidadEstacionamientos : cap.capacidadBodegas;
    const t = tipo === "estacionamiento" ? cap.totalEstacionamientos : cap.totalBodegas;
    return (c ?? 0) > 0 || (t ?? 0) > 0;
  }

  function pasoOculto(key) {
    if (key !== "estacionamientos" && key !== "bodegas") return false;
    // Sin datos de capacidad (aún cargando o endpoint 404) → oculto para no
    // bloquear el wizard.
    if (!capacidad.value) return true;
    return !aplicaEntidad(key === "estacionamientos" ? "estacionamiento" : "bodega");
  }

  function pasoCompletado(key) {
    if (key === "unidades") {
      return (totales.value.unidades ?? 0) > 0;
    }
    if (key === "planilla") {
      return (totales.value.residentesActivos ?? 0) > 0;
    }
    if (key === "estacionamientos" || key === "bodegas") {
      if (!capacidad.value) return true; // oculto → no bloquea
      const tipo = key === "estacionamientos" ? "estacionamiento" : "bodega";
      if (!aplicaEntidad(tipo)) return true;
      const t = tipo === "estacionamiento" ? capacidad.value.totalEstacionamientos : capacidad.value.totalBodegas;
      return (t ?? 0) > 0;
    }
    // Pasos 2-5 (accesos, áreas comunes, cargos, personal) aún no tienen
    // lógica real — se marcan como pendientes hasta implementarse.
    return false;
  }

  const pasos = computed(() =>
    SETUP_PASOS.map((p) => ({
      ...p,
      completado: pasoCompletado(p.key),
      oculto: pasoOculto(p.key),
    }))
  );

  const primerPasoPendiente = computed(
    () => pasos.value.find((p) => !p.completado && !p.oculto) || null
  );

  const configuraciónCompleta = computed(() => {
    const visibles = pasos.value.filter((p) => !p.oculto);
    return visibles.length > 0 && visibles.every((p) => p.completado);
  });

  const progreso = computed(() => {
    const visibles = pasos.value.filter((p) => !p.oculto);
    if (!visibles.length) return 0;
    const completados = visibles.filter((p) => p.completado).length;
    return Math.round((completados / visibles.length) * 100);
  });

  function sincronizarTotales(totalesData) {
    totales.value = {
      unidades: totalesData?.unidades ?? 0,
      residentesActivos: totalesData?.residentesActivos ?? 0,
      vehiculos: totalesData?.vehiculos ?? 0,
    };
  }

  return {
    cargando,
    error,
    totales,
    capacidad,
    pasos,
    primerPasoPendiente,
    configuraciónCompleta,
    progreso,
    cargar,
    sincronizarTotales,
  };
}