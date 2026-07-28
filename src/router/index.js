import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import AuthLayout from "../layouts/AuthLayout.vue";

const routes = [
  // Rutas públicas — con AuthLayout como layout compartido
  {
    path: "",
    component: AuthLayout,
    meta: { public: true },
    children: [
      { path: "",                    redirect: "/login" },
      { path: "/login",              name: "Login",          component: () => import("../views/auth/LoginView.vue") },
      { path: "/recuperar-password", name: "ForgotPassword",  component: () => import("../views/auth/ForgotPasswordView.vue") },
      { path: "/reset-password",     name: "ResetPassword",   component: () => import("../views/auth/ResetPasswordView.vue") },
      { path: "/setup-password",     name: "SetupPassword",    component: () => import("../views/auth/SetupPasswordView.vue") },
    ],
  },

  // Rutas privadas — con layout principal
  {
    path: "/",
    component: () => import("../layouts/MainLayout.vue"),
    meta: { public: false },
    children: [
      {
        path: "superadmin",
        name: "SuperAdminDashboard",
        component: () =>
          import("../views/superadmin/SuperAdminDashboardView.vue"),
        meta: { roles: ["SUPER_ADMIN"] },
      },
      {
        path: "superadmin/planes",
        name: "SaasPlanes",
        component: () => import("../views/superadmin/SaasPlanesView.vue"),
        meta: { roles: ["SUPER_ADMIN"] },
      },
      {
        path: "superadmin/auditoria",
        name: "SaasAuditoria",
        component: () => import("../views/superadmin/SaasAuditoriaView.vue"),
        meta: { roles: ["SUPER_ADMIN", "SOPORTE"] },
      },
      {
        path: "superadmin/condominios/:id",
        name: "SaasCondominioDetail",
        component: () => import("../views/superadmin/SaasCondominioDetailView.vue"),
        meta: { roles: ["SUPER_ADMIN"] },
      },
      {
        path: "superadmin/condominios/:id/usuarios",
        name: "SaasUsuarios",
        component: () => import("../views/superadmin/SaasUsuariosView.vue"),
        meta: { roles: ["SUPER_ADMIN"] },
      },
      {
        path: "superadmin/condominios/:id/suscripcion",
        name: "SaasSuscripcion",
        component: () => import("../views/superadmin/SaasSuscripcionView.vue"),
        meta: { roles: ["SUPER_ADMIN"] },
      },
      {
        path: "superadmin/condominios/:id/onboarding",
        name: "SaasOnboarding",
        component: () => import("../views/superadmin/SaasOnboardingView.vue"),
        meta: { roles: ["SUPER_ADMIN"] },
      },
      {
        path: "superadmin/condominios/:id/modulos",
        name: "SaasModulos",
        component: () => import("../views/superadmin/SaasModulosView.vue"),
        meta: { roles: ["SUPER_ADMIN"] },
      },
      // ── Permisos (SUPER_ADMIN) ────────────────────
      {
        path: "superadmin/permisos",
        name: "PermisosMatrix",
        component: () => import("../views/admin/permisos/PermisosMatrixView.vue"),
        meta: { roles: ["SUPER_ADMIN"] },
      },
      {
        path: "superadmin/permisos/cargos",
        name: "CargosPermisos",
        component: () => import("../views/admin/permisos/CargosPermisosView.vue"),
        meta: { roles: ["SUPER_ADMIN"] },
      },
      // ── Compartidas ──────────────────────────────
      {
        path: "notificaciones",
        name: "Notificaciones",
        component: () =>
          import("../views/notificaciones/NotificacionesView.vue"),
      },
      {
        path: "menu",
        name: "Menu",
        component: () => import("../views/menu/MenuView.vue"),
      },
      {
        path: "perfil",
        name: "Perfil",
        component: () => import("../views/residente/PerfilView.vue"),
        meta: {
          roles: ["RESIDENTE", "ADMINISTRADOR", "GUARDIA"],
        },
      },
      {
        path: "permisos",
        name: "MisPermisos",
        component: () => import("../views/admin/permisos/MisPermisosView.vue"),
      },
      // ── Guardia / Admin ───────────────────────────
      {
        path: "encomiendas",
        name: "Encomiendas",
        component: () => import("../views/encomiendas/EncomiendasView.vue"),
        meta: { roles: ["GUARDIA", "ADMINISTRADOR"] },
      },

      // ── Admin ─────────────────────────────────────
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("../views/dashboard/AdminDashboardView.vue"),
        meta: {
          roles: ["ADMINISTRADOR"],
          cargos: ["PRESIDENTE", "SECRETARIO", "DELEGADO"],
        },
      },
      {
        path: "vehiculos",
        name: "Vehiculos",
        component: () => import("../views/admin/VehiculosView.vue"),
        meta: { roles: ["ADMINISTRADOR"], cargos: ["PRESIDENTE"] },
      },
      {
        path: "solicitudes-admin",
        name: "SolicitudesAdmin",
        component: () => import("../views/admin/SolicitudesAdminView.vue"),
        meta: {
          roles: ["ADMINISTRADOR"],
          cargos: ["PRESIDENTE", "SECRETARIO"],
        },
      },
      {
        path: "residentes",
        name: "Residentes",
        component: () => import("../views/admin/ResidentesView.vue"),
        meta: {
          roles: ["ADMINISTRADOR"],
          cargos: ["PRESIDENTE", "SECRETARIO"],
        },
      },
      {
        path: "unidades",
        name: "Unidades",
        component: () => import("../views/admin/UnidadesView.vue"),
        meta: {
          roles: ["ADMINISTRADOR"],
          cargos: ["PRESIDENTE", "SECRETARIO"],
        },
      },
      // ── Finanzas (cargos) ─────────────────────────
      {
        path: "finanzas",
        name: "FinanzasDashboard",
        component: () => import("../views/finanzas/FinanzasDashboardView.vue"),
        meta: { cargos: ["PRESIDENTE", "TESORERO"] },
      },
      {
        path: "finanzas/gastos",
        name: "Gastos",
        component: () => import("../views/finanzas/GastosView.vue"),
        meta: { cargos: ["PRESIDENTE", "TESORERO"] },
      },
      {
        path: "finanzas/cuentas",
        name: "Cuentas",
        component: () => import("../views/finanzas/CuentasView.vue"),
        meta: { cargos: ["PRESIDENTE"] },
      },
      {
        path: "gastos-comunes",
        name: "GastosComunes",
        component: () => import("../views/finanzas/GastosComunesView.vue"),
        meta: { cargos: ["PRESIDENTE", "TESORERO"] },
      },
      {
        path: "finanzas/cargos",
        name: "CargosAdicionales",
        component: () => import("../views/finanzas/CargosAdicionalesView.vue"),
        meta: { cargos: ["PRESIDENTE", "TESORERO", "SECRETARIO"] },
      },
      {
        path: "finanzas/ledger",
        name: "Ledger",
        component: () => import("../views/finanzas/LedgerView.vue"),
        meta: { cargos: ["PRESIDENTE", "TESORERO"] },
      },
      {
        path: "finanzas/pagos",
        name: "Pagos",
        component: () => import("../views/finanzas/PagosView.vue"),
        meta: { cargos: ["PRESIDENTE", "TESORERO"] },
      },
      {
        path: "finanzas/plantillas",
        name: "PlantillasGasto",
        component: () => import("../views/finanzas/PlantillasGastoView.vue"),
        meta: { cargos: ["PRESIDENTE", "TESORERO"] },
      },
      {
        path: "finanzas/categorias",
        name: "Categorias",
        component: () => import("../views/finanzas/CategoriasView.vue"),
        meta: { cargos: ["PRESIDENTE", "TESORERO"] },
      },
      // ── Gestión (cargos) ──────────────────────────
      {
        path: "miembros",
        name: "Miembros",
        component: () => import("../views/gestion/MiembrosView.vue"),
        meta: { cargos: ["PRESIDENTE", "SECRETARIO"] },
      },
      {
        path: "anuncios",
        name: "Anuncios",
        component: () => import("../views/gestion/AnunciosView.vue"),
        meta: {
          roles: ["ADMINISTRADOR"],
          cargos: ["PRESIDENTE", "SECRETARIO"],
        },
      },
      {
        path: "notificaciones/plantillas",
        name: "PlantillasNotificacion",
        component: () =>
          import("../views/admin/PlantillasNotificacionView.vue"),
        meta: { roles: ["ADMINISTRADOR"] },
      },
      {
        path: "casos-admin",
        name: "CasosAdmin",
        component: () => import("../views/gestion/CasosAdminView.vue"),
        meta: { cargos: ["PRESIDENTE", "SECRETARIO"] },
      },
      // ── Personal ────────────────────────────────────
      {
        path: "personal",
        name: "Personal",
        component: () => import("../views/admin/PersonalView.vue"),
        meta: { roles: ["ADMINISTRADOR"], cargos: ["PRESIDENTE", "SECRETARIO"] },
      },
      // ── Reglas de Notificación ──────────────────────
      {
        path: "notificaciones/reglas",
        name: "ReglasNotificacion",
        component: () => import("../views/gestion/ReglasNotificacionView.vue"),
        meta: { roles: ["ADMINISTRADOR", "SUPER_ADMIN"] },
      },
      // ── Almacenamiento (Admin Config) ──────────────
      {
        path: "configuracion-almacenamiento",
        name: "ConfiguracionAlmacenamiento",
        component: () => import("../views/admin/ConfiguracionAlmacenamientoView.vue"),
        meta: { roles: ["ADMINISTRADOR", "SUPER_ADMIN"], permiso: "ALMACENAMIENTO_CONFIGURAR" },
      },
      // ── Archivos ───────────────────────────────────
      {
        path: "archivos",
        name: "Archivos",
        component: () => import("../views/storage/ArchivosView.vue"),
        meta: {
          roles: ["ADMINISTRADOR"],
          cargos: ["PRESIDENTE", "SECRETARIO", "TESORERO"],
        },
      },
      // ── Guardia ───────────────────────────────────
      {
        path: "guardia",
        name: "GuardiaDashboard",
        component: () => import("../views/dashboard/GuardiaDashboardView.vue"),
        meta: { roles: ["GUARDIA"] },
      },
      {
        path: "porton",
        name: "Porton",
        component: () => import("../views/visitas/PortonView.vue"),
        meta: { roles: ["GUARDIA", "ADMINISTRADOR"], cargos: ["PRESIDENTE"] },
      },
      {
        path: "visitas",
        name: "Visitas",
        component: () => import("../views/visitas/VisitasView.vue"),
        meta: { roles: ["GUARDIA", "ADMINISTRADOR"], cargos: ["PRESIDENTE"] },
      },
      {
        path: "visitas/busqueda",
        name: "BusquedaDetalle",
        component: () => import("../views/visitas/BusquedaDetalleView.vue"),
        meta: { roles: ["GUARDIA", "ADMINISTRADOR"], cargos: ["PRESIDENTE"] },
      },
      {
        path: "visitas/nueva",
        name: "RegistrarVisita",
        component: () => import("../views/visitas/RegistrarVisitaView.vue"),
        meta: { roles: ["GUARDIA", "ADMINISTRADOR"], cargos: ["PRESIDENTE"] },
      },
      {
        path: "solicitudes",
        name: "Solicitudes",
        component: () => import("../views/guardia/SolicitudesView.vue"),
        meta: { roles: ["GUARDIA"] },
      },
      {
        path: "bitacora",
        name: "Bitacora",
        component: () => import("../views/guardia/BitacoraView.vue"),
        meta: {
          roles: ["GUARDIA", "ADMINISTRADOR"],
          cargos: ["PRESIDENTE", "SECRETARIO", "DELEGADO"],
        },
      },
      {
        path: "bitacora/checklist",
        name: "ChecklistTemplates",
        component: () => import("../views/guardia/ChecklistTemplatesView.vue"),
        meta: {
          roles: ["GUARDIA", "ADMINISTRADOR"],
          cargos: ["PRESIDENTE", "SECRETARIO"],
        },
      },
      {
        path: "autorizaciones",
        name: "Autorizaciones",
        component: () => import("../views/guardia/AutorizacionesView.vue"),
        meta: {
          roles: ["GUARDIA", "ADMINISTRADOR"],
          cargos: ["PRESIDENTE", "SECRETARIO"],
        },
      },
      // ── Residente ─────────────────────────────────
      {
        path: "inicio",
        name: "Inicio",
        component: () => import("../views/residente/InicioView.vue"),
        meta: { roles: ["RESIDENTE"] },
      },
      {
        path: "mi-unidad",
        name: "MiUnidad",
        component: () => import("../views/dashboard/DashboardView.vue"),
        meta: { roles: ["RESIDENTE"] },
      },
      {
        path: "gestiones",
        name: "Gestiones",
        component: () => import("../views/residente/GestionesView.vue"),
        meta: { roles: ["RESIDENTE"] },
      },
      {
        path: "mis-encomiendas",
        name: "MisEncomiendas",
        component: () => import("../views/encomiendas/MisEncomiendasView.vue"),
        meta: { roles: ["RESIDENTE"] },
      },
      {
        path: "mis-autorizaciones",
        name: "MisAutorizaciones",
        component: () => import("../views/residente/MisAutorizacionesView.vue"),
        meta: { roles: ["RESIDENTE"] },
      },
      {
        path: "mis-deudas",
        name: "MisDeudas",
        component: () => import("../views/residente/MisDeudasView.vue"),
        meta: { roles: ["RESIDENTE"] },
      },
      {
        path: "mis-casos",
        name: "MisCasos",
        component: () => import("../views/residente/CasosView.vue"),
        meta: { roles: ["RESIDENTE"] },
      },
      {
        path: "configuracion",
        name: "Configuracion",
        component: () => import("../views/residente/ConfiguracionView.vue"),
        meta: { roles: ["RESIDENTE", "ADMINISTRADOR", "GUARDIA"] },
      },
    ],
  },

  { path: "/:pathMatch(.*)*", redirect: "/" },
];

let sessionRestoreAttempted = false;

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function rutaInicial(auth) {
  const rolesGlobales = auth.user?.roles || [];

  if (rolesGlobales.includes("SUPER_ADMIN")) {
    return { name: "SuperAdminDashboard" };
  }
  if (rolesGlobales.includes("SOPORTE")) {
    return { name: "SaasAuditoria" };
  }

  const rol = auth.condominioActualRol || rolesGlobales[0];
  if (rol === "ADMINISTRADOR") return { name: "Dashboard" };
  if (rol === "GUARDIA") return { name: "GuardiaDashboard" };
  if (rol === "RESIDENTE") return { name: auth.contextDashboard };
  // Fallback seguro: Menu es accesible por todos los autenticados
  return { name: "Menu" };
}

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Intenta restaurar la sesión UNA sola vez al inicio
  // usando la cookie httpOnly del browser
  if (!sessionRestoreAttempted) {
    sessionRestoreAttempted = true;

    if (!auth.isAuthenticated) {
      try {
        await auth.tryRestoreSession();
      } catch (error) {
        console.warn("No fue posible restaurar la sesión", error);
      }
    }
  }

  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: "Login" };
  }

  if (to.name === "Login" && auth.isAuthenticated) {
    return rutaInicial(auth);
  }

  if (to.path === "/" && auth.isAuthenticated) {
    return rutaInicial(auth);
  }

  // Si está autenticado pero sin datos de usuario (ej: sesión restaurada
  // via cookie), mostrar menú como fallback seguro
  if (auth.isAuthenticated && !auth.user?.roles?.length && !to.meta.public) {
    return { name: "Menu" };
  }

  const userRoles = auth.user?.roles || [];
  const routeRoles = to.meta.roles;
  const routeCargos = to.meta.cargos;
  const routePermiso = to.meta.permiso;
  const routePermisos = to.meta.permisos;

  const necesitaRol = routeRoles?.length > 0;
  const necesitaCargo = routeCargos?.length > 0;
  const necesitaPermiso = !!(routePermiso || routePermisos?.length);

  if (!necesitaRol && !necesitaCargo && !necesitaPermiso) return;

  if (necesitaPermiso) {
    const userPermisos = auth.permisos || [];
    const hasPermiso = routePermiso
      ? userPermisos.includes(routePermiso)
      : routePermisos.some((p) => userPermisos.includes(p));
    if (!hasPermiso) return rutaInicial(auth);
    if (!necesitaRol && !necesitaCargo) return;
  }

  const cumpleRol =
    necesitaRol &&
    (routeRoles.some((r) => userRoles.includes(r)) ||
      routeRoles.includes(auth.condominioActualRol));

  const cumpleCargo =
    necesitaCargo && routeCargos.includes(auth.condominioActualCargo);

  if (cumpleCargo) return;
  if (cumpleRol) return;

  return rutaInicial(auth);
});

export default router;
