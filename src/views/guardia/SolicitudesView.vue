<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold">Solicitudes</h2>
      <button class="btn btn-primary btn-sm" @click="mostrarFormulario = true">
        + Nueva
      </button>
    </div>

    <!-- Formulario nueva solicitud -->
    <div v-if="mostrarFormulario" class="card bg-base-100 shadow">
      <div class="card-body p-4">
        <h3 class="font-bold mb-3">Nueva solicitud de registro</h3>

        <div class="flex flex-col gap-3">
          <div class="form-control">
            <label class="label"
              ><span class="label-text font-semibold"
                >Nombre completo *</span
              ></label
            >
            <input
              v-model="form.nombre"
              type="text"
              class="input input-bordered"
              :class="{ 'input-error': errores.nombre }"
              placeholder="Nombre del nuevo residente"
            />
            <p v-if="errores.nombre" class="text-error text-xs mt-1">
              {{ errores.nombre }}
            </p>
          </div>

          <div class="form-control">
            <label class="label"
              ><span class="label-text font-semibold">Email *</span></label
            >
            <input
              v-model="form.email"
              type="email"
              class="input input-bordered"
              :class="{ 'input-error': errores.email }"
              placeholder="correo@ejemplo.com"
            />
            <p v-if="errores.email" class="text-error text-xs mt-1">
              {{ errores.email }}
            </p>
          </div>

          <div class="form-control">
            <label class="label"
              ><span class="label-text font-semibold">Casa *</span></label
            >
            <div v-if="loadingUnidades" class="flex justify-center py-2">
              <span class="loading loading-spinner loading-sm"></span>
            </div>
            <select
              v-else
              v-model="form.unidadId"
              class="select select-bordered"
              :class="{ 'select-error': errores.unidadId }"
            >
              <option value="">Seleccione una casa</option>
              <option v-for="u in unidades" :key="u.id" :value="u.id">
                Casa {{ u.numero }} — Sector {{ u.sectorNumero }}
              </option>
            </select>
            <p v-if="errores.unidadId" class="text-error text-xs mt-1">
              {{ errores.unidadId }}
            </p>
          </div>

          <div class="form-control">
            <label class="label"
              ><span class="label-text font-semibold"
                >Tipo de vínculo *</span
              ></label
            >
            <select
              v-model="form.tipoVinculo"
              class="select select-bordered"
              :class="{ 'select-error': errores.tipoVinculo }"
            >
              <option value="">Seleccione un tipo</option>
              <option value="PROPIETARIO">Propietario</option>
              <option value="ARRENDATARIO">Arrendatario</option>
              <option value="RESIDENTE_ADICIONAL">Residente adicional</option>
            </select>
            <p v-if="errores.tipoVinculo" class="text-error text-xs mt-1">
              {{ errores.tipoVinculo }}
            </p>
          </div>

          <div class="form-control">
            <label class="label"
              ><span class="label-text font-semibold"
                >Notas (opcional)</span
              ></label
            >
            <textarea
              v-model="form.notas"
              class="textarea textarea-bordered"
              placeholder="Observaciones adicionales"
              rows="2"
            ></textarea>
          </div>

          <p v-if="errorGeneral" class="text-error text-sm">
            {{ errorGeneral }}
          </p>
          <p v-if="mensajeExito" class="text-success text-sm">
            {{ mensajeExito }}
          </p>

          <div class="flex gap-2">
            <button class="btn btn-ghost flex-1" @click="cancelar">
              Cancelar
            </button>
            <button
              class="btn btn-primary flex-1"
              :disabled="loading"
              @click="enviar"
            >
              <span
                v-if="loading"
                class="loading loading-spinner loading-sm"
              ></span>
              <span v-else>Enviar solicitud</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de solicitudes recientes -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <h3
          class="px-4 pt-4 pb-2 text-sm font-semibold text-base-content/60 uppercase tracking-wide"
        >
          Solicitudes recientes
        </h3>

        <div v-if="loadingSolicitudes" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </div>

        <div v-else-if="solicitudes.length === 0" class="text-center py-8">
          <p class="text-4xl mb-2">📋</p>
          <p class="text-base-content/60 text-sm">
            No hay solicitudes registradas
          </p>
        </div>

        <div v-else>
          <div
            v-for="s in solicitudes"
            :key="s.id"
            class="flex items-start justify-between px-4 py-3 border-t border-base-200"
          >
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm">{{ s.nombre }}</p>
              <p class="text-xs text-base-content/60">{{ s.email }}</p>
              <p class="text-xs text-base-content/40">
                Casa {{ s.unidadNumero }} — {{ tipoVinculo(s.tipoVinculo) }}
              </p>
            </div>
            <span
              class="badge badge-sm shrink-0"
              :class="badgeEstado(s.estado)"
            >
              {{ s.estado }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { solicitudesService } from "../../services/solicitudesService";
import { unidadesService } from "../../services/unidadesService";

const mostrarFormulario = ref(false);
const loading = ref(false);
const loadingUnidades = ref(false);
const loadingSolicitudes = ref(false);
const errorGeneral = ref("");
const mensajeExito = ref("");
const errores = ref({});
const unidades = ref([]);
const solicitudes = ref([]);

const form = ref({
  nombre: "",
  email: "",
  unidadId: "",
  tipoVinculo: "",
  notas: "",
});

async function cargarUnidades() {
  loadingUnidades.value = true;
  try {
    const response = await unidadesService.getUnidades();
    unidades.value = response.data.filter((u) => u.tipo === "CASA");
  } catch {
    // silencioso
  } finally {
    loadingUnidades.value = false;
  }
}

async function cargarSolicitudes() {
  loadingSolicitudes.value = true;
  try {
    const response = await solicitudesService.getTodas();
    solicitudes.value = response.data;
  } catch {
    // silencioso
  } finally {
    loadingSolicitudes.value = false;
  }
}

function validar() {
  errores.value = {};
  if (!form.value.nombre) errores.value.nombre = "Campo obligatorio";
  if (!form.value.email) errores.value.email = "Campo obligatorio";
  if (!form.value.unidadId) errores.value.unidadId = "Seleccione una casa";
  if (!form.value.tipoVinculo) errores.value.tipoVinculo = "Seleccione un tipo";
  return Object.keys(errores.value).length === 0;
}

async function enviar() {
  errorGeneral.value = "";
  mensajeExito.value = "";
  if (!validar()) return;

  loading.value = true;
  try {
    await solicitudesService.crear({
      nombre: form.value.nombre,
      email: form.value.email,
      unidadId: form.value.unidadId,
      tipoVinculo: form.value.tipoVinculo,
      notas: form.value.notas || null,
    });
    mensajeExito.value = "Solicitud enviada. La administración la revisará.";
    cancelar();
    cargarSolicitudes();
  } catch (e) {
    errorGeneral.value =
      e.response?.data?.message || "Error al enviar la solicitud";
  } finally {
    loading.value = false;
  }
}

function cancelar() {
  mostrarFormulario.value = false;
  form.value = {
    nombre: "",
    email: "",
    unidadId: "",
    tipoVinculo: "",
    notas: "",
  };
  errores.value = {};
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

onMounted(() => {
  cargarUnidades();
  cargarSolicitudes();
});
</script>
