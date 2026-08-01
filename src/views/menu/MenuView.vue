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
  <div class="flex flex-col gap-3 bg-background pt-2">
    <!-- Perfil -->
    <Card>
      <template #content>
        <div class="flex items-center gap-2">
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
            class="shrink-0 font-bold"
            style="background: var(--p-primary-400); color: #fff"
          />
          <div class="flex min-w-0 flex-col gap-1">
            <p class="m-0 truncate font-bold text-text">{{ auth.userName }}</p>
            <p class="m-0 truncate text-sm text-surface-500">
              {{ auth.user?.email }}
            </p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Módulos agrupados por contexto -->
    <Card>
      <template #title>
        <span class="text-base text-text-muted">Módulos</span></template
      >
      <template #content>
        <template v-for="group in groupedNavItems" :key="group.label">
          <Divider
            v-if="group.label && groupedNavItems.length > 1"
            :key="'div-' + group.label"
            align="left"
            class="my-3"
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
            class="w-full justify-content-start py-2"
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
          class="w-full justify-content-start py-2"
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
          class="w-full justify-content-start py-2"
          @click="goTo('Perfil')"
        />
        <Button
          label="Notificaciones Push"
          icon="pi pi-bell"
          variant="text"
          class="w-full justify-content-start py-2"
          @click="goTo('Configuracion')"
        />
        <Divider class="my-3" />
        <Button
          label="Cerrar sesión"
          icon="pi pi-sign-out"
          severity="danger"
          variant="text"
          class="w-full justify-content-start py-2"
          @click="handleLogout"
        />
      </template>
    </Card>
  </div>
</template>
