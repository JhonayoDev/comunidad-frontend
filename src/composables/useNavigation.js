import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const NAV_ITEMS_BY_ROLE = {
  SUPER_ADMIN: [
    { label: "Condominios", icon: "pi pi-building", routeName: "SuperAdminDashboard" },
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

const RESIDENTE_ITEMS = [
  { label: "Inicio", icon: "pi pi-home", routeName: "Inicio" },
  { label: "Mi unidad", icon: "pi pi-home", routeName: "MiUnidad" },
  { label: "Deudas", icon: "pi pi-credit-card", routeName: "MisDeudas" },
  { label: "Autoriz.", icon: "pi pi-verified", routeName: "MisAutorizaciones" },
  { label: "Casos", icon: "pi pi-file", routeName: "MisCasos" },
  { label: "Encomiendas", icon: "pi pi-box", routeName: "MisEncomiendas" },
  { label: "Notif.", icon: "pi pi-bell", routeName: "Notificaciones" },
  { label: "Perfil", icon: "pi pi-user", routeName: "Perfil" },
];

const CARGO_NAV_ITEMS = {
  PRESIDENTE: [
    { label: "Dashboard", icon: "pi pi-th-large", routeName: "Dashboard" },
    { label: "Residentes", icon: "pi pi-users", routeName: "Residentes" },
    { label: "Vehículos", icon: "pi pi-car", routeName: "Vehiculos" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
    { label: "Autoriz.", icon: "pi pi-verified", routeName: "Autorizaciones" },
    { label: "Visitas", icon: "pi pi-eye", routeName: "Visitas" },
    { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
    { label: "Notif.", icon: "pi pi-bell", routeName: "Notificaciones" },
  ],
  TESORERO: [
    { label: "Dashboard", icon: "pi pi-th-large", routeName: "Dashboard" },
    { label: "Notif.", icon: "pi pi-bell", routeName: "Notificaciones" },
  ],
  SECRETARIO: [
    { label: "Dashboard", icon: "pi pi-th-large", routeName: "Dashboard" },
    { label: "Residentes", icon: "pi pi-users", routeName: "Residentes" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
    { label: "Autoriz.", icon: "pi pi-verified", routeName: "Autorizaciones" },
    { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
    { label: "Notif.", icon: "pi pi-bell", routeName: "Notificaciones" },
  ],
  DELEGADO: [
    { label: "Dashboard", icon: "pi pi-th-large", routeName: "Dashboard" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
    { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
    { label: "Notif.", icon: "pi pi-bell", routeName: "Notificaciones" },
  ],
};

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

    if (role === "RESIDENTE") {
      if (auth.activeContext === "residente") {
        return RESIDENTE_ITEMS;
      }
      const cargoKey = auth.activeContext?.toUpperCase();
      return CARGO_NAV_ITEMS[cargoKey] || RESIDENTE_ITEMS;
    }

    return NAV_ITEMS_BY_ROLE[role] || RESIDENTE_ITEMS;
  });

  const groupedNavItems = computed(() => {
    const rolesGlobales = auth.user?.roles || [];
    const role = rolesGlobales.includes("SUPER_ADMIN")
      ? "SUPER_ADMIN"
      : auth.condominioActualRol || rolesGlobales[0] || "";

    if (role === "RESIDENTE") {
      const groups = [{ label: "Residente", items: RESIDENTE_ITEMS }];
      const cargo = auth.condominioActualCargo;
      if (cargo && CARGO_NAV_ITEMS[cargo]) {
        const label = cargo.charAt(0) + cargo.slice(1).toLowerCase();
        groups.push({ label, items: CARGO_NAV_ITEMS[cargo] });
      }
      return groups;
    }

    const items = NAV_ITEMS_BY_ROLE[role] || RESIDENTE_ITEMS;
    return [{ label: "", items }];
  });

  function goTo(routeName) {
    router.push({ name: routeName });
  }

  function switchContext(ctx) {
    auth.setActiveContext(ctx.key);
    router.push({ name: auth.contextDashboard });
  }

  return { navItems, groupedNavItems, currentRoute, goTo, switchContext };
}
