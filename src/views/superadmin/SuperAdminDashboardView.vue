<script setup>
import { ref, onMounted } from "vue";
import { adminService } from "@/services/adminService";

import Card from "primevue/card";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";

const loading = ref(true);
const error = ref(null);
const metrics = ref(null);

async function cargar() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await adminService.getMetrics();
    metrics.value = data;
  } catch (e) {
    console.error("Error al cargar dashboard", e);
    error.value = "No se pudieron cargar los datos";
  } finally {
    loading.value = false;
  }
}

function formatoCLP(n) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(n || 0);
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Panel SaaS</h1>
    </div>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <Skeleton v-if="loading" width="100%" height="200px" />

    <template v-else-if="metrics">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <template #content class="p-3">
            <div class="text-xs text-surface-500 uppercase tracking-wide">Total</div>
            <div class="text-2xl font-bold">{{ metrics.totalCondominios }}</div>
          </template>
        </Card>
        <Card>
          <template #content class="p-3">
            <div class="text-xs text-surface-500 uppercase tracking-wide">Activos</div>
            <div class="text-2xl font-bold text-green-600">{{ metrics.activos }}</div>
          </template>
        </Card>
        <Card>
          <template #content class="p-3">
            <div class="text-xs text-surface-500 uppercase tracking-wide">Suspendidos</div>
            <div class="text-2xl font-bold text-red-600">{{ metrics.suspendidos }}</div>
          </template>
        </Card>
        <Card>
          <template #content class="p-3">
            <div class="text-xs text-surface-500 uppercase tracking-wide">Morosos</div>
            <div class="text-2xl font-bold text-orange-600">{{ metrics.morosos }}</div>
          </template>
        </Card>
        <Card>
          <template #content class="p-3">
            <div class="text-xs text-surface-500 uppercase tracking-wide">MRR Aproximado</div>
            <div class="text-lg font-bold text-primary">{{ formatoCLP(metrics.mrrAproximado) }}</div>
          </template>
        </Card>
        <Card>
          <template #content class="p-3">
            <div class="text-xs text-surface-500 uppercase tracking-wide">Usuarios activos</div>
            <div class="text-2xl font-bold">{{ metrics.totalUsuariosActivos }}</div>
          </template>
        </Card>
        <Card>
          <template #content class="p-3">
            <div class="text-xs text-surface-500 uppercase tracking-wide">Storage usado</div>
            <div class="text-lg font-bold">{{ (metrics.storageTotalUsadoMb / 1024).toFixed(1) }} GB</div>
          </template>
        </Card>
        <Card>
          <template #content class="p-3">
            <div class="text-xs text-surface-500 uppercase tracking-wide">Nuevos este mes</div>
            <div class="text-2xl font-bold text-primary">{{ metrics.condominiosNuevosEsteMes }}</div>
          </template>
        </Card>
      </div>

      <div v-if="metrics.condominiosPorPlan?.length" class="flex flex-wrap gap-2">
        <Tag v-for="p in metrics.condominiosPorPlan" :key="p.planCodigo">
          {{ p.planNombre }}: {{ p.cantidad }}
        </Tag>
      </div>
    </template>
  </div>
</template>
