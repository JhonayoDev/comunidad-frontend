<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authStore";

import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import Message from "primevue/message";

const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

// Mostrar error proveniente del interceptor 401 (sesión expirada, reuse detection, etc.)
onMounted(() => {
  const storedError = sessionStorage.getItem("loginError");
  if (storedError) {
    error.value = storedError;
    sessionStorage.removeItem("loginError");
  }
});

async function handleLogin(event) {
  if (event?.target) {
    event.target.blur();
  }

  loading.value = true;
  error.value = "";

  try {
    await auth.login(email.value, password.value);

    if (auth.condominios.length === 0) {
      error.value = "No tienes acceso a ningún condominio";
      return;
    }
    if (auth.user.roles.includes("SUPER_ADMIN")) {
      router.push({ name: "SuperAdminDashboard" });
    } else if (auth.condominioActualRol === "ADMINISTRADOR") {
      router.push({ name: "Dashboard" });
    } else if (auth.condominioActualRol === "GUARDIA") {
      router.push({ name: "GuardiaDashboard" });
    } else {
      router.push({ name: "Inicio" });
    }
  } catch (e) {
    const status = e.response?.status;
    const data = e.response?.data;
    const retryAfter = e.response?.headers?.["retry-after"];

    if (status === 429) {
      if (retryAfter) {
        error.value = `Demasiados intentos. Intenta en ${retryAfter} segundos`;
      } else {
        error.value =
          "Demasiados intentos. Espera un momento e intenta nuevamente";
      }
    } else if (status === 401) {
      const msg = data?.message || "";
      if (
        msg.toLowerCase().includes("inactiva") ||
        msg.toLowerCase().includes("desactivad")
      ) {
        error.value = "Cuenta desactivada. Contacta al administrador";
      } else {
        error.value = "Credenciales incorrectas";
      }
    } else {
      error.value = data?.message ?? "Error al iniciar sesión";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Card class="max-w-sm w-full bg-surface/75">
    <template #title> <div class="primary-text">Comunidad</div> </template>

    <template #subtitle>
      <div class="secondary-text">Sistema de gestión de condominios</div>
    </template>

    <template #content>
      <form @submit.prevent="handleLogin($event)" class="space-y-6 mt-3">
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
        <div class="primary-text flex flex-col gap-2">
          <label>Contraseña</label>
          <Password v-model="password" :feedback="false" toggleMask fluid />
          <RouterLink
            to="/recuperar-password"
            class="text-info hover:underline duration-200"
          >
            ¿Olvidaste tu contraseña?
          </RouterLink>
        </div>

        <Message v-if="error" severity="error">
          {{ error }}
        </Message>

        <!-- Botón estándar de PrimeVue: responderá perfectamente en celular y PC -->
        <Button
          type="submit"
          label="Ingresar"
          icon="pi pi-sign-in"
          :loading="loading"
          fluid
        />
      </form>
    </template>
  </Card>
</template>
<style scoped>
.primary-text {
  color: var(--p-primary-text-principal);
}
.secondary-text {
  color: var(--p-primary-text-secondary);
}
</style>
