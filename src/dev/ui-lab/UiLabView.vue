<script setup>
import { ref, onMounted } from "vue";
import Button from "primevue/button";
import Select from "primevue/select";
import { useUiLabTheme } from "./useUiLabTheme";
import UiLabPaletas from "./UiLabPaletas.vue";
import UiLabComponentes from "./UiLabComponentes.vue";

const { esOscuro, initTema, toggleTema } = useUiLabTheme();

// Cada toggle de tema incrementa la versión para que las paletas
// relean las variables CSS reales ya resueltas en el nuevo modo.
const temaVersion = ref(0);

const ancho = ref("fluido"); // fluido | movil
const anchos = [
  { label: "Escritorio (fluido)", value: "fluido" },
  { label: "Móvil (390 px)", value: "movil" },
];

function onToggleTema() {
  toggleTema();
  temaVersion.value += 1;
}

onMounted(() => {
  initTema();
});
</script>

<template>
  <div class="min-h-screen bg-background text-text p-4">
    <!-- Toolbar del lab -->
    <div
      class="sticky top-0 z-10 bg-surface border border-border rounded-xl p-3 mb-4 flex flex-wrap items-center gap-3"
    >
      <span class="font-bold">UI Lab</span>
      <span class="text-xs text-text-muted">solo desarrollo · no entra al build</span>
      <div class="flex-1" />
      <Select
        v-model="ancho"
        :options="anchos"
        optionLabel="label"
        optionValue="value"
        class="w-52"
      />
      <Button
        :icon="esOscuro ? 'pi pi-sun' : 'pi pi-moon'"
        :label="esOscuro ? 'Modo claro' : 'Modo oscuro'"
        severity="secondary"
        @click="onToggleTema"
      />
    </div>

    <!-- Contenedor con ancho conmutable -->
    <div
      class="mx-auto transition-all"
      :class="ancho === 'movil' ? 'max-w-[390px] border border-border rounded-xl p-2' : 'max-w-4xl'"
    >
      <h2 class="text-lg font-bold mb-3">Paletas del tema (variables --p-* reales)</h2>
      <UiLabPaletas :version="temaVersion" />

      <h2 class="text-lg font-bold mt-6 mb-3">Componentes de prueba</h2>
      <UiLabComponentes />
    </div>
  </div>
</template>
