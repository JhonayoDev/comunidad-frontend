<script setup>
import { ref, computed } from "vue";
import Card from "primevue/card";
import Button from "primevue/button";
import { useConfirm } from "primevue/useconfirm";
import { formatearHora } from "@/utils/fechas";

const confirm = useConfirm();

const props = defineProps({
  turno: Object,
  loading: Boolean,
  accionesLabels: Object,
  confirmMessages: Object,
});

const emit = defineEmits(["action"]);

const collapsed = ref(true);
const accionesFiltradas = computed(() =>
  (props.turno?.accionesDisponibles || []).filter((a) => a !== "NOVEDAD"),
);

const headerInfo = computed(() => {
  const hora = formatearHora(props.turno?.ultimoEventoEn);

  if (props.turno?.enColacion) {
    return {
      text: `En Colación: desde ${hora}`,
      dotColor: "var(--p-yellow-500)",
    };
  }
  if (props.turno?.enTurno) {
    return {
      text: `En turno: desde ${hora}`,
      dotColor: "var(--p-green-500)",
    };
  }
  return { text: "Sin turno activo", dotColor: "var(--p-gray-400)" };
});

function handleClick(accion) {
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
  <Card class="bg-surface/75">
    <template #title>
      <div class="flex justify-between">
        <div class="flex items-center gap-2">
          <span
            class="w-2 h-8 border-round"
            :style="{ background: headerInfo.dotColor }"
          ></span>
          <span class="font-bold text-surface-900 text-sm">{{
            headerInfo.text
          }}</span>
        </div>
        <Button
          :icon="collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
          text
          rounded
          size="small"
          class="text-boton-accion"
          @click="collapsed = !collapsed"
        />
      </div>
    </template>
    <template #content>
      <div class="flex flex-col gap-3">
        <Transition name="collapse">
          <div v-if="!collapsed" class="flex gap-2 flex-wrap">
            <Button
              v-for="accion in accionesFiltradas"
              :key="accion"
              :label="accionesLabels?.[accion]?.label || accion"
              :icon="accionesLabels?.[accion]?.icon"
              :severity="accionesLabels?.[accion]?.severity"
              size="small"
              :loading="loading"
              @click="handleClick(accion)"
            />
          </div>
        </Transition>
      </div>
    </template>
  </Card>
</template>
<style scoped>
.header-text {
  color: var(--p-surface-900);
}
</style>
