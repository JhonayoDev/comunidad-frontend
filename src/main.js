import { createApp } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin } from "@tanstack/vue-query";

import App from "./App.vue";
import router from "./router";
import { queryClient } from "./queryClient";

import PrimeVue from "primevue/config";
import ConfirmationService from "primevue/confirmationservice";
import { ComunidadTheme } from "./theme";

import "primeicons/primeicons.css";
import "./style.css";

const app = createApp(App);

app.use(createPinia());

app.use(router);

app.use(PrimeVue, {
  theme: {
    preset: ComunidadTheme,
    options: {
      darkModeSelector: ".p-dark",
      cssLayer: {
        name: "primevue",
        order: "theme, base, primevue",
      },
    },
  },
  pt: {
    card: {
      // Estandarizas tus paddings
      body: { class: "p-2" },
      title: { class: "pt-2 px-0 pb-0" },
      content: { class: "p-0" },
    },
    // Puedes hacer lo mismo con otros componentes:
    // button: { root: { class: '...' } }
  },
});

app.use(ConfirmationService);
app.use(VueQueryPlugin, { queryClient });

app.mount("#app");
