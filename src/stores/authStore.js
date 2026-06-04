import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "../services/api";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token") || null);
  const user = ref(JSON.parse(localStorage.getItem("user") || "null"));

  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role || null);

  async function login(email, password) {
    const response = await api.post("/auth", { email, password });
    token.value = response.data.token;

    // Decodifica el payload del JWT para extraer email y rol
    const payload = JSON.parse(atob(token.value.split(".")[1]));
    user.value = {
      email: payload.sub,
      role: payload.role,
    };

    localStorage.setItem("token", token.value);
    localStorage.setItem("user", JSON.stringify(user.value));
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  return { token, user, isAuthenticated, userRole, login, logout };
});
