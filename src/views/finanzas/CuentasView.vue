<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { finanzasService } from "@/services/finanzasService";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const auth = useAuthStore();
const confirm = useConfirm();

const loading = ref(true);
const error = ref(null);
const cuentas = ref([]);

const showDialog = ref(false);
const editando = ref(false);
const enviando = ref(false);

const form = ref({
  nombre: "",
  tipo: null,
  banco: "",
  numeroCuenta: "",
  titular: "",
  descripcion: "",
});

const tiposCuenta = [
  { label: "Cuenta Corriente", value: "CUENTA_CORRIENTE" },
  { label: "Cuenta Vista", value: "CUENTA_VISTA" },
  { label: "Cuenta Ahorro", value: "CUENTA_AHORRO" },
  { label: "Caja Chica", value: "CAJA_CHICA" },
  { label: "Fondo de Reserva", value: "FONDO_RESERVA" },
];

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await finanzasService.listarCuentas(cid);
    cuentas.value = data;
  } catch (e) {
    console.error("Error al cargar cuentas", e);
    error.value = "No se pudieron cargar las cuentas";
  } finally {
    loading.value = false;
  }
}

function abrirCrear() {
  editando.value = false;
  form.value = { nombre: "", tipo: null, banco: "", numeroCuenta: "", titular: "", descripcion: "" };
  showDialog.value = true;
}

function abrirEditar(cta) {
  editando.value = true;
  form.value = {
    nombre: cta.nombre,
    tipo: cta.tipo,
    banco: cta.banco || "",
    numeroCuenta: cta.numeroCuenta || "",
    titular: cta.titular || "",
    descripcion: cta.descripcion || "",
  };
  cuentaEditandoId.value = cta.id;
  showDialog.value = true;
}

const cuentaEditandoId = ref(null);

async function guardar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    if (editando.value) {
      await finanzasService.actualizarCuenta(cid, cuentaEditandoId.value, form.value);
    } else {
      await finanzasService.crearCuenta(cid, form.value);
    }
    showDialog.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al guardar cuenta", e);
  } finally {
    enviando.value = false;
  }
}

function confirmarDesactivar(cta) {
  confirm.require({
    message: `¿Desactivar la cuenta "${cta.nombre}"?`,
    header: "Confirmar",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Desactivar",
    rejectLabel: "Cancelar",
    accept: () => desactivar(cta),
  });
}

async function desactivar(cta) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    await finanzasService.desactivarCuenta(cid, cta.id);
    await cargar();
  } catch (e) {
    console.error("Error al desactivar cuenta", e);
  }
}

function tipoLabel(tipo) {
  const t = tiposCuenta.find((tc) => tc.value === tipo);
  return t ? t.label : tipo;
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold m-0">Cuentas Financieras</h1>
      <Button label="Nueva cuenta" icon="pi pi-plus" size="small" @click="abrirCrear" />
    </div>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!cuentas.length" class="text-center text-surface-400 py-8">
        No hay cuentas registradas
      </div>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="cta in cuentas"
          :key="cta.id"
          class="surface-card p-3 border-round shadow-1"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ cta.nombre }}</span>
                <Tag :value="cta.activa ? 'Activa' : 'Inactiva'" :severity="cta.activa ? 'success' : 'secondary'" size="small" />
              </div>
              <div class="text-sm text-surface-500">
                {{ tipoLabel(cta.tipo) }}
                <span v-if="cta.banco"> — {{ cta.banco }}</span>
                <span v-if="cta.numeroCuenta"> — {{ cta.numeroCuenta }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-bold" :class="cta.saldoActual >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ cta.saldoActual?.toLocaleString("es-CL") || 0 }}
              </span>
              <Button icon="pi pi-pencil" variant="text" size="small" severity="secondary" @click="abrirEditar(cta)" />
              <Button
                v-if="cta.activa"
                icon="pi pi-trash"
                variant="text"
                size="small"
                severity="danger"
                @click="confirmarDesactivar(cta)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <Dialog v-model:visible="showDialog" :header="editando ? 'Editar cuenta' : 'Nueva cuenta'" modal :style="{ width: '95%', maxWidth: '500px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Nombre</label>
          <InputText v-model="form.nombre" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Tipo</label>
          <Select v-model="form.tipo" :options="tiposCuenta" optionLabel="label" optionValue="value" placeholder="Seleccionar" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Banco</label>
          <InputText v-model="form.banco" placeholder="Opcional" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">N° cuenta</label>
          <InputText v-model="form.numeroCuenta" placeholder="Opcional" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Titular</label>
          <InputText v-model="form.titular" placeholder="Opcional" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Descripción</label>
          <Textarea v-model="form.descripcion" rows="2" placeholder="Opcional" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showDialog = false" />
        <Button label="Guardar" :loading="enviando" @click="guardar" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>
