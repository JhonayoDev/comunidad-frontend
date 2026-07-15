import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

import colors from "./colors";

export default definePreset(Aura, {
  semantic: {
    /**
     * ===============================================================
     * PALETAS
     * ===============================================================
     *
     * Aquí solamente definimos las escalas de colores.
     *
     * NO estamos diciendo qué usa un botón,
     * un input o un dialog.
     *
     * Solamente estamos construyendo la paleta.
     */

    primary: {
      50: "#edf5fc",
      100: "#d7e7f8",
      200: "#b0cfef",
      300: "#7caedf",
      400: "#4d8fce",
      500: colors.light.primary,
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
      500: colors.light.success,
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
      500: colors.light.warning,
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
      500: colors.light.danger,
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
      500: colors.light.info,
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
         * Colores principales utilizados por botones,
         * focus, checkbox, links, etc.
         */
        primary: {
          color: colors.light.primary,
          hoverColor: colors.light.primaryHover,
          activeColor: colors.light.primaryActive,
          inverseColor: "#ffffff",
          autoFillBox: colors.light.background,
        },

        /**
         * Escala de superficies
         */
        surface: {
          0: "#ffffff",
          50: "#f5f5f5",

          100: colors.light.background,
          200: colors.light.surface,
          300: colors.light.border,

          400: "#a8a8a8",
          500: "#8a8a8a",

          600: colors.light.text.secondary,

          700: "#404040",

          800: "#2d2d2d",

          900: colors.light.text.primary,

          950: "#0d0d0d",
        },
      },

      dark: {
        /**
         * En modo oscuro usamos otro azul.
         */
        primary: {
          color: colors.dark.primary,
          hoverColor: colors.dark.primaryHover,
          activeColor: colors.dark.primaryActive,
          inverseColor: "#121212",
          autoFillBox: colors.dark.primaryActive,
        },

        surface: {
          0: colors.dark.surface,

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
      },
    },
  },
});
