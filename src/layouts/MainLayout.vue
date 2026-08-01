<template>
  <!-- En PWA standalone (mostrarBottomNav) se usa un shell de app nativa:
       alto fijo, header y bottom nav fijos, scroll interno solo en <main>.
       En navegador de escritorio se conserva el scroll de página normal. -->
  <div
    class="relative flex flex-col overflow-hidden"
    :class="
      mostrarBottomNav
        ? 'h-screen supports-[height:100dvh]:h-dvh'
        : 'min-h-screen'
    "
  >
    <!-- Imagen de fondo -->
    <div
      class="absolute inset-0 bg-cover bg-center bg-fixed blur-md"
      :style="{ backgroundImage: `url(${fondoweb})` }"
    />

    <!-- Overlay SOLO sobre la imagen -->
    <div class="absolute inset-0 bg-background opacity-35" />

    <!-- Contenido -->
    <div
      class="relative z-10 flex flex-col"
      :class="mostrarBottomNav ? 'flex-1 min-h-0' : 'min-h-screen'"
    >
      <AppHeader />
      <main
        ref="mainRef"
        class="flex-1"
        :class="mostrarBottomNav ? 'min-h-0 overflow-y-auto pb-24' : 'overflow-y-auto'"
      >
        <RouterView />
      </main>
      <BottomNavigation v-if="mostrarBottomNav" />
      <AppFooter v-else />
    </div>

    <!-- Banner de invitación a notificaciones push -->
    <NotificationBanner @activado="onBannerActivado" />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch, watchEffect, ref, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import fondoweb from "@/assets/fondoweb.webp";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import BottomNavigation from "@/components/layout/BottomNavigation.vue";
import NotificationBanner from "@/components/NotificationBanner.vue";
import { useAuthStore } from "@/stores/authStore";
import { usePwaStandalone } from "@/composables/usePwaStandalone";
import {
  iniciarStream,
  detenerStream,
} from "@/services/dashboardStreamService";
import { useMetricasTiempoReal } from "@/composables/useMetricasTiempoReal";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const { mostrar: mostrarBottomNav } = usePwaStandalone();

const mainRef = ref(null);

// En el shell de app nativa el scroll vive en <main>; al navegar de ruta
// se restablece a la parte superior (como una app nativa).
watch(
  () => route.path,
  () => {
    nextTick(() => {
      if (mainRef.value) mainRef.value.scrollTop = 0;
    });
  },
);

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
