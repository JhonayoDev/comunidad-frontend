<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { visitasService } from "@/services/visitasService";
import Card from "primevue/card";
import Badge from "primevue/badge";

const props = defineProps({
  pollingMs: { type: Number, default: 10000_000 },
  variant: { type: String, default: "card" },
});

const emit = defineEmits(["click"]);

const auth = useAuthStore();
const accesosActivos = ref(0);
let pollingInterval = null;

async function actualizar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    const { data } = await visitasService.getConteoActivos(cid);
    accesosActivos.value = data.activosAhora;
  } catch (e) {
    console.error("Error al obtener conteo activos", e);
  }
}

onMounted(() => {
  actualizar();
  pollingInterval = setInterval(actualizar, props.pollingMs);
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});
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
          {{ accesosActivos }}
        </p>
        <p class="text-xs text-surface-500 m-0 mt-1">Accesos activos</p>
      </div>
    </template>
  </Card>

  <Badge
    v-else
    :value="accesosActivos"
    severity="success"
    class="cursor-pointer"
    @click="emit('click')"
  />
</template>
