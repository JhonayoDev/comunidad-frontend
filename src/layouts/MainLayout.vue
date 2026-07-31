<template>
  <div class="min-h-screen relative overflow-hidden flex flex-col">
    <!-- Imagen de fondo -->
    <div
      class="absolute inset-0 bg-cover bg-center bg-fixed blur-md"
      :style="{ backgroundImage: `url(${fondoweb})` }"
    />

    <!-- Overlay SOLO sobre la imagen -->
    <div class="absolute inset-0 bg-background opacity-35" />

    <!-- Contenido -->
    <div class="relative z-10 flex min-h-screen flex-col">
      <AppHeader />
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
      <AppFooter />
    </div>

    <!-- Banner de invitación a notificaciones push -->
    <NotificationBanner @activado="onBannerActivado" />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watchEffect } from "vue";
import { useRouter } from "vue-router";
import fondoweb from "@/assets/fondoweb.webp";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import NotificationBanner from "@/components/NotificationBanner.vue";
import { useAuthStore } from "@/stores/authStore";
import {
  iniciarStream,
  detenerStream,
} from "@/services/dashboardStreamService";
import { useMetricasTiempoReal } from "@/composables/useMetricasTiempoReal";

const router = useRouter();
const auth = useAuthStore();

// Registra la suscripción SSE app-wide (eventos y estado) para que `metricas`
// se pueble en cualquier rol con dashboard (GUARDIA o ADMIN), no solo cuando
// se monta el dashboard del guardia. Es idempotente: la suscripción real es
// singleton a nivel de módulo (asegurarSuscripcion()).
useMetricasTiempoReal();

// ─── Stream SSE de métricas (dashboard operativo) ────────────────────────────
// Conexión app-wide: se mantiene mientras el usuario tenga un condominio
// seleccionado y permiso de dashboard operativo (GUARDIA o ADMIN). Al cambiar
// condominio o cerrar sesión, el stream se aborta y limpia automáticamente.
watchEffect(() => {
  const cid = auth.condominioActualId;
  const tienePermisoDashboard = (auth.permisos || []).some(
    (cod) => cod === "DASHBOARD_GUARDIA" || cod === "DASHBOARD_ADMIN",
  );

  if (cid && tienePermisoDashboard) {
    iniciarStream(cid);
  } else {
    detenerStream();
  }
});

// ─── Navegación desde Service Worker ──────────────────────────────────────────
// Cuando el usuario toca una notificación push nativa, el SW envía un mensaje
// con tipo 'NAVEGAR' y la URL de destino. Este listener la recibe y navega.
function onNavegacionDesdeSW(event) {
  const { url, notificacionId } = event.detail;
  console.info("[MainLayout] Navegando por notificación push:", url);

  if (url) {
    router.push(url);
  }
}

onMounted(() => {
  window.addEventListener("comunidad:navegar", onNavegacionDesdeSW);
});

onUnmounted(() => {
  window.removeEventListener("comunidad:navegar", onNavegacionDesdeSW);
  detenerStream();
});

// ─── Banner de notificaciones ─────────────────────────────────────────────────
function onBannerActivado() {
  console.info("[MainLayout] Usuario activó notificaciones push desde el banner.");
}
</script>
