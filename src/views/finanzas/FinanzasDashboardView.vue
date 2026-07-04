<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { finanzasService } from "@/services/finanzasService";

import Card from "primevue/card";
import Skeleton from "primevue/skeleton";
import Tag from "primevue/tag";
import Message from "primevue/message";

const auth = useAuthStore();
const loading = ref(true);
const error = ref(null);
const dashboard = ref(null);

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await finanzasService.dashboard(cid);
    dashboard.value = data;
  } catch (e) {
    console.error("Error al cargar dashboard financiero", e);
    error.value = "No se pudo cargar el dashboard financiero";
  } finally {
    loading.value = false;
  }
}

function formatoMonto(n) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(n || 0);
}

function resultadoTag(resultado) {
  if (!resultado) return "info";
  if (resultado > 0) return "success";
  if (resultado < 0) return "danger";
  return "info";
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <h1 class="text-xl font-bold m-0">Dashboard Financiero</h1>

    <Skeleton v-if="loading" width="100%" height="200px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else-if="dashboard">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <template #title>Mes Actual</template>
          <template #content>
            <p class="text-sm text-surface-500 m-0 mb-2">
              {{ dashboard.mesActual?.periodo || "—" }}
            </p>
            <div class="flex flex-col gap-2">
              <div class="flex justify-between">
                <span class="text-sm">Ingresos</span>
                <span class="text-sm font-semibold text-green-600">
                  {{ formatoMonto(dashboard.mesActual?.totalIngresos) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm">Egresos</span>
                <span class="text-sm font-semibold text-red-600">
                  {{ formatoMonto(dashboard.mesActual?.totalEgresos) }}
                </span>
              </div>
              <div class="flex justify-between border-t-1 surface-border pt-2">
                <span class="text-sm font-bold">Resultado</span>
                <Tag
                  :severity="resultadoTag(dashboard.mesActual?.resultado)"
                  :value="formatoMonto(dashboard.mesActual?.resultado)"
                />
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #title>Mes Anterior</template>
          <template #content>
            <p class="text-sm text-surface-500 m-0 mb-2">
              {{ dashboard.mesAnterior?.periodo || "—" }}
            </p>
            <div class="flex flex-col gap-2">
              <div class="flex justify-between">
                <span class="text-sm">Ingresos</span>
                <span class="text-sm font-semibold text-green-600">
                  {{ formatoMonto(dashboard.mesAnterior?.totalIngresos) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm">Egresos</span>
                <span class="text-sm font-semibold text-red-600">
                  {{ formatoMonto(dashboard.mesAnterior?.totalEgresos) }}
                </span>
              </div>
              <div class="flex justify-between border-t-1 surface-border pt-2">
                <span class="text-sm font-bold">Resultado</span>
                <Tag
                  :severity="resultadoTag(dashboard.mesAnterior?.resultado)"
                  :value="formatoMonto(dashboard.mesAnterior?.resultado)"
                />
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #title>Morosidad</template>
          <template #content>
            <div class="flex flex-col gap-2">
              <div class="flex justify-between">
                <span class="text-sm">Unidades</span>
                <span class="text-sm">{{ dashboard.morosidad?.totalUnidades || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-green-600">Pagadas</span>
                <span class="text-sm">{{ dashboard.morosidad?.unidadesPagadas || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-red-600">Pendientes</span>
                <span class="text-sm">{{ dashboard.morosidad?.unidadesPendientes || 0 }}</span>
              </div>
              <div class="flex justify-between border-t-1 surface-border pt-2">
                <span class="text-sm font-bold">Total moroso</span>
                <span class="text-sm font-bold text-red-600">
                  {{ formatoMonto(dashboard.morosidad?.totalMoroso) }}
                </span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <Card>
        <template #title>Saldos de Cuentas</template>
        <template #content>
          <div v-if="!dashboard.saldosCuentas?.length" class="text-sm text-surface-500">
            No hay cuentas registradas
          </div>
          <div v-else class="flex flex-col gap-3">
            <div
              v-for="cta in dashboard.saldosCuentas"
              :key="cta.cuentaId"
              class="flex justify-between items-center pb-2 border-bottom-1 surface-border"
            >
              <div>
                <span class="font-medium">{{ cta.cuentaNombre }}</span>
                <span class="text-xs text-surface-500 ml-2">{{ cta.cuentaTipo }}</span>
                <br>
                <span class="text-xs text-surface-400">{{ cta.banco }} {{ cta.numeroCuenta }}</span>
              </div>
              <span class="font-bold" :class="cta.saldoActual >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatoMonto(cta.saldoActual) }}
              </span>
            </div>
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>
