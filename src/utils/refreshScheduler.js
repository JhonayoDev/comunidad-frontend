/**
 * refreshScheduler.js
 *
 * Punto de entrada retrocompatible del refresco proactivo.
 *
 * La lógica real ahora vive en refreshCoordinator.js (single-flight + Web Locks
 * + refresh preventivo en visibilitychange + sincronización con IndexedDB y
 * BroadcastChannel). Este módulo re-exporta sus funciones para no romper los
 * imports existentes (api.js, authStore.js).
 */
export {
  scheduleProactiveRefresh,
  clearProactiveRefresh,
} from "@/utils/refreshCoordinator";
