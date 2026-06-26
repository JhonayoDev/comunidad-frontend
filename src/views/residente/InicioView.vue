<template>
  <div class="p-4 flex flex-col gap-4">
    <div v-if="error" class="alert alert-warning py-2">
      <span class="text-sm">⚠️ {{ error }}</span>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>

    <template v-else-if="dashboard">
      <!-- Mis unidades -->
      <div class="card bg-base-100 shadow">
        <div class="card-body p-4">
          <h3 class="font-bold text-base mb-3">Mis unidades</h3>

          <div v-if="dashboard.unidades.length === 0" class="text-center py-4">
            <p class="text-base-content/60 text-sm">
              No tienes unidades asignadas
            </p>
          </div>

          <div v-else class="flex flex-col gap-4">
            <div v-for="unidad in dashboard.unidades" :key="unidad.id">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xl">{{
                  unidad.tipo === "ESTACIONAMIENTO" ? "🅿️" : "🏠"
                }}</span>
                <div>
                  <p class="font-semibold">
                    {{
                      unidad.tipo === "ESTACIONAMIENTO"
                        ? "Estacionamiento"
                        : "Casa"
                    }}
                    {{ unidad.numero }}
                  </p>
                </div>
              </div>

              <!-- Personas (convivientes) -->
              <div
                v-for="persona in unidad.personas"
                :key="persona.id"
                class="ml-8 flex items-center gap-2 text-sm"
              >
                <span>👤</span>
                <span>{{ persona.nombre }}</span>
                <span class="badge badge-ghost badge-xs">{{
                  tipoVinculo(persona.tipo)
                }}</span>
              </div>

              <!-- Vehículos -->
              <div
                v-for="vehiculo in unidad.vehiculos"
                :key="vehiculo.id"
                class="ml-8 flex items-center gap-2 text-sm"
              >
                <span>🚗</span>
                <span class="font-mono">{{ vehiculo.patente }}</span>
              </div>

              <!-- Gasto común -->
              <div
                v-if="unidad.gastoActual"
                class="ml-8 mt-2 p-2 bg-base-200 rounded"
              >
                <div class="flex justify-between items-center">
                  <span class="text-xs"
                    >GC {{ unidad.gastoActual.periodo }}</span
                  >
                  <span
                    class="text-sm font-bold"
                    :class="{
                      'text-success':
                        unidad.gastoActual.estadoPago === 'PAGADO',
                      'text-error': unidad.gastoActual.estadoPago === 'VENCIDO',
                    }"
                  >
                    ${{ formatMonto(unidad.gastoActual.monto) }}
                  </span>
                </div>
                <p class="text-xs text-base-content/60">
                  Vence: {{ unidad.gastoActual.fechaVencimiento }} —
                  {{ estadoPago(unidad.gastoActual.estadoPago) }}
                </p>
              </div>

              <div class="divider my-2"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Novedades -->
      <div class="card bg-base-100 shadow">
        <div class="card-body p-4">
          <h3 class="font-bold text-base mb-3">Novedades</h3>
          <div class="flex flex-col gap-2">
            <div
              class="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 cursor-pointer"
              @click="$router.push({ name: 'Notificaciones' })"
            >
              <div class="flex items-center gap-2">
                <span class="text-xl">🔔</span>
                <span class="text-sm font-medium">Notificaciones</span>
              </div>
              <div class="flex items-center gap-2">
                <span
                  v-if="notifCount > 0"
                  class="badge badge-primary badge-sm"
                  >{{ notifCount }}</span
                >
                <span v-else class="text-xs text-base-content/40"
                  >Sin nuevas</span
                >
                <span class="text-base-content/40">›</span>
              </div>
            </div>

            <div
              class="flex items-center justify-between p-2 rounded-lg opacity-50"
            >
              <div class="flex items-center gap-2">
                <span class="text-xl">📦</span>
                <span class="text-sm font-medium">Encomiendas</span>
              </div>
              <span class="text-xs text-base-content/40">Próximamente</span>
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
              class="btn btn-outline btn-sm flex flex-col h-16 gap-1 opacity-50"
              disabled
            >
              <span class="text-xl">🚪</span>
              <span class="text-xs">Visita esperada</span>
            </button>
            <button
              class="btn btn-outline btn-sm flex flex-col h-16 gap-1 opacity-50"
              disabled
            >
              <span class="text-xl">📅</span>
              <span class="text-xs">Reservar área</span>
            </button>
            <button
              class="btn btn-outline btn-sm flex flex-col h-16 gap-1 opacity-50"
              disabled
            >
              <span class="text-xl">📝</span>
              <span class="text-xs">Reclamo / Caso</span>
            </button>
            <button
              class="btn btn-outline btn-sm flex flex-col h-16 gap-1"
              @click="$router.push({ name: 'Perfil' })"
            >
              <span class="text-xl">👤</span>
              <span class="text-xs">Mi perfil</span>
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
import { perfilService } from "../../services/perfilService";

const auth = useAuthStore();
const dashboard = ref(null);
const notifCount = ref(0);
const loading = ref(true);
const error = ref(null);

function tipoVinculo(tipo) {
  const tipos = {
    PROPIETARIO: "Propietario",
    ARRENDATARIO: "Arrendatario",
    RESIDENTE_ADICIONAL: "Residente",
  };
  return tipos[tipo] || tipo;
}

function estadoPago(estado) {
  const estados = {
    PENDIENTE: "Pendiente",
    PAGADO: "Pagado",
    VENCIDO: "Vencido",
  };
  return estados[estado] || estado;
}

function formatMonto(monto) {
  return new Intl.NumberFormat("es-CL").format(monto);
}

onMounted(async () => {
  const cid = auth.condominioActualId;
  if (!cid) {
    error.value = "Selecciona un condominio primero";
    loading.value = false;
    return;
  }
  try {
    const [resDash, resBadge] = await Promise.all([
      perfilService.getDashboardResidente(cid),
      perfilService.getBadgeNotificaciones(cid),
    ]);
    dashboard.value = resDash.data;
    notifCount.value = resBadge.data.noLeidas;
  } catch {
    error.value = "Error al cargar el dashboard";
  } finally {
    loading.value = false;
  }
});
</script>
