export const ACCESO_RAPIDO_GUARDIA = [
  { label: "Visita", icon: "pi pi-user-plus", routeName: "RegistrarVisita" },
  { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
  {
    label: "Escanear",
    icon: "pi pi-qrcode",
    routeName: "Escanear",
    isCentralFab: true,
  },
  { label: "Autoriz.", icon: "pi pi-shield", routeName: "Autorizaciones" },
  { label: "Solicitudes", icon: "pi pi-inbox", routeName: "Solicitudes" },
];

export const BOTTOM_NAV_BY_ROLE = {
  GUARDIA: ACCESO_RAPIDO_GUARDIA,
  ADMINISTRADOR: [
    { label: "Inicio", icon: "pi pi-home", routeName: "Dashboard" },
    { label: "Visitas", icon: "pi pi-eye", routeName: "Visitas" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "Encomiendas" },
    { label: "Autoriz.", icon: "pi pi-shield", routeName: "Autorizaciones" },
    { label: "Bitácora", icon: "pi pi-book", routeName: "Bitacora" },
  ],
  RESIDENTE: [
    { label: "Inicio", icon: "pi pi-home", routeName: "Inicio" },
    { label: "Deudas", icon: "pi pi-credit-card", routeName: "MisDeudas" },
    { label: "Autoriz.", icon: "pi pi-shield", routeName: "MisAutorizaciones" },
    { label: "Encomiendas", icon: "pi pi-box", routeName: "MisEncomiendas" },
    { label: "Notif.", icon: "pi pi-bell", routeName: "Notificaciones" },
  ],
  SUPER_ADMIN: [],
  SOPORTE: [],
};
