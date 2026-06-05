<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold">Visitas</h2>
      <button
        class="btn btn-primary btn-sm"
        @click="$router.push({ name: 'RegistrarVisita' })"
      >
        + Nueva
      </button>
    </div>

    <!-- Filtros -->
    <div class="card bg-base-100 shadow mb-4">
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
        <input
          v-model="filtros.nombre"
          type="text"
          placeholder="Buscar por nombre"
          class="input input-bordered input-sm"
          @input="buscar()"
        />
        <div class="flex gap-2">
          <select
            v-model="filtros.activa"
            class="select select-bordered select-sm flex-1"
            @change="buscar()"
          >
            <option value="">Todas</option>
            <option value="true">Activas</option>
            <option value="false">Con salida</option>
          </select>
          <button class="btn btn-ghost btn-sm" @click="limpiarFiltros">
            Limpiar
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>

    <!-- Sin resultados -->
    <div v-else-if="visitas.length === 0" class="text-center py-12">
      <p class="text-4xl mb-2">📋</p>
      <p class="text-base-content/60">No hay visitas registradas</p>
    </div>

    <!-- Lista -->
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="visita in visitas"
        :key="visita.id"
        class="card bg-base-100 shadow-sm"
      >
        <div class="card-body p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="font-semibold">{{ visita.nombreResponsable }}</p>
              <p v-if="visita.patente" class="text-sm font-mono">
                {{ visita.patente }}
              </p>
              <p class="text-xs text-base-content/60">{{ visita.categoria }}</p>
              <p class="text-xs text-base-content/40">
                {{ formatFecha(visita.horaIngreso) }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <span
                v-if="!visita.horaSalida"
                class="badge badge-success badge-sm"
                >Activa</span
              >
              <span v-else class="badge badge-ghost badge-sm">Salió</span>
              <button
                v-if="!visita.horaSalida"
                class="btn btn-outline btn-xs"
                @click="registrarSalida(visita)"
              >
                Registrar salida
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { visitasService } from "../../services/visitasService";

const visitas = ref([]);
const loading = ref(false);

const filtros = ref({
  patente: "",
  nombre: "",
  activa: "true",
});

let timeout = null;
function buscar() {
  clearTimeout(timeout);
  timeout = setTimeout(() => cargar(), 400);
}

async function cargar() {
  loading.value = true;
  try {
    const params = {};
    if (filtros.value.patente) params.patente = filtros.value.patente;
    if (filtros.value.nombre) params.nombre = filtros.value.nombre;
    if (filtros.value.activa !== "") params.activa = filtros.value.activa;

    const response = await visitasService.getVisitas(params);
    visitas.value = response.data;
  } catch {
    // error silencioso
  } finally {
    loading.value = false;
  }
}

async function registrarSalida(visita) {
  try {
    await visitasService.registrarSalida(visita.id);
    visita.horaSalida = new Date().toISOString();
  } catch (e) {
    alert(e.response?.data?.message || "Error al registrar salida");
  }
}

function limpiarFiltros() {
  filtros.value = { patente: "", nombre: "", activa: "true" };
  cargar();
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
