<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { miembrosService } from "@/services/miembrosService";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import DatePicker from "primevue/datepicker";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const auth = useAuthStore();
const confirm = useConfirm();

const loading = ref(true);
const error = ref(null);
const miembros = ref([]);

const showAsignar = ref(false);
const enviando = ref(false);

const form = ref({
  personaId: null,
  cargo: null,
  fechaInicio: new Date(),
});

const cargos = [
  { label: "Presidente", value: "PRESIDENTE" },
  { label: "Tesorero", value: "TESORERO" },
  { label: "Secretario", value: "SECRETARIO" },
  { label: "Delegado", value: "DELEGADO" },
  { label: "Conserje", value: "CONSERJE" },
  { label: "Guardia", value: "GUARDIA" },
  { label: "Mantención", value: "MANTENCION" },
  { label: "Jardinero", value: "JARDINERO" },
];

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await miembrosService.listar(cid);
    miembros.value = data;
  } catch (e) {
    console.error("Error al cargar miembros", e);
    error.value = "No se pudieron cargar los miembros";
  } finally {
    loading.value = false;
  }
}

function abrirAsignar() {
  form.value = { personaId: null, cargo: null, fechaInicio: new Date() };
  showAsignar.value = true;
}

function formatearFecha(d) {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function asignar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    await miembrosService.asignar(cid, {
      personaId: form.value.personaId,
      cargo: form.value.cargo,
      fechaInicio: formatearFecha(form.value.fechaInicio),
    });
    showAsignar.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al asignar cargo", e);
  } finally {
    enviando.value = false;
  }
}

function confirmarDesactivar(m) {
  confirm.require({
    message: `¿Desactivar a ${m.personaNombre} (${m.cargo})?`,
    header: "Confirmar",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Desactivar",
    rejectLabel: "Cancelar",
    accept: () => desactivar(m),
  });
}

async function desactivar(m) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    await miembrosService.desactivar(cid, m.id);
    await cargar();
  } catch (e) {
    console.error("Error al desactivar miembro", e);
  }
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold m-0">Miembros</h1>
      <Button label="Asignar cargo" icon="pi pi-plus" size="small" @click="abrirAsignar" />
    </div>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!miembros.length" class="text-center text-surface-400 py-8">
        No hay miembros registrados
      </div>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="m in miembros"
          :key="m.id"
          class="surface-card p-3 border-round shadow-1 flex items-center justify-between"
        >
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ m.personaNombre }}</span>
              <Tag :value="m.cargo" severity="info" size="small" />
              <Tag v-if="!m.activo" value="Inactivo" severity="secondary" size="small" />
            </div>
            <div class="text-sm text-surface-500">{{ m.personaEmail }}</div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-surface-400">{{ m.fechaInicio }}</span>
            <Button
              v-if="m.activo"
              icon="pi pi-trash"
              severity="danger"
              variant="text"
              size="small"
              @click="confirmarDesactivar(m)"
            />
          </div>
        </div>
      </div>
    </template>

    <Dialog v-model:visible="showAsignar" header="Asignar cargo" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">ID Persona</label>
          <InputText v-model="form.personaId" placeholder="UUID de la persona" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Cargo</label>
          <Select v-model="form.cargo" :options="cargos" optionLabel="label" optionValue="value" placeholder="Seleccionar" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Fecha inicio</label>
          <DatePicker v-model="form.fechaInicio" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showAsignar = false" />
        <Button label="Asignar" :loading="enviando" @click="asignar" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>
