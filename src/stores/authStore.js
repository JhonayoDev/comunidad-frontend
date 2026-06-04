import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "../services/api";
import { perfilService } from "../services/perfilService";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token") || null);
  const user = ref(JSON.parse(localStorage.getItem("user") || "null"));

  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role || null);
  const userName = computed(
    () => user.value?.nombre || user.value?.email || "Usuario",
  );

  async function login(email, password) {
    const response = await api.post("/auth", { email, password });
    token.value = response.data.token;

    // Guardamos el token primero para que el interceptor lo adjunte
    localStorage.setItem("token", token.value);

    // Llamamos a /me para obtener los datos completos del usuario
    const perfil = await perfilService.getMiPerfil();
    user.value = {
      id: perfil.data.id,
      nombre: perfil.data.nombre,
      email: perfil.data.email,
      role: perfil.data.role,
    };

    localStorage.setItem("user", JSON.stringify(user.value));
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  return { token, user, isAuthenticated, userRole, userName, login, logout };
});
