<template>
  <Menubar class="border-none surface-card px-3 py-2">
    <template #start>
      <div class="flex flex-column">
        <small class="text-500">Bienvenido/a</small>
        <strong class="text-lg line-height-2">{{ auth.userName }}</strong>

        <Select
          v-if="auth.hasMultipleCondominios"
          v-model="selectedCondominioId"
          :options="auth.condominios"
          optionLabel="nombre"
          optionValue="id"
          class="mt-2 w-12rem"
          placeholder="Condominio"
          @change="onCondominioChange"
        />
        <small v-else class="text-500">
          {{ auth.condominioActualNombre || "Condominio" }}
        </small>
      </div>
    </template>

    <template #end>
      <div class="flex align-items-center gap-2">
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
          icon="pi pi-sign-out"
          severity="danger"
          text
          rounded
          @click="handleLogout"
        />
      </div>
    </template>
  </Menubar>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationBadge } from "@/composables/useNotificationBadge";
import { useCondominioSelector } from "@/composables/useCondominioSelector";

import Menubar from "primevue/menubar";
import Button from "primevue/button";
import Select from "primevue/select";
import Badge from "primevue/badge";

const router = useRouter();
const auth = useAuthStore();

const { notifCount } = useNotificationBadge();
const { selectedCondominioId, onCondominioChange } = useCondominioSelector();

function goTo(name) {
  router.push({ name });
}

function handleLogout() {
  auth.logout();
  router.push({ name: "Login" });
}
</script>
