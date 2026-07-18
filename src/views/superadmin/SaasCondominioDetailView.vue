<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { adminService } from "@/services/adminService";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const loading = ref(true);
const error = ref(null);
const condominio = ref(null);

const showSuspender = ref(false);
const showEditar = ref(false);
const enviando = ref(false);
const motivoSuspension = ref("");
const editForm = ref({ nombre: "", direccion: "", responsableNombre: "", responsableEmail: "", responsableTelefono: "" });

const statusSeverity = { PENDIENTE: "warn", PAGADO: "success", ATRASADO: "danger", SUSPENDIDO: "danger" };
const onboardingSeverity = { PENDIENTE: "danger", CONFIGURANDO: "warn", COMPLETADO: "success", SALTADO: "info" };

async function cargar() {
  const id = route.params.id;
  if (!id) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await adminService.obtenerCondominio(id);
    condominio.value = data;
    editForm.value = {
      nombre: data.nombre || "",
      direccion: data.direccion || "",
      responsableNombre: data.responsableNombre || "",
      responsableEmail: data.responsableEmail || "",
      responsableTelefono: data.responsableTelefono || "",
    };
  } catch (e) {
    console.error("Error al cargar condominio", e);
    error.value = "No se pudo cargar el detalle del condominio";
  } finally {
    loading.value = false;
  }
}

async function suspender() {
  enviando.value = true;
  try {
    const { data } = await adminService.suspenderCondominio(route.params.id, { motivo: motivoSuspension.value });
    condominio.value = data;
    showSuspender.value = false;
  } catch (e) {
    console.error("Error al suspender", e);
  } finally {
    enviando.value = false;
  }
}

async function reactivar() {
  enviando.value = true;
  try {
    const { data } = await adminService.reactivarCondominio(route.params.id);
    condominio.value = data;
  } catch (e) {
    console.error("Error al reactivar", e);
  } finally {
    enviando.value = false;
  }
}

async function guardarEdicion() {
  enviando.value = true;
  try {
    const { data } = await adminService.actualizarCondominio(route.params.id, editForm.value);
    condominio.value = data;
    showEditar.value = false;
  } catch (e) {
    console.error("Error al actualizar", e);
  } finally {
    enviando.value = false;
  }
}

function irA(ruta) {
  router.push({ name: ruta, params: { id: route.params.id } });
}

function entrarACondominio() {
  auth.seleccionarCondominio(route.params.id);
  router.push({ name: "Dashboard" });
}

function formatoCLP(n) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(n || 0);
}

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Button label="← Volver" size="small" variant="text" icon="pi pi-arrow-left" @click="router.push({ name: 'SuperAdminDashboard' })" />

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else-if="condominio">
      <Card>
        <template #title>
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span>{{ condominio.nombre }}</span>
              <Tag :value="condominio.statusPago" :severity="statusSeverity[condominio.statusPago] || 'info'" size="small" />
            </div>
            <div class="flex gap-1">
              <Button label="Entrar" size="small" icon="pi pi-arrow-right" @click="entrarACondominio" />
              <Button label="Editar" size="small" icon="pi pi-pencil" severity="secondary" variant="outlined" @click="showEditar = true" />
              <Button
                v-if="condominio.statusPago !== 'SUSPENDIDO'"
                label="Suspender"
                size="small"
                icon="pi pi-ban"
                severity="danger"
                variant="outlined"
                @click="showSuspender = true"
              />
              <Button
                v-else
                label="Reactivar"
                size="small"
                icon="pi pi-check"
                severity="success"
                variant="outlined"
                :loading="enviando"
                @click="reactivar"
              />
            </div>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div class="text-sm">
              <span class="text-surface-400">RUT:</span> {{ condominio.rut || "—" }}
            </div>
            <div class="text-sm">
              <span class="text-surface-400">Dirección:</span> {{ condominio.direccion || "—" }}
            </div>
            <div class="text-sm">
              <span class="text-surface-400">Plan:</span> <strong>{{ condominio.planNombre }}</strong>
            </div>
            <div class="text-sm">
              <span class="text-surface-400">Creado:</span> {{ formatFecha(condominio.createdAt) }}
            </div>
            <div class="text-sm">
              <span class="text-surface-400">Vence:</span> {{ formatFecha(condominio.fechaVencimiento) }}
            </div>
            <div class="text-sm">
              <span class="text-surface-400">Onboarding:</span>
              <Tag :value="condominio.onboardingStatus" :severity="onboardingSeverity[condominio.onboardingStatus] || 'info'" size="small" />
            </div>
            <div class="text-sm">
              <span class="text-surface-400">Responsable:</span> {{ condominio.responsableNombre || "—" }}
            </div>
            <div class="text-sm">
              <span class="text-surface-400">Email:</span> {{ condominio.responsableEmail || "—" }}
            </div>
            <div class="text-sm">
              <span class="text-surface-400">Teléfono:</span> {{ condominio.responsableTelefono || "—" }}
            </div>
            <div class="text-sm">
              <span class="text-surface-400">Unidades:</span> {{ condominio.totalUnidades }}
            </div>
            <div class="text-sm">
              <span class="text-surface-400">Usuarios activos:</span> {{ condominio.totalUsuariosActivos }}
            </div>
            <div class="text-sm">
              <span class="text-surface-400">Storage:</span> {{ (condominio.storageUsadoMb / 1024).toFixed(1) }}/{{ (condominio.storageLimitMb / 1024).toFixed(1) }} GB
            </div>
          </div>
        </template>
      </Card>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card class="cursor-pointer hover:shadow-3" @click="irA('SaasUsuarios')">
          <template #content class="flex flex-col items-center gap-1 p-3">
            <i class="pi pi-users text-2xl text-primary"></i>
            <span class="text-sm font-medium">Usuarios</span>
            <span class="text-xs text-surface-400">Gestionar usuarios y roles</span>
          </template>
        </Card>
        <Card class="cursor-pointer hover:shadow-3" @click="irA('SaasSuscripcion')">
          <template #content class="flex flex-col items-center gap-1 p-3">
            <i class="pi pi-credit-card text-2xl text-primary"></i>
            <span class="text-sm font-medium">Suscripción</span>
            <span class="text-xs text-surface-400">Plan, pagos, historial</span>
          </template>
        </Card>
        <Card class="cursor-pointer hover:shadow-3" @click="irA('SaasOnboarding')">
          <template #content class="flex flex-col items-center gap-1 p-3">
            <i class="pi pi-check-circle text-2xl text-primary"></i>
            <span class="text-sm font-medium">Onboarding</span>
            <span class="text-xs text-surface-400">Tareas pendientes</span>
          </template>
        </Card>
        <Card class="cursor-pointer hover:shadow-3" @click="irA('SaasModulos')">
          <template #content class="flex flex-col items-center gap-1 p-3">
            <i class="pi pi-th-large text-2xl text-primary"></i>
            <span class="text-sm font-medium">Módulos</span>
            <span class="text-xs text-surface-400">Activar/desactivar</span>
          </template>
        </Card>
      </div>
    </template>

    <Dialog v-model:visible="showEditar" header="Editar condominio" modal :style="{ width: '95%', maxWidth: '500px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Nombre</label>
          <InputText v-model="editForm.nombre" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Dirección</label>
          <InputText v-model="editForm.direccion" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Responsable</label>
          <InputText v-model="editForm.responsableNombre" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Email responsable</label>
          <InputText v-model="editForm.responsableEmail" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Teléfono responsable</label>
          <InputText v-model="editForm.responsableTelefono" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showEditar = false" />
        <Button label="Guardar" :loading="enviando" @click="guardarEdicion" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showSuspender" header="Suspender condominio" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <p class="text-sm m-0">¿Estás seguro de suspender <strong>{{ condominio?.nombre }}</strong>?</p>
        <p class="text-xs text-surface-500">Esto bloqueará el acceso a todos los usuarios del condominio.</p>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Motivo</label>
          <Textarea v-model="motivoSuspension" rows="2" placeholder="Indica el motivo de la suspensión" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showSuspender = false" />
        <Button label="Suspender" severity="danger" :loading="enviando" @click="suspender" />
      </template>
    </Dialog>
  </div>
</template>
