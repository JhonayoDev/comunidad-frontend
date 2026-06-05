<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold">Notificaciones</h2>
      <button
        v-if="hayNoLeidas"
        class="btn btn-ghost btn-xs text-primary"
        @click="marcarTodas"
      >
        Marcar todas como leídas
      </button>
    </div>

    <!-- Aviso de caché -->
    <div v-if="error" class="alert alert-warning mb-4 py-2">
      <span class="text-sm">⚠️ {{ error }}</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>

    <!-- Sin notificaciones -->
    <div v-else-if="notificaciones.length === 0" class="text-center py-12">
      <p class="text-4xl mb-2">🔔</p>
      <p class="text-base-content/60">No tienes notificaciones</p>
    </div>

    <!-- Lista -->
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="notif in notificaciones"
        :key="notif.notificacionId"
        class="card bg-base-100 shadow-sm cursor-pointer"
        :class="{ 'opacity-60': notif.leida }"
        @click="marcarLeida(notif)"
      >
        <div class="card-body p-4">
          <div class="flex items-start gap-3">
            <span class="text-2xl mt-0.5">{{ iconoPorTipo(notif.tipo) }}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="font-semibold text-sm truncate">{{ notif.titulo }}</p>
                <span
                  v-if="!notif.leida"
                  class="badge badge-primary badge-xs shrink-0"
                  >Nueva</span
                >
              </div>
              <p class="text-sm text-base-content/70 mt-0.5">
                {{ notif.mensaje }}
              </p>
              <p class="text-xs text-base-content/40 mt-1">
                {{ formatFecha(notif.fechaCreacion) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useNotificaciones } from "../../composables/useNotificaciones";

const {
  notificaciones,
  loading,
  error,
  hayNoLeidas,
  cargar,
  marcarLeida,
  marcarTodas,
} = useNotificaciones();

function iconoPorTipo(tipo) {
  const iconos = {
    ENCOMIENDA: "📦",
    VISITA: "🚪",
    AVISO: "📢",
    SISTEMA: "⚙️",
  };
  return iconos[tipo] || "🔔";
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

onMounted(() => cargar());
</script>
