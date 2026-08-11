<script setup>
import { onMounted, ref } from "vue";
import fondoweb from "@/assets/fondoweb.webp";

// Tope de seguridad: si la animación no dispara (reduced motion, error de
// CSS), el splash nunca debe quedarse pegado.
const MAX_ESPERA_MS = 5500;

const splashEl = ref(null);
const logoEl = ref(null);

onMounted(() => {
  const el = splashEl.value;
  if (!el) return;

  let animado = false;
  if (logoEl.value) {
    logoEl.value.addEventListener("animationend", (event) => {
      if (event.animationName === "brikuLogoExit") animado = true;
    });
  }

  const ocultar = () => {
    if (!el.isConnected) return;
    el.classList.add("hide");
    setTimeout(() => {
      document.getElementById("briku-splash")?.remove();
    }, 500);
  };

  const inicio = Date.now();
  const check = () => {
    if (animado || Date.now() - inicio > MAX_ESPERA_MS) {
      ocultar();
    } else {
      requestAnimationFrame(check);
    }
  };
  requestAnimationFrame(check);
});
</script>

<template>
  <div ref="splashEl" class="splash-screen">
    <div class="bg-image" :style="{ backgroundImage: `url(${fondoweb})` }" />
    <div class="bg-overlay" />

    <div class="stage">
      <div class="brand-text">Briku</div>

      <div ref="logoEl" class="logo">
        <div class="roof">
          <div class="left"></div>
          <div class="right"></div>
        </div>
        <div class="top">
          <div></div>
          <div></div>
        </div>
        <div class="bottom">
          <div></div>
          <div class="center"></div>
          <div></div>
        </div>
      </div>
    </div>
  </div>
</template>

<!--
  Style global (no scoped) a propósito: los keyframes scoped se re-nombran con
  hash y romperían la detección de `animationName === "brikuLogoExit"` en el
  animationend listener. Las clases del splash son únicas del componente.
-->
<style>
.splash-screen {
  --briku-blue: #173a6a;
  --briku-size: 220px;

  --briku-bg-blur: 10px;
  --briku-bg-opacity: 0.7;

  --briku-roof-time: 700ms;
  --briku-brick-time: 450ms;
  --briku-pulse-time: 500ms;
  --briku-exit-time: 800ms;

  position: fixed;
  inset: 0;
  background: #fff;
  transition:
    opacity 0.4s ease,
    visibility 0.4s;
  z-index: 9999;
  overflow: hidden;
}

.splash-screen.hide {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.splash-screen .bg-image {
  /* TODO (web/PC): al montar el componente se reemplaza el contenido de
     #briku-splash y en navegador de escritorio se percibe un salto en el
     fondo (la imagen desenfocada "pop" una vez); en móvil no se nota.
     Revisar en detalle: candidatos — repintado de filter:blur +
     transform:scale(1.08) durante el swap, o que el fallback estático de
     index.html y este componente no queden pixel-identicales. Si persiste,
     aplicar Opción B: no reemplazar el DOM (markup completo estático en
     index.html y el componente solo dispara las animaciones). */
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transform: scale(1.08);
  filter: blur(var(--briku-bg-blur));
  z-index: 1;
}

.splash-screen .bg-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, var(--briku-bg-opacity));
  z-index: 2;
}

.splash-screen .stage {
  /* Llena el viewport y centra el logo + texto: misma técnica y mismo punto
     de centro que el fallback estático de index.html (.stage idéntico), así
     no hay salto de posición entre el Briku estático y el animado. */
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
}

.splash-screen .brand-text {
  position: absolute;
  font-size: 72px;
  font-weight: 800;
  color: var(--briku-blue);
  letter-spacing: 4px;
  line-height: 1.1;
  /* Misma fuente que el fallback estático de index.html para que el texto
     tenga exactamente las mismas métricas en ambas fases (sin salto). */
  font-family:
    -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
  /* Visible desde el inicio (coincide con el fallback estático): evita el
     parpadeo/salto al montar. Se desvanece justo cuando empieza la animación
     de los ladrillos (2.0s), para no quedar encima del logo. */
  opacity: 1;
  animation: brikuTextOut 400ms ease-out 1.6s forwards;
}

@keyframes brikuTextOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(1.15);
    filter: blur(8px);
  }
}

.splash-screen .logo {
  width: var(--briku-size);
  animation:
    brikuLogoPulse var(--briku-pulse-time) ease 3.9s forwards,
    brikuLogoExit var(--briku-exit-time) cubic-bezier(0.4, 0, 0.2, 1) 4.5s
      forwards;
}

.splash-screen .roof {
  position: relative;
  height: 78px;
  z-index: 3;
  filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.22));
}

.splash-screen .left,
.splash-screen .right {
  position: absolute;
  width: 116px;
  height: 25px;
  background: var(--briku-blue);
  top: 50px;
  opacity: 0;
}

.splash-screen .left {
  --angle: -35deg;
  left: 22px;
  transform-origin: left center;
  border-radius: 2px 0 0 2px;
  animation: brikuRoofLeft var(--briku-roof-time)
    cubic-bezier(0.22, 1.18, 0.41, 1) 3.1s forwards;
}

.splash-screen .right {
  --angle: 35deg;
  right: 22px;
  transform-origin: right center;
  border-radius: 0 2px 2px 0;
  animation: brikuRoofRight var(--briku-roof-time)
    cubic-bezier(0.22, 1.18, 0.41, 1) 3.1s forwards;
}

.splash-screen .top {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.splash-screen .top div {
  width: 78px;
  height: 34px;
  background: var(--briku-blue);
  border-radius: 2px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.18);
  opacity: 0;
}

.splash-screen .bottom {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 6px;
}

.splash-screen .bottom > div {
  width: 38px;
  height: 34px;
  background: var(--briku-blue);
  border-radius: 2px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12);
  opacity: 0;
}

.splash-screen .bottom .center {
  width: 74px;
}

.splash-screen .bottom div:nth-child(1) {
  animation: brikuBrickLeft var(--briku-brick-time) ease-out 2s forwards;
}
.splash-screen .bottom div:nth-child(2) {
  animation: brikuBrickCenter var(--briku-brick-time) ease-out 2.2s forwards;
}
.splash-screen .bottom div:nth-child(3) {
  animation: brikuBrickRight var(--briku-brick-time) ease-out 2.4s forwards;
}

.splash-screen .top div:nth-child(1) {
  animation: brikuBrickLeft var(--briku-brick-time) ease-out 2.6s forwards;
}
.splash-screen .top div:nth-child(2) {
  animation: brikuBrickRight var(--briku-brick-time) ease-out 2.8s forwards;
}

@keyframes brikuRoofLeft {
  from {
    opacity: 0;
    transform: translateY(-120px) rotate(var(--angle));
  }
  75% {
    opacity: 1;
    transform: translateY(10px) rotate(var(--angle));
  }
  to {
    opacity: 1;
    transform: translateY(0) rotate(var(--angle));
  }
}

@keyframes brikuRoofRight {
  from {
    opacity: 0;
    transform: translateY(-120px) rotate(var(--angle));
  }
  75% {
    opacity: 1;
    transform: translateY(10px) rotate(var(--angle));
  }
  to {
    opacity: 1;
    transform: translateY(0) rotate(var(--angle));
  }
}

@keyframes brikuBrickLeft {
  from {
    opacity: 0;
    transform: translateX(-40px) scale(0.5);
  }
  70% {
    transform: translateX(4px) scale(1.05);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes brikuBrickRight {
  from {
    opacity: 0;
    transform: translateX(40px) scale(0.5);
  }
  70% {
    transform: translateX(-4px) scale(1.05);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes brikuBrickCenter {
  from {
    opacity: 0;
    transform: translateY(35px) scale(0.5);
  }
  70% {
    transform: translateY(-3px) scale(1.05);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes brikuLogoPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes brikuLogoExit {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(calc(-54vw + 49px), calc(-52vh + 44px)) scale(0.18);
    opacity: 0.4;
  }
}
</style>
