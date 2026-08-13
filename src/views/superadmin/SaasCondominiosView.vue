<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { adminService } from "@/services/adminService";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Paginator from "primevue/paginator";

const router = useRouter();
const auth = useAuthStore();

const loading = ref(true);
const error = ref(null);
const condominios = ref([]);
const total = ref(0);
const page = ref(0);
const size = ref(20);
const planes = ref([]);

const filtros = ref({ nombre: "", statusPago: null, onboardingStatus: null, planId: null });

const busquedaVisible = ref(false);

function toggleBusqueda() {
  busquedaVisible.value = !busquedaVisible.value;
  if (!busquedaVisible.value) {
    filtros.value = { nombre: "", statusPago: null, onboardingStatus: null, planId: null };
    buscar();
  }
}

const statusOptions = [
  { label: "Pendiente", value: "PENDIENTE" },
  { label: "Pagado", value: "PAGADO" },
  { label: "Atrasado", value: "ATRASADO" },
  { label: "Suspendido", value: "SUSPENDIDO" },
];

const onboardingOptions = [
  { label: "Pendiente", value: "PENDIENTE" },
  { label: "Configurando", value: "CONFIGURANDO" },
  { label: "Completado", value: "COMPLETADO" },
  { label: "Saltado", value: "SALTADO" },
];

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
    const params = { page: page.value, size: size.value };
    if (filtros.value.nombre.trim()) params.nombre = filtros.value.nombre.trim();
    if (filtros.value.statusPago) params.statusPago = filtros.value.statusPago;
    if (filtros.value.onboardingStatus) params.onboardingStatus = filtros.value.onboardingStatus;
    if (filtros.value.planId) params.planId = filtros.value.planId;
    const { data } = await adminService.listarCondominios(params);
    condominios.value = data.content || [];
    total.value = data.totalElements || 0;
  } catch (e) {
    console.error("Error al cargar condominios", e);
    error.value = "No se pudieron cargar los condominios";
  } finally {
    loading.value = false;
  }
}

async function cargarPlanes() {
  try {
    const { data } = await adminService.listarPlanes();
    planes.value = (data || []).filter((p) => p.activo).map((p) => ({ label: p.nombre, value: p.id }));
  } catch (e) {
    console.error("Error al cargar planes", e);
  }
}

function buscar() {
  page.value = 0;
  cargar();
}

function limpiarFiltros() {
  filtros.value = { nombre: "", statusPago: null, onboardingStatus: null, planId: null };
  buscar();
}

function irA(ruta, params) {
  router.push({ name: ruta, params });
}

function entrarACondominio(id) {
  auth.seleccionarCondominio(id);
  router.push({ name: "Dashboard" });
}

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

onMounted(() => {
  cargar();
  cargarPlanes();
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Condominios</h1>
      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-search"
          size="small"
          :severity="busquedaVisible ? 'primary' : 'secondary'"
          variant="outlined"
          class="rounded-lg shrink-0"
          aria-label="Buscar"
          :aria-pressed="busquedaVisible"
          @click="toggleBusqueda"
        />
        <Button label="Nuevo" icon="pi pi-plus" size="small" @click="irA('SaasCrearCondominio')" />
      </div>
    </div>

    <Card v-if="busquedaVisible">
      <template #content>
        <div class="flex flex-wrap gap-2 items-end">
          <div class="flex flex-col gap-1 min-w-40 flex-1">
            <label class="text-xs text-surface-500">Buscar</label>
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="filtros.nombre"
                placeholder="Nombre o responsable..."
                class="w-full"
                size="small"
                @keyup.enter="buscar"
              />
            </IconField>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Estado pago</label>
            <Select
              v-model="filtros.statusPago"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="Todos"
              show-clear
              size="small"
              class="w-36"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Onboarding</label>
            <Select
              v-model="filtros.onboardingStatus"
              :options="onboardingOptions"
              option-label="label"
              option-value="value"
              placeholder="Todos"
              show-clear
              size="small"
              class="w-36"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Plan</label>
            <Select
              v-model="filtros.planId"
              :options="planes"
              option-label="label"
              option-value="value"
              placeholder="Todos"
              show-clear
              size="small"
              class="w-36"
            />
          </div>
          <Button label="Buscar" icon="pi pi-search" size="small" severity="secondary" @click="buscar" />
          <Button label="Limpiar" size="small" variant="text" @click="limpiarFiltros" />
        </div>
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!condominios.length" class="text-center text-surface-400 py-8">
        No hay condominios con esos filtros
      </div>
      <div v-else class="flex flex-col gap-2">
        <Card
          v-for="c in condominios"
          :key="c.id"
          class="cursor-pointer hover:shadow-3 transition-shadow"
          @click="irA('SaasCondominioDetail', { id: c.id })"
        >
          <template #content>
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-sm">{{ c.nombre }}</span>
                  <Tag :value="c.statusPago" :severity="statusSeverity[c.statusPago] || 'info'" size="small" />
                  <Tag :value="c.onboardingStatus" :severity="onboardingSeverity[c.onboardingStatus] || 'info'" size="small" />
                </div>
                <div class="text-xs text-surface-500 mt-1">
                  {{ c.planNombre }} — {{ c.responsableNombre }}
                </div>
                <div class="text-xs text-surface-400">
                  {{ c.totalUnidades }} unid. · {{ c.totalUsuariosActivos }} usu. · {{ (c.storageUsadoMb / 1024).toFixed(1) }}/{{ (c.storageLimitMb / 1024).toFixed(1) }} GB · vence {{ formatFecha(c.fechaVencimiento) }}
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
        <Paginator :rows="size" :totalRecords="total" :first="page * size" @page="page = $event.page; cargar()" />
      </div>
    </template>
  </div>
</template>