<script setup>
import { useRoute } from "vue-router";
import Card from "primevue/card";
import Button from "primevue/button";

const route = useRoute();
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <h1 class="text-xl font-bold m-0">Búsqueda e Información</h1>
    <Card>
      <template #content>
        <div class="flex flex-col items-center gap-3 py-6 text-center">
          <i class="pi pi-building text-4xl" style="color: var(--p-primary-400)"></i>
          <p class="text-surface-500 m-0 max-w-md">
            Esta sección está en construcción. Próximamente podrás consultar información detallada de
            propietarios, residentes, vehículos y unidades del condominio.
          </p>
          <p v-if="route.query.patente" class="text-sm text-surface-400 m-0">
            Búsqueda relacionada: <strong>{{ route.query.patente }}</strong>
          </p>
          <Button label="Entendido" icon="pi pi-check" severity="secondary" @click="$router.back()" />
        </div>
      </template>
    </Card>
  </div>
</template>
