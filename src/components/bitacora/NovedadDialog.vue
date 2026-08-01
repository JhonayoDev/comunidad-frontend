<script setup>
import { ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Message from "primevue/message";

const props = defineProps({
  visible: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
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

watch(
  () => props.visible,
  (v) => {
    if (v) {
      form.value = {
        tipo: "NOVEDAD",
        clasificacion: "NORMAL",
        observaciones: "",
        fotoUrl: "",
      };
    }
  },
);

function handleRegister() {
  if (!form.value.observaciones.trim()) return;
  emit("register", { ...form.value });
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Registrar novedades"
    modal
    :closable="!loading"
    class="w-full max-w-md m-4 bg-surface"
  >
    <div class="flex flex-col gap-3">
      <Message v-if="error" severity="error" :closable="false">{{
        error
      }}</Message>

      <p class="text-sm text-text/90 m-0">
        Registrar una novedad o evento en la bitácora del condominio
      </p>

      <div
        class="bg-background/90 p-3 flex flex-col gap-3 rounded-lg border border-border/60 shadow-lg"
      >
        <div class="flex flex-col gap-1">
          <label class="text-sm">Clasificación</label>
          <Select
            v-model="form.clasificacion"
            :options="clasificaciones"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona clasificación"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm"
            >Descripción
            <span class="text-text-muted">(obligatorio)</span></label
          >
          <Textarea
            v-model="form.observaciones"
            rows="4"
            placeholder="Describe la novedad..."
            :autoResize="true"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm"
            >Foto <span class="text-text-muted">(opcional)</span></label
          >
          <InputText
            v-model="form.fotoUrl"
            placeholder="URL de la foto (ej: https://..."
          />
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        class="rounded-lg border border-border/80 shadow-lg"
        label="Cancelar"
        severity="secondary"
        text
        :disabled="loading"
        @click="$emit('update:visible', false)"
      />
      <Button
        label="Registrar"
        icon="pi pi-flag"
        severity="primary"
        :disabled="!form.observaciones.trim()"
        :loading="loading"
        @click="handleRegister"
      />
    </template>
  </Dialog>
</template>
