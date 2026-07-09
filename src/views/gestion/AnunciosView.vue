<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { anunciosService } from "@/services/anunciosService";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Select from "primevue/select";
import ToggleSwitch from "primevue/toggleswitch";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";

const auth = useAuthStore();

const loading = ref(true);
const error = ref(null);
const anuncios = ref([]);
const mostrandoTodos = ref(false);

const showCrear = ref(false);
const enviando = ref(false);

const form = ref({
  titulo: "",
  mensaje: "",
  audiencia: "TODOS",
  prioridad: "NORMAL",
  requiereConfirmacion: false,
  condominioNombre: "",
  fechaExpiracion: null,
});

const audiencias = [
  { label: "Todos", value: "TODOS" },
  { label: "Residentes", value: "RESIDENTES" },
  { label: "Propietarios", value: "PROPIETARIOS" },
  { label: "Comité", value: "COMITE" },
  { label: "Guardias", value: "GUARDIAS" },
  { label: "Administradores", value: "ADMINISTRADORES" },
  { label: "Unidad", value: "UNIDAD" },
  { label: "Persona", value: "PERSONA" },
];

const prioridades = [
  { label: "Normal", value: "NORMAL" },
  { label: "Importante", value: "IMPORTANTE" },
  { label: "Urgente", value: "URGENTE" },
];

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const fn = mostrandoTodos.value ? anunciosService.listarTodos : anunciosService.listarVigentes;
    const { data } = await fn(cid);
    anuncios.value = data;
  } catch (e) {
    console.error("Error al cargar anuncios", e);
    error.value = "No se pudieron cargar los anuncios";
  } finally {
    loading.value = false;
  }
}

function abrirCrear() {
  form.value = {
    titulo: "",
    mensaje: "",
    audiencia: "TODOS",
    prioridad: "NORMAL",
    requiereConfirmacion: false,
    condominioNombre: auth.condominioActualNombre || "",
    fechaExpiracion: null,
  };
  showCrear.value = true;
}

async function crear() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    await anunciosService.crear(cid, {
      ...form.value,
      fechaExpiracion: form.value.fechaExpiracion || null,
    });
    showCrear.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al crear anuncio", e);
  } finally {
    enviando.value = false;
  }
}

function prioridadSeverity(p) {
  if (p === "URGENTE") return "danger";
  if (p === "IMPORTANTE") return "warn";
  return "info";
}

function toggleVista() {
  mostrandoTodos.value = !mostrandoTodos.value;
  cargar();
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold m-0">Anuncios</h1>
      <div class="flex gap-2">
        <Button
          :label="mostrandoTodos ? 'Vigentes' : 'Todos'"
          icon="pi pi-filter"
          size="small"
          severity="secondary"
          @click="toggleVista"
        />
        <Button label="Nuevo anuncio" icon="pi pi-plus" size="small" @click="abrirCrear" />
      </div>
    </div>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!anuncios.length" class="text-center text-surface-400 py-8">
        No hay anuncios
      </div>
      <div v-else class="flex flex-col gap-2">
        <Card v-for="a in anuncios" :key="a.id">
          <template #title>
            <div class="flex items-center gap-2">
              <span>{{ a.titulo }}</span>
              <Tag :value="a.prioridad" :severity="prioridadSeverity(a.prioridad)" size="small" />
              <Tag v-if="a.vigente" value="Vigente" severity="success" size="small" />
              <Tag v-else value="Expirado" severity="secondary" size="small" />
            </div>
          </template>
          <template #subtitle>
            {{ a.audiencia }} · {{ a.fechaPublicacion ? new Date(a.fechaPublicacion).toLocaleDateString('es-CL') : '' }}
          </template>
          <template #content>
            <p class="text-sm text-surface-700 m-0 whitespace-pre-line">{{ a.mensaje }}</p>
          </template>
        </Card>
      </div>
    </template>

    <Dialog v-model:visible="showCrear" header="Nuevo anuncio" modal :style="{ width: '95%', maxWidth: '500px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Título</label>
          <InputText v-model="form.titulo" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Mensaje</label>
          <Textarea v-model="form.mensaje" rows="4" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Audiencia</label>
          <Select v-model="form.audiencia" :options="audiencias" optionLabel="label" optionValue="value" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Prioridad</label>
          <Select v-model="form.prioridad" :options="prioridades" optionLabel="label" optionValue="value" />
        </div>
        <div class="flex items-center gap-2">
          <ToggleSwitch v-model="form.requiereConfirmacion" inputId="req" />
          <label for="req" class="text-sm">Requiere confirmación</label>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showCrear = false" />
        <Button label="Publicar" :loading="enviando" @click="crear" />
      </template>
    </Dialog>
  </div>
</template>
