import { authService } from "@/services/authService";
import { accessToken } from "@/utils/tokenStore";

// El accessToken dura 15 min. A los 14 min se refresca en silencio
// para que el usuario nunca experimente un 401 por expiración normal.
let refreshTimer = null;

export function scheduleProactiveRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(
    async () => {
      try {
        const { data } = await authService.refresh();
        accessToken.value = data.accessToken;
      } catch {
        // Si falla, el interceptor de 401 manejará el próximo request
      }
    },
    14 * 60 * 1000,
  );
}

export function clearProactiveRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = null;
}
