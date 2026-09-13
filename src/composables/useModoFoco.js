import { ref, onMounted, onUnmounted, watch } from "vue";

// Modo foco (Meta: distraction-free): expande una Card/tabla a pantalla
// completa con scroll propio; ESC o el botón lo desactiva y devuelve el
// scroll normal de la página.
export function useModoFoco() {
  const foco = ref(false);

  function alternar() {
    foco.value = !foco.value;
  }

  function salir() {
    foco.value = false;
  }

  function onTecla(e) {
    if (e.key === "Escape") salir();
  }

  watch(foco, (activo) => {
    document.body.style.overflow = activo ? "hidden" : "";
  });

  onMounted(() => window.addEventListener("keydown", onTecla));
  onUnmounted(() => {
    window.removeEventListener("keydown", onTecla);
    document.body.style.overflow = "";
  });

  return { foco, alternar, salir };
}
