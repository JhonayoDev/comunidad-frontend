<script setup>
import InputText from "primevue/inputtext";

const casa = defineModel("casa", { type: String, default: "" });
const nombre = defineModel("nombre", { type: String, default: "" });
const emit = defineEmits(["buscar"]);

let timeout = null;
function buscarDebounced() {
  clearTimeout(timeout);
  timeout = setTimeout(() => emit("buscar"), 650);
}

function limpiar() {
  casa.value = "";
  nombre.value = "";
  emit("buscar");
}
</script>

<template>
  <div class="bg-background/90 p-3 flex flex-col gap-3 rounded-lg border border-border/60 shadow-lg">
    <div class="flex flex-col gap-1">
      <div class="flex items-center justify-between">
        <label class="text-sm font-semibold">Buscar por casa</label>
        <span
          class="text-sm text-text/90 underline cursor-pointer select-none"
          @click="limpiar"
        >Limpiar</span>
      </div>
      <InputText
        v-model="casa"
        placeholder="Ej: 2, 15, A-101"
        @input="buscarDebounced"
      />
    </div>
    <div class="flex flex-col gap-1">
      <label class="text-sm font-semibold">Buscar por nombre</label>
      <InputText
        v-model="nombre"
        placeholder="Ej: Juan Pérez"
        @input="buscarDebounced"
      />
    </div>
  </div>
</template>
