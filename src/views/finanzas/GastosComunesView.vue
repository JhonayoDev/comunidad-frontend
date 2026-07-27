<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { finanzasService } from "@/services/finanzasService";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import DatePicker from "primevue/datepicker";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";

const auth = useAuthStore();

const loading = ref(true);
const error = ref(null);
const periodos = ref([]);

const showCrear = ref(false);
const showDetalle = ref(false);
const detalle = ref(null);
const enviando = ref(false);

const form = ref({
  periodo: "",
  fechaVencimiento: null,
  montoBase: null,
});

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await finanzasService.listarGastosComunes(cid);
    periodos.value = data;
  } catch (e) {
    console.error("Error al cargar gastos comunes", e);
    error.value = "No se pudieron cargar los gastos comunes";
  } finally {
    loading.value = false;
  }
}

function abrirCrear() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  form.value = {
    periodo: `${ahora.getFullYear()}-${mes}`,
    fechaVencimiento: new Date(ahora.getFullYear(), ahora.getMonth() + 1, 10),
    montoBase: null,
  };
  showCrear.value = true;
}

async function crearPeriodo() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    const d = form.value.fechaVencimiento;
    const fechaVencimiento = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    await finanzasService.crearGastoComun(cid, {
      periodo: form.value.periodo,
      fechaVencimiento,
      montoBase: form.value.montoBase,
    });
    showCrear.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al crear periodo", e);
  } finally {
    enviando.value = false;
  }
}

async function verDetalle(p) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    const { data } = await finanzasService.obtenerGastoComun(cid, p.id);
    detalle.value = data;
    showDetalle.value = true;
  } catch (e) {
    console.error("Error al cargar detalle", e);
  }
}

function formatoMonto(n) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(n || 0);
}

function estadoSeverity(estado) {
  if (estado === "ABIERTO") return "success";
  if (estado === "CERRADO") return "info";
  if (estado === "PENDIENTE") return "warn";
  return "info";
}

function pagoSeverity(estado) {
  if (estado === "PAGADO") return "success";
  if (estado === "PENDIENTE") return "warn";
  if (estado === "VENCIDO") return "danger";
  return "info";
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold m-0">Gastos Comunes</h1>
      <Button label="Nuevo periodo" icon="pi pi-plus" size="small" @click="abrirCrear" />
    </div>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!periodos.length" class="text-center text-surface-400 py-8">
        No hay periodos registrados
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card
          v-for="p in periodos"
          :key="p.id"
          class="cursor-pointer hover:shadow-3 transition-shadow"
          @click="verDetalle(p)"
        >
          <template #title>
            <div class="flex items-center justify-between">
              <span>{{ p.periodo }}</span>
              <Tag :value="p.estado" :severity="estadoSeverity(p.estado)" size="small" />
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-1 text-sm">
              <div class="flex justify-between">
                <span class="text-surface-500">Vencimiento</span>
                <span>{{ p.fechaVencimiento }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-surface-500">Esperado</span>
                <span>{{ formatoMonto(p.montoEsperado) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-surface-500">Recaudado</span>
                <span class="font-semibold text-green-600">{{ formatoMonto(p.montoRecaudado) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-surface-500">Pagado</span>
                <span>{{ p.unidadesPagadas }}/{{ p.totalUnidades }} ({{ p.porcentajePagado?.toFixed(0) }}%)</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </template>

    <Dialog v-model:visible="showCrear" header="Nuevo periodo" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Periodo (YYYY-MM)</label>
          <InputText v-model="form.periodo" placeholder="2026-07" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Fecha vencimiento</label>
          <DatePicker v-model="form.fechaVencimiento" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Monto base</label>
          <InputNumber v-model="form.montoBase" :min="0" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showCrear = false" />
        <Button label="Crear" :loading="enviando" @click="crearPeriodo" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showDetalle" header="Detalle del periodo" modal :style="{ width: '95%', maxWidth: '600px' }">
      <template v-if="detalle">
        <p class="text-sm text-surface-500 m-0 mb-3">{{ detalle.resumen?.periodo }} — {{ detalle.resumen?.estado }}</p>
        <div class="flex flex-col gap-2">
          <div
            v-for="c in detalle.cuotas"
            :key="c.id"
            class="flex justify-between items-center pb-2 border-bottom-1 surface-border"
          >
            <div>
              <span class="font-medium">{{ c.unidadNumero }}</span>
              <Tag
                :value="c.estadoPago"
                :severity="pagoSeverity(c.estadoPago)"
                size="small"
                class="ml-2"
              />
              <span v-if="c.fechaPago" class="text-xs text-surface-400 ml-2">{{ c.fechaPago }}</span>
            </div>
            <span class="font-semibold">{{ c.monto?.toLocaleString("es-CL") }}</span>
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>
