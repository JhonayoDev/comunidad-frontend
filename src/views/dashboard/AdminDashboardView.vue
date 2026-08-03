<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/services/dashboardService";
import TarjetaAccesosActivos from "@/components/stats/TarjetaAccesosActivos.vue";
import TarjetaEncomiendasPendientes from "@/components/stats/TarjetaEncomiendasPendientes.vue";

import Card from "primevue/card";
import Tag from "primevue/tag";
import Badge from "primevue/badge";
import Avatar from "primevue/avatar";
import Button from "primevue/button";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";

const router = useRouter();
const auth = useAuthStore();
const dashboard = ref(null);
const loading = ref(true);
const error = ref(null);

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await dashboardService.admin(cid);
    dashboard.value = data;
  } catch (e) {
    console.error("Error al cargar dashboard admin", e);
    error.value = "Error al cargar el dashboard";
  } finally {
    loading.value = false;
  }
}

function tipoLabel(t) {
  const map = { VISITA: "Visita", DELIVERY: "Delivery", UBER: "Uber", SERVICIO: "Servicio", TECNICO: "Técnico", OTRO: "Otro" };
  return map[t] || t;
}

function estadoSeverity(e) {
  if (e === "ACTIVO") return "success";
  if (e === "FINALIZADO") return "info";
  if (e === "RECHAZADO") return "danger";
  return "info";
}

function formatFecha(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <template v-if="loading">
      <Card><template #content><Skeleton width="60%" height="1.5rem" /></template></Card>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card v-for="i in 6" :key="i"><template #content><Skeleton width="100%" height="4rem" /></template></Card>
      </div>
    </template>

    <template v-else-if="dashboard">
      <Card>
        <template #content>
          <div class="flex items-center gap-3">
            <Avatar icon="pi pi-building" size="large" class="bg-primary text-white" />
            <div>
              <h1 class="text-xl font-bold m-0">{{ dashboard.condominio?.nombre || "Dashboard" }}</h1>
              <span v-if="dashboard.condominio?.direccion" class="text-sm text-surface-400">{{ dashboard.condominio.direccion }}</span>
            </div>
          </div>
        </template>
      </Card>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <template #content class="flex flex-col items-center text-center gap-1">
            <i class="pi pi-home text-primary" style="font-size:1.5rem"></i>
            <span class="text-2xl font-bold">{{ dashboard.totales.unidades }}</span>
            <span class="text-xs text-surface-400">Unidades</span>
          </template>
        </Card>
        <Card>
          <template #content class="flex flex-col items-center text-center gap-1">
            <i class="pi pi-users text-primary" style="font-size:1.5rem"></i>
            <span class="text-2xl font-bold">{{ dashboard.totales.residentesActivos }}</span>
            <span class="text-xs text-surface-400">Residentes</span>
          </template>
        </Card>
        <Card>
          <template #content class="flex flex-col items-center text-center gap-1">
            <i class="pi pi-car text-primary" style="font-size:1.5rem"></i>
            <span class="text-2xl font-bold">{{ dashboard.totales.vehiculos }}</span>
            <span class="text-xs text-surface-400">Vehículos</span>
          </template>
        </Card>
        <Card>
          <template #content class="flex flex-col items-center text-center gap-1">
            <i class="pi pi-megaphone text-primary" style="font-size:1.5rem"></i>
            <span class="text-2xl font-bold">{{ dashboard.anunciosVigentes }}</span>
            <span class="text-xs text-surface-400">Anuncios</span>
          </template>
        </Card>
        <TarjetaAccesosActivos
          :conteo-inicial="dashboard.accesos?.activosAhora ?? 0"
          @click="router.push({ name: 'Visitas' })"
        />
        <TarjetaEncomiendasPendientes
          :conteo-inicial="dashboard.pendientes?.encomiendas ?? 0"
          @click="router.push({ name: 'Encomiendas' })"
        />
      </div>

      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-shield"></i>
            <span>Accesos</span>
            <TarjetaAccesosActivos
              variant="badge"
              :conteo-inicial="dashboard.accesos?.activosAhora ?? 0"
            />
          </div>
        </template>
        <template #content>
          <div v-if="!dashboard.accesos.ultimosMovimientos?.length" class="text-sm text-surface-400 text-center py-2">Sin movimientos recientes</div>
          <div v-else class="flex flex-col gap-2">
            <div v-for="m in dashboard.accesos.ultimosMovimientos" :key="m.id" class="flex items-center justify-between p-2 surface-ground border-round">
              <div class="flex items-center gap-2 min-w-0">
                <Avatar :label="(m.nombreVisitante || '?')[0]" size="small" shape="circle" class="shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm font-medium m-0 truncate">{{ m.nombreVisitante }}</p>
                  <p class="text-xs text-surface-400 m-0">{{ m.unidadNumero }} · {{ tipoLabel(m.tipo) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <Tag :value="m.estado" :severity="estadoSeverity(m.estado)" size="small" />
                <span class="text-xs text-surface-400">{{ formatFecha(m.ingreso) }}</span>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card v-if="dashboard.gastoComunActual">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar"></i>
            <span>Gasto común actual</span>
            <Tag :value="dashboard.gastoComunActual.periodo" size="small" />
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-2">
            <div class="flex justify-between text-sm">
              <span class="text-surface-400">Vencimiento</span>
              <span>{{ new Date(dashboard.gastoComunActual.fechaVencimiento).toLocaleDateString("es-CL") }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-surface-400">Recaudado</span>
              <span class="font-medium">{{ (dashboard.gastoComunActual.porcentajePagado || 0).toFixed(0) }}%</span>
            </div>
            <div class="w-full bg-surface-200 h-2 border-round overflow-hidden">
              <div class="bg-primary h-full border-round transition-all" :style="{ width: (dashboard.gastoComunActual.porcentajePagado || 0) + '%' }"></div>
            </div>
            <div class="flex justify-between text-xs text-surface-400">
              <span>{{ dashboard.gastoComunActual.unidadesPagadas }} / {{ dashboard.gastoComunActual.totalUnidades }} unidades</span>
              <span>${{ Number(dashboard.gastoComunActual.montoRecaudado || 0).toLocaleString("es-CL") }} / ${{ Number(dashboard.gastoComunActual.montoEsperado || 0).toLocaleString("es-CL") }}</span>
            </div>
            <Tag v-if="dashboard.gastoComunActual.estado === 'CERRADO'" value="Cerrado" severity="warn" class="mt-1" />
          </div>
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-bolt"></i>
            <span>Acceso rápido</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-2 gap-2">
            <Button label="Residentes" icon="pi pi-users" variant="outlined" size="small" class="h-12" @click="router.push({ name: 'Residentes' })" />
            <Button label="Vehículos" icon="pi pi-car" variant="outlined" size="small" class="h-12" @click="router.push({ name: 'Vehiculos' })" />
            <Button label="Anuncios" icon="pi pi-megaphone" variant="outlined" size="small" class="h-12" @click="router.push({ name: 'Anuncios' })" />
            <Button label="Encomiendas" icon="pi pi-box" variant="outlined" size="small" class="h-12" @click="router.push({ name: 'Encomiendas' })" />
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>
