<script setup>
import { ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Message from "primevue/message";

const props = defineProps({
  visible: { type: Boolean, default: false },
  acceso: { type: Object, default: null },
  patente: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits(["update:visible", "confirm", "cancel"]);

const observacion = ref("");

watch(
  () => props.visible,
  (v) => {
    if (v) observacion.value = "";
  }
);

function formatFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function handleConfirm() {
  emit("confirm", observacion.value);
}

function handleCancel() {
  emit("cancel");
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Registrar salida"
    modal
    :closable="!loading"
    class="w-full max-w-md"
  >
    <div v-if="acceso" class="flex flex-col gap-3">
      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

      <p class="text-sm text-surface-500 m-0">
        Confirmar salida del vehículo con patente <strong>{{ patente }}</strong>
      </p>

      <div class="bg-surface-50 p-3 border-round flex flex-col gap-1 text-sm">
        <p class="m-0"><span class="text-surface-400">Visitante:</span> <strong>{{ acceso.nombreVisitante }}</strong></p>
        <p class="m-0"><span class="text-surface-400">Casa:</span> {{ acceso.unidadNumero }}</p>
        <p class="m-0"><span class="text-surface-400">Ingresó:</span> {{ formatFecha(acceso.fechaIngreso) }}</p>
        <p class="m-0"><span class="text-surface-400">Tipo:</span> {{ acceso.tipo }}</p>
        <p v-if="acceso.cantidadPersonas" class="m-0">
          <span class="text-surface-400">Personas:</span> {{ acceso.cantidadPersonas }}
        </p>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm">Observación <span class="text-surface-400">(opcional)</span></label>
        <InputText v-model="observacion" placeholder="Ej: Sale en vehículo particular" />
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text :disabled="loading" @click="handleCancel" />
      <Button label="Confirmar salida" icon="pi pi-sign-out" severity="warn" :loading="loading" @click="handleConfirm" />
    </template>
  </Dialog>
</template>
