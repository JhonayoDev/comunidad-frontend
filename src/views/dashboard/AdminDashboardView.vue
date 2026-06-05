<template>
  <div class="p-4 flex flex-col gap-4">
    <!-- Aviso de caché -->
    <div v-if="error" class="alert alert-warning py-2">
      <span class="text-sm">⚠️ {{ error }}</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>

    <template v-else>
      <!-- Alertas importantes -->
      <div
        v-if="datos.solicitudesPendientes > 0"
        class="alert alert-warning py-3 cursor-pointer"
        @click="$router.push({ name: 'Solicitudes' })"
      >
        <span class="text-xl">📋</span>
        <div>
          <p class="font-semibold">
            {{ datos.solicitudesPendientes }} solicitudes pendientes
          </p>
          <p class="text-xs">Toca para revisar</p>
        </div>
        <span class="ml-auto">›</span>
      </div>

      <!-- Visitas activas -->
      <div
        class="alert alert-success py-3 cursor-pointer"
        @click="$router.push({ name: 'Visitas' })"
      >
        <span class="text-xl">🚪</span>
        <div>
          <p class="font-semibold">
            {{ datos.visitasActivas }} visitas activas ahora
          </p>
          <p class="text-xs">Toca para ver el detalle</p>
        </div>
        <span class="ml-auto">›</span>
      </div>

      <!-- Estadísticas -->
      <div class="grid grid-cols-2 gap-3">
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 items-center text-center">
            <p class="text-3xl font-bold text-primary">
              {{ datos.totalUnidades }}
            </p>
            <p class="text-xs text-base-content/60">Casas</p>
          </div>
        </div>

        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 items-center text-center">
            <p class="text-3xl font-bold text-primary">
              {{ datos.visitasActivas }}
            </p>
            <p class="text-xs text-base-content/60">Visitas activas</p>
          </div>
        </div>

        <div class="card bg-base-100 shadow opacity-50">
          <div class="card-body p-4 items-center text-center">
            <p class="text-3xl font-bold text-base-content/40">—</p>
            <p class="text-xs text-base-content/40">Encomiendas</p>
            <p class="text-xs text-base-content/40">Próximamente</p>
          </div>
        </div>

        <div class="card bg-base-100 shadow opacity-50">
          <div class="card-body p-4 items-center text-center">
            <p class="text-3xl font-bold text-base-content/40">—</p>
            <p class="text-xs text-base-content/40">Reclamos</p>
            <p class="text-xs text-base-content/40">Próximamente</p>
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
              @click="$router.push({ name: 'Solicitudes' })"
            >
              <span class="text-xl">📋</span>
              <span class="text-xs">Solicitudes</span>
            </button>

            <button
              class="btn btn-outline btn-sm flex flex-col h-16 gap-1"
              @click="$router.push({ name: 'Visitas' })"
            >
              <span class="text-xl">🚪</span>
              <span class="text-xs">Visitas</span>
            </button>

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
import { onMounted } from "vue";
import { useDashboardAdmin } from "../../composables/useDashboardAdmin";
import { solicitudesService } from "../../services/solicitudesService";

const { datos, loading, error, cargar } = useDashboardAdmin();

async function cargarSolicitudes() {
  try {
    const response = await solicitudesService.getPendientes();
    datos.value.solicitudesPendientes = response.data.length;
  } catch {
    // silencioso
  }
}

onMounted(async () => {
  await cargar();
  await cargarSolicitudes();
});
</script>
