<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { authService } from "@/services/authService";

import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Message from "primevue/message";

const router = useRouter();
const email = ref("");
const loading = ref(false);
const error = ref("");
const enviado = ref(false);

async function handleSubmit() {
  loading.value = true;
  error.value = "";
  try {
    await authService.forgotPassword(email.value);
    enviado.value = true;
  } catch {
    error.value = "Error al enviar el correo. Intenta nuevamente";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Card class="max-w-m w-full bg-surface/75">
    <template #title>
      <div class="primary-text">Recuperar contraseña</div>
    </template>

    <template #subtitle>
      <div class="secondary-text">
        Ingresa tu email para recibir un enlace de restablecimiento
      </div>
    </template>

    <template #content>
      <form
        v-if="!enviado"
        @submit.prevent="handleSubmit"
        class="space-y-6 mt-3"
      >
        <div class="primary-text flex flex-col gap-2">
          <label>Email</label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            fluid
            placeholder="usuario@comunidad.cl"
          />
        </div>

        <Message v-if="error" severity="error">
          {{ error }}
        </Message>

        <Button
          type="submit"
          label="Enviar enlace"
          icon="pi pi-send"
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
        <Message severity="success">
          Si el email está registrado, recibirás un enlace para restablecer tu
          contraseña.
        </Message>
        <Button
          class="primary-text"
          label="Volver al login"
          icon="pi pi-arrow-left"
          fluid
          @click="router.push({ name: 'Login' })"
        />
      </div>
    </template>
  </Card>
</template>

<style scoped>
.primary-text {
  color: var(--p-surface-900);
}
.secondary-text {
  color: var(--p-surface-600);
}
</style>
