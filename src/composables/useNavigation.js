import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const NAV_ITEMS_BY_ROLE = {
  ADMINISTRADOR: [
    { label: "Inicio", icon: "pi pi-home", routeName: "Dashboard" },
    { label: "Residentes", icon: "pi pi-users", routeName: "Residentes" },
    { label: "Vehículos", icon: "pi pi-car", routeName: "Vehiculos" },
    { label: "Menú", icon: "pi pi-bars", routeName: "Menu" },
  ],
  GUARDIA: [
    { label: "Inicio", icon: "pi pi-home", routeName: "GuardiaDashboard" },
    { label: "Portón", icon: "pi pi-shield", routeName: "Porton" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
    { label: "Menú", icon: "pi pi-bars", routeName: "Menu" },
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
    const role = auth.condominioActualRol || auth.user?.roles?.[0] || "";
    return NAV_ITEMS_BY_ROLE[role] || DEFAULT_NAV_ITEMS;
  });

  function goTo(routeName) {
    router.push({ name: routeName });
  }

  return { navItems, currentRoute, goTo };
}
