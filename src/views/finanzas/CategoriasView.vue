<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { finanzasService } from "@/services/finanzasService";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
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
const categorias = ref([]);

const showCrear = ref(false);
const enviando = ref(false);
const filtroTipo = ref(null);

const form = ref({ nombre: "", tipo: "EGRESO", descripcion: "" });

const tiposMovimiento = [
  { label: "Ingreso", value: "INGRESO" },
  { label: "Egreso", value: "EGRESO" },
];

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const params = {};
    if (filtroTipo.value) params.tipo = filtroTipo.value;
    const { data } = await finanzasService.listarCategorias(cid, params);
    categorias.value = data;
  } catch (e) {
    console.error("Error al cargar categorías", e);
    error.value = "No se pudieron cargar las categorías";
  } finally {
    loading.value = false;
  }
}

function abrirCrear() {
  form.value = { nombre: "", tipo: "EGRESO", descripcion: "" };
  showCrear.value = true;
}

async function crearCategoria() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    await finanzasService.crearCategoria(cid, form.value);
    showCrear.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al crear categoría", e);
  } finally {
    enviando.value = false;
  }
}

function confirmarEliminar(c) {
  confirm.require({
    message: `¿Eliminar categoría "${c.nombre}"?`,
    header: "Confirmar",
    acceptLabel: "Eliminar",
    rejectLabel: "Cancelar",
    accept: () => eliminarCategoria(c),
  });
}

async function eliminarCategoria(c) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    await finanzasService.eliminarCategoria(cid, c.id);
    await cargar();
  } catch (e) {
    console.error("Error al eliminar categoría", e);
  }
}

function tipoSeverity(t) {
  return t === "INGRESO" ? "success" : "danger";
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold m-0">Categorías</h1>
      <Button label="Nueva categoría" icon="pi pi-plus" size="small" @click="abrirCrear" />
    </div>

    <Card>
      <template #content>
        <Select v-model="filtroTipo" :options="tiposMovimiento" optionLabel="label" optionValue="value" placeholder="Filtrar por tipo" class="w-40" size="small" clearable @change="cargar" />
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="200px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!categorias.length" class="text-center text-surface-400 py-8">No hay categorías</div>
      <div v-else class="flex flex-col gap-2">
        <div v-for="c in categorias" :key="c.id" class="surface-card p-3 border-round shadow-1 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ c.nombre }}</span>
              <Tag :value="c.tipo" :severity="tipoSeverity(c.tipo)" size="small" />
              <Tag v-if="c.esSistema" value="Sistema" severity="info" size="small" />
              <Tag v-if="!c.activa" value="Inactiva" severity="secondary" size="small" />
            </div>
            <span v-if="c.descripcion" class="text-xs text-surface-400">{{ c.descripcion }}</span>
          </div>
          <Button v-if="!c.esSistema" icon="pi pi-trash" variant="text" size="small" severity="danger" @click="confirmarEliminar(c)" />
        </div>
      </div>
    </template>

    <Dialog v-model:visible="showCrear" header="Nueva categoría" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1"><label class="text-sm">Nombre</label><InputText v-model="form.nombre" /></div>
        <div class="flex flex-col gap-1"><label class="text-sm">Tipo</label><Select v-model="form.tipo" :options="tiposMovimiento" optionLabel="label" optionValue="value" /></div>
        <div class="flex flex-col gap-1"><label class="text-sm">Descripción</label><Textarea v-model="form.descripcion" rows="2" placeholder="Opcional" /></div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showCrear = false" />
        <Button label="Crear" :loading="enviando" @click="crearCategoria" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>
