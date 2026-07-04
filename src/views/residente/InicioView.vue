<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authStore";
import { perfilService } from "../../services/perfilService";
import { encomiendasService } from "../../services/encomiendasService";
import { autorizacionesService } from "../../services/autorizacionesService";

import Card from "primevue/card";
import Avatar from "primevue/avatar";
import Tag from "primevue/tag";
import Badge from "primevue/badge";
import Button from "primevue/button";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Divider from "primevue/divider";

const router = useRouter();
const auth = useAuthStore();
const dashboard = ref(null);
const encomiendas = ref([]);
const autorizaciones = ref([]);
const notifCount = ref(0);
const loading = ref(true);
const error = ref(null);
const unidadExpandida = ref(null);

const totalDeuda = computed(() => {
  if (!dashboard.value?.unidades) return 0;
  return dashboard.value.unidades.reduce((sum, u) => {
    if (u.gastoActual && u.gastoActual.estadoPago !== "PAGADO") {
      return sum + u.gastoActual.monto;
    }
    return sum;
  }, 0);
});

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

function severityEncomienda(estado) {
  if (estado === "ENTREGADA") return "info";
  if (estado === "CERRADA") return "contrast";
  return "warn";
}

function toggleUnidad(id) {
  unidadExpandida.value = unidadExpandida.value === id ? null : id;
}

onMounted(async () => {
  const cid = auth.condominioActualId;
  if (!cid) {
    error.value = "Selecciona un condominio primero";
    loading.value = false;
    return;
  }
  try {
    const [resDash, resBadge, resEnv, resAut] = await Promise.all([
      perfilService.getDashboardResidente(cid),
      perfilService.getBadgeNotificaciones(cid),
      encomiendasService.getMisEncomiendas(cid),
      autorizacionesService.misAutorizaciones(cid),
    ]);
    dashboard.value = resDash.data;
    notifCount.value = resBadge.data.noLeidas;
    encomiendas.value = (resEnv.data || []).filter(
      (e) => e.estado === "PENDIENTE",
    );
    autorizaciones.value = resAut.data || [];
  } catch (e) {
    console.error("Error al cargar dashboard residente", e);
    error.value = "Error al cargar el dashboard";
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
      <Card>
        <template #content>
          <div class="flex items-center gap-4">
            <Skeleton shape="circle" size="4rem" />
            <div class="flex flex-col gap-2 flex-1">
              <Skeleton width="60%" height="1.2rem" />
              <Skeleton width="40%" height="0.9rem" />
            </div>
          </div>
        </template>
      </Card>
      <Card><template #content><Skeleton width="100%" height="6rem" /></template></Card>
      <Card><template #content><Skeleton width="100%" height="6rem" /></template></Card>
    </template>

    <template v-else-if="dashboard">
      <!-- Card 1: Mi hogar (accordion) -->
      <Card>
        <template #content>
          <div
            v-for="(unidad, idx) in dashboard.unidades"
            :key="unidad.id"
            class="flex flex-col"
          >
            <div
              class="flex items-center gap-3 py-2 cursor-pointer select-none hover:bg-emphasis px-2 -mx-2 border-round"
              :class="{ 'border-b border-surface-200': unidadExpandida === unidad.id }"
              @click="toggleUnidad(unidad.id)"
            >
              <i
                class="pi text-lg"
                :class="unidad.tipo === 'ESTACIONAMIENTO' ? 'pi-map-marker' : 'pi-home'"
                style="color: var(--p-primary-400)"
              ></i>
              <div class="flex-1">
                <span class="font-semibold">
                  {{ tipoUnidad(unidad.tipo) }} {{ unidad.numero }}
                </span>
                <span class="text-xs text-surface-400 ml-2">
                  · {{ unidad.personas?.length || 0 }} residentes
                  · {{ unidad.vehiculos?.length || 0 }} vehículos
                </span>
              </div>
              <i
                class="pi pi-chevron-down text-surface-400 transition-transform"
                :class="{ 'rotate-180': unidadExpandida === unidad.id }"
              ></i>
            </div>

            <!-- Expandido: info de la unidad -->
            <div v-show="unidadExpandida === unidad.id" class="flex flex-col gap-4 px-2 pb-3 pt-3">
              <!-- Convivientes -->
              <div>
                <p class="text-xs font-semibold text-surface-500 uppercase mb-2 flex items-center gap-2">
                  <i class="pi pi-users"></i>
                  <span>Convivientes</span>
                </p>
                <div
                  v-if="!unidad.personas?.length"
                  class="text-sm text-surface-400"
                >
                  Sin convivientes registrados
                </div>
                <div
                  v-for="p in unidad.personas"
                  :key="p.id"
                  class="flex items-center justify-between py-1"
                >
                  <div class="flex items-center gap-2">
                    <Avatar
                      :label="p.nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)"
                      size="small"
                      shape="circle"
                      class="font-bold"
                      style="background: var(--p-primary-400); color: #fff; font-size: 0.65rem"
                    />
                    <span class="text-sm">{{ p.nombre }}</span>
                  </div>
                  <Tag
                    :value="tipoVinculo(p.tipo)"
                    severity="info"
                    class="text-xs"
                  />
                </div>
              </div>

              <Divider class="my-1" />

              <!-- Vehículos -->
              <div>
                <p class="text-xs font-semibold text-surface-500 uppercase mb-2 flex items-center gap-2">
                  <i class="pi pi-car"></i>
                  <span>Vehículos</span>
                </p>
                <div
                  v-if="!unidad.vehiculos?.length"
                  class="text-sm text-surface-400"
                >
                  Sin vehículos registrados
                </div>
                <div
                  v-for="v in unidad.vehiculos"
                  :key="v.id"
                  class="flex items-center justify-between py-1"
                >
                  <div class="flex items-center gap-2">
                    <i
                      class="pi pi-car"
                      :class="v.activo ? 'text-primary' : 'text-surface-300'"
                    ></i>
                    <span class="text-sm font-mono">{{ v.patente }}</span>
                  </div>
                  <Tag
                    :value="v.activo ? 'Activo' : 'Inactivo'"
                    :severity="v.activo ? 'success' : 'contrast'"
                    class="text-xs"
                  />
                </div>
              </div>
            </div>

            <Divider
              v-if="idx < dashboard.unidades.length - 1"
              class="my-1"
            />
          </div>
        </template>
      </Card>

      <!-- Card 3: Mis Deudas -->
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span>Mis Deudas</span>
            <Tag
              v-if="totalDeuda > 0"
              :value="formatMonto(totalDeuda)"
              severity="danger"
            />
          </div>
        </template>
        <template #content>
          <div
            v-for="(unidad, idx) in dashboard.unidades"
            :key="unidad.id"
          >
            <div v-if="unidad.gastoActual" class="flex items-center justify-between p-2 border-round"
              :class="{
                'bg-red-50 border-1 border-red-200': unidad.gastoActual.estadoPago === 'VENCIDO',
                'bg-emphasis': unidad.gastoActual.estadoPago !== 'VENCIDO',
              }"
            >
              <div class="flex flex-col">
                <div class="flex items-center gap-2">
                  <i
                    class="pi text-sm"
                    :class="unidad.tipo === 'ESTACIONAMIENTO' ? 'pi-map-marker' : 'pi-home'"
                  ></i>
                  <span class="text-sm font-medium">
                    {{ tipoUnidad(unidad.tipo) }} {{ unidad.numero }}
                  </span>
                </div>
                <span class="text-xs text-surface-500 ml-5">
                  GC {{ unidad.gastoActual.periodo }} · Vence: {{ unidad.gastoActual.fechaVencimiento }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm">{{ formatMonto(unidad.gastoActual.monto) }}</span>
                <Tag
                  :value="labelDeuda(unidad.gastoActual.estadoPago)"
                  :severity="severityDeuda(unidad.gastoActual.estadoPago)"
                />
              </div>
            </div>

            <Divider
              v-if="unidad.gastoActual && idx < dashboard.unidades.length - 1"
              class="my-1"
            />
          </div>

          <div
            v-if="!dashboard.unidades.some(u => u.gastoActual)"
            class="text-sm text-surface-400 py-2 italic"
          >
            Sin deudas pendientes
          </div>
        </template>
      </Card>

      <!-- Card 4: Autorizaciones activas -->
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span>Autorizaciones activas</span>
            <Badge
              v-if="autorizaciones.length > 0"
              :value="autorizaciones.length"
              severity="warn"
            />
          </div>
        </template>
        <template #content>
          <div v-if="autorizaciones.length === 0" class="text-sm text-surface-400 py-2">
            No tienes autorizaciones activas
          </div>
          <div
            v-for="(a, idx) in autorizaciones.slice(0, 4)"
            :key="a.id"
            class="flex items-center justify-between py-2"
            :class="{ 'border-t border-surface-200': idx > 0 }"
          >
            <div class="flex items-center gap-3">
              <i class="pi pi-verified text-primary"></i>
              <div class="flex flex-col">
                <span class="text-sm font-medium">{{ a.nombre }}</span>
                <span class="text-xs text-surface-500">
                  {{ a.tipo }} · Casa {{ a.unidadNumero }}
                </span>
              </div>
            </div>
            <Tag :value="a.estado" severity="warn" />
          </div>
          <div v-if="autorizaciones.length > 4" class="mt-2">
            <Button
              label="Ver todas"
              icon="pi pi-arrow-right"
              size="small"
              variant="text"
              @click="router.push({ name: 'MisAutorizaciones' })"
            />
          </div>
          <div v-else-if="autorizaciones.length > 0" class="mt-2">
            <Button
              label="Administrar"
              icon="pi pi-arrow-right"
              size="small"
              variant="text"
              @click="router.push({ name: 'MisAutorizaciones' })"
            />
          </div>
        </template>
      </Card>

      <!-- Card 5: Encomiendas -->
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span>Encomiendas</span>
            <Badge
              v-if="encomiendas.length > 0"
              :value="encomiendas.length"
              severity="warn"
            />
          </div>
        </template>
        <template #content>
          <div v-if="encomiendas.length === 0" class="text-sm text-surface-400 py-2">
            No tienes encomiendas pendientes
          </div>
          <div
            v-for="(env, idx) in encomiendas"
            :key="env.id"
            class="flex items-center justify-between py-2 cursor-pointer hover:bg-emphasis px-2 -mx-2 border-round"
            :class="{ 'border-t border-surface-200': idx > 0 }"
            @click="router.push({ name: 'MisEncomiendas' })"
          >
            <div class="flex items-center gap-3">
              <i class="pi pi-inbox text-xl text-primary"></i>
              <div class="flex flex-col">
                <span class="text-sm font-medium">{{ env.tipo }} · {{ env.nombreDestinatario }}</span>
                <span class="text-xs text-surface-500">
                  Casa {{ env.unidadNumero }} · {{ new Date(env.creadoEn).toLocaleDateString("es-CL") }}
                </span>
              </div>
            </div>
            <Tag
              :value="env.estado === 'PENDIENTE' ? 'Pendiente' : env.estado"
              :severity="severityEncomienda(env.estado)"
            />
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>
