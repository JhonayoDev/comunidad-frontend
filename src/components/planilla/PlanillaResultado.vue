<script setup>
// Solo presenta el resultado del guardar/importar. Sin api directa.
defineProps({
  resultado: { type: Object, default: null },
  previewFilasError: { type: Number, default: null },
});
</script>

<template>
  <p v-if="resultado" class="text-sm text-green-500 mt-2 m-0">
    Planilla guardada:
    {{ resultado.filasOk ?? resultado.creadas }} filas
    nuevas · {{ resultado.actualizadas }} actualizadas ·
    {{ resultado.eliminadas }} eliminadas ·
    {{ resultado.personasCreadas ?? 0 }} personas ·
    {{ resultado.vinculosCreados ?? 0 }} vínculos ·
    {{ resultado.vehiculosCreados ?? 0 }} vehículos ·
    {{ resultado.estacionamientosVinculados ?? 0 }}
    estacionamientos ·
    {{ resultado.bodegasVinculadas ?? 0 }} bodegas. Paso
    completado.
  </p>
  <p v-else-if="previewFilasError !== null" class="text-sm text-amber-500 mt-2 m-0">
    La previsualización detectó {{ previewFilasError }} fila(s) con
    error. Vuelve a editar o corrige el archivo.
  </p>
</template>
