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
  /** Disparador mínimo (icono suelto) para cabeceras de tabla o leyendas. */
  compact: {
    type: Boolean,
    default: false,
  },
  ariaLabel: {
    type: String,
    default: "Ver ayuda",
  },
  tooltip: {
    type: String,
    default: "¿Qué significa cada opción?",
  },
});

const op = ref(null);

function toggle(event) {
  op.value.toggle(event);
}
</script>

<template>
  <div class="inline-flex items-center">
    <button
      v-if="compact"
      type="button"
      class="inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 align-middle text-text-muted hover:text-text"
      :aria-label="ariaLabel"
      v-tooltip.top="tooltip"
      @click="toggle"
    >
      <i class="pi pi-info-circle text-[0.7rem]" />
    </button>
    <Button
      v-else
      variant="text"
      icon="pi pi-info-circle"
      severity="secondary"
      rounded
      :aria-label="ariaLabel"
      v-tooltip.top="tooltip"
      @click="toggle"
    />
    <Popover ref="op" :style="{ width: '340px', maxWidth: '90vw' }">
      <div class="flex flex-col gap-3 p-1">
        <div class="flex items-center justify-between gap-2 shrink-0">
          <div class="flex items-center gap-2">
            <i class="pi pi-question-circle text-primary" />
            <span class="font-bold text-sm">{{ titulo }}</span>
          </div>
          <Button variant="text"
            icon="pi pi-times"
            severity="secondary"
            rounded
            size="small"
            aria-label="Cerrar ayuda"
            @click="op.hide()"
          />
        </div>
        <div class="flex flex-col gap-3 overflow-y-auto pr-1" style="max-height: 55vh">
          <div v-for="seccion in secciones" :key="seccion.titulo" class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-text-muted uppercase">{{ seccion.titulo }}</span>
            <div v-for="item in seccion.items" :key="item.label" class="flex flex-col text-sm">
              <span class="font-medium">{{ item.label }}</span>
              <span class="text-xs text-text-subprincipal">{{ item.desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </Popover>
  </div>
</template>
