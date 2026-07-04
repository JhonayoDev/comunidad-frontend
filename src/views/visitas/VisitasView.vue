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
            v-model="filtros.estado"
            class="select select-bordered select-sm flex-1"
            @change="buscar()"
          >
            <option value="">Todas</option>
            <option value="ACTIVO">Activas</option>
            <option value="FINALIZADO">Con salida</option>
          </select>
          <button class="btn btn-ghost btn-sm" @click="limpiarFiltros">
            Limpiar
          </button>
        </div>
      </div>
    </div>

    <!-- Aviso de caché -->
    <div v-if="error" class="alert alert-warning mb-4 py-2">
      <span class="text-sm">⚠️ {{ error }}</span>
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
              <p class="font-semibold">{{ visita.nombreVisitante }}</p>
              <p v-if="visita.patenteVisitante" class="text-sm font-mono">
                {{ visita.patenteVisitante }}
              </p>
              <p class="text-xs text-base-content/60">{{ visita.tipo }}</p>
              <p class="text-xs text-base-content/40">
                {{ formatFecha(visita.fechaIngreso) }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <span
                v-if="visita.estado === 'ACTIVO'"
                class="badge badge-success badge-sm"
                >Activa</span
              >
              <span v-else class="badge badge-ghost badge-sm">Salió</span>
              <button
                v-if="visita.estado === 'ACTIVO'"
                class="btn btn-outline btn-xs"
                @click="handleSalida(visita)"
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
import { useVisitas } from "../../composables/useVisitas";

const { visitas, loading, error, cargar, registrarSalida } = useVisitas();

const filtros = ref({
  patente: "",
  nombre: "",
  estado: "ACTIVO",
});

let timeout = null;
function buscar() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    const params = {};
    if (filtros.value.patente) params.patente = filtros.value.patente;
    if (filtros.value.nombre) params.nombre = filtros.value.nombre;
    if (filtros.value.estado !== "") params.estado = filtros.value.estado;
    cargar(params);
  }, 400);
}

async function handleSalida(visita) {
  const resultado = await registrarSalida(visita);
  if (resultado !== true) {
    alert(resultado);
  }
}

function limpiarFiltros() {
  filtros.value = { patente: "", nombre: "", estado: "ACTIVO" };
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

onMounted(() => cargar({ estado: "ACTIVO" }));
</script>
