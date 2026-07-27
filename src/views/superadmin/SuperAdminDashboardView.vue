<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { adminService } from "@/services/adminService";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";

const router = useRouter();
const auth = useAuthStore();

const loading = ref(true);
const error = ref(null);
const metrics = ref(null);
const condominios = ref([]);
const busqueda = ref("");

const statusSeverity = {
  PENDIENTE: "warn",
  PAGADO: "success",
  ATRASADO: "danger",
  SUSPENDIDO: "danger",
};

const onboardingSeverity = {
  PENDIENTE: "danger",
  CONFIGURANDO: "warn",
  COMPLETADO: "success",
  SALTADO: "info",
};

async function cargar() {
  loading.value = true;
  error.value = null;
  try {
    const [metricsRes, condominiosRes] = await Promise.all([
      adminService.getMetrics(),
      adminService.listarCondominios({ page: 0, size: 100 }),
    ]);
    metrics.value = metricsRes.data;
    condominios.value = condominiosRes.data.content || [];
  } catch (e) {
    console.error("Error al cargar dashboard", e);
    error.value = "No se pudieron cargar los datos";
  } finally {
    loading.value = false;
  }
}

const condominiosFiltrados = computed(() => {
  const t = busqueda.value.trim().toLowerCase();
  if (!t) return condominios.value;
  return condominios.value.filter((c) =>
    c.nombre?.toLowerCase().includes(t) || c.responsableNombre?.toLowerCase().includes(t),
  );
});

function irA(ruta, params) {
  router.push({ name: ruta, params });
}

function entrarACondominio(id) {
  auth.seleccionarCondominio(id);
  router.push({ name: "Dashboard" });
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

    <div class="flex items-center justify-between mt-2">
      <h2 class="text-lg font-bold m-0">Condominios</h2>
      <Button label="Nuevo" icon="pi pi-plus" size="small" @click="irA('SaasCrearCondominio')" />
    </div>

    <IconField>
      <InputIcon class="pi pi-search" />
      <InputText v-model="busqueda" placeholder="Buscar por nombre o responsable..." class="w-full" />
    </IconField>

    <Skeleton v-if="loading" width="100%" height="300px" />

    <template v-else>
      <div v-if="!condominiosFiltrados.length" class="text-center text-surface-400 py-8">
        No hay condominios
      </div>
      <div v-else class="flex flex-col gap-2">
        <Card
          v-for="c in condominiosFiltrados"
          :key="c.id"
          class="cursor-pointer hover:shadow-3 transition-shadow"
          @click="irA('SaasCondominioDetail', { id: c.id })"
        >
          <template #content>
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm">{{ c.nombre }}</span>
                  <Tag :value="c.statusPago" :severity="statusSeverity[c.statusPago] || 'info'" size="small" />
                  <Tag :value="c.onboardingStatus" :severity="onboardingSeverity[c.onboardingStatus] || 'info'" size="small" />
                </div>
                <div class="text-xs text-surface-500 mt-1">
                  {{ c.planNombre }} — {{ c.responsableNombre }}
                </div>
                <div class="text-xs text-surface-400">
                  {{ c.totalUnidades }} unid. · {{ c.totalUsuariosActivos }} usu. · {{ (c.storageUsadoMb / 1024).toFixed(1) }}/{{ (c.storageLimitMb / 1024).toFixed(1) }} GB
                </div>
              </div>
              <div class="flex flex-col items-end gap-1 shrink-0">
                <Button label="Entrar" size="small" variant="text" @click.stop="entrarACondominio(c.id)" />
                <Button
                  icon="pi pi-cog"
                  size="small"
                  variant="text"
                  @click.stop="irA('SaasCondominioDetail', { id: c.id })"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </template>
  </div>
</template>
