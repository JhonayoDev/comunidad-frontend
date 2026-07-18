<script setup>
import { ref, onMounted } from "vue";
import { adminService } from "@/services/adminService";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Textarea from "primevue/textarea";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Dialog from "primevue/dialog";

const loading = ref(true);
const error = ref(null);
const planes = ref([]);

const showDialog = ref(false);
const modoDialog = ref("crear");
const planEditando = ref(null);
const enviando = ref(false);

const emptyForm = { codigo: "", nombre: "", descripcion: "", precioMensual: null, precioAnual: null, storageLimitMb: 2048, unidadLimit: 100, usuarioLimit: 50 };
const form = ref({ ...emptyForm });

async function cargar() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await adminService.listarPlanes();
    planes.value = data || [];
  } catch (e) {
    console.error("Error al cargar planes", e);
    error.value = "No se pudieron cargar los planes";
  } finally {
    loading.value = false;
  }
}

function abrirCrear() {
  form.value = { ...emptyForm };
  modoDialog.value = "crear";
  showDialog.value = true;
}

function abrirEditar(p) {
  planEditando.value = p;
  form.value = {
    codigo: p.codigo,
    nombre: p.nombre,
    descripcion: p.descripcion || "",
    precioMensual: p.precioMensual,
    precioAnual: p.precioAnual,
    storageLimitMb: p.storageLimitMb,
    unidadLimit: p.unidadLimit,
    usuarioLimit: p.usuarioLimit,
  };
  modoDialog.value = "editar";
  showDialog.value = true;
}

async function crearPlan() {
  enviando.value = true;
  try {
    await adminService.crearPlan(form.value);
    showDialog.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al crear plan", e);
  } finally {
    enviando.value = false;
  }
}

async function actualizarPlan() {
  enviando.value = true;
  try {
    await adminService.actualizarPlan(planEditando.value.id, form.value);
    showDialog.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al actualizar plan", e);
  } finally {
    enviando.value = false;
  }
}

async function desactivarPlan(p) {
  try {
    await adminService.desactivarPlan(p.id);
    await cargar();
  } catch (e) {
    console.error("Error al desactivar plan", e);
  }
}

function formatoCLP(n) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(n || 0);
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Planes</h1>
      <Button label="Nuevo plan" icon="pi pi-plus" size="small" @click="abrirCrear" />
    </div>

    <Skeleton v-if="loading" width="100%" height="200px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!planes.length" class="text-center text-surface-400 py-8">No hay planes registrados</div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card v-for="p in planes" :key="p.id">
          <template #title>
            <div class="flex items-center justify-between">
              <span>{{ p.nombre }}</span>
              <Tag :value="p.activo ? 'Activo' : 'Inactivo'" :severity="p.activo ? 'success' : 'danger'" size="small" />
            </div>
          </template>
          <template #content>
            <p class="text-sm text-surface-500 m-0 mb-2">{{ p.descripcion || p.codigo }}</p>
            <div class="flex flex-col gap-1 text-sm">
              <div class="flex justify-between"><span class="text-surface-400">Mensual</span><strong>{{ formatoCLP(p.precioMensual) }}</strong></div>
              <div class="flex justify-between"><span class="text-surface-400">Anual</span><strong>{{ formatoCLP(p.precioAnual) }}</strong></div>
              <div class="flex justify-between"><span class="text-surface-400">Storage</span>{{ (p.storageLimitMb / 1024).toFixed(0) }} GB</div>
              <div class="flex justify-between"><span class="text-surface-400">Unidades</span>{{ p.unidadLimit }}</div>
              <div class="flex justify-between"><span class="text-surface-400">Usuarios</span>{{ p.usuarioLimit }}</div>
            </div>
          </template>
          <template #footer>
            <div class="flex gap-2">
              <Button label="Editar" size="small" severity="secondary" variant="outlined" @click="abrirEditar(p)" />
              <Button v-if="p.activo" label="Desactivar" size="small" severity="danger" variant="outlined" @click="desactivarPlan(p)" />
            </div>
          </template>
        </Card>
      </div>
    </template>

    <Dialog v-model:visible="showDialog" :header="modoDialog === 'editar' ? 'Editar plan' : 'Nuevo plan'" modal :style="{ width: '95%', maxWidth: '500px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Código</label>
          <InputText v-model="form.codigo" placeholder="BASICO" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Nombre</label>
          <InputText v-model="form.nombre" placeholder="Básico" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Descripción</label>
          <Textarea v-model="form.descripcion" rows="2" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="flex flex-col gap-1">
            <label class="text-sm">Precio mensual (CLP)</label>
            <InputNumber v-model="form.precioMensual" :min="0" class="w-full" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm">Precio anual (CLP)</label>
            <InputNumber v-model="form.precioAnual" :min="0" class="w-full" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div class="flex flex-col gap-1">
            <label class="text-sm">Storage (MB)</label>
            <InputNumber v-model="form.storageLimitMb" :min="0" class="w-full" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm">Unidades</label>
            <InputNumber v-model="form.unidadLimit" :min="0" class="w-full" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm">Usuarios</label>
            <InputNumber v-model="form.usuarioLimit" :min="0" class="w-full" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showDialog = false" />
        <Button :label="modoDialog === 'editar' ? 'Guardar cambios' : 'Crear plan'" :loading="enviando" @click="modoDialog === 'editar' ? actualizarPlan() : crearPlan()" />
      </template>
    </Dialog>
  </div>
</template>
