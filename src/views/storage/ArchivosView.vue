<script setup>
import { ref, onMounted, computed } from "vue";
import { useArchivos } from "@/composables/useArchivos";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const confirm = useConfirm();

const {
  archivos,
  loading,
  error,
  categoriaSeleccionada,
  listar,
  subirArchivo,
  eliminar,
  CATEGORIAS,
  CATEGORIA_LABELS,
} = useArchivos();

const mostrarSubida = ref(false);
const archivoSeleccionado = ref(null);
const categoriaSubida = ref("DOCUMENTO");
const recursoTipo = ref("");
const recursoId = ref("");
const subiendo = ref(false);
const errorSubida = ref("");
const exitoSubida = ref("");

const categoriaIcons = {
  FINANZAS: "pi pi-wallet",
  ENCOMIENDA: "pi pi-box",
  BITACORA: "pi pi-book",
  DOCUMENTO: "pi pi-file",
  AVATAR: "pi pi-user",
  OTRO: "pi pi-folder",
};

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function formatFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function estadoSeverity(estado) {
  switch (estado) {
    case "CONFIRMADO": return "success";
    case "PENDIENTE": return "warn";
    case "ELIMINADO": return "danger";
    default: return "info";
  }
}

function contentTypeIcon(ct) {
  if (!ct) return "pi pi-file";
  if (ct.startsWith("image/")) return "pi pi-image";
  if (ct.includes("pdf")) return "pi pi-file-pdf";
  if (ct.includes("word") || ct.includes("document")) return "pi pi-file-word";
  if (ct.includes("sheet") || ct.includes("excel")) return "pi pi-file-excel";
  return "pi pi-file";
}

function descargar(url) {
  if (!url) return;
  window.open(url, "_blank");
}

function cambiarCategoria(cat) {
  categoriaSeleccionada.value = cat;
  listar(cat);
}

function resetForm() {
  archivoSeleccionado.value = null;
  categoriaSubida.value = "DOCUMENTO";
  recursoTipo.value = "";
  recursoId.value = "";
  errorSubida.value = "";
  exitoSubida.value = "";
}

function abrirSubida() {
  resetForm();
  mostrarSubida.value = true;
}

async function handleSubir() {
  if (!archivoSeleccionado.value) {
    errorSubida.value = "Selecciona un archivo";
    return;
  }
  subiendo.value = true;
  errorSubida.value = "";
  exitoSubida.value = "";
  try {
    const ok = await subirArchivo({
      archivo: archivoSeleccionado.value,
      categoria: categoriaSubida.value,
      recursoTipo: recursoTipo.value || null,
      recursoId: recursoId.value || null,
    });
    if (ok) {
      exitoSubida.value = "Archivo subido correctamente";
      archivoSeleccionado.value = null;
      setTimeout(() => { mostrarSubida.value = false; }, 1500);
    } else {
      errorSubida.value = error.value || "Error al subir archivo";
    }
  } catch (e) {
    errorSubida.value = e.response?.data?.message || "Error al subir archivo";
  } finally {
    subiendo.value = false;
  }
}

function confirmarEliminar(file) {
  confirm.require({
    header: "Eliminar archivo",
    message: `¿Eliminar "${file.nombreOriginal}"?`,
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Cancelar",
    acceptLabel: "Eliminar",
    acceptClass: "p-button-danger",
    accept: async () => {
      const ok = await eliminar(file.id);
      if (!ok) {
        errorSubida.value = error.value || "Error al eliminar";
      }
    },
  });
}

const archivosFiltrados = computed(() => {
  return archivos.value.filter((f) => f.estado !== "ELIMINADO");
});

onMounted(() => { listar("DOCUMENTO"); });
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Archivos</h1>
      <Button label="Subir" icon="pi pi-upload" size="small" @click="abrirSubida" />
    </div>

    <div class="flex gap-2 flex-wrap">
      <Button
        v-for="cat in CATEGORIAS"
        :key="cat"
        size="small"
        :icon="categoriaIcons[cat]"
        :label="CATEGORIA_LABELS[cat]"
        :severity="categoriaSeleccionada === cat ? 'primary' : 'secondary'"
        variant="outlined"
        @click="cambiarCategoria(cat)"
      />
    </div>

    <Message v-if="error" severity="warn" :closable="false">{{ error }}</Message>

    <Skeleton v-if="loading" width="100%" height="300px" />

    <div v-else-if="!archivosFiltrados.length" class="text-center text-surface-400 py-8">
      <i class="pi pi-folder-open text-4xl block mb-2"></i>
      <span>No hay archivos en esta categoría</span>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <Card v-for="f in archivosFiltrados" :key="f.id">
        <template #content>
          <div class="flex gap-3">
            <i :class="contentTypeIcon(f.contentType) + ' text-2xl text-surface-400 shrink-0 mt-1'" />
            <div class="flex-1 min-w-0">
              <p class="font-bold m-0 truncate" :title="f.nombreOriginal">{{ f.nombreOriginal }}</p>
              <p class="text-xs text-surface-400 m-0">{{ formatBytes(f.tamanoBytes) }} · {{ f.contentType }}</p>
              <p class="text-xs text-surface-300 m-0">{{ formatFecha(f.createdAt) }}</p>
            </div>
            <div class="flex flex-col gap-1 shrink-0">
              <Tag :value="f.estado" :severity="estadoSeverity(f.estado)" size="small" />
              <div class="flex gap-1 mt-1">
                <Button
                  v-if="f.urlDescarga"
                  icon="pi pi-download"
                  size="small"
                  severity="secondary"
                  variant="text"
                  @click="descargar(f.urlDescarga)"
                  v-tooltip.top="'Descargar'"
                />
                <Button
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  variant="text"
                  @click="confirmarEliminar(f)"
                  v-tooltip.top="'Eliminar'"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Dialog v-model:visible="mostrarSubida" header="Subir archivo" modal :style="{ width: '95%', maxWidth: '450px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">Archivo *</label>
          <input
            type="file"
            class="block w-full text-sm text-surface-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-600"
            @change="(e) => { archivoSeleccionado = e.target.files[0]; errorSubida = ''; }"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">Categoría *</label>
          <Select v-model="categoriaSubida" :options="CATEGORIAS" class="w-full">
            <template #value="slotProps">
              <span v-if="slotProps.value"><i :class="categoriaIcons[slotProps.value] + ' mr-1'" />{{ CATEGORIA_LABELS[slotProps.value] }}</span>
              <span v-else>Selecciona categoría</span>
            </template>
            <template #option="slotProps">
              <span><i :class="categoriaIcons[slotProps.option] + ' mr-1'" />{{ CATEGORIA_LABELS[slotProps.option] }}</span>
            </template>
          </Select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">Tipo recurso (opcional)</label>
          <InputText v-model="recursoTipo" placeholder="Ej: GASTO, ENCOMIENDA" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">ID recurso (opcional)</label>
          <InputText v-model="recursoId" placeholder="UUID del recurso asociado" />
        </div>
        <Message v-if="errorSubida" severity="error" :closable="false">{{ errorSubida }}</Message>
        <Message v-if="exitoSubida" severity="success" :closable="false">{{ exitoSubida }}</Message>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" :disabled="subiendo" @click="mostrarSubida = false" />
        <Button label="Subir" icon="pi pi-upload" :loading="subiendo" :disabled="!archivoSeleccionado" @click="handleSubir" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>
