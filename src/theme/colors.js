/**
 * colors.js — Paleta semántica del proyecto
 *
 * Fuente única de color extraída de `src/theme/prime-theme.js`.
 * Cada valor es el HEX o variable CSS exacta que usa el preset.
 *
 * Estructura:
 *  - brand:  escala de marca / acento principal (azul institucional).
 *  - neutral: superficies, bordes y jerarquía de texto (light/dark).
 *  - status: estados semánticos (success, warning, danger, info).
 *  - ui:     colores específicos de componentes (overlays, focus, mezclas).
 *
 * Compatibilidad: se exportan además `light` y `dark`, alias que consume
 * `prime-theme.js` (`colors.light.background`, `colors.dark.text.primary`, etc.).
 */

// ─── Brand / Primario (identidad) ─────────────────────────────────────────────
// Escala azul institucional del proyecto.
export const brand = {
  // Escala completa 50→950 (tonos claros a oscuros)
  50: "#edf5fc", // azul muy claro — fondo de chips/hover suave
  100: "#d7e7f8", // azul claro — bordes suaves, fills
  200: "#b0cfef", // azul perla — borde secundario, texto resaltado
  300: "#7caedf", // azul medio-claro
  400: "#4d8fce", // azul medio
  500: "#265e95", // azul base — estado hover del brand
  600: "#002d5c", // azul profundo — variante oscura
  700: "#00264d", // azul muy profundo
  800: "#001f40",
  900: "#00172f",
  950: "#000d1a", // casi negro azulado

  // Roles de marca (mapeo directo de prime-theme.js → colorScheme.light.primary)
  DEFAULT: "#003366", // azul institucional — color principal (texto/CTA)
  hover: "#265e95", // hoverColor → {primary-500}
  active: "#00488f", // activeColor — estado presionado
  border: "#004d99", // border — contorno de componentes
  borderSecondary: "#b0cfef", // borderSecondary — contorno secundario (brand.200)
  text: "#003366", // texto sobre fondo claro
  onBrand: "#ffffff", // texto/ícono sobre fondo brand
  textResaltado: "#b0cfef", // texto destacado (brand.200)
};

// ─── Neutral (superficies, bordes, texto) ────────────────────────────────────
export const neutral = {
  light: {
    background: "#F4F4F7", // fondo general de la app (gris muy claro)
    surface: "#FFFFFF", // superficies elevadas: cards, paneles
    backgroundInverse: "#222226", // fondo inverso (barra de estado/dark)
    border: "#bfbfbf", // borde/divisor general
    muted: "#8a8a8a", // texto deshabilitado / placeholder (surface-500)
    scale: {
      0: "#1a1a1a",
      50: "#f5f5f5",
      100: "#F4F4F7",
      200: "#bfbfbf",
      300: "#5a5c61",
      400: "#a8a8a8",
      500: "#8a8a8a",
      600: "#5a5c61",
      700: "#404040",
      800: "#2d2d2d",
      900: "#1a1a1a",
      950: "#0d0d0d",
    },
    text: {
      primary: "#1a1a1a", // texto principal (casi negro)
      secondary: "#5a5c61", // texto secundario / metadatos
      inverse: "#eef4fb", // texto sobre fondo inverso → {info-50}
    },
  },
  dark: {
    background: "#121212", // fondo general en dark mode
    surface: "#222226", // superficies elevadas en dark
    backgroundInverse: "#F4F4F7", // fondo inverso (invierte el light)
    border: "#323238", // borde/divisor en dark
    muted: "#808088", // texto deshabilitado (surface-500)
    scale: {
      0: "#ffffff",
      50: "#181818",
      100: "#121212",
      200: "#323238",
      300: "#4a4a50",
      400: "#66666e",
      500: "#808088",
      600: "#b3b3b7",
      700: "#d6d6da",
      800: "#ececef",
      900: "#ffffff",
      950: "#ffffff",
    },
    text: {
      primary: "#ffffff", // texto principal en dark
      secondary: "#b3b3b7", // texto secundario en dark
      inverse: "#003f80", // texto sobre fondo inverso → {info-600}
    },
  },
};

// ─── Status / Semánticos ──────────────────────────────────────────────────────
export const status = {
  success: {
    50: "#edf7ee", // fondo de badges/toasts de éxito
    100: "#d7ecd9",
    200: "#afd9b3",
    300: "#81c784",
    400: "#4caf50",
    500: "#388b3c", // verde base — DEFAULT
    600: "#256728",
    700: "#1f5a22",
    800: "#18471b",
    900: "#103012",
    950: "#081808",
    DEFAULT: "#388b3c",
  },
  warning: {
    50: "#fff8e7", // fondo de alertas amarillo
    100: "#feefc5",
    200: "#fde08c",
    300: "#fbd253",
    400: "#fac73d",
    500: "#ebb83d", // ámbar base — DEFAULT
    600: "#dca93d",
    700: "#b58b32",
    800: "#8e6d27",
    900: "#66501c",
    950: "#33280e",
    DEFAULT: "#ebb83d",
  },
  danger: {
    50: "#fdeeee", // fondo de errores/eliminar
    100: "#fad4d4",
    200: "#f5aaaa",
    300: "#ef8080",
    400: "#e45555",
    500: "#c53b3b", // rojo base — DEFAULT
    600: "#a72222",
    700: "#861b1b",
    800: "#651414",
    900: "#430d0d",
    950: "#220707",
    DEFAULT: "#c53b3b",
  },
  info: {
    50: "#eef4fb", // fondo de información/ayuda
    100: "#d5e5f7",
    200: "#abcbee",
    300: "#7fb1e5",
    400: "#4f93d7",
    500: "#2769ab", // azul información base — DEFAULT
    600: "#003f80",
    700: "#003366",
    800: "#00264d",
    900: "#001933",
    950: "#000d1a",
    DEFAULT: "#2769ab",
  },
};

// ─── UI (componentes: overlays, focus, mezclas) ───────────────────────────────
export const ui = {
  // Overlays de popover/dialog/select — mezcla al 98% de la superficie
  overlay: {
    light: "color-mix(in srgb, #F4F4F7 98%, transparent)",
    dark: "color-mix(in srgb, #222226 98%, transparent)",
  },
  // Campos de formulario — superficie al 75% (fondo translúcido)
  formField: {
    light: "color-mix(in srgb, #F4F4F7 75%, transparent)",
    dark: "color-mix(in srgb, #222226 75%, transparent)",
  },
  // Interacción de botones outlined/text: mezclas del brand al 8% / 16%
  interaction: {
    hoverMix: "color-mix(in srgb, #003366 8%, transparent)",
    activeMix: "color-mix(in srgb, #003366 16%, transparent)",
  },
  // Focus / hover de opciones seleccionadas (select, autocomplete, datepicker)
  focus: {
    highlight: "#265e95", // {primary-500} — hover de opciones
    ring: "#003366", // {primary.color} — anillo de foco (checkbox, links)
  },
  // Acentos puntuales de componentes
  datepickerAccent: "#c53b3b", // header/título del Datepicker (danger-500)
  checkedOnBrand: "#ffffff", // texto/ícono sobre control activo (togglebutton)
};

// ─── Alias por esquema (light/dark) — consumidos por prime-theme.js ───────────
// Mantienen la compatibilidad del default export original: `colors.light.*`,
// `colors.dark.*`, y el `colors.light.primary` (antes gris, ahora el brand real).
export const light = {
  background: neutral.light.background, // #F4F4F7 → surface-100
  surface: neutral.light.surface, // #FFFFFF
  text: {
    primary: neutral.light.text.primary, // #1a1a1a → surface-900
    secondary: neutral.light.text.secondary, // #5a5c61 → surface-300/600
  },
  border: neutral.light.border, // #bfbfbf → surface-200
  primary: brand.DEFAULT, // #003366
  primaryHover: brand.hover, // #265e95
  primaryActive: brand.active, // #00488f
  success: status.success.DEFAULT,
  warning: status.warning.DEFAULT,
  danger: status.danger.DEFAULT,
  info: status.info.DEFAULT,
};

export const dark = {
  background: neutral.dark.background, // #121212 → surface-100
  surface: neutral.dark.surface, // #222226
  text: {
    primary: neutral.dark.text.primary, // #ffffff → surface-900
    secondary: neutral.dark.text.secondary, // #b3b3b7 → surface-600
  },
  border: neutral.dark.border, // #323238 → surface-200
  primary: brand.DEFAULT, // #003366
  primaryHover: brand.hover, // #265e95
  primaryActive: brand.active, // #00488f
  success: status.success.DEFAULT,
  warning: status.warning.DEFAULT,
  danger: status.danger.DEFAULT,
  info: status.info.DEFAULT,
};

// ─── Export principal ─────────────────────────────────────────────────────────
export const colors = {
  brand,
  neutral,
  status,
  ui,
  // Aliases de compatibilidad con prime-theme.js
  light,
  dark,
};

export default colors;
