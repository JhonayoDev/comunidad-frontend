<template>
  <div class="briku-progress" :style="{ '--briku-size': size, '--briku-progress': `${progress}%` }">
    <div class="briku-progress-logo">
      <div class="logo-track">
        <div class="roof"><div class="left"></div><div class="right"></div></div>
        <div class="top"><div></div><div></div></div>
        <div class="bottom"><div></div><div class="center"></div><div></div></div>
      </div>
      <div class="logo-fill">
        <div class="roof"><div class="left"></div><div class="right"></div></div>
        <div class="top"><div></div><div></div></div>
        <div class="bottom"><div></div><div class="center"></div><div></div></div>
      </div>
    </div>

    <div class="progress-status">
      <div class="percent-text">{{ Math.round(progress) }}%</div>
      <div class="sub-text">{{ statusText }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  size: { type: String, default: "160px" },
  progress: { type: Number, default: 0 },
  statusText: { type: String, default: "Subiendo archivo..." },
});

const progress = computed(() => Math.min(100, Math.max(0, props.progress)));
</script>

<style scoped>
.briku-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.briku-progress-logo {
  position: relative;
  width: var(--briku-size);
  height: 130px;
}

.logo-track {
  position: absolute;
  inset: 0;
  opacity: 0.3;
}

.logo-track .roof .left,
.logo-track .roof .right,
.logo-track .top div,
.logo-track .bottom div {
  background: var(--briku-blue, #173a6a);
}

.logo-fill {
  position: absolute;
  inset: 0;
  clip-path: inset(calc(100% - var(--briku-progress)) 0 0 0);
  transition: clip-path 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo-fill .roof .left,
.logo-fill .right,
.logo-fill .top div,
.logo-fill .bottom div {
  background: var(--briku-blue, #173a6a);
}

.roof {
  position: relative;
  height: 56px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15));
}

.left,
.right {
  position: absolute;
  width: 84px;
  height: 18px;
  top: 36px;
}

.left {
  left: 16px;
  transform-origin: left center;
  transform: rotate(-35deg);
  border-radius: 2px 0 0 2px;
}

.right {
  right: 16px;
  transform-origin: right center;
  transform: rotate(35deg);
  border-radius: 0 2px 2px 0;
}

.top {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 4px;
}

.top div {
  width: 56px;
  height: 24px;
  border-radius: 2px;
}

.bottom {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 4px;
}

.bottom > div {
  width: 27px;
  height: 24px;
  border-radius: 2px;
}

.bottom .center {
  width: 54px;
}

.progress-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.percent-text {
  font-size: 28px;
  font-weight: 800;
  color: var(--briku-blue, #173a6a);
  font-variant-numeric: tabular-nums;
}

.sub-text {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}
</style>