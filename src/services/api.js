import axios from "axios";
import { accessToken } from "@/utils/tokenStore";
import {
  scheduleProactiveRefresh,
  refrescarToken,
} from "@/utils/refreshCoordinator";
import { esErrorModuloNoContratado } from "@/utils/errores";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// ─── Cola de requests concurrentes durante el refresh ─────────────────────────
// Si llegan 3 requests simultáneos y el token expiró, solo uno dispara
// el refresh; los otros dos esperan en cola y se reenvían con el nuevo token.
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token),
  );
  refreshQueue = [];
}

// ─── Interceptor de request ───────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (accessToken.value) {
    config.headers.Authorization = `Bearer ${accessToken.value}`;
  }
  return config;
});

// ─── Interceptor de response ──────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    // Cada respuesta exitosa reinicia el timer preventivo
    scheduleProactiveRefresh();
    return response;
  },
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthEndpoint = original?.url?.startsWith("/auth/");

    // ── 403 por módulo no contratado ─────────────────────────────────────
    // El gating @RequiresModule responde 403 con message "El condominio no
    // tiene suscrito el módulo X". No es un error del usuario final ni debe
    // detener la app: se enriquece el error con la bandera moduleNotSubscribed
    // y cada vista decide cómo degradar (ocultar/deshabilitar el módulo).
    if (status === 403) {
      if (esErrorModuloNoContratado(error)) {
        error.moduleNotSubscribed = true;
      }
      return Promise.reject(error);
    }

    // ── Rate limiting ───────────────────────────────────────────────────
    // Si el backend responde 429, propagamos el error tal cual para que
    // la UI pueda leer Retry-After y mostrar el mensaje adecuado.
    if (status === 429) {
      return Promise.reject(error);
    }

    // ── 401 en endpoint de auth → no reintentar, propagar tal cual ──────
    if (status !== 401 || isAuthEndpoint || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Single-flight: si el timer proactivo o el visibilitychange ya están
      // refrescando, esperamos la MISMA promesa en lugar de disparar otro
      // /auth/refresh (evita el reuse-detection que revoca la sesión).
      const token = await refrescarToken();

      processQueue(null, token);
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      console.error(
        "[api] Refresh tras 401 falló. Cerrando sesión:",
        refreshError?.response?.status,
        refreshError?.response?.data?.message || refreshError?.message,
      );
      processQueue(refreshError, null);
      accessToken.value = null;

      localStorage.removeItem("user");
      localStorage.removeItem("condominios");
      localStorage.removeItem("condominioActual");

      // Pasar el mensaje de error a la pantalla de login
      const msg =
        refreshError?.response?.data?.message ||
        "Sesión cerrada por seguridad. Inicia sesión nuevamente";
      sessionStorage.setItem("loginError", msg);

      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
