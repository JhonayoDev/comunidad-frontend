import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

const ComunidadTheme = definePreset(Aura, {
  semantic: {
    /**
     * ============================================
     * Colores de la marca (Brand)
     * ============================================
     *
     * Estos colores son utilizados automáticamente
     * por botones, links, focus, checkbox, radio,
     * switches, paginator, etc.
     */
    primary: {
      50: "#eef4fa",
      100: "#d4e4f5",
      200: "#a8c9eb",
      300: "#7aafe1",
      400: "#4d94d6",
      500: "#004D99",
      600: "#004080",
      700: "#003366",
      800: "#00264d",
      900: "#001a33",
      950: "#000d1a",
    },

    /**
     * ============================================
     * Modo Claro
     * ============================================
     *
     * Descomentar cuando quieras personalizar
     * fondos, superficies y textos.
     */

    colorScheme: {
      light: {
        surface: {
          0: "#FFFFFF",
          50: "#F4F4F7",
          100: "#EAEAEE",
          200: "#E2E2E6",
          300: "#D1D1D6",
          400: "#A0A0A8",
          500: "#7A7A82",
          600: "#5A5C61",
          700: "#3D3D42",
          800: "#2A2A2E",
          900: "#1A1A1A",
          950: "#0D0D0F",
        },
      },
      dark: {
        surface: {
          0: "#121212",
          50: "#1A1A1E",
          100: "#222226",
          200: "#2C2C30",
          300: "#323238",
          400: "#4A4A50",
          500: "#66666E",
          600: "#808088",
          700: "#9999A0",
          800: "#B3B3B7",
          900: "#D6D6DA",
          950: "#F5F5F7",
        },
      },
    },

    /**
     * ============================================
     * Colores semánticos (opcional)
     * ============================================
     *
     * Success
     * Warning
     * Danger
     * Info
     *
     * Normalmente Aura ya tiene muy buenos colores,
     * así que probablemente nunca necesites tocar esto.
     */

    /*
    success: {},
    warning: {},
    danger: {},
    info: {},
    */
  },
});

/**
 * ===================================================
 * Tema corporativo de Comunidad
 * ===================================================
 *
 * No modificar colores directamente en los componentes.
 *
 * Si se desea cambiar la identidad visual de la aplicación,
 * hacerlo desde este archivo.
 *
 * Este tema controla automáticamente:
 *
 * ✓ Botones
 * ✓ Inputs
 * ✓ Checkbox
 * ✓ RadioButton
 * ✓ Select
 * ✓ DataTable
 * ✓ Dialog
 * ✓ Sidebar
 * ✓ Menús
 * ✓ Toast
 * ✓ ConfirmDialog
 * ✓ Calendar
 * ✓ Paginator
 * ✓ Focus
 *
 */

export default ComunidadTheme;
