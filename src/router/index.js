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

  // Rutas privadas — con layout principal
  {
    path: "/",
    component: () => import("../layouts/AppLayout.vue"),
    meta: { public: false },
    children: [
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
      // ── Guardia / Admin ───────────────────────────
      {
        path: "encomiendas",
        name: "Encomiendas",
        component: () => import("../views/encomiendas/EncomiendаsView.vue"),
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
        component: () => import("../views/encomiendas/MisEncomiendаsView.vue"),
        meta: { roles: ["RESIDENTE"] },
      },
    ],
  },

  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function rutaInicial(role) {
  if (role === "ADMINISTRADOR") return { name: "Dashboard" };
  if (role === "GUARDIA") return { name: "GuardiaDashboard" };
  return { name: "Inicio" };
}

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: "Login" };
  }

  if (to.name === "Login" && auth.isAuthenticated) {
    return rutaInicial(auth.condominioActualRol || auth.user?.roles?.[0]);
  }

  if (to.path === "/" && auth.isAuthenticated) {
    return rutaInicial(auth.condominioActualRol || auth.user?.roles?.[0]);
  }

  const userRoles = auth.user?.roles || [];
  const routeRoles = to.meta.roles;
  if (
    routeRoles &&
    !routeRoles.some((r) => userRoles.includes(r)) &&
    !routeRoles.includes(auth.condominioActualRol)
  ) {
    return rutaInicial(auth.condominioActualRol || userRoles[0]);
  }
});

export default router;
