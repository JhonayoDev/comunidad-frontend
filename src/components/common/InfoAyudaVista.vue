<script setup>
import { ref } from "vue";
import Button from "primevue/button";
import Popover from "primevue/popover";

const props = defineProps({
  titulo: {
    type: String,
    default: "Ayuda",
  },
  secciones: {
    type: Array,
    required: true,
  },
});

const op = ref(null);

function toggle(event) {
  op.value.toggle(event);
}
</script>

<template>
  <div class="inline-flex items-center">
    <Button
      icon="pi pi-info-circle"
      severity="secondary"
      text
      rounded
      aria-label="Ver ayuda"
      v-tooltip.top="'¿Qué significa cada opción?'"
      @click="toggle"
    />
    <Popover ref="op" :style="{ width: '340px', maxWidth: '90vw' }">
      <div class="flex flex-col gap-3 p-1">
        <div class="flex items-center justify-between gap-2 shrink-0">
          <div class="flex items-center gap-2">
            <i class="pi pi-question-circle text-primary" />
            <span class="font-bold text-sm">{{ titulo }}</span>
          </div>
          <Button
            icon="pi pi-times"
            severity="secondary"
            text
            rounded
            size="small"
            aria-label="Cerrar ayuda"
            @click="op.hide()"
          />
        </div>
        <div class="flex flex-col gap-3 overflow-y-auto pr-1" style="max-height: 55vh">
          <div v-for="seccion in secciones" :key="seccion.titulo" class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-surface-500 uppercase">{{ seccion.titulo }}</span>
            <div v-for="item in seccion.items" :key="item.label" class="flex flex-col text-sm">
              <span class="font-medium">{{ item.label }}</span>
              <span class="text-xs text-surface-400">{{ item.desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </Popover>
  </div>
</template>
