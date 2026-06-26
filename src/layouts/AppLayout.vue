<template>
  <div class="min-h-screen bg-base-200 flex flex-col">
    <!-- Barra superior -->
    <header
      class="bg-primary text-primary-content px-4 py-3 flex items-center justify-between"
    >
      <div>
        <p class="text-xs opacity-75">Bienvenido/a</p>
        <h1 class="font-bold text-lg leading-tight">{{ auth.userName }}</h1>
        <div class="flex items-center gap-1">
          <select
            v-if="auth.hasMultipleCondominios"
            v-model="selectedCondominioId"
            @change="onCondominioChange"
            class="text-xs bg-primary text-primary-content border border-primary-content/30 rounded px-1 py-0.5"
          >
            <option v-for="c in auth.condominios" :key="c.id" :value="c.id">
              {{ c.nombre }}
            </option>
          </select>
          <p v-else class="text-xs opacity-75">
            {{ auth.condominioActualNombre || "Condominio" }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- Badge de notificaciones -->
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
        <!-- Logout -->
        <button class="btn btn-ghost btn-circle btn-sm" @click="handleLogout">
          🚪
        </button>
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
```
<script setup>
```js
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
const selectedCondominioId = ref(auth.condominioActualId || "");

function onCondominioChange() {
  if (selectedCondominioId.value) {
    auth.seleccionarCondominio(selectedCondominioId.value);
    router.go(0); // recarga para refrescar datos con nuevo condominioId
  }
}

// Navegación según rol del condominio seleccionado
const navItems = computed(() => {
  const role = auth.condominioActualRol || (auth.user?.roles?.[0] ?? "");

  if (role === "ADMINISTRADOR") {
    return [
      { label: "Inicio", icon: "🏠", routeName: "Dashboard" },
      { label: "Residentes", icon: "👥", routeName: "Residentes" },
      { label: "Vehículos", icon: "🚗", routeName: "Vehiculos" },
      { label: "Menú", icon: "☰", routeName: "Menu" },
    ];
  }

  if (role === "GUARDIA") {
    return [
      { label: "Inicio", icon: "🏠", routeName: "GuardiaDashboard" },
      { label: "Portón", icon: "🚧", routeName: "Porton" },
      { label: "Encomiendas", icon: "📦", routeName: "Encomiendas" },
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

async function actualizarBadge() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    const response = await perfilService.getBadgeNotificaciones(cid);
    notifCount.value = response.data.noLeidas;
  } catch {
    // Si falla no interrumpe la app
  }
}

function handleLogout() {
  auth.logout();
  router.push({ name: "Login" });
}

let intervalo = null;

onMounted(() => {
  actualizarBadge();
  intervalo = setInterval(actualizarBadge, 30000);
});

onUnmounted(() => {
  clearInterval(intervalo);
});
</script>
