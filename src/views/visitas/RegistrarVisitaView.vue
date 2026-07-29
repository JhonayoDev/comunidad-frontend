<script setup>
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { visitasService } from "@/services/visitasService";
import { useUnidades } from "@/composables/useUnidades";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Select from "primevue/select";
import AutoComplete from "primevue/autocomplete";
import Textarea from "primevue/textarea";
import Message from "primevue/message";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const loading = ref(false);
const errorGeneral = ref("");

const form = ref({
  patente: route.query.patente || "",
  nombreVisitante: route.query.nombre || "",
  rutVisitante: "",
  telefonoVisitante: "",
  cantidadPersonas: 1,
  tipo: null,
  autorizacionId: route.query.autorizacionId || null,
  observacion: "",
});

const errores = ref({});

const unidadSeleccionada = ref(null);

const categorias = [
  { value: "VISITA", label: "Visita personal" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "UBER", label: "Uber / Taxi" },
  { value: "SERVICIO", label: "Servicio" },
  { value: "TECNICO", label: "Técnico" },
  { value: "OTRO", label: "Otro" },
];

const { unidades, loading: loadingUnidades } = useUnidades();

const todasUnidades = computed(() => unidades.value || []);

const unidadesVisibles = computed(() =>
  (unidades.value || []).filter((u) =>
    ["CASA", "DEPARTAMENTO", "OTRO"].includes(u.tipo),
  ),
);

const sugerenciasUnidades = ref([]);

watch(
  todasUnidades,
  (list) => {
    const num = route.query.unidad;
    if (num && list.length && !unidadSeleccionada.value) {
      const found = list.find((u) => u.numero === num);
      if (found) unidadSeleccionada.value = found;
    }
  },
  { immediate: true },
);

function buscarUnidad(event) {
  const query = (event.query || "").toLowerCase();
  if (!query) {
    sugerenciasUnidades.value = [];
    return;
  }
  sugerenciasUnidades.value = unidadesVisibles.value.filter((u) => {
    const num = (u.numero || "").toLowerCase();
    const sector = (u.sectorNombre || "").toLowerCase();
    return num.includes(query) || sector.includes(query);
  });
}

function formatUnidadSugerencia(unidad) {
  const base = unidad.sectorNombre
    ? `${unidad.numero} — ${unidad.sectorNombre}`
    : unidad.numero;
  if (unidad.tipo === "CASA") return `Casa ${base}`;
  if (unidad.tipo === "DEPARTAMENTO") return `Depto ${base}`;
  return `${unidad.tipo} ${base}`;
}

function validar() {
  errores.value = {};
  if (!form.value.nombreVisitante)
    errores.value.nombreVisitante = "Campo obligatorio";
  if (!form.value.cantidadPersonas || form.value.cantidadPersonas < 1)
    errores.value.cantidadPersonas = "Mínimo 1 persona";
  if (!form.value.tipo) errores.value.tipo = "Seleccione un tipo";
  if (!unidadSeleccionada.value)
    errores.value.unidadNumero = "Seleccione una casa de la lista";
  return Object.keys(errores.value).length === 0;
}

async function registrar() {
  errorGeneral.value = "";
  if (!validar()) return;
  const cid = auth.condominioActualId;
  if (!cid) return;
  if (!unidadSeleccionada.value) return;

  const body = {
    unidadId: unidadSeleccionada.value.id,
    nombreVisitante: form.value.nombreVisitante,
    tipo: form.value.tipo,
    cantidadPersonas: Number(form.value.cantidadPersonas),
  };
  if (form.value.patente) body.patenteVisitante = form.value.patente;
  if (form.value.rutVisitante) body.rutVisitante = form.value.rutVisitante;
  if (form.value.telefonoVisitante) body.telefonoVisitante = form.value.telefonoVisitante;
  if (form.value.observacion) body.observacion = form.value.observacion;
  if (form.value.autorizacionId)
    body.autorizacionId = form.value.autorizacionId;
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
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <h1 class="text-xl font-bold m-0">Registrar Visita</h1>

    <Card>
      <template #content>
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Patente</label>
            <InputText
              v-model="form.patente"
              placeholder="Ej: AB1234A (opcional)"
              class="uppercase"
              maxlength="10"
              @input="form.patente = form.patente.toUpperCase()"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Nombre visitante *</label>
            <InputText
              v-model="form.nombreVisitante"
              placeholder="Nombre de quien ingresa"
              :class="{ 'p-invalid': errores.nombreVisitante }"
            />
            <small v-if="errores.nombreVisitante" class="text-red-500">{{
              errores.nombreVisitante
            }}</small>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">RUT visitante <span class="text-text-muted font-normal">(opcional)</span></label>
            <InputText
              v-model="form.rutVisitante"
              placeholder="Ej: 12.345.678-9"
              maxlength="20"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Teléfono visitante <span class="text-text-muted font-normal">(opcional)</span></label>
            <InputText
              v-model="form.telefonoVisitante"
              placeholder="Ej: +56 9 1234 5678"
              maxlength="20"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Cantidad de personas *</label>
            <InputNumber
              v-model="form.cantidadPersonas"
              :min="1"
              :class="{ 'p-invalid': errores.cantidadPersonas }"
              class="w-full"
            />
            <small v-if="errores.cantidadPersonas" class="text-red-500">{{
              errores.cantidadPersonas
            }}</small>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Tipo *</label>
            <Select
              v-model="form.tipo"
              :options="categorias"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione un tipo"
              :class="{ 'p-invalid': errores.tipo }"
              class="w-full"
            />
            <small v-if="errores.tipo" class="text-red-500">{{
              errores.tipo
            }}</small>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Casa destino *</label>
            <AutoComplete
              v-model="unidadSeleccionada"
              :suggestions="sugerenciasUnidades"
              @complete="buscarUnidad"
              :optionLabel="formatUnidadSugerencia"
              forceSelection
              showClear
              placeholder="Escriba el número (ej: 32, A-101)"
              :class="{ 'p-invalid': errores.unidadNumero }"
              class="w-full"
              :loading="loadingUnidades"
            >
              <template #option="slotProps">
                <span>{{ formatUnidadSugerencia(slotProps.option) }}</span>
              </template>
            </AutoComplete>
            <small v-if="errores.unidadNumero" class="text-red-500">{{
              errores.unidadNumero
            }}</small>
            <small v-else class="text-text-muted"
              >Escriba el número de casa y seleccione de las sugerencias</small
            >
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Observación (opcional)</label>
            <Textarea
              v-model="form.observacion"
              rows="2"
              placeholder="Observaciones adicionales"
            />
          </div>
          <Message v-if="errorGeneral" severity="error" :closable="false">{{
            errorGeneral
          }}</Message>
          <div class="flex gap-2 mt-1">
            <Button
              label="Cancelar"
              severity="secondary"
              variant="text"
              class="flex-1 border border-border text-text-muted"
              @click="$router.back()"
            />
            <Button
              label="Registrar ingreso"
              icon="pi pi-check"
              :loading="loading"
              class="flex-1"
              @click="registrar"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
