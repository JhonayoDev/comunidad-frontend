<template>
  <header
    class="surface-card px-3 py-2 flex align-items-center justify-content-between shadow-1 w-full"
  >
    <div class="flex align-items-center gap-3">
      <img
        src="../../assets/casa.png"
        alt="Logo"
        class="w-10 h-10 border-circle overflow-hidden object-cover cursor-pointer"
        @click="goHome"
      />
      <div class="flex flex-col">
        <span class="font-bold text-white text-sm">{{ auth.userName }}</span>
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
        <small v-else class="text-surface-400 text-xs">
          {{ auth.condominioActualNombre || "Condominio" }}
        </small>
      </div>
    </div>

    <div class="flex align-items-center gap-1 ml-auto">
      <Button
        icon="pi pi-bell"
        severity="secondary"
        text
        rounded
        @click="goTo('Notificaciones')"
      >
        <Badge
          v-if="notifCount > 0"
          :value="notifCount"
          severity="danger"
          class="ml-1"
        />
      </Button>
      <Button
        icon="pi pi-bars"
        severity="secondary"
        text
        rounded
        @click="drawerVisible = true"
      />
    </div>
  </header>

  <Drawer v-model:visible="drawerVisible" position="right" header="Menú">
    <MenuView />
  </Drawer>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationBadge } from "@/composables/useNotificationBadge";
import { useCondominioSelector } from "@/composables/useCondominioSelector";
import MenuView from "@/views/menu/MenuView.vue";
import Drawer from "primevue/drawer";
import Button from "primevue/button";
import Select from "primevue/select";
import Badge from "primevue/badge";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const { notifCount } = useNotificationBadge();
const { selectedCondominioId, onCondominioChange } = useCondominioSelector();

const drawerVisible = ref(false);

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
