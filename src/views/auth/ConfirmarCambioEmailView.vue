<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { authService } from "@/services/authService";

import Card from "primevue/card";
import Password from "primevue/password";
import Button from "primevue/button";
import Message from "primevue/message";

const route = useRoute();
const router = useRouter();

const token = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");
const success = ref(false);

onMounted(() => {
  token.value = String(route.query.token || "");
  if (!token.value) {
    error.value = "El enlace no incluye un token válido.";
  }
});

async function handleSubmit() {
  if (!token.value) {
    error.value = "El enlace no incluye un token válido.";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = "Las contraseñas no coinciden";
    return;
  }
  if (newPassword.value.length < 8) {
    error.value = "La contraseña debe tener al menos 8 caracteres";
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    await authService.confirmarCambioEmail({
      token: token.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    });
    success.value = true;
  } catch (e) {
    console.error("Error al confirmar cambio de email", e);
    const status = e.response?.status;
    if (status === 409) {
      error.value =
        e.response?.data?.message ||
        "El enlace expiró, ya fue utilizado o el email ya está registrado.";
    } else {
      error.value =
        e.response?.data?.message || "Error al confirmar el cambio de email";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Card class="max-w-sm w-full bg-surface/75">
    <template #title>
      <div class="primary-text">Confirma tu nuevo email</div>
    </template>

    <template #subtitle>
      <div class="secondary-text">
        Verifica el correo y define una nueva contraseña para tu cuenta
      </div>
    </template>

    <template #content>
      <form
        v-if="!success"
        class="space-y-6 max-sm:space-y-4 mt-3"
        @submit.prevent="handleSubmit"
      >
        <Message severity="info" :closable="false">
          Al confirmar, el email de tu cuenta se actualizará y deberás usar el
          nuevo correo para iniciar sesión.
        </Message>

        <div class="primary-text flex flex-col gap-2">
          <label for="cambio-email-password">Nueva contraseña</label>
          <Password
            id="cambio-email-password"
            v-model="newPassword"
            :feedback="true"
            toggleMask
            fluid
            autocomplete="new-password"
          />
        </div>
        <div class="primary-text flex flex-col gap-2">
          <label for="cambio-email-password-confirm">Confirmar contraseña</label>
          <Password
            id="cambio-email-password-confirm"
            v-model="confirmPassword"
            :feedback="false"
            toggleMask
            fluid
            autocomplete="new-password"
          />
        </div>

        <Message v-if="error" severity="error" :closable="false">
          {{ error }}
        </Message>

        <Button
          type="submit"
          label="Confirmar cambio"
          icon="pi pi-check"
          :loading="loading"
          fluid
        />
        <Button
          class="primary-text"
          label="Volver al login"
          icon="pi pi-arrow-left"
          variant="text"
          fluid
          @click="router.push({ name: 'Login' })"
        />
      </form>
      <div v-else class="primary-text flex flex-col items-center gap-3">
        <Message severity="success" :closable="false">
          Email y contraseña actualizados correctamente. Ya puedes iniciar
          sesión con tu nuevo correo.
        </Message>
        <Button
          class="primary-text"
          label="Ir al login"
          icon="pi pi-sign-in"
          fluid
          @click="router.push({ name: 'Login' })"
        />
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
