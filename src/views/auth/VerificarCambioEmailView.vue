<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { perfilService } from "@/services/perfilService";

import Card from "primevue/card";
import Button from "primevue/button";
import Message from "primevue/message";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const token = ref("");
const estado = ref("cargando");
const error = ref("");

function irAlLogin() {
  router.push({
    name: "Login",
    query: { redirect: route.fullPath },
  });
}

async function verificar() {
  estado.value = "verificando";
  try {
    await perfilService.verificarCambioEmail(token.value);
    await auth.logout();
    estado.value = "ok";
  } catch (e) {
    console.error("Error al verificar cambio de email", e);
    error.value =
      e.response?.status === 409
        ? e.response?.data?.message ||
          "El enlace expiró, ya fue utilizado o el email ya está registrado."
        : e.response?.data?.message ||
          "No se pudo confirmar el cambio de email.";
    estado.value = "error";
  }
}

onMounted(() => {
  token.value = String(route.query.token || "");
  if (!token.value) {
    error.value = "El enlace no incluye un token válido.";
    estado.value = "error";
    return;
  }
  if (!auth.isAuthenticated) {
    estado.value = "login";
    return;
  }
  verificar();
});
</script>

<template>
  <Card class="max-w-sm w-full bg-surface/75">
    <template #title>
      <div class="primary-text">Confirmar cambio de email</div>
    </template>

    <template #subtitle>
      <div class="secondary-text">
        Verifica el nuevo correo asociado a tu cuenta
      </div>
    </template>

    <template #content>
      <div class="primary-text flex flex-col gap-4 mt-3">
        <template v-if="estado === 'cargando' || estado === 'verificando'">
          <div class="flex items-center gap-2">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Verificando el cambio de email...</span>
          </div>
        </template>

        <template v-else-if="estado === 'login'">
          <Message severity="info" :closable="false">
            Inicia sesión con tu cuenta actual para confirmar el cambio. Después
            deberás usar el nuevo email.
          </Message>
          <Button
            label="Iniciar sesión"
            icon="pi pi-sign-in"
            fluid
            @click="irAlLogin"
          />
        </template>

        <template v-else-if="estado === 'ok'">
          <Message severity="success" :closable="false">
            Email actualizado correctamente. Inicia sesión con tu nuevo correo.
          </Message>
          <Button
            label="Ir al login"
            icon="pi pi-sign-in"
            fluid
            @click="router.push({ name: 'Login' })"
          />
        </template>

        <template v-else>
          <Message severity="error" :closable="false">
            {{ error }}
          </Message>
          <Button
            label="Volver al login"
            icon="pi pi-arrow-left"
            variant="text"
            fluid
            @click="router.push({ name: 'Login' })"
          />
        </template>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.primary-text {
  color: var(--color-text);
}
.secondary-text {
  color: var(--color-text-muted);
}
</style>
