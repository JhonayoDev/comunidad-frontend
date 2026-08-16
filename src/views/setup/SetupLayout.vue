<script setup>
import { computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useSetupConfiguracion } from "@/composables/useSetupConfiguracion";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const { cargando, error, pasos, primerPasoPendiente, configuraciónCompleta, progreso, cargar } =
  useSetupConfiguracion();

const pasosVisibles = computed(() => pasos.value.filter((p) => !p.oculto));

onMounted(cargar);

function pasoActivo(p) {
  return route.path.endsWith(`/${p.key}`);
}

function irAPaso(p) {
  if (!p.completado && p !== primerPasoPendiente.value) return;
  router.push({ name: p.routeName });
}

function irSiguiente() {
  const pendiente = primerPasoPendiente.value;
  if (pendiente) router.push({ name: pendiente.routeName });
}

function irDashboard() {
  router.push({ name: "Dashboard" });
}
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Card>
      <template #content>
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <h1 class="text-xl font-bold m-0 truncate">
              Configuración de {{ auth.condominioActualNombre }}
            </h1>
            <span class="text-sm text-surface-400"
              >Completa estos pasos para dejar tu condominio listo</span
            >
          </div>
          <Tag
            v-if="configuraciónCompleta"
            value="Listo"
            icon="pi pi-check"
            severity="success"
          />
        </div>

        <div class="mt-4 flex flex-col gap-1">
          <div class="flex justify-between text-xs text-surface-400">
            <span>Progreso</span>
            <span>{{ progreso }}%</span>
          </div>
          <div class="w-full bg-surface-200 h-2 border-round overflow-hidden">
            <div
              class="bg-primary h-full border-round transition-all"
              :style="{ width: progreso + '%' }"
            ></div>
          </div>
        </div>
      </template>
    </Card>

    <Skeleton v-if="cargando" width="100%" height="120px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div class="flex flex-col sm:flex-row gap-2">
        <button
          v-for="p in pasosVisibles"
          :key="p.key"
          type="button"
          class="flex-1 flex items-center gap-2 p-3 border-round text-left transition-colors"
          :class="[
            pasoActivo(p)
              ? 'bg-primary text-white'
              : p.completado
                ? 'bg-surface border border-border hover:bg-emphasis cursor-pointer'
                : 'bg-surface border border-border cursor-pointer',
          ]"
          @click="irAPaso(p)"
        >
          <i
            class="pi"
            :class="[p.completado ? 'pi-check-circle' : p.icon]"
          ></i>
          <span class="text-sm font-medium">{{ p.label }}</span>
          <Tag
            v-if="p.completado"
            value="Completado"
            severity="success"
            size="small"
            :style="{ 'background-color': 'color-mix(in srgb, var(--p-primary-400) 20%, transparent)', color: 'var(--p-primary-400)' }"
          />
        </button>
      </div>

      <router-view v-slot="{ Component }">
        <component :is="Component" @actualizado="cargar" />
      </router-view>

      <div class="flex justify-between items-center gap-2">
        <Button
          v-if="!configuraciónCompleta"
          label="Saltar por ahora"
          icon="pi pi-arrow-right"
          icon-pos="right"
          variant="text"
          size="small"
          @click="irDashboard"
        />
        <Button
          v-else
          label="Ir al dashboard"
          icon="pi pi-home"
          size="small"
          @click="irDashboard"
        />
        <Button
          v-if="!configuraciónCompleta"
          label="Continuar"
          icon="pi pi-arrow-right"
          icon-pos="right"
          size="small"
          @click="irSiguiente"
        />
      </div>
    </template>
  </div>
</template>
