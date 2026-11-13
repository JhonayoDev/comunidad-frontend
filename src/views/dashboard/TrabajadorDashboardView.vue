<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { anunciosService } from "@/services/anunciosService";
import { labelCargo } from "@/data/cargos";
import {
  labelTipoParticipacion,
  severityTipoParticipacion,
} from "@/data/membresia";

import Card from "primevue/card";
import Avatar from "primevue/avatar";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Divider from "primevue/divider";

const router = useRouter();
const auth = useAuthStore();

const comunicados = ref([]);
const cargandoComunicados = ref(false);
const errorComunicados = ref(null);

const puedeVerNotificaciones = computed(() =>
  auth.permisos.includes("NOTIFICACION_VER"),
);
const puedeVerComunicados = computed(
  () =>
    auth.permisos.includes("COMUNICADO_VER") ||
    auth.permisos.includes("NOTIFICACION_VER"),
);

const cargo = computed(() => labelCargo(auth.condominioActualCargo));
const tipos = computed(() => auth.condominioActualTiposParticipacion || []);

function formatearFecha(valor) {
  if (!valor) return "";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function cargarComunicados() {
  const cid = auth.condominioActualId;
  if (!cid || !puedeVerNotificaciones.value) return;

  cargandoComunicados.value = true;
  errorComunicados.value = null;
  try {
    const { data } = await anunciosService.listarVigentes(cid);
    comunicados.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Error al cargar los comunicados del condominio", e);
    errorComunicados.value =
      "No se pudieron cargar los comunicados en este momento.";
    comunicados.value = [];
  } finally {
    cargandoComunicados.value = false;
  }
}

onMounted(cargarComunicados);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Card>
      <template #content>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Avatar
            :label="(auth.userName || 'T').charAt(0).toUpperCase()"
            shape="circle"
            size="large"
          />
          <div class="min-w-0 flex flex-col gap-1">
            <h1 class="text-xl font-bold m-0 truncate">
              Hola, {{ auth.userName || "trabajador" }}
            </h1>
            <span class="text-sm text-text-muted truncate">
              {{ auth.condominioActualNombre || "Condominio" }}
            </span>
            <div class="flex flex-wrap items-center gap-1">
              <Tag v-if="cargo" :value="cargo" severity="warn" size="small" />
              <Tag
                v-for="tipo in tipos"
                :key="tipo"
                :value="labelTipoParticipacion(tipo)"
                :severity="severityTipoParticipacion(tipo)"
                size="small"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-user text-primary-400" />
            <span class="text-base">Mi perfil</span>
          </div>
        </template>
        <template #content>
          <p class="text-sm text-text-muted m-0">
            Revisa tus datos personales y preferencias de notificación.
          </p>
        </template>
        <template #footer>
          <Button
            label="Ver mi perfil"
            icon="pi pi-user"
            severity="secondary"
            variant="text"
            size="small"
            @click="router.push({ name: 'Perfil' })"
          />
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-bell text-primary-400" />
            <span class="text-base">Notificaciones</span>
          </div>
        </template>
        <template #content>
          <p class="text-sm text-text-muted m-0">
            Consulta los avisos y mensajes enviados a tu cuenta.
          </p>
        </template>
        <template #footer>
          <Button
            label="Ver notificaciones"
            icon="pi pi-bell"
            severity="secondary"
            variant="text"
            size="small"
            :disabled="!puedeVerNotificaciones"
            @click="router.push({ name: 'Notificaciones' })"
          />
        </template>
      </Card>
    </div>

    <Card v-if="puedeVerComunicados">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-megaphone text-primary-400" />
          <span class="text-base">Comunicados del condominio</span>
        </div>
      </template>
      <template #content>
        <Skeleton v-if="cargandoComunicados" width="100%" height="5rem" />
        <Message
          v-else-if="errorComunicados"
          severity="warn"
          :closable="false"
        >
          {{ errorComunicados }}
        </Message>
        <div
          v-else-if="!comunicados.length"
          class="text-sm text-text-muted py-2"
        >
          No hay comunicados vigentes.
        </div>
        <div v-else class="flex flex-col gap-2">
          <div
            v-for="comunicado in comunicados"
            :key="comunicado.id"
            class="flex flex-col gap-1 p-2 bg-inset border border-border-soft rounded-lg"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium">{{ comunicado.titulo }}</span>
              <Tag
                v-if="comunicado.prioridad === 'ALTA'"
                value="Importante"
                severity="warn"
                size="small"
              />
            </div>
            <p class="text-sm text-text-muted m-0 whitespace-pre-line">
              {{ comunicado.mensaje }}
            </p>
            <span class="text-xs text-text-subtle">
              {{ formatearFecha(comunicado.fechaPublicacion) }}
            </span>
          </div>
        </div>
      </template>
    </Card>

    <Divider />

    <div class="flex flex-wrap gap-2">
      <Button
        label="Mis permisos"
        icon="pi pi-shield"
        severity="secondary"
        variant="text"
        size="small"
        @click="router.push({ name: 'MisPermisos' })"
      />
    </div>
  </div>
</template>
