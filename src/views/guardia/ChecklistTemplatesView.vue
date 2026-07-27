<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { bitacoraService } from "@/services/bitacoraService";

import Card from "primevue/card";
import Button from "primevue/button";
import Select from "primevue/select";
import InputText from "primevue/inputtext";
import Checkbox from "primevue/checkbox";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const auth = useAuthStore();
const confirm = useConfirm();

const loading = ref(false);
const error = ref(null);
const template = ref(null);
const tipoSeleccionado = ref(null);
const editando = ref(false);

const tiposEvento = [
  { label: "Turno inicio", value: "TURNO_INICIO" },
  { label: "Turno fin", value: "TURNO_FIN" },
  { label: "Colación salida", value: "COLACION_SALIDA" },
  { label: "Colación regreso", value: "COLACION_REGRESO" },
  { label: "Novedad", value: "NOVEDAD" },
];

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid || !tipoSeleccionado.value) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await bitacoraService.obtenerChecklist(cid, tipoSeleccionado.value);
    template.value = data;
  } catch (e) {
    console.error("Error al cargar checklist", e);
    error.value = "Error al cargar checklist";
  } finally {
    loading.value = false;
  }
}

function iniciarEdicion() {
  editando.value = true;
}

function agregarItem() {
  if (!template.value) return;
  template.value.items.push({ id: null, orden: template.value.items.length + 1, pregunta: "", obligatorio: false });
}

function quitarItem(idx) {
  if (!template.value) return;
  template.value.items.splice(idx, 1);
}

async function guardar() {
  const cid = auth.condominioActualId;
  if (!cid || !template.value) return;
  editando.value = false;
  try {
    await bitacoraService.guardarChecklist(cid, tipoSeleccionado.value, {
      items: template.value.items.map((i) => ({ pregunta: i.pregunta, obligatorio: i.obligatorio })),
    });
    await cargar();
  } catch (e) {
    console.error("Error al guardar checklist", e);
    error.value = "Error al guardar checklist";
    editando.value = true;
  }
}

function confirmarDesactivar() {
  confirm.require({
    message: `¿Desactivar checklist para ${tiposEvento.find((t) => t.value === tipoSeleccionado.value)?.label}?`,
    header: "Confirmar",
    acceptLabel: "Desactivar",
    rejectLabel: "Cancelar",
    accept: desactivar,
  });
}

async function desactivar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    await bitacoraService.desactivarChecklist(cid, tipoSeleccionado.value);
    template.value = null;
  } catch (e) {
    console.error("Error al desactivar checklist", e);
  }
}
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Checklist de bitácora</h1>
    </div>

    <Card>
      <template #content>
        <div class="flex items-center gap-2">
          <Select v-model="tipoSeleccionado" :options="tiposEvento" optionLabel="label" optionValue="value" placeholder="Seleccionar tipo de evento" class="w-56" size="small" />
          <Button label="Cargar" icon="pi pi-search" size="small" @click="cargar" />
        </div>
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="200px" />
    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <template v-else-if="template">
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span>{{ tiposEvento.find((t) => t.value === template.tipoEvento)?.label }} — {{ template.activo ? 'Activo' : 'Inactivo' }}</span>
            <div class="flex gap-2">
              <Button v-if="!editando && (auth.condominioActualRol === 'ADMINISTRADOR' || auth.condominioActualCargo === 'PRESIDENTE' || auth.condominioActualCargo === 'SECRETARIO')" label="Editar" icon="pi pi-pencil" size="small" severity="warn" @click="iniciarEdicion" />
              <Button v-if="!editando && (auth.condominioActualRol === 'ADMINISTRADOR' || auth.condominioActualCargo === 'PRESIDENTE')" label="Desactivar" icon="pi pi-trash" size="small" severity="danger" @click="confirmarDesactivar" />
            </div>
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-2">
            <div v-for="(item, idx) in template.items" :key="idx" class="flex items-center gap-2 p-2 surface-ground border-round">
              <span v-if="!editando" class="text-sm text-surface-500 w-6">{{ item.orden }}.</span>
              <span v-if="!editando" class="text-sm flex-1">{{ item.pregunta }}</span>
              <Tag v-if="!editando && item.obligatorio" value="Obligatorio" severity="danger" size="small" />
              <InputText v-if="editando" v-model="item.pregunta" placeholder="Pregunta" class="flex-1" size="small" />
              <Checkbox v-if="editando" v-model="item.obligatorio" :binary="true" />
              <Button v-if="editando" icon="pi pi-trash" variant="text" size="small" severity="danger" @click="quitarItem(idx)" />
            </div>
            <div v-if="!template.items.length" class="text-center text-surface-400 py-4">Sin preguntas configuradas</div>
            <Button v-if="editando" label="Agregar pregunta" icon="pi pi-plus" severity="secondary" variant="outlined" size="small" @click="agregarItem" />
          </div>
        </template>
      </Card>
      <div v-if="editando" class="flex gap-2 justify-end">
        <Button label="Cancelar" severity="secondary" variant="text" @click="editando = false; cargar()" />
        <Button label="Guardar" icon="pi pi-check" @click="guardar" />
      </div>
    </template>

    <div v-else-if="tipoSeleccionado && !loading && !error" class="text-center text-surface-400 py-8">
      Selecciona un tipo de evento y presiona "Cargar"
    </div>

    <ConfirmDialog />
  </div>
</template>
