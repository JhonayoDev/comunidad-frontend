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
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
      950: "#172554",
    },

    /**
     * ============================================
     * Modo Claro
     * ============================================
     *
     * Descomentar cuando quieras personalizar
     * fondos, superficies y textos.
     */

    /*
    colorScheme: {
      light: {
        surface: {
          0: "#ffffff",
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#eeeeee",
          300: "#e0e0e0",
          400: "#bdbdbd",
          500: "#9e9e9e",
          600: "#757575",
          700: "#616161",
          800: "#424242",
          900: "#212121",
          950: "#111111"
        }
      },
    },
    */

    /**
     * ============================================
     * Modo Oscuro
     * ============================================
     *
     * Se utiliza automáticamente cuando actives
     * el selector de tema oscuro.
     */

    /*
    colorScheme: {
      dark: {
        surface: {
          0: "#121212",
          50: "#1a1a1a",
          100: "#222222",
          200: "#2c2c2c",
          300: "#363636",
          400: "#4a4a4a",
          500: "#666666",
          600: "#808080",
          700: "#999999",
          800: "#b3b3b3",
          900: "#d6d6d6",
          950: "#f5f5f5"
        }
      }
    }
    */

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
