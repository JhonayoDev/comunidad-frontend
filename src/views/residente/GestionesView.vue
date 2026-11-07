<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { solicitudesService } from "@/services/solicitudesService";
import { labelEstadoSolicitud } from "@/data/solicitudTipos";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";

const router = useRouter();
const auth = useAuthStore();

const seccionActiva = ref(null);
const solicitudes = ref([]);
const loadingSolicitudes = ref(false);

function severityEstado(e) {
  if (e === "RECIBIDA") return "info";
  if (e === "EN_REVISION" || e === "OBSERVADA") return "warn";
  if (e === "RESUELTA") return "success";
  if (e === "RECHAZADA") return "danger";
  return "contrast";
}

function formatearFecha(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function cargarSolicitudes() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loadingSolicitudes.value = true;
  try {
    const { data } = await solicitudesService.listarMis(cid, {
      page: 0,
      size: 5,
      grupoEstado: "ABIERTA",
    });
    solicitudes.value = data?.content || [];
  } catch (e) {
    console.error("Error al cargar solicitudes propias", e);
  } finally {
    loadingSolicitudes.value = false;
  }
}

function irAMisSolicitudes() {
  router.push({ name: "MisSolicitudes" });
}

onMounted(cargarSolicitudes);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <h2 class="text-lg font-bold">Gestiones</h2>

    <Card>
      <template #content>
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-emphasis"
          @click="seccionActiva = seccionActiva === 'visita' ? null : 'visita'"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">🚪</span>
            <div>
              <p class="font-medium">Visita esperada</p>
              <p class="text-xs text-text-subprincipal">Preautorizar ingreso de visita</p>
            </div>
          </div>
          <span class="text-text-subprincipal">{{ seccionActiva === "visita" ? "∨" : "›" }}</span>
        </div>
        <div v-if="seccionActiva === 'visita'" class="px-4 pb-4 border-t border-border-soft">
          <div class="flex flex-col items-center py-6 gap-2">
            <span class="text-4xl">🚧</span>
            <p class="font-semibold">Próximamente</p>
            <p class="text-sm text-text-muted text-center">
              Podrás avisar al guardia que espera una visita con anticipación.
            </p>
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-emphasis"
          @click="seccionActiva = seccionActiva === 'reserva' ? null : 'reserva'"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">📅</span>
            <div>
              <p class="font-medium">Reservar área común</p>
              <p class="text-xs text-text-subprincipal">Quincho, sala multiuso, cancha</p>
            </div>
          </div>
          <span class="text-text-subprincipal">{{ seccionActiva === "reserva" ? "∨" : "›" }}</span>
        </div>
        <div v-if="seccionActiva === 'reserva'" class="px-4 pb-4 border-t border-border-soft">
          <div class="flex flex-col items-center py-6 gap-2">
            <span class="text-4xl">🚧</span>
            <p class="font-semibold">Próximamente</p>
            <p class="text-sm text-text-muted text-center">
              Podrás reservar espacios comunes del condominio.
            </p>
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-emphasis"
          @click="irAMisSolicitudes"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">📝</span>
            <div>
              <p class="font-medium">Solicitudes y reclamos</p>
              <p class="text-xs text-text-subprincipal">
                Crea y sigue el estado de tus solicitudes
              </p>
            </div>
          </div>
          <span class="text-text-subprincipal">›</span>
        </div>

        <div class="px-4 pb-4 flex flex-col gap-2">
          <Skeleton v-if="loadingSolicitudes" width="100%" height="60px" />
          <div
            v-else-if="!solicitudes.length"
            class="flex flex-col items-center py-4 gap-2"
          >
            <span class="text-3xl">📭</span>
            <p class="text-sm text-text-muted m-0">No tienes solicitudes abiertas</p>
            <Button
              label="Crear solicitud"
              icon="pi pi-plus"
              @click="irAMisSolicitudes"
            />
          </div>
          <template v-else>
            <div
              v-for="s in solicitudes"
              :key="s.id"
              class="p-2 bg-inset rounded-border cursor-pointer"
              @click="irAMisSolicitudes"
            >
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs text-text-subprincipal">#{{ s.numero }}</span>
                <span class="text-sm font-medium">{{ s.titulo }}</span>
                <Tag
                  :value="labelEstadoSolicitud(s.estado)"
                  :severity="severityEstado(s.estado)"
                  size="small"
                />
              </div>
              <div class="text-xs text-text-subprincipal mt-1">
                {{ formatearFecha(s.creadoEn) }}
              </div>
            </div>
            <Button
              label="Ver todas"
              icon="pi pi-arrow-right"
              size="small"
              severity="secondary"
              variant="text"
              @click="irAMisSolicitudes"
            />
          </template>
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-emphasis"
          @click="router.push({ name: 'MisEncomiendas' })"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">📦</span>
            <div>
              <p class="font-medium">Mis encomiendas</p>
              <p class="text-xs text-text-subprincipal">Paquetes pendientes de retiro</p>
            </div>
          </div>
          <span class="text-text-subprincipal">›</span>
        </div>
      </template>
    </Card>
  </div>
</template>
