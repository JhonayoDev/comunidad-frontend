import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/services/dashboardService";

export const SETUP_PASOS = [
  {
    key: "unidades",
    label: "Unidades",
    descripcion: "Crea las unidades del condominio",
    icon: "pi pi-home",
    routeName: "SetupUnidades",
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
    } finally {
      cargando.value = false;
    }
  }

  function pasoCompletado(key) {
    if (key === "unidades") {
      return (totales.value.unidades ?? 0) > 0;
    }
    if (key === "planilla") {
      return (totales.value.residentesActivos ?? 0) > 0;
    }
    // Pasos 2-5 (accesos, áreas comunes, cargos, personal) aún no tienen
    // lógica real — se marcan como pendientes hasta implementarse.
    return false;
  }

  const pasos = computed(() =>
    SETUP_PASOS.map((p) => ({ ...p, completado: pasoCompletado(p.key) }))
  );

  const primerPasoPendiente = computed(
    () => pasos.value.find((p) => !p.completado) || null
  );

  const configuraciónCompleta = computed(
    () => pasos.value.length > 0 && pasos.value.every((p) => p.completado)
  );

  const progreso = computed(() => {
    if (!pasos.value.length) return 0;
    const completados = pasos.value.filter((p) => p.completado).length;
    return Math.round((completados / pasos.value.length) * 100);
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
    pasos,
    primerPasoPendiente,
    configuraciónCompleta,
    progreso,
    cargar,
    sincronizarTotales,
  };
}