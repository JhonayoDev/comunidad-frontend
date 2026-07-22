<script setup>
import { ref, watch, onMounted } from "vue";

import { useAuthStore } from "@/stores/authStore";
import { bitacoraService } from "@/services/bitacoraService";
import { usePaginacion } from "@/composables/usePaginacion";
import { useTurno } from "@/composables/useTurno";
import TurnoCard from "@/components/bitacora/TurnoCard.vue";
import EventoCard from "@/components/bitacora/EventoCard.vue";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Paginator from "primevue/paginator";

const auth = useAuthStore();
const eventos = ref([]);
const pagBitacora = usePaginacion();
const loading = ref(true);
const error = ref(null);
const showDialog = ref(false);
const enviando = ref(false);

const { turno, turnoLoading, accionesLabels, confirmMessages, ejecutarAccion } =
  useTurno();

const clasificacionFilter = ref(null);
const tipoFilter = ref(null);

const clasificaciones = [
  { label: "Normal", value: "NORMAL" },
  { label: "Urgente", value: "URGENTE" },
  { label: "Emergencia", value: "EMERGENCIA" },
  { label: "Informativo", value: "INFO" },
];

const tiposEvento = [
  { label: "Novedad", value: "NOVEDAD" },
  { label: "Inicio turno", value: "TURNO_INICIO" },
  { label: "Fin turno", value: "TURNO_FIN" },
  { label: "Colación salida", value: "COLACION_SALIDA" },
  { label: "Colación regreso", value: "COLACION_REGRESO" },
];

const nuevaNovedad = ref({
  tipo: "NOVEDAD",
  clasificacion: "NORMAL",
  observaciones: "",
  fotoUrl: "",
});

async function cargarEventos() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const params = { ...pagBitacora.paramsPaginacion.value };
    if (tipoFilter.value) params.tipo = tipoFilter.value.value;
    if (clasificacionFilter.value)
      params.clasificacion = clasificacionFilter.value.value;
    const res = await bitacoraService.listar(cid, params);
    pagBitacora.actualizar(res.data);
    eventos.value = pagBitacora.contenido.value;
  } catch (e) {
    console.error("Error al cargar bitácora", e);
    error.value = "Error al cargar la bitácora";
  } finally {
    loading.value = false;
  }
}

async function registrarNovedad() {
  if (!nuevaNovedad.value.observaciones.trim()) return;
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    await bitacoraService.registrarEvento(cid, {
      tipo: nuevaNovedad.value.tipo,
      clasificacion: nuevaNovedad.value.clasificacion,
      observaciones: nuevaNovedad.value.observaciones,
      fotoUrl: nuevaNovedad.value.fotoUrl || null,
    });
    showDialog.value = false;
    nuevaNovedad.value = {
      tipo: "NOVEDAD",
      clasificacion: "NORMAL",
      observaciones: "",
      fotoUrl: "",
    };
    await cargarEventos();
  } catch (e) {
    console.error("Error al registrar la novedad", e);
    error.value = "Error al registrar la novedad";
  } finally {
    enviando.value = false;
  }
}

watch([tipoFilter, clasificacionFilter], () => {
  pagBitacora.reiniciar();
  cargarEventos();
});

onMounted(() => {
  cargarEventos();
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>
    <TurnoCard
      v-if="auth.condominioActualRol === 'GUARDIA' && turno"
      :turno="turno"
      :loading="turnoLoading"
      :acciones-labels="accionesLabels"
      :confirm-messages="confirmMessages"
      @action="ejecutarAccion"
    />

    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold m-0">Bitácora</h2>
      <Button
        label="Registrar novedad"
        icon="pi pi-flag"
        severity="primary"
        @click="showDialog = true"
      />
    </div>

    <div class="flex flex-col sm:flex-row gap-2">
      <div class="w-full sm:flex-1">
        <Select
          v-model="tipoFilter"
          :options="tiposEvento"
          optionLabel="label"
          placeholder="Todos los tipos"
          fluid
          clearable
          showClear
        />
      </div>
      <div class="w-full sm:flex-1">
        <Select
          v-model="clasificacionFilter"
          :options="clasificaciones"
          optionLabel="label"
          placeholder="Todas las clasificaciones"
          fluid
          clearable
          showClear
        />
      </div>
    </div>

    <template v-if="loading">
      <div class="flex flex-col gap-3">
        <Card v-for="i in 4" :key="i">
          <template #content>
            <Skeleton width="100%" height="4rem" />
          </template>
        </Card>
      </div>
    </template>

    <template v-else-if="!eventos.length">
      <Card>
        <template #content>
          <div class="flex flex-column align-items-center gap-2 py-4">
            <i class="pi pi-book text-4xl text-surface-300"></i>
            <p class="text-surface-400 m-0">No hay eventos registrados</p>
          </div>
        </template>
      </Card>
    </template>

    <template v-else>
      <div class="flex flex-col gap-3">
        <EventoCard
          v-for="evento in eventos"
          :key="evento.id"
          :evento="evento"
        />
      </div>
      <Paginator
        :rows="pagBitacora.tamano.value"
        :totalRecords="pagBitacora.totalElementos.value"
        :first="pagBitacora.pagina.value * pagBitacora.tamano.value"
        @page="
          pagBitacora.alCambiarPagina($event);
          cargarEventos();
        "
      />
    </template>

    <Dialog
      v-model:visible="showDialog"
      header="Registrar novedad"
      :modal="true"
      class="w-full max-w-md"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Clasificación</label>
          <Select
            v-model="nuevaNovedad.clasificacion"
            :options="clasificaciones"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona clasificación"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Descripción</label>
          <Textarea
            v-model="nuevaNovedad.observaciones"
            rows="4"
            placeholder="Describe la novedad..."
            :autoResize="true"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Foto (opcional)</label>
          <InputText
            v-model="nuevaNovedad.fotoUrl"
            placeholder="URL de la foto"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="showDialog = false"
        />
        <Button
          label="Registrar"
          icon="pi pi-check"
          :disabled="!nuevaNovedad.observaciones.trim()"
          :loading="enviando"
          @click="registrarNovedad"
        />
      </template>
    </Dialog>
  </div>
</template>
