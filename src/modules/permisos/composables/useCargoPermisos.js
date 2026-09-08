import { ref, computed } from "vue";
import { cargoPermisosService } from "@/modules/permisos/services/cargoPermisos.service";
import { PERMISOS, MODULOS } from "@/modules/permisos/data/catalogo";

export const CARGOS = [
  "ADMINISTRADOR",
  "PRESIDENTE",
  "TESORERO",
  "SECRETARIO",
  "DELEGADO",
  "CONSERJE",
  "GUARDIA",
  "MANTENCION",
  "JARDINERO",
];

export function useCargoPermisos() {
  const cargo = ref("ADMINISTRADOR");
  const codigos = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const guardando = ref(false);
  const busqueda = ref("");

  const catalogoFiltrado = computed(() => {
    const q = (busqueda.value || "").toLowerCase().trim();
    if (!q) return PERMISOS;
    return PERMISOS.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q),
    );
  });

  const porModulo = computed(() => {
    const grupos = {};
    for (const p of catalogoFiltrado.value) {
      if (!grupos[p.modulo]) grupos[p.modulo] = [];
      grupos[p.modulo].push({ ...p, activo: codigos.value.includes(p.codigo) });
    }
    return MODULOS.map((m) => ({
      ...m,
      permisos: grupos[m.codigo] || [],
    })).filter((g) => g.permisos.length);
  });

  const totalActivos = computed(() => codigos.value.length);

  function toggle(codigo) {
    const idx = codigos.value.indexOf(codigo);
    if (idx === -1) codigos.value.push(codigo);
    else codigos.value.splice(idx, 1);
  }

  async function cargar() {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await cargoPermisosService.getCargoPermisos(cargo.value);
      codigos.value = Array.isArray(data.codigosPermiso) ? [...data.codigosPermiso] : [];
    } catch (e) {
      console.error("Error al cargar cargo permisos", e);
      error.value = e?.response?.data?.message || "No se pudieron cargar los permisos del cargo.";
    } finally {
      loading.value = false;
    }
  }

  async function guardar() {
    guardando.value = true;
    error.value = null;
    try {
      await cargoPermisosService.putCargoPermisos(cargo.value, [...codigos.value]);
      return true;
    } catch (e) {
      console.error("Error al guardar cargo permisos", e);
      error.value = e?.response?.data?.message || "No se pudo guardar.";
      if (e?.response?.data?.fields) {
        error.value += " — " + e.response.data.fields.map((f) => f.message).join(", ");
      }
      return false;
    } finally {
      guardando.value = false;
    }
  }

  return {
    cargo,
    codigos,
    loading,
    error,
    guardando,
    busqueda,
    porModulo,
    totalActivos,
    toggle,
    cargar,
    guardar,
    CARGOS,
  };
}
