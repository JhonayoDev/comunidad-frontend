<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authStore";
import { notificacionesService } from "../../services/notificacionesService";

import Card from "primevue/card";
import Button from "primevue/button";
import Badge from "primevue/badge";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";

const router = useRouter();
const auth = useAuthStore();

const notificaciones = ref([]);
const loading = ref(true);
const error = ref(null);

const hayNoLeidas = computed(() =>
  notificaciones.value.some((n) => !n.leido),
);

function iconoPorTipo(tipo) {
  const iconos = {
    ENCOMIENDA: "pi pi-box",
    VISITA: "pi pi-sign-in",
    AVISO: "pi pi-megaphone",
    SISTEMA: "pi pi-cog",
  };
  return iconos[tipo] || "pi pi-bell";
}

function formatFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) {
    error.value = "Selecciona un condominio primero";
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const response = await notificacionesService.getTodas(cid);
    notificaciones.value = response.data;
  } catch (e) {
    console.error("Error al cargar notificaciones", e);
    error.value = "Error al cargar notificaciones";
  } finally {
    loading.value = false;
  }
}

async function marcarLeida(notif) {
  const cid = auth.condominioActualId;
  if (notif.leido || !cid) return;
  try {
    await notificacionesService.marcarLeida(cid, notif.id);
    notif.leido = true;
  } catch (e) {
    console.error("Error al marcar como leída", e);
  }
}

async function marcarTodas() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    await notificacionesService.marcarTodasLeidas(cid);
    notificaciones.value.forEach((n) => (n.leido = true));
  } catch (e) {
    console.error("Error al marcar todas como leídas", e);
  }
}

onMounted(() => cargar());
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold m-0">Notificaciones</h2>
      <Button
        v-if="hayNoLeidas"
        label="Marcar todas leídas"
        icon="pi pi-check"
        size="small"
        variant="text"
        @click="marcarTodas"
      />
    </div>

    <Message v-if="error" severity="warn" :closable="false">
      {{ error }}
    </Message>

    <template v-if="loading">
      <Card v-for="i in 4" :key="i">
        <template #content>
          <div class="flex items-center gap-3">
            <Skeleton shape="circle" size="3rem" />
            <div class="flex flex-col gap-2 flex-1">
              <Skeleton width="60%" height="1rem" />
              <Skeleton width="80%" height="0.8rem" />
            </div>
          </div>
        </template>
      </Card>
    </template>

    <template v-else-if="notificaciones.length === 0">
      <Card>
        <template #content>
          <div class="flex flex-col items-center py-6 gap-2">
            <i class="pi pi-bell text-5xl text-surface-300"></i>
            <p class="text-surface-400">No tienes notificaciones</p>
          </div>
        </template>
      </Card>
    </template>

    <template v-else>
      <Card
        v-for="notif in notificaciones"
        :key="notif.id"
        :class="notif.leido ? 'opacity-60' : ''"
        class="cursor-pointer"
        @click="marcarLeida(notif)"
      >
        <template #content>
          <div class="flex items-start gap-3">
            <i
              :class="iconoPorTipo(notif.tipo)"
              class="text-2xl mt-1 text-primary"
            ></i>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold text-sm truncate">{{ notif.titulo }}</span>
                <Badge v-if="!notif.leido" value="Nueva" severity="info" />
              </div>
              <p class="text-sm text-surface-500 mt-1">
                {{ notif.mensaje }}
              </p>
              <p class="text-xs text-surface-400 mt-1">
                {{ formatFecha(notif.fechaCreacion) }}
              </p>
            </div>
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>
