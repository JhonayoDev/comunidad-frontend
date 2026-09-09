/**
 * splash.js
 *
 * Orquesta el cierre del splash inline de index.html (#briku-splash).
 * El splash NO se reemplaza desde JS (eso causaba flash blanco); solo se
 * oculta cuando la app ya está lista y, en modo splash completo, cuando la
 * animación de salida del logo terminó.
 *
 * Dos modos según la clase .modo-carga puesta por el script inline:
 *  - modo-carga (F5 en app / rutas privadas): el loader no tiene animación
 *    de salida → ocultar apenas la app esté lista.
 *  - modo normal (login / primera apertura): apuntar --briku-exit-x/y al
 *    logo del header (.app-logo) para la fusión y esperar a que termine
 *    `brikuLogoExit`.
 */

const MAX_ESPERA_MS = 8000;
const MAX_ESPERA_HEADER_MS = 2000;

export function iniciarCierreSplash() {
  const splash = document.getElementById("briku-splash");
  if (!splash || !splash.isConnected) return;

  const modoCarga = splash.classList.contains("modo-carga");

  // En modo carga no hay animación de logo → ocultable apenas lista.
  let animacionLogoTerminada = modoCarga;

  const logo = splash.querySelector(".splash-stage .logo");
  if (logo) {
    logo.addEventListener("animationend", (event) => {
      if (event.animationName === "brikuLogoExit") {
        animacionLogoTerminada = true;
      }
    });
  }

  // Apunta la salida del logo al ícono del header (solo modo splash completo).
  // El header lo monta la app; se reintenta hasta que exista.
  const inicioBusquedaHeader = Date.now();
  const apuntarLogoHeader = () => {
    const headerLogo = document.querySelector(".app-logo");
    if (headerLogo) {
      const r = headerLogo.getBoundingClientRect();
      splash.style.setProperty(
        "--briku-exit-x",
        `${r.left + r.width / 2 - window.innerWidth / 2}px`,
      );
      splash.style.setProperty(
        "--briku-exit-y",
        `${r.top + r.height / 2 - window.innerHeight / 2}px`,
      );
      return;
    }
    if (Date.now() - inicioBusquedaHeader < MAX_ESPERA_HEADER_MS) {
      requestAnimationFrame(apuntarLogoHeader);
    }
  };
  requestAnimationFrame(apuntarLogoHeader);

  const ocultar = () => {
    if (!splash.isConnected) return;
    splash.classList.add("hide");
    setTimeout(() => splash.remove(), 500);
  };

  // Espera a que la app esté lista (main.js la llama tras router.isReady)
  // y a que la animación de salida termine; tope de seguridad.
  const inicio = Date.now();
  const check = () => {
    const expiro = Date.now() - inicio > MAX_ESPERA_MS;
    if (animacionLogoTerminada || expiro) {
      ocultar();
    } else {
      requestAnimationFrame(check);
    }
  };
  requestAnimationFrame(check);
}
