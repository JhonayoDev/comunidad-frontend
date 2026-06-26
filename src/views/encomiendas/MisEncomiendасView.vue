<template>
  <div class="p-4 flex flex-col gap-4">
    <h2 class="text-lg font-bold">Mis encomiendas</h2>

    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>

    <div v-else-if="encomiendas.length === 0" class="text-center py-12">
      <p class="text-4xl mb-2">📦</p>
      <p class="text-base-content/60 text-sm">
        No tienes encomiendas pendientes
      </p>
    </div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="e in encomiendas"
        :key="e.id"
        class="card bg-base-100 shadow-sm"
      >
        <div class="card-body p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1">
              <p class="font-bold">📦 {{ e.descripcion }}</p>
              <p class="text-xs text-base-content/60">
                Recibida el {{ formatFecha(e.fechaRecepcion) }}
              </p>
              <p v-if="e.fechaEntrega" class="text-xs text-base-content/40">
                Entregada el {{ formatFecha(e.fechaEntrega) }}
              </p>
            </div>
            <span
              class="badge badge-sm shrink-0"
              :class="
                e.estado === 'PENDIENTE' ? 'badge-warning' : 'badge-success'
              "
            >
              {{ e.estado === "PENDIENTE" ? "Pendiente retiro" : "Retirada" }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { encomiendасService } from "../../services/encomiendасService";

const encomiendas = ref([]);
const loading = ref(false);

async function cargar() {
  loading.value = true;
  try {
    const response = await encomiendасService.getMisEncomiendas();
    encomiendas.value = response.data;
  } finally {
    loading.value = false;
  }
}

function formatFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(() => cargar());
</script>
