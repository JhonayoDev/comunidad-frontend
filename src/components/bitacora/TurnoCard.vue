<script setup>
import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import { useConfirm } from "primevue/useconfirm";

const confirm = useConfirm();

const props = defineProps({
  turno: Object,
  loading: Boolean,
  accionesLabels: Object,
  confirmMessages: Object,
  eventoLabel: Function,
});

const emit = defineEmits(["action", "novedad"]);

function esNovedad(accion) {
  return accion === "NOVEDAD";
}

function handleClick(accion) {
  if (esNovedad(accion)) {
    emit("novedad");
    return;
  }
  const msg = props.confirmMessages?.[accion];
  if (msg) {
    confirm.require({
      message: msg,
      header: "Confirmar acción",
      icon: "pi pi-exclamation-triangle",
      rejectLabel: "Cancelar",
      acceptLabel: "Confirmar",
      accept: () => emit("action", accion),
    });
    return;
  }
  emit("action", accion);
}
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <span
          class="inline-block w-3 h-3 border-round"
          :style="{ background: turno?.enTurno ? 'var(--p-green-500)' : 'var(--p-gray-400)' }"
        ></span>
        <span class="font-bold">{{ turno?.enTurno ? "En turno" : "Sin turno activo" }}</span>
      </div>
    </template>
    <template #content>
      <div class="flex flex-col gap-3">
        <div v-if="eventoLabel?.(turno)" class="flex items-center gap-2">
          <i class="pi pi-clock text-surface-400 text-sm" />
          <span class="text-sm text-surface-500">{{ eventoLabel(turno) }}</span>
        </div>
        <Tag v-if="turno?.enColacion" value="En colación" severity="warn" size="small" />
        <div class="flex gap-2 flex-wrap">
          <Button
            v-for="accion in turno?.accionesDisponibles || []"
            :key="accion"
            :label="accionesLabels?.[accion]?.label || accion"
            :icon="accionesLabels?.[accion]?.icon"
            :severity="accionesLabels?.[accion]?.severity"
            size="small"
            :loading="loading"
            @click="handleClick(accion)"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
