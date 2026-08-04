<script setup>
import { ref, computed } from "vue";
import { useNotificaciones } from "@/composables/useNotificaciones";
import Card from "primevue/card";
import Button from "primevue/button";
import Badge from "primevue/badge";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Paginator from "primevue/paginator";

const {
  notificaciones, loading, error, hayNoLeidas, moduloNoContratado,
  marcarLeida, marcarTodas,
} = useNotificaciones();

const expandedId = ref(null);
const pagina = ref(0);
const tamano = ref(10);

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id;
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

function formatFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const paginadas = computed(() => {
  const lista = notificaciones.value || [];
  const inicio = pagina.value * tamano.value;
  return lista.slice(inicio, inicio + tamano.value);
});

const totalRegistros = computed(() => (notificaciones.value || []).length);

function alCambiarPagina(event) {
  pagina.value = event.page;
}

function handleMarcarLeida(n) {
  if (!n.leido) {
    marcarLeida(n);
  }
  toggleExpand(n.id);
}
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

    <Card v-if="moduloNoContratado">
      <template #content>
        <div class="flex flex-col items-center py-6 gap-2 text-center">
          <i class="pi pi-bell-slash text-5xl text-surface-300"></i>
          <p class="font-semibold text-surface-600 m-0">
            Módulo de comunicaciones no contratado
          </p>
          <p class="text-sm text-surface-400 m-0 max-w-md">
            Tu condominio no tiene suscrito el módulo de comunicaciones. Si
            crees que esto es un error, contáctate con la administración.
          </p>
        </div>
      </template>
    </Card>

    <template v-else-if="loading">
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

    <template v-else-if="paginadas.length === 0">
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
        v-for="notif in paginadas"
        :key="notif.id"
        :class="notif.leido ? 'opacity-60' : ''"
        class="cursor-pointer"
        @click="handleMarcarLeida(notif)"
      >
        <template #content>
          <div class="flex items-start gap-3">
            <i
              :class="iconoPorTipo(notif.tipo)"
              class="text-2xl mt-1 text-primary shrink-0"
            ></i>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold text-sm truncate">{{ notif.titulo }}</span>
                <Badge v-if="!notif.leido" value="Nueva" severity="info" class="shrink-0" />
              </div>
              <p class="text-xs text-surface-400 mt-1">
                {{ formatFecha(notif.fechaCreacion) }}
              </p>
              <div v-if="expandedId === notif.id" class="mt-2 pt-2 border-t border-surface-200">
                <p class="text-sm text-surface-600">{{ notif.mensaje }}</p>
              </div>
              <div v-else class="mt-1">
                <p class="text-sm text-surface-500 truncate">{{ notif.mensaje }}</p>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Paginator
        v-if="totalRegistros > tamano"
        :rows="tamano"
        :totalRecords="totalRegistros"
        :first="pagina * tamano"
        @page="alCambiarPagina"
      />
    </template>
  </div>
</template>
