<script setup>
import { ref, onMounted } from "vue";
import { adminService } from "@/services/adminService";
import { useConfirm } from "primevue/useconfirm";

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

const confirm = useConfirm();

const showDialog = ref(false);
const modoDialog = ref("crear");
const planEditando = ref(null);
const enviando = ref(false);
const resultado = ref(null);

const emptyForm = { codigo: "", nombre: "", descripcion: "", precioMensual: null, precioAnual: null, storageLimitMb: 2048, unidadLimit: 100, usuarioLimit: 50 };
const form = ref({ ...emptyForm });

async function cargar() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await adminService.listarPlanes(true);
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
  resultado.value = null;
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
  resultado.value = null;
  showDialog.value = true;
}

function confirmarCrear() {
  const f = form.value;
  confirm.require({
    message: `¿Crear el plan "${f.nombre}" (${f.codigo})?\n\nMensual: ${formatoCLP(f.precioMensual)} · Anual: ${formatoCLP(f.precioAnual)}\nStorage: ${(f.storageLimitMb / 1024).toFixed(0)} GB · Unidades: ${f.unidadLimit} · Usuarios: ${f.usuarioLimit}`,
    header: "Crear plan",
    acceptLabel: "Crear",
    rejectLabel: "Cancelar",
    accept: () => crearPlan(),
  });
}

async function crearPlan() {
  enviando.value = true;
  resultado.value = null;
  try {
    await adminService.crearPlan(form.value);
    showDialog.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al crear plan", e);
    resultado.value =
      e.response?.data?.message || "No se pudo crear el plan.";
  } finally {
    enviando.value = false;
  }
}

async function actualizarPlan() {
  enviando.value = true;
  resultado.value = null;
  try {
    await adminService.actualizarPlan(planEditando.value.id, form.value);
    showDialog.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al actualizar plan", e);
    resultado.value =
      e.response?.data?.message || "No se pudo actualizar el plan.";
  } finally {
    enviando.value = false;
  }
}

function confirmarDesactivar(p) {
  confirm.require({
    message: `¿Desactivar el plan "${p.nombre}" (${p.codigo})? Los condominios con este plan no podrán contratarlo ni renovarlo.`,
    header: "Desactivar plan",
    acceptLabel: "Desactivar",
    rejectLabel: "Cancelar",
    accept: () => desactivarPlan(p),
  });
}

async function desactivarPlan(p) {
  try {
    await adminService.desactivarPlan(p.id);
    planes.value = planes.value.map((x) =>
      x.id === p.id ? { ...x, activo: false } : x,
    );
  } catch (e) {
    console.error("Error al desactivar plan", e);
  }
}

function confirmarReactivar(p) {
  confirm.require({
    message: `¿Reactivar el plan "${p.nombre}" (${p.codigo})? Volverá a estar disponible para contratación y renovación.`,
    header: "Reactivar plan",
    acceptLabel: "Reactivar",
    rejectLabel: "Cancelar",
    accept: () => reactivarPlan(p),
  });
}

async function reactivarPlan(p) {
  try {
    await adminService.reactivarPlan(p.id);
    planes.value = planes.value.map((x) =>
      x.id === p.id ? { ...x, activo: true } : x,
    );
  } catch (e) {
    console.error("Error al reactivar plan", e);
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
        <Card v-for="p in planes" :key="p.id" :class="{ 'opacity-60': !p.activo }">
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
              <Button v-if="p.activo" label="Desactivar" size="small" severity="danger" variant="outlined" @click="confirmarDesactivar(p)" />
              <Button v-else label="Reactivar" size="small" severity="success" variant="outlined" @click="confirmarReactivar(p)" />
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
            <InputNumber v-model="form.precioMensual" :min="0" class="w-full min-w-0" input-class="min-w-0" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm">Precio anual (CLP)</label>
            <InputNumber v-model="form.precioAnual" :min="0" class="w-full min-w-0" input-class="min-w-0" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div class="flex flex-col gap-1">
            <label class="text-sm">Storage (MB)</label>
            <InputNumber v-model="form.storageLimitMb" :min="0" class="w-full min-w-0" input-class="min-w-0" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm">Unidades</label>
            <InputNumber v-model="form.unidadLimit" :min="0" class="w-full min-w-0" input-class="min-w-0" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm">Usuarios</label>
            <InputNumber v-model="form.usuarioLimit" :min="0" class="w-full min-w-0" input-class="min-w-0" />
          </div>
        </div>
        <Message v-if="resultado" severity="error" :closable="false">{{ resultado }}</Message>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showDialog = false" />
        <Button :label="modoDialog === 'editar' ? 'Guardar cambios' : 'Crear plan'" :loading="enviando" @click="modoDialog === 'editar' ? actualizarPlan() : confirmarCrear()" />
      </template>
    </Dialog>
  </div>
</template>
