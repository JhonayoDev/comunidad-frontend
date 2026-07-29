<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useVisitas } from "../../composables/useVisitas";

import ConfirmarSalidaDialog from "@/components/visitas/ConfirmarSalidaDialog.vue";
import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Paginator from "primevue/paginator";

const router = useRouter();

const { visitas, loading, error, pagina, tamano, totalElementos, cargar, registrarSalida, alCambiarPagina } = useVisitas();

const filtros = ref({ patente: "", nombre: "", estado: "ACTIVO" });

const estadosFiltro = [
  { label: "Todas", value: "" },
  { label: "Activas", value: "ACTIVO" },
  { label: "Con salida", value: "FINALIZADO" },
];

const indiceExpandido = ref(-1);
const salidaDialogVisible = ref(false);
const salidaTarget = ref(null);
const salidaLoading = ref(false);
const salidaError = ref("");

let timeout = null;
function buscar() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    const params = {};
    if (filtros.value.patente) params.patente = filtros.value.patente;
    if (filtros.value.nombre) params.nombre = filtros.value.nombre;
    if (filtros.value.estado !== "") params.estado = filtros.value.estado;
    pagina.value = 0;
    cargar(params);
  }, 400);
}

function limpiarFiltros() {
  filtros.value = { patente: "", nombre: "", estado: "ACTIVO" };
  pagina.value = 0;
  cargar({ estado: "ACTIVO" });
}

function toggleExpand(idx) {
  indiceExpandido.value = indiceExpandido.value === idx ? -1 : idx;
}

function infoCompacta(v) {
  if (!v) return "";
  const partes = [];
  if (v.unidadNumero) partes.push(`Casa ${v.unidadNumero}`);
  if (v.nombreVisitante) partes.push(v.nombreVisitante);
  return partes.join(" · ");
}

function tipoLabel(t) {
  const labels = { VISITA: "Visita", DELIVERY: "Delivery", UBER: "Uber/Taxi", SERVICIO: "Servicio", TECNICO: "Técnico", OTRO: "Otro" };
  return labels[t] || t;
}

function estadoLabel(e) {
  return e === "ACTIVO" ? "Activa" : "Salió";
}

function estadoSeverity(e) {
  return e === "ACTIVO" ? "success" : "info";
}

function formatFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function abrirDialogSalida(visita) {
  salidaTarget.value = visita;
  salidaError.value = "";
  salidaDialogVisible.value = true;
}

async function onSalidaConfirm(observacion) {
  if (!salidaTarget.value) return;
  salidaLoading.value = true;
  salidaError.value = "";
  const resultado = await registrarSalida(salidaTarget.value, observacion || undefined);
  salidaLoading.value = false;
  if (resultado !== true) {
    salidaError.value = resultado;
  } else {
    salidaDialogVisible.value = false;
    salidaTarget.value = null;
  }
}

function onSalidaCancel() {
  salidaDialogVisible.value = false;
}

onMounted(() => cargar({ estado: "ACTIVO" }));
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Visitas</h1>
      <Button label="Nueva" icon="pi pi-plus" size="small" @click="router.push({ name: 'RegistrarVisita' })" />
    </div>

    <Card>
      <template #content>
        <div class="flex flex-col gap-2">
          <InputText v-model="filtros.patente" placeholder="Buscar por patente" class="uppercase" @input="filtros.patente = filtros.patente.toUpperCase(); buscar()" />
          <InputText v-model="filtros.nombre" placeholder="Buscar por nombre" @input="buscar()" />
          <div class="flex gap-2">
            <Select v-model="filtros.estado" :options="estadosFiltro" optionLabel="label" optionValue="value" placeholder="Filtrar" class="flex-1" size="small" @change="buscar()" />
            <Button label="Limpiar" severity="secondary" variant="text" size="small" @click="limpiarFiltros" />
          </div>
        </div>
      </template>
    </Card>

    <Message v-if="error" severity="warn" :closable="false">{{ error }}</Message>

    <Skeleton v-if="loading" width="100%" height="300px" />

    <div v-else-if="!visitas.length" class="text-center text-text-muted py-8">
      <i class="pi pi-inbox text-4xl block mb-2"></i>
      <span>No hay visitas registradas</span>
    </div>

    <div v-else class="flex flex-col gap-1">
      <div v-for="(v, idx) in visitas" :key="v.id">
        <div
          class="flex items-center justify-between gap-2 p-3 border rounded-lg cursor-pointer transition-colors select-none"
          :class="
            indiceExpandido === idx
              ? 'border-border bg-background rounded-b-none'
              : 'border-border-secondary bg-surface/90 hover:bg-background/95'
          "
          @click="toggleExpand(idx)"
        >
          <div class="flex items-center gap-1 text-xs min-w-0 flex-1 overflow-hidden">
            <span class="text-text font-semibold whitespace-nowrap">{{ v.patenteVisitante || '—' }}</span>
            <span v-if="infoCompacta(v)" class="text-text-muted truncate min-w-0">· {{ infoCompacta(v) }}</span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <Tag :value="estadoLabel(v.estado)" :severity="estadoSeverity(v.estado)" size="small" />
            <i
              :class="indiceExpandido === idx ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
              class="text-xs"
            ></i>
          </div>
        </div>

        <div
          v-if="indiceExpandido === idx"
          class="border border-t-0 border-primary rounded-b-lg p-3 bg-surface"
        >
          <div class="flex flex-col gap-2 text-sm">
            <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <span class="text-text-muted">Nombre:</span>
              <span class="font-medium">{{ v.nombreVisitante }}</span>
              <span v-if="v.rutVisitante" class="text-text-muted">RUT:</span>
              <span v-if="v.rutVisitante">{{ v.rutVisitante }}</span>
              <span v-if="v.telefonoVisitante" class="text-text-muted">Teléfono:</span>
              <span v-if="v.telefonoVisitante">{{ v.telefonoVisitante }}</span>
              <span class="text-text-muted">Tipo:</span>
              <span>{{ tipoLabel(v.tipo) }}</span>
              <span class="text-text-muted">Unidad:</span>
              <span>Casa {{ v.unidadNumero }}</span>
              <span v-if="v.cantidadPersonas" class="text-text-muted">Personas:</span>
              <span v-if="v.cantidadPersonas">{{ v.cantidadPersonas }}</span>
              <span class="text-text-muted">Ingreso:</span>
              <span>{{ formatFecha(v.fechaIngreso) }}</span>
              <span v-if="v.fechaSalida" class="text-text-muted">Salida:</span>
              <span v-if="v.fechaSalida">{{ formatFecha(v.fechaSalida) }}</span>
              <span class="text-text-muted">Registró:</span>
              <span>{{ v.registradoPorNombre }}</span>
            </div>
            <p v-if="v.observacion" class="m-0 text-sm">
              <span class="text-text-muted">Observación:</span> {{ v.observacion }}
            </p>
          </div>
          <div v-if="v.estado === 'ACTIVO'" class="flex gap-2 mt-3">
            <Button
              label="Registrar salida"
              icon="pi pi-sign-out"
              severity="warn"
              size="small"
              @click.stop="abrirDialogSalida(v)"
            />
          </div>
        </div>
      </div>

      <Paginator
        :rows="tamano"
        :totalRecords="totalElementos"
        :first="pagina * tamano"
        @page="alCambiarPagina($event); indiceExpandido = -1"
        class="mt-2"
      />
    </div>

    <ConfirmarSalidaDialog
      v-model:visible="salidaDialogVisible"
      :acceso="salidaTarget"
      :patente="salidaTarget?.patenteVisitante || ''"
      :loading="salidaLoading"
      :error="salidaError"
      @confirm="onSalidaConfirm"
      @cancel="onSalidaCancel"
    />
  </div>
</template>
