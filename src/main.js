import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

import PrimeVue from "primevue/config";
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
      cssLayer: {
        name: "primevue",
        order: "theme, base, primevue",
      },
    },
  },
});

app.mount("#app");
