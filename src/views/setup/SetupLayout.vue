<script setup>
import { computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useSetupConfiguracion, marcarEnEdicion } from "@/composables/useSetupConfiguracion";

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

// Al salir del paso se limpia el override de edición (evita checks colgados).
watch(
  () => route.name,
  () => marcarEnEdicion(null),
);

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

// La planilla avisa cuando entra/sale de edición manual: el paso figura
// pendiente hasta guardar (el override vive en el composable).
function onEdicionPlanilla(enEdicion) {
  marcarEnEdicion(enEdicion ? "planilla" : null);
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
      <!-- Stepper compacto: el estado va en ícono + estilo (sin Tag de texto).
           Grid que envuelve (sin scroll lateral): 5 cols en móvil/desktop
           medio, 10 en xl. En móvil, etiqueta corta bajo el ícono. -->
      <div class="grid grid-cols-5 xl:grid-cols-10 gap-2">
        <button
          v-for="p in pasosVisibles"
          :key="p.key"
          type="button"
          class="flex flex-col sm:flex-row items-center sm:justify-start justify-center gap-1 px-1 py-2 border-round text-center sm:text-left transition-colors min-w-0"
          :class="[
            pasoActivo(p)
              ? 'bg-primary text-white'
              : p.completado
                ? 'bg-surface border border-primary/40 hover:bg-emphasis cursor-pointer'
                : 'bg-surface border border-border cursor-pointer opacity-70',
          ]"
          :title="`${p.label}: ${p.completado ? 'completado' : pasoActivo(p) ? 'en curso' : 'pendiente'}`"
          :aria-label="`${p.label}: ${p.completado ? 'completado' : pasoActivo(p) ? 'en curso' : 'pendiente'}`"
          @click="irAPaso(p)"
        >
          <i
            class="pi text-base shrink-0"
            :class="[
              p.completado
                ? 'pi-check-circle text-primary'
                : pasoActivo(p)
                  ? p.icon
                  : `${p.icon} text-surface-400`,
            ]"
          ></i>
          <span class="sm:hidden text-[10px] leading-tight truncate max-w-full">{{ p.corto }}</span>
          <span class="hidden sm:inline xl:hidden text-sm font-medium truncate max-w-full">{{ p.label }}</span>
          <span class="hidden xl:inline text-sm font-medium truncate max-w-full">{{ p.corto }}</span>
        </button>
      </div>

      <router-view v-slot="{ Component }">
        <component
          :is="Component"
          :key="route.name"
          @actualizado="cargar"
          @edicion-planilla="onEdicionPlanilla"
        />
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
