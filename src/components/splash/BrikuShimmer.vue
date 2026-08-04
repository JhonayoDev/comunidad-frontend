<template>
  <div class="briku-shimmer" :style="{ '--briku-size': size }">
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
</template>

<script setup>
defineProps({
  size: { type: String, default: "140px" },
});
</script>

<style scoped>
.briku-shimmer {
  width: var(--briku-size);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.roof {
  position: relative;
  height: 50px;
  width: 100%;
}

.left,
.right {
  position: absolute;
  width: 74px;
  height: 16px;
  background: var(--briku-blue, #173a6a);
  top: 32px;
  border-radius: 2px;
}

.left {
  left: 14px;
  transform: rotate(-35deg);
  animation: brikuShimmerWave 1.6s ease-in-out infinite 0.4s;
}

.right {
  right: 14px;
  transform: rotate(35deg);
  animation: brikuShimmerWave 1.6s ease-in-out infinite 0.5s;
}

.top,
.bottom {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.top div {
  width: 50px;
  height: 22px;
  background: var(--briku-blue, #173a6a);
  border-radius: 2px;
}

.top div:nth-child(1) {
  animation: brikuShimmerWave 1.6s ease-in-out infinite 0.2s;
}
.top div:nth-child(2) {
  animation: brikuShimmerWave 1.6s ease-in-out infinite 0.3s;
}

.bottom {
  margin-top: 4px;
}

.bottom > div {
  width: 24px;
  height: 22px;
  background: var(--briku-blue, #173a6a);
  border-radius: 2px;
}

.bottom .center {
  width: 48px;
}

.bottom div:nth-child(1) {
  animation: brikuShimmerWave 1.6s ease-in-out infinite 0s;
}
.bottom div:nth-child(2) {
  animation: brikuShimmerWave 1.6s ease-in-out infinite 0.1s;
}
.bottom div:nth-child(3) {
  animation: brikuShimmerWave 1.6s ease-in-out infinite 0.2s;
}

/* Ola de llenado / brillo: barrido de gradiente de brillo sobre el logo */
@keyframes brikuShimmerWave {
  0% {
    opacity: 0.3;
    filter: brightness(0.8);
  }
  50% {
    opacity: 1;
    filter: brightness(1.4);
    transform: scale(1.03);
  }
  100% {
    opacity: 0.3;
    filter: brightness(0.8);
  }
}
</style>