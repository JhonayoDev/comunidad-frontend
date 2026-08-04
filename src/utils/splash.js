/**
 * splash.js
 *
 * Oculta el splash screen in-app (definido inline en index.html) una vez que
 * la app está montada y la animación del logo terminó.
 *
 * El splash vive como hermano de #app en el HTML (no dentro de #app, porque
 * Vue reemplaza el contenido de #app al montar). Se pinta antes de que cargue
 * el bundle JS y cubre el tiempo de descarga del bundle + el primer render.
 *
 * index.html expone dos globals:
 *   - window.__brikuSplashAnimado  → true cuando termina `brikuLogoExit`
 *   - window.__brikuOcultarSplash  → añade `.hide` (fade-out) y elimina el nodo
 *
 * Llamar a ocultarSplash() desde main.js justo después de app.mount("#app").
 */

const MAX_ESPERA_MS = 5500;

export function ocultarSplash() {
  const el = document.getElementById("briku-splash");
  if (!el) return;

  const ocultar = () => {
    if (typeof window.__brikuOcultarSplash === "function") {
      window.__brikuOcultarSplash();
    }
  };

  // Si la animación ya terminó (app lenta, animación rápida), oculta ya.
  if (window.__brikuSplashAnimado === true) {
    ocultar();
    return;
  }

  // Espera a que termine la animación, con tope de seguridad para que el
  // splash nunca se quede pegado si el evento animationend no dispara.
  const inicio = Date.now();
  const check = () => {
    if (window.__brikuSplashAnimado === true || Date.now() - inicio > MAX_ESPERA_MS) {
      ocultar();
    } else {
      requestAnimationFrame(check);
    }
  };
  requestAnimationFrame(check);
}