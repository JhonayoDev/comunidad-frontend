import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const NAV_ITEMS_BY_ROLE = {
  SUPER_ADMIN: [
    {
      label: "Condominios",
      icon: "pi pi-building",
      routeName: "SuperAdminDashboard",
    },
  ],
  ADMINISTRADOR: [
    { label: "Inicio", icon: "pi pi-home", routeName: "Dashboard" },
    { label: "Residentes", icon: "pi pi-users", routeName: "Residentes" },
    { label: "Vehículos", icon: "pi pi-car", routeName: "Vehiculos" },
  ],
  GUARDIA: [
    { label: "Inicio", icon: "pi pi-home", routeName: "GuardiaDashboard" },
    { label: "Portón", icon: "pi pi-shield", routeName: "Porton" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
    { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
    { label: "Autoriz.", icon: "pi pi-verified", routeName: "Autorizaciones" },
    { label: "Solic.", icon: "pi pi-pencil", routeName: "Solicitudes" },
  ],
};

const DEFAULT_NAV_ITEMS = [
  { label: "Inicio", icon: "pi pi-home", routeName: "Inicio" },
  { label: "Notif.", icon: "pi pi-bell", routeName: "Notificaciones" },
  { label: "Gestiones", icon: "pi pi-list", routeName: "Gestiones" },
  { label: "Perfil", icon: "pi pi-user", routeName: "Perfil" },
];

export function useNavigation() {
  const router = useRouter();
  const route = useRoute();
  const auth = useAuthStore();

  const currentRoute = computed(() => route.name);

  const navItems = computed(() => {
    const rolesGlobales = auth.user?.roles || [];
    const role = rolesGlobales.includes("SUPER_ADMIN")
      ? "SUPER_ADMIN"
      : auth.condominioActualRol || rolesGlobales[0] || "";
    return NAV_ITEMS_BY_ROLE[role] || DEFAULT_NAV_ITEMS;
  });

  function goTo(routeName) {
    router.push({ name: routeName });
  }

  return { navItems, currentRoute, goTo };
}
