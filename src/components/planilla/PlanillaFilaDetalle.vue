<script setup>
// Detalle expandible de una fila del preview/resultado (FE-2).
// Presentacional: recibe textos ya resumidos (ver src/utils/planillaResumen.js).
// `advertencias[]` null se trata como vacío (BE-4 pendiente).
defineProps({
  errores: { type: Array, default: () => [] },
  advertencias: { type: Array, default: () => [] },
  vehiculosTxt: { type: String, default: "" },
  estacionamientosTxt: { type: String, default: "" },
  bodegasTxt: { type: String, default: "" },
  esAdicional: { type: Boolean, default: false },
  // F1: estado de la fila (OK/ERROR/OMITIDA). El motivo de OMITIDA se muestra
  // como informativo (no hay nada que corregir) y "Se vinculará" solo en OK.
  estado: { type: String, default: "OK" },
});
</script>

<template>
  <div class="flex flex-col gap-2 p-2 text-sm text-left">
    <div v-if="estado === 'ERROR' && (errores || []).length">
      <p class="m-0 mb-1 font-semibold text-danger">
        <i class="pi pi-times-circle" /> Errores (corrige antes de importar):
      </p>
      <ul class="m-0 pl-4 text-danger">
        <li v-for="(e, ei) in errores" :key="ei">{{ e }}</li>
      </ul>
    </div>
    <div v-else-if="(errores || []).length">
      <p class="m-0 text-text-muted">
        <i class="pi pi-info-circle" /> {{ errores.join("; ") }}
      </p>
    </div>
    <div v-if="(advertencias || []).length">
      <p class="m-0 mb-1 font-semibold text-amber-500">
        <i class="pi pi-exclamation-triangle" /> Advertencias:
      </p>
      <ul class="m-0 pl-4">
        <li v-for="(a, ai) in advertencias" :key="ai">{{ a }}</li>
      </ul>
      <p class="m-0 mt-1 text-xs text-text-muted">
        Este email ya está registrado como persona: en el import se usarán los
        valores de la base de datos. Para modificarlos, edita a la persona en Residentes.
      </p>
    </div>
    <div v-if="estado === 'OK' && (vehiculosTxt || estacionamientosTxt || bodegasTxt)">
      <p class="m-0 mb-1 font-semibold">Se vinculará:</p>
      <p class="m-0 text-xs">
        Vehículos: {{ vehiculosTxt || "—" }} · Estacionamientos:
        {{ estacionamientosTxt || "—" }} · Bodegas: {{ bodegasTxt || "—"
        }}<span v-if="esAdicional">
          (se ignoran: el vínculo es RESIDENTE_ADICIONAL)</span
        >.
      </p>
    </div>
  </div>
</template>
