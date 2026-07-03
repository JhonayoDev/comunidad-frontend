<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authStore";
import { perfilService } from "../../services/perfilService";
import { encomiendasService } from "../../services/encomiendasService";

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
const notifCount = ref(0);
const loading = ref(true);
const error = ref(null);

const iniciales = computed(() => {
  const nombre = dashboard.value?.nombre || auth.userName;
  return nombre
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
});

const totalDeuda = computed(() => {
  if (!dashboard.value?.unidades) return 0;
  return dashboard.value.unidades.reduce((sum, u) => {
    if (u.gastoActual && u.gastoActual.estadoPago !== "PAGADO") {
      return sum + u.gastoActual.monto;
    }
    return sum;
  }, 0);
});

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

onMounted(async () => {
  const cid = auth.condominioActualId;
  if (!cid) {
    error.value = "Selecciona un condominio primero";
    loading.value = false;
    return;
  }
  try {
    const [resDash, resBadge, resEnv] = await Promise.all([
      perfilService.getDashboardResidente(cid),
      perfilService.getBadgeNotificaciones(cid),
      encomiendasService.getMisEncomiendas(),
    ]);
    dashboard.value = resDash.data;
    notifCount.value = resBadge.data.noLeidas;
    encomiendas.value = (resEnv.data || []).filter(
      (e) => e.estado === "PENDIENTE",
    );
  } catch {
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
      <Card><template #content><Skeleton width="100%" height="8rem" /></template></Card>
      <Card><template #content><Skeleton width="100%" height="6rem" /></template></Card>
    </template>

    <template v-else-if="dashboard">
      <!-- Card 1: Información del propietario -->
      <Card>
        <template #content>
          <div class="flex items-center gap-4">
            <Avatar
              :label="iniciales"
              size="xlarge"
              shape="circle"
              class="font-bold"
              style="background: var(--p-primary-400); color: #fff"
            />
            <div class="flex flex-col gap-1">
              <h2 class="text-xl font-bold m-0">
                {{ dashboard.nombre || auth.userName }}
              </h2>
              <p class="text-sm m-0 text-surface-500">
                {{ dashboard.email || auth.user?.email }}
              </p>
              <div class="flex gap-2 mt-1">
                <Tag :value="auth.userRole" severity="info" />
                <Button
                  label="Mi perfil"
                  icon="pi pi-user"
                  size="small"
                  variant="text"
                  @click="router.push({ name: 'Perfil' })"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Card 2: Deudas -->
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
            v-for="unidad in dashboard.unidades"
            :key="unidad.id"
            class="flex flex-col gap-2"
          >
            <div class="flex items-center gap-2">
              <i
                class="pi"
                :class="unidad.tipo === 'ESTACIONAMIENTO' ? 'pi-map-marker' : 'pi-home'"
                style="font-size: 1.2rem"
              ></i>
              <span class="font-semibold">
                {{ unidad.tipo === "ESTACIONAMIENTO" ? "Estacionamiento" : "Casa" }}
                {{ unidad.numero }}
              </span>
            </div>

            <div v-if="unidad.gastoActual" class="ml-6">
              <div
                class="flex items-center justify-between p-2 border-round"
                :class="{
                  'bg-emphasis': unidad.gastoActual.estadoPago !== 'VENCIDO',
                  'bg-red-50': unidad.gastoActual.estadoPago === 'VENCIDO',
                  'border-1 border-red-200': unidad.gastoActual.estadoPago === 'VENCIDO',
                }"
              >
                <div class="flex flex-col">
                  <span class="text-sm font-medium">
                    GC {{ unidad.gastoActual.periodo }}
                  </span>
                  <span class="text-xs text-surface-500">
                    Vence: {{ unidad.gastoActual.fechaVencimiento }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm">
                    {{ formatMonto(unidad.gastoActual.monto) }}
                  </span>
                  <Tag
                    :value="labelDeuda(unidad.gastoActual.estadoPago)"
                    :severity="severityDeuda(unidad.gastoActual.estadoPago)"
                  />
                </div>
              </div>
            </div>

            <div
              v-else
              class="ml-6 p-2 text-sm text-surface-400 italic"
            >
              Sin gasto común activo
            </div>

            <Divider v-if="unidad !== dashboard.unidades[dashboard.unidades.length - 1]" class="my-1" />
          </div>
        </template>
      </Card>

      <!-- Card 3: Encomiendas -->
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
          <div v-if="encomiendas.length === 0" class="flex flex-column align-items-center gap-2 py-3">
            <i class="pi pi-box text-4xl text-surface-300"></i>
            <p class="text-sm text-surface-400 m-0">No tienes encomiendas pendientes</p>
          </div>
          <div
            v-for="env in encomiendas"
            :key="env.id"
            class="flex items-center justify-between p-2 border-round hover:bg-emphasis cursor-pointer"
            @click="router.push({ name: 'MisEncomiendas' })"
          >
            <div class="flex items-center gap-3">
              <i class="pi pi-inbox text-xl text-primary"></i>
              <div class="flex flex-col">
                <span class="text-sm font-medium">{{ env.descripcion }}</span>
                <span class="text-xs text-surface-500">
                  Casa {{ env.unidadNumero }} · {{ new Date(env.fechaIngreso || env.fechaRecepcion).toLocaleDateString("es-CL") }}
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

      <!-- Notificaciones y Acciones rápidas -->
      <Card>
        <template #title>Acceso rápido</template>
        <template #content>
          <div class="flex flex-col gap-2">
            <Button
              label="Notificaciones"
              icon="pi pi-bell"
              severity="secondary"
              variant="text"
              class="w-full justify-content-start"
              @click="router.push({ name: 'Notificaciones' })"
            >
              <Badge
                v-if="notifCount > 0"
                :value="notifCount"
                severity="danger"
                class="ml-auto"
              />
            </Button>
            <Button
              label="Mis Encomiendas"
              icon="pi pi-box"
              severity="secondary"
              variant="text"
              class="w-full justify-content-start"
              @click="router.push({ name: 'MisEncomiendas' })"
            />
            <Button
              label="Mi Perfil"
              icon="pi pi-user"
              severity="secondary"
              variant="text"
              class="w-full justify-content-start"
              @click="router.push({ name: 'Perfil' })"
            />
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>
