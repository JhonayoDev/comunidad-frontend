<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useNotificationBadge } from "@/composables/useNotificationBadge";
import Button from "primevue/button";
import Badge from "primevue/badge";
import Popover from "primevue/popover";

const router = useRouter();
const { notifCount, syncNotificaciones, syncLoading, refreshSync } =
  useNotificationBadge();

const op = ref(null);

function toggle(event) {
  refreshSync();
  op.value.toggle(event);
}

function irAInbox() {
  op.value.hide();
  router.push({ name: "Notificaciones" });
}

function iconoPorTipo(tipo) {
  const iconos = {
    ENCOMIENDA_RECIBIDA: "pi pi-box",
    ENCOMIENDA_ENTREGADA: "pi pi-box",
    VISITA_PREAUTORIZADA: "pi pi-sign-in",
    VISITA_INGRESADA: "pi pi-sign-in",
    VISITA_RECHAZADA: "pi pi-sign-in",
    ANUNCIO_GENERAL_PUBLICADO: "pi pi-megaphone",
    DOCUMENTO_PUBLICADO: "pi pi-file",
    DEUDA_VENCIDA: "pi pi-exclamation-triangle",
    RECLAMO_CREADO: "pi pi-comment",
    RECLAMO_RESPONDIDO: "pi pi-comment",
    RECLAMO_CERRADO: "pi pi-comment",
    PAGO_REGISTRADO: "pi pi-credit-card",
    GASTO_COMUN_GENERADO: "pi pi-calendar",
    RESERVA_CREADA: "pi pi-calendar-plus",
    RESERVA_APROBADA: "pi pi-check-circle",
    RESERVA_RECHAZADA: "pi pi-times-circle",
  };
  return iconos[tipo] || "pi pi-bell";
}

function timeAgo(fecha) {
  if (!fecha) return "";
  const now = new Date();
  const date = new Date(fecha);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `Hace ${diffHoras}h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias < 7) return `Hace ${diffDias}d`;
  return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}
</script>

<template>
  <div>
    <Button
      class="btn-no-bg header-btn"
      icon="pi pi-bell"
      severity="secondary"
      text
      rounded
      @click="toggle"
    >
      <Badge
        v-if="notifCount > 0"
        :value="notifCount > 99 ? '99+' : notifCount"
        severity="danger"
        class="ml-1"
      />
    </Button>

    <Popover
      class="shadow-lg"
      ref="op"
      :style="{ width: '320px' }"
    >
      <div class="flex flex-col gap-1">
        <div
          class="flex items-center justify-between px-1 pb-2 border-b border-border"
        >
          <span class="font-bold text-sm">Notificaciones</span>
          <Button
            class="btn-no-bg header-btn text-text-muted"
            v-if="notifCount >= 0"
            label="Ver todas"
            size="small"
            link
            @click="irAInbox"
          />
        </div>

        <div v-if="syncLoading" class="flex flex-col gap-2 py-3">
          <div v-for="i in 3" :key="i" class="flex items-center gap-2">
            <div class="w-8 h-8 bg-surface-200 border-round animate-pulse" />
            <div class="flex-1 space-y-1">
              <div
                class="h-3 bg-surface-200 border-round w-3/4 animate-pulse"
              />
              <div
                class="h-2 bg-surface-100 border-round w-1/2 animate-pulse"
              />
            </div>
          </div>
        </div>

        <template v-else-if="syncNotificaciones.length === 0">
          <div class="flex flex-col items-center py-4 gap-1 text-surface-400">
            <i class="pi pi-check-circle text-xl" />
            <span class="text-sm">No hay notificaciones nuevas</span>
          </div>
        </template>

        <template v-else>
          <div
            v-for="n in syncNotificaciones.slice(0, 5)"
            :key="n.id"
            class="flex items-start gap-2 px-1 py-2 border-b border-surface-100 last:border-b-0 cursor-pointer hover:bg-surface-50 transition-colors duration-150 rounded"
          >
            <i
              :class="iconoPorTipo(n.tipo)"
              class="text-lg mt-1 text-primary shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium m-0 truncate">{{ n.titulo }}</p>
              <p class="text-xs text-surface-400 m-0 truncate">
                {{ n.mensaje }}
              </p>
              <p class="text-xs text-surface-300 m-0 mt-1">
                {{ timeAgo(n.fechaCreacion) }}
              </p>
            </div>
          </div>
        </template>
      </div>
    </Popover>
  </div>
</template>

<style>
button.header-btn .p-button-icon {
  color: var(--p-surface-900) !important;
}
</style>
