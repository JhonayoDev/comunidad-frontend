import { ref, computed } from "vue";
import { cargoPermisosService } from "@/modules/permisos/services/cargoPermisos.service";
import { PERMISOS as PERMISOS_LOCAL, MODULOS } from "@/modules/permisos/data/catalogo";

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
  // Catálogo vivo del backend (enriquecido con modulo local). Fallback a PERMISOS_LOCAL si 403/500.
  const catalogo = ref([...PERMISOS_LOCAL]);
  const loading = ref(false);
  const error = ref(null);
  const guardando = ref(false);
  const busqueda = ref("");

  const catalogoFiltrado = computed(() => {
    const q = (busqueda.value || "").toLowerCase().trim();
    const src = catalogo.value;
    if (!q) return src;
    return src.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion || "").toLowerCase().includes(q),
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
      // Catálogo: backend sin modulo (§2.1 → enriquecer con PERMISOS_LOCAL), fallback si 403 sin ROL_GESTIONAR
      try {
        const { data: cat } = await cargoPermisosService.getCatalogo();
        if (Array.isArray(cat) && cat.length) {
          catalogo.value = cat.map((p) => ({
            codigo: p.codigo,
            nombre: p.nombre,
            descripcion: p.descripcion,
            modulo: PERMISOS_LOCAL.find((x) => x.codigo === p.codigo)?.modulo || "OTRO",
          }));
        }
      } catch (e) {
        if (e?.response?.status !== 403) console.error("Error al cargar catálogo", e);
        // sin catálogo: se mantiene PERMISOS_LOCAL
      }
      const { data } = await cargoPermisosService.getCargoPermisos(cargo.value);
      codigos.value = Array.isArray(data.codigosPermiso) ? [...data.codigosPermiso] : [];
      // Si el backend manda permisosDetalle enriquecido, no hace falta cruzar; codigos ya alcanza
    } catch (e) {
      console.error("Error al cargar cargo permisos", e);
      if (e?.response?.status === 404) error.value = `Cargo no encontrado: ${cargo.value}`;
      else if (e?.response?.status === 403) error.value = "No tienes permiso ROL_GESTIONAR para administrar permisos por cargo.";
      else error.value = e?.response?.data?.message || "No se pudieron cargar los permisos del cargo.";
      if (e?.response?.data?.fields) {
        error.value += " — " + e.response.data.fields.map((f) => f.message).join(", ");
      }
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
      if (e?.response?.status === 404) error.value = `Cargo no encontrado: ${cargo.value}`;
      else if (e?.response?.status === 403) error.value = "No tienes permiso ROL_GESTIONAR para editar permisos por cargo.";
      else error.value = e?.response?.data?.message || "No se pudo guardar.";
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
