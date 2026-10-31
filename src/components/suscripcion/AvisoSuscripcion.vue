<script setup>
import { ref } from "vue";
import Message from "primevue/message";
import Dialog from "primevue/dialog";
import AppButton from "@/components/common/AppButton.vue";

defineProps({
  aviso: { type: Object, required: true },
});

const mostrarSoporte = ref(false);
const emailSoporte = import.meta.env.VITE_SUPPORT_EMAIL || "";
</script>

<template>
  <Message :severity="aviso.severidad || 'info'" :closable="false">
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
      <span class="flex-1 text-sm">{{ aviso.mensaje }}</span>
      <AppButton
        v-if="aviso.cta"
        intencion="secundaria"
        :label="aviso.cta"
        @click="mostrarSoporte = true"
      />
    </div>
  </Message>

  <Dialog
    v-model:visible="mostrarSoporte"
    modal
    header="Contactar soporte"
    :style="{ width: 'min(28rem, 92vw)' }"
  >
    <div class="flex flex-col gap-3 text-sm">
      <p class="m-0">
        Para regularizar el pago o reactivar el servicio, contacta al equipo de
        soporte de Briku.
      </p>
      <p v-if="emailSoporte" class="m-0">
        Escríbenos a
        <a :href="`mailto:${emailSoporte}`" class="text-primary font-medium">{{
          emailSoporte
        }}</a
        >.
      </p>
      <p v-else class="m-0 text-text-subprincipal">
        El canal de contacto estará disponible próximamente. Mientras tanto,
        comunícate con el administrador de tu condominio.
      </p>
    </div>
    <template #footer>
      <AppButton
        intencion="primaria"
        label="Entendido"
        @click="mostrarSoporte = false"
      />
    </template>
  </Dialog>
</template>
