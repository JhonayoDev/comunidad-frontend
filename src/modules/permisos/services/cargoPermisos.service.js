import api from "@/services/api";

// ─── Real (BFF V2.1 → informe a46ada6) ─────────────────────────────────────
// Backend implementado: AdminCargoPermisoController.java:41 (GET /admin/permisos/catalogo,
// GET /admin/cargos/{cargo}/permisos, PUT /admin/cargos/{cargo}/permisos con
// ROL_GESTIONAR, reemplazo total, 400 fields, cargoPermisoEditado). Informe:
// docs/informes/INFORME_FRONTEND_P4_PERMISOS_CARGO.md §3-4. El mock quedó en git
// history (feb8d94) por si hace falta.

export const cargoPermisosService = {
  getCatalogo() {
    return api.get("/admin/permisos/catalogo");
  },

  getCargoPermisos(cargo) {
    return api.get(`/admin/cargos/${cargo}/permisos`);
  },

  putCargoPermisos(cargo, codigosPermiso) {
    return api.put(`/admin/cargos/${cargo}/permisos`, { codigosPermiso });
  },
};

export const esMock = false;
