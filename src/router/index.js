import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/auth/LoginView.vue"),
    meta: { public: true },
  },
  {
    path: "/",
    name: "Dashboard",
    component: () => import("../views/dashboard/DashboardView.vue"),
    meta: { public: false },
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard global — se ejecuta antes de cada navegación
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
