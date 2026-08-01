<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { perfilService } from "@/services/perfilService";

import Card from "primevue/card";
import Tag from "primevue/tag";
import Badge from "primevue/badge";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Divider from "primevue/divider";
import Avatar from "primevue/avatar";
import Button from "primevue/button";

const auth = useAuthStore();
const dashboard = ref(null);
const loading = ref(true);
const error = ref(null);
const unidadActiva = ref(null);

function tipoUnidad(tipo) {
  const tipos = {
    CASA: "Casa",
    DEPARTAMENTO: "Departamento",
    ESTACIONAMIENTO: "Estacionamiento",
    BODEGA: "Bodega",
  };
  return tipos[tipo] || tipo;
}

function tipoVinculo(tipo) {
  const tipos = {
    PROPIETARIO: "Propietario",
    ARRENDATARIO: "Arrendatario",
    RESIDENTE_ADICIONAL: "Residente",
  };
  return tipos[tipo] || tipo;
}

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
    const res = await perfilService.getDashboardResidente(cid);
    dashboard.value = res.data;
    if (res.data.unidades?.length > 0) {
      unidadActiva.value = res.data.unidades[0].id;
    }
  } catch (e) {
    console.error("Error al cargar datos de la unidad", e);
    error.value = "Error al cargar los datos";
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
      <Card
        ><template #content><Skeleton width="100%" height="5rem" /></template
      ></Card>
      <Card
        ><template #content><Skeleton width="100%" height="6rem" /></template
      ></Card>
      <Card
        ><template #content><Skeleton width="100%" height="6rem" /></template
      ></Card>
      <Card
        ><template #content><Skeleton width="100%" height="6rem" /></template
      ></Card>
    </template>

    <template v-else-if="dashboard">
      <div v-if="dashboard.unidades?.length > 1" class="flex gap-2 overflow-x-auto pb-2">
        <Button
          v-for="u in dashboard.unidades"
          :key="u.id"
          size="small"
          :severity="unidadActiva === u.id ? 'primary' : 'secondary'"
          :variant="unidadActiva === u.id ? 'solid' : 'outlined'"
          @click="unidadActiva = u.id"
        >
          {{ tipoUnidad(u.tipo) }} {{ u.numero }}
        </Button>
      </div>

      <div
        v-for="unidad in dashboard.unidades"
        :key="unidad.id"
        v-show="unidad.id === unidadActiva"
        class="flex flex-col gap-4"
      >
        <!-- Header -->
        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold m-0">
                  {{ tipoUnidad(unidad.tipo) }} {{ unidad.numero }}
                </h2>
                <p class="text-sm text-surface-500 m-0 mt-1">{{ dashboard.email }}</p>
              </div>
              <Tag
                v-if="unidad.gastoActual"
                :value="labelDeuda(unidad.gastoActual.estadoPago)"
                :severity="severityDeuda(unidad.gastoActual.estadoPago)"
              />
            </div>
          </template>
        </Card>

        <!-- Convivientes -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-users" style="color: var(--p-primary-400)"></i>
              <span>Convivientes</span>
              <Badge :value="unidad.personas?.length || 0" severity="warn" />
            </div>
          </template>
          <template #content>
            <div
              v-if="!unidad.personas?.length"
              class="text-sm text-surface-400 py-2"
            >
              Sin convivientes registrados
            </div>
            <div class="flex flex-col gap-2">
              <div
                v-for="p in unidad.personas"
                :key="p.id"
                class="flex items-center justify-between p-2 border-round"
              >
                <div class="flex items-center gap-3">
                  <Avatar
                    :label="p.nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)"
                    size="small"
                    shape="circle"
                    class="font-bold text-sm"
                    style="background: var(--p-primary-400); color: #fff"
                  />
                  <span class="text-sm font-medium">{{ p.nombre }}</span>
                </div>
                <Tag
                  :value="tipoVinculo(p.tipo)"
                  severity="info"
                  class="text-xs"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Vehículos -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-car" style="color: var(--p-primary-400)"></i>
              <span>Vehículos</span>
              <Badge :value="unidad.vehiculos?.length || 0" severity="warn" />
            </div>
          </template>
          <template #content>
            <div
              v-if="!unidad.vehiculos?.length"
              class="text-sm text-surface-400 py-2"
            >
              Sin vehículos registrados
            </div>
            <div class="flex flex-col gap-2">
              <div
                v-for="v in unidad.vehiculos"
                :key="v.id"
                class="flex items-center justify-between p-2 border-round"
              >
                <div class="flex items-center gap-3">
                  <i
                    class="pi pi-car text-lg"
                    :class="v.activo ? 'text-primary' : 'text-surface-300'"
                  ></i>
                  <span class="text-sm font-mono font-medium">{{ v.patente }}</span>
                </div>
                <Tag
                  :value="v.activo ? 'Activo' : 'Inactivo'"
                  :severity="v.activo ? 'success' : 'contrast'"
                  class="text-xs"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Gasto común -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-credit-card" style="color: var(--p-primary-400)"></i>
              <span>Gasto común</span>
            </div>
          </template>
          <template #content>
            <div
              v-if="!unidad.gastoActual"
              class="text-sm text-surface-400 py-2 italic"
            >
              Sin gasto común activo para este período
            </div>
            <div v-else class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-surface-500">Período</span>
                <span class="text-sm font-medium">{{ unidad.gastoActual.periodo }}</span>
              </div>
              <Divider class="my-1" />
              <div class="flex items-center justify-between">
                <span class="text-sm text-surface-500">Vencimiento</span>
                <span class="text-sm font-medium">{{ unidad.gastoActual.fechaVencimiento }}</span>
              </div>
              <Divider class="my-1" />
              <div class="flex items-center justify-between">
                <span class="text-sm text-surface-500">Monto</span>
                <span class="text-lg font-bold">{{ formatMonto(unidad.gastoActual.monto) }}</span>
              </div>
              <Divider class="my-1" />
              <div class="flex items-center justify-between">
                <span class="text-sm text-surface-500">Estado</span>
                <Tag
                  :value="labelDeuda(unidad.gastoActual.estadoPago)"
                  :severity="severityDeuda(unidad.gastoActual.estadoPago)"
                />
              </div>
              <Divider v-if="unidad.gastoActual.fechaPago" class="my-1" />
              <div
                v-if="unidad.gastoActual.fechaPago"
                class="flex items-center justify-between"
              >
                <span class="text-sm text-surface-500">Pagado el</span>
                <span class="text-sm font-medium">{{ unidad.gastoActual.fechaPago }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </template>
  </div>
</template>

