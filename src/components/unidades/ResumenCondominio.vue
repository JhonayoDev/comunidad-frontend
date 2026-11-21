<script setup>
import { computed } from "vue";

const props = defineProps({
  resumen: {
    type: Object,
    default: () => ({
      unidades: 0,
      estacionamientos: { total: 0, residentes: 0, visitas: 0 },
      bodegas: 0,
      areasComunes: 0,
    }),
  },
});

const numero = (valor) => Number(valor || 0).toLocaleString("es-CL");

const estacionamientos = computed(
  () => props.resumen.estacionamientos || { total: 0, residentes: 0, visitas: 0 },
);

const tarjetas = computed(() => [
  {
    key: "unidades",
    icono: "pi pi-home",
    label: "Unidades",
    valor: props.resumen.unidades,
    detalle: "casas y departamentos",
  },
  {
    key: "estacionamientos",
    icono: "pi pi-car",
    label: "Estacionamientos",
    valor: estacionamientos.value.total,
    detalle: `${numero(estacionamientos.value.residentes)} residentes · ${numero(estacionamientos.value.visitas)} visitas`,
  },
  {
    key: "bodegas",
    icono: "pi pi-box",
    label: "Bodegas",
    valor: props.resumen.bodegas,
    detalle: "registradas en el condominio",
  },
  {
    key: "areas",
    icono: "pi pi-building",
    label: "Áreas comunes",
    valor: props.resumen.areasComunes,
    detalle: "espacios comunes",
  },
]);
</script>

<template>
  <section
    class="grid grid-cols-2 lg:grid-cols-4 gap-3"
    aria-label="Resumen real del condominio"
  >
    <div
      v-for="t in tarjetas"
      :key="t.key"
      class="bg-surface border border-border rounded-lg p-3 flex flex-col gap-1 min-w-0"
    >
      <div class="flex items-center gap-2 text-text-muted">
        <i :class="t.icono" aria-hidden="true" />
        <span class="text-xs font-semibold uppercase tracking-wide truncate">
          {{ t.label }}
        </span>
      </div>
      <span class="text-2xl font-bold leading-none text-text">
        {{ numero(t.valor) }}
      </span>
      <span class="text-xs text-text-muted truncate" :title="t.detalle">
        {{ t.detalle }}
      </span>
    </div>
  </section>
</template>
