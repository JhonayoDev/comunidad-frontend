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
            @input="form.patente = form.patente.toUpperCase()"
          />
        </div>

        <!-- Nombre visitante -->
        <div class="form-control">
          <label class="label"
            ><span class="label-text font-semibold"
              >Nombre visitante *</span
            ></label
          >
          <input
            v-model="form.nombreVisitante"
            type="text"
            placeholder="Nombre de quien ingresa"
            class="input input-bordered"
            :class="{ 'input-error': errores.nombreVisitante }"
          />
          <p v-if="errores.nombreVisitante" class="text-error text-xs mt-1">
            {{ errores.nombreVisitante }}
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

        <!-- Tipo (categoría) -->
        <div class="form-control">
          <label class="label"
            ><span class="label-text font-semibold">Tipo *</span></label
          >
          <select
            v-model="form.tipo"
            class="select select-bordered"
            :class="{ 'select-error': errores.tipo }"
          >
            <option value="">Seleccione un tipo</option>
            <option v-for="cat in categorias" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
          <p v-if="errores.tipo" class="text-error text-xs mt-1">
            {{ errores.tipo }}
          </p>
        </div>

        <!-- Unidad destino -->
        <div class="form-control">
          <label class="label"
            ><span class="label-text font-semibold"
              >Casa destino *</span
            ></label
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

        <!-- Notas -->
        <div class="form-control">
          <label class="label"
            ><span class="label-text font-semibold"
              >Observación (opcional)</span
            ></label
          >
          <textarea
            v-model="form.observacion"
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
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/authStore";
import { visitasService } from "../../services/visitasService";
import { unidadesService } from "../../services/unidadesService";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const loading = ref(false);
const loadingUnidades = ref(false);
const errorGeneral = ref("");
const unidades = ref([]);

const form = ref({
  patente: route.query.patente || "",
  nombreVisitante: "",
  cantidadPersonas: 1,
  tipo: "",
  unidadId: "",
  observacion: "",
});

const errores = ref({});

const categorias = [
  { value: "VISITA", label: "Visita personal" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "UBER", label: "Uber / Taxi" },
  { value: "SERVICIO", label: "Servicio" },
  { value: "TECNICO", label: "Técnico" },
  { value: "OTRO", label: "Otro" },
];

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

function validar() {
  errores.value = {};
  if (!form.value.nombreVisitante)
    errores.value.nombreVisitante = "Campo obligatorio";
  if (!form.value.cantidadPersonas || form.value.cantidadPersonas < 1)
    errores.value.cantidadPersonas = "Mínimo 1 persona";
  if (!form.value.tipo)
    errores.value.tipo = "Seleccione un tipo";
  if (!form.value.unidadId)
    errores.value.unidadId = "Seleccione una casa destino";
  return Object.keys(errores.value).length === 0;
}

async function registrar() {
  errorGeneral.value = "";
  if (!validar()) return;

  const cid = auth.condominioActualId;
  if (!cid) return;

  const body = {
    unidadId: form.value.unidadId,
    nombreVisitante: form.value.nombreVisitante,
    tipo: form.value.tipo,
    cantidadPersonas: Number(form.value.cantidadPersonas),
  };
  if (form.value.patente) body.patenteVisitante = form.value.patente;
  if (form.value.observacion) body.observacion = form.value.observacion;

  loading.value = true;
  try {
    await visitasService.registrarIngreso(cid, body);
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
