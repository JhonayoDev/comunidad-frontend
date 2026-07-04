import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const routes = [
  // Rutas públicas — sin layout
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/auth/LoginView.vue"),
    meta: { public: true },
  },
  {
    path: "/recuperar-password",
    name: "ForgotPassword",
    component: () => import("../views/auth/ForgotPasswordView.vue"),
    meta: { public: true },
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: () => import("../views/auth/ResetPasswordView.vue"),
    meta: { public: true },
  },
  {
    path: "/setup-password",
    name: "SetupPassword",
    component: () => import("../views/auth/SetupPasswordView.vue"),
    meta: { public: true },
  },

  // Rutas privadas — con layout principal
  {
    path: "/",
    component: () => import("../layouts/AppLayout.vue"),
    meta: { public: false },
    children: [
      {
        path: "superadmin",
        name: "SuperAdminDashboard",
        component: () =>
          import("../views/superadmin/SuperAdminDashboardView.vue"),
        meta: { roles: ["SUPER_ADMIN"] },
      },
      // ── Compartidas ──────────────────────────────
      {
        path: "notificaciones",
        name: "Notificaciones",
        component: () =>
          import("../views/notificaciones/NotificacionesView.vue"),
      },
      // {
      //   path: "menu",
      //   name: "Menu",
      //   component: () => import("../views/menu/MenuView.vue"),
      // },
      {
        path: "perfil",
        name: "Perfil",
        component: () => import("../views/residente/PerfilView.vue"),
        meta: {
          roles: ["RESIDENTE", "ADMINISTRADOR", "GUARDIA"],
        },
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
        meta: { roles: ["ADMINISTRADOR"] },
      },
      {
        path: "vehiculos",
        name: "Vehiculos",
        component: () => import("../views/admin/VehiculosView.vue"),
        meta: { roles: ["ADMINISTRADOR"] },
      },
      {
        path: "solicitudes-admin",
        name: "SolicitudesAdmin",
        component: () => import("../views/admin/SolicitudesAdminView.vue"),
        meta: { roles: ["ADMINISTRADOR"] },
      },
      {
        path: "residentes",
        name: "Residentes",
        component: () => import("../views/admin/ResidentesView.vue"),
        meta: { roles: ["ADMINISTRADOR"] },
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
        meta: { roles: ["GUARDIA", "ADMINISTRADOR"] },
      },
      {
        path: "visitas",
        name: "Visitas",
        component: () => import("../views/visitas/VisitasView.vue"),
        meta: { roles: ["GUARDIA", "ADMINISTRADOR"] },
      },
      {
        path: "visitas/nueva",
        name: "RegistrarVisita",
        component: () => import("../views/visitas/RegistrarVisitaView.vue"),
        meta: { roles: ["GUARDIA", "ADMINISTRADOR"] },
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
        meta: { roles: ["GUARDIA", "ADMINISTRADOR"] },
      },
      {
        path: "autorizaciones",
        name: "Autorizaciones",
        component: () => import("../views/guardia/AutorizacionesView.vue"),
        meta: { roles: ["GUARDIA", "ADMINISTRADOR"] },
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

  const rol = auth.condominioActualRol || rolesGlobales[0];
  if (rol === "ADMINISTRADOR") return { name: "Dashboard" };
  if (rol === "GUARDIA") return { name: "GuardiaDashboard" };
  if (rol === "RESIDENTE") return { name: "Inicio" };
  return { name: "Login" };
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
  // via cookie, donde refresh no devuelve roles), redirigir a login
  // cuando intente acceder a rutas protegidas.
  if (auth.isAuthenticated && !auth.user?.roles?.length && !to.meta.public) {
    return { name: "Login" };
  }

  const userRoles = auth.user?.roles || [];
  const routeRoles = to.meta.roles;
  if (
    routeRoles &&
    !routeRoles.some((r) => userRoles.includes(r)) &&
    !routeRoles.includes(auth.condominioActualRol)
  ) {
    return rutaInicial(auth);
  }
});

export default router;
