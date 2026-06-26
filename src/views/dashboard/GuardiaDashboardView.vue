<template>
  <div class="p-4 flex flex-col gap-4">
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>

    <template v-else-if="dashboard">
      <div class="grid grid-cols-2 gap-3">
        <div class="card bg-success text-success-content shadow">
          <div class="card-body p-4 items-center text-center">
            <p class="text-3xl font-bold">
              {{ dashboard.accesos.activosAhora }}
            </p>
            <p class="text-xs opacity-75">Accesos activos</p>
          </div>
        </div>

        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 items-center text-center">
            <p class="text-3xl font-bold text-primary">
              {{ dashboard.totalUnidades }}
            </p>
            <p class="text-xs text-base-content/60">Unidades</p>
          </div>
        </div>

        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 items-center text-center">
            <p class="text-3xl font-bold text-primary">
              {{ dashboard.encomiendas }}
            </p>
            <p class="text-xs text-base-content/60">Encomiendas</p>
          </div>
        </div>

        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 items-center text-center">
            <p class="text-3xl font-bold text-primary">
              {{ dashboard.residentesActivos }}
            </p>
            <p class="text-xs text-base-content/60">Residentes</p>
          </div>
        </div>
      </div>

      <!-- Últimos movimientos -->
      <div
        v-if="dashboard.accesos.ultimosMovimientos?.length"
        class="card bg-base-100 shadow"
      >
        <div class="card-body p-4">
          <h3 class="font-bold text-base mb-3">Últimos movimientos</h3>
          <div class="flex flex-col gap-2">
            <div
              v-for="mov in dashboard.accesos.ultimosMovimientos.slice(0, 5)"
              :key="mov.id"
              class="flex items-center justify-between text-sm"
            >
              <div>
                <p class="font-medium">{{ mov.nombreVisitante }}</p>
                <p class="text-xs text-base-content/60">
                  Unidad {{ mov.unidadNumero }} · {{ mov.tipo }}
                </p>
              </div>
              <span class="text-xs text-base-content/40">{{ mov.estado }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Acciones rápidas -->
      <div class="card bg-base-100 shadow">
        <div class="card-body p-4">
          <h3 class="font-bold text-base mb-3">Acciones rápidas</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              class="btn btn-primary btn-sm flex flex-col h-16 gap-1 opacity-50"
              disabled
            >
              <span class="text-xl">🚪</span>
              <span class="text-xs">Registrar visita</span>
            </button>

            <button
              class="btn btn-outline btn-sm flex flex-col h-16 gap-1"
              @click="$router.push({ name: 'Porton' })"
            >
              <span class="text-xl">🔍</span>
              <span class="text-xs">Consultar patente</span>
            </button>

            <button
              class="btn btn-outline btn-sm flex flex-col h-16 gap-1 opacity-50"
              disabled
            >
              <span class="text-xl">📦</span>
              <span class="text-xs">Encomiendas</span>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../../stores/authStore";
import api from "../../services/api";

const auth = useAuthStore();
const dashboard = ref(null);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  const cid = auth.condominioActualId;
  if (!cid) {
    error.value = "Selecciona un condominio primero";
    loading.value = false;
    return;
  }
  try {
    const response = await api.get(`/condominios/${cid}/dashboard/guardia`);
    dashboard.value = response.data;
  } catch {
    error.value = "Error al cargar el dashboard";
  } finally {
    loading.value = false;
  }
});
</script>
