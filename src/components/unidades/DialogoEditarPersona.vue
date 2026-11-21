<script setup>
import { ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import { useValidacionChile } from "@/composables/useValidacionChile";

const props = defineProps({
  visible: { type: Boolean, default: false },
  persona: { type: Object, default: null },
  guardando: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits(["update:visible", "guardar"]);

const {
  errores,
  validarNombre,
  validarTelefono,
  onTelefonoInput,
  onTelefonoBlur,
  normalizarTelefono,
} = useValidacionChile();

const nombre = ref("");
const telefono = ref("");

function reset() {
  nombre.value = props.persona?.nombre || "";
  telefono.value = props.persona?.telefono || "";
  errores.value = {};
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) reset();
  },
);

watch(
  () => props.persona,
  () => {
    if (props.visible) reset();
  },
);

function guardar() {
  const okNombre = validarNombre(
    nombre.value,
    "nombre",
    "Ingresa el nombre de la persona (mínimo 2 caracteres)",
  );
  const okTelefono = validarTelefono(
    telefono.value,
    "telefono",
    "Ingresa un teléfono válido (ej: +56 9 1234 5678)",
  );
  if (!okNombre || !okTelefono) return;

  emit("guardar", {
    nombre: nombre.value.trim(),
    telefono: telefono.value ? normalizarTelefono(telefono.value) : "",
  });
}
</script>

<template>
  <Dialog
    :draggable="false"
    :visible="visible"
    header="Editar persona"
    modal
    :style="{ width: '95%', maxWidth: '440px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-3">
      <div
        v-if="persona"
        class="bg-inset border border-border-soft rounded-lg p-2 text-xs flex flex-col gap-1"
      >
        <div class="flex justify-between gap-2">
          <span class="text-text-muted">Email</span>
          <span class="truncate" :title="persona.email">{{ persona.email || "—" }}</span>
        </div>
        <div class="flex justify-between gap-2">
          <span class="text-text-muted">RUT</span>
          <span>{{ persona.rut || "—" }}</span>
        </div>
        <span class="text-text-subtle">
          Email y RUT se gestionan desde Personas. Aquí solo se editan nombre y
          teléfono.
        </span>
      </div>

      <div class="flex flex-col gap-1">
        <label for="editar-persona-nombre" class="text-sm font-medium">
          Nombre
        </label>
        <InputText
          id="editar-persona-nombre"
          v-model="nombre"
          class="w-full"
          autocomplete="name"
          :invalid="!!errores.nombre"
        />
        <small v-if="errores.nombre" class="text-danger">{{ errores.nombre }}</small>
      </div>

      <div class="flex flex-col gap-1">
        <label for="editar-persona-telefono" class="text-sm font-medium">
          Teléfono
        </label>
        <InputText
          id="editar-persona-telefono"
          :model-value="telefono"
          class="w-full"
          placeholder="+56 9 1234 5678"
          maxlength="16"
          inputmode="tel"
          autocomplete="tel"
          :invalid="!!errores.telefono"
          @update:model-value="telefono = onTelefonoInput($event)"
          @blur="telefono = onTelefonoBlur(telefono)"
        />
        <small v-if="errores.telefono" class="text-danger">{{ errores.telefono }}</small>
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
      <Button label="Guardar" :loading="guardando" @click="guardar" />
    </template>
  </Dialog>
</template>
