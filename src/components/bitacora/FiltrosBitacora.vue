<script setup>
import Select from "primevue/select";
import FiltroFechas from "@/components/FiltroFechas.vue";

const tipo = defineModel("tipo", { type: Object, default: null });
const clasificacion = defineModel("clasificacion", {
  type: Object,
  default: null,
});
const rangoFechas = defineModel("rangoFechas", { type: Array, default: null });

const clasificaciones = [
  { label: "Normal", value: "NORMAL" },
  { label: "Urgente", value: "URGENTE" },
  { label: "Emergencia", value: "EMERGENCIA" },
  { label: "Informativo", value: "INFO" },
];

const tiposEvento = [
  { label: "Novedad", value: "NOVEDAD" },
  { label: "Inicio turno", value: "TURNO_INICIO" },
  { label: "Fin turno", value: "TURNO_FIN" },
  { label: "Colación salida", value: "COLACION_SALIDA" },
  { label: "Colación regreso", value: "COLACION_REGRESO" },
];

function limpiar() {
  tipo.value = null;
  clasificacion.value = null;
  rangoFechas.value = null;
}
</script>

<template>
  <div
    class="bg-background/90 p-3 flex flex-col gap-3 rounded-lg border border-border/60 shadow-lg"
  >
    <div class="flex items-center justify-between">
      <label class="text-sm font-semibold">Filtros</label>
      <span
        class="text-sm text-text/90 underline cursor-pointer select-none"
        @click="limpiar"
      >Limpiar</span>
    </div>
    <div class="flex flex-col sm:flex-row gap-2">
      <div class="w-full sm:flex-1">
        <Select
          v-model="tipo"
          :options="tiposEvento"
          optionLabel="label"
          placeholder="Todos los tipos"
          fluid
          clearable
          showClear
        />
      </div>
      <div class="w-full sm:flex-1">
        <Select
          v-model="clasificacion"
          :options="clasificaciones"
          optionLabel="label"
          placeholder="Todas las clasificaciones"
          fluid
          clearable
          showClear
        />
      </div>
    </div>
    <FiltroFechas v-model="rangoFechas" />
  </div>
</template>
