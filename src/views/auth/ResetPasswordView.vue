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
  token.value = route.query.token || "";
});

async function handleSubmit() {
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
    await authService.resetPassword({
      token: token.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    });
    success.value = true;
  } catch (e) {
    const status = e.response?.status;
    if (status === 409) {
      error.value =
        "El enlace ha expirado o ya fue utilizado. Solicita uno nuevo";
    } else {
      error.value =
        e.response?.data?.message || "Error al restablecer la contraseña";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Card class="max-w-sm w-full bg-surface">
    <template #title> Restablecer contraseña </template>

    <template #subtitle> Ingresa tu nueva contraseña </template>

    <template #content>
      <form v-if="!success" @submit.prevent="handleSubmit" class="space-y-6 mt-3">
        <div class="flex flex-col gap-2">
          <label>Nueva contraseña</label>
          <Password v-model="newPassword" :feedback="true" toggleMask fluid />
        </div>
        <div class="flex flex-col gap-2">
          <label>Confirmar contraseña</label>
          <Password
            v-model="confirmPassword"
            :feedback="false"
            toggleMask
            fluid
          />
        </div>

        <Message v-if="error" severity="error">
          {{ error }}
        </Message>

        <Button
          type="submit"
          label="Restablecer"
          icon="pi pi-check"
          :loading="loading"
          fluid
        />
        <Button
          label="Volver al login"
          icon="pi pi-arrow-left"
          variant="text"
          fluid
          @click="router.push({ name: 'Login' })"
        />
      </form>
      <div v-else class="flex flex-col items-center gap-3">
        <Message severity="success">
          Contraseña restablecida exitosamente. Ahora puedes iniciar sesión con
          tu nueva contraseña.
        </Message>
        <Button
          label="Ir al login"
          icon="pi pi-sign-in"
          fluid
          @click="router.push({ name: 'Login' })"
        />
      </div>
    </template>
  </Card>
</template>

<style scoped></style>
