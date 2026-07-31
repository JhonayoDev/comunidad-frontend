<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useEncomiendas } from "@/composables/useEncomiendas";
import { encomiendasService } from "@/services/encomiendasService";
import RegistrarEncomiendaDialog from "@/components/encomiendas/RegistrarEncomiendaDialog.vue";
import DetalleEncomiendaDialog from "@/components/encomiendas/DetalleEncomiendaDialog.vue";
import EntregarEncomiendaDialog from "@/components/encomiendas/EntregarEncomiendaDialog.vue";
import BuscadorEncomiendas from "@/components/encomiendas/BuscadorEncomiendas.vue";

import Button from "primevue/button";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Paginator from "primevue/paginator";

const auth = useAuthStore();
const { encomiendas, loading, error, cargar, registrar, entregar, pag } =
  useEncomiendas();

const mostrarFormulario = ref(false);
const mostrarDetalle = ref(false);
const encomiendaDetalleId = ref(null);
const mostrarEntrega = ref(false);
const encomiendaEntregando = ref(null);
const loadingForm = ref(false);
const errorGeneral = ref("");
const loadingEntrega = ref(false);
const errorEntrega = ref("");

const indiceExpandido = ref(-1);
const filtroEstado = ref("PENDIENTE");
const filtroBusqueda = ref({ casa: "", nombre: "" });
const filtroAcceso = ref("");
const accesos = ref([]);
const busquedaVisible = ref(false);

const encomiendasFiltradas = computed(() => {
  if (!filtroAcceso.value) return encomiendas.value;
  return (encomiendas.value || []).filter(
    (e) => e.accesoId === filtroAcceso.value,
  );
});

const opcionesAccesos = computed(() => [
  { nombre: "Todas", id: "" },
  ...accesos.value,
]);

const filtros = [
  { label: "Todas", value: "" },
  { label: "Pendientes", value: "PENDIENTE" },
  { label: "Entregadas", value: "ENTREGADA" },
];

function cambiarFiltro() {
  pag.reiniciar();
  buscar();
}

function buscar() {
  const params = {};
  if (filtroEstado.value) params.estado = filtroEstado.value;
  if (filtroBusqueda.value.casa)
    params.unidadNumero = filtroBusqueda.value.casa;
  if (filtroBusqueda.value.nombre)
    params.destinatario = filtroBusqueda.value.nombre;
  cargar(params);
}

function toggleBusqueda() {
  busquedaVisible.value = !busquedaVisible.value;
  if (!busquedaVisible.value) {
    filtroBusqueda.value = { casa: "", nombre: "" };
    buscarDesdeBuscador();
  }
}

function buscarDesdeBuscador() {
  pag.reiniciar();
  buscar();
}

function toggleExpand(idx) {
  indiceExpandido.value = indiceExpandido.value === idx ? -1 : idx;
}

function abrirDetalle(e) {
  encomiendaDetalleId.value = e.id;
  mostrarDetalle.value = true;
}

function abrirEntrega(e) {
  encomiendaEntregando.value = e;
  errorEntrega.value = "";
  mostrarEntrega.value = true;
}

async function handleRegistrar({ formData, archivo }) {
  errorGeneral.value = "";
  loadingForm.value = true;
  const resultado = await registrar(formData, archivo);
  if (resultado === true) {
    mostrarFormulario.value = false;
    buscar();
  } else {
    errorGeneral.value =
      typeof resultado === "string" ? resultado : "Error al registrar";
  }
  loadingForm.value = false;
}

async function handleEntregar({ nombreRetira, rutRetira }) {
  if (!encomiendaEntregando.value) return;
  loadingEntrega.value = true;
  errorEntrega.value = "";
  const resultado = await entregar(
    encomiendaEntregando.value,
    nombreRetira,
    rutRetira,
  );
  if (resultado === true) {
    mostrarEntrega.value = false;
    encomiendaEntregando.value = null;
  } else {
    errorEntrega.value =
      typeof resultado === "string" ? resultado : "Error al registrar entrega";
  }
  loadingEntrega.value = false;
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

function estadoLabel(e) {
  const labels = { PENDIENTE: "Pendiente", ENTREGADA: "Entregada" };
  return labels[e] || e;
}

function estadoSeverity(e) {
  return e === "PENDIENTE" ? "warn" : "success";
}

function tipoLabel(t) {
  const labels = { CARTA: "Carta", ENCOMIENDA: "Encomienda" };
  return labels[t] || t;
}

function infoCompacta(e) {
  const partes = [];
  if (e.unidadNumero) partes.push(`Casa ${e.unidadNumero}`);
  if (e.nombreDestinatario) partes.push(e.nombreDestinatario);
  return partes.join(" · ");
}

onMounted(async () => {
  cargar({ estado: "PENDIENTE" });
  try {
    const cid = auth.condominioActualId;
    if (cid) {
      const { data } = await encomiendasService.getAccesosEncomiendas(cid);
      accesos.value = (data || []).filter((a) => a.activo);
    }
  } catch (e) {
    console.error("Error al cargar accesos:", e);
  }
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Encomiendas</h1>
      <Button
        label="Registrar"
        icon="pi pi-plus"
        size="small"
        @click="mostrarFormulario = !mostrarFormulario"
      />
    </div>
    <div class="flex items-end gap-2">
      <div class="flex flex-col gap-1 flex-1 min-w-0 sm:w-40">
        <label class="text-sm font-semibold">Estado</label>
        <Select
          v-model="filtroEstado"
          :options="filtros"
          optionLabel="label"
          optionValue="value"
          size="small"
          class="w-full"
          @change="cambiarFiltro"
        />
      </div>
      <div
        v-if="accesos.length > 1"
        class="flex flex-col gap-1 min-w-0 sm:w-44"
      >
        <label class="text-sm font-semibold">Punto de recepción</label>
        <Select
          v-model="filtroAcceso"
          :options="opcionesAccesos"
          optionLabel="nombre"
          optionValue="id"
          size="small"
          class="w-full"
        />
      </div>
      <Button
        icon="pi pi-search"
        size="small"
        :severity="busquedaVisible ? 'primary' : 'secondary'"
        variant="outlined"
        class="rounded-lg shrink-0"
        aria-label="Buscar"
        :aria-pressed="busquedaVisible"
        @click="toggleBusqueda"
      />
    </div>

    <BuscadorEncomiendas
      v-if="busquedaVisible"
      v-model:casa="filtroBusqueda.casa"
      v-model:nombre="filtroBusqueda.nombre"
      @buscar="buscarDesdeBuscador"
    />

    <Message v-if="error" severity="warn" :closable="false">{{
      error
    }}</Message>

    <Skeleton v-if="loading" width="100%" height="300px" />

    <div
      v-else-if="!encomiendasFiltradas.length"
      class="text-center text-text-muted py-8"
    >
      <i class="pi pi-box text-4xl block mb-2"></i>
      <span>No hay encomiendas</span>
    </div>

    <div v-else class="flex flex-col gap-1">
      <div v-for="(e, idx) in encomiendasFiltradas" :key="e.id">
        <div
          class="flex items-center justify-between gap-2 p-3 border rounded-lg cursor-pointer transition-colors select-none"
          :class="
            indiceExpandido === idx
              ? 'border-border bg-background rounded-b-none'
              : 'border-border-secondary bg-surface/90 hover:bg-background/95'
          "
          @click="toggleExpand(idx)"
        >
          <div
            class="flex items-center gap-1 text-xs min-w-0 flex-1 overflow-hidden"
          >
            <span class="text-text font-semibold whitespace-nowrap">{{
              infoCompacta(e)
            }}</span>
            <span class="text-text-muted hidden sm:inline truncate min-w-0"
              >· {{ tipoLabel(e.tipo) }}</span
            >
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <Tag
              :value="tipoLabel(e.tipo)"
              size="small"
              class="hidden sm:inline-flex"
            />
            <Tag
              v-if="e.accesoNombre"
              :value="e.accesoNombre"
              severity="info"
              size="small"
            />
            <Tag
              :value="estadoLabel(e.estado)"
              :severity="estadoSeverity(e.estado)"
              size="small"
            />
            <i
              :class="
                indiceExpandido === idx
                  ? 'pi pi-chevron-up'
                  : 'pi pi-chevron-down'
              "
              class="text-xs"
            />
          </div>
        </div>

        <div
          v-if="indiceExpandido === idx"
          class="border border-t-0 border-primary rounded-b-lg p-3 bg-surface"
        >
          <div class="flex flex-col gap-2 text-sm">
            <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <span class="text-text-muted">Tipo:</span>
              <span class="font-medium">{{ tipoLabel(e.tipo) }}</span>

              <span class="text-text-muted">Destinatario:</span>
              <span class="font-medium">{{ e.nombreDestinatario }}</span>

              <span class="text-text-muted">Casa:</span>
              <span class="font-medium">{{ e.unidadNumero }}</span>

              <span v-if="e.accesoNombre" class="text-text-muted"
                >Recepción:</span
              >
              <span v-if="e.accesoNombre">{{ e.accesoNombre }}</span>

              <span class="text-text-muted">Recibida:</span>
              <span>{{ formatFecha(e.creadoEn) }}</span>

              <span class="text-text-muted">Registró:</span>
              <span>{{ e.creadoPorNombre }}</span>

              <span v-if="e.nombreRetira" class="text-text-muted"
                >Retirada por:</span
              >
              <span v-if="e.nombreRetira">
                {{ e.nombreRetira }}
                <span v-if="e.rutRetira">({{ e.rutRetira }})</span>
              </span>
            </div>

            <p v-if="e.observaciones" class="m-0">
              <span class="text-text-muted">Observaciones:</span>
              {{ e.observaciones }}
            </p>
          </div>

          <div class="flex gap-2 mt-3">
            <Button
              v-if="e.estado === 'PENDIENTE'"
              label="Entregar"
              icon="pi pi-check"
              severity="success"
              size="small"
              @click.stop="abrirEntrega(e)"
            />
            <Button
              label="Ver detalle completo"
              icon="pi pi-search"
              severity="secondary"
              size="small"
              variant="outlined"
              @click.stop="abrirDetalle(e)"
            />
          </div>
        </div>
      </div>

      <Paginator
        :rows="pag.tamano.value"
        :totalRecords="pag.totalElementos.value"
        :first="pag.pagina.value * pag.tamano.value"
        @page="
          pag.alCambiarPagina($event);
          buscar();
        "
        class="sticky bottom-0 mt-2 bg-surface z-10"
      />
    </div>

    <RegistrarEncomiendaDialog
      v-model:visible="mostrarFormulario"
      :loading="loadingForm"
      :error="errorGeneral"
      @register="handleRegistrar"
    />

    <DetalleEncomiendaDialog
      v-model:visible="mostrarDetalle"
      :encomiendaId="encomiendaDetalleId"
    />

    <EntregarEncomiendaDialog
      v-model:visible="mostrarEntrega"
      :encomienda="encomiendaEntregando"
      :loading="loadingEntrega"
      :error="errorEntrega"
      @confirm="handleEntregar"
    />
  </div>
</template>
