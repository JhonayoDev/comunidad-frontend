<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { autorizacionesService } from "@/services/autorizacionesService";

import Card from "primevue/card";
import Tag from "primevue/tag";
import Select from "primevue/select";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";

const auth = useAuthStore();
const autorizaciones = ref([]);
const loading = ref(true);
const error = ref(null);
const estadoFilter = ref({ label: "Pendientes", value: "PENDIENTE" });

const estados = [
  { label: "Pendientes", value: "PENDIENTE" },
  { label: "Utilizadas", value: "UTILIZADA" },
  { label: "Expiradas", value: "EXPIRADA" },
  { label: "Canceladas", value: "CANCELADA" },
  { label: "Todas", value: "" },
];

const tipoLabels = {
  VISITA: "Visita",
  DELIVERY: "Delivery",
  UBER: "Uber",
  SERVICIO: "Servicio",
  TECNICO: "Técnico",
  OTRO: "Otro",
};

function severityEstado(estado) {
  if (estado === "PENDIENTE") return "warn";
  if (estado === "UTILIZADA") return "info";
  if (estado === "EXPIRADA") return "contrast";
  if (estado === "CANCELADA") return "danger";
  return "warn";
}

function formatearFecha(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatearRango(inicio, fin) {
  if (!inicio || !fin) return "";
  const di = new Date(inicio);
  const df = new Date(fin);
  const mismoDia = di.toDateString() === df.toDateString();
  if (mismoDia) {
    return `${di.toLocaleDateString("es-CL", { day: "numeric", month: "short" })} · ${di.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} - ${df.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `${formatearFecha(inicio)} - ${formatearFecha(fin)}`;
}

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const filtros = {};
    if (estadoFilter.value?.value) {
      filtros.estado = estadoFilter.value.value;
    }
    const res = await autorizacionesService.listar(cid, filtros);
    autorizaciones.value = res.data || [];
  } catch (e) {
    console.error("Error al cargar autorizaciones", e);
    error.value = "Error al cargar autorizaciones";
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold m-0">Autorizaciones</h2>
      <Select
        v-model="estadoFilter"
        :options="estados"
        optionLabel="label"
        class="w-10rem"
        @change="cargar"
      />
    </div>

    <template v-if="loading">
      <div class="flex flex-col gap-3">
        <Card v-for="i in 3" :key="i">
          <template #content>
            <Skeleton width="100%" height="4.5rem" />
          </template>
        </Card>
      </div>
    </template>

    <template v-else-if="autorizaciones.length === 0">
      <Card>
        <template #content>
          <div class="flex flex-column align-items-center gap-2 py-4">
            <i class="pi pi-verified text-4xl text-surface-300"></i>
            <p class="text-surface-400 m-0">
              No hay autorizaciones {{ estadoFilter?.value ? estadoFilter.label.toLowerCase() : "" }}
            </p>
          </div>
        </template>
      </Card>
    </template>

    <template v-else>
      <div class="flex flex-col gap-3">
        <Card v-for="authItem in autorizaciones" :key="authItem.id">
          <template #content>
            <div class="flex items-start justify-between">
              <div class="flex flex-col gap-1 flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-semibold">{{ authItem.nombre }}</span>
                  <Tag
                    :value="tipoLabels[authItem.tipo] || authItem.tipo"
                    severity="info"
                  />
                </div>
                <p class="text-sm text-surface-500 m-0">
                  Casa {{ authItem.unidadNumero }}
                  <span v-if="authItem.patenteVisitante">
                    · {{ authItem.patenteVisitante }}
                  </span>
                  <span v-if="authItem.cantidadPersonas > 1">
                    · {{ authItem.cantidadPersonas }} personas
                  </span>
                </p>
                <p class="text-xs text-surface-400 m-0">
                  {{ formatearRango(authItem.fechaInicio, authItem.fechaFin) }}
                </p>
                <p class="text-xs text-surface-400 m-0 mt-1">
                  Creada {{ formatearFecha(authItem.createdAt || authItem.fechaInicio) }}
                </p>
              </div>
              <Tag
                :value="authItem.estado"
                :severity="severityEstado(authItem.estado)"
              />
            </div>
          </template>
        </Card>
      </div>
    </template>
  </div>
</template>
