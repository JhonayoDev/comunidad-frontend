<script setup>
import { ref, computed, onMounted } from "vue";
import { adminService } from "@/services/adminService";
import { useConfirm } from "primevue/useconfirm";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Select from "primevue/select";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Dialog from "primevue/dialog";
import Divider from "primevue/divider";
import ConfirmDialog from "primevue/confirmdialog";

const loading = ref(true);
const error = ref(null);
const plantillas = ref([]);

const confirm = useConfirm();

const busquedaVisible = ref(false);
const filtroCanal = ref(null);
const verInactivas = ref(false);

const showEditar = ref(false);
const editando = ref(null);
const enviando = ref(false);
const resultado = ref(null);
const form = ref({ tituloPlantilla: "", enAppPlantilla: "", emailPlantilla: "" });

const hayCambios = computed(() => {
  if (!editando.value) return false;
  return (
    form.value.tituloPlantilla !== (editando.value.tituloPlantilla || "") ||
    form.value.enAppPlantilla !== (editando.value.enAppPlantilla || "") ||
    form.value.emailPlantilla !== (editando.value.emailPlantilla || "")
  );
});

const showPreview = ref(false);
const previewCanal = ref("IN_APP");

const canalOptions = [
  { label: "In-App", value: "IN_APP" },
  { label: "Email", value: "EMAIL" },
  { label: "Push", value: "PUSH" },
];

const canalSeverity = { IN_APP: "info", EMAIL: "warn", PUSH: "success" };

const variables = ["{{nombre}}", "{{unidad}}", "{{condominio}}", "{{fecha}}", "{{extra}}", "{{imagen_url}}"];
const copiada = ref("");

const ejemplo = {
  nombre: "María",
  unidad: "Casa 12",
  condominio: "Condominio Los Robles",
  fecha: "12 ago 2026",
  extra: "Encomienda #123",
};

const plantillasFiltradas = computed(() => {
  let lista = plantillas.value;
  if (filtroCanal.value) {
    lista = lista.filter((p) => (p.canales || []).includes(filtroCanal.value));
  }
  return lista;
});

async function cargar() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await adminService.listarPlantillasNotificacion(verInactivas.value);
    plantillas.value = data || [];
  } catch (e) {
    console.error("Error al cargar plantillas de notificación", e);
    error.value = "No se pudieron cargar las plantillas de notificación";
  } finally {
    loading.value = false;
  }
}

function toggleBusqueda() {
  busquedaVisible.value = !busquedaVisible.value;
  if (!busquedaVisible.value) {
    filtroCanal.value = null;
    verInactivas.value = false;
    cargar();
  }
}

function buscar() {
  cargar();
}

function limpiarFiltros() {
  filtroCanal.value = null;
  verInactivas.value = false;
  cargar();
}

function abrirEditar(p) {
  editando.value = p;
  form.value = {
    tituloPlantilla: p.tituloPlantilla || "",
    enAppPlantilla: p.enAppPlantilla || "",
    emailPlantilla: p.emailPlantilla || "",
  };
  resultado.value = null;
  showEditar.value = true;
}

function confirmarGuardar() {
  confirm.require({
    message: `¿Guardar los cambios de la plantilla "${codigoLabel(editando.value.codigo)}"?`,
    header: "Guardar plantilla",
    acceptLabel: "Guardar",
    rejectLabel: "Cancelar",
    accept: () => guardar(),
  });
}

function confirmarCancelar() {
  if (!hayCambios.value) {
    showEditar.value = false;
    return;
  }
  confirm.require({
    message: "Hay cambios sin guardar. ¿Salir sin guardar?",
    header: "Descartar cambios",
    acceptLabel: "Descartar",
    rejectLabel: "Seguir editando",
    accept: () => {
      showEditar.value = false;
    },
  });
}

async function guardar() {
  if (!editando.value) return;
  enviando.value = true;
  resultado.value = null;
  try {
    await adminService.actualizarPlantillaNotificacion(editando.value.codigo, form.value);
    showEditar.value = false;
    editando.value = null;
    await cargar();
  } catch (e) {
    console.error("Error al guardar plantilla", e);
    resultado.value = e.response?.data?.message || "No se pudo guardar la plantilla.";
  } finally {
    enviando.value = false;
  }
}

function confirmarDesactivar(p) {
  confirm.require({
    message: `¿Desactivar la plantilla "${codigoLabel(p.codigo)}"? Los condominios que no tengan override dejarán de usarla.`,
    header: "Desactivar plantilla",
    acceptLabel: "Desactivar",
    rejectLabel: "Cancelar",
    accept: () => desactivar(p),
  });
}

async function desactivar(p) {
  try {
    await adminService.desactivarPlantillaNotificacion(p.codigo);
    plantillas.value = plantillas.value.map((x) =>
      x.codigo === p.codigo ? { ...x, activo: false } : x,
    );
  } catch (e) {
    console.error("Error al desactivar plantilla", e);
  }
}

function confirmarReactivar(p) {
  confirm.require({
    message: `¿Reactivar la plantilla "${codigoLabel(p.codigo)}"? Volverá a estar disponible como base para los condominios.`,
    header: "Reactivar plantilla",
    acceptLabel: "Reactivar",
    rejectLabel: "Cancelar",
    accept: () => reactivar(p),
  });
}

async function reactivar(p) {
  try {
    await adminService.reactivarPlantillaNotificacion(p.codigo);
    plantillas.value = plantillas.value.map((x) =>
      x.codigo === p.codigo ? { ...x, activo: true } : x,
    );
  } catch (e) {
    console.error("Error al reactivar plantilla", e);
  }
}

function codigoLabel(codigo) {
  return codigo.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function copiarVariable(v) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(v);
    } else {
      const ta = document.createElement("textarea");
      ta.value = v;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    copiada.value = v;
    setTimeout(() => {
      if (copiada.value === v) copiada.value = "";
    }, 1500);
  } catch (e) {
    console.error("Error al copiar variable", e);
  }
}

function interpolar(texto) {
  if (!texto) return "";
  return texto
    .replace(/\{\{nombre\}\}/g, ejemplo.nombre)
    .replace(/\{\{unidad\}\}/g, ejemplo.unidad)
    .replace(/\{\{condominio\}\}/g, ejemplo.condominio)
    .replace(/\{\{fecha\}\}/g, ejemplo.fecha)
    .replace(/\{\{extra\}\}/g, ejemplo.extra)
    .replace(/\{\{imagen_url\}\}/g, "https://ejemplo.cl/imagen.png");
}

function abrirPreview(p) {
  editando.value = p;
  form.value = {
    tituloPlantilla: p.tituloPlantilla || "",
    enAppPlantilla: p.enAppPlantilla || "",
    emailPlantilla: p.emailPlantilla || "",
  };
  previewCanal.value = (p.canales || [])[0] || "IN_APP";
  showPreview.value = true;
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Plantillas de notificación</h1>
      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-search"
          size="small"
          :severity="busquedaVisible ? 'primary' : 'secondary'"
          variant="outlined"
          class="rounded-lg shrink-0"
          aria-label="Buscar"
          :aria-pressed="busquedaVisible"
          @click="toggleBusqueda"
        />
      </div>
    </div>

    <Card v-if="busquedaVisible">
      <template #content>
        <div class="flex flex-wrap gap-2 items-end">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Canal</label>
            <Select
              v-model="filtroCanal"
              :options="canalOptions"
              option-label="label"
              option-value="value"
              placeholder="Todos"
              show-clear
              size="small"
              class="w-36"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Estado</label>
            <Select
              v-model="verInactivas"
              :options="[
                { label: 'Solo activas', value: false },
                { label: 'Incluir inactivas', value: true },
              ]"
              option-label="label"
              option-value="value"
              size="small"
              class="w-44"
            />
          </div>
          <Button label="Buscar" icon="pi pi-search" size="small" severity="secondary" @click="buscar" />
          <Button label="Limpiar" size="small" variant="text" @click="limpiarFiltros" />
        </div>
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!plantillasFiltradas.length" class="text-center text-surface-400 py-8">
        No hay plantillas con esos filtros
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card v-for="p in plantillasFiltradas" :key="p.codigo" :class="{ 'opacity-60': !p.activo }">
          <template #title>
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm">{{ codigoLabel(p.codigo) }}</span>
              <Tag :value="p.activo ? 'Activo' : 'Inactivo'" :severity="p.activo ? 'success' : 'danger'" size="small" />
            </div>
          </template>
          <template #content>
            <div class="flex flex-wrap gap-1 mb-2">
              <Tag value="Global" severity="secondary" size="small" />
              <Tag v-for="c in p.canales || []" :key="c" :value="c" :severity="canalSeverity[c] || 'info'" size="small" />
            </div>
            <p class="text-sm text-surface-500 m-0 line-clamp-2">{{ p.tituloPlantilla }}</p>
          </template>
          <template #footer>
            <div class="flex gap-2">
              <Button label="Editar" size="small" severity="secondary" variant="outlined" @click="abrirEditar(p)" />
              <Button label="Preview" size="small" severity="secondary" variant="text" @click="abrirPreview(p)" />
              <Button v-if="p.activo" label="Desactivar" size="small" severity="danger" variant="outlined" @click="confirmarDesactivar(p)" />
              <Button v-else label="Reactivar" size="small" severity="success" variant="outlined" @click="confirmarReactivar(p)" />
            </div>
          </template>
        </Card>
      </div>
    </template>

    <Dialog v-model:visible="showEditar" :header="editando ? codigoLabel(editando.codigo) : ''" modal :style="{ width: '95%', maxWidth: '500px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-surface-500">Variables disponibles (toca para copiar)</label>
          <div class="flex flex-wrap gap-1">
            <Tag
              v-for="v in variables"
              :key="v"
              :value="copiada === v ? '¡Copiada!' : v"
              :severity="copiada === v ? 'success' : 'secondary'"
              size="small"
              class="cursor-pointer select-all"
              @click="copiarVariable(v)"
            />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Título</label>
          <InputText v-model="form.tituloPlantilla" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Plantilla App</label>
          <Textarea v-model="form.enAppPlantilla" rows="3" placeholder="Mensaje para notificaciones en la app" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Plantilla Email</label>
          <Textarea v-model="form.emailPlantilla" rows="3" placeholder="Mensaje para notificaciones por email (opcional)" />
        </div>
        <Message v-if="resultado" severity="error" :closable="false">{{ resultado }}</Message>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="confirmarCancelar" />
        <Button label="Guardar" icon="pi pi-check" :loading="enviando" @click="confirmarGuardar" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showPreview" :header="editando ? `Preview — ${codigoLabel(editando.codigo)}` : 'Preview'" modal :style="{ width: '95%', maxWidth: '480px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-surface-500">Canal</label>
          <Select
            v-model="previewCanal"
            :options="canalOptions"
            option-label="label"
            option-value="value"
            size="small"
            class="w-full"
          />
        </div>

        <div v-if="previewCanal === 'IN_APP'" class="bg-surface p-3 border-round flex flex-col gap-1">
          <span class="font-bold text-sm">{{ interpolar(form.tituloPlantilla) }}</span>
          <span class="text-sm text-surface-500">{{ interpolar(form.enAppPlantilla) }}</span>
        </div>

        <div v-else-if="previewCanal === 'PUSH'" class="bg-surface p-3 border-round flex flex-col gap-1">
          <span class="text-xs text-surface-400">{{ ejemplo.condominio }}</span>
          <span class="font-bold text-sm">{{ interpolar(form.tituloPlantilla) }}</span>
          <span class="text-sm text-surface-500">{{ interpolar(form.enAppPlantilla) }}</span>
        </div>

        <div v-else class="bg-surface p-3 border-round flex flex-col gap-1">
          <span class="text-xs text-surface-400">De: {{ ejemplo.condominio }}</span>
          <span class="font-bold text-sm">{{ interpolar(form.tituloPlantilla) }}</span>
          <Divider />
          <span class="text-sm text-surface-500">{{ interpolar(form.emailPlantilla || form.enAppPlantilla) }}</span>
        </div>

        <div class="text-xs text-surface-400">
          Preview simulado con datos de ejemplo ({{ ejemplo.nombre }}, {{ ejemplo.unidad }}, {{ ejemplo.condominio }}).
        </div>
      </div>
      <template #footer>
        <Button label="Cerrar" severity="secondary" variant="text" @click="showPreview = false" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>