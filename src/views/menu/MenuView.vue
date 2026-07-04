<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useNavigation } from "@/composables/useNavigation";

import Card from "primevue/card";
import Avatar from "primevue/avatar";
import Tag from "primevue/tag";
import Button from "primevue/button";

const router = useRouter();
const auth = useAuthStore();
const { navItems, goTo } = useNavigation();

async function handleLogout() {
  await auth.logout();
  router.push({ name: "Login" });
}
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <!-- Perfil -->
    <Card>
      <template #content>
        <div class="flex items-center gap-4">
          <Avatar
            :label="(auth.userName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)"
            size="large"
            shape="circle"
            class="font-bold"
            style="background: var(--p-primary-400); color: #fff"
          />
          <div class="flex flex-col gap-1">
            <p class="font-bold m-0">{{ auth.userName }}</p>
            <p class="text-sm text-surface-500 m-0">{{ auth.user?.email }}</p>
            <Tag :value="auth.userRole" severity="info" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Módulos -->
    <Card>
      <template #title>Módulos</template>
      <template #content>
        <div class="flex flex-col gap-1">
          <Button
            v-for="item in navItems"
            :key="item.routeName"
            :label="item.label"
            :icon="item.icon"
            variant="text"
            class="w-full justify-content-start"
            @click="goTo(item.routeName)"
          />
        </div>
      </template>
    </Card>

    <!-- Notificaciones -->
    <Card>
      <template #title>Notificaciones</template>
      <template #content>
        <Button
          label="Ver notificaciones"
          icon="pi pi-bell"
          variant="text"
          class="w-full justify-content-start"
          @click="goTo('Notificaciones')"
        />
      </template>
    </Card>

    <!-- Sesión -->
    <Card>
      <template #title>Sesión</template>
      <template #content>
        <Button
          label="Cerrar sesión"
          icon="pi pi-sign-out"
          severity="danger"
          variant="text"
          class="w-full justify-content-start"
          @click="handleLogout"
        />
      </template>
    </Card>
  </div>
</template>
