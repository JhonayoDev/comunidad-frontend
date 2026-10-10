<script setup>
import DatePicker from "primevue/datepicker";
import Button from "primevue/button";

const model = defineModel({ type: Array, default: null });
</script>

<template>
  <div class="flex items-center gap-2 w-full sm:w-auto">
    <DatePicker
      v-model="model"
      selectionMode="range"
      :manualInput="false"
      showButtonBar
      placeholder="Filtrar por fechas"
      class="w-full"
    />
    <Button variant="text"
      v-if="model"
      icon="pi pi-times"
      severity="secondary"
      rounded
      @click="model = null"
    />
  </div>
</template>
