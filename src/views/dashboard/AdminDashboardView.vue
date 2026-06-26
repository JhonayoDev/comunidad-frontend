<template>
  <div class="p-4 flex flex-col gap-4">
    <div v-if="error" class="alert alert-warning py-2">
      <span class="text-sm">⚠️ {{ error }}</span>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>

    <template v-else-if="dashboard">
      <!-- Alertas importantes -->
      <div
        v-if="
          dashboard.pendientes.encomiendas > 0 ||
          dashboard.pendientes.reclamos > 0
        "
        class="alert alert-warning py-3 cursor-pointer"
      >
        <span class="text-xl">📋</span>
        <div>
          <p class="font-semibold">
            {{
              dashboard.pendientes.encomiendas + dashboard.pendientes.reclamos
            }}
            pendientes
          </p>
        </div>
        <span class="ml-auto">›</span>
      </div>

      <!-- Accesos activos -->
      <div class="alert alert-success py-3">
        <span class="text-xl">🚪</span>
        <div>
          <p class="font-semibold">
            {{ dashboard.accesos.activosAhora }} accesos activos ahora
          </p>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="grid grid-cols-2 gap-3">
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 items-center text-center">
            <p class="text-3xl font-bold text-primary">
              {{ dashboard.totales.unidades }}
            </p>
            <p class="text-xs text-base-content/60">Unidades</p>
          </div>
        </div>

        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 items-center text-center">
            <p class="text-3xl font-bold text-primary">
              {{ dashboard.totales.residentesActivos }}
            </p>
            <p class="text-xs text-base-content/60">Residentes</p>
          </div>
        </div>

        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 items-center text-center">
            <p class="text-3xl font-bold text-primary">
              {{ dashboard.totales.vehiculos }}
            </p>
            <p class="text-xs text-base-content/60">Vehículos</p>
          </div>
        </div>

        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 items-center text-center">
            <p class="text-3xl font-bold text-primary">
              {{ dashboard.anunciosVigentes }}
            </p>
            <p class="text-xs text-base-content/60">Anuncios</p>
          </div>
        </div>
      </div>

      <!-- Acciones rápidas -->
      <div class="card bg-base-100 shadow">
        <div class="card-body p-4">
          <h3 class="font-bold text-base mb-3">Acciones rápidas</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              class="btn btn-outline btn-sm flex flex-col h-16 gap-1"
              @click="$router.push({ name: 'Residentes' })"
            >
              <span class="text-xl">👥</span>
              <span class="text-xs">Residentes</span>
            </button>

            <button
              class="btn btn-outline btn-sm flex flex-col h-16 gap-1"
              @click="$router.push({ name: 'Vehiculos' })"
            >
              <span class="text-xl">🚗</span>
              <span class="text-xs">Vehículos</span>
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
    const response = await api.get(`/condominios/${cid}/dashboard/admin`);
    dashboard.value = response.data;
  } catch {
    error.value = "Error al cargar el dashboard";
  } finally {
    loading.value = false;
  }
});
</script>
