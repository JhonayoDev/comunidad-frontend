<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { finanzasService } from "@/services/finanzasService";

import Card from "primevue/card";
import Button from "primevue/button";
import Select from "primevue/select";
import DatePicker from "primevue/datepicker";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";

const auth = useAuthStore();

const loading = ref(true);
const error = ref(null);
const movimientos = ref([]);
const cuentas = ref([]);

const filtroCuenta = ref(null);
const filtroDesde = ref(null);
const filtroHasta = ref(null);

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const [movRes, cuentasRes] = await Promise.all([
      finanzasService.listarLedger(cid),
      finanzasService.listarCuentas(cid),
    ]);
    movimientos.value = movRes.data;
    cuentas.value = cuentasRes.data;
  } catch (e) {
    console.error("Error al cargar ledger", e);
    error.value = "No se pudo cargar el libro mayor";
  } finally {
    loading.value = false;
  }
}

async function buscar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  try {
    const params = {};
    if (filtroCuenta.value) params.cuentaId = filtroCuenta.value;
    if (filtroDesde.value) params.desde = formatearFecha(filtroDesde.value);
    if (filtroHasta.value) params.hasta = formatearFecha(filtroHasta.value);
    const { data } = await finanzasService.listarLedger(cid, params);
    movimientos.value = data;
  } catch (e) {
    console.error("Error al buscar ledger", e);
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

function tipoSeverity(tipo) {
  if (tipo === "CREDITO") return "success";
  if (tipo === "DEBITO") return "danger";
  return "info";
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <h1 class="text-xl font-bold m-0">Libro Mayor</h1>

    <Card>
      <template #content>
        <div class="flex flex-wrap gap-2 items-end">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Cuenta</label>
            <Select
              v-model="filtroCuenta"
              :options="cuentas"
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
          <Button label="Buscar" icon="pi pi-search" size="small" severity="secondary" @click="buscar" />
        </div>
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!movimientos.length" class="text-center text-surface-400 py-8">
        No hay movimientos registrados
      </div>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="m in movimientos"
          :key="m.id"
          class="surface-card p-3 border-round shadow-1"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <Tag :value="m.tipo" :severity="tipoSeverity(m.tipo)" size="small" />
                <span class="font-medium">{{ m.descripcion }}</span>
              </div>
              <div class="text-sm text-surface-500">
                {{ m.fechaTransaccion }} — {{ m.cuentaNombre }}
                <span v-if="m.referenciaTipo" class="ml-2">Ref: {{ m.referenciaTipo }}</span>
              </div>
              <div class="text-xs text-surface-400">
                {{ m.registradoPorNombre }}
              </div>
            </div>
            <span
              class="font-bold text-lg"
              :class="m.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'"
            >
              {{ m.tipo === 'CREDITO' ? '+' : '-' }}{{ m.monto?.toLocaleString("es-CL") }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
