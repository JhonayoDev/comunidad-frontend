import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

/**
 * =====================================================================
 * BRIKU THEME — ÚNICA FUENTE DE VERDAD DE LOS COLORES
 * =====================================================================
 * Ya NO depende de colors.js. Todo se ajusta aquí.
 *
 * Reglas:
 *  1) Overrides de componentes siempre dentro de colorScheme.light|dark.
 *     En la raíz, Aura los pisa en modo oscuro.
 *  2) La escala surface es POR ROLES (no por luminosidad). Los números
 *     bajos son fondos/bordes y los altos son texto. Cientos de vistas
 *     dependen de esto — NO reordenar.
 *  3) Los componentes de PrimeVue NO leen {surface.N} directamente:
 *     se les da color por tokens semánticos (content, text, overlay…).
 *  4) Los nombres propios (primary.textPrincipal, etc.) se mantienen
 *     para no romper app.css.
 *
 * BOTÓN PRINCIPAL — NOTA DE INTERCAMBIO VISUAL:
 *   Modo claro  → actualmente usa azul de marca #173a6a (profundo)
 *   Modo oscuro → actualmente usa azul profundo #002d5c
 *   Si quieres probar el inverso (claro=profundo, oscuro=marca), intercambia
 *   los bloques marcados con [SWAP-LIGHT] y [SWAP-DARK] en buttonScheme().
 * =====================================================================
 */

const mix = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/* ─────────────────────────────────────────────────────────────────────
 * ESCALA SURFACE — POR ROLES (igual que antes, sin colors.js)
 * ───────────────────────────────────────────────────────────────────── */
const surfaceLight = {
  0: "#1a1a1a",
  50: "#f5f5f5",
  100: "#f4f4f7",
  200: "#bfbfbf",
  300: "#5a5c61",
  400: "#a8a8a8",
  500: "#8a8a8a",
  600: "#5a5c61",
  700: "#404040",
  800: "#2d2d2d",
  900: "#1a1a1a",
  950: "#0d0d0d",
};

const surfaceDark = {
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
};

/* ─────────────────────────────────────────────────────────────────────
 * PALETAS SEMÁNTICAS
 * ───────────────────────────────────────────────────────────────────── */
const danger = {
  light: {
    solid: "#c53b3b",
    hover: "#a72222",
    active: "#861b1b",
    on: "#ffffff",
    fg: "#c53b3b",
    fgHover: mix("#c53b3b", 8),
    fgActive: mix("#c53b3b", 16),
    border: "#f5aaaa",
  },
  dark: {
    solid: "#e45555",
    hover: "#ef8080",
    active: "#c53b3b",
    on: "#220707",
    fg: "#e45555",
    fgHover: mix("#e45555", 8),
    fgActive: mix("#e45555", 16),
    border: "#861b1b",
  },
};
const success = {
  light: {
    solid: "#256728",
    hover: "#1f5a22",
    active: "#18471b",
    on: "#ffffff",
    fg: "#256728",
    fgHover: mix("#256728", 8),
    fgActive: mix("#256728", 16),
    border: "#afd9b3",
  },
  dark: {
    solid: "#4caf50",
    hover: "#81c784",
    active: "#388b3c",
    on: "#081808",
    fg: "#4caf50",
    fgHover: mix("#4caf50", 8),
    fgActive: mix("#4caf50", 16),
    border: "#1f5a22",
  },
};
const warn = {
  light: {
    solid: "#ebb83d",
    hover: "#dca93d",
    active: "#b58b32",
    on: "#33280e",
    fg: "#8e6d27",
    fgHover: mix("#8e6d27", 8),
    fgActive: mix("#8e6d27", 16),
    border: "#fde08c",
  },
  dark: {
    solid: "#fac73d",
    hover: "#fbd253",
    active: "#ebb83d",
    on: "#33280e",
    fg: "#fac73d",
    fgHover: mix("#fac73d", 8),
    fgActive: mix("#fac73d", 16),
    border: "#b58b32",
  },
};
const info = {
  light: {
    solid: "#2769ab",
    hover: "#003f80",
    active: "#003366",
    on: "#ffffff",
    fg: "#2769ab",
    fgHover: mix("#2769ab", 8),
    fgActive: mix("#2769ab", 16),
    border: "#abcbee",
  },
  dark: {
    solid: "#4f93d7",
    hover: "#7fb1e5",
    active: "#2769ab",
    on: "#000d1a",
    fg: "#4f93d7",
    fgHover: mix("#4f93d7", 8),
    fgActive: mix("#4f93d7", 16),
    border: "#003f80",
  },
};

const severityBtn = (s, mode) => ({
  root: {
    background: s[mode].solid,
    hoverBackground: s[mode].hover,
    activeBackground: s[mode].active,
    borderColor: s[mode].solid,
    hoverBorderColor: s[mode].hover,
    activeBorderColor: s[mode].active,
    color: s[mode].on,
    hoverColor: s[mode].on,
    activeColor: s[mode].on,
    focusRing: { color: s[mode].solid, shadow: "none" },
  },
  outlined: {
    color: s[mode].fg,
    borderColor: s[mode].border,
    hoverBackground: s[mode].fgHover,
    activeBackground: s[mode].fgActive,
    hoverColor: s[mode].fg,
    activeColor: s[mode].fg,
  },
  text: {
    color: s[mode].fg,
    hoverBackground: s[mode].fgHover,
    activeBackground: s[mode].fgActive,
    hoverColor: s[mode].fg,
    activeColor: s[mode].fg,
  },
});

/* ─────────────────────────────────────────────────────────────────────
 * BOTÓN — esquema por modo
 *
 * [SWAP-LIGHT] = bloque activo en modo claro
 * [SWAP-DARK]  = bloque activo en modo oscuro
 *
 * Para intercambiar: mueve el bloque [SWAP-LIGHT] al modo oscuro
 * y el [SWAP-DARK] al modo claro.
 * ───────────────────────────────────────────────────────────────────── */
const buttonScheme = (mode) => {
  const isLight = mode === "light";

  // [SWAP-LIGHT] — azul de marca profundo para modo claro
  const lightPrimary = {
    background: "#173a6a",
    hoverBackground: "#1e4a86",
    activeBackground: "#234e8f",
    borderColor: "#173a6a",
    hoverBorderColor: "#1e4a86",
    activeBorderColor: "#234e8f",
    color: "#ffffff",
    hoverColor: "#ffffff",
    activeColor: "#ffffff",
    focusRing: { color: "#173a6a", shadow: "none" },
  };

  // [SWAP-DARK] — azul muy profundo para modo oscuro
  const darkPrimary = {
    background: "#002d5c",
    hoverBackground: "#001f40",
    activeBackground: "#00172f",
    borderColor: "#002d5c",
    hoverBorderColor: "#001f40",
    activeBorderColor: "#00172f",
    color: "#ffffff",
    hoverColor: "#ffffff",
    activeColor: "#ffffff",
    focusRing: { color: "#002d5c", shadow: "none" },
  };

  const primaryTokens = isLight ? lightPrimary : darkPrimary;
  const textPrincipal = isLight ? "#1a1a1a" : "#ffffff";
  const textSecondary = isLight ? "#5a5c61" : "#b3b3b7";
  const borderSecondary = isLight ? "#b0cfef" : "#b0cfef";

  return {
    root: {
      primary: primaryTokens,
      secondary: {
        background: mix(textSecondary, 12),
        hoverBackground: mix(textSecondary, 20),
        activeBackground: mix(textSecondary, 28),
        borderColor: "transparent",
        hoverBorderColor: "transparent",
        activeBorderColor: "transparent",
        color: textPrincipal,
        hoverColor: textPrincipal,
        activeColor: textPrincipal,
        focusRing: { color: textSecondary, shadow: "none" },
      },
      danger: severityBtn(danger, mode).root,
      success: severityBtn(success, mode).root,
      warn: severityBtn(warn, mode).root,
      info: severityBtn(info, mode).root,
    },
    outlined: {
      primary: {
        color: textPrincipal,
        borderColor: isLight ? "#004d99" : "#4d8fce",
        hoverBackground: mix(isLight ? "#002d5c" : "#4d8fce", 8),
        activeBackground: mix(isLight ? "#002d5c" : "#4d8fce", 16),
        hoverColor: textPrincipal,
        activeColor: textPrincipal,
      },
      secondary: {
        color: textSecondary,
        borderColor: borderSecondary,
        hoverBackground: mix(textSecondary, 8),
        activeBackground: mix(textSecondary, 16),
        hoverColor: textSecondary,
        activeColor: textSecondary,
      },
      danger: severityBtn(danger, mode).outlined,
      success: severityBtn(success, mode).outlined,
      warn: severityBtn(warn, mode).outlined,
      info: severityBtn(info, mode).outlined,
    },
    text: {
      primary: {
        color: isLight ? "#002d5c" : "#4d8fce",
        hoverBackground: mix(isLight ? "#002d5c" : "#4d8fce", 10),
        activeBackground: mix(isLight ? "#002d5c" : "#4d8fce", 18),
        hoverColor: isLight ? "#002d5c" : "#4d8fce",
        activeColor: isLight ? "#002d5c" : "#4d8fce",
      },
      secondary: {
        color: textSecondary,
        hoverBackground: mix(textSecondary, 8),
        activeBackground: mix(textSecondary, 16),
        hoverColor: textPrincipal,
        activeColor: textPrincipal,
      },
      danger: severityBtn(danger, mode).text,
      success: severityBtn(success, mode).text,
      warn: severityBtn(warn, mode).text,
      info: severityBtn(info, mode).text,
    },
  };
};

/* ─────────────────────────────────────────────────────────────────────
 * OPCIONES DE LISTA (Select, AutoComplete, MultiSelect…)
 * ───────────────────────────────────────────────────────────────────── */
const listOption = {
  color: "{primary.textSecondary}",
  icon: {
    color: "{primary.textSecondary}",
    focusColor: "#ffffff",
  },
  focusBackground: "{primary.500}",
  focusColor: "#ffffff",
  selectedBackground: "{primary.500}",
  selectedColor: "#ffffff",
  selectedFocusBackground: "{primary.500}",
  selectedFocusColor: "#ffffff",
};

/* ─────────────────────────────────────────────────────────────────────
 * MENÚS (Menu, TieredMenu, Menubar, PanelMenu, ContextMenu…)
 * ───────────────────────────────────────────────────────────────────── */
const navigation = {
  item: {
    focusBackground: mix("{primary.textSecondary}", 12),
    activeBackground: mix("{primary.textSecondary}", 18),
    color: "{primary.textPrincipal}",
    focusColor: "{primary.textPrincipal}",
    activeColor: "{primary.textPrincipal}",
    icon: {
      color: "{primary.textSecondary}",
      focusColor: "{primary.textPrincipal}",
      activeColor: "{primary.textPrincipal}",
    },
  },
  submenuLabel: { color: "{primary.textSecondary}" },
  submenuIcon: {
    color: "{primary.textSecondary}",
    focusColor: "{primary.textPrincipal}",
    activeColor: "{primary.textPrincipal}",
  },
};

/* ─────────────────────────────────────────────────────────────────────
 * OVERLAYS compartidos
 * ───────────────────────────────────────────────────────────────────── */
const overlayBase = {
  background: "{primary.elevated}",
  borderColor: mix("{primary.textSecondary}", 20),
  color: "{primary.textPrincipal}",
};

/* ─────────────────────────────────────────────────────────────────────
 * AUTO-COMPLETE — colorScheme (Aura los define aquí, no en raíz)
 * ───────────────────────────────────────────────────────────────────── */
const autocompleteScheme = () => ({
  dropdown: {
    background: "{primary.elevated}",
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

/* ═════════════════════════════════════════════════════════════════════
 * PRESET PRINCIPAL
 * ═════════════════════════════════════════════════════════════════════ */
export default definePreset(Aura, {
  semantic: {
    /* ── Paletas ── */
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

    /* ── Color scheme ── */
    colorScheme: {
      light: {
        surface: surfaceLight,
        primary: {
          /* tokens estándar PrimeVue */
          color: "#173a6a",
          contrastColor: "#ffffff",
          hoverColor: "#1e4a86",
          activeColor: "#234e8f",
          /* tokens propios */
          background: "#f0f0f4",
          elevated: "#fafafa",
          surface: "#f4f4f7",
          inset: "#e8e8ec",
          subtleLight: "#f7f7fa",
          subtle: "#ebebef",
          track: "#c8c8cc",
          banner: "#1e2a3a",
          border: "#004d99",
          borderSecondary: "#b0cfef",
          borderSoft: "#bfbfbf",
          borderSubtle: "#dedede",
          textPrincipal: "#1a1a1a",
          textSubprincipal: "#404040",
          textMuted: "#5a5c61",
          textSubtle: "#a8a8a8",
          textInverse: "#ffffff",
          textResaltado: "#b0cfef",
          botonAccion: "#1a1a1a",
          inverseColor: "#121212",
          autoFillBox: "#f4f4f7",
          successText: "#256728",
          successStrong: "#1f5a22",
          dangerText: "#c53b3b",
          dangerStrong: "#a72222",
          warningText: "#8e6d27",
          primaryContrast: "#ffffff",
          bannerText: "#f0f4f8",
          bannerBorder: "#2d4a6a",
          alertBackground: "#fef2f2", // rojo muy suave
          alertBorder: "#f5aaaa", // tu danger.200
          alertBg: "#fef2f2",
        },
        text: {
          color: "{primary.textPrincipal}",
          hoverColor: "{primary.textPrincipal}",
          mutedColor: "{primary.textMuted}",
          hoverMutedColor: "{primary.textPrincipal}",
        },
        content: {
          background: "{primary.surface}",
          hoverBackground: mix("{primary.textSecondary}", 8),
          borderColor: mix("{primary.textMuted}", 20),
          color: "{primary.textPrincipal}",
          hoverColor: "{primary.textPrincipal}",
        },
        overlay: {
          select: overlayBase,
          popover: overlayBase,
          modal: overlayBase,
        },
        list: { option: listOption },
        navigation,
        formField: {
          background: mix("{primary.surface}", 75),
          color: "{primary.textPrincipal}",
          placeholderColor: mix("{primary.textMuted}", 50),
        },
      },

      dark: {
        surface: surfaceDark,
        primary: {
          /* tokens estándar PrimeVue */
          color: "#002d5c",
          contrastColor: "#ffffff",
          hoverColor: "#001f40",
          activeColor: "#00172f",
          /* tokens propios */
          background: "#141418",
          elevated: "#2e2e34",
          surface: "#222226",
          inset: "#18181c",
          subtleLight: "#26262a",
          subtle: "#1e1e22",
          track: "#38383e",
          banner: "#1e2a3a",
          border: "#004d99",
          borderSecondary: "#b0cfef",
          borderSoft: "#323238",
          borderSubtle: "#2a2a30",
          textPrincipal: "#ffffff",
          textSubprincipal: "#d6d6da",
          textMuted: "#b3b3b7",
          textSubtle: "#66666e",
          textInverse: "#121212",
          textResaltado: "#b0cfef",
          botonAccion: "#ffffff",
          inverseColor: "#ffffff",
          autoFillBox: "#222226",
          successText: "#4caf50",
          successStrong: "#81c784",
          dangerText: "#e45555",
          dangerStrong: "#ef8080",
          warningText: "#fac73d",
          primaryContrast: "#ffffff",
          bannerText: "#f0f4f8",
          bannerBorder: "#2d4a6a",
          alertBackground: "#2d1515",
          alertBorder: "#651414", // tu danger.800
          alertBg: "#2d1515",
        },
        text: {
          color: "{primary.textPrincipal}",
          hoverColor: "{primary.textPrincipal}",
          mutedColor: "{primary.textMuted}",
          hoverMutedColor: "{primary.textPrincipal}",
        },
        content: {
          background: "{primary.surface}",
          hoverBackground: mix("{primary.textMuted}", 8),
          borderColor: mix("{primary.textMuted}", 20),
          color: "{primary.textPrincipal}",
          hoverColor: "{primary.textPrincipal}",
        },
        overlay: {
          select: overlayBase,
          popover: overlayBase,
          modal: overlayBase,
        },
        list: { option: listOption },
        navigation,
        formField: {
          background: mix("{primary.surface}", 75),
          color: "{primary.textPrincipal}",
          placeholderColor: mix("{primary.textMuted}", 50),
        },
      },
    },
  },

  /* ── Componentes ── */
  components: {
    button: {
      colorScheme: {
        light: buttonScheme("light"),
        dark: buttonScheme("dark"),
      },
    },

    togglebutton: {
      colorScheme: {
        light: {
          root: {
            background: mix("{primary.surface}", 75),
            color: "{primary.textPrincipal}",
            borderColor: "{primary.borderSecondary}",
            hoverBackground: mix("{primary.textMuted}", 8),
            hoverColor: "{primary.textPrincipal}",
            checkedBackground: "{primary.color}",
            checkedBorderColor: "{primary.color}",
            checkedColor: "{primary.contrastColor}",
          },
          content: { checkedBackground: "transparent" },
          icon: {
            color: "{primary.textMuted}",
            hoverColor: "{primary.textPrincipal}",
            checkedColor: "{primary.contrastColor}",
          },
        },
        dark: {
          root: {
            background: mix("{primary.surface}", 75),
            color: "{primary.textPrincipal}",
            borderColor: "{primary.borderSecondary}",
            hoverBackground: mix("{primary.textMuted}", 8),
            hoverColor: "{primary.textPrincipal}",
            checkedBackground: "{primary.color}",
            checkedBorderColor: "{primary.color}",
            checkedColor: "{primary.contrastColor}",
          },
          content: { checkedBackground: "transparent" },
          icon: {
            color: "{primary.textMuted}",
            hoverColor: "{primary.textPrincipal}",
            checkedColor: "{primary.contrastColor}",
          },
        },
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
        background: mix("{primary.textMuted}", 14),
        color: "{primary.textPrincipal}",
      },
      emptyMessage: { color: "{primary.textMuted}" },
    },

    datepicker: {
      colorScheme: {
        light: {
          panel: {
            background: "{primary.elevated}",
            borderColor: mix("{primary.textMuted}", 20),
          },
          header: {
            background: "{primary.elevated}",
            color: "{primary.textPrincipal}",
          },
          title: { color: "{primary.textPrincipal}" },
          weekDay: { color: "{primary.textMuted}" },
          date: {
            color: "{primary.textMuted}",
            hoverBackground: "{primary.500}",
            hoverColor: "#ffffff",
            selectedBackground: "{primary.color}",
            selectedColor: "{primary.contrastColor}",
          },
        },
        dark: {
          panel: {
            background: "{primary.elevated}",
            borderColor: mix("{primary.textMuted}", 20),
          },
          header: {
            background: "{primary.elevated}",
            color: "{primary.textPrincipal}",
          },
          title: { color: "{primary.textPrincipal}" },
          weekDay: { color: "{primary.textMuted}" },
          date: {
            color: "{primary.textMuted}",
            hoverBackground: "{primary.500}",
            hoverColor: "#ffffff",
            selectedBackground: "{primary.color}",
            selectedColor: "{primary.contrastColor}",
          },
        },
      },
    },
  },
});
