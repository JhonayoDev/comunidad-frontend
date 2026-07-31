<script setup>
import { computed } from "vue";
import { metricas } from "@/composables/useMetricasTiempoReal";
import Card from "primevue/card";
import Badge from "primevue/badge";

const props = defineProps({
  variant: { type: String, default: "card" },
  conteoInicial: { type: Number, default: 0 },
});

const emit = defineEmits(["click"]);

// Conteo en vivo vía SSE (`visitasActivas`). Antes del primer evento se muestra
// `conteoInicial` (sembrado desde el snapshot del dashboard) — no se fetchea
// `GET /accesos/conteo-activos` solo para contar (mismas condiciones que la
// tarjeta de encomiendas).
const activos = computed(
  () => metricas.visitasActivas ?? props.conteoInicial ?? 0,
);
</script>

<template>
  <Card
    v-if="variant === 'card'"
    class="cursor-pointer hover:surface-hover transition-shadow"
    @click="emit('click')"
  >
    <template #content>
      <div class="text-center">
        <p class="text-3xl font-bold m-0 text-green-600">
          {{ activos }}
        </p>
        <p class="text-xs text-text/85 m-0 mt-1">Visitas</p>
      </div>
    </template>
  </Card>

  <Badge
    v-else
    :value="activos"
    severity="success"
    class="cursor-pointer"
    @click="emit('click')"
  />
</template>
