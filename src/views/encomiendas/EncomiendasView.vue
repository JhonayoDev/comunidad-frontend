<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold">Encomiendas</h2>
      <button
        class="btn btn-primary btn-sm"
        @click="mostrarFormulario = !mostrarFormulario"
      >
        + Registrar
      </button>
    </div>

    <!-- Formulario registro -->
    <div v-if="mostrarFormulario" class="card bg-base-100 shadow">
      <div class="card-body p-4 flex flex-col gap-3">
        <h3 class="font-bold">Nueva encomienda</h3>

        <div class="form-control">
          <label class="label"
            ><span class="label-text font-semibold">Casa destino *</span></label
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
              Casa {{ u.numero }} — {{ u.sectorNombre }}
            </option>
          </select>
          <p v-if="errores.unidadId" class="text-error text-xs mt-1">
            {{ errores.unidadId }}
          </p>
        </div>

        <div class="form-control">
          <label class="label"
            ><span class="label-text font-semibold">Tipo *</span></label
          >
          <select
            v-model="form.tipo"
            class="select select-bordered"
            :class="{ 'select-error': errores.tipo }"
          >
            <option value="">Seleccione tipo</option>
            <option value="CARTA">Carta</option>
            <option value="ENCOMIENDA">Encomienda / Paquete</option>
          </select>
          <p v-if="errores.tipo" class="text-error text-xs mt-1">
            {{ errores.tipo }}
          </p>
        </div>

        <div class="form-control">
          <label class="label"
            ><span class="label-text font-semibold"
              >Nombre destinatario *</span
            ></label
          >
          <input
            v-model="form.nombreDestinatario"
            type="text"
            placeholder="Nombre del destinatario"
            class="input input-bordered"
            :class="{ 'input-error': errores.nombreDestinatario }"
          />
          <p
            v-if="errores.nombreDestinatario"
            class="text-error text-xs mt-1"
          >
            {{ errores.nombreDestinatario }}
          </p>
        </div>

        <p v-if="errorGeneral" class="text-error text-sm">{{ errorGeneral }}</p>
        <p v-if="mensajeExito" class="text-success text-sm">
          {{ mensajeExito }}
        </p>

        <div class="flex gap-2">
          <button class="btn btn-ghost flex-1" @click="cancelar">
            Cancelar
          </button>
          <button
            class="btn btn-primary flex-1"
            :disabled="loadingForm"
            @click="registrar"
          >
            <span
              v-if="loadingForm"
              class="loading loading-spinner loading-sm"
            ></span>
            <span v-else>Registrar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="flex gap-2">
      <button
        class="btn btn-sm"
        :class="filtroEstado === 'PENDIENTE' ? 'btn-primary' : 'btn-ghost'"
        @click="cambiarFiltro('PENDIENTE')"
      >
        Pendientes
      </button>
      <button
        class="btn btn-sm"
        :class="filtroEstado === 'ENTREGADA' ? 'btn-primary' : 'btn-ghost'"
        @click="cambiarFiltro('ENTREGADA')"
      >
        Entregadas
      </button>
      <button
        class="btn btn-sm"
        :class="filtroEstado === '' ? 'btn-primary' : 'btn-ghost'"
        @click="cambiarFiltro('')"
      >
        Todas
      </button>
    </div>

    <div v-if="error" class="alert alert-warning py-2">
      <span class="text-sm">⚠️ {{ error }}</span>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>

    <div v-else-if="encomiendas.length === 0" class="text-center py-12">
      <p class="text-4xl mb-2">📦</p>
      <p class="text-base-content/60 text-sm">No hay encomiendas</p>
    </div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="e in encomiendas"
        :key="e.id"
        class="card bg-base-100 shadow-sm"
      >
        <div class="card-body p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="font-bold">Casa {{ e.unidadNumero }}</p>
              <p class="text-sm">
                <span class="badge badge-xs badge-ghost">{{ e.tipo }}</span>
                {{ e.nombreDestinatario }}
              </p>
              <p class="text-xs text-base-content/60">
                {{ e.creadoPorNombre }}
              </p>
              <p class="text-xs text-base-content/40">
                {{ formatFecha(e.creadoEn) }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <span
                class="badge badge-sm"
                :class="
                  e.estado === 'PENDIENTE' ? 'badge-warning' : 'badge-success'
                "
              >
                {{ e.estado === "PENDIENTE" ? "Pendiente" : "Entregada" }}
              </span>
              <button
                v-if="e.estado === 'PENDIENTE'"
                class="btn btn-outline btn-xs"
                @click="handleEntregar(e)"
              >
                Entregar
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
import { useAuthStore } from "../../stores/authStore";
import { useEncomiendas } from "../../composables/useEncomiendas";
import { unidadesService } from "../../services/unidadesService";
import { encomiendasService } from "../../services/encomiendasService";

const auth = useAuthStore();
const { encomiendas, loading, error, cargar, entregar } = useEncomiendas();

const mostrarFormulario = ref(false);
const loadingForm = ref(false);
const loadingUnidades = ref(false);
const errorGeneral = ref("");
const mensajeExito = ref("");
const errores = ref({});
const unidades = ref([]);
const filtroEstado = ref("PENDIENTE");

const form = ref({
  unidadId: "",
  tipo: "",
  nombreDestinatario: "",
});

async function cargarUnidades() {
  const cid = auth.condominioActualId;
  if (!cid) {
    loadingUnidades.value = false;
    return;
  }
  loadingUnidades.value = true;
  try {
    const response = await unidadesService.getUnidades(cid);
    unidades.value = response.data.filter((u) => u.tipo === "CASA");
  } catch (e) {
    console.error("Error al cargar unidades:", e);
  } finally {
    loadingUnidades.value = false;
  }
}

function cambiarFiltro(estado) {
  filtroEstado.value = estado;
  const params = estado ? { estado } : {};
  cargar(params);
}

function validar() {
  errores.value = {};
  if (!form.value.unidadId) errores.value.unidadId = "Seleccione una casa";
  if (!form.value.tipo) errores.value.tipo = "Seleccione un tipo";
  if (!form.value.nombreDestinatario) errores.value.nombreDestinatario = "Campo obligatorio";
  return Object.keys(errores.value).length === 0;
}

async function registrar() {
  errorGeneral.value = "";
  mensajeExito.value = "";
  if (!validar()) return;

  const cid = auth.condominioActualId;
  if (!cid) return;
  loadingForm.value = true;
  try {
    await encomiendasService.registrar(cid, {
      unidadId: form.value.unidadId,
      tipo: form.value.tipo,
      nombreDestinatario: form.value.nombreDestinatario,
    });
    mensajeExito.value = "Encomienda registrada correctamente";
    cancelar();
    cargar({ estado: filtroEstado.value || undefined });
  } catch (e) {
    errorGeneral.value = e.response?.data?.message || "Error al registrar";
  } finally {
    loadingForm.value = false;
  }
}

async function handleEntregar(e) {
  const nombreRetira = prompt("Nombre de quien retira:");
  if (!nombreRetira) return;
  const rutRetira = prompt("RUT de quien retira:");
  if (!rutRetira) return;
  const resultado = await entregar(e, nombreRetira, rutRetira);
  if (resultado !== true) alert(resultado);
}

function cancelar() {
  mostrarFormulario.value = false;
  form.value = { unidadId: "", tipo: "", nombreDestinatario: "" };
  errores.value = {};
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

onMounted(() => {
  cargarUnidades();
  cargar({ estado: "PENDIENTE" });
});
</script>
