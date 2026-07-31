<script setup>
import { ref, watch } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { encomiendasService } from "@/services/encomiendasService";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";

const props = defineProps({
  visible: { type: Boolean, default: false },
  encomiendaId: { type: String, default: null },
});

const emit = defineEmits(["update:visible"]);

const auth = useAuthStore();
const encomienda = ref(null);
const loading = ref(false);
const error = ref("");

watch(
  () => props.visible,
  async (v) => {
    if (v && props.encomiendaId) {
      loading.value = true;
      error.value = "";
      encomienda.value = null;
      try {
        const cid = auth.condominioActualId;
        if (!cid) throw new Error("sin condominio");
        const { data } = await encomiendasService.getEncomienda(cid, props.encomiendaId);
        encomienda.value = data;
      } catch (e) {
        console.error("Error al cargar detalle:", e);
        error.value = "Error al cargar el detalle";
      } finally {
        loading.value = false;
      }
    }
  },
);

function formatFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function estadoLabel(e) {
  return e === "PENDIENTE" ? "Pendiente" : e === "ENTREGADA" ? "Entregada" : e;
}

function estadoSeverity(e) {
  return e === "PENDIENTE" ? "warn" : "success";
}

function tipoLabel(t) {
  const labels = { CARTA: "Carta", ENCOMIENDA: "Encomienda / Paquete" };
  return labels[t] || t;
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :header="encomienda ? `Encomienda — Casa ${encomienda.unidadNumero}` : 'Detalle'"
    modal
    :closable="!loading"
    class="w-full max-w-md m-4 bg-surface"
  >
    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <Skeleton v-if="loading" width="100%" height="300px" />

    <div v-else-if="encomienda" class="flex flex-col gap-3">
      <div class="bg-background/90 p-3 flex flex-col gap-3 rounded-lg border border-border/60 shadow-lg">
        <div v-if="encomienda.imagenUrl" class="w-full">
          <img :src="encomienda.imagenUrl" alt="Foto encomienda" class="w-full h-48 object-cover rounded-lg" />
        </div>
        <div v-else class="flex flex-col items-center py-4 text-text-muted">
          <i class="pi pi-camera text-3xl mb-1"></i>
          <span class="text-sm">Sin fotografía</span>
        </div>

        <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <span class="text-text-muted">Tipo:</span>
          <span class="font-medium">{{ tipoLabel(encomienda.tipo) }}</span>

          <span class="text-text-muted">Destinatario:</span>
          <span class="font-medium">{{ encomienda.nombreDestinatario }}</span>

          <span class="text-text-muted">Casa:</span>
          <span class="font-medium">{{ encomienda.unidadNumero }}</span>

          <span class="text-text-muted">Estado:</span>
          <Tag :value="estadoLabel(encomienda.estado)" :severity="estadoSeverity(encomienda.estado)" size="small" />

          <span v-if="encomienda.accesoNombre" class="text-text-muted">Recepción:</span>
          <span v-if="encomienda.accesoNombre">{{ encomienda.accesoNombre }}</span>

          <span class="text-text-muted">Recibida:</span>
          <span>{{ formatFecha(encomienda.creadoEn) }}</span>

          <span class="text-text-muted">Registró:</span>
          <span>{{ encomienda.creadoPorNombre }}</span>

          <span v-if="encomienda.nombreRetira" class="text-text-muted">Retirada por:</span>
          <span v-if="encomienda.nombreRetira">
            {{ encomienda.nombreRetira }}
            <span v-if="encomienda.rutRetira">({{ encomienda.rutRetira }})</span>
          </span>
        </div>

        <div v-if="encomienda.observaciones" class="border-t border-border/60 pt-2 text-sm">
          <span class="text-text-muted">Observaciones:</span>
          <p class="m-0 mt-1">{{ encomienda.observaciones }}</p>
        </div>
      </div>

      <div v-if="encomienda.historial?.length" class="bg-background/90 p-3 flex flex-col gap-2 rounded-lg border border-border/60 shadow-lg">
        <p class="text-sm font-semibold m-0">Historial</p>
        <div v-for="h in encomienda.historial" :key="h.id" class="flex items-center gap-2 text-xs text-text-muted">
          <i class="pi pi-circle-fill text-primary" style="font-size: 0.4rem" />
          <span class="font-medium">{{ h.tipoEvento }}</span>
          <span>— {{ h.realizadoPorNombre }}</span>
          <span class="text-text-muted/50">{{ formatFecha(h.realizadoEn) }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        class="rounded-lg border border-border/80 shadow-lg"
        label="Cerrar"
        severity="secondary"
        text
        @click="$emit('update:visible', false)"
      />
    </template>
  </Dialog>
</template>
