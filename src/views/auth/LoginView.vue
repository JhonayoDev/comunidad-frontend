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

async function handleLogin() {
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
        error.value = "Demasiados intentos. Espera un momento e intenta nuevamente";
      }
    } else if (status === 401) {
      const msg = data?.message || "";
      if (msg.toLowerCase().includes("inactiva") || msg.toLowerCase().includes("desactivad")) {
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
  <div class="login-container">
    <Card class="login-card">
      <template #title> Comunidad </template>

      <template #subtitle> Sistema de gestión de condominios </template>

      <template #content>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="field">
            <label>Email</label>

            <InputText
              v-model="email"
              type="email"
              fluid
              placeholder="usuario@comunidad.cl"
            />
          </div>

          <div class="field">
            <label>Contraseña</label>

            <Password v-model="password" :feedback="false" toggleMask fluid />
          </div>

          <RouterLink to="/recuperar-password" class="forgot-link">
            ¿Olvidaste tu contraseña?
          </RouterLink>

          <Message v-if="error" severity="error">
            {{ error }}
          </Message>

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
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--color-blue-200);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-indigo-700);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.forgot-link {
  text-align: right;
  font-size: 0.85rem;
}
</style>
