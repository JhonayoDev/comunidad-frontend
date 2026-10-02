<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import Card from "primevue/card";

// Lee las variables CSS `--p-*` REALES resueltas por el navegador
// (vienen del preset BrikuTheme en src/theme/prime-theme.js).
// `version` se incrementa al cambiar claro/oscuro para releer valores.
const props = defineProps({
  version: { type: Number, default: 0 },
});

const TONOS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const PALETAS = ["primary", "success", "warning", "danger", "info"];

const valores = ref({}); // { "primary-500": "#265e95", ... }

function leerVariable(nombre) {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  } catch (error) {
    console.error(`[ui-lab] no se pudo leer ${nombre}`, error);
    return "";
  }
}

function leerTodas() {
  const mapa = {};
  for (const paleta of PALETAS) {
    for (const tono of TONOS) {
      mapa[`${paleta}-${tono}`] = leerVariable(`--p-${paleta}-${tono}`);
    }
  }
  for (const tono of ["0", ...TONOS]) {
    mapa[`surface-${tono}`] = leerVariable(`--p-surface-${tono}`);
  }
  valores.value = mapa;
}

// Texto legible sobre cada muestra (luminancia simple del hex).
function textoContraste(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "var(--p-primary-text-principal)";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.45 ? "#1a1a1a" : "#ffffff";
}

onMounted(leerTodas);
watch(
  () => props.version,
  async () => {
    await nextTick();
    leerTodas();
  },
);
</script>

<template>
  <div class="flex flex-col gap-5">
    <Card v-for="paleta in [...PALETAS, 'surface']" :key="paleta">
      <template #title>
        <span class="text-base font-bold">--p-{{ paleta }}-*</span>
      </template>
      <template #content>
        <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
          <div
            v-for="tono in (paleta === 'surface' ? ['0', ...TONOS] : TONOS)"
            :key="tono"
            class="rounded-lg border border-border p-2 flex flex-col gap-1 min-h-16"
            :style="{ backgroundColor: valores[`${paleta}-${tono}`] || 'transparent' }"
          >
            <span
              class="text-xs font-bold"
              :style="{ color: textoContraste(valores[`${paleta}-${tono}`]) }"
            >
              {{ tono }}
            </span>
            <span
              class="text-[10px] break-all leading-tight"
              :style="{ color: textoContraste(valores[`${paleta}-${tono}`]) }"
            >
              {{ valores[`${paleta}-${tono}`] || "(sin valor)" }}
            </span>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
