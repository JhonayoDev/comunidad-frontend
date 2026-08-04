<template>
  <header
    class="header-text surface-card px-3 py-1.5 flex align-items-center justify-content-between shadow-1 w-full bg-background/25 rounded-lg"
  >
    <div class="header-btn flex align-items-center gap-2">
      <img
        src="/icons/favicon.svg"
        alt="Logo"
        class="header-btn w-9 h-9 border-circle overflow-hidden object-fill cursor-pointer"
        @click="goHome"
      />
      <div class="flex flex-col min-w-0">
        <span class="font-bold text-sm truncate">{{ auth.userName }}</span>
        <Select
          v-if="auth.hasMultipleCondominios"
          v-model="selectedCondominioId"
          :options="auth.condominios"
          optionLabel="nombre"
          optionValue="id"
          class="mt-1 w-10rem"
          placeholder="Condominio"
          size="small"
          @change="onCondominioChange"
        />
        <small v-else class="text-xs">
          {{ auth.condominioActualNombre || "Condominio" }}
        </small>
      </div>
    </div>

    <div class="flex align-items-center gap-1 ml-auto">
      <Button
        class="btn-no-bg header-btn"
        :icon="esOscuro ? 'pi pi-sun' : 'pi pi-moon'"
        severity="secondary"
        text
        rounded
        @click="toggleTema"
      />
      <NotificacionPopover />
      <Button
        class="btn-no-bg header-btn"
        icon="pi pi-bars"
        severity="secondary"
        text
        rounded
        @click="drawerVisible = true"
      />
    </div>
  </header>

  <div
    v-if="showContextPills"
    class="flex gap-2 px-3 pb-2 overflow-x-auto bg border-bottom-1 surface-border"
  >
    <Button
      class="context-card"
      v-for="ctx in auth.contextos"
      :key="ctx.key"
      :severity="auth.activeContext === ctx.key ? 'primary' : 'secondary'"
      :variant="auth.activeContext === ctx.key ? 'filled' : 'outlined'"
      size="small"
      rounded
      @click="switchContext(ctx)"
    >
      <span class="flex items-center gap-1">
        {{ ctx.label }}
        <Badge
          v-if="conteoContexto(ctx) > 0"
          :value="conteoContexto(ctx) > 99 ? '99+' : conteoContexto(ctx)"
          severity="danger"
        />
      </span>
    </Button>
  </div>

  <Drawer
    class="bg-background/95"
    v-model:visible="drawerVisible"
    position="right"
    header="Menú"
    :pt="{
      mask: {
        class: 'drawer-mask-blur-mobile',
      },
      header: {
        class: 'py-2 bg-background border-b border-border rounded-lg',
      },
      title: {
        class: 'text-base text-text-muted',
      },
    }"
  >
    <MenuView />
  </Drawer>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useNavigation } from "@/composables/useNavigation";
import { useCondominioSelector } from "@/composables/useCondominioSelector";
import NotificacionPopover from "./NotificacionPopover.vue";
import MenuView from "@/views/menu/MenuView.vue";
import Drawer from "primevue/drawer";
import Button from "primevue/button";
import Select from "primevue/select";
import Badge from "primevue/badge";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const { switchContext } = useNavigation();
const { selectedCondominioId, onCondominioChange } = useCondominioSelector();

const drawerVisible = ref(false);
const esOscuro = ref(false);

function toggleTema() {
  esOscuro.value = !esOscuro.value;
  document.documentElement.classList.toggle("p-dark", esOscuro.value);
  localStorage.setItem("theme", esOscuro.value ? "dark" : "light");
}

function initTema() {
  const saved = localStorage.getItem("theme");
  esOscuro.value = saved === "dark";
  document.documentElement.classList.toggle("p-dark", esOscuro.value);
}

initTema();

const showContextPills = computed(() => {
  return auth.user?.roles?.includes("RESIDENTE") && auth.contextos.length > 1;
});

watch(
  () => route.name,
  () => {
    drawerVisible.value = false;
  },
);

function goHome() {
  const roles = auth.user?.roles || [];
  if (roles.includes("SUPER_ADMIN")) {
    router.push({ name: "SuperAdminDashboard" });
    return;
  }

  // Contexto de cargo activo → su propio dashboard (ej: administrador → Dashboard).
  if (auth.activeContext !== "residente") {
    router.push({ name: auth.contextDashboard });
    return;
  }

  // Contexto residente (o sin cargos): el home depende del rol.
  const rol = auth.condominioActualRol || roles[0];
  if (rol === "ADMINISTRADOR") {
    router.push({ name: "Dashboard" });
  } else if (rol === "GUARDIA") {
    router.push({ name: "GuardiaDashboard" });
  } else {
    router.push({ name: "Inicio" });
  }
}

// Badge de no leídas por contexto (residente / cargo). En Fase 2 se alimenta
// desde el backend (audiencia por notificación); hoy retorna 0 (oculto).
function conteoContexto(ctx) {
  return 0;
}

function goTo(name) {
  drawerVisible.value = false;
  router.push({ name });
}
</script>
<style scoped>
.header-text {
  color: var(--p-primary-text-principal);
}
.context-card {
  min-width: 6.5rem;
  justify-content: flex-start;
}
</style>

<!--
  Sin scoped para penetrar PrimeVue y forzar el color del icono.
  El color del icono debe coincidir con el texto del header.
  Cambia el valor de --p-surface-900 si quieres otro color.
-->
<style>
button.header-btn .p-button-icon {
  color: var(--p-primary-text-principal) !important;
}
</style>
