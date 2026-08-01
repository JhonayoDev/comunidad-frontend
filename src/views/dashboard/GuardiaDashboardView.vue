<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useTurno } from "@/composables/useTurno";
import { useDashboardGuardia } from "@/composables/useDashboardGuardia";
import { useMetricasTiempoReal } from "@/composables/useMetricasTiempoReal";
import TarjetaAccesosActivos from "@/components/stats/TarjetaAccesosActivos.vue";
import TarjetaEncomiendasPendientes from "@/components/stats/TarjetaEncomiendasPendientes.vue";
import ChecklistDialog from "@/components/bitacora/ChecklistDialog.vue";

import Card from "primevue/card";
import Badge from "primevue/badge";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import TurnoCard from "@/components/bitacora/TurnoCard.vue";
import NovedadDialog from "@/components/bitacora/NovedadDialog.vue";
import BuscadorPatenteCard from "@/components/visitas/BuscadorPatenteCard.vue";
import AccesoRapidoCard from "@/components/quickaccess/AccesoRapidoCard.vue";
import { ACCESO_RAPIDO_GUARDIA } from "@/config/navegacionAccesoRapido";
import { formatearHora } from "@/utils/fechas";

const router = useRouter();
const auth = useAuthStore();
const showNovedadDialog = ref(false);

const {
  turno,
  turnoLoading,
  turnoError,
  enviandoNovedad,
  accionesLabels,
  confirmMessages,
  cargarTurno,
  ejecutarAccion,
  registrarNovedad,
  formatearFecha,
  checklistDialogVisible,
  checklistItems,
  checklistLoading,
  checklistTipo,
  confirmarConChecklist,
  cancelarChecklist,
} = useTurno();

const {
  dashboard,
  autorizaciones,
  loading,
  error,
  cargarDashboard,
  severityEstado,
} = useDashboardGuardia();

const { estaVivo } = useMetricasTiempoReal();

const mergedError = computed(() => turnoError.value || error.value);

onMounted(() => {
  cargarDashboard();
  cargarTurno();
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Message v-if="mergedError" severity="error" :closable="false">
      {{ mergedError }}
    </Message>

    <template v-if="loading">
      <Card
        ><template #content><Skeleton width="100%" height="5rem" /></template
      ></Card>
      <div class="grid grid-cols-2 gap-3">
        <Card v-for="i in 4" :key="i"
          ><template #content><Skeleton width="100%" height="4rem" /></template
        ></Card>
      </div>
      <Card
        ><template #content><Skeleton width="100%" height="8rem" /></template
      ></Card>
    </template>

    <template v-else-if="dashboard">
      <!-- Estado de la conexión SSE: las tarjetas de métricas se alimentan en
           vivo por el stream; si cae, los conteos quedan en el último valor
           conocido. Solo si no se recupera en la gracia (1 min) se activa el
           polling de respaldo a 2 min (no inunda de peticiones). -->
      <!-- <div class="flex items-center gap-2 self-start">
        <span
          class="w-2.5 h-2.5 rounded-full"
          :class="estaVivo ? 'bg-green-500' : 'bg-amber-500'"
        ></span>
        <span class="text-xs text-surface-500">
          {{ estaVivo ? "Conexión en vivo" : "Reconectando…" }}
        </span>
      </div> -->

      <TurnoCard
        :turno="turno"
        :loading="turnoLoading"
        :acciones-labels="accionesLabels"
        :confirm-messages="confirmMessages"
        @action="ejecutarAccion"
      />

      <BuscadorPatenteCard compact />

      <!-- Stats grid -->
      <div class="grid grid-cols-2 gap-3">
        <TarjetaAccesosActivos
          :conteo-inicial="dashboard.accesos?.activosAhora ?? 0"
          @click="router.push({ name: 'Visitas' })"
        />
        <TarjetaEncomiendasPendientes
          :conteo-inicial="dashboard.encomiendas || 0"
          @click="router.push({ name: 'Encomiendas' })"
        />
        <Card>
          <template #content>
            <div class="text-center">
              <p
                class="text-3xl font-bold m-0"
                style="color: var(--p-primary-400)"
              >
                {{ dashboard.totalUnidades || 0 }}
              </p>
              <p class="text-xs text-surface-500 m-0 mt-1">Unidades</p>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="text-center">
              <p
                class="text-3xl font-bold m-0"
                style="color: var(--p-primary-400)"
              >
                {{ dashboard.residentesActivos || 0 }}
              </p>
              <p class="text-xs text-surface-500 m-0 mt-1">Residentes</p>
            </div>
          </template>
        </Card>
      </div>

      <!-- Últimos movimientos -->
      <Card
        v-if="dashboard.accesos?.ultimosMovimientos?.length"
        class="cursor-pointer hover:surface-hover transition-shadow"
        @click="router.push({ name: 'Visitas' })"
      >
        <template #title>Últimos accesos</template>
        <template #content>
          <div class="flex flex-col gap-2">
            <div
              v-for="(mov, idx) in dashboard.accesos.ultimosMovimientos.slice(
                0,
                5,
              )"
              :key="idx"
              class="flex items-center justify-between p-2 border-round hover:bg-emphasis"
            >
              <div class="flex items-center gap-3">
                <i class="pi pi-arrow-right text-green-500"></i>
                <div>
                  <p class="text-sm font-medium m-0">{{ mov.nombre }}</p>
                  <p class="text-xs text-surface-500 m-0">
                    Casa {{ mov.unidad }} · {{ formatearFecha(mov.fecha) }}
                  </p>
                </div>
              </div>
              <span class="text-xs text-surface-400">{{ mov.tipo }}</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Autorizaciones pendientes -->
      <Card
        v-if="autorizaciones.length > 0"
        class="cursor-pointer hover:surface-hover transition-shadow"
        @click="router.push({ name: 'Autorizaciones' })"
      >
        <template #title>
          <div class="flex items-center justify-between">
            <span>Autorizaciones pendientes</span>
            <Badge :value="autorizaciones.length" severity="warn" />
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-2">
            <div
              v-for="auth in autorizaciones.slice(0, 4)"
              :key="auth.id"
              class="flex items-center justify-between p-2 border-round hover:bg-emphasis"
            >
              <div class="flex items-center gap-3">
                <i
                  class="pi pi-verified text-lg"
                  style="color: var(--p-primary-400)"
                ></i>
                <div>
                  <p class="text-sm font-medium m-0">{{ auth.nombre }}</p>
                  <p class="text-xs text-surface-500 m-0">
                    Casa {{ auth.unidadNumero }} · {{ auth.tipo }}
                  </p>
                </div>
              </div>
              <span class="text-xs text-surface-400">
                {{ formatearHora(auth.fechaInicio) }}
              </span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Acceso rápido 
          comentado hasta saber si se usara-->
      <!-- <AccesoRapidoCard :items="ACCESO_RAPIDO_GUARDIA" /> -->

      <NovedadDialog
        v-model:visible="showNovedadDialog"
        :loading="enviandoNovedad"
        @register="registrarNovedad"
      />
      <ChecklistDialog
        v-model:visible="checklistDialogVisible"
        :items="checklistItems"
        :loading="turnoLoading || checklistLoading"
        :action-label="accionesLabels[checklistTipo]?.label || 'acción'"
        @confirm="confirmarConChecklist"
        @update:visible="cancelarChecklist"
      />
    </template>
  </div>
</template>
