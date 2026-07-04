<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { perfilService } from "@/services/perfilService";

import Card from "primevue/card";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Divider from "primevue/divider";

const auth = useAuthStore();
const deudas = ref(null);
const loading = ref(true);
const error = ref(null);

function formatMonto(monto) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(monto);
}

function severityDeuda(estado) {
  if (estado === "PAGADO") return "success";
  if (estado === "VENCIDO") return "danger";
  return "warn";
}

function labelDeuda(estado) {
  if (estado === "PAGADO") return "Pagado";
  if (estado === "VENCIDO") return "Vencido";
  return "Pendiente";
}

onMounted(async () => {
  const cid = auth.condominioActualId;
  if (!cid) {
    error.value = "Selecciona un condominio primero";
    loading.value = false;
    return;
  }
  try {
    const res = await perfilService.getMisDeudas(cid);
    deudas.value = res.data;
  } catch (e) {
    console.error("Error al cargar deudas", e);
    error.value = "Error al cargar el estado de cuenta";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <template v-if="loading">
      <Card><template #content><Skeleton width="100%" height="10rem" /></template></Card>
      <Card><template #content><Skeleton width="100%" height="6rem" /></template></Card>
    </template>

    <template v-else-if="deudas">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold m-0">Mis deudas</h2>
        <Tag
          v-if="deudas.totalPendiente > 0"
          :value="formatMonto(deudas.totalPendiente)"
          severity="danger"
        />
      </div>

      <div v-if="deudas.unidades?.length === 0" class="text-center py-8 text-surface-400">
        No tienes deudas pendientes
      </div>

      <div v-for="unidad in deudas.unidades" :key="unidad.unidadId" class="flex flex-col gap-3">
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span>{{ unidad.unidadTipo }} {{ unidad.unidadNumero }}</span>
              <span class="text-sm font-bold">{{ formatMonto(unidad.totalUnidad) }}</span>
            </div>
          </template>
          <template #content>
            <!-- Gasto común -->
            <div v-if="unidad.gastoComun" class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-credit-card text-primary"></i>
                  <span class="text-sm font-medium">GC {{ unidad.gastoComun.periodo }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">{{ formatMonto(unidad.gastoComun.monto) }}</span>
                  <Tag
                    :value="labelDeuda(unidad.gastoComun.estadoPago)"
                    :severity="severityDeuda(unidad.gastoComun.estadoPago)"
                  />
                </div>
              </div>
              <p class="text-xs text-surface-500 m-0 ml-6">
                Vence: {{ unidad.gastoComun.fechaVencimiento }}
              </p>
            </div>

            <!-- Cargos adicionales -->
            <div v-if="unidad.cargosAdicionales?.length > 0">
              <Divider class="my-2" />
              <p class="text-xs font-semibold text-surface-500 uppercase mb-2">Cargos adicionales</p>
              <div
                v-for="(cargo, i) in unidad.cargosAdicionales"
                :key="cargo.cargoId"
                class="flex items-center justify-between py-1"
                :class="{ 'border-t border-surface-100': i > 0 }"
              >
                <div class="flex flex-col">
                  <span class="text-sm">{{ cargo.descripcion }}</span>
                  <span class="text-xs text-surface-400">{{ cargo.categoria }}</span>
                </div>
                <span class="text-sm font-medium">{{ formatMonto(cargo.monto) }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </template>
  </div>
</template>
