import { ref, computed, onMounted, onUnmounted } from "vue";

function bindChange(mql, fn) {
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", fn);
  } else if (typeof mql.addListener === "function") {
    mql.addListener(fn);
  }
}

function unbindChange(mql, fn) {
  if (typeof mql.removeEventListener === "function") {
    mql.removeEventListener("change", fn);
  } else if (typeof mql.removeListener === "function") {
    mql.removeListener(fn);
  }
}

export function usePwaStandalone() {
  // -------------------------------------------------------------
  // ⚠️ MODO DESARROLLO / FIREFOX:
  // `import.meta.env.DEV` fuerza la barra solo en dev (pnpm dev).
  // En producción (pnpm build) se usa la detección real.
  // -------------------------------------------------------------

  const isStandalone = ref(false);
  const esTouch = ref(false);

  let displayMql = null;
  let touchMql = null;

  function evaluar() {
    isStandalone.value =
      displayMql?.matches === true || window.navigator?.standalone === true;
    esTouch.value = touchMql?.matches === true || navigator.maxTouchPoints > 0;
  }

  onMounted(() => {
    displayMql = window.matchMedia("(display-mode: standalone)");
    touchMql = window.matchMedia("(pointer: coarse)");
    evaluar();

    bindChange(displayMql, evaluar);
    window.addEventListener("pageshow", evaluar);
    window.addEventListener("focus", evaluar);
    window.addEventListener("appinstalled", evaluar);
  });

  onUnmounted(() => {
    unbindChange(displayMql, evaluar);
    window.removeEventListener("pageshow", evaluar);
    window.removeEventListener("focus", evaluar);
    window.removeEventListener("appinstalled", evaluar);
    displayMql = null;
    touchMql = null;
  });

  // En dev (import.meta.env.DEV) ignora el check para depurar el diseño
  const mostrar = computed(
    () => import.meta.env.DEV || (isStandalone.value && esTouch.value),
  );

  return { isStandalone, esTouch, mostrar };
}
