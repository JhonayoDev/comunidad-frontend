<script setup>
import { ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import RadioButton from "primevue/radiobutton";
import Textarea from "primevue/textarea";
import Message from "primevue/message";

const props = defineProps({
  visible: { type: Boolean, default: false },
  vinculo: { type: Object, default: null },
  puedeQuitarCondominio: { type: Boolean, default: false },
  guardando: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits(["update:visible", "confirmar"]);

const alcance = ref("UNIDAD");
const motivo = ref("");

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      alcance.value = "UNIDAD";
      motivo.value = "";
    }
  },
);

function confirmar() {
  emit("confirmar", {
    alcance: alcance.value,
    motivo: alcance.value === "CONDOMINIO" ? motivo.value.trim() : "",
  });
}
</script>

<template>
  <Dialog
    :draggable="false"
    :visible="visible"
    header="Quitar persona"
    modal
    :style="{ width: '95%', maxWidth: '480px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-3">
      <p v-if="vinculo" class="text-sm m-0">
        <strong>{{ vinculo.personaNombre }}</strong> está vinculada a la unidad
        <strong>{{ vinculo.unidadNumero }}</strong>. ¿Qué alcance tiene la
        baja?
      </p>

      <label
        class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer"
        :class="alcance === 'UNIDAD' ? 'border-primary bg-subtle' : 'border-border bg-inset'"
      >
        <RadioButton v-model="alcance" value="UNIDAD" name="alcance-baja" />
        <span class="flex flex-col gap-1">
          <span class="text-sm font-medium">Quitar solo de esta casa</span>
          <span class="text-xs text-text-muted">
            Deja de figurar como residente de esta unidad. Su cuenta y sus
            otros vínculos en el condominio no cambian.
          </span>
        </span>
      </label>

      <label
        v-if="puedeQuitarCondominio"
        class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer"
        :class="alcance === 'CONDOMINIO' ? 'border-primary bg-subtle' : 'border-border bg-inset'"
      >
        <RadioButton v-model="alcance" value="CONDOMINIO" name="alcance-baja" />
        <span class="flex flex-col gap-1">
          <span class="text-sm font-medium">Quitar del condominio</span>
          <span class="text-xs text-text-muted">
            Baja local: pierde el acceso y todos sus vínculos en este
            condominio. Su cuenta sigue activa en otros condominios.
          </span>
        </span>
      </label>

      <div v-if="alcance === 'CONDOMINIO'" class="flex flex-col gap-1">
        <label for="motivo-baja-persona" class="text-sm font-medium">
          Motivo (opcional)
        </label>
        <Textarea
          id="motivo-baja-persona"
          v-model="motivo"
          rows="2"
          auto-resize
          maxlength="500"
          placeholder="Ej: mudanza, término de contrato…"
          class="w-full"
        />
      </div>

      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    </div>

    <template #footer>
      <Button
        label="Cancelar"
        severity="secondary"
        :disabled="guardando"
        @click="emit('update:visible', false)"
      />
      <Button
        label="Quitar"
        severity="danger"
        icon="pi pi-user-minus"
        :loading="guardando"
        @click="confirmar"
      />
    </template>
  </Dialog>
</template>
