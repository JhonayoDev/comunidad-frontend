<script setup>
import { ref, watch } from "vue";

import Dialog from "primevue/dialog";
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import InputText from "primevue/inputtext";
import Button from "primevue/button";

const props = defineProps({
  visible: Boolean,
  loading: Boolean,
});

const emit = defineEmits(["update:visible", "register"]);

const clasificaciones = [
  { label: "Normal", value: "NORMAL" },
  { label: "Urgente", value: "URGENTE" },
  { label: "Emergencia", value: "EMERGENCIA" },
  { label: "Informativo", value: "INFO" },
];

const form = ref({
  tipo: "NOVEDAD",
  clasificacion: "NORMAL",
  observaciones: "",
  fotoUrl: "",
});

function resetForm() {
  form.value = {
    tipo: "NOVEDAD",
    clasificacion: "NORMAL",
    observaciones: "",
    fotoUrl: "",
  };
}

function cerrar() {
  emit("update:visible", false);
  resetForm();
}

function registrar() {
  if (!form.value.observaciones.trim()) return;
  emit("register", { ...form.value });
  cerrar();
}

watch(
  () => props.visible,
  (val) => {
    if (!val) resetForm();
  },
);
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Registrar novedad"
    :modal="true"
    class="w-full max-w-md"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium">Clasificación</label>
        <Select
          v-model="form.clasificacion"
          :options="clasificaciones"
          optionLabel="label"
          optionValue="value"
          placeholder="Selecciona clasificación"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium">Descripción</label>
        <Textarea
          v-model="form.observaciones"
          rows="4"
          placeholder="Describe la novedad..."
          :autoResize="true"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium">Foto (opcional)</label>
        <InputText
          v-model="form.fotoUrl"
          placeholder="URL de la foto"
        />
      </div>
    </div>
    <template #footer>
      <Button
        label="Cancelar"
        severity="secondary"
        variant="text"
        @click="cerrar"
      />
      <Button
        label="Registrar"
        icon="pi pi-check"
        :disabled="!form.observaciones.trim()"
        :loading="loading"
        @click="registrar"
      />
    </template>
  </Dialog>
</template>
