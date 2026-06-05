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

      // ── Admin ─────────────────────────────────────
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("../views/dashboard/AdminDashboardView.vue"),
        meta: { roles: ["ADMIN"] },
      },
      {
        path: "residentes",
        name: "Residentes",
        component: () => import("../views/dashboard/DashboardView.vue"),
        meta: { roles: ["ADMIN"] },
      },
      {
        path: "vehiculos",
        name: "Vehiculos",
        component: () => import("../views/dashboard/DashboardView.vue"),
        meta: { roles: ["ADMIN"] },
      },

      // ── Guardia ───────────────────────────────────
      {
        path: "porton",
        name: "Porton",
        component: () => import("../views/visitas/PortonView.vue"),
        meta: { roles: ["GUARDIA", "ADMIN"] },
      },
      {
        path: "visitas",
        name: "Visitas",
        component: () => import("../views/visitas/VisitasView.vue"),
        meta: { roles: ["GUARDIA", "ADMIN"] },
      },
      {
        path: "visitas/nueva",
        name: "RegistrarVisita",
        component: () => import("../views/visitas/RegistrarVisitaView.vue"),
        meta: { roles: ["GUARDIA", "ADMIN"] },
      },
      {
        path: "solicitudes",
        name: "Solicitudes",
        component: () => import("../views/guardia/SolicitudesView.vue"),
        meta: { roles: ["GUARDIA", "ADMIN"] },
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
        path: "perfil",
        name: "Perfil",
        component: () => import("../views/residente/PerfilView.vue"),
        meta: { roles: ["RESIDENTE", "ADMIN", "GUARDIA"] },
      },
      {
        path: "gestiones",
        name: "Gestiones",
        component: () => import("../views/residente/GestionesView.vue"),
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

// Ruta inicial según rol
function rutaInicial(role) {
  if (role === "ADMIN") return { name: "Dashboard" };
  if (role === "GUARDIA") return { name: "Porton" };
  return { name: "Inicio" };
}

router.beforeEach((to) => {
  const auth = useAuthStore();

  // Si no está autenticado y la ruta es privada → login
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: "Login" };
  }

  // Si ya está autenticado y va al login → ruta inicial según rol
  if (to.name === "Login" && auth.isAuthenticated) {
    return rutaInicial(auth.userRole);
  }

  // Si va a la raíz → ruta inicial según rol
  if (to.path === "/" && auth.isAuthenticated) {
    return rutaInicial(auth.userRole);
  }

  // Si la ruta tiene roles definidos y el usuario no tiene permiso → ruta inicial
  if (to.meta.roles && !to.meta.roles.includes(auth.userRole)) {
    return rutaInicial(auth.userRole);
  }
});

export default router;
