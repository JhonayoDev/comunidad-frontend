<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { finanzasService } from "@/services/finanzasService";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
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
const plantillas = ref([]);
const categorias = ref([]);
const cuentas = ref([]);

const showDialog = ref(false);
const editando = ref(false);
const plantillaEditandoId = ref(null);
const enviando = ref(false);

const form = ref({
  nombre: "",
  categoriaId: null,
  cuentaOrigenId: null,
  descripcionBase: "",
  montoSugerido: null,
  proveedorTexto: "",
});

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const [plantillasRes, catRes, cuentasRes] = await Promise.all([
      finanzasService.listarPlantillas(cid),
      finanzasService.listarCategorias(cid),
      finanzasService.listarCuentas(cid),
    ]);
    plantillas.value = plantillasRes.data;
    categorias.value = catRes.data;
    cuentas.value = cuentasRes.data;
  } catch (e) {
    console.error("Error al cargar plantillas", e);
    error.value = "No se pudieron cargar las plantillas";
  } finally {
    loading.value = false;
  }
}

function abrirCrear() {
  editando.value = false;
  form.value = { nombre: "", categoriaId: null, cuentaOrigenId: null, descripcionBase: "", montoSugerido: null, proveedorTexto: "" };
  showDialog.value = true;
}

function abrirEditar(p) {
  editando.value = true;
  plantillaEditandoId.value = p.id;
  form.value = {
    nombre: p.nombre,
    categoriaId: p.categoriaId,
    cuentaOrigenId: p.cuentaOrigenId,
    descripcionBase: p.descripcionBase || "",
    montoSugerido: p.montoSugerido || null,
    proveedorTexto: p.proveedorTexto || "",
  };
  showDialog.value = true;
}

async function guardar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    if (editando.value) {
      await finanzasService.actualizarPlantilla(cid, plantillaEditandoId.value, form.value);
    } else {
      await finanzasService.crearPlantilla(cid, form.value);
    }
    showDialog.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al guardar plantilla", e);
  } finally {
    enviando.value = false;
  }
}

function confirmarEliminar(p) {
  confirm.require({
    message: `¿Eliminar la plantilla "${p.nombre}"?`,
    header: "Confirmar",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Eliminar",
    rejectLabel: "Cancelar",
    accept: () => eliminar(p),
  });
}

async function eliminar(p) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    await finanzasService.eliminarPlantilla(cid, p.id);
    await cargar();
  } catch (e) {
    console.error("Error al eliminar plantilla", e);
  }
}

const categoriasActivas = computed(() =>
  categorias.value.filter((c) => c.activa !== false)
);

const cuentasActivas = computed(() =>
  cuentas.value.filter((c) => c.activa !== false)
);

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold m-0">Plantillas de Gasto</h1>
      <Button label="Nueva plantilla" icon="pi pi-plus" size="small" @click="abrirCrear" />
    </div>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!plantillas.length" class="text-center text-surface-400 py-8">
        No hay plantillas registradas
      </div>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="p in plantillas"
          :key="p.id"
          class="surface-card p-3 border-round shadow-1"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ p.nombre }}</span>
                <Tag v-if="!p.activa" value="Inactiva" severity="secondary" size="small" />
              </div>
              <div class="text-sm text-surface-500">
                {{ p.categoriaNombre }} — {{ p.cuentaOrigenNombre }}
                <span v-if="p.montoSugerido"> — ${{ p.montoSugerido?.toLocaleString("es-CL") }}</span>
              </div>
              <div v-if="p.descripcionBase" class="text-xs text-surface-400">{{ p.descripcionBase }}</div>
            </div>
            <div class="flex items-center gap-1">
              <Button icon="pi pi-pencil" variant="text" size="small" severity="secondary" @click="abrirEditar(p)" />
              <Button icon="pi pi-trash" variant="text" size="small" severity="danger" @click="confirmarEliminar(p)" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <Dialog v-model:visible="showDialog" :header="editando ? 'Editar plantilla' : 'Nueva plantilla'" modal :style="{ width: '95%', maxWidth: '500px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Nombre</label>
          <InputText v-model="form.nombre" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Categoría</label>
          <Select v-model="form.categoriaId" :options="categoriasActivas" optionLabel="nombre" optionValue="id" placeholder="Seleccionar" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Cuenta origen</label>
          <Select v-model="form.cuentaOrigenId" :options="cuentasActivas" optionLabel="nombre" optionValue="id" placeholder="Seleccionar" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Descripción base</label>
          <Textarea v-model="form.descripcionBase" rows="2" placeholder="Opcional" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Monto sugerido</label>
          <InputNumber v-model="form.montoSugerido" :min="0" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Proveedor</label>
          <InputText v-model="form.proveedorTexto" placeholder="Opcional" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showDialog = false" />
        <Button label="Guardar" :loading="enviando" @click="guardar" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>
