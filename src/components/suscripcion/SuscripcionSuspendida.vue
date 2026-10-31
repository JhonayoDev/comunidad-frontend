<script setup>
import Card from "primevue/card";
import AvisoSuscripcion from "./AvisoSuscripcion.vue";

defineProps({
  aviso: { type: Object, default: null },
  estado: { type: Object, default: null },
});
</script>

<template>
  <div class="flex justify-center p-4">
    <Card class="w-full max-w-2xl">
      <template #content>
        <div class="flex flex-col gap-4">
          <div class="flex items-start gap-3">
            <i class="pi pi-lock text-3xl text-danger" />
            <div>
              <h1 class="text-xl font-bold m-0">Servicio suspendido</h1>
              <p class="m-0 text-sm text-text-subprincipal">
                El acceso operativo del condominio está pausado por pago
                pendiente.
              </p>
            </div>
          </div>

          <AvisoSuscripcion v-if="aviso" :aviso="aviso" />

          <p class="m-0 text-sm">
            El acceso se restablecerá automáticamente al registrar el pago. Si
            ya lo realizaste, contacta a soporte para revisar el estado de tu
            suscripción.
          </p>
        </div>
      </template>
    </Card>
  </div>
</template>
