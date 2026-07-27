<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { usePersonal } from "@/composables/usePersonal";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Tag from "primevue/tag";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const auth = useAuthStore();
const confirm = useConfirm();
const { personal, loading, error, asignarRol, revocar } = usePersonal();

const mostrarDialog = ref(false);
const editando = ref(null);
const usuarioId = ref(null);
const rolId = ref(null);
const enviando = ref(false);
const errorForm = ref("");

const rolesOptions = [
  { label: "Guardia", value: 1 },
  { label: "Administrador", value: 2 },
  { label: "Residente", value: 3 },
];

function abrirAsignar(p) {
  editando.value = p;
  usuarioId.value = p?.usuarioId || null;
  rolId.value = null;
  errorForm.value = "";
  mostrarDialog.value = true;
}

async function handleAsignar() {
  if (!usuarioId.value || !rolId.value) return;
  enviando.value = true;
  const ok = await asignarRol(usuarioId.value, rolId.value);
  enviando.value = false;
  if (ok) {
    mostrarDialog.value = false;
    editando.value = null;
  } else {
    errorForm.value = error.value || "Error al asignar rol";
  }
}

function confirmarRevocar(p) {
  confirm.require({
    message: `¿Revocar acceso de ${p.nombre} al condominio?`,
    header: "Confirmar",
    acceptLabel: "Revocar",
    rejectLabel: "Cancelar",
    accept: () => handleRevocar(p.usuarioId),
  });
}

async function handleRevocar(uid) {
  await revocar(uid);
}
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Gestión de Personal</h1>
      <Button label="Asignar rol" icon="pi pi-user-plus" size="small" @click="abrirAsignar(null)" />
    </div>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <Skeleton v-if="loading" width="100%" height="300px" />

    <div v-else-if="!personal?.length" class="text-center text-surface-400 py-8">
      <i class="pi pi-users text-4xl block mb-2"></i>
      <span>No hay personal registrado</span>
    </div>

    <div v-else class="flex flex-col gap-2">
      <Card v-for="p in personal" :key="p.usuarioId">
        <template #content>
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="font-semibold m-0">{{ p.nombre }}</p>
              <p class="text-sm text-surface-400 m-0">{{ p.email }}</p>
              <div class="flex items-center gap-2 mt-1">
                <Tag :value="p.rolEnCondominio" severity="info" size="small" />
                <Tag v-if="!p.activo" value="Inactivo" severity="danger" size="small" />
              </div>
            </div>
            <div class="flex flex-col gap-1 shrink-0">
              <Button icon="pi pi-pencil" size="small" variant="text" @click="abrirAsignar(p)" />
              <Button v-if="p.activo" icon="pi pi-ban" size="small" variant="text" severity="danger" @click="confirmarRevocar(p)" />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Dialog v-model:visible="mostrarDialog" :header="editando ? 'Cambiar rol' : 'Asignar rol'" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">Usuario</label>
          <p v-if="editando" class="text-sm m-0">{{ editando.nombre }} ({{ editando.email }})</p>
          <Select v-else v-model="usuarioId" :options="personal" optionLabel="nombre" optionValue="usuarioId" placeholder="Seleccione usuario" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">Rol</label>
          <Select v-model="rolId" :options="rolesOptions" optionLabel="label" optionValue="value" placeholder="Seleccione rol" class="w-full" />
        </div>
        <Message v-if="errorForm" severity="error" :closable="false">{{ errorForm }}</Message>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="mostrarDialog = false" />
        <Button label="Guardar" :loading="enviando" :disabled="!usuarioId || !rolId" @click="handleAsignar" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>
