<script setup>
import { ref, computed, onMounted, watch } from "vue";
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
import Checkbox from "primevue/checkbox";
import Divider from "primevue/divider";
import Tag from "primevue/tag";
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

const cuotasDisponibles = ref([]);
const cargosDisponibles = ref([]);
const cuotasSeleccionadas = ref([]);
const cargosSeleccionados = ref([]);
const cargandoDeudas = ref(false);

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

const totalCalculado = computed(() => {
  const totalCuotas = cuotasDisponibles.value
    .filter((c) => cuotasSeleccionadas.value.includes(c.id))
    .reduce((sum, c) => sum + (c.monto || 0), 0);
  const totalCargos = cargosDisponibles.value
    .filter((c) => cargosSeleccionados.value.includes(c.id))
    .reduce((sum, c) => sum + (c.monto || 0), 0);
  return totalCuotas + totalCargos;
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

async function cargarDeudasUnidad(unidadId) {
  const cid = auth.condominioActualId;
  if (!cid || !unidadId) {
    cuotasDisponibles.value = [];
    cargosDisponibles.value = [];
    cuotasSeleccionadas.value = [];
    cargosSeleccionados.value = [];
    return;
  }
  cargandoDeudas.value = true;
  try {
    const unidad = unidades.value.find((u) => u.id === unidadId);
    if (!unidad) return;

    const [periodosRes, cargosRes] = await Promise.all([
      finanzasService.listarGastosComunes(cid),
      finanzasService.listarCargosAdicionales(cid, { estado: "PENDIENTE" }),
    ]);

    const cuotas = [];
    for (const p of periodosRes.data) {
      if (p.estado === "CERRADO") continue;
      try {
        const { data: detalle } = await finanzasService.obtenerGastoComun(cid, p.id);
        for (const c of detalle.cuotas || []) {
          if (c.unidadNumero === String(unidad.numero) && c.estadoPago !== "PAGADO") {
            cuotas.push({ ...c, periodo: p.periodo });
          }
        }
      } catch (e) {
        console.warn("Error al cargar detalle de periodo", p.id, e);
      }
    }
    cuotasDisponibles.value = cuotas;

    const cargosPendientes = (cargosRes.data || []).filter(
      (c) => String(c.unidadNumero) === String(unidad.numero) && c.estado !== "ANULADO" && c.estado !== "PAGADO",
    );
    cargosDisponibles.value = cargosPendientes;

    cuotasSeleccionadas.value = [];
    cargosSeleccionados.value = [];
  } catch (e) {
    console.error("Error al cargar deudas de la unidad", e);
  } finally {
    cargandoDeudas.value = false;
  }
}

watch(() => form.value.unidadId, (nuevoId) => {
  cargarDeudasUnidad(nuevoId);
});

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
  cuotasDisponibles.value = [];
  cargosDisponibles.value = [];
  cuotasSeleccionadas.value = [];
  cargosSeleccionados.value = [];
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
  if (!cuotasSeleccionadas.value.length && !cargosSeleccionados.value.length) {
    return;
  }
  enviando.value = true;
  try {
    await finanzasService.crearPago(cid, {
      ...form.value,
      monto: totalCalculado.value,
      fechaPago: formatearFecha(form.value.fechaPago),
      cuotasGastoComunIds: cuotasSeleccionadas.value,
      cargosAdicionalesIds: cargosSeleccionados.value,
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

function toggleCuota(cuotaId) {
  const idx = cuotasSeleccionadas.value.indexOf(cuotaId);
  if (idx === -1) cuotasSeleccionadas.value.push(cuotaId);
  else cuotasSeleccionadas.value.splice(idx, 1);
}

function toggleCargo(cargoId) {
  const idx = cargosSeleccionados.value.indexOf(cargoId);
  if (idx === -1) cargosSeleccionados.value.push(cargoId);
  else cargosSeleccionados.value.splice(idx, 1);
}

function estadoSeverity(estado) {
  if (estado === "PAGADO") return "success";
  if (estado === "VENCIDO") return "danger";
  if (estado === "PENDIENTE") return "warn";
  return "info";
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

    <Dialog v-model:visible="showCrear" header="Registrar pago" modal :style="{ width: '95%', maxWidth: '560px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">Unidad *</label>
          <Select v-model="form.unidadId" :options="unidades" optionLabel="numero" optionValue="id" placeholder="Seleccionar unidad" />
        </div>

        <Divider />
        <label class="text-sm font-semibold">Deudas a pagar</label>

        <div v-if="!form.unidadId" class="text-sm text-surface-400 py-2">
          Selecciona una unidad para ver sus deudas pendientes
        </div>

        <template v-else-if="cargandoDeudas">
          <Skeleton width="100%" height="80px" />
        </template>

        <template v-else-if="!cuotasDisponibles.length && !cargosDisponibles.length">
          <p class="text-sm text-surface-400">No hay deudas pendientes para esta unidad</p>
        </template>

        <template v-else>
          <div v-if="cuotasDisponibles.length" class="flex flex-col gap-2">
            <span class="text-xs text-surface-500 font-semibold uppercase">Gastos Comunes</span>
            <div
              v-for="c in cuotasDisponibles"
              :key="c.id"
              class="flex items-center gap-2 p-2 surface-ground border-round cursor-pointer"
              @click="toggleCuota(c.id)"
            >
              <Checkbox
                :binary="true"
                :modelValue="cuotasSeleccionadas.includes(c.id)"
                @click.stop
              />
              <div class="flex-1 flex items-center justify-between text-sm">
                <div>
                  <span class="font-medium">{{ c.periodo }}</span>
                  <Tag :value="c.estadoPago" :severity="estadoSeverity(c.estadoPago)" size="small" class="ml-2" />
                </div>
                <span>{{ c.monto?.toLocaleString("es-CL") }}</span>
              </div>
            </div>
          </div>

          <div v-if="cargosDisponibles.length" class="flex flex-col gap-2">
            <span class="text-xs text-surface-500 font-semibold uppercase mt-2">Cargos Adicionales</span>
            <div
              v-for="c in cargosDisponibles"
              :key="c.id"
              class="flex items-center gap-2 p-2 surface-ground border-round cursor-pointer"
              @click="toggleCargo(c.id)"
            >
              <Checkbox
                :binary="true"
                :modelValue="cargosSeleccionados.includes(c.id)"
                @click.stop
              />
              <div class="flex-1 flex items-center justify-between text-sm">
                <div>
                  <span class="font-medium">{{ c.descripcion }}</span>
                  <span class="text-surface-400 ml-1">{{ c.categoriaNombre }}</span>
                </div>
                <span>{{ c.monto?.toLocaleString("es-CL") }}</span>
              </div>
            </div>
          </div>

          <div v-if="totalCalculado > 0" class="flex justify-between items-center p-2 surface-card border-round font-bold">
            <span>Total seleccionado</span>
            <span class="text-green-600">{{ totalCalculado.toLocaleString("es-CL") }}</span>
          </div>
        </template>

        <Divider />

        <div class="flex flex-col gap-1">
          <label class="text-sm">Cuenta destino *</label>
          <Select v-model="form.cuentaDestinoId" :options="cuentas" optionLabel="nombre" optionValue="id" placeholder="Seleccionar" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Fecha pago</label>
          <DatePicker v-model="form.fechaPago" class="w-full" />
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
        <Button
          label="Registrar pago"
          :loading="enviando"
          :disabled="!form.unidadId || !form.cuentaDestinoId || (!cuotasSeleccionadas.length && !cargosSeleccionados.length)"
          @click="crearPago"
        />
      </template>
    </Dialog>
  </div>
</template>
