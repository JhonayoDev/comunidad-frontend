<script setup>
import { ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Message from "primevue/message";

const props = defineProps({
  visible: { type: Boolean, default: false },
  encomienda: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits(["update:visible", "confirm"]);

const nombreRetira = ref("");
const rutRetira = ref("");

watch(
  () => props.visible,
  (v) => {
    if (v) {
      nombreRetira.value = "";
      rutRetira.value = "";
    }
  },
);

function handleConfirm() {
  if (!nombreRetira.value.trim() || !rutRetira.value.trim()) return;
  emit("confirm", {
    nombreRetira: nombreRetira.value,
    rutRetira: rutRetira.value,
  });
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Entregar encomienda"
    modal
    :closable="!loading"
    class="w-full max-w-md m-4 bg-surface"
  >
    <div class="flex flex-col gap-3">
      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

      <p v-if="encomienda" class="text-sm text-text/90 m-0">
        Entregando encomienda de <strong>{{ encomienda.nombreDestinatario }}</strong>
        — Casa {{ encomienda.unidadNumero }}
      </p>

      <div class="bg-background/90 p-3 flex flex-col gap-3 rounded-lg border border-border/60 shadow-lg">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Nombre de quien retira <span class="text-text-muted">(obligatorio)</span></label>
          <InputText
            v-model="nombreRetira"
            placeholder="Nombre completo"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">RUT de quien retira <span class="text-text-muted">(obligatorio)</span></label>
          <InputText
            v-model="rutRetira"
            placeholder="12.345.678-9"
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
        label="Confirmar entrega"
        icon="pi pi-check"
        :disabled="!nombreRetira.trim() || !rutRetira.trim()"
        :loading="loading"
        @click="handleConfirm"
      />
    </template>
  </Dialog>
</template>
