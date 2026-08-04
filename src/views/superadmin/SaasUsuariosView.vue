<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { adminService } from "@/services/adminService";
import { mensajeError } from "@/utils/errores";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Select from "primevue/select";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Paginator from "primevue/paginator";
import Dialog from "primevue/dialog";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref(null);
const usuarios = ref([]);
const total = ref(0);
const page = ref(0);
const size = ref(20);
const filtroActivo = ref(null);

const showRol = ref(false);
const usuarioRol = ref(null);
const rolSeleccionado = ref(null);
const enviando = ref(false);

const rolesDisponibles = [
  { label: "ADMINISTRADOR", value: "ADMINISTRADOR" },
  { label: "GUARDIA", value: "GUARDIA" },
  { label: "RESIDENTE", value: "RESIDENTE" },
];

async function cargar() {
  const cid = route.params.id;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const params = { page: page.value, size: size.value };
    if (filtroActivo.value !== null) params.activo = filtroActivo.value;
    const { data } = await adminService.listarUsuarios(cid, params);
    usuarios.value = data.content || [];
    total.value = data.totalElements || 0;
  } catch (e) {
    console.error("Error al cargar usuarios", e);
    error.value = "No se pudieron cargar los usuarios";
  } finally {
    loading.value = false;
  }
}

async function toggleActivo(u) {
  const cid = route.params.id;
  try {
    if (u.activo) {
      await adminService.desactivarUsuario(cid, u.usuarioId);
    } else {
      await adminService.activarUsuario(cid, u.usuarioId);
    }
    await cargar();
  } catch (e) {
    console.error("Error al cambiar estado", e);
    error.value = mensajeError(e, "Error al cambiar estado");
  }
}

function abrirAsignarRol(u) {
  usuarioRol.value = u;
  rolSeleccionado.value = null;
  showRol.value = true;
}

async function asignarRol() {
  if (!rolSeleccionado.value) return;
  const cid = route.params.id;
  enviando.value = true;
  try {
    await adminService.asignarRol(cid, usuarioRol.value.usuarioId, rolSeleccionado.value);
    showRol.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al asignar rol", e);
    error.value = mensajeError(e, "Error al asignar rol");
  } finally {
    enviando.value = false;
  }
}

async function revocarRol(u, rol) {
  const cid = route.params.id;
  try {
    await adminService.revocarRol(cid, u.usuarioId, rol);
    await cargar();
  } catch (e) {
    console.error("Error al revocar rol", e);
  }
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Button label="← Volver" size="small" variant="text" icon="pi pi-arrow-left" @click="router.push({ name: 'SaasCondominioDetail', params: { id: route.params.id } })" />
    <h1 class="text-xl font-bold m-0">Usuarios del condominio</h1>

    <div class="flex gap-2">
      <Select
        v-model="filtroActivo"
        :options="[{ label: 'Todos', value: null }, { label: 'Activos', value: true }, { label: 'Inactivos', value: false }]"
        optionLabel="label"
        optionValue="value"
        placeholder="Estado"
        class="w-36"
        size="small"
        @change="cargar"
      />
    </div>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!usuarios.length" class="text-center text-surface-400 py-8">No hay usuarios</div>
      <div v-else class="flex flex-col gap-2">
        <Card v-for="u in usuarios" :key="u.usuarioId">
          <template #content>
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm">{{ u.nombre }}</span>
                  <Tag :value="u.activo ? 'Activo' : 'Inactivo'" :severity="u.activo ? 'success' : 'danger'" size="small" />
                </div>
                <div class="text-xs text-surface-500">{{ u.email }}</div>
                <div class="flex flex-wrap gap-1 mt-1">
                  <Tag v-for="r in u.roles" :key="r" :value="r" size="small" severity="info" removable @remove="revocarRol(u, r)" />
                </div>
              </div>
              <div class="flex gap-1 shrink-0">
                <Button label="Rol" size="small" severity="secondary" variant="outlined" @click="abrirAsignarRol(u)" />
                <Button
                  :label="u.activo ? 'Desactivar' : 'Activar'"
                  size="small"
                  :severity="u.activo ? 'danger' : 'success'"
                  variant="outlined"
                  @click="toggleActivo(u)"
                />
              </div>
            </div>
          </template>
        </Card>
        <Paginator :rows="size" :totalRecords="total" :first="page * size" @page="page = $event.page; cargar()" />
      </div>
    </template>

    <Dialog v-model:visible="showRol" header="Asignar rol" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <p class="text-sm m-0">Asignar rol a <strong>{{ usuarioRol?.nombre }}</strong></p>
        <Select v-model="rolSeleccionado" :options="rolesDisponibles" optionLabel="label" optionValue="value" placeholder="Seleccionar rol" class="w-full" />
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showRol = false" />
        <Button label="Asignar" :loading="enviando" :disabled="!rolSeleccionado" @click="asignarRol" />
      </template>
    </Dialog>
  </div>
</template>
