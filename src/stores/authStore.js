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
  // Rol contextual del condominio (usuario_condominios o derivado del cargo),
  // distinto del rol global del JWT (`rolAcceso`). Es la fuente para elegir el
  // portal de trabajador/proveedor.
  const condominioActualRolContextual = computed(
    () => condominioActual.value?.rolContextual || null,
  );
  // Tipos de participación efectivos (PROPIETARIO, ARRENDATARIO,
  // DEPENDIENTE, TRABAJADOR, ADMINISTRACION, PROVEEDOR).
  const condominioActualTiposParticipacion = computed(
    () => condominioActual.value?.tiposParticipacion || [],
  );
  const esParticipacionResidencial = computed(() =>
    condominioActualTiposParticipacion.value.some((tipo) =>
      ["PROPIETARIO", "ARRENDATARIO", "DEPENDIENTE"].includes(tipo),
    ),
  );
  const condominioActualStatusPago = computed(
    () => condominioActual.value?.statusPago || null,
  );
  // false solo cuando el backend marca el condominio como suspendido. null
  // (versiones previas del resumen) se trata como operativo.
  const condominioActualAccesoOperativo = computed(
    () => condominioActual.value?.accesoOperativo !== false,
  );
  // Mismo criterio que ContactoFacturacionService del backend: rol
  // ADMINISTRADOR global o cargo ADMINISTRADOR/PRESIDENTE/TESORERO activo.
  const esContactoFacturacion = computed(() => {
    const rol = condominioActual.value?.rolAcceso;
    const cargo = condominioActual.value?.cargo;
    return (
      rol === "ADMINISTRADOR" ||
      ["ADMINISTRADOR", "PRESIDENTE", "TESORERO"].includes(cargo)
    );
  });

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
    trabajador: "TrabajadorDashboard",
    proveedor: "ProveedorDashboard",
  };

  const activeContext = ref("residente");

  /**
   * Contextos de participación disponibles. Un usuario puede ser residente y
   * trabajador a la vez; el portal de trabajador/proveedor solo aparece cuando
   * la API lo deriva (`rolContextual`) o la membresía lo indica.
   */
  const contextos = computed(() => {
    const list = [];
    const tipos = condominioActualTiposParticipacion.value;
    const cargo = condominioActualCargo.value;
    const rolContextual = condominioActualRolContextual.value;

    const esTrabajador = rolContextual === "TRABAJADOR";
    const esProveedor =
      rolContextual === "PROVEEDOR" || tipos.includes("PROVEEDOR");

    if (
      esParticipacionResidencial.value ||
      (!esTrabajador && !esProveedor && !cargo)
    ) {
      list.push({ key: "residente", label: "Residente" });
    }
    if (cargo && CARGO_LABELS[cargo]) {
      list.push({ key: cargo.toLowerCase(), label: CARGO_LABELS[cargo] });
    }
    if (esTrabajador) {
      list.push({ key: "trabajador", label: "Trabajador" });
    }
    if (esProveedor) {
      list.push({ key: "proveedor", label: "Proveedor" });
    }
    if (!list.length) list.push({ key: "residente", label: "Residente" });
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

    // Mantiene sincronizado el condominio activo con los campos nuevos del
    // resumen (statusPago/accesoOperativo), sin cambiar la selección.
    const actual = data.find((c) => c.id === condominioActual.value?.id);
    if (actual) {
      condominioActual.value = actual;
      localStorage.setItem("condominioActual", JSON.stringify(actual));
    } else if (condominioActual.value) {
      condominioActual.value = null;
      permisos.value = [];
      permisosRol.value = null;
      localStorage.removeItem("condominioActual");
    }
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
    // Portal inicial: si hay participación residencial el usuario entra como
    // residente; si no, al primer contexto disponible (cargo, trabajador o
    // proveedor). Los espacios de trabajo son separados y se cambian desde el
    // header con las píldoras de contexto.
    const tipos = encontrado.tiposParticipacion || [];
    const residencial = tipos.some((tipo) =>
      ["PROPIETARIO", "ARRENDATARIO", "DEPENDIENTE"].includes(tipo),
    );
    if (residencial) {
      activeContext.value = "residente";
    } else if (encontrado.cargo && CARGO_LABELS[encontrado.cargo]) {
      activeContext.value = encontrado.cargo.toLowerCase();
    } else if (encontrado.rolContextual === "TRABAJADOR") {
      activeContext.value = "trabajador";
    } else if (encontrado.rolContextual === "PROVEEDOR") {
      activeContext.value = "proveedor";
    } else {
      activeContext.value = "residente";
    }
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
    condominioActualRolContextual,
    condominioActualTiposParticipacion,
    esParticipacionResidencial,
    condominioActualCargo,
    condominioActualStatusPago,
    condominioActualAccesoOperativo,
    esContactoFacturacion,
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
