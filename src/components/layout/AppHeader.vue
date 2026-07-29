<template>
  <header
    class="header-text surface-card px-3 py-2 flex align-items-center justify-content-between shadow-1 w-full bg-background/25 rounded-lg"
  >
    <div class="header-btn flex align-items-center gap-3">
      <img
        src="../../assets/casa.svg"
        alt="Logo"
        class="header-btn w-10 h-10 border-circle overflow-hidden object-cover cursor-pointer"
        @click="goHome"
      />
      <div class="flex flex-col">
        <span class="font-bold text-sm">{{ auth.userName }}</span>
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
    class="flex gap-1 px-3 pb-2 overflow-x-auto surface-ground border-bottom-1 surface-border"
  >
    <Button
      class="btn-no-bg header-btn"
      v-for="ctx in auth.contextos"
      :key="ctx.key"
      :label="ctx.label"
      :severity="auth.activeContext === ctx.key ? 'primary' : 'secondary'"
      :variant="auth.activeContext === ctx.key ? 'filled' : 'text'"
      size="small"
      rounded
      @click="switchContext(ctx)"
    />
  </div>

  <Drawer v-model:visible="drawerVisible" position="right" header="Menú">
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
  return (
    auth.user?.roles?.includes("RESIDENTE") && !!auth.condominioActualCargo
  );
});

watch(
  () => route.name,
  () => {
    drawerVisible.value = false;
  },
);

function goHome() {
  const roles = auth.user?.roles || [];
  const rol = auth.condominioActualRol || roles[0];
  if (roles.includes("SUPER_ADMIN")) {
    router.push({ name: "SuperAdminDashboard" });
  } else if (rol === "ADMINISTRADOR") {
    router.push({ name: "Dashboard" });
  } else if (rol === "GUARDIA") {
    router.push({ name: "GuardiaDashboard" });
  } else if (rol === "RESIDENTE") {
    router.push({ name: "Inicio" });
  }
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
