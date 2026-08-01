<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import { encomiendasService } from "@/services/encomiendasService";
import { useMisEncomiendasTiempoReal } from "@/composables/useMisEncomiendasTiempoReal";

import Card from "primevue/card";
import Badge from "primevue/badge";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";

const props = defineProps({
  condominioId: { type: String, required: true },
  limite: { type: Number, default: 5 },
});

const router = useRouter();

// SSE del residente: invalida la query ante cambios en vivo (ENCOMIENDA_RECIBIDA/
// ENTREGADA/CERRADA) y siembra el badge desde el SNAPSHOT_INICIAL. Si el stream
// cae pasada la gracia (1 min), activa polling de respaldo (2 min).
const { refetchIntervalResidente, pendientesResidente } =
  useMisEncomiendasTiempoReal();

const queryKey = computed(() => ["misEncomiendas", props.condominioId]);
const enabled = computed(() => !!props.condominioId);

const { data: encomiendas, isLoading: loading, isError: error } = useQuery({
  queryKey,
  queryFn: async () => {
    const { data } = await encomiendasService.getMisEncomiendas(
      props.condominioId,
    );
    return (data || []).filter((e) => e.estado === "PENDIENTE");
  },
  enabled,
  refetchInterval: refetchIntervalResidente,
});

const encomiendasLista = computed(() => encomiendas.value ?? []);

// Badge: seed del snapshot SSE mientras esté fresco; ante un cambio (el
// snapshot se descarta) vuelve a la longitud de la lista ya reconciliada.
const badgeConteo = computed(() => pendientesResidente.value ?? encomiendasLista.value.length);

function severityEncomienda(estado) {
  if (estado === "ENTREGADA") return "info";
  if (estado === "CERRADA") return "contrast";
  return "warn";
}

function formatFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CL");
}

function verTodas() {
  router.push({ name: "MisEncomiendas" });
}
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center justify-between">
        <span>Encomiendas</span>
        <Badge
          v-if="badgeConteo > 0"
          :value="badgeConteo"
          severity="warn"
        />
      </div>
    </template>
    <template #content>
      <Skeleton v-if="loading" width="100%" height="5rem" />
      <div v-else-if="error" class="text-sm text-surface-400 py-2">
        No se pudieron cargar tus encomiendas
      </div>
      <div v-else-if="encomiendasLista.length === 0" class="text-sm text-surface-400 py-2">
        No tienes encomiendas pendientes
      </div>
      <div v-else>
        <div class="flex flex-col gap-2">
          <div
            v-for="env in encomiendasLista.slice(0, limite)"
            :key="env.id"
            class="flex items-center justify-between p-2 border-round cursor-pointer hover:bg-emphasis"
            @click="verTodas"
          >
            <div class="flex items-center gap-3">
              <i class="pi pi-inbox text-xl text-primary"></i>
              <div class="flex flex-col">
                <span class="text-sm font-medium">
                  {{ env.tipo }} · {{ env.nombreDestinatario }}
                </span>
                <span class="text-xs text-surface-500">
                  Casa {{ env.unidadNumero }} · {{ formatFecha(env.creadoEn) }}
                </span>
              </div>
            </div>
            <Tag
              :value="env.estado === 'PENDIENTE' ? 'Pendiente' : env.estado"
              :severity="severityEncomienda(env.estado)"
            />
          </div>
        </div>
        <div v-if="encomiendasLista.length > limite" class="mt-2">
          <Button
            label="Ver todas"
            icon="pi pi-arrow-right"
            size="small"
            variant="text"
            @click="verTodas"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
