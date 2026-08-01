<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useNavigation } from "@/composables/useNavigation";

import Card from "primevue/card";
import Avatar from "primevue/avatar";
import Tag from "primevue/tag";
import Button from "primevue/button";
import Divider from "primevue/divider";

const router = useRouter();
const auth = useAuthStore();
const { groupedNavItems, goTo } = useNavigation();

async function handleLogout() {
  await auth.logout();
  router.push({ name: "Login" });
}
</script>

<template>
  <div class="flex flex-col bg-background">
    <!-- Perfil -->
    <Card>
      <template #content>
        <div class="flex items-center gap-4">
          <Avatar
            :label="
              (auth.userName || 'U')
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            "
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

    <!-- Módulos agrupados por contexto -->
    <Card>
      <template #title>Módulos</template>
      <template #content>
        <template v-for="group in groupedNavItems" :key="group.label">
          <Divider
            v-if="group.label && groupedNavItems.length > 1"
            :key="'div-' + group.label"
            align="left"
            class="my-2"
          >
            <span class="text-xs font-semibold text-surface-500 uppercase">{{
              group.label
            }}</span>
          </Divider>
          <Button
            v-for="item in group.items"
            :key="item.routeName"
            :label="item.label"
            :icon="item.icon"
            variant="text"
            class="w-full justify-content-start"
            @click="goTo(item.routeName)"
          />
        </template>
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

    <!-- Configuración -->
    <Card>
      <template #title>Configuración</template>
      <template #content>
        <Button
          label="Perfil"
          icon="pi pi-user"
          variant="text"
          class="w-full justify-content-start"
          @click="goTo('Perfil')"
        />
        <Button
          label="Notificaciones Push"
          icon="pi pi-bell"
          variant="text"
          class="w-full justify-content-start"
          @click="goTo('Configuracion')"
        />
        <Divider class="my-2" />
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
