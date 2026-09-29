import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

/**
 * =====================================================================
 * BRIKU THEME — ÚNICA FUENTE DE VERDAD DE LOS COLORES
 * =====================================================================
 * Ya NO depende de colors.js. Todo se ajusta en este archivo.
 *
 * Reglas para no volver a romper el tema:
 *  1) Todo lo que Aura define dentro de `colorScheme.light|dark`
 *     (botones, togglebutton, list.option, overlay, content, text…)
 *     se sobrescribe TAMBIÉN dentro de `colorScheme`. Si lo pones en la
 *     raíz, en modo oscuro Aura lo pisa.
 *  2) La escala `surface` es ESTÁNDAR: 0 = más claro … 950 = más oscuro,
 *     siempre creciente, igual en claro y oscuro. Aura depende de eso.
 *  3) Los nombres propios (primary.textPrincipal, primary.surface, …) se
 *     mantienen igual para no romper app.css ni otros archivos.
 * =====================================================================
 */

/** Mezcla un color con transparente (para hover/active sutiles). */
const mix = (color, percent) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

/* ---------------------------------------------------------------------
 * ESCALAS DE SUPERFICIE (estándar: 0 claro → 950 oscuro)
 * ------------------------------------------------------------------- */
const surfaceLight = {
  0: "#ffffff",
  50: "#f4f4f7", // fondo de página
  100: "#ececf0",
  200: "#dedee3",
  300: "#bfbfbf", // borde de campos
  400: "#a8a8ae",
  500: "#8a8a90",
  600: "#5a5c61", // texto secundario
  700: "#404248",
  800: "#2d2d31",
  900: "#1a1a1a", // texto principal
  950: "#0d0d0d",
};

const surfaceDark = {
  0: "#ffffff",
  50: "#f4f4f7",
  100: "#ececef",
  200: "#d6d6da",
  300: "#b3b3b7", // texto secundario
  400: "#8f8f96",
  500: "#6b6b73",
  600: "#4a4a50", // borde de campos
  700: "#323238", // borde de contenido
  800: "#2a2a2f", // hover de contenido
  900: "#222226", // superficie (cards, overlays)
  950: "#121212", // fondo de página / campos
};

/* ---------------------------------------------------------------------
 * OPCIONES DE LISTA (Select, AutoComplete, MultiSelect, Listbox…)
 * Look actual: foco/selección en azul sólido con texto blanco.
 * `{primary.500}` #265e95 + blanco = 6.7:1 en ambos modos.
 * ------------------------------------------------------------------- */
const listOption = {
  color: "{primary.textSecondary}",
  focusBackground: "{primary.500}",
  focusColor: "#ffffff",
  selectedBackground: "{primary.500}",
  selectedColor: "#ffffff",
  selectedFocusBackground: "{primary.500}",
  selectedFocusColor: "#ffffff",
};

/* Overlays (dialog, popover, select, password…) */
const overlayBase = {
  background: mix("{primary.surface}", 98),
  borderColor: mix("{primary.textSecondary}", 20),
  color: "{primary.textPrincipal}",
};

/* ---------------------------------------------------------------------
 * BOTONES POR SEVERIDAD (usan TUS paletas, no red/green/orange/sky)
 *   solid = fondo sólido, on = color del texto sobre el sólido
 *   fg = color de texto/borde para variantes text y outlined
 * ------------------------------------------------------------------- */
const severityTokens = (scale, l, d) => {
  const build = (c) => ({
    root: {
      background: `{${scale}.${c.solid}}`,
      hoverBackground: `{${scale}.${c.hover}}`,
      activeBackground: `{${scale}.${c.active}}`,
      borderColor: `{${scale}.${c.solid}}`,
      hoverBorderColor: `{${scale}.${c.hover}}`,
      activeBorderColor: `{${scale}.${c.active}}`,
      color: c.on,
      hoverColor: c.on,
      activeColor: c.on,
      focusRing: { color: `{${scale}.${c.solid}}`, shadow: "none" },
    },
    outlined: {
      hoverBackground: mix(`{${scale}.${c.fg}}`, 8),
      activeBackground: mix(`{${scale}.${c.fg}}`, 16),
      borderColor: `{${scale}.${c.border}}`,
      color: `{${scale}.${c.fg}}`,
    },
    text: {
      hoverBackground: mix(`{${scale}.${c.fg}}`, 8),
      activeBackground: mix(`{${scale}.${c.fg}}`, 16),
      color: `{${scale}.${c.fg}}`,
    },
  });
  return { light: build(l), dark: build(d) };
};

const danger = severityTokens(
  "danger",
  { solid: 500, hover: 600, active: 700, on: "#ffffff", fg: 500, border: 200 },
  {
    solid: 400,
    hover: 300,
    active: 200,
    on: "{danger.950}",
    fg: 400,
    border: 700,
  },
);
const success = severityTokens(
  "success",
  { solid: 600, hover: 700, active: 800, on: "#ffffff", fg: 600, border: 200 },
  {
    solid: 400,
    hover: 300,
    active: 200,
    on: "{success.950}",
    fg: 400,
    border: 700,
  },
);
const warn = severityTokens(
  "warning",
  {
    solid: 500,
    hover: 600,
    active: 700,
    on: "{warning.950}",
    fg: 800,
    border: 300,
  },
  {
    solid: 400,
    hover: 300,
    active: 200,
    on: "{warning.950}",
    fg: 400,
    border: 700,
  },
);
const info = severityTokens(
  "info",
  { solid: 500, hover: 600, active: 700, on: "#ffffff", fg: 500, border: 200 },
  {
    solid: 400,
    hover: 300,
    active: 200,
    on: "{info.950}",
    fg: 400,
    border: 700,
  },
);

/* Botón: variantes primary/secondary propias + severidades */
const buttonScheme = (mode) => {
  const dark = mode === "dark";
  return {
    root: {
      danger: danger[mode].root,
      success: success[mode].root,
      warn: warn[mode].root,
      info: info[mode].root,
    },
    outlined: {
      primary: {
        color: "{primary.textPrincipal}",
        borderColor: dark ? "{primary.400}" : "{primary.border}",
        hoverBackground: mix("{primary.color}", 8),
        activeBackground: mix("{primary.color}", 16),
      },
      secondary: {
        color: "{primary.textSecondary}",
        borderColor: "{primary.borderSecondary}",
        hoverBackground: mix("{primary.textSecondary}", 8),
        activeBackground: mix("{primary.textSecondary}", 16),
      },
      danger: danger[mode].outlined,
      success: success[mode].outlined,
      warn: warn[mode].outlined,
      info: info[mode].outlined,
    },
    text: {
      primary: {
        color: "{primary.color}",
        hoverBackground: mix("{primary.color}", 12),
        activeBackground: mix("{primary.color}", 20),
      },
      secondary: {
        color: "{primary.textSecondary}",
        hoverBackground: mix("{primary.textSecondary}", 8),
        activeBackground: mix("{primary.textSecondary}", 16),
      },
      danger: danger[mode].text,
      success: success[mode].text,
      warn: warn[mode].text,
      info: info[mode].text,
    },
  };
};

/* ToggleButton / SelectButton: checked = azul sólido con texto de contraste */
const toggleScheme = () => ({
  root: {
    background: mix("{primary.surface}", 75),
    color: "{primary.textPrincipal}",
    borderColor: "{primary.borderSecondary}",
    hoverBackground: mix("{primary.textSecondary}", 8),
    hoverColor: "{primary.textPrincipal}",
    checkedBackground: "{primary.color}",
    checkedBorderColor: "{primary.color}",
    checkedColor: "{primary.contrastColor}",
  },
  content: {
    // Aura pinta una "píldora" interior al estar checked; aquí el fondo
    // checked ya lo pone root, así que la píldora queda transparente.
    checkedBackground: "transparent",
  },
  icon: {
    color: "{primary.textSecondary}",
    hoverColor: "{primary.textPrincipal}",
    checkedColor: "{primary.contrastColor}",
  },
});

/* AutoComplete: dropdown y chips (Aura los define dentro de colorScheme) */
const autocompleteScheme = () => ({
  dropdown: {
    background: mix("{primary.surface}", 98),
    color: "{primary.textPrincipal}",
    hoverBackground: "{primary.500}",
    hoverColor: "#ffffff",
    activeBackground: "{primary.600}",
    activeColor: "#ffffff",
  },
  chip: {
    focusBackground: "{primary.500}",
    focusColor: "#ffffff",
  },
});

export default definePreset(Aura, {
  semantic: {
    /**
     * ===============================================================
     * PALETAS
     * ===============================================================
     */
    primary: {
      50: "#edf5fc",
      100: "#d7e7f8",
      200: "#b0cfef",
      300: "#7caedf",
      400: "#4d8fce",
      500: "#265e95",
      600: "#002d5c",
      700: "#00264d",
      800: "#001f40",
      900: "#00172f",
      950: "#000d1a",
    },

    success: {
      50: "#edf7ee",
      100: "#d7ecd9",
      200: "#afd9b3",
      300: "#81c784",
      400: "#4caf50",
      500: "#388b3c",
      600: "#256728",
      700: "#1f5a22",
      800: "#18471b",
      900: "#103012",
      950: "#081808",
    },

    warning: {
      50: "#fff8e7",
      100: "#feefc5",
      200: "#fde08c",
      300: "#fbd253",
      400: "#fac73d",
      500: "#ebb83d",
      600: "#dca93d",
      700: "#b58b32",
      800: "#8e6d27",
      900: "#66501c",
      950: "#33280e",
    },

    danger: {
      50: "#fdeeee",
      100: "#fad4d4",
      200: "#f5aaaa",
      300: "#ef8080",
      400: "#e45555",
      500: "#c53b3b",
      600: "#a72222",
      700: "#861b1b",
      800: "#651414",
      900: "#430d0d",
      950: "#220707",
    },

    info: {
      50: "#eef4fb",
      100: "#d5e5f7",
      200: "#abcbee",
      300: "#7fb1e5",
      400: "#4f93d7",
      500: "#2769ab",
      600: "#003f80",
      700: "#003366",
      800: "#00264d",
      900: "#001933",
      950: "#000d1a",
    },

    /**
     * ===============================================================
     * COLOR SCHEME
     * ===============================================================
     */
    colorScheme: {
      light: {
        surface: surfaceLight,

        primary: {
          // --- tokens estándar de PrimeVue ---
          color: "#003366",
          contrastColor: "#ffffff",
          hoverColor: "{primary.500}",
          activeColor: "#00488f",

          // --- tokens propios (mismos nombres que antes) ---
          background: "#FFFFFF",
          surface: "#F4F4F7",
          backgroundInverse: "#222226",
          border: "#004d99",
          borderSecondary: "#b0cfef",
          textPrincipal: "#1a1a1a",
          textSecondary: "#5a5c61",
          textInverse: "{info.50}",
          textResaltado: "#b0cfef",
          botonAccion: "{primary.textPrincipal}",
          inverseColor: "#121212",
          autoFillBox: "{primary.surface}",
        },

        text: {
          color: "{primary.textPrincipal}",
          hoverColor: "{primary.textPrincipal}",
          mutedColor: "{primary.textSecondary}",
          hoverMutedColor: "{primary.textPrincipal}",
        },

        content: {
          background: "{primary.surface}",
          hoverBackground: mix("{primary.textSecondary}", 8),
          borderColor: mix("{primary.textSecondary}", 20),
          color: "{primary.textPrincipal}",
          hoverColor: "{primary.textPrincipal}",
        },

        overlay: {
          select: overlayBase,
          popover: overlayBase,
          modal: overlayBase,
        },

        list: { option: listOption },

        formField: {
          background: mix("{primary.surface}", 75),
          color: "{primary.textPrincipal}",
          placeholderColor: mix("{primary.textSecondary}", 50),
        },
      },

      dark: {
        surface: surfaceDark,

        primary: {
          // --- tokens estándar de PrimeVue ---
          // En oscuro el azul de marca (#003366) casi no se ve sobre #121212
          // (1.5:1). Se usa un tono más claro con texto oscuro encima,
          // igual que hace Aura.
          color: "{primary.400}",
          contrastColor: "{primary.950}",
          hoverColor: "{primary.300}",
          activeColor: "{primary.200}",

          // --- tokens propios (mismos nombres que antes) ---
          background: "#121212",
          surface: "#222226",
          backgroundInverse: "#F4F4F7",
          border: "#004d99",
          borderSecondary: "#b0cfef",
          textPrincipal: "#ffffff",
          textSecondary: "#b3b3b7",
          textInverse: "{info.600}",
          textResaltado: "#b0cfef",
          botonAccion: "{primary.textPrincipal}",
          inverseColor: "#121212",
          autoFillBox: "{primary.surface}",
        },

        text: {
          color: "{primary.textPrincipal}",
          hoverColor: "{primary.textPrincipal}",
          mutedColor: "{primary.textSecondary}",
          hoverMutedColor: "{primary.textPrincipal}",
        },

        content: {
          background: "{primary.surface}",
          hoverBackground: mix("{primary.textSecondary}", 8),
          borderColor: mix("{primary.textSecondary}", 20),
          color: "{primary.textPrincipal}",
          hoverColor: "{primary.textPrincipal}",
        },

        overlay: {
          select: overlayBase,
          popover: overlayBase,
          modal: overlayBase,
        },

        list: { option: listOption },

        formField: {
          background: mix("{primary.surface}", 75),
          color: "{primary.textPrincipal}",
          placeholderColor: mix("{primary.textSecondary}", 50),
        },
      },
    },
  },

  /**
   * ===============================================================
   * COMPONENTS
   * ===============================================================
   * Solo lo que NO se puede resolver con tokens semánticos.
   * (dialog, popover, confirmdialog, datepicker y los overlays de
   * select/autocomplete/multiselect ya salen de `semantic.overlay` y
   * `semantic.content`.)
   */
  components: {
    button: {
      colorScheme: {
        light: buttonScheme("light"),
        dark: buttonScheme("dark"),
      },
    },

    togglebutton: {
      colorScheme: {
        light: toggleScheme(),
        dark: toggleScheme(),
      },
    },

    password: {
      colorScheme: {
        light: {
          strength: {
            weakBackground: "{danger.500}",
            mediumBackground: "{warning.500}",
            strongBackground: "{success.500}",
          },
        },
        dark: {
          strength: {
            weakBackground: "{danger.400}",
            mediumBackground: "{warning.400}",
            strongBackground: "{success.400}",
          },
        },
      },
    },

    autocomplete: {
      colorScheme: {
        light: autocompleteScheme(),
        dark: autocompleteScheme(),
      },
    },

    multiselect: {
      chip: {
        background: mix("{primary.textSecondary}", 14),
        color: "{primary.textPrincipal}",
      },
      emptyMessage: {
        color: "{primary.textSecondary}",
      },
    },
  },
});
