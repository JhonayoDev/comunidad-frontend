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
import DatePicker from "primevue/datepicker";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";

const auth = useAuthStore();

const loading = ref(true);
const error = ref(null);
const gastos = ref([]);
const categorias = ref([]);
const cuentas = ref([]);

const filtroCategoria = ref(null);
const filtroDesde = ref(null);
const filtroHasta = ref(null);
const filtroSoloActivos = ref(true);

const showCrear = ref(false);
const showAnular = ref(false);
const gastoSeleccionado = ref(null);
const enviando = ref(false);

const form = ref({
  categoriaId: null,
  cuentaOrigenId: null,
  descripcion: "",
  monto: null,
  fechaGasto: new Date(),
  proveedorTexto: "",
  numeroDocumento: "",
  documentoUrl: "",
  casoId: null,
});

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const [gastosRes, catRes, cuentasRes] = await Promise.all([
      finanzasService.listarGastos(cid, { soloActivos: filtroSoloActivos.value }),
      finanzasService.listarCategorias(cid),
      finanzasService.listarCuentas(cid),
    ]);
    gastos.value = gastosRes.data;
    categorias.value = catRes.data;
    cuentas.value = cuentasRes.data;
  } catch (e) {
    console.error("Error al cargar gastos", e);
    error.value = "No se pudieron cargar los gastos";
  } finally {
    loading.value = false;
  }
}

async function buscar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  try {
    const params = { soloActivos: filtroSoloActivos.value };
    if (filtroCategoria.value) params.categoriaId = filtroCategoria.value;
    if (filtroDesde.value) params.desde = formatearFecha(filtroDesde.value);
    if (filtroHasta.value) params.hasta = formatearFecha(filtroHasta.value);
    const { data } = await finanzasService.listarGastos(cid, params);
    gastos.value = data;
  } catch (e) {
    console.error("Error al buscar gastos", e);
  } finally {
    loading.value = false;
  }
}

function formatearFecha(d) {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function abrirCrear() {
  form.value = {
    categoriaId: null,
    cuentaOrigenId: null,
    descripcion: "",
    monto: null,
    fechaGasto: new Date(),
    proveedorTexto: "",
    numeroDocumento: "",
    documentoUrl: "",
    casoId: null,
  };
  showCrear.value = true;
}

async function crearGasto() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    const payload = {
      ...form.value,
      fechaGasto: formatearFecha(form.value.fechaGasto),
    };
    await finanzasService.crearGasto(cid, payload);
    showCrear.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al crear gasto", e);
  } finally {
    enviando.value = false;
  }
}

function abrirAnular(gasto) {
  gastoSeleccionado.value = gasto;
  motivoAnulacion.value = "";
  showAnular.value = true;
}

const motivoAnulacion = ref("");

async function anularGasto() {
  const cid = auth.condominioActualId;
  if (!cid || !gastoSeleccionado.value) return;
  enviando.value = true;
  try {
    await finanzasService.anularGasto(cid, gastoSeleccionado.value.id, motivoAnulacion.value);
    showAnular.value = false;
    gastoSeleccionado.value = null;
    await cargar();
  } catch (e) {
    console.error("Error al anular gasto", e);
  } finally {
    enviando.value = false;
  }
}

const categoriasFiltradas = computed(() =>
  categorias.value.filter((c) => c.activa !== false)
);

const cuentasActivas = computed(() =>
  cuentas.value.filter((c) => c.activa !== false)
);

const estadoSeverity = (estado) => {
  if (estado === "ACTIVO") return "success";
  if (estado === "ANULADO") return "danger";
  return "info";
};

onMounted(() => {
  cargar();
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold m-0">Gastos</h1>
      <Button label="Nuevo gasto" icon="pi pi-plus" size="small" @click="abrirCrear" />
    </div>

    <Card>
      <template #content>
        <div class="flex flex-wrap gap-2 items-end">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Categoría</label>
            <Select
              v-model="filtroCategoria"
              :options="categoriasFiltradas"
              optionLabel="nombre"
              optionValue="id"
              placeholder="Todas"
              class="w-48"
              size="small"
              clearable
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Desde</label>
            <DatePicker v-model="filtroDesde" size="small" class="w-36" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Hasta</label>
            <DatePicker v-model="filtroHasta" size="small" class="w-36" />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-surface-500">Solo activos</label>
            <input type="checkbox" v-model="filtroSoloActivos" />
          </div>
          <Button label="Buscar" icon="pi pi-search" size="small" severity="secondary" @click="buscar" />
        </div>
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!gastos.length" class="text-center text-surface-400 py-8">
        No hay gastos registrados
      </div>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="g in gastos"
          :key="g.id"
          class="surface-card p-3 border-round shadow-1 flex flex-col sm:flex-row sm:items-center gap-2"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ g.descripcion }}</span>
              <Tag :value="g.estado" :severity="estadoSeverity(g.estado)" size="small" />
            </div>
            <div class="text-sm text-surface-500">
              {{ g.fechaGasto }} — {{ g.categoriaNombre }}
              <span v-if="g.proveedorTexto"> — {{ g.proveedorTexto }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-lg">{{ g.monto?.toLocaleString("es-CL") }}</span>
            <Button
              v-if="g.estado === 'ACTIVO'"
              icon="pi pi-ban"
              severity="danger"
              variant="text"
              size="small"
              @click="abrirAnular(g)"
            />
          </div>
        </div>
      </div>
    </template>

    <Dialog v-model:visible="showCrear" header="Nuevo gasto" modal :style="{ width: '95%', maxWidth: '500px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Categoría</label>
          <Select
            v-model="form.categoriaId"
            :options="categoriasFiltradas"
            optionLabel="nombre"
            optionValue="id"
            placeholder="Seleccionar"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Cuenta origen</label>
          <Select
            v-model="form.cuentaOrigenId"
            :options="cuentasActivas"
            optionLabel="nombre"
            optionValue="id"
            placeholder="Seleccionar"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Descripción</label>
          <Textarea v-model="form.descripcion" rows="2" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Monto</label>
          <InputNumber v-model="form.monto" :min="0" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Fecha gasto</label>
          <DatePicker v-model="form.fechaGasto" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Proveedor</label>
          <InputText v-model="form.proveedorTexto" placeholder="Opcional" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">N° documento</label>
          <InputText v-model="form.numeroDocumento" placeholder="Opcional" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showCrear = false" />
        <Button label="Guardar" :loading="enviando" @click="crearGasto" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showAnular" header="Anular gasto" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <p class="text-sm m-0">¿Estás seguro de anular este gasto?</p>
        <p class="text-sm text-surface-500 m-0">{{ gastoSeleccionado?.descripcion }}</p>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Motivo</label>
          <Textarea v-model="motivoAnulacion" rows="2" placeholder="Indica el motivo de anulación" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showAnular = false" />
        <Button label="Anular" severity="danger" :loading="enviando" @click="anularGasto" />
      </template>
    </Dialog>
  </div>
</template>
