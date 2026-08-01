<script setup>
import { ref, watch, computed } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import ToggleButton from "primevue/togglebutton";
import Textarea from "primevue/textarea";
import Message from "primevue/message";

const props = defineProps({
  visible: Boolean,
  loading: Boolean,
  items: { type: Array, default: () => [] },
  actionLabel: { type: String, default: "registrar" },
});

const emit = defineEmits(["update:visible", "confirm"]);

function buildRespuestas() {
  return props.items.map((item) => ({
    itemId: item.id,
    ok: null,
    comentario: "",
  }));
}

const respuestas = ref(buildRespuestas());

const valido = computed(() => {
  const sinResponder = props.items.filter((item, i) => {
    if (!item.obligatorio) return false;
    return respuestas.value[i]?.ok === null;
  });
  return sinResponder.length === 0;
});

function cerrar() {
  emit("update:visible", false);
}

function confirmar() {
  if (!valido.value) return;
  const payload = respuestas.value
    .filter((r) => r.ok !== null)
    .map((r) => ({
      itemId: r.itemId,
      ok: r.ok,
      ...(r.comentario?.trim() ? { comentario: r.comentario.trim() } : {}),
    }));
  emit("confirm", payload);
  cerrar();
}

watch(
  () => props.visible,
  (val) => {
    if (val) respuestas.value = buildRespuestas();
  },
);

watch(
  () => props.items,
  () => {
    respuestas.value = buildRespuestas();
  },
);
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :header="`Checklist para ${actionLabel}`"
    :modal="true"
    class="w-full max-w-lg"
  >
    <div class="flex flex-col gap-4">
      <Message v-if="items.length === 0" severity="info" :closable="false">
        No hay checklist configurado para esta acción.
      </Message>

      <div
        v-for="(item, idx) in items"
        :key="item.id"
        class="flex flex-col gap-2 p-3 border-round surface-ground"
      >
        <div class="flex align-items-center gap-2">
          <span class="text-sm font-medium">{{ item.pregunta }}</span>
          <span v-if="item.obligatorio" class="text-red-500 text-xs">*</span>
        </div>
        <div class="flex gap-2">
          <ToggleButton
            v-model="respuestas[idx].ok"
            :onLabel="'Sí'"
            :offLabel="'No'"
            :onIcon="'pi pi-check'"
            :offIcon="'pi pi-times'"
            :class="[
              'w-5rem',
              respuestas[idx].ok === true
                ? 'checklist-true'
                : respuestas[idx].ok === false
                  ? 'checklist-false'
                  : '',
            ]"
          />
        </div>
        <Textarea
          v-if="respuestas[idx].ok != null"
          v-model="respuestas[idx].comentario"
          :autoResize="true"
          rows="2"
          placeholder="Comentario (opcional, máx. 500 caracteres)"
          :maxlength="500"
          class="text-sm"
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
        label="Confirmar"
        icon="pi pi-check"
        :disabled="!valido"
        :loading="loading"
        @click="confirmar"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.checklist-true {
  background: var(--p-green-500) !important;
  border-color: var(--p-green-500) !important;
  color: #ffffff !important;
}
.checklist-false {
  background: var(--p-red-500) !important;
  border-color: var(--p-red-500) !important;
  color: #ffffff !important;
}
</style>
