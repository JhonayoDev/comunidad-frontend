import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const NAV_ITEMS_BY_ROLE = {
  SUPER_ADMIN: [
    { label: "Dashboard", icon: "pi pi-home", routeName: "SuperAdminDashboard" },
    { label: "Condominios", icon: "pi pi-building", routeName: "SuperAdminDashboard" },
    { label: "Planes", icon: "pi pi-tags", routeName: "SaasPlanes" },
    { label: "Auditoría", icon: "pi pi-history", routeName: "SaasAuditoria" },
    { label: "Permisos", icon: "pi pi-lock", routeName: "PermisosMatrix" },
    { label: "Cargos Perm.", icon: "pi pi-users", routeName: "CargosPermisos" },
    { label: "Reglas Notif.", icon: "pi pi-sliders-h", routeName: "ReglasNotificacion" },
    { label: "Almacenamiento", icon: "pi pi-cloud-upload", routeName: "ConfiguracionAlmacenamiento" },
    { label: "Notif.", icon: "pi pi-bell", routeName: "Notificaciones" },
    { label: "Perfil", icon: "pi pi-user", routeName: "Perfil" },
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
  SOPORTE: [
    { label: "Auditoría", icon: "pi pi-history", routeName: "SaasAuditoria" },
    { label: "Notif.", icon: "pi pi-bell", routeName: "Notificaciones" },
    { label: "Perfil", icon: "pi pi-user", routeName: "Perfil" },
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
  ADMINISTRADOR: [
    { label: "Inicio", icon: "pi pi-home", routeName: "Dashboard" },
    { label: "Residentes", icon: "pi pi-users", routeName: "Residentes" },
    { label: "Vehículos", icon: "pi pi-car", routeName: "Vehiculos" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
    { label: "Archivos", icon: "pi pi-folder", routeName: "Archivos" },
    { label: "Visitas", icon: "pi pi-eye", routeName: "Visitas" },
    { label: "Portón", icon: "pi pi-shield", routeName: "Porton" },
    { label: "Autoriz.", icon: "pi pi-verified", routeName: "Autorizaciones" },
    { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
    { label: "Checklist", icon: "pi pi-check-square", routeName: "ChecklistTemplates" },
    { label: "Personal", icon: "pi pi-users", routeName: "Personal" },
    { label: "Almacenamiento", icon: "pi pi-cloud-upload", routeName: "ConfiguracionAlmacenamiento" },
    { label: "Reglas Notif.", icon: "pi pi-sliders-h", routeName: "ReglasNotificacion" },
    { label: "Plantillas Notif.", icon: "pi pi-envelope", routeName: "PlantillasNotificacion" },
    { label: "Anuncios", icon: "pi pi-megaphone", routeName: "Anuncios" },
    { label: "Notif.", icon: "pi pi-bell", routeName: "Notificaciones" },
    { label: "Perfil", icon: "pi pi-user", routeName: "Perfil" },
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
  GUARDIA: [
    { label: "Inicio", icon: "pi pi-home", routeName: "GuardiaDashboard" },
    { label: "Portón", icon: "pi pi-shield", routeName: "Porton" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
    { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
    { label: "Autoriz.", icon: "pi pi-verified", routeName: "Autorizaciones" },
    { label: "Solic.", icon: "pi pi-pencil", routeName: "Solicitudes" },
    { label: "Checklist", icon: "pi pi-check-square", routeName: "ChecklistTemplates" },
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
  { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
];

const CARGO_NAV_ITEMS = {
  PRESIDENTE: [
    { label: "Dashboard", icon: "pi pi-th-large", routeName: "Dashboard" },
    { label: "D. Financiero", icon: "pi pi-chart-line", routeName: "FinanzasDashboard" },
    { label: "Gastos", icon: "pi pi-arrow-right", routeName: "Gastos" },
    { label: "Cuentas", icon: "pi pi-wallet", routeName: "Cuentas" },
    { label: "Pagos", icon: "pi pi-credit-card", routeName: "Pagos" },
    { label: "G. Comunes", icon: "pi pi-calendar", routeName: "GastosComunes" },
    { label: "Cargos Adic.", icon: "pi pi-plus-circle", routeName: "CargosAdicionales" },
    { label: "Ledger", icon: "pi pi-book", routeName: "Ledger" },
    { label: "Plantillas", icon: "pi pi-copy", routeName: "PlantillasGasto" },
    { label: "Categorías", icon: "pi pi-tag", routeName: "Categorias" },
    { label: "Miembros", icon: "pi pi-users", routeName: "Miembros" },
    { label: "Personal", icon: "pi pi-users", routeName: "Personal" },
    { label: "Anuncios", icon: "pi pi-megaphone", routeName: "Anuncios" },
    { label: "Casos", icon: "pi pi-folder", routeName: "CasosAdmin" },
    { label: "Residentes", icon: "pi pi-users", routeName: "Residentes" },
    { label: "Vehículos", icon: "pi pi-car", routeName: "Vehiculos" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
    { label: "Archivos", icon: "pi pi-folder", routeName: "Archivos" },
    { label: "Almacenamiento", icon: "pi pi-cloud-upload", routeName: "ConfiguracionAlmacenamiento" },
    { label: "Autoriz.", icon: "pi pi-verified", routeName: "Autorizaciones" },
    { label: "Visitas", icon: "pi pi-eye", routeName: "Visitas" },
    { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
    { label: "Checklist", icon: "pi pi-check-square", routeName: "ChecklistTemplates" },
    { label: "Reglas Notif.", icon: "pi pi-sliders-h", routeName: "ReglasNotificacion" },
    { label: "Plantillas Notif.", icon: "pi pi-envelope", routeName: "PlantillasNotificacion" },
    { label: "Notif.", icon: "pi pi-bell", routeName: "Notificaciones" },
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
  TESORERO: [
    { label: "Dashboard", icon: "pi pi-th-large", routeName: "Dashboard" },
    { label: "D. Financiero", icon: "pi pi-chart-line", routeName: "FinanzasDashboard" },
    { label: "Gastos", icon: "pi pi-arrow-right", routeName: "Gastos" },
    { label: "Cuentas", icon: "pi pi-wallet", routeName: "Cuentas" },
    { label: "Pagos", icon: "pi pi-credit-card", routeName: "Pagos" },
    { label: "G. Comunes", icon: "pi pi-calendar", routeName: "GastosComunes" },
    { label: "Cargos Adic.", icon: "pi pi-plus-circle", routeName: "CargosAdicionales" },
    { label: "Ledger", icon: "pi pi-book", routeName: "Ledger" },
    { label: "Plantillas", icon: "pi pi-copy", routeName: "PlantillasGasto" },
    { label: "Categorías", icon: "pi pi-tag", routeName: "Categorias" },
    { label: "Notif.", icon: "pi pi-bell", routeName: "Notificaciones" },
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
  SECRETARIO: [
    { label: "Dashboard", icon: "pi pi-th-large", routeName: "Dashboard" },
    { label: "Cargos Adic.", icon: "pi pi-plus-circle", routeName: "CargosAdicionales" },
    { label: "Miembros", icon: "pi pi-users", routeName: "Miembros" },
    { label: "Personal", icon: "pi pi-users", routeName: "Personal" },
    { label: "Anuncios", icon: "pi pi-megaphone", routeName: "Anuncios" },
    { label: "Casos", icon: "pi pi-folder", routeName: "CasosAdmin" },
    { label: "Residentes", icon: "pi pi-users", routeName: "Residentes" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
    { label: "Autoriz.", icon: "pi pi-verified", routeName: "Autorizaciones" },
    { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
    { label: "Reglas Notif.", icon: "pi pi-sliders-h", routeName: "ReglasNotificacion" },
    { label: "Notif.", icon: "pi pi-bell", routeName: "Notificaciones" },
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
  DELEGADO: [
    { label: "Dashboard", icon: "pi pi-th-large", routeName: "Dashboard" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
    { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
    { label: "Notif.", icon: "pi pi-bell", routeName: "Notificaciones" },
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
};

export function useNavigation() {
  const router = useRouter();
  const route = useRoute();
  const auth = useAuthStore();

  const currentRoute = computed(() => route.name);

  function puedeAcceder(routeName) {
    const resolved = router.resolve({ name: routeName });
    const rRoles = resolved.meta?.roles;
    const rCargos = resolved.meta?.cargos;
    const necesitaRol = rRoles?.length > 0;
    const necesitaCargo = rCargos?.length > 0;
    if (!necesitaRol && !necesitaCargo) return true;
    const userRoles = auth.user?.roles || [];
    const cumpleRol = necesitaRol && (
      rRoles.some((r) => userRoles.includes(r)) ||
      rRoles.includes(auth.condominioActualRol)
    );
    const cumpleCargo = necesitaCargo && rCargos.includes(auth.condominioActualCargo);
    return cumpleCargo || cumpleRol;
  }

  function filtrar(items) {
    return items.filter((i) => puedeAcceder(i.routeName));
  }

  const navItems = computed(() => {
    const rolesGlobales = auth.user?.roles || [];
    const role = rolesGlobales.includes("SUPER_ADMIN")
      ? "SUPER_ADMIN"
      : auth.condominioActualRol || rolesGlobales[0] || "";

    if (role === "RESIDENTE") {
      if (auth.activeContext === "residente") {
        return filtrar(RESIDENTE_ITEMS);
      }
      const cargoKey = auth.activeContext?.toUpperCase();
      return filtrar(CARGO_NAV_ITEMS[cargoKey] || RESIDENTE_ITEMS);
    }

    return filtrar(NAV_ITEMS_BY_ROLE[role] || RESIDENTE_ITEMS);
  });

  const groupedNavItems = computed(() => {
    const rolesGlobales = auth.user?.roles || [];
    const role = rolesGlobales.includes("SUPER_ADMIN")
      ? "SUPER_ADMIN"
      : auth.condominioActualRol || rolesGlobales[0] || "";

    if (role === "RESIDENTE") {
      const groups = [{ label: "Residente", items: filtrar(RESIDENTE_ITEMS) }];
      const cargo = auth.condominioActualCargo;
      if (cargo && CARGO_NAV_ITEMS[cargo]) {
        const label = cargo.charAt(0) + cargo.slice(1).toLowerCase();
        groups.push({ label, items: filtrar(CARGO_NAV_ITEMS[cargo]) });
      }
      return groups;
    }

    const items = filtrar(NAV_ITEMS_BY_ROLE[role] || RESIDENTE_ITEMS);
    return [{ label: "", items }];
  });

  function goTo(routeName) {
    if (!puedeAcceder(routeName)) return;
    router.push({ name: routeName });
  }

  function switchContext(ctx) {
    auth.setActiveContext(ctx.key);
    router.push({ name: auth.contextDashboard });
  }

  return {
    navItems,
    groupedNavItems,
    currentRoute,
    puedeAcceder,
    goTo,
    switchContext,
  };
}
