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
      {
        path: "",
        name: "Dashboard",
        component: () => import("../views/dashboard/DashboardView.vue"),
      },
      {
        path: "notificaciones",
        name: "Notificaciones",
        component: () => import("../views/dashboard/DashboardView.vue"),
      },
      {
        path: "residentes",
        name: "Residentes",
        component: () => import("../views/dashboard/DashboardView.vue"),
      },
      {
        path: "vehiculos",
        name: "Vehiculos",
        component: () => import("../views/dashboard/DashboardView.vue"),
      },
      {
        path: "porton",
        name: "Porton",
        component: () => import("../views/dashboard/DashboardView.vue"),
      },
      {
        path: "visitas",
        name: "Visitas",
        component: () => import("../views/dashboard/DashboardView.vue"),
      },
      {
        path: "solicitudes",
        name: "Solicitudes",
        component: () => import("../views/dashboard/DashboardView.vue"),
      },
      {
        path: "mi-unidad",
        name: "MiUnidad",
        component: () => import("../views/dashboard/DashboardView.vue"),
      },
      {
        path: "menu",
        name: "Menu",
        component: () => import("../views/menu/MenuView.vue"),
      },
    ],
  },

  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: "Login" };
  }

  if (to.name === "Login" && auth.isAuthenticated) {
    return { name: "Dashboard" };
  }
});

export default router;
