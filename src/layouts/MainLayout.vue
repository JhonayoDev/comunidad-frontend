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
        :class="
          mostrarBottomNav ? 'min-h-0 overflow-y-auto pb-24' : 'overflow-y-auto'
        "
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
  iniciarStreamNotificaciones,
  detenerStreamNotificaciones,
} from "@/services/notificacionesStreamService";
import { useNotificacionesTiempoReal } from "@/composables/useNotificacionesTiempoReal";

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

// Dashboard operativo/residente vía polling (useDashboardMetrics 30s / useResidenteMetrics 60s).
// Solo notificaciones mantiene SSE.

// Registra la suscripción SSE app-wide de notificaciones (bandeja) para que
// el badge/campanita se actualice en vivo. Único stream SSE activo.
useNotificacionesTiempoReal();

// ─── Stream SSE de notificaciones (único bus SSE activo) ────────────────────
// Conexión app-wide: se mantiene mientras el usuario tenga condominio +
// permiso NOTIFICACION_VER. Pollings de dashboard son independientes.
watchEffect(() => {
  const cid = auth.condominioActualId;
  const permisos = auth.permisos || [];

  const tienePermisoNotificaciones = permisos.some(
    (cod) => cod === "NOTIFICACION_VER",
  );

  if (cid && tienePermisoNotificaciones) {
    iniciarStreamNotificaciones(cid);
  } else {
    detenerStreamNotificaciones();
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
  window.addEventListener("Briku:navegar", onNavegacionDesdeSW);
});

onUnmounted(() => {
  window.removeEventListener("Briku:navegar", onNavegacionDesdeSW);
  detenerStreamNotificaciones();
});

// ─── Banner de notificaciones ─────────────────────────────────────────────────
function onBannerActivado() {
  console.info(
    "[MainLayout] Usuario activó notificaciones push desde el banner.",
  );
}
</script>
