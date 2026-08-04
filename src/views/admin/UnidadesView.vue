<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { unidadesService } from "@/services/unidadesService";
import { mensajeError } from "@/utils/errores";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const auth = useAuthStore();
const confirm = useConfirm();

const loading = ref(true);
const error = ref(null);
const unidades = ref([]);
const sectores = ref([]);

const showCrear = ref(false);
const showEditar = ref(false);
const unidadEditando = ref(null);
const enviando = ref(false);

const formCrear = ref({ numero: "", tipo: "CASA", sectorId: null, direccion: "" });
const formEditar = ref({ numero: "", tipo: "CASA", sectorId: null, direccion: "" });

const tiposUnidad = [
  { label: "Casa", value: "CASA" },
  { label: "Departamento", value: "DEPARTAMENTO" },
  { label: "Local", value: "LOCAL" },
  { label: "Oficina", value: "OFICINA" },
  { label: "Bodega", value: "BODEGA" },
  { label: "Estacionamiento", value: "ESTACIONAMIENTO" },
];

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const [uniRes, secRes] = await Promise.all([
      unidadesService.getUnidades(cid),
      unidadesService.getSectores(cid),
    ]);
    unidades.value = uniRes.data;
    sectores.value = secRes.data;
  } catch (e) {
    console.error("Error al cargar unidades", e);
    error.value = "No se pudieron cargar las unidades";
  } finally {
    loading.value = false;
  }
}

function abrirCrear() {
  formCrear.value = { numero: "", tipo: "CASA", sectorId: null, direccion: "" };
  showCrear.value = true;
}

async function crearUnidad() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    await unidadesService.crearUnidad(cid, formCrear.value);
    showCrear.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al crear unidad", e);
    error.value = mensajeError(e, "Error al crear unidad");
  } finally {
    enviando.value = false;
  }
}

function abrirEditar(u) {
  unidadEditando.value = u;
  formEditar.value = { numero: u.numero, tipo: u.tipo, sectorId: u.sectorId || null, direccion: u.direccion || "" };
  showEditar.value = true;
}

async function editarUnidad() {
  const cid = auth.condominioActualId;
  if (!cid || !unidadEditando.value) return;
  enviando.value = true;
  try {
    await unidadesService.actualizarUnidad(cid, unidadEditando.value.id, formEditar.value);
    showEditar.value = false;
    unidadEditando.value = null;
    await cargar();
  } catch (e) {
    console.error("Error al editar unidad", e);
  } finally {
    enviando.value = false;
  }
}

function confirmarDesactivar(u) {
  confirm.require({
    message: `¿Desactivar unidad ${u.numero}?`,
    header: "Confirmar",
    acceptLabel: "Desactivar",
    rejectLabel: "Cancelar",
    accept: () => desactivarUnidad(u),
  });
}

async function desactivarUnidad(u) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    await unidadesService.desactivarUnidad(cid, u.id);
    await cargar();
  } catch (e) {
    console.error("Error al desactivar unidad", e);
  }
}

function sectorLabel(id) {
  const s = sectores.value.find((s) => s.id === id);
  return s ? `Sector ${s.numero}` : "—";
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold m-0">Unidades</h1>
      <Button label="Nueva unidad" icon="pi pi-plus" size="small" @click="abrirCrear" />
    </div>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!unidades.length" class="text-center text-surface-400 py-8">No hay unidades</div>
      <div v-else class="flex flex-col gap-2">
        <div v-for="u in unidades" :key="u.id" class="surface-card p-3 border-round shadow-1 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ u.numero }}</span>
              <Tag :value="u.tipo" severity="info" size="small" />
              <Tag v-if="!u.activo" value="Inactiva" severity="secondary" size="small" />
            </div>
            <span class="text-sm text-surface-400">{{ sectorLabel(u.sectorId) }}</span>
          </div>
          <div class="flex items-center gap-1">
            <Button icon="pi pi-pencil" variant="text" size="small" severity="secondary" @click="abrirEditar(u)" />
            <Button v-if="u.activo !== false" icon="pi pi-trash" variant="text" size="small" severity="danger" @click="confirmarDesactivar(u)" />
          </div>
        </div>
      </div>
    </template>

    <Dialog v-model:visible="showCrear" header="Nueva unidad" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Número</label>
          <InputText v-model="formCrear.numero" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Tipo</label>
          <Select v-model="formCrear.tipo" :options="tiposUnidad" optionLabel="label" optionValue="value" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Sector</label>
          <Select v-model="formCrear.sectorId" :options="sectores" optionLabel="numero" optionValue="id" placeholder="Seleccionar" clearable />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Dirección</label>
          <InputText v-model="formCrear.direccion" placeholder="Opcional" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showCrear = false" />
        <Button label="Crear" :loading="enviando" @click="crearUnidad" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showEditar" header="Editar unidad" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Número</label>
          <InputText v-model="formEditar.numero" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Tipo</label>
          <Select v-model="formEditar.tipo" :options="tiposUnidad" optionLabel="label" optionValue="value" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Sector</label>
          <Select v-model="formEditar.sectorId" :options="sectores" optionLabel="numero" optionValue="id" placeholder="Seleccionar" clearable />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Dirección</label>
          <InputText v-model="formEditar.direccion" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showEditar = false" />
        <Button label="Guardar" :loading="enviando" @click="editarUnidad" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>
