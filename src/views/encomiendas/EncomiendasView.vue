<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useEncomiendas } from "@/composables/useEncomiendas";
import { unidadesService } from "@/services/unidadesService";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
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
const loadingUnidades = ref(false);
const errorGeneral = ref("");
const mensajeExito = ref("");
const errores = ref({});
const unidades = ref([]);
const filtroEstado = ref("PENDIENTE");

const form = ref({ unidadId: null, tipo: null, nombreDestinatario: "" });

const archivo = ref(null);
const previewUrl = ref(null);
const subiendo = ref(false);

const tiposEncomienda = [
  { label: "Carta", value: "CARTA" },
  { label: "Encomienda / Paquete", value: "ENCOMIENDA" },
];

async function cargarUnidades() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loadingUnidades.value = true;
  try {
    const { data } = await unidadesService.getUnidades(cid);
    unidades.value = data.filter((u) => u.tipo === "CASA");
  } catch (e) {
    console.error("Error al cargar unidades:", e);
  } finally {
    loadingUnidades.value = false;
  }
}

function cambiarFiltro(estado) {
  filtroEstado.value = estado;
  pag.reiniciar();
  const params = estado ? { estado } : {};
  cargar(params);
}

function validar() {
  errores.value = {};
  if (!form.value.unidadId) errores.value.unidadId = "Seleccione una casa";
  if (!form.value.tipo) errores.value.tipo = "Seleccione un tipo";
  if (!form.value.nombreDestinatario) errores.value.nombreDestinatario = "Campo obligatorio";
  return Object.keys(errores.value).length === 0;
}

function onFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  archivo.value = file;
  const reader = new FileReader();
  reader.onload = (e) => { previewUrl.value = e.target.result; };
  reader.readAsDataURL(file);
}

function quitarFoto() {
  archivo.value = null;
  previewUrl.value = null;
}

async function handleRegistrar() {
  errorGeneral.value = "";
  mensajeExito.value = "";
  if (!validar()) return;
  loadingForm.value = true;
  const resultado = await registrar({ ...form.value }, archivo.value);
  if (resultado === true) {
    mensajeExito.value = "Encomienda registrada correctamente";
    cancelar();
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

function cancelar() {
  mostrarFormulario.value = false;
  form.value = { unidadId: null, tipo: null, nombreDestinatario: "" };
  errores.value = {};
  quitarFoto();
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

onMounted(() => { cargarUnidades(); cargar({ estado: "PENDIENTE" }); });
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Encomiendas</h1>
      <Button label="Registrar" icon="pi pi-plus" size="small" @click="mostrarFormulario = !mostrarFormulario" />
    </div>

    <Dialog v-model:visible="mostrarFormulario" header="Nueva encomienda" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">Casa destino *</label>
          <Skeleton v-if="loadingUnidades" width="100%" height="2.5rem" />
          <Select v-else v-model="form.unidadId" :options="unidades" optionLabel="label" optionValue="id" placeholder="Seleccione una casa" :class="{ 'p-invalid': errores.unidadId }" class="w-full">
            <template #option="slotProps">
              <span>Casa {{ slotProps.option.numero }} — {{ slotProps.option.sectorNombre }}</span>
            </template>
          </Select>
          <small v-if="errores.unidadId" class="text-red-500">{{ errores.unidadId }}</small>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">Tipo *</label>
          <Select v-model="form.tipo" :options="tiposEncomienda" optionLabel="label" optionValue="value" placeholder="Seleccione tipo" :class="{ 'p-invalid': errores.tipo }" class="w-full" />
          <small v-if="errores.tipo" class="text-red-500">{{ errores.tipo }}</small>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">Nombre destinatario *</label>
          <InputText v-model="form.nombreDestinatario" placeholder="Nombre del destinatario" :class="{ 'p-invalid': errores.nombreDestinatario }" />
          <small v-if="errores.nombreDestinatario" class="text-red-500">{{ errores.nombreDestinatario }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold">Fotografía (opcional)</label>
          <div v-if="!previewUrl" class="flex gap-2">
            <Button label="Tomar foto" icon="pi pi-camera" size="small" severity="secondary" variant="outlined" @click="$refs.fileInput.click()" />
            <Button label="Seleccionar" icon="pi pi-image" size="small" severity="secondary" variant="outlined" @click="$refs.fileInput.click()" />
          </div>
          <div v-else class="relative">
            <img :src="previewUrl" alt="Preview" class="w-full h-40 object-cover border-round" />
            <Button icon="pi pi-times" severity="danger" text rounded size="small" class="absolute top-1 right-1" @click="quitarFoto" />
          </div>
          <input ref="fileInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onFileChange" />
        </div>

        <Message v-if="errorGeneral" severity="error" :closable="false">{{ errorGeneral }}</Message>
        <Message v-if="mensajeExito" severity="success" :closable="false">{{ mensajeExito }}</Message>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="cancelar" />
        <Button label="Registrar" :loading="loadingForm" @click="handleRegistrar" />
      </template>
    </Dialog>

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

<style scoped>
.hidden { display: none; }
</style>
