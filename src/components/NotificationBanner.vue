<template>
  <Transition name="banner-slide">
    <Card
      v-if="visible"
      class="notification-banner fixed bottom-0 left-0 right-0 z-50 mx-auto mb-4 w-[calc(100%-2rem)] max-w-md shadow-xl border border-surface-300 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2"
      :pt="{
        root: { class: 'bg-surface-800 text-surface-0 border-none' },
        body: { class: 'p-3 flex items-center gap-3' },
        content: { class: 'p-0 flex flex-col gap-2 sm:flex-row sm:items-center flex-1' },
      }"
    >
      <template #content>
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <i class="pi pi-bell text-xl text-primary shrink-0" />
          <div class="flex flex-col min-w-0">
            <span class="font-semibold text-sm leading-tight text-surface-0">
              Activa las notificaciones
            </span>
            <span class="text-xs text-surface-400 leading-tight mt-0.5">
              Recibe alertas de visitas, encomiendas y avisos al instante.
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 justify-end">
          <Button
            label="Activar"
            size="small"
            severity="info"
            :loading="loading"
            @click="handleActivar"
          />
          <Button
            label="Ahora no"
            size="small"
            text
            severity="secondary"
            class="text-surface-400 hover:text-surface-0"
            @click="handleDescartar"
          />
        </div>
      </template>
    </Card>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { PushManager } from "@/services/pushManager";
import Card from "primevue/card";
import Button from "primevue/button";

const emit = defineEmits(["activado", "descartado"]);

const visible = ref(false);
const loading = ref(false);
const descartadoEnSesion = ref(false);

const STORAGE_KEY = "comunidad:push-banner-descartado";

function evaluarVisibilidad() {
  const permiso = PushManager.estadoPermiso;
  visible.value =
    permiso === "default" &&
    !descartadoEnSesion.value &&
    !sessionStorage.getItem(STORAGE_KEY);
}

async function handleActivar() {
  loading.value = true;
  try {
    const permiso = await PushManager.solicitarPermiso();
    if (permiso === "granted") {
      visible.value = false;
      emit("activado");
    } else if (permiso === "denied") {
      visible.value = false;
      sessionStorage.setItem(STORAGE_KEY, "1");
      descartadoEnSesion.value = true;
      emit("descartado");
    }
  } finally {
    loading.value = false;
  }
}

function handleDescartar() {
  sessionStorage.setItem(STORAGE_KEY, "1");
  descartadoEnSesion.value = true;
  visible.value = false;
  emit("descartado");
}

onMounted(() => {
  evaluarVisibilidad();
  // Re-evaluar si el permiso cambia mientras la app está abierta
  document.addEventListener("visibilitychange", evaluarVisibilidad);
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", evaluarVisibilidad);
});
</script>

<style scoped>
.banner-slide-enter-active {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s ease;
}
.banner-slide-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.banner-slide-enter-from {
  transform: translateY(120%);
  opacity: 0;
}
.banner-slide-leave-to {
  transform: translateY(120%);
  opacity: 0;
}
</style>
