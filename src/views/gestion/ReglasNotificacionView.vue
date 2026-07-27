<script setup>
import { ref } from "vue";
import { useReglasNotificacion } from "@/composables/useReglasNotificacion";
import { AUDIENCIA_LABELS, PRIORIDAD_SEVERITY, CANAL_LABELS } from "@/data/reglasCatalogo";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import InputSwitch from "primevue/inputswitch";
import Select from "primevue/select";
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

function tipoLabel(tipo) {
  return tipo.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function canalesLabel(canales) {
  if (!canales?.length) return "—";
  return canales.map((c) => CANAL_LABELS[c] || c).join(", ");
}

async function toggleHabilitada(regla) {
  guardando.value = regla.tipo;
  const data = { habilitada: !regla.habilitada };
  await actualizarRegla(regla.tipo, data);
  guardando.value = null;
}

async function cambiarCanales(regla, nuevosCanales) {
  guardando.value = regla.tipo;
  const data = { canales: nuevosCanales.join(",") };
  await actualizarRegla(regla.tipo, data);
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
      <div>
        <h1 class="text-xl font-bold m-0">Reglas de Notificación</h1>
        <p class="text-sm text-surface-500 m-0 mt-1">Matriz de reglas por defecto vs sobrescritas por condominio</p>
      </div>
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
                <Tag v-if="r.esObligatoria" value="Obligatoria" severity="danger" size="small" />
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
              <span>Audiencia: <strong>{{ AUDIENCIA_LABELS[r.audiencia] || r.audiencia }}</strong></span>
              <span>Prioridad: <Tag :value="r.prioridad" :severity="PRIORIDAD_SEVERITY[r.prioridad] || 'info'" size="small" /></span>
              <span>Canales:</span>
              <Select
                :modelValue="r.canales"
                :options="canalOptions"
                optionLabel="label"
                optionValue="value"
                multiple
                :disabled="guardando === r.tipo || !r.habilitada"
                placeholder="Seleccionar canales"
                class="w-full sm:w-48"
                @update:modelValue="cambiarCanales(r, $event)"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <ConfirmDialog />
  </div>
</template>
