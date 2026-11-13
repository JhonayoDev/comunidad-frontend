import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const NAV_ITEMS_BY_ROLE = {
  SUPER_ADMIN: [
    { label: "Dashboard", icon: "pi pi-home", routeName: "SuperAdminDashboard" },
    { label: "Condominios", icon: "pi pi-building", routeName: "SaasCondominios" },
    { label: "Planes", icon: "pi pi-tags", routeName: "SaasPlanes" },
    { label: "Plantillas Notif.", icon: "pi pi-envelope", routeName: "SaasPlantillas" },
    { label: "Reglas Notif. Global", icon: "pi pi-sliders-h", routeName: "SaasReglasNotificacion" },
    { label: "Auditoría", icon: "pi pi-history", routeName: "SaasAuditoria" },
    { label: "Cargos Perm.", icon: "pi pi-users", routeName: "CargosPermisos" },
    { label: "Almacenamiento", icon: "pi pi-cloud-upload", routeName: "SaasAlmacenamiento" },
    { label: "Perfil", icon: "pi pi-user", routeName: "Perfil" },
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
  SOPORTE: [
    { label: "Auditoría", icon: "pi pi-history", routeName: "SaasAuditoria" },
    { label: "Plantillas Notif.", icon: "pi pi-envelope", routeName: "SaasPlantillas" },
    { label: "Reglas Notif. Global", icon: "pi pi-sliders-h", routeName: "SaasReglasNotificacion" },
    { label: "Perfil", icon: "pi pi-user", routeName: "Perfil" },
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
  ADMINISTRADOR: [
    { label: "Inicio", icon: "pi pi-home", routeName: "Dashboard" },
    { label: "Configurar", icon: "pi pi-cog", routeName: "Setup" },
    { label: "Personas", icon: "pi pi-users", routeName: "Personas" },
    { label: "Unidades", icon: "pi pi-building", routeName: "Unidades" },
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
    { label: "Solicitudes", icon: "pi pi-inbox", routeName: "SolicitudesAdmin" },
    { label: "Casos", icon: "pi pi-folder", routeName: "CasosAdmin" },
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
  TRABAJADOR: [
    { label: "Inicio", icon: "pi pi-home", routeName: "TrabajadorDashboard" },
    { label: "Notificaciones", icon: "pi pi-bell", routeName: "Notificaciones" },
    { label: "Perfil", icon: "pi pi-user", routeName: "Perfil" },
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
  PROVEEDOR: [
    { label: "Inicio", icon: "pi pi-home", routeName: "ProveedorDashboard" },
    { label: "Notificaciones", icon: "pi pi-bell", routeName: "Notificaciones" },
    { label: "Perfil", icon: "pi pi-user", routeName: "Perfil" },
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
};

const RESIDENTE_ITEMS = [
  { label: "Inicio", icon: "pi pi-home", routeName: "Inicio" },
  { label: "Mi unidad", icon: "pi pi-home", routeName: "MiUnidad" },
  { label: "Deudas", icon: "pi pi-credit-card", routeName: "MisDeudas" },
  { label: "Autoriz.", icon: "pi pi-verified", routeName: "MisAutorizaciones" },
  { label: "Solicitudes", icon: "pi pi-file", routeName: "MisSolicitudes" },
  { label: "Encomiendas", icon: "pi pi-box", routeName: "MisEncomiendas" },
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
    { label: "Solicitudes", icon: "pi pi-inbox", routeName: "SolicitudesAdmin" },
    { label: "Casos", icon: "pi pi-folder", routeName: "CasosAdmin" },
    { label: "Personas", icon: "pi pi-users", routeName: "Personas" },
    { label: "Unidades", icon: "pi pi-building", routeName: "Unidades" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
    { label: "Archivos", icon: "pi pi-folder", routeName: "Archivos" },
    { label: "Almacenamiento", icon: "pi pi-cloud-upload", routeName: "ConfiguracionAlmacenamiento" },
    { label: "Autoriz.", icon: "pi pi-verified", routeName: "Autorizaciones" },
    { label: "Visitas", icon: "pi pi-eye", routeName: "Visitas" },
    { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
    { label: "Checklist", icon: "pi pi-check-square", routeName: "ChecklistTemplates" },
    { label: "Plantillas Notif.", icon: "pi pi-envelope", routeName: "PlantillasNotificacion" },
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
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
  SECRETARIO: [
    { label: "Dashboard", icon: "pi pi-th-large", routeName: "Dashboard" },
    { label: "Cargos Adic.", icon: "pi pi-plus-circle", routeName: "CargosAdicionales" },
    { label: "Miembros", icon: "pi pi-users", routeName: "Miembros" },
    { label: "Personal", icon: "pi pi-users", routeName: "Personal" },
    { label: "Anuncios", icon: "pi pi-megaphone", routeName: "Anuncios" },
    { label: "Solicitudes", icon: "pi pi-inbox", routeName: "SolicitudesAdmin" },
    { label: "Casos", icon: "pi pi-folder", routeName: "CasosAdmin" },
    { label: "Personas", icon: "pi pi-users", routeName: "Personas" },
    { label: "Unidades", icon: "pi pi-building", routeName: "Unidades" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
    { label: "Autoriz.", icon: "pi pi-verified", routeName: "Autorizaciones" },
    { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
  DELEGADO: [
    { label: "Dashboard", icon: "pi pi-th-large", routeName: "Dashboard" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
    { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
  ADMINISTRADOR: [
    { label: "Dashboard", icon: "pi pi-th-large", routeName: "Dashboard" },
    { label: "Configurar", icon: "pi pi-cog", routeName: "Setup" },
    { label: "Personas", icon: "pi pi-users", routeName: "Personas" },
    { label: "Unidades", icon: "pi pi-building", routeName: "Unidades" },
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
    { label: "Solicitudes", icon: "pi pi-inbox", routeName: "SolicitudesAdmin" },
    { label: "Casos", icon: "pi pi-folder", routeName: "CasosAdmin" },
    { label: "Mis Permisos", icon: "pi pi-shield", routeName: "MisPermisos" },
  ],
};

/**
 * Rutas compartidas entre espacios de trabajo: se pueden abrir con cualquier
 * contexto activo (residente o un cargo). El header y las notificaciones son
 * el punto de unión para no perder comunicaciones al cambiar de contexto.
 */
export const RUTAS_COMPARTIDAS = new Set([
  "Menu",
  "Perfil",
  "Notificaciones",
  "MisPermisos",
]);

function nombresDe(items) {
  return (items || []).map((i) => i.routeName);
}

const RUTAS_RESIDENTE = new Set(nombresDe(RESIDENTE_ITEMS));
const RUTAS_TRABAJADOR = new Set(nombresDe(NAV_ITEMS_BY_ROLE.TRABAJADOR));
const RUTAS_PROVEEDOR = new Set(nombresDe(NAV_ITEMS_BY_ROLE.PROVEEDOR));
const RUTAS_POR_CARGO = new Map(
  Object.entries(CARGO_NAV_ITEMS).map(([cargo, items]) => [
    cargo.toLowerCase(),
    new Set(nombresDe(items)),
  ]),
);

/**
 * Contextos (en minúsculas) a los que pertenece una ruta según el menú de cada
 * espacio de trabajo. Devuelve `[]` para rutas auxiliares (detalles, flujos de
 * alta, etc.) que no viven en el menú y se alcanzan desde un contexto válido.
 */
export function contextosDeRuta(routeName) {
  if (!routeName) return [];
  const contextos = [];
  if (RUTAS_RESIDENTE.has(routeName)) contextos.push("residente");
  for (const [cargo, rutas] of RUTAS_POR_CARGO) {
    if (rutas.has(routeName)) contextos.push(cargo);
  }
  if (RUTAS_TRABAJADOR.has(routeName)) contextos.push("trabajador");
  if (RUTAS_PROVEEDOR.has(routeName)) contextos.push("proveedor");
  return contextos;
}

export function useNavigation() {
  const router = useRouter();
  const route = useRoute();
  const auth = useAuthStore();

  const currentRoute = computed(() => route.name);

  function puedeAcceder(routeName) {
    let resolved;
    try {
      resolved = router.resolve({ name: routeName });
    } catch (e) {
      // Ruta inexistente (p.ej. ítem de menú zombie): sin acceso, sin romper el menú.
      console.error(`Ruta desconocida en navegación: ${routeName}`, e);
      return false;
    }
    const rRoles = resolved.meta?.roles;
    const rCargos = resolved.meta?.cargos;
    const necesitaRol = rRoles?.length > 0;
    const necesitaCargo = rCargos?.length > 0;
    if (!necesitaRol && !necesitaCargo) return true;
    const userRoles = auth.user?.roles || [];
    const cumpleRol =
      necesitaRol &&
      (rRoles.some((r) => userRoles.includes(r)) ||
        rRoles.includes(auth.condominioActualRol) ||
        rRoles.includes(auth.condominioActualRolContextual) ||
        rRoles.includes((auth.activeContext || "").toUpperCase()));
    const cumpleCargo = necesitaCargo && rCargos.includes(auth.condominioActualCargo);
    return cumpleCargo || cumpleRol;
  }

  function filtrar(items) {
    return items.filter((i) => puedeAcceder(i.routeName));
  }

  /**
   * Portal efectivo para un usuario con rol base RESIDENTE. El contexto
   * activo (residente, cargo, trabajador, proveedor) manda; si el backend
   * deriva TRABAJADOR/PROVEEDOR y no hay participación residencial, ese es el
   * portal por defecto.
   */
  function portalResidente() {
    if (auth.activeContext === "trabajador") return "TRABAJADOR";
    if (auth.activeContext === "proveedor") return "PROVEEDOR";
    if (auth.activeContext && auth.activeContext !== "residente") {
      return "ADMINISTRADOR";
    }
    const contextual = auth.condominioActualRolContextual;
    if (
      contextual === "TRABAJADOR" &&
      !auth.esParticipacionResidencial
    ) {
      return "TRABAJADOR";
    }
    if (contextual === "PROVEEDOR" && !auth.esParticipacionResidencial) {
      return "PROVEEDOR";
    }
    return "RESIDENTE";
  }

  const navItems = computed(() => {
    const rolesGlobales = auth.user?.roles || [];
    if (rolesGlobales.includes("SUPER_ADMIN")) {
      return filtrar(NAV_ITEMS_BY_ROLE.SUPER_ADMIN);
    }

    const role = auth.condominioActualRol || rolesGlobales[0] || "";

    if (role === "RESIDENTE") {
      const portal = portalResidente();
      if (portal === "TRABAJADOR") {
        return filtrar(NAV_ITEMS_BY_ROLE.TRABAJADOR);
      }
      if (portal === "PROVEEDOR") {
        return filtrar(NAV_ITEMS_BY_ROLE.PROVEEDOR);
      }
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
    if (rolesGlobales.includes("SUPER_ADMIN")) {
      return [
        { label: "", items: filtrar(NAV_ITEMS_BY_ROLE.SUPER_ADMIN) },
      ];
    }

    const role = auth.condominioActualRol || rolesGlobales[0] || "";

    if (role === "RESIDENTE") {
      const portal = portalResidente();
      if (portal === "TRABAJADOR" || portal === "PROVEEDOR") {
        return [
          {
            label: "",
            items: filtrar(NAV_ITEMS_BY_ROLE[portal]),
          },
        ];
      }

      // Espacios de trabajo separados: el menú muestra solo el contexto activo
      // (residente o el cargo seleccionado), nunca ambos a la vez.
      if (auth.activeContext && auth.activeContext !== "residente") {
        const cargoKey = auth.activeContext.toUpperCase();
        if (CARGO_NAV_ITEMS[cargoKey]) {
          return [{ label: "", items: filtrar(CARGO_NAV_ITEMS[cargoKey]) }];
        }
      }

      return [{ label: "", items: filtrar(RESIDENTE_ITEMS) }];
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
    portalResidente,
    goTo,
    switchContext,
  };
}
