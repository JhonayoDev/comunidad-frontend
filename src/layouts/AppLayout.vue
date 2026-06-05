<template>
  <div class="min-h-screen bg-base-200 flex flex-col">
    <!-- Barra superior -->
    <header
      class="bg-primary text-primary-content px-4 py-3 flex items-center justify-between"
    >
      <div>
        <p class="text-xs opacity-75">Bienvenido/a</p>
        <h1 class="font-bold text-lg leading-tight">{{ auth.userName }}</h1>
        <p class="text-xs opacity-75">Condominio Comunidad</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="indicator">
          <span
            v-if="notifCount > 0"
            class="indicator-item badge badge-secondary badge-xs"
          >
            {{ notifCount }}
          </span>
          <button
            class="btn btn-ghost btn-circle btn-sm"
            @click="goTo('Notificaciones')"
          >
            🔔
          </button>
        </div>
      </div>
    </header>

    <!-- Contenido de la página -->
    <main class="flex-1 overflow-y-auto pb-20">
      <RouterView />
    </main>

    <!-- Barra de navegación inferior -->
    <nav
      class="btm-nav btm-nav-sm fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300"
    >
      <button
        v-for="item in navItems"
        :key="item.name"
        :class="{ active: currentRoute === item.routeName }"
        @click="goTo(item.routeName)"
      >
        <span class="text-xl">{{ item.icon }}</span>
        <span class="btm-nav-label text-xs">{{ item.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { perfilService } from "../services/perfilService";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const notifCount = ref(0);
const currentRoute = computed(() => route.name);

// Navegación según rol
const navItems = computed(() => {
  const role = auth.userRole;

  if (role === "ADMIN") {
    return [
      { label: "Inicio", icon: "🏠", routeName: "Dashboard" },
      { label: "Residentes", icon: "👥", routeName: "Residentes" },
      { label: "Vehículos", icon: "🚗", routeName: "Vehiculos" },
      { label: "Menú", icon: "☰", routeName: "Menu" },
    ];
  }

  if (role === "GUARDIA") {
    return [
      { label: "Portón", icon: "🚧", routeName: "Porton" },
      { label: "Visitas", icon: "📋", routeName: "Visitas" },
      { label: "Solicitudes", icon: "📝", routeName: "Solicitudes" },
      { label: "Menú", icon: "☰", routeName: "Menu" },
    ];
  }

  return [
    { label: "Inicio", icon: "🏠", routeName: "Inicio" },
    { label: "Notif.", icon: "🔔", routeName: "Notificaciones" },
    { label: "Gestiones", icon: "📋", routeName: "Gestiones" },
    { label: "Perfil", icon: "👤", routeName: "Perfil" },
  ];
});

function goTo(routeName) {
  router.push({ name: routeName });
}

// Badge de notificaciones
async function actualizarBadge() {
  try {
    const response = await perfilService.getBadgeNotificaciones();
    notifCount.value = response.data.noLeidas;
  } catch {
    // Si falla no interrumpe la app
  }
}

// Intervalo que actualiza el badge cada 30 segundos
let intervalo = null;

onMounted(() => {
  actualizarBadge();
  intervalo = setInterval(actualizarBadge, 30000);
});

onUnmounted(() => {
  clearInterval(intervalo);
});
</script>
