import api from "@/services/api";
import { PERMISOS } from "@/modules/permisos/data/catalogo";

// ─── BFF mock → real ─────────────────────────────────────────────────────────
// Mock inicial: lee seeds de cargo_permisos (V12/V20/V39/V62/V72) y persiste en
// localStorage `bff:cargo-permisos` para iterar la UX sin backend. Cuando el
// backend exponga GET /admin/permisos/catalogo y GET/PUT /admin/cargos/{cargo}/permisos,
// cambiar los 3 métodos a api.get/put y borrar el mock.

const LS_KEY = "bff:cargo-permisos";

// Seeds aproximados de las migraciones (subset relevante para iterar)
const SEEDS = {
  ADMINISTRADOR: ["ROL_GESTIONAR", "UNIDAD_VER", "UNIDAD_CREAR", "UNIDAD_EDITAR", "UNIDAD_ELIMINAR", "DASHBOARD_ADMIN", "DASHBOARD_GUARDIA", "NOTIFICACION_VER"],
  PRESIDENTE: ["UNIDAD_VER", "FINANZA_VER", "FINANZA_GESTIONAR", "DASHBOARD_ADMIN", "BITACORA_VER"],
  TESORERO: ["FINANZA_VER", "FINANZA_GESTIONAR", "DASHBOARD_FINANZAS", "GASTO_VER"],
  SECRETARIO: ["UNIDAD_VER", "PERSONA_VER", "BITACORA_VER"],
  DELEGADO: ["CASO_VER", "RESERVA_VER"],
  CONSERJE: ["ACCESO_VER", "BITACORA_VER", "BITACORA_REGISTRAR"],
  GUARDIA: ["ACCESO_VER", "ACCESO_REGISTRAR_INGRESO", "ACCESO_REGISTRAR_SALIDA", "ENCOMIENDA_VER", "ENCOMIENDA_CREAR", "DASHBOARD_GUARDIA", "BITACORA_VER", "BITACORA_REGISTRAR"],
  MANTENCION: ["MANTENCION_VER"],
  JARDINERO: [],
};

function leerMock() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { ...SEEDS };
}

function guardarMock(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export const cargoPermisosService = {
  async getCatalogo() {
    // Real futuro: return api.get("/admin/permisos/catalogo");
    return { data: PERMISOS };
  },

  async getCargoPermisos(cargo) {
    // Real futuro: return api.get(`/admin/cargos/${cargo}/permisos`);
    const all = leerMock();
    const codigos = all[cargo] || [];
    return { data: { cargo, codigosPermiso: codigos } };
  },

  async putCargoPermisos(cargo, codigosPermiso) {
    // Real futuro: return api.put(`/admin/cargos/${cargo}/permisos`, { codigosPermiso });
    const invalidos = codigosPermiso.filter((c) => !PERMISOS.some((p) => p.codigo === c));
    if (invalidos.length) {
      const err = new Error(`Códigos no existen: ${invalidos.join(", ")}`);
      err.response = { status: 400, data: { message: err.message, fields: invalidos.map((f) => ({ field: "codigosPermiso", message: `Código no existe: ${f}` })) } };
      throw err;
    }
    const all = leerMock();
    all[cargo] = [...codigosPermiso];
    guardarMock(all);
    console.info(`[BFF mock] cargoPermisoEditado cargo=${cargo} codigos=${codigosPermiso.length}`);
    return { data: { cargo, codigosPermiso } };
  },
};

// Helper para saber si estamos en mock (sin backend)
export const esMock = true;
