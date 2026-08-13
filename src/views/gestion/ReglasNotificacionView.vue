<script setup>
import { ref } from "vue";
import { useReglasNotificacion } from "@/composables/useReglasNotificacion";
import { AUDIENCIA_LABELS, AUDIENCIA_DESC, CANAL_LABELS, CANAL_DESC, PRIORIDAD_DESC } from "@/data/reglasCatalogo";
import InfoAyudaVista from "@/components/common/InfoAyudaVista.vue";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import InputSwitch from "primevue/inputswitch";
import Select from "primevue/select";
import MultiSelect from "primevue/multiselect";
import Checkbox from "primevue/checkbox";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const confirm = useConfirm();
const { reglas, loading, error, cargar, actualizarRegla, restaurarRegla } = useReglasNotificacion();

const guardando = ref(null);

const canalOptions = [
  { label: "App", value: "IN_APP" },
  { label: "Email", value: "EMAIL" },
  { label: "Push", value: "PUSH" },
];

const audienciaOptions = Object.entries(AUDIENCIA_LABELS).map(([value, label]) => ({
  label,
  value,
}));

const prioridadOptions = [
  { label: "Baja", value: "BAJA" },
  { label: "Normal", value: "NORMAL" },
  { label: "Alta", value: "ALTA" },
  { label: "Crítica", value: "CRITICA" },
];

const seccionesAyuda = [
  {
    titulo: "Audiencia",
    items: Object.entries(AUDIENCIA_LABELS).map(([value, label]) => ({
      label,
      desc: AUDIENCIA_DESC[value],
    })),
  },
  {
    titulo: "Canales",
    items: Object.entries(CANAL_LABELS).map(([value, label]) => ({
      label,
      desc: CANAL_DESC[value],
    })),
  },
  {
    titulo: "Prioridad",
    items: prioridadOptions.map((o) => ({ label: o.label, desc: PRIORIDAD_DESC[o.value] })),
  },
];

function tipoLabel(tipo) {
  return tipo.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function canalesLabel(canales) {
  if (!canales?.length) return "—";
  return canales.map((c) => CANAL_LABELS[c] || c).join(", ");
}

function canalObligatorio(regla, canal) {
  return regla[`esObligatoria${canal === "IN_APP" ? "Inapp" : canal.charAt(0) + canal.slice(1).toLowerCase()}`];
}

function todosCanalesSeleccionados(regla) {
  return (regla.canales || []).length === canalOptions.length;
}

function toggleTodosCanales(regla) {
  const todos = todosCanalesSeleccionados(regla);
  cambiarCanales(regla, todos ? [] : canalOptions.map((o) => o.value));
}

async function toggleHabilitada(regla) {
  guardando.value = regla.tipo;
  await actualizarRegla({ ...regla, habilitada: !regla.habilitada });
  guardando.value = null;
}

async function cambiarCanales(regla, nuevosCanales) {
  guardando.value = regla.tipo;
  await actualizarRegla({ ...regla, canales: nuevosCanales });
  guardando.value = null;
}

async function cambiarAudiencia(regla, audiencia) {
  guardando.value = regla.tipo;
  await actualizarRegla({ ...regla, audiencia });
  guardando.value = null;
}

async function cambiarPrioridad(regla, prioridad) {
  guardando.value = regla.tipo;
  await actualizarRegla({ ...regla, prioridad });
  guardando.value = null;
}

function confirmarRestaurar(regla) {
  confirm.require({
    message: `¿Restaurar regla "${tipoLabel(regla.tipo)}" a su configuración global?`,
    header: "Restaurar default",
    acceptLabel: "Restaurar",
    rejectLabel: "Cancelar",
    accept: () => handleRestaurar(regla.tipo),
  });
}

async function handleRestaurar(tipo) {
  guardando.value = tipo;
  await restaurarRegla(tipo);
  guardando.value = null;
}
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1">
        <h1 class="text-xl font-bold m-0">Reglas de Notificación</h1>
        <InfoAyudaVista titulo="Reglas de notificación" :secciones="seccionesAyuda" />
      </div>
      <p class="text-sm text-surface-500 m-0 mt-1 hidden sm:block">Matriz de reglas por defecto vs sobrescritas por condominio</p>
    </div>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <Skeleton v-if="loading" width="100%" height="300px" />

    <div v-else class="flex flex-col gap-2">
      <Card v-for="r in reglas" :key="r.tipo">
        <template #content>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <span class="font-semibold text-sm">{{ tipoLabel(r.tipo) }}</span>
                <Tag v-if="r.esObligatoriaInapp && r.esObligatoriaEmail && r.esObligatoriaPush" value="Obligatoria" severity="danger" size="small" />
                <Tag v-if="r.esSobrescritura" value="Override" severity="warn" size="small" />
                <Tag v-else value="Default" severity="info" size="small" />
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <InputSwitch
                  :modelValue="r.habilitada"
                  :disabled="guardando === r.tipo"
                  @update:modelValue="toggleHabilitada(r)"
                />
                <Button
                  v-if="r.esSobrescritura"
                  icon="pi pi-undo"
                  size="small"
                  variant="text"
                  severity="danger"
                  :disabled="guardando === r.tipo"
                  @click="confirmarRestaurar(r)"
                />
              </div>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-surface-500">
              <div class="flex items-center gap-2">
                <span>Audiencia:</span>
                <Select
                  :modelValue="r.audiencia"
                  :options="audienciaOptions"
                  optionLabel="label"
                  optionValue="value"
                  :disabled="guardando === r.tipo || !r.habilitada"
                  class="w-full sm:w-52"
                  @update:modelValue="cambiarAudiencia(r, $event)"
                />
              </div>
              <div class="flex items-center gap-2">
                <span>Prioridad:</span>
                <Select
                  :modelValue="r.prioridad"
                  :options="prioridadOptions"
                  optionLabel="label"
                  optionValue="value"
                  :disabled="guardando === r.tipo || !r.habilitada"
                  class="w-full sm:w-36"
                  @update:modelValue="cambiarPrioridad(r, $event)"
                />
              </div>
              <div class="flex items-center gap-2">
                <span>Canales:</span>
                <MultiSelect
                  :modelValue="r.canales"
                  :options="canalOptions"
                  optionLabel="label"
                  optionValue="value"
                  :show-toggle-all="false"
                  :disabled="guardando === r.tipo || !r.habilitada"
                  placeholder="Seleccionar canales"
                  class="w-full sm:w-52"
                  @update:modelValue="cambiarCanales(r, $event)"
                >
                  <template #header>
                    <div class="flex items-center gap-2 px-3 py-2">
                      <Checkbox :binary="true" :modelValue="todosCanalesSeleccionados(r)" @change="toggleTodosCanales(r)" />
                      <span class="text-sm">Seleccionar todos</span>
                    </div>
                  </template>
                </MultiSelect>
              </div>
            </div>
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="c in r.canales || []"
                :key="c"
                :value="`${CANAL_LABELS[c] || c}${canalObligatorio(r, c) ? ' · obligatorio' : ''}`"
                :severity="canalObligatorio(r, c) ? 'danger' : 'secondary'"
                size="small"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <ConfirmDialog />
  </div>
</template>
