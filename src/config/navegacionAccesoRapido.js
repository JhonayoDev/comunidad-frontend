const NAV_HOME = (routeName) => ({
  //label: "Home",
  icon: "pi pi-home",
  routeName,
  isCentralFab: true,
});

function conHomeCentral(items, homeRoute) {
  return [...items.slice(0, 2), NAV_HOME(homeRoute), ...items.slice(2)];
}

export const ACCESO_RAPIDO_GUARDIA = [
  {
    label: "Visita",
    icon: "pi pi-user-plus",
    routeName: "RegistrarVisita",
    severity: "primary",
  },
  { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
  { label: "Autoriz.", icon: "pi pi-shield", routeName: "Autorizaciones" },
  { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
];

const NAV_ADMINISTRADOR = [
  { label: "Visitas", icon: "pi pi-eye", routeName: "Visitas" },
  { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
  { label: "Autoriz.", icon: "pi pi-shield", routeName: "Autorizaciones" },
  { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
];

const NAV_RESIDENTE = [
  { label: "Deudas", icon: "pi pi-credit-card", routeName: "MisDeudas" },
  { label: "Autoriz.", icon: "pi pi-shield", routeName: "MisAutorizaciones" },
  { label: "Encomiendas", icon: "pi pi-box", routeName: "MisEncomiendas" },
  { label: "Mensajes", icon: "pi pi-bell", routeName: "Notificaciones" },
];

const NAV_SUPER_ADMIN = [
  { label: "Condominios", icon: "pi pi-building", routeName: "SaasCondominios" },
  { label: "Plantillas", icon: "pi pi-envelope", routeName: "SaasPlantillas" },
  { label: "Almacenamiento", icon: "pi pi-cloud-upload", routeName: "SaasAlmacenamiento" },
  { label: "Auditoría", icon: "pi pi-history", routeName: "SaasAuditoria" },
  { label: "Mensajes", icon: "pi pi-bell", routeName: "Notificaciones" },
];

export const BOTTOM_NAV_BY_ROLE = {
  GUARDIA: conHomeCentral(ACCESO_RAPIDO_GUARDIA, "GuardiaDashboard"),
  ADMINISTRADOR: conHomeCentral(NAV_ADMINISTRADOR, "Dashboard"),
  RESIDENTE: conHomeCentral(NAV_RESIDENTE, "Inicio"),
  SUPER_ADMIN: conHomeCentral(NAV_SUPER_ADMIN, "SuperAdminDashboard"),
  SOPORTE: [],
};
