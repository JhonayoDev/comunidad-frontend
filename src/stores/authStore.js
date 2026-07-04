import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authService } from "@/services/authService";
import { accessToken } from "@/utils/tokenStore";
import { condominiosService } from "@/services/condominiosService";
import {
  scheduleProactiveRefresh,
  clearProactiveRefresh,
} from "@/utils/refreshScheduler";

export const useAuthStore = defineStore("auth", () => {
  // Datos de sesión — no contienen tokens
  const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
  const condominios = ref(
    JSON.parse(localStorage.getItem("condominios") || "[]"),
  );
  const condominioActual = ref(
    JSON.parse(localStorage.getItem("condominioActual") || "null"),
  );

  // ─── Computed ────────────────────────────────────────────────────────────────
  // isAuthenticated lee del ref reactivo → se actualiza automáticamente
  const isAuthenticated = computed(() => !!accessToken.value);
  const hasMultipleCondominios = computed(() => condominios.value.length > 1);
  const userName = computed(
    () => user.value?.nombre || user.value?.email || "Usuario",
  );
  const userRole = computed(
    () => condominioActual.value?.rolAcceso || user.value?.roles?.[0] || "",
  );
  const condominioActualId = computed(() => condominioActual.value?.id || null);
  const condominioActualNombre = computed(
    () => condominioActual.value?.nombre || "",
  );
  const condominioActualRol = computed(
    () => condominioActual.value?.rolAcceso || null,
  );

  // ─── Actions ─────────────────────────────────────────────────────────────────
  async function login(email, password) {
    const { data } = await authService.login(email, password);

    accessToken.value = data.accessToken;
    scheduleProactiveRefresh();

    user.value = {
      personaId: data.personaId,
      nombre: data.nombre,
      email: data.email,
      roles: data.roles,
    };
    localStorage.setItem("user", JSON.stringify(user.value));

    await fetchCondominios();

    if (condominios.value.length === 1) {
      seleccionarCondominio(condominios.value[0].id);
    }
  }

  // Al recargar la página el accessToken se pierde (era memoria).
  // Este método lo recupera usando la cookie httpOnly del browser.
  async function tryRestoreSession() {
    try {
      const { data } = await authService.refresh();
      accessToken.value = data.accessToken;
      scheduleProactiveRefresh();
      return true;
    } catch {
      clearSession();
      return false;
    }
  }

  async function fetchCondominios() {
    const { data } = await condominiosService.getCondominios();
    condominios.value = data;
    localStorage.setItem("condominios", JSON.stringify(data));
  }

  function seleccionarCondominio(id) {
    const encontrado = condominios.value.find((c) => c.id === id);
    if (!encontrado) return;
    condominioActual.value = encontrado;
    localStorage.setItem("condominioActual", JSON.stringify(encontrado));
  }

  async function logout() {
    try {
      await authService.logout(accessToken.value);
    } catch {
      // Si falla en el servidor, limpiamos igualmente en el cliente
    } finally {
      clearSession();
    }
  }

  function clearSession() {
    clearProactiveRefresh();
    accessToken.value = null;
    user.value = null;
    condominios.value = [];
    condominioActual.value = null;
    localStorage.removeItem("user");
    localStorage.removeItem("condominios");
    localStorage.removeItem("condominioActual");
  }

  return {
    user,
    condominios,
    condominioActual,
    isAuthenticated,
    hasMultipleCondominios,
    userName,
    userRole,
    condominioActualId,
    condominioActualNombre,
    condominioActualRol,
    login,
    tryRestoreSession,
    fetchCondominios,
    seleccionarCondominio,
    logout,
    clearSession,
  };
});
