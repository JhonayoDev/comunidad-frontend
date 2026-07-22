<script setup>
import { ref } from "vue";
import Card from "primevue/card";
import Tag from "primevue/tag";
import Button from "primevue/button";

defineProps({
  evento: { type: Object, required: true },
});

const collapsed = ref(true);

const tipoLabels = {
  TURNO_INICIO: { label: "Inicio de turno", icon: "pi pi-play" },
  TURNO_FIN: { label: "Fin de turno", icon: "pi pi-stop" },
  COLACION_SALIDA: { label: "Salida a colación", icon: "pi pi-clock" },
  COLACION_REGRESO: {
    label: "Regreso de colación",
    icon: "pi pi-check-circle",
  },
  NOVEDAD: { label: "Novedad", icon: "pi pi-flag" },
};

function colorBar(clas) {
  if (clas === "EMERGENCIA") return "var(--p-danger-600)";
  if (clas === "URGENTE") return "var(--p-warning-600)";
  if (clas === "NORMAL") return "var(--p-success-600)";
  return "var(--p-primary-600)";
}

function severityTag(clas) {
  if (clas === "EMERGENCIA") return "danger";
  if (clas === "URGENTE") return "warn";
  if (clas === "NORMAL") return "success";
  return "info";
}

function formatearFecha(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <Card class="bg-surface/75">
    <template #title>
      <div
        class="flex items-center gap-3 cursor-pointer border-b border-border"
        @click="collapsed = !collapsed"
      >
        <span
          class="w-1 h-6 border-round"
          :style="{ background: colorBar(evento.clasificacion) }"
        ></span>
        <i
          class="pi"
          :class="tipoLabels[evento.tipo]?.icon || 'pi-circle'"
          style="font-size: 0.9rem"
        ></i>
        <span class="text-sm font-medium flex-1">
          {{ tipoLabels[evento.tipo]?.label || evento.tipo }}
        </span>
        <span class="text-xs text-text-muted">
          {{ formatearFecha(evento.registradoEn) }}
        </span>
        <Button
          :icon="collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
          text
          rounded
          size="small"
          class="text-boton-accion/60"
          @click.stop="collapsed = !collapsed"
        />
      </div>
    </template>
    <template #content>
      <Transition name="collapse">
        <div v-if="!collapsed" class="flex flex-col gap-3 pt-2">
          <div class="flex items-center justify-between">
            <span
              v-if="evento.registradoPorNombre"
              class="text-xs text-text-muted"
            >
              {{ evento.registradoPorNombre }}
            </span>
            <Tag
              :value="evento.clasificacion"
              :severity="severityTag(evento.clasificacion)"
            />
          </div>
          <p v-if="evento.observaciones" class="text-sm text-text/90 m-0">
            {{ evento.observaciones }}
          </p>
          <a
            v-if="evento.fotoUrl"
            :href="evento.fotoUrl"
            target="_blank"
            class="text-info hover:underline text-sm inline-flex items-center gap-1"
          >
            <i class="pi pi-external-link"></i>
            Ver archivo adjunto
          </a>
        </div>
      </Transition>
    </template>
  </Card>
</template>
