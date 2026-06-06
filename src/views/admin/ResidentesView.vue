<template>
  <div class="p-4 flex flex-col gap-4">
    <h2 class="text-lg font-bold">Residentes</h2>

    <!-- Aviso de caché -->
    <div v-if="error" class="alert alert-warning py-2">
      <span class="text-sm">⚠️ {{ error }}</span>
    </div>

    <!-- Buscador -->
    <div class="form-control">
      <input
        v-model="busqueda"
        type="text"
        placeholder="Buscar por número de casa..."
        class="input input-bordered"
      />
    </div>

    <!-- Filtro por sector -->
    <div class="flex gap-2 overflow-x-auto pb-1">
      <button
        class="btn btn-sm shrink-0"
        :class="sectorActivo === null ? 'btn-primary' : 'btn-ghost'"
        @click="sectorActivo = null"
      >
        Todos
      </button>
      <button
        v-for="sector in sectores"
        :key="sector.id"
        class="btn btn-sm shrink-0"
        :class="sectorActivo === sector.id ? 'btn-primary' : 'btn-ghost'"
        @click="sectorActivo = sector.id"
      >
        Sector {{ sector.numero }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>

    <!-- Lista de unidades -->
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="unidad in unidadesFiltradas"
        :key="unidad.id"
        class="card bg-base-100 shadow-sm cursor-pointer"
        @click="seleccionar(unidad)"
      >
        <div class="card-body p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-bold">Casa {{ unidad.numero }}</p>
              <p class="text-xs text-base-content/60">
                Sector {{ unidad.sectorNumero }}
              </p>
            </div>
            <span class="text-base-content/40">›</span>
          </div>
        </div>
      </div>

      <div v-if="unidadesFiltradas.length === 0" class="text-center py-8">
        <p class="text-4xl mb-2">🏠</p>
        <p class="text-base-content/60 text-sm">No se encontraron casas</p>
      </div>
    </div>

    <!-- Modal de vínculos -->
    <div v-if="unidadSeleccionada" class="modal modal-open">
      <div class="modal-box">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg">
            Casa {{ unidadSeleccionada.numero }}
          </h3>
          <button class="btn btn-ghost btn-sm btn-circle" @click="cerrarModal">
            ✕
          </button>
        </div>

        <p class="text-sm text-base-content/60 mb-3">
          Sector {{ unidadSeleccionada.sectorNumero }}
        </p>

        <!-- Loading vínculos -->
        <div v-if="loadingVinculos" class="flex justify-center py-4">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </div>

        <!-- Sin vínculos -->
        <div v-else-if="vinculos.length === 0" class="text-center py-4">
          <p class="text-base-content/60 text-sm">No hay residentes activos</p>
        </div>

        <!-- Lista de vínculos -->
        <div v-else class="flex flex-col gap-3">
          <div
            v-for="v in vinculos"
            :key="v.id"
            class="flex items-start justify-between p-3 bg-base-200 rounded-lg"
          >
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm">
                {{ v.usuarioNombre || v.nombreExterno }}
              </p>
              <p class="text-xs text-base-content/60">
                {{ v.emailExterno || "" }}
              </p>
              <div class="flex gap-1 mt-1">
                <span class="badge badge-ghost badge-xs">{{
                  tipoVinculo(v.tipo)
                }}</span>
                <span
                  class="badge badge-xs"
                  :class="v.autorizado ? 'badge-success' : 'badge-error'"
                >
                  {{ v.autorizado ? "Autorizado" : "No autorizado" }}
                </span>
              </div>
              <p class="text-xs text-base-content/40 mt-1">
                Desde {{ formatFecha(v.fechaInicio) }}
              </p>
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
import { ref, computed, onMounted } from "vue";
import { useResidentes } from "../../composables/useResidentes";

const {
  unidades,
  sectores,
  vinculos,
  loading,
  error,
  cargarUnidades,
  cargarVinculos,
} = useResidentes();

const busqueda = ref("");
const sectorActivo = ref(null);
const unidadSeleccionada = ref(null);
const loadingVinculos = ref(false);

const unidadesFiltradas = computed(() => {
  return unidades.value
    .filter((u) => u.tipo === "CASA")
    .filter(
      (u) => sectorActivo.value === null || u.sectorId === sectorActivo.value,
    )
    .filter(
      (u) => busqueda.value === "" || String(u.numero).includes(busqueda.value),
    );
});

async function seleccionar(unidad) {
  unidadSeleccionada.value = unidad;
  loadingVinculos.value = true;
  await cargarVinculos(unidad.id);
  loadingVinculos.value = false;
}

function cerrarModal() {
  unidadSeleccionada.value = null;
}

function tipoVinculo(tipo) {
  const tipos = {
    PROPIETARIO: "Propietario",
    ARRENDATARIO: "Arrendatario",
    RESIDENTE_ADICIONAL: "Residente adicional",
  };
  return tipos[tipo] || tipo;
}

function formatFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

onMounted(() => cargarUnidades());
</script>
