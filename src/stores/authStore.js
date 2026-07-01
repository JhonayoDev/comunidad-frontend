import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "../services/api";
import { perfilService } from "../services/perfilService";
import { condominiosService } from "../services/condominiosService";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token") || null);
  const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
  const condominios = ref(
    JSON.parse(localStorage.getItem("condominios") || "[]"),
  );
  const condominioActual = ref(
    JSON.parse(localStorage.getItem("condominioActual") || "null"),
  );

  const isAuthenticated = computed(() => !!token.value);
  const hasMultipleCondominios = computed(() => condominios.value.length > 1);
  const userName = computed(
    () => user.value?.nombre || user.value?.email || "Usuario",
  );
  const condominioActualId = computed(() => condominioActual.value?.id || null);
  const condominioActualNombre = computed(
    () => condominioActual.value?.nombre || "",
  );
  const condominioActualRol = computed(
    () => condominioActual.value?.rolAcceso || null,
  );

  async function login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    const data = response.data;
    token.value = data.accessToken;
    localStorage.setItem("token", token.value);
    const perfil = await perfilService.getMiPerfil();
    user.value = {
      personaId: perfil.data.personaId,
      nombre: perfil.data.nombre,
      email: perfil.data.email,
      roles: perfil.data.roles,
    };
    localStorage.setItem("user", JSON.stringify(user.value));
    await fetchCondominios();
    if (condominios.value.length === 1) {
      seleccionarCondominio(condominios.value[0].id);
    }
  }

  async function fetchCondominios() {
    const response = await condominiosService.getCondominios();
    condominios.value = response.data;
    localStorage.setItem("condominios", JSON.stringify(condominios.value));
  }

  function seleccionarCondominio(id) {
    const encontrado = condominios.value.find((c) => c.id === id);
    if (encontrado) {
      condominioActual.value = encontrado;
      localStorage.setItem("condominioActual", JSON.stringify(encontrado));
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    condominios.value = [];
    condominioActual.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("condominios");
    localStorage.removeItem("condominioActual");
  }

  return {
    token,
    user,
    condominios,
    condominioActual,
    isAuthenticated,
    hasMultipleCondominios,
    userName,
    condominioActualId,
    condominioActualNombre,
    condominioActualRol,
    login,
    fetchCondominios,
    seleccionarCondominio,
    logout,
  };
});
