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
      <!-- Mi unidad -->
      <div class="card bg-base-100 shadow">
        <div class="card-body p-4">
          <h3 class="font-bold text-base mb-3">Mi unidad</h3>

          <div v-if="vinculos.length === 0" class="text-center py-4">
            <p class="text-base-content/60 text-sm">
              No tienes unidades asignadas
            </p>
          </div>

          <div v-else class="flex flex-col gap-3">
            <div v-for="vinculo in vinculos" :key="vinculo.id">
              <div class="flex items-center gap-2">
                <span class="text-xl">🏠</span>
                <div>
                  <p class="font-semibold">Casa {{ vinculo.unidadNumero }}</p>
                  <p class="text-xs text-base-content/60">
                    Sector {{ vinculo.unidadNumero }} —
                    <span class="badge badge-ghost badge-xs">{{
                      tipoVinculo(vinculo.tipo)
                    }}</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Estacionamientos -->
            <div v-if="estacionamientos.length > 0" class="divider my-0"></div>
            <div
              v-for="est in estacionamientos"
              :key="est.id"
              class="flex items-center gap-2"
            >
              <span class="text-xl">🅿️</span>
              <div>
                <p class="font-semibold">
                  Estacionamiento Nº {{ est.unidadNumero }}
                </p>
                <p class="text-xs text-base-content/60">
                  {{ tipoUnidad(est.tipo) }}
                </p>
              </div>
            </div>

            <!-- Vehículos -->
            <div v-if="vehiculos.length > 0" class="divider my-0"></div>
            <div
              v-for="vehiculo in vehiculos"
              :key="vehiculo.id"
              class="flex items-center gap-2"
            >
              <span class="text-xl">🚗</span>
              <div>
                <p class="font-semibold">{{ vehiculo.patente }}</p>
                <p class="text-xs text-base-content/60">
                  {{ vehiculo.marca }} {{ vehiculo.modelo }} —
                  {{ vehiculo.color }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gastos comunes -->
      <div class="card bg-base-100 shadow">
        <div class="card-body p-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold text-base">Gastos comunes</h3>
            <span class="badge badge-ghost badge-sm">{{
              gastoComun.periodo
            }}</span>
          </div>

          <div
            v-if="!gastoComun.disponible"
            class="flex items-center gap-3 py-2"
          >
            <span class="text-3xl">💰</span>
            <div>
              <p class="text-2xl font-bold">
                $ {{ formatMonto(gastoComun.deudaActual) }}
              </p>
              <p class="text-xs text-base-content/40">
                Próximamente disponible
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Novedades -->
      <div class="card bg-base-100 shadow">
        <div class="card-body p-4">
          <h3 class="font-bold text-base mb-3">Novedades</h3>
          <div class="flex flex-col gap-2">
            <!-- Notificaciones -->
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

            <!-- Encomiendas — placeholder -->
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
            <!-- Visita esperada — placeholder -->
            <button
              class="btn btn-outline btn-sm flex flex-col h-16 gap-1 opacity-50"
              disabled
            >
              <span class="text-xl">🚪</span>
              <span class="text-xs">Visita esperada</span>
            </button>

            <!-- Reserva área común — placeholder -->
            <button
              class="btn btn-outline btn-sm flex flex-col h-16 gap-1 opacity-50"
              disabled
            >
              <span class="text-xl">📅</span>
              <span class="text-xs">Reservar área</span>
            </button>

            <!-- Reclamo/Caso -->
            <button
              class="btn btn-outline btn-sm flex flex-col h-16 gap-1 opacity-50"
              disabled
            >
              <span class="text-xl">📝</span>
              <span class="text-xs">Reclamo / Caso</span>
            </button>

            <!-- Actualizar perfil -->
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
import { ref, computed, onMounted } from "vue";
import { useResidente } from "../../composables/useResidente";
import { perfilService } from "../../services/perfilService";

const { vinculos, vehiculos, gastoComun, loading, error, cargar } =
  useResidente();

const notifCount = ref(0);

// Filtra solo estacionamientos de los vínculos
const estacionamientos = computed(() =>
  vinculos.value.filter(
    (v) => v.tipo !== "CASA" && v.unidadTipo?.includes("ESTACIONAMIENTO"),
  ),
);

async function cargarBadge() {
  try {
    const response = await perfilService.getBadgeNotificaciones();
    notifCount.value = response.data.noLeidas;
  } catch {
    // silencioso
  }
}

function tipoVinculo(tipo) {
  const tipos = {
    PROPIETARIO: "Propietario",
    ARRENDATARIO: "Arrendatario",
    RESIDENTE_ADICIONAL: "Residente",
  };
  return tipos[tipo] || tipo;
}

function tipoUnidad(tipo) {
  const tipos = {
    ESTACIONAMIENTO_RESIDENTE: "Estacionamiento residente",
    ESTACIONAMIENTO_VISITA: "Estacionamiento visita",
    ESTACIONAMIENTO_DISCAPACITADO: "Estacionamiento discapacitado",
  };
  return tipos[tipo] || tipo;
}

function formatMonto(monto) {
  return new Intl.NumberFormat("es-CL").format(monto);
}

onMounted(() => {
  cargar();
  cargarBadge();
});
</script>
