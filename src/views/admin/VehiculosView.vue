<template>
  <div class="p-4 flex flex-col gap-4">
    <h2 class="text-lg font-bold">Vehículos</h2>

    <!-- Aviso de caché -->
    <div v-if="error" class="alert alert-warning py-2">
      <span class="text-sm">⚠️ {{ error }}</span>
    </div>

    <!-- Buscador -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-3 flex flex-col gap-2">
        <input
          v-model="filtros.patente"
          type="text"
          placeholder="Buscar por patente"
          class="input input-bordered input-sm uppercase"
          @input="
            filtros.patente = filtros.patente.toUpperCase();
            buscar();
          "
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>

    <!-- Sin resultados -->
    <div v-else-if="vehiculos.length === 0" class="text-center py-12">
      <p class="text-4xl mb-2">🚗</p>
      <p class="text-base-content/60 text-sm">No hay vehículos registrados</p>
    </div>

    <!-- Lista -->
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="v in vehiculos"
        :key="v.id"
        class="card bg-base-100 shadow-sm cursor-pointer"
        @click="seleccionar(v)"
      >
        <div class="card-body p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="font-bold font-mono">{{ v.patente }}</p>
              <p class="text-sm">
                {{ v.marca }} {{ v.modelo }} — {{ v.color }}
              </p>
              <p class="text-xs text-base-content/60">
                {{ tipoVehiculo(v.tipo) }}
              </p>
              <p class="text-xs text-base-content/40">
                {{ v.propietarioNombre }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span
                class="badge badge-sm"
                :class="v.activo ? 'badge-success' : 'badge-ghost'"
              >
                {{ v.activo ? "Activo" : "Baja" }}
              </span>
              <span class="text-base-content/40">›</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal detalle -->
    <div v-if="vehiculoSeleccionado" class="modal modal-open">
      <div class="modal-box">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg font-mono">
            {{ vehiculoSeleccionado.patente }}
          </h3>
          <button class="btn btn-ghost btn-sm btn-circle" @click="cerrarModal">
            ✕
          </button>
        </div>

        <div class="flex flex-col gap-2 text-sm">
          <div class="flex justify-between">
            <span class="text-base-content/60">Marca / Modelo</span>
            <span class="font-medium"
              >{{ vehiculoSeleccionado.marca }}
              {{ vehiculoSeleccionado.modelo }}</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Color</span>
            <span class="font-medium">{{ vehiculoSeleccionado.color }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Tipo</span>
            <span class="font-medium">{{
              tipoVehiculo(vehiculoSeleccionado.tipo)
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Propietario</span>
            <span class="font-medium">{{
              vehiculoSeleccionado.propietarioNombre
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Estado</span>
            <span
              class="badge badge-sm"
              :class="
                vehiculoSeleccionado.activo ? 'badge-success' : 'badge-ghost'
              "
            >
              {{ vehiculoSeleccionado.activo ? "Activo" : "Dado de baja" }}
            </span>
          </div>

          <!-- Estacionamientos -->
          <div v-if="vehiculoSeleccionado.estacionamientos?.length > 0">
            <div class="divider my-1"></div>
            <p class="text-base-content/60 mb-1">Estacionamientos</p>
            <div
              v-for="e in vehiculoSeleccionado.estacionamientos"
              :key="e.numero"
              class="flex justify-between"
            >
              <span>Nº {{ e.numero }}</span>
              <span class="text-base-content/60">{{ e.tipo }}</span>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost btn-sm" @click="cerrarModal">
            Cerrar
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="cerrarModal"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useVehiculos } from "../../composables/useVehiculos";

const { vehiculos, loading, error, cargar } = useVehiculos();

const filtros = ref({ patente: "" });
const vehiculoSeleccionado = ref(null);

let timeout = null;
function buscar() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    const params = {};
    if (filtros.value.patente) params.patente = filtros.value.patente;
    cargar(params);
  }, 400);
}

function seleccionar(v) {
  vehiculoSeleccionado.value = v;
}

function cerrarModal() {
  vehiculoSeleccionado.value = null;
}

function tipoVehiculo(tipo) {
  const tipos = {
    AUTO: "Auto",
    CAMIONETA: "Camioneta",
    MOTO: "Moto",
    OTRO: "Otro",
  };
  return tipos[tipo] || tipo;
}

onMounted(() => cargar());
</script>
