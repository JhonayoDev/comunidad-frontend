import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authService } from "@/services/authService";
import api from "@/services/api";
import { accessToken } from "@/utils/tokenStore";
import { condominiosService } from "@/services/condominiosService";
import { permisosService } from "@/services/permisosService";
import {
  scheduleProactiveRefresh,
  clearProactiveRefresh,
} from "@/utils/refreshScheduler";
import { refrescarToken } from "@/utils/refreshCoordinator";
import { usePushNotifications } from "@/composables/usePushNotifications";

export const useAuthStore = defineStore("auth", () => {
  // Composable de notificaciones push — estado compartido reactivo
  const push = usePushNotifications();

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
  const condominioActualCargo = computed(
    () => condominioActual.value?.cargo || null,
  );

  // M3 (backend): un usuario es "solo-RESIDENTE" si tiene rol RESIDENTE y NO
  // tiene ninguno de los roles staff/admin (SUPER_ADMIN, SOPORTE, ADMINISTRADOR,
  // GUARDIA). En archivos, solo-RESIDENTE ve únicamente sus propios archivos.
  const esSoloResidente = computed(() => {
    const roles = user.value?.roles || [];
    const staff = ["SUPER_ADMIN", "SOPORTE", "ADMINISTRADOR", "GUARDIA"];
    return roles.includes("RESIDENTE") && !roles.some((r) => staff.includes(r));
  });

  const permisos = ref([]);
  const permisosRol = ref(null);

  const CARGO_LABELS = {
    PRESIDENTE: "Presidente",
    TESORERO: "Tesorero",
    SECRETARIO: "Secretario",
    DELEGADO: "Delegado",
    ADMINISTRADOR: "Administrador",
  };

  const CONTEXT_DASHBOARDS = {
    residente: "Inicio",
    presidente: "Dashboard",
    tesorero: "FinanzasDashboard",
    secretario: "Dashboard",
    delegado: "Dashboard",
    administrador: "Dashboard",
  };

  const activeContext = ref("residente");

  const contextos = computed(() => {
    const list = [{ key: "residente", label: "Residente" }];
    const cargo = condominioActualCargo.value;
    if (cargo && CARGO_LABELS[cargo]) {
      list.push({ key: cargo.toLowerCase(), label: CARGO_LABELS[cargo] });
    }
    return list;
  });

  const contextDashboard = computed(
    () => CONTEXT_DASHBOARDS[activeContext.value] || "Inicio",
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
    } else if (condominioActual.value?.id) {
      push.inicializar(condominioActual.value.id);
    }
  }

  // Al recargar la página el accessToken se pierde (era memoria).
  // Este método lo recupera usando la cookie httpOnly del browser.
  async function tryRestoreSession() {
    try {
      // Pasa por el coordinador: single-flight, actualiza IndexedDB (para el
      // Service Worker) y propaga el token por BroadcastChannel.
      await refrescarToken();
      // Cargar perfil y condominios después de restaurar el token
      const meRes = await api.get("/me");
      user.value = {
        personaId: meRes.data.personaId,
        nombre: meRes.data.nombre,
        email: meRes.data.email,
        roles: meRes.data.roles,
      };
      localStorage.setItem("user", JSON.stringify(user.value));
      await fetchCondominios();
      if (condominios.value.length === 1) {
        seleccionarCondominio(condominios.value[0].id);
      } else if (condominioActual.value?.id) {
        fetchPermisos(condominioActual.value.id);
        push.inicializar(condominioActual.value.id);
      }
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

  function setActiveContext(ctx) {
    activeContext.value = ctx;
  }

  async function fetchPermisos(cid) {
    if (!cid) {
      permisos.value = [];
      permisosRol.value = null;
      return;
    }
    try {
      const { data } = await permisosService.getPermisos(cid);
      permisos.value = data.permisos || [];
      permisosRol.value = data.rolEnCondominio || null;
    } catch (e) {
      console.error("Error al cargar permisos:", e);
      permisos.value = [];
      permisosRol.value = null;
    }
  }

  function seleccionarCondominio(id) {
    const encontrado = condominios.value.find((c) => c.id === id);
    if (!encontrado) return;
    condominioActual.value = encontrado;
    activeContext.value = "residente";
    localStorage.setItem("condominioActual", JSON.stringify(encontrado));

    fetchPermisos(encontrado.id);

    // Re-inicializar push con el nuevo condominio si ya hay sesión activa
    if (accessToken.value && encontrado?.id) {
      push.inicializar(encontrado.id);
    }
  }

  async function logout() {
    try {
      // Dar de baja push antes de limpiar la sesión
      await push.destruir();
      await authService.logout(accessToken.value);
    } catch {
      // Si falla en el servidor, limpiamos igualmente en el cliente
    } finally {
      clearSession();
    }
  }

  function clearSession() {
    clearProactiveRefresh();
    push.destruir();
    accessToken.value = null;
    user.value = null;
    condominios.value = [];
    condominioActual.value = null;
    permisos.value = [];
    permisosRol.value = null;
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
    condominioActualCargo,
    esSoloResidente,
    permisos,
    permisosRol,
    fetchPermisos,
    activeContext,
    contextos,
    contextDashboard,
    setActiveContext,
    login,
    tryRestoreSession,
    fetchCondominios,
    seleccionarCondominio,
    logout,
    clearSession,
  };
});
