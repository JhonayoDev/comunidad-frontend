<script setup>
import Card from "primevue/card";

// Recordatorio de verificación (footer del lab).
const PUNTOS = [
  "Revisa cada sección en claro y oscuro con el interruptor de arriba.",
  "Repite en ancho móvil (390 px): nada debe desbordar ni taparse.",
  "Todo botón nuevo usa AppButton + intención del catálogo (nada de severity/variant a mano).",
  "Nada de style inline ni clases de color en vistas: el estilo sale del tema.",
  "¿Algo no calza con el catálogo? Ve al issue #37 (desviaciones) o propone intención nueva.",
  "Esta ruta solo existe en DEV: nunca entra al build de producción.",
];
</script>

<template>
  <Card class="mt-6">
    <template #title>
      <span class="text-base font-bold">Verificación (recordatorio)</span>
    </template>
    <template #content>
      <ul class="m-0 pl-5 text-sm text-text-muted flex flex-col gap-1">
        <li v-for="(punto, i) in PUNTOS" :key="i">{{ punto }}</li>
      </ul>
    </template>
  </Card>
</template>
