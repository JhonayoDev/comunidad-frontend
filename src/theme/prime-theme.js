import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

import colors from "./colors";

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
     *
     * Aquí le decimos a PrimeVue qué colores utilizar
     * en Light y Dark.
     */

    colorScheme: {
      light: {
        /**
         * Colores principales utilizados,
         * focus, checkbox, links, etc.
         */
        primary: {
          background: "#FFFFFF",
          surface: "#F4F4F7",
          backgroundInverse: "#222226",
          color: "#003366",
          border: "#004d99",
          borderSecondary: "#b0cfef",
          hoverColor: "{primary-500}",
          activeColor: "#00488f",
          textPrincipal: "#1a1a1a",
          textSecondary: "#5a5c61",
          textInverse: "{info-50}",
          textResaltado: "#b0cfef",
          botonAccion: "{primary.textPrincipal}",
          inverseColor: "#121212",
          autoFillBox: "{primary.surface}",
        },

        /**
         * Escala de superficies
         */
        surface: {
          0: "{primary.textPrincipal}",
          50: "#f5f5f5",

          100: colors.light.background,
          200: colors.light.border,
          300: "#5a5c61",

          400: "#a8a8a8",
          500: "#8a8a8a",

          600: colors.light.text.secondary,

          700: "#404040",

          800: "#2d2d2d",

          900: colors.light.text.primary,

          950: "#0d0d0d",
        },
        formField: {
          background: "color-mix(in srgb, {primary.surface} 75%, transparent)",
          color: "{primary.textPrincipal}",
          placeholderColor:
            "color-mix(in srgb, {primary.textSecondary} 50%, transparent)",
        },
      },

      dark: {
        /**
         * En modo oscuro usamos otro azul.
         */
        primary: {
          background: "#121212",
          surface: "#222226",
          backgroundInverse: "#F4F4F7",
          color: "#003366",
          border: "#004d99",
          borderSecondary: "#b0cfef",
          hoverColor: "{primary-500}",
          activeColor: "#00488f",
          textPrincipal: "#ffffff",
          textSecondary: "#b3b3b7",
          textInverse: "{info-600}",
          textResaltado: "#b0cfef",
          botonAccion: "{primary.textPrincipal}",
          inverseColor: "#121212",
          autoFillBox: "{primary.surface}",
        },

        surface: {
          0: "{primary.textPrincipal}",

          50: "#181818",

          100: colors.dark.background,

          200: colors.dark.border,

          300: "#4a4a50",

          400: "#66666e",

          500: "#808088",

          600: colors.dark.text.secondary,

          700: "#d6d6da",

          800: "#ececef",

          900: colors.dark.text.primary,

          950: "#ffffff",
        },
        formField: {
          background: "color-mix(in srgb, {primary.surface} 75%, transparent)",
          color: "{primary.textPrincipal}",
          placeholderColor:
            "color-mix(in srgb, {primary.textSecondary} 50%, transparent)",
        },
      },
    },
  },
  /**
   * ===============================================================
   * COMPONENTS
   * ===============================================================
   */
  components: {
    button: {
      text: {
        secondary: {
          hoverBackground: "transparent",
          activeBackground: "transparent",
        },
      },
    },
    popover: {
      root: {
        background: "color-mix(in srgb, {primary.surface} 98%, transparent)",
        borderColor:
          "color-mix(in srgb, {primary.textSecondary} 20%, transparent)",
        color: "{primary.textPrincipal}",
        gutter: "10px",
        arrowOffset: "1.25rem",
      },
    },
    select: {
      overlay: {
        background: "color-mix(in srgb, {primary.surface} 98%, transparent)",
        color: "{primary.textPrincipal}",
      },
      option: {
        color: "{primary.textSecondary}",
        focusBackground: "{primary.hoverColor}",
        focusColor: "{primary.textPrincipal}",
        selectedBackground: "{primary.hoverColor}",
        selectedColor: "{primary.textPrincipal}",
        selectedFocusBackground: "{primary.hoverColor}",
        selectedFocusColor: "{primary.textResaltado}",
      },
    },
    autocomplete: {
      overlay: {
        background: "color-mix(in srgb, {primary.surface} 98%, transparent)",
        color: "{primary.textPrincipal}",
      },
      option: {
        color: "{primary.textSecondary}",
        focusBackground: "{primary.hoverColor}",
        focusColor: "{primary.textPrincipal}",
        selectedBackground: "{primary.hoverColor}",
        selectedColor: "{primary.textPrincipal}",
        selectedFocusBackground: "{primary.hoverColor}",
        selectedFocusColor: "{primary.textResaltado}",
      },
      dropdown: {
        background: "color-mix(in srgb, {primary.surface} 98%, transparent)",
        color: "{primary.textPrincipal}",
        hoverBackground: "{primary.hoverColor}",
        hoverColor: "{primary.textPrincipal}",
        activeBackground: "{primary.activeColor}",
        activeColor: "{primary.textPrincipal}",
      },
      chip: {
        focusBackground: "{primary.hoverColor}",
        focusColor: "{primary.textPrincipal}",
      },
    },
    //TODO: revisar los tokens para poder ajustar bien los colores
    datepicker: {
      panel: {
        background: "color-mix(in srgb, {primary.surface} 98%, transparent)",
        bordercolor:
          "color-mix(in srgb, {primary.textSecondary} 20%, transparent)",
      },
      header: {
        background: "color-mix(in srgb, {primary.surface} 98%, transparent)",
        color: "#c53b3b",
      },
      title: {
        color: "#c53b3b",
      },
      weekday: {
        color: "{primary.textSecondary}", // días de la semana (lu, ma, mi...)
      },
      date: {
        color: "{primary.textSecondary}", // días de la semana (lu, ma, mi...)
        hoverbackground: "{primary.hoverColor}", // hover sobre un día
        hovercolor: "{primary.textPrincipal}",
        selectedbackground: "{primary.color}", // fondo del día seleccionado
        selectedcolor: "#ffffff",
      },
    },
  },
});
