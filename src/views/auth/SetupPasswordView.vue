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
    await authService.setupPassword({
      token: token.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    });
    success.value = true;
  } catch (e) {
    const status = e.response?.status;
    if (status === 409) {
      error.value = "El enlace ha expirado o ya fue utilizado. Solicita uno nuevo";
    } else {
      error.value = e.response?.data?.message || "Error al establecer la contraseña";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="setup-container">
    <Card class="setup-card">
      <template #title> Establecer contraseña </template>
      <template #subtitle> Crea una contraseña para tu cuenta </template>
      <template #content>
        <form v-if="!success" @submit.prevent="handleSubmit" class="setup-form">
          <div class="field">
            <label>Nueva contraseña</label>
            <Password v-model="newPassword" :feedback="true" toggleMask fluid />
          </div>
          <div class="field">
            <label>Confirmar contraseña</label>
            <Password v-model="confirmPassword" :feedback="false" toggleMask fluid />
          </div>
          <Message v-if="error" severity="error">{{ error }}</Message>
          <Button type="submit" label="Establecer" icon="pi pi-check" :loading="loading" fluid />
          <Button label="Volver al login" icon="pi pi-arrow-left" variant="text" fluid @click="router.push({ name: 'Login' })" />
        </form>
        <div v-else class="flex flex-column align-items-center gap-3">
          <Message severity="success">
            Contraseña establecida exitosamente. Ahora puedes iniciar sesión.
          </Message>
          <Button label="Ir al login" icon="pi pi-sign-in" fluid @click="router.push({ name: 'Login' })" />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.setup-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--color-blue-200);
}
.setup-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-indigo-700);
}
.setup-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
