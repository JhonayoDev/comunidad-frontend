<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { encomiendasService } from "@/services/encomiendasService";
import { useQuery } from "@tanstack/vue-query";
import {
  useMetricasTiempoReal,
  metricas,
} from "@/composables/useMetricasTiempoReal";
import Card from "primevue/card";
import Badge from "primevue/badge";

const props = defineProps({
  pollingMs: { type: Number, default: 10000_000 },
  variant: { type: String, default: "card" },
});

const emit = defineEmits(["click"]);

const auth = useAuthStore();
const { refetchIntervalMetrica } = useMetricasTiempoReal();

// Query canónica ["encomiendasPendientes", cid]. El SSE invalida la query al
// llegar el evento; mientras tanto, `metricas.encomiendasPendientes` da el
// conteo al instante sin esperar el refetch.
const { data } = useQuery({
  queryKey: ["encomiendasPendientes", auth.condominioActualId],
  queryFn: async () => {
    const { data } = await encomiendasService.getActivas(
      auth.condominioActualId,
    );
    return data || [];
  },
  enabled: !!auth.condominioActualId,
  refetchOnWindowFocus: true,
  refetchInterval: refetchIntervalMetrica,
});

const pendientes = computed(
  () => metricas.encomiendasPendientes ?? data?.length ?? 0,
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
        <p
          class="text-3xl font-bold m-0"
          style="color: var(--p-primary-400)"
        >
          {{ pendientes }}
        </p>
        <p class="text-xs text-surface-500 m-0 mt-1">Encomiendas</p>
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
