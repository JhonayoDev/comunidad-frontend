<template>
  <div class="p-4 flex flex-col gap-4">
    <h2 class="text-lg font-bold">Solicitudes</h2>

    <Card>
      <template #content>
        <div class="flex flex-col items-center gap-3 py-6 text-center">
          <i class="pi pi-building text-4xl" style="color: var(--p-primary-400)"></i>
          <div>
            <p class="text-lg font-medium m-0">Módulo en construcción</p>
            <p class="text-sm text-surface-500 m-0 mt-1">
              Las solicitudes de registro estarán disponibles próximamente.
            </p>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import Card from "primevue/card";
</script>
