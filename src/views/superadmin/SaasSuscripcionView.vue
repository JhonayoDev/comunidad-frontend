<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { adminService } from "@/services/adminService";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Select from "primevue/select";
import InputNumber from "primevue/inputnumber";
import DatePicker from "primevue/datepicker";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Dialog from "primevue/dialog";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref(null);
const historial = ref([]);
const planes = ref([]);
const suscripcionActual = ref(null);

const showCambiarPlan = ref(false);
const showPago = ref(false);
const enviando = ref(false);

const cambioPlanForm = ref({ planId: null, ciclo: "MENSUAL" });
const pagoForm = ref({ monto: null, nuevaFechaVencimiento: new Date() });

const estadoSeverity = { ACTIVA: "success", ATRASADA: "warn", CANCELADA: "danger", EXPIRADA: "danger" };

async function cargar() {
  const cid = route.params.id;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const [histRes, planesRes] = await Promise.all([
      adminService.historialSuscripcion(cid),
      adminService.listarPlanes(),
    ]);
    historial.value = histRes.data || [];
    planes.value = planesRes.data || [];
    suscripcionActual.value = historial.value[0] || null;
  } catch (e) {
    console.error("Error al cargar suscripción", e);
    error.value = "No se pudo cargar la información de suscripción";
  } finally {
    loading.value = false;
  }
}

async function cambiarPlan() {
  enviando.value = true;
  try {
    await adminService.cambiarPlan(route.params.id, cambioPlanForm.value);
    showCambiarPlan.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al cambiar plan", e);
  } finally {
    enviando.value = false;
  }
}

async function registrarPago() {
  enviando.value = true;
  try {
    const d = pagoForm.value.nuevaFechaVencimiento;
    await adminService.registrarPagoSuscripcion(route.params.id, {
      monto: pagoForm.value.monto,
      nuevaFechaVencimiento: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    });
    showPago.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al registrar pago", e);
  } finally {
    enviando.value = false;
  }
}

function formatoCLP(n) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(n || 0);
}

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Button label="← Volver" size="small" variant="text" icon="pi pi-arrow-left" @click="router.push({ name: 'SaasCondominioDetail', params: { id: route.params.id } })" />
    <h1 class="text-xl font-bold m-0">Suscripción</h1>

    <Skeleton v-if="loading" width="100%" height="200px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <Card v-if="suscripcionActual">
        <template #title>
          <div class="flex items-center justify-between">
            <span>Suscripción actual</span>
            <Tag :value="suscripcionActual.estado" :severity="estadoSeverity[suscripcionActual.estado] || 'info'" />
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span class="text-surface-400">Plan:</span> <strong>{{ suscripcionActual.planNombre }}</strong></div>
            <div><span class="text-surface-400">Ciclo:</span> {{ suscripcionActual.ciclo }}</div>
            <div><span class="text-surface-400">Inicio:</span> {{ formatFecha(suscripcionActual.fechaInicio) }}</div>
            <div><span class="text-surface-400">Fin:</span> {{ formatFecha(suscripcionActual.fechaFin) }}</div>
            <div><span class="text-surface-400">Monto pagado:</span> {{ formatoCLP(suscripcionActual.montoPagado) }}</div>
            <div><span class="text-surface-400">Pagado en:</span> {{ formatFecha(suscripcionActual.pagadoEn) }}</div>
          </div>
        </template>
        <template #footer>
          <div class="flex gap-2">
            <Button label="Cambiar plan" icon="pi pi-refresh" size="small" severity="secondary" @click="showCambiarPlan = true" />
            <Button label="Registrar pago" icon="pi pi-plus" size="small" @click="showPago = true" />
          </div>
        </template>
      </Card>

      <Card v-if="historial.length > 1">
        <template #title>Historial</template>
        <template #content>
          <div class="flex flex-col gap-2">
            <div v-for="s in historial" :key="s.id" class="flex items-center justify-between text-sm p-2 surface-ground border-round">
              <div>
                <span class="font-medium">{{ s.planNombre }}</span>
                <Tag :value="s.estado" :severity="estadoSeverity[s.estado] || 'info'" size="small" class="ml-2" />
              </div>
              <div class="text-surface-400">{{ formatFecha(s.fechaInicio) }}</div>
            </div>
          </div>
        </template>
      </Card>
    </template>

    <Dialog v-model:visible="showCambiarPlan" header="Cambiar plan" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Plan</label>
          <Select v-model="cambioPlanForm.planId" :options="planes" optionLabel="nombre" optionValue="id" placeholder="Seleccionar plan" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Ciclo</label>
          <Select v-model="cambioPlanForm.ciclo" :options="[{ label: 'Mensual', value: 'MENSUAL' }, { label: 'Anual', value: 'ANUAL' }]" optionLabel="label" optionValue="value" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showCambiarPlan = false" />
        <Button label="Cambiar" :loading="enviando" @click="cambiarPlan" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showPago" header="Registrar pago" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Monto</label>
          <InputNumber v-model="pagoForm.monto" :min="0" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Nueva fecha de vencimiento</label>
          <DatePicker v-model="pagoForm.nuevaFechaVencimiento" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showPago = false" />
        <Button label="Registrar" :loading="enviando" @click="registrarPago" />
      </template>
    </Dialog>
  </div>
</template>
