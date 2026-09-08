<script setup>
import { computed } from "vue";
import { useDashboardMetrics } from "@/composables/useDashboardMetrics";
import Card from "primevue/card";
import Badge from "primevue/badge";

const props = defineProps({
  variant: { type: String, default: "card" },
  conteoInicial: { type: Number, default: 0 },
});

const emit = defineEmits(["click"]);

// Conteo vía polling GET /dashboard/metrics (30s, Cache-Control no-cache).
// Antes del primer poll se muestra `conteoInicial` (seed de /dashboard/guardia).
const { visitasActivas } = useDashboardMetrics();
const activos = computed(() => visitasActivas.value ?? props.conteoInicial ?? 0);
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
