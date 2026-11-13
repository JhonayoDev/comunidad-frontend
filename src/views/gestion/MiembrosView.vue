<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { miembrosService } from "@/services/miembrosService";
import { personasService } from "@/services/personasService";
import { labelCargo } from "@/data/cargos";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import AutoComplete from "primevue/autocomplete";
import Select from "primevue/select";
import DatePicker from "primevue/datepicker";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const auth = useAuthStore();
const router = useRouter();
const confirm = useConfirm();

const loading = ref(true);
const error = ref(null);
const errorAccion = ref(null);
const exito = ref(null);
const miembros = ref([]);

const showAsignar = ref(false);
const enviando = ref(false);

const form = ref({
  personaId: null,
  cargo: null,
  fechaInicio: new Date(),
});
const erroresForm = ref({});

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

const personas = ref([]);
const personasFiltradas = ref([]);
const personaSeleccionada = ref(null);

function buscarPersona(event) {
  setTimeout(() => {
    const q = String(event.query || "").toLowerCase();
    personasFiltradas.value = personas.value.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q),
    );
  }, 100);
}

function onPersonaSelect() {
  if (personaSeleccionada.value) {
    form.value.personaId = personaSeleccionada.value.id;
    erroresForm.value.personaId = null;
  }
}

async function cargarPersonas() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    const { data } = await personasService.listar(cid, { estado: "TODOS" });
    personas.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Error al cargar personas", e);
  }
}

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await miembrosService.listar(cid);
    miembros.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Error al cargar miembros", e);
    error.value = "No se pudieron cargar los miembros";
  } finally {
    loading.value = false;
  }
}

function abrirAsignar() {
  form.value = { personaId: null, cargo: null, fechaInicio: new Date() };
  personaSeleccionada.value = null;
  erroresForm.value = {};
  errorAccion.value = null;
  showAsignar.value = true;
}

function irANuevoTrabajador() {
  router.push({ name: "Personas", query: { nueva: "CARGO" } });
}

function formatearFecha(d) {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function validarFormulario() {
  erroresForm.value = {};
  if (!form.value.personaId) {
    erroresForm.value.personaId = "Selecciona una persona";
  }
  if (!form.value.cargo) {
    erroresForm.value.cargo = "Selecciona un cargo";
  }
  if (!form.value.fechaInicio) {
    erroresForm.value.fechaInicio = "Selecciona la fecha de inicio";
  }
  return Object.keys(erroresForm.value).length === 0;
}

async function asignar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  if (!validarFormulario()) return;
  enviando.value = true;
  errorAccion.value = null;
  try {
    await miembrosService.asignar(cid, {
      personaId: form.value.personaId,
      cargo: form.value.cargo,
      fechaInicio: formatearFecha(form.value.fechaInicio),
    });
    showAsignar.value = false;
    exito.value = "Cargo asignado correctamente.";
    await cargar();
    await cargarPersonas();
  } catch (e) {
    console.error("Error al asignar cargo", e);
    errorAccion.value =
      e?.response?.data?.message || "No se pudo asignar el cargo";
  } finally {
    enviando.value = false;
  }
}

function confirmarDesactivar(m) {
  confirm.require({
    message: `¿Desactivar el cargo ${labelCargo(m.cargo)} de ${m.personaNombre}?`,
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
  errorAccion.value = null;
  try {
    await miembrosService.desactivar(cid, m.id);
    exito.value = "Cargo desactivado.";
    await cargar();
  } catch (e) {
    console.error("Error al desactivar miembro", e);
    errorAccion.value =
      e?.response?.data?.message || "No se pudo desactivar el cargo";
  }
}

onMounted(() => {
  cargar();
  cargarPersonas();
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-xl font-bold m-0">Miembros</h1>
      <div class="flex flex-wrap items-center gap-2">
        <Button
          label="Nuevo trabajador"
          icon="pi pi-briefcase"
          severity="secondary"
          variant="outlined"
          size="small"
          @click="irANuevoTrabajador"
        />
        <Button
          label="Asignar cargo"
          icon="pi pi-plus"
          size="small"
          @click="abrirAsignar"
        />
      </div>
    </div>

    <Message
      v-if="exito"
      severity="success"
      :closable="true"
      @close="exito = null"
    >
      {{ exito }}
    </Message>
    <Message
      v-if="errorAccion"
      severity="error"
      :closable="true"
      @close="errorAccion = null"
    >
      {{ errorAccion }}
    </Message>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div
        v-if="!miembros.length"
        class="text-center text-text-muted py-8"
      >
        No hay miembros registrados
      </div>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="m in miembros"
          :key="m.id"
          class="bg-surface border border-border-soft rounded-lg p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium truncate">{{ m.personaNombre }}</span>
              <Tag :value="labelCargo(m.cargo)" severity="info" size="small" />
              <Tag
                v-if="!m.activo"
                value="Inactivo"
                severity="secondary"
                size="small"
              />
            </div>
            <div class="text-sm text-text-muted truncate">
              {{ m.personaEmail }}
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs text-text-muted">{{ m.fechaInicio }}</span>
            <Button
              v-if="m.activo"
              icon="pi pi-trash"
              severity="danger"
              variant="text"
              size="small"
              :title="`Desactivar cargo de ${m.personaNombre}`"
              :aria-label="`Desactivar cargo de ${m.personaNombre}`"
              @click="confirmarDesactivar(m)"
            />
          </div>
        </div>
      </div>
    </template>

    <Dialog
      v-model:visible="showAsignar"
      header="Asignar cargo"
      modal
      :style="{ width: '95%', maxWidth: '400px' }"
    >
      <div class="flex flex-col gap-3">
        <Message v-if="errorAccion" severity="error" :closable="false">
          {{ errorAccion }}
        </Message>

        <div class="flex flex-col gap-1">
          <label class="text-sm">Persona *</label>
          <AutoComplete
            v-model="personaSeleccionada"
            :suggestions="personasFiltradas"
            @complete="buscarPersona"
            @item-select="onPersonaSelect"
            optionLabel="nombre"
            placeholder="Buscar por nombre o email"
            forceSelection
            class="w-full"
            :class="{ 'p-invalid': erroresForm.personaId }"
          >
            <template #option="slotProps">
              <div class="flex flex-col">
                <span class="font-medium">{{ slotProps.option.nombre }}</span>
                <span class="text-xs text-text-muted">
                  {{ slotProps.option.email }}
                </span>
              </div>
            </template>
          </AutoComplete>
          <small v-if="erroresForm.personaId" class="text-danger">
            {{ erroresForm.personaId }}
          </small>
          <small class="text-xs text-text-muted">
            ¿No aparece? Créala desde
            <button
              type="button"
              class="text-primary-400 underline cursor-pointer bg-transparent border-none p-0"
              @click="irANuevoTrabajador"
            >
              Nuevo trabajador
            </button>
            (alta con cargo incluido).
          </small>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Cargo *</label>
          <Select
            v-model="form.cargo"
            :options="cargos"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar"
            class="w-full"
            :class="{ 'p-invalid': erroresForm.cargo }"
          />
          <small v-if="erroresForm.cargo" class="text-danger">
            {{ erroresForm.cargo }}
          </small>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Fecha inicio *</label>
          <DatePicker v-model="form.fechaInicio" class="w-full" />
          <small v-if="erroresForm.fechaInicio" class="text-danger">
            {{ erroresForm.fechaInicio }}
          </small>
        </div>
      </div>
      <template #footer>
        <Button
          severity="secondary"
          label="Cancelar"
          @click="showAsignar = false"
        />
        <Button label="Asignar" :loading="enviando" @click="asignar" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>
