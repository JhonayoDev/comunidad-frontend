<template>
  <div class="p-4 flex flex-col gap-4">
    <h2 class="text-lg font-bold">Solicitudes de registro</h2>

    <!-- Pestañas -->
    <div class="tabs tabs-boxed">
      <a
        class="tab"
        :class="{ 'tab-active': pestanaActiva === 'pendientes' }"
        @click="cambiarPestana('pendientes')"
      >
        Pendientes
        <span
          v-if="pendientes.length > 0"
          class="badge badge-warning badge-sm ml-1"
        >
          {{ pendientes.length }}
        </span>
      </a>
      <a
        class="tab"
        :class="{ 'tab-active': pestanaActiva === 'todas' }"
        @click="cambiarPestana('todas')"
      >
        Todas
      </a>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>

    <!-- Sin resultados -->
    <div v-else-if="listadoActual.length === 0" class="text-center py-12">
      <p class="text-4xl mb-2">📋</p>
      <p class="text-base-content/60 text-sm">
        {{
          pestanaActiva === "pendientes"
            ? "No hay solicitudes pendientes"
            : "No hay solicitudes"
        }}
      </p>
    </div>

    <!-- Lista -->
    <div v-else class="flex flex-col gap-3">
      <div
        v-for="s in listadoActual"
        :key="s.id"
        class="card bg-base-100 shadow"
      >
        <div class="card-body p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="font-bold">{{ s.nombre }}</p>
              <p class="text-sm text-base-content/60">{{ s.email }}</p>
              <p class="text-xs text-base-content/40 mt-1">
                Casa {{ s.unidadNumero }} — {{ tipoVinculo(s.tipoVinculo) }}
              </p>
              <p class="text-xs text-base-content/40">
                Creada por {{ s.creadoPorNombre }}
              </p>
              <p
                v-if="s.notas"
                class="text-xs text-base-content/60 mt-1 italic"
              >
                "{{ s.notas }}"
              </p>
            </div>
            <span
              class="badge badge-sm shrink-0"
              :class="badgeEstado(s.estado)"
            >
              {{ s.estado }}
            </span>
          </div>

          <!-- Botones solo para pendientes -->
          <div v-if="s.estado === 'PENDIENTE'" class="flex gap-2 mt-3">
            <button
              class="btn btn-error btn-sm flex-1"
              :disabled="procesando === s.id"
              @click="rechazar(s)"
            >
              <span
                v-if="procesando === s.id"
                class="loading loading-spinner loading-xs"
              ></span>
              <span v-else>Rechazar</span>
            </button>
            <button
              class="btn btn-success btn-sm flex-1"
              :disabled="procesando === s.id"
              @click="aprobar(s)"
            >
              <span
                v-if="procesando === s.id"
                class="loading loading-spinner loading-xs"
              ></span>
              <span v-else>Aprobar</span>
            </button>
          </div>

          <!-- Revisado por -->
          <p
            v-if="s.revisadoPorNombre"
            class="text-xs text-base-content/40 mt-2"
          >
            Revisada por {{ s.revisadoPorNombre }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { solicitudesService } from "../../services/solicitudesService";

const pestanaActiva = ref("pendientes");
const pendientes = ref([]);
const todas = ref([]);
const loading = ref(false);
const procesando = ref(null);

const listadoActual = computed(() =>
  pestanaActiva.value === "pendientes" ? pendientes.value : todas.value,
);

async function cargar() {
  loading.value = true;
  try {
    const [resPendientes, resTodas] = await Promise.all([
      solicitudesService.getPendientes(),
      solicitudesService.getTodas(),
    ]);
    pendientes.value = resPendientes.data;
    todas.value = resTodas.data;
  } catch {
    // silencioso
  } finally {
    loading.value = false;
  }
}

async function aprobar(solicitud) {
  procesando.value = solicitud.id;
  try {
    await solicitudesService.aprobar(solicitud.id);
    solicitud.estado = "APROBADA";
    pendientes.value = pendientes.value.filter((s) => s.id !== solicitud.id);
  } catch (e) {
    alert(e.response?.data?.message || "Error al aprobar");
  } finally {
    procesando.value = null;
  }
}

async function rechazar(solicitud) {
  procesando.value = solicitud.id;
  try {
    await solicitudesService.rechazar(solicitud.id);
    solicitud.estado = "RECHAZADA";
    pendientes.value = pendientes.value.filter((s) => s.id !== solicitud.id);
  } catch (e) {
    alert(e.response?.data?.message || "Error al rechazar");
  } finally {
    procesando.value = null;
  }
}

function cambiarPestana(pestana) {
  pestanaActiva.value = pestana;
}

function tipoVinculo(tipo) {
  const tipos = {
    PROPIETARIO: "Propietario",
    ARRENDATARIO: "Arrendatario",
    RESIDENTE_ADICIONAL: "Residente adicional",
  };
  return tipos[tipo] || tipo;
}

function badgeEstado(estado) {
  const clases = {
    PENDIENTE: "badge-warning",
    APROBADA: "badge-success",
    RECHAZADA: "badge-error",
  };
  return clases[estado] || "badge-ghost";
}

onMounted(() => cargar());
</script>
