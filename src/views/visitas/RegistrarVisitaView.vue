<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { visitasService } from "@/services/visitasService";
import { unidadesService } from "@/services/unidadesService";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";

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
  tipo: null,
  unidadId: null,
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
  if (!cid) return;
  loadingUnidades.value = true;
  try {
    const { data } = await unidadesService.getUnidades(cid);
    unidades.value = data.filter((u) => u.tipo === "CASA");
  } catch (e) {
    console.error("Error al cargar unidades:", e);
  } finally {
    loadingUnidades.value = false;
  }
}

function validar() {
  errores.value = {};
  if (!form.value.nombreVisitante) errores.value.nombreVisitante = "Campo obligatorio";
  if (!form.value.cantidadPersonas || form.value.cantidadPersonas < 1) errores.value.cantidadPersonas = "Mínimo 1 persona";
  if (!form.value.tipo) errores.value.tipo = "Seleccione un tipo";
  if (!form.value.unidadId) errores.value.unidadId = "Seleccione una casa destino";
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
      data.fields.forEach((f) => { errores.value[f.field] = f.message; });
    } else {
      errorGeneral.value = data?.message || "Error al registrar la visita";
    }
  } finally {
    loading.value = false;
  }
}

onMounted(cargarUnidades);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <h1 class="text-xl font-bold m-0">Registrar Visita</h1>

    <Card>
      <template #content>
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Patente</label>
            <InputText v-model="form.patente" placeholder="Ej: AB1234A (opcional)" class="uppercase" maxlength="7" @input="form.patente = form.patente.toUpperCase()" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Nombre visitante *</label>
            <InputText v-model="form.nombreVisitante" placeholder="Nombre de quien ingresa" :class="{ 'p-invalid': errores.nombreVisitante }" />
            <small v-if="errores.nombreVisitante" class="text-red-500">{{ errores.nombreVisitante }}</small>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Cantidad de personas *</label>
            <InputNumber v-model="form.cantidadPersonas" :min="1" :class="{ 'p-invalid': errores.cantidadPersonas }" class="w-full" />
            <small v-if="errores.cantidadPersonas" class="text-red-500">{{ errores.cantidadPersonas }}</small>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Tipo *</label>
            <Select v-model="form.tipo" :options="categorias" optionLabel="label" optionValue="value" placeholder="Seleccione un tipo" :class="{ 'p-invalid': errores.tipo }" class="w-full" />
            <small v-if="errores.tipo" class="text-red-500">{{ errores.tipo }}</small>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Casa destino *</label>
            <Skeleton v-if="loadingUnidades" width="100%" height="2.5rem" />
            <Select v-else v-model="form.unidadId" :options="unidades" optionLabel="label" optionValue="id" placeholder="Seleccione una casa" :class="{ 'p-invalid': errores.unidadId }" class="w-full">
              <template #option="slotProps">
                <span>Casa {{ slotProps.option.numero }} — {{ slotProps.option.sectorNombre }}</span>
              </template>
            </Select>
            <small v-if="errores.unidadId" class="text-red-500">{{ errores.unidadId }}</small>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Observación (opcional)</label>
            <Textarea v-model="form.observacion" rows="2" placeholder="Observaciones adicionales" />
          </div>
          <Message v-if="errorGeneral" severity="error" :closable="false">{{ errorGeneral }}</Message>
          <div class="flex gap-2 mt-1">
            <Button label="Cancelar" severity="secondary" variant="text" class="flex-1" @click="$router.back()" />
            <Button label="Registrar ingreso" icon="pi pi-check" :loading="loading" class="flex-1" @click="registrar" />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
