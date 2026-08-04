import {
  instalarManejadorGlobalErrores,
  reportarError,
  marcarHito,
} from "./utils/frontendErrorReporter";
import { createApp } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin } from "@tanstack/vue-query";

import App from "./App.vue";
import router from "./router";
import { queryClient } from "./queryClient";

import PrimeVue from "primevue/config";
import ConfirmationService from "primevue/confirmationservice";
import { BrikuTheme } from "./theme";

import "primeicons/primeicons.css";
import "./style.css";
import { vPermiso } from "./directives/permiso";
import { iniciarCoordinadorRefresh } from "./utils/refreshCoordinator";
import { ocultarSplash } from "./utils/splash";

// Captura global de errores: se instala antes que cualquier otro módulo para
// atrapar fallos de import/render; el overlay evita pantallas blancas mudas.
instalarManejadorGlobalErrores();
marcarHito("boot:main");

const app = createApp(App);

// Cualquier error no capturado de un componente (setup/render/watch) se reporta
// al overlay + localStorage + beacon, en vez de quedar en blanco silencioso.
app.config.errorHandler = (err, _instancia, info) =>
  reportarError("vue", err, info);

app.use(createPinia());

app.use(router);

app.use(PrimeVue, {
  theme: {
    preset: BrikuTheme,
    options: {
      darkModeSelector: ".p-dark",
      cssLayer: {
        name: "primevue",
        order: "theme, base, primevue",
      },
    },
  },
  //  CONFIGURACIÓN DEL IDIOMA (LOCALE):
  locale: {
    firstDayOfWeek: 1, // 1 = Lunes como primer día de la semana (0 es Domingo)
    dayNames: [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ],
    dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    dayNamesMin: ["D", "L", "M", "X", "J", "V", "S"],
    monthNames: [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ],
    monthNamesShort: [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ],
    today: "Hoy",
    clear: "Limpiar",
    dateFormat: "dd/mm/yy", // Formato por defecto para la región
    weekHeader: "Sm",
  },
  pt: {
    card: {
      // Aplicas el fondo con transparencia a la raíz de la tarjeta
      root: { class: "bg-surface/75" },
      // Estandarizas tus paddings
      body: { class: "p-2" },
      title: { class: "pt-2 px-0 pb-0" },
      content: { class: "p-0" },
    },
    // Puedes hacer lo mismo con otros componentes:
    // button: { root: { class: '...' } }
    paginator: {
      // Contenedor principal
      root: {
        class:
          "bg-surface/75 border border-border/75 rounded-xl p-1 gap-1 flex items-center justify-center",
      },

      // Corregido: 'page' en lugar de 'pageButton'
      page: ({ context }) => ({
        class: [
          "p-1 m-1 transition-colors duration-200 font-medium  flex items-center justify-center",
          context.active
            ? "!bg-primary-active !text-white" // El '!' asegura que le gane al preset de PrimeVue
            : "!text-text-muted hover:!bg-primary-hover hover:!text-white",
        ],
      }),

      // Opcional: Estilos para las flechas de navegación (primero, anterior, siguiente, último)
      first: {
        class:
          "!text-text-muted hover:!bg-primary-hover hover:!text-white transition-colors p-2",
      },
      prev: {
        class:
          "!text-text-muted hover:!bg-primary-hover hover:!text-white transition-colors p-2",
      },
      next: {
        class:
          "!text-text-muted hover:!bg-primary-hover hover:!text-white transition-colors p-2",
      },
      last: {
        class:
          "!text-text-muted hover:!bg-primary-hover hover:!text-white transition-colors p-2",
      },
    },
    datepicker: {
      panel: {
        // !min-w-0 elimina el min-width forzado de 441px
        // !w-auto permite que tome el ancho natural del calendario
        class:
          "!min-w-0 !w-auto rounded-xl shadow-lg border border-border/75 p-3",
      },
      table: {
        class: "w-full border-collapse",
      },
    },
  },
});

app.use(ConfirmationService);
app.use(VueQueryPlugin, { queryClient });

app.directive("permiso", vPermiso);

// Coordina el refresh del access token (single-flight + Web Locks + refresh
// preventivo al volver de background + sincronización con IndexedDB/SW).
iniciarCoordinadorRefresh();

app.mount("#app");

marcarHito("boot:mounted");

// Desvanece el splash in-app cuando la app está montada y la animación terminó.
ocultarSplash();
