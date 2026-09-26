import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/services/dashboardService";
import { unidadesService } from "@/services/unidadesService";
import { encomiendasService } from "@/services/encomiendasService";
import { espaciosService } from "@/services/espaciosService";

export const SETUP_PASOS = [
  {
    key: "unidades",
    label: "Unidades",
    descripcion: "Crea las unidades del condominio",
    icon: "pi pi-home",
    routeName: "SetupUnidades",
  },
  {
    key: "sectores",
    label: "Sectores",
    descripcion: "Gestiona los sectores del condominio",
    icon: "pi pi-sitemap",
    routeName: "SetupSectores",
  },
  {
    key: "pisos",
    label: "Pisos",
    descripcion: "Declara los pisos del condominio",
    icon: "pi pi-th-large",
    routeName: "SetupPisos",
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

// Override de edición (module scope, compartido por las instancias): mientras
// un paso está en edición manual se muestra pendiente aunque los datos digan
// lo contrario. Se limpia al guardar/cambiar de ruta. No toca el dashboard
// (su banner sigue derivado de datos reales).
const pasoEnEdicion = ref(null);

export function marcarEnEdicion(key) {
  pasoEnEdicion.value = key || null;
}

// Pasos guardados por el usuario (module scope, compartido + persistido).
// Un paso se marca completado tras el primer Guardar persistido, aunque los
// datos vengan de antes: sobrevive recargas vía localStorage.
export const pasosGuardados = ref(new Set());

function claveGuardado(cid, key) {
  return `${cid}:${key}`;
}

export function marcarPasoGuardado(cid, key) {
  if (!cid || !key) return;
  pasosGuardados.value.add(claveGuardado(cid, key));
  try {
    localStorage.setItem(`comunidad:setup-guardado:${cid}:${key}`, "1");
  } catch (e) {
    console.error("Error al persistir paso guardado", e);
  }
}

export function reiniciarGuardados() {
  pasosGuardados.value.clear();
}

function cargarGuardados(cid) {
  if (!cid) return;
  try {
    for (const p of SETUP_PASOS) {
      if (localStorage.getItem(`comunidad:setup-guardado:${cid}:${p.key}`)) {
        pasosGuardados.value.add(claveGuardado(cid, p.key));
      }
    }
  } catch (e) {
    console.error("Error al leer pasos guardados", e);
  }
}

export function useSetupConfiguracion() {  const auth = useAuthStore();
  const cargando = ref(true);
  const error = ref(null);
  const totales = ref({ unidades: 0, residentesActivos: 0, vehiculos: 0 });
  const capacidad = ref(null);
  // null = sin datos (403 sin permiso o error): no bloquea el wizard.
  const totalAccesos = ref(null);
  // null = sin datos (403 sin permiso o error): paso pendiente con aviso.
  const totalEspacios = ref(null);

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
    }
    try {
      const accRes = await encomiendasService.getAccesosEncomiendas(cid);
      const listaAcc = Array.isArray(accRes.data) ? accRes.data : [];
      totalAccesos.value = listaAcc.filter((a) => a.activo !== false).length;
    } catch (e) {
      // 403 sin ENCOMIENDA_VER o error: sin datos, el paso no bloquea.
      if (e?.response?.status !== 403 && e?.response?.status !== 404) {
        console.error("Error al cargar los accesos del condominio", e);
      }
      totalAccesos.value = null;
    }
    try {
      const espRes = await espaciosService.getEspacios(cid);
      const listaEsp = Array.isArray(espRes.data) ? espRes.data : [];
      totalEspacios.value = listaEsp.filter((e) => e.activo !== false).length;
    } catch (e) {
      if (e?.response?.status !== 403 && e?.response?.status !== 404) {
        console.error("Error al cargar los espacios comunes", e);
      }
      totalEspacios.value = null;
    }
    cargarGuardados(cid);
    cargando.value = false;
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
    // En edición manual el paso figura pendiente hasta guardar.
    if (pasoEnEdicion.value && pasoEnEdicion.value === key) return false;
    if (key === "unidades") {
      return (totales.value.unidades ?? 0) > 0;
    }
    if (key === "sectores") {
      // Etapa 2: se marca completada cuando hay unidades (los sectores son
      // opcionales y se gestionan libremente desde su vista).
      return (totales.value.unidades ?? 0) > 0;
    }
    if (key === "pisos") {
      // Catálogo de pisos: opcional (edificio de un solo nivel no requiere
      // declararlo). Se marca completada con unidades, como sectores.
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
    if (key === "accesos") {
      // Completado solo con ≥1 acceso creado. Sin datos (403/error) no
      // bloquea: cae a unidades > 0 y la vista muestra el aviso.
      if (totalAccesos.value == null) return (totales.value.unidades ?? 0) > 0;
      return totalAccesos.value > 0;
    }
    if (key === "areas-comunes") {
      // Completado tras el primer Guardar persistido (flag) o con espacios
      // ya creados. Sin datos (403/error) queda pendiente con aviso en vista.
      const cid = auth.condominioActualId;
      if (pasosGuardados.value.has(claveGuardado(cid, key))) return true;
      if (totalEspacios.value == null) return false;
      return totalEspacios.value > 0;
    }
    // Pasos restantes (cargos, personal) aún no tienen lógica real.
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
    totalAccesos,
    totalEspacios,
    pasosGuardados,
    pasosGuardados,
    pasos,
    primerPasoPendiente,
    configuraciónCompleta,
    progreso,
    cargar,
    sincronizarTotales,
    pasoEnEdicion,
    marcarEnEdicion,
  };
}