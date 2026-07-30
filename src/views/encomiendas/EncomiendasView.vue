<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useEncomiendas } from "@/composables/useEncomiendas";
import RegistrarEncomiendaDialog from "@/components/encomiendas/RegistrarEncomiendaDialog.vue";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Paginator from "primevue/paginator";

const auth = useAuthStore();
const { encomiendas, loading, error, cargar, registrar, entregar, obtenerDetalle, pag } = useEncomiendas();

const mostrarFormulario = ref(false);
const mostrarEntrega = ref(false);
const mostrarDetalle = ref(false);
const encomiendaEntregando = ref(null);
const encomiendaDetalle = ref(null);
const cargandoDetalle = ref(false);

const nombreRetira = ref("");
const rutRetira = ref("");
const loadingForm = ref(false);
const errorGeneral = ref("");
const filtroEstado = ref("PENDIENTE");

function cambiarFiltro(estado) {
  filtroEstado.value = estado;
  pag.reiniciar();
  const params = estado ? { estado } : {};
  cargar(params);
}

async function handleRegistrar({ formData, archivo }) {
  errorGeneral.value = "";
  loadingForm.value = true;
  const resultado = await registrar(formData, archivo);
  if (resultado === true) {
    mostrarFormulario.value = false;
    cargar({ estado: filtroEstado.value || undefined });
  } else {
    errorGeneral.value = typeof resultado === "string" ? resultado : "Error al registrar";
  }
  loadingForm.value = false;
}

function abrirEntrega(e) {
  encomiendaEntregando.value = e;
  nombreRetira.value = "";
  rutRetira.value = "";
  mostrarEntrega.value = true;
}

async function handleEntregar() {
  if (!nombreRetira.value || !rutRetira.value) return;
  const resultado = await entregar(encomiendaEntregando.value, nombreRetira.value, rutRetira.value);
  if (resultado === true) {
    mostrarEntrega.value = false;
    encomiendaEntregando.value = null;
  }
}

async function abrirDetalle(e) {
  cargandoDetalle.value = true;
  mostrarDetalle.value = true;
  encomiendaDetalle.value = await obtenerDetalle(e.id);
  cargandoDetalle.value = false;
}

const filtros = [
  { label: "Pendientes", value: "PENDIENTE" },
  { label: "Entregadas", value: "ENTREGADA" },
  { label: "Todas", value: "" },
];

function formatFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

onMounted(() => { cargar({ estado: "PENDIENTE" }); });
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Encomiendas</h1>
      <Button label="Registrar" icon="pi pi-plus" size="small" @click="mostrarFormulario = !mostrarFormulario" />
    </div>

    <RegistrarEncomiendaDialog
      v-model:visible="mostrarFormulario"
      :loading="loadingForm"
      :error="errorGeneral"
      @register="handleRegistrar"
    />

    <div class="flex gap-2">
      <Button v-for="f in filtros" :key="f.value" :label="f.label" size="small" :severity="filtroEstado === f.value ? 'primary' : 'secondary'" variant="outlined" @click="cambiarFiltro(f.value)" />
    </div>

    <Message v-if="error" severity="warn" :closable="false">{{ error }}</Message>

    <Skeleton v-if="loading" width="100%" height="300px" />

    <div v-else-if="!encomiendas.length" class="text-center text-surface-400 py-8">
      <i class="pi pi-box text-4xl block mb-2"></i>
      <span>No hay encomiendas</span>
    </div>

    <div v-else class="flex flex-col gap-2">
      <Card v-for="e in encomiendas" :key="e.id" class="cursor-pointer" @click="abrirDetalle(e)">
        <template #content>
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="font-bold m-0">Casa {{ e.unidadNumero }}</p>
              <p class="text-sm m-0">
                <Tag :value="e.tipo" size="small" class="mr-1" />
                {{ e.nombreDestinatario }}
              </p>
              <p class="text-xs text-surface-400 m-0">{{ e.creadoPorNombre }}</p>
              <p class="text-xs text-surface-300 m-0">{{ formatFecha(e.creadoEn) }}</p>
            </div>
            <div class="flex flex-col items-end gap-2 shrink-0">
              <Tag :value="e.estado === 'PENDIENTE' ? 'Pendiente' : 'Entregada'" :severity="e.estado === 'PENDIENTE' ? 'warn' : 'success'" size="small" />
              <Button v-if="e.estado === 'PENDIENTE'" label="Entregar" size="small" severity="secondary" variant="outlined" @click.stop="abrirEntrega(e)" />
            </div>
          </div>
        </template>
      </Card>
      <Paginator
        :rows="pag.tamano.value"
        :totalRecords="pag.totalElementos.value"
        :first="pag.pagina.value * pag.tamano.value"
        @page="pag.alCambiarPagina($event); cargar({ estado: filtroEstado.value || undefined })"
      />
    </div>

    <Dialog v-model:visible="mostrarDetalle" :header="encomiendaDetalle ? `Encomienda — Casa ${encomiendaDetalle.unidadNumero}` : 'Detalle'" modal :style="{ width: '95%', maxWidth: '500px' }">
      <Skeleton v-if="cargandoDetalle" width="100%" height="300px" />
      <div v-else-if="encomiendaDetalle" class="flex flex-col gap-3">
        <div v-if="encomiendaDetalle.imagenUrl" class="w-full">
          <img :src="encomiendaDetalle.imagenUrl" alt="Foto encomienda" class="w-full h-64 object-cover border-round" @click="$refs.imgModal?.show()" />
        </div>
        <div v-else class="flex flex-col items-center py-4 text-surface-400">
          <i class="pi pi-camera text-3xl mb-1"></i>
          <span class="text-sm">Sin fotografía</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <span class="text-surface-500">Tipo:</span><span class="font-medium">{{ encomiendaDetalle.tipo }}</span>
          <span class="text-surface-500">Destinatario:</span><span class="font-medium">{{ encomiendaDetalle.nombreDestinatario }}</span>
          <span class="text-surface-500">Estado:</span><Tag :value="encomiendaDetalle.estado" :severity="encomiendaDetalle.estado === 'PENDIENTE' ? 'warn' : 'success'" size="small" />
          <span class="text-surface-500">Recibida:</span><span>{{ formatFecha(encomiendaDetalle.creadoEn) }}</span>
          <span v-if="encomiendaDetalle.nombreRetira" class="text-surface-500">Retirada por:</span>
          <span v-if="encomiendaDetalle.nombreRetira">{{ encomiendaDetalle.nombreRetira }} {{ encomiendaDetalle.rutRetira ? `(${encomiendaDetalle.rutRetira})` : '' }}</span>
        </div>
        <div v-if="encomiendaDetalle.historial?.length" class="border-t border-surface-200 pt-2">
          <p class="text-sm font-semibold mb-2">Historial</p>
          <div v-for="h in encomiendaDetalle.historial" :key="h.id" class="flex items-center gap-2 text-xs text-surface-500 mb-1">
            <i class="pi pi-circle-fill text-primary" style="font-size: 0.4rem" />
            <span class="font-medium">{{ h.tipoEvento }}</span>
            <span>— {{ h.realizadoPorNombre }}</span>
            <span class="text-surface-300">{{ formatFecha(h.realizadoEn) }}</span>
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="mostrarEntrega" header="Entregar encomienda" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <p class="text-sm text-surface-500 m-0">
          Entregando encomienda de <strong>{{ encomiendaEntregando?.nombreDestinatario }}</strong> — Casa {{ encomiendaEntregando?.unidadNumero }}
        </p>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">Nombre de quien retira *</label>
          <InputText v-model="nombreRetira" placeholder="Nombre completo" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">RUT de quien retira *</label>
          <InputText v-model="rutRetira" placeholder="12.345.678-9" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="mostrarEntrega = false" />
        <Button label="Confirmar entrega" :loading="loading" :disabled="!nombreRetira || !rutRetira" @click="handleEntregar" />
      </template>
    </Dialog>
  </div>
</template>

