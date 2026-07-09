<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { notificacionesService } from "@/services/notificacionesService";

import Card from "primevue/card";
import Button from "primevue/button";
import Textarea from "primevue/textarea";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Dialog from "primevue/dialog";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const auth = useAuthStore();
const confirm = useConfirm();

const loading = ref(true);
const error = ref(null);
const plantillas = ref([]);

const showEditar = ref(false);
const editando = ref(null);
const enviando = ref(false);
const form = ref({ tituloPlantilla: "", enAppPlantilla: "", emailPlantilla: "" });

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await notificacionesService.listarPlantillas(cid);
    plantillas.value = data;
  } catch (e) {
    console.error("Error al cargar plantillas", e);
    error.value = "Error al cargar plantillas";
  } finally {
    loading.value = false;
  }
}

function abrirEdicion(p) {
  editando.value = p;
  form.value = {
    tituloPlantilla: p.tituloPlantilla || "",
    enAppPlantilla: p.enAppPlantilla || "",
    emailPlantilla: p.emailPlantilla || "",
  };
  showEditar.value = true;
}

async function guardar() {
  const cid = auth.condominioActualId;
  if (!cid || !editando.value) return;
  enviando.value = true;
  try {
    await notificacionesService.guardarPlantilla(cid, editando.value.codigo, form.value);
    showEditar.value = false;
    editando.value = null;
    await cargar();
  } catch (e) {
    console.error("Error al guardar plantilla", e);
  } finally {
    enviando.value = false;
  }
}

function confirmarRestaurar(p) {
  confirm.require({
    message: `¿Restaurar plantilla "${p.codigo}" a la versión global?`,
    header: "Confirmar",
    acceptLabel: "Restaurar",
    rejectLabel: "Cancelar",
    accept: () => restaurar(p),
  });
}

async function restaurar(p) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    await notificacionesService.restaurarPlantilla(cid, p.codigo);
    await cargar();
  } catch (e) {
    console.error("Error al restaurar plantilla", e);
  }
}

function codigoLabel(codigo) {
  return codigo.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <h1 class="text-xl font-bold m-0">Plantillas de notificación</h1>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <div v-else class="flex flex-col gap-2">
      <div v-for="p in plantillas" :key="p.codigo" class="surface-card p-3 border-round shadow-1">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ codigoLabel(p.codigo) }}</span>
              <Tag :value="p.origen" :severity="p.origen === 'OVERRIDE' ? 'warn' : 'info'" size="small" />
            </div>
            <p class="text-sm text-surface-500 m-0 mt-1 line-clamp-2">{{ p.tituloPlantilla }}</p>
          </div>
          <div class="flex gap-1 shrink-0">
            <Button icon="pi pi-pencil" size="small" variant="text" @click="abrirEdicion(p)" />
            <Button v-if="p.origen === 'OVERRIDE'" icon="pi pi-undo" size="small" variant="text" severity="danger" @click="confirmarRestaurar(p)" />
          </div>
        </div>
      </div>
      <div v-if="!plantillas.length" class="text-center text-surface-400 py-8">No hay plantillas disponibles</div>
    </div>

    <Dialog v-model:visible="showEditar" :header="editando ? codigoLabel(editando.codigo) : ''" modal :style="{ width: '95%', maxWidth: '500px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1"><label class="text-sm">Título</label><InputText v-model="form.tituloPlantilla" /></div>
        <div class="flex flex-col gap-1"><label class="text-sm">Plantilla App</label><Textarea v-model="form.enAppPlantilla" rows="3" placeholder="Mensaje para notificaciones en la app" /></div>
        <div class="flex flex-col gap-1"><label class="text-sm">Plantilla Email</label><Textarea v-model="form.emailPlantilla" rows="3" placeholder="Mensaje para notificaciones por email (opcional)" /></div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showEditar = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="enviando" @click="guardar" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>
