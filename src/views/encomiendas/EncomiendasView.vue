<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useEncomiendas } from "@/composables/useEncomiendas";
import { unidadesService } from "@/services/unidadesService";
import { encomiendasService } from "@/services/encomiendasService";

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
const { encomiendas, loading, error, cargar, entregar, pag } = useEncomiendas();

const mostrarFormulario = ref(false);
const mostrarEntrega = ref(false);
const encomiendaEntregando = ref(null);
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

async function registrar() {
  errorGeneral.value = "";
  mensajeExito.value = "";
  if (!validar()) return;
  const cid = auth.condominioActualId;
  if (!cid) return;
  loadingForm.value = true;
  try {
    await encomiendasService.registrar(cid, {
      unidadId: form.value.unidadId,
      tipo: form.value.tipo,
      nombreDestinatario: form.value.nombreDestinatario,
    });
    mensajeExito.value = "Encomienda registrada correctamente";
    cancelar();
    cargar({ estado: filtroEstado.value || undefined });
  } catch (e) {
    errorGeneral.value = e.response?.data?.message || "Error al registrar";
  } finally {
    loadingForm.value = false;
  }
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

function cancelar() {
  mostrarFormulario.value = false;
  form.value = { unidadId: null, tipo: null, nombreDestinatario: "" };
  errores.value = {};
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
        <Message v-if="errorGeneral" severity="error" :closable="false">{{ errorGeneral }}</Message>
        <Message v-if="mensajeExito" severity="success" :closable="false">{{ mensajeExito }}</Message>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="cancelar" />
        <Button label="Registrar" :loading="loadingForm" @click="registrar" />
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
      <Card v-for="e in encomiendas" :key="e.id">
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
              <Button v-if="e.estado === 'PENDIENTE'" label="Entregar" size="small" severity="secondary" variant="outlined" @click="abrirEntrega(e)" />
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
  </div>
</template>
