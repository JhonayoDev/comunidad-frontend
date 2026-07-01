import { defineStore } from "pinia";
import { ref, computed } from "vue";

import api from "../services/api";
import { perfilService } from "../services/perfilService";
import { condominiosService } from "../services/condominiosService";

import { getAccessToken, saveTokens, clearTokens } from "../utils/tokenStorage";

export const useAuthStore = defineStore("auth", () => {
  /**
   * Estado
   */
  const accessToken = ref(getAccessToken() || null);

  const user = ref(JSON.parse(localStorage.getItem("user") || "null"));

  const condominios = ref(
    JSON.parse(localStorage.getItem("condominios") || "[]"),
  );

  const condominioActual = ref(
    JSON.parse(localStorage.getItem("condominioActual") || "null"),
  );

  /**
   * Computed
   */
  const isAuthenticated = computed(() => !!accessToken.value);

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

  /**
   * Actualiza el Access Token del estado.
   *
   * El almacenamiento persistente se realiza mediante tokenStorage.
   */
  function setAccessToken(token) {
    accessToken.value = token;
  }

  /**
   * Login
   */
  async function login(email, password) {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const data = response.data;

    setAccessToken(data.accessToken);
    saveTokens(data);

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

  /**
   * Obtiene condominios del usuario.
   */
  async function fetchCondominios() {
    const response = await condominiosService.getCondominios();

    condominios.value = response.data;

    localStorage.setItem("condominios", JSON.stringify(condominios.value));
  }

  /**
   * Selecciona el condominio activo.
   */
  function seleccionarCondominio(id) {
    const encontrado = condominios.value.find((c) => c.id === id);

    if (encontrado) {
      condominioActual.value = encontrado;

      localStorage.setItem("condominioActual", JSON.stringify(encontrado));
    }
  }

  /**
   * Cierra la sesión.
   */
  function logout() {
    setAccessToken(null);

    user.value = null;
    condominios.value = [];
    condominioActual.value = null;

    clearTokens();

    localStorage.removeItem("user");
    localStorage.removeItem("condominios");
    localStorage.removeItem("condominioActual");
  }

  return {
    // Estado
    accessToken,
    user,
    condominios,
    condominioActual,

    // Computed
    isAuthenticated,
    hasMultipleCondominios,
    userName,
    condominioActualId,
    condominioActualNombre,
    condominioActualRol,

    // Acciones
    login,
    logout,
    fetchCondominios,
    seleccionarCondominio,
  };
});
