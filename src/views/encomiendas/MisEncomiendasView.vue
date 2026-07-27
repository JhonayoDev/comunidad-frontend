<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../../stores/authStore";
import { encomiendasService } from "../../services/encomiendasService";

import Card from "primevue/card";
import Dialog from "primevue/dialog";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";

const auth = useAuthStore();
const encomiendas = ref([]);
const loading = ref(true);
const error = ref(null);

const mostrarDetalle = ref(false);
const cargandoDetalle = ref(false);
const detalle = ref(null);

function severityEncomienda(estado) {
  if (estado === "ENTREGADA") return "info";
  if (estado === "CERRADA") return "contrast";
  return "warn";
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
    const response = await encomiendasService.getMisEncomiendas(cid);
    encomiendas.value = response.data;
  } catch (e) {
    console.error("Error al cargar mis encomiendas", e);
    error.value = "Error al cargar encomiendas";
  } finally {
    loading.value = false;
  }
}

async function abrirDetalle(e) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  cargandoDetalle.value = true;
  mostrarDetalle.value = true;
  try {
    const { data } = await encomiendasService.getEncomienda(cid, e.id);
    detalle.value = data;
  } catch (err) {
    console.error("Error al cargar detalle", err);
  } finally {
    cargandoDetalle.value = false;
  }
}

onMounted(() => cargar());
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <h2 class="text-xl font-bold m-0">Mis encomiendas</h2>

    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <template v-if="loading">
      <Card v-for="i in 3" :key="i">
        <template #content>
          <Skeleton width="100%" height="4rem" />
        </template>
      </Card>
    </template>

    <template v-else-if="encomiendas.length === 0">
      <Card>
        <template #content>
          <div class="flex flex-col items-center py-6 gap-2">
            <i class="pi pi-box text-5xl text-surface-300"></i>
            <p class="text-surface-400">No tienes encomiendas</p>
          </div>
        </template>
      </Card>
    </template>

    <template v-else>
      <Card v-for="e in encomiendas" :key="e.id" class="cursor-pointer" @click="abrirDetalle(e)">
        <template #content>
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <i class="pi pi-inbox text-primary"></i>
                <span class="font-semibold">{{ e.tipo }}</span>
              </div>
              <p class="text-sm mt-1">{{ e.nombreDestinatario }}</p>
              <p class="text-xs text-surface-400">
                Casa {{ e.unidadNumero }} · Recibida {{ formatFecha(e.creadoEn) }}
              </p>
              <p v-if="e.nombreRetira" class="text-xs text-surface-400">
                Retirada por {{ e.nombreRetira }} {{ e.rutRetira ? '(' + e.rutRetira + ')' : '' }}
              </p>
            </div>
            <Tag
              :value="e.estado === 'PENDIENTE' ? 'Pendiente' : e.estado"
              :severity="severityEncomienda(e.estado)"
            />
          </div>
        </template>
      </Card>
    </template>

    <Dialog v-model:visible="mostrarDetalle" :header="detalle ? `Encomienda — Casa ${detalle.unidadNumero}` : 'Detalle'" modal :style="{ width: '95%', maxWidth: '500px' }">
      <Skeleton v-if="cargandoDetalle" width="100%" height="300px" />
      <div v-else-if="detalle" class="flex flex-col gap-3">
        <div v-if="detalle.imagenUrl" class="w-full">
          <img :src="detalle.imagenUrl" alt="Foto encomienda" class="w-full h-64 object-cover border-round" />
        </div>
        <div v-else class="flex flex-col items-center py-4 text-surface-400">
          <i class="pi pi-camera text-3xl mb-1"></i>
          <span class="text-sm">Sin fotografía</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <span class="text-surface-500">Tipo:</span><span class="font-medium">{{ detalle.tipo }}</span>
          <span class="text-surface-500">Destinatario:</span><span class="font-medium">{{ detalle.nombreDestinatario }}</span>
          <span class="text-surface-500">Estado:</span><Tag :value="detalle.estado" :severity="detalle.estado === 'PENDIENTE' ? 'warn' : 'success'" size="small" />
          <span class="text-surface-500">Recibida:</span><span>{{ formatFecha(detalle.creadoEn) }}</span>
          <span v-if="detalle.nombreRetira" class="text-surface-500">Retirada por:</span>
          <span v-if="detalle.nombreRetira">{{ detalle.nombreRetira }} {{ detalle.rutRetira ? `(${detalle.rutRetira})` : '' }}</span>
        </div>
      </div>
    </Dialog>
  </div>
</template>
