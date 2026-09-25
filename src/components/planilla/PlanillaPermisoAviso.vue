<script setup>
import Message from "primevue/message";

defineProps({
  rol: { type: String, default: "" },
  cargo: { type: String, default: "" },
});
</script>

<template>
  <Message severity="warn" :closable="false" class="m-0 mt-4">
    No tienes permiso para importar planilla (<code>IMPORTACION_DATOS</code>).
    Tu rol es <strong>{{ rol || "—" }}</strong
    ><template v-if="cargo">, cargo <strong>{{ cargo }}</strong></template>.
    Contacta al <strong>SUPER_ADMIN</strong> para que te asigne el permiso en tu rol/cargo. Solo ADMINISTRADOR (rol) y cargos ADMINISTRADOR/PRESIDENTE/SECRETARIO pueden importar.
  </Message>
</template>
