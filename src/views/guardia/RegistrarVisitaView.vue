<template>
  <div class="p-4">
    <h2 class="text-lg font-bold mb-4">Registrar Visita</h2>

    <div class="card bg-base-100 shadow">
      <div class="card-body p-4 flex flex-col gap-3">
        <!-- Patente -->
        <div class="form-control">
          <label class="label"
            ><span class="label-text font-semibold">Patente</span></label
          >
          <input
            v-model="form.patente"
            type="text"
            placeholder="Ej: AB1234A (opcional)"
            class="input input-bordered uppercase"
            maxlength="7"
            @input="
              form.patente = form.patente.toUpperCase();
              buscarFrecuente();
            "
          />
          <!-- Sugerencias de visitas frecuentes -->
          <div
            v-if="sugerencias.length > 0"
            class="bg-base-100 border border-base-300 rounded-box mt-1 shadow-lg z-10"
          >
            <div
              v-for="s in sugerencias"
              :key="s.patente"
              class="p-3 hover:bg-base-200 cursor-pointer"
              @click="aplicarSugerencia(s)"
            >
              <p class="font-semibold text-sm">{{ s.patente }}</p>
              <p class="text-xs text-base-content/60">
                {{ s.nombreResponsable }} — {{ s.categoria }}
              </p>
            </div>
          </div>
        </div>

        <!-- Nombre responsable -->
        <div class="form-control">
          <label class="label"
            ><span class="label-text font-semibold"
              >Nombre responsable *</span
            ></label
          >
          <input
            v-model="form.nombreResponsable"
            type="text"
            placeholder="Nombre de quien ingresa"
            class="input input-bordered"
            :class="{ 'input-error': errores.nombreResponsable }"
          />
          <p v-if="errores.nombreResponsable" class="text-error text-xs mt-1">
            {{ errores.nombreResponsable }}
          </p>
        </div>

        <!-- Cantidad de personas -->
        <div class="form-control">
          <label class="label"
            ><span class="label-text font-semibold"
              >Cantidad de personas *</span
            ></label
          >
          <input
            v-model.number="form.cantidadPersonas"
            type="number"
            min="1"
            class="input input-bordered"
            :class="{ 'input-error': errores.cantidadPersonas }"
          />
          <p v-if="errores.cantidadPersonas" class="text-error text-xs mt-1">
            {{ errores.cantidadPersonas }}
          </p>
        </div>

        <!-- Categoría -->
        <div class="form-control">
          <label class="label"
            ><span class="label-text font-semibold">Categoría *</span></label
          >
          <select
            v-model="form.categoria"
            class="select select-bordered"
            :class="{ 'select-error': errores.categoria }"
          >
            <option value="">Seleccione una categoría</option>
            <option
              v-for="cat in categorias"
              :key="cat.value"
              :value="cat.value"
            >
              {{ cat.label }}
            </option>
          </select>
          <p v-if="errores.categoria" class="text-error text-xs mt-1">
            {{ errores.categoria }}
          </p>
        </div>

        <!-- Descripción (solo si categoría es OTRO) -->
        <div v-if="form.categoria === 'OTRO'" class="form-control">
          <label class="label"
            ><span class="label-text font-semibold">Descripción *</span></label
          >
          <input
            v-model="form.descripcionCategoria"
            type="text"
            placeholder="Describa el motivo"
            class="input input-bordered"
            :class="{ 'input-error': errores.descripcionCategoria }"
          />
          <p
            v-if="errores.descripcionCategoria"
            class="text-error text-xs mt-1"
          >
            {{ errores.descripcionCategoria }}
          </p>
        </div>

        <!-- Unidades destino -->
        <div class="form-control">
          <label class="label"
            ><span class="label-text font-semibold"
              >Casa(s) destino *</span
            ></label
          >
          <div v-if="loadingUnidades" class="flex justify-center py-2">
            <span class="loading loading-spinner loading-sm"></span>
          </div>
          <div v-else class="flex gap-2">
            <select
              v-model="unidadSeleccionada"
              class="select select-bordered flex-1"
            >
              <option value="">Seleccione una casa</option>
              <option v-for="u in unidades" :key="u.id" :value="u">
                Casa {{ u.numero }} — Sector {{ u.sectorNumero }}
              </option>
            </select>
            <button
              type="button"
              class="btn btn-primary"
              @click="agregarUnidad"
            >
              +
            </button>
          </div>
          <!-- Unidades seleccionadas -->
          <div
            v-if="form.unidadesId.length > 0"
            class="flex flex-wrap gap-2 mt-2"
          >
            <div
              v-for="u in unidadesSeleccionadas"
              :key="u.id"
              class="badge badge-primary gap-1"
            >
              Casa {{ u.numero }}
              <button type="button" @click="quitarUnidad(u.id)">✕</button>
            </div>
          </div>
          <p v-if="errores.unidadesId" class="text-error text-xs mt-1">
            {{ errores.unidadesId }}
          </p>
        </div>

        <!-- Notas -->
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

        <!-- Error general -->
        <p v-if="errorGeneral" class="text-error text-sm">{{ errorGeneral }}</p>

        <!-- Botones -->
        <div class="flex gap-2 mt-2">
          <button class="btn btn-ghost flex-1" @click="$router.back()">
            Cancelar
          </button>
          <button
            class="btn btn-primary flex-1"
            :disabled="loading"
            @click="registrar"
          >
            <span
              v-if="loading"
              class="loading loading-spinner loading-sm"
            ></span>
            <span v-else>Registrar ingreso</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { visitasService } from "../../services/visitasService";
import { unidadesService } from "../../services/unidadesService";

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const loadingUnidades = ref(false);
const errorGeneral = ref("");
const sugerencias = ref([]);
const unidades = ref([]);
const unidadSeleccionada = ref("");

const form = ref({
  patente: route.query.patente || "",
  nombreResponsable: "",
  cantidadPersonas: 1,
  categoria: "",
  descripcionCategoria: null,
  unidadesId: [],
  notas: null,
});

const errores = ref({});

const categorias = [
  { value: "VISITA_PERSONAL", label: "Visita personal" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "SERVICIO_HOGAR", label: "Servicio al hogar" },
  { value: "SERVICIO_CONDOMINIO", label: "Servicio al condominio" },
  { value: "VEHICULO_RESIDENTE", label: "Vehículo residente" },
  { value: "EMERGENCIA", label: "Emergencia" },
  { value: "COMERCIO_AMBULANTE", label: "Comercio ambulante" },
  { value: "OTRO", label: "Otro" },
];

const unidadesSeleccionadas = computed(() =>
  unidades.value.filter((u) => form.value.unidadesId.includes(u.id)),
);

async function cargarUnidades() {
  loadingUnidades.value = true;
  try {
    const response = await unidadesService.getUnidades();
    unidades.value = response.data.filter((u) => u.tipo === "CASA");
  } catch {
    // error silencioso
  } finally {
    loadingUnidades.value = false;
  }
}

let timeoutSugerencias = null;
async function buscarFrecuente() {
  clearTimeout(timeoutSugerencias);
  if (form.value.patente.length < 3) {
    sugerencias.value = [];
    return;
  }
  timeoutSugerencias = setTimeout(async () => {
    try {
      const response = await visitasService.getVisitasFrecuentes(
        form.value.patente,
      );
      sugerencias.value = response.data;
    } catch {
      sugerencias.value = [];
    }
  }, 400);
}

function aplicarSugerencia(s) {
  form.value.patente = s.patente;
  form.value.nombreResponsable = s.nombreResponsable;
  form.value.categoria = s.categoria;
  sugerencias.value = [];
}

function agregarUnidad() {
  if (!unidadSeleccionada.value) return;
  if (!form.value.unidadesId.includes(unidadSeleccionada.value.id)) {
    form.value.unidadesId.push(unidadSeleccionada.value.id);
  }
  unidadSeleccionada.value = "";
}

function quitarUnidad(id) {
  form.value.unidadesId = form.value.unidadesId.filter((u) => u !== id);
}

function validar() {
  errores.value = {};
  if (!form.value.nombreResponsable)
    errores.value.nombreResponsable = "Campo obligatorio";
  if (!form.value.cantidadPersonas || form.value.cantidadPersonas < 1)
    errores.value.cantidadPersonas = "Mínimo 1 persona";
  if (!form.value.categoria)
    errores.value.categoria = "Seleccione una categoría";
  if (form.value.categoria === "OTRO" && !form.value.descripcionCategoria)
    errores.value.descripcionCategoria =
      "Campo obligatorio cuando categoría es OTRO";
  if (form.value.unidadesId.length === 0)
    errores.value.unidadesId = "Seleccione al menos una casa destino";
  return Object.keys(errores.value).length === 0;
}

async function registrar() {
  errorGeneral.value = "";
  if (!validar()) return;

  loading.value = true;
  try {
    await visitasService.registrarIngreso({
      patente: form.value.patente || null,
      nombreResponsable: form.value.nombreResponsable,
      cantidadPersonas: form.value.cantidadPersonas,
      categoria: form.value.categoria,
      descripcionCategoria: form.value.descripcionCategoria,
      unidadesId: form.value.unidadesId,
      notas: form.value.notas || null,
    });
    router.push({ name: "Visitas" });
  } catch (e) {
    const data = e.response?.data;
    if (data?.fields) {
      data.fields.forEach((f) => {
        errores.value[f.field] = f.message;
      });
    } else {
      errorGeneral.value = data?.message || "Error al registrar la visita";
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => cargarUnidades());
</script>
