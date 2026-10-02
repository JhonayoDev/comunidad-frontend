import { ref } from "vue";

// Mismo mecanismo que la app (AppHeader.vue + AppHeaderLogin.vue):
// clase `.p-dark` en <html> + persistencia en localStorage("theme").
// PrimeVue la reconoce por `darkModeSelector: ".p-dark"` (main.js).
const esOscuro = ref(false);

function aplicar() {
  document.documentElement.classList.toggle("p-dark", esOscuro.value);
  try {
    localStorage.setItem("theme", esOscuro.value ? "dark" : "light");
  } catch (error) {
    console.error("[ui-lab] no se pudo persistir el tema", error);
  }
}

export function useUiLabTheme() {
  function initTema() {
    let saved = null;
    try {
      saved = localStorage.getItem("theme");
    } catch (error) {
      console.error("[ui-lab] no se pudo leer el tema guardado", error);
    }
    esOscuro.value = saved === "dark";
    document.documentElement.classList.toggle("p-dark", esOscuro.value);
  }

  function toggleTema() {
    esOscuro.value = !esOscuro.value;
    aplicar();
  }

  return { esOscuro, initTema, toggleTema };
}
