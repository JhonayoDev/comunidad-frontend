<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Comunidad</h1>
      <p class="subtitle">Sistema de gestión de condominio</p>

      <form @submit.prevent="handleLogin">
        <div class="field">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="usuario@comunidad.cl"
            autocomplete="email"
            required
          />
        </div>

        <div class="field">
          <label>Contraseña</label>
          <div class="input-wrapper">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? "🙈" : "👁️" }}
            </button>
          </div>
        </div>
        <a href="/recuperar-password" class="forgot-link"
          >¿Olvidaste tu contraseña?</a
        >
        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? "Ingresando..." : "Ingresar" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authStore";

const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");
const showPassword = ref(false);

async function handleLogin() {
  loading.value = true;
  error.value = "";
  try {
    await auth.login(email.value, password.value);
    router.push({ name: "Dashboard" });
  } catch (e) {
    error.value = e.response?.data?.message || "Error al iniciar sesión";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
}
.login-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 380px;
}
h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #1e40af;
}
.subtitle {
  color: #64748b;
  margin-top: 4px;
  margin-bottom: 2rem;
}
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}
label {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: #374151;
}
input {
  padding: 0.6rem 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
}
input:focus {
  border-color: #1e40af;
}
button {
  width: 100%;
  padding: 0.75rem;
  background: #1e40af;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 0.5rem;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error {
  color: #dc2626;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.input-wrapper input {
  flex: 1;
  padding-right: 2.5rem;
}
.toggle-password {
  position: absolute;
  right: 0.5rem;
  width: auto;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 0;
  padding: 0;
  color: #64748b;
}
.forgot-link {
  display: block;
  text-align: right;
  font-size: 0.8rem;
  color: #1e40af;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
  text-decoration: none;
}
.forgot-link:hover {
  text-decoration: underline;
}
</style>
