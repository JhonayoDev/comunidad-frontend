<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { finanzasService } from "@/services/finanzasService";
import { useUnidades } from "@/composables/useUnidades";
import { usePaginacion } from "@/composables/usePaginacion";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Textarea from "primevue/textarea";
import Select from "primevue/select";
import DatePicker from "primevue/datepicker";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Paginator from "primevue/paginator";

const auth = useAuthStore();
const { unidades, cargarUnidades } = useUnidades();

const loading = ref(true);
const error = ref(null);
const pagos = ref([]);
const pagPagos = usePaginacion();
const cuentas = ref([]);

const showCrear = ref(false);
const enviando = ref(false);

const filtroUnidad = ref(null);
const filtroDesde = ref(null);
const filtroHasta = ref(null);

const form = ref({
  unidadId: null,
  cuentaDestinoId: null,
  monto: null,
  fechaPago: new Date(),
  numeroOperacion: "",
  bancoOrigen: "",
  comprobanteUrl: "",
  observacion: "",
});

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const params = { ...pagPagos.paramsPaginacion.value };
    if (filtroUnidad.value) params.unidadId = filtroUnidad.value;
    if (filtroDesde.value) params.desde = formatearFecha(filtroDesde.value);
    if (filtroHasta.value) params.hasta = formatearFecha(filtroHasta.value);
    const [pagosRes, cuentasRes] = await Promise.all([
      finanzasService.listarPagos(cid, params),
      finanzasService.listarCuentas(cid),
    ]);
    pagPagos.actualizar(pagosRes.data);
    pagos.value = pagPagos.contenido.value;
    cuentas.value = cuentasRes.data;
  } catch (e) {
    console.error("Error al cargar pagos", e);
    error.value = "No se pudieron cargar los pagos";
  } finally {
    loading.value = false;
  }
}

function abrirCrear() {
  form.value = {
    unidadId: null,
    cuentaDestinoId: null,
    monto: null,
    fechaPago: new Date(),
    numeroOperacion: "",
    bancoOrigen: "",
    comprobanteUrl: "",
    observacion: "",
  };
  showCrear.value = true;
}

function formatearFecha(d) {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function crearPago() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    await finanzasService.crearPago(cid, {
      ...form.value,
      fechaPago: formatearFecha(form.value.fechaPago),
    });
    showCrear.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al crear pago", e);
  } finally {
    enviando.value = false;
  }
}

function buscar() {
  pagPagos.reiniciar();
  cargar();
}

onMounted(() => {
  cargarUnidades();
  cargar();
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold m-0">Pagos</h1>
      <Button label="Registrar pago" icon="pi pi-plus" size="small" @click="abrirCrear" />
    </div>

    <Card>
      <template #content>
        <div class="flex flex-wrap gap-2 items-end">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Unidad</label>
            <Select
              v-model="filtroUnidad"
              :options="unidades"
              optionLabel="numero"
              optionValue="id"
              placeholder="Todas"
              class="w-36"
              size="small"
              clearable
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Desde</label>
            <DatePicker v-model="filtroDesde" size="small" class="w-32" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Hasta</label>
            <DatePicker v-model="filtroHasta" size="small" class="w-32" />
          </div>
          <Button label="Buscar" icon="pi pi-search" size="small" severity="secondary" @click="buscar" />
        </div>
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!pagos.length" class="text-center text-surface-400 py-8">
        No hay pagos registrados
      </div>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="p in pagos"
          :key="p.id"
          class="surface-card p-3 border-round shadow-1"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-medium">Unidad {{ p.unidadNumero }}</span>
                <span class="text-sm text-surface-400">{{ p.fechaPago }}</span>
              </div>
              <div class="text-sm text-surface-500">
                {{ p.cuentaDestinoNombre }}
                <span v-if="p.numeroOperacion"> — Op: {{ p.numeroOperacion }}</span>
              </div>
              <div v-if="p.observacion" class="text-xs text-surface-400">{{ p.observacion }}</div>
            </div>
            <span class="font-bold text-lg text-green-600">{{ p.monto?.toLocaleString("es-CL") }}</span>
          </div>
        </div>
        <Paginator
          :rows="pagPagos.tamano.value"
          :totalRecords="pagPagos.totalElementos.value"
          :first="pagPagos.pagina.value * pagPagos.tamano.value"
          @page="pagPagos.alCambiarPagina($event); cargar()"
        />
      </div>
    </template>

    <Dialog v-model:visible="showCrear" header="Registrar pago" modal :style="{ width: '95%', maxWidth: '500px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Unidad</label>
          <Select v-model="form.unidadId" :options="unidades" optionLabel="numero" optionValue="id" placeholder="Seleccionar" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Cuenta destino</label>
          <Select v-model="form.cuentaDestinoId" :options="cuentas" optionLabel="nombre" optionValue="id" placeholder="Seleccionar" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Monto</label>
          <InputNumber v-model="form.monto" :min="0" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Fecha pago</label>
          <DatePicker v-model="form.fechaPago" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">N° operación</label>
          <InputText v-model="form.numeroOperacion" placeholder="Opcional" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Banco origen</label>
          <InputText v-model="form.bancoOrigen" placeholder="Opcional" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Observación</label>
          <Textarea v-model="form.observacion" rows="2" placeholder="Opcional" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showCrear = false" />
        <Button label="Registrar" :loading="enviando" @click="crearPago" />
      </template>
    </Dialog>
  </div>
</template>
