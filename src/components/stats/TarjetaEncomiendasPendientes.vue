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

// [SSE-REMOVAL] Conteo vía polling GET /dashboard/metrics (30s, Cache-Control no-cache).
// Antes del primer poll se muestra `conteoInicial` (seed del snapshot /dashboard/guardia).
const { encomiendasPendientes } = useDashboardMetrics();
const pendientes = computed(() => encomiendasPendientes.value ?? props.conteoInicial ?? 0);
</script>

<template>
  <Card
    v-if="variant === 'card'"
    class="cursor-pointer hover:surface-hover transition-shadow"
    @click="emit('click')"
  >
    <template #content>
      <div class="text-center">
        <p class="text-3xl font-bold m-0" style="color: var(--p-primary-400)">
          {{ pendientes }}
        </p>
        <p class="text-xs text-text/85 m-0 mt-1">Encomiendas</p>
      </div>
    </template>
  </Card>

  <Badge
    v-else
    :value="pendientes"
    severity="warn"
    class="cursor-pointer"
    @click="emit('click')"
  />
</template>
