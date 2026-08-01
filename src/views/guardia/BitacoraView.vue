<script setup>
import { ref, watch, onMounted } from "vue";

import { useAuthStore } from "@/stores/authStore";
import { bitacoraService } from "@/services/bitacoraService";
import { usePaginacion } from "@/composables/usePaginacion";
import { useTurno } from "@/composables/useTurno";
import TurnoCard from "@/components/bitacora/TurnoCard.vue";
import EventoCard from "@/components/bitacora/EventoCard.vue";
import NovedadDialog from "@/components/bitacora/NovedadDialog.vue";
import FiltrosBitacora from "@/components/bitacora/FiltrosBitacora.vue";

import Card from "primevue/card";
import Button from "primevue/button";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Paginator from "primevue/paginator";
import Dialog from "primevue/dialog";

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
const rangoFechas = ref(null);
const busquedaVisible = ref(false);

function toggleBusqueda() {
  busquedaVisible.value = !busquedaVisible.value;
  if (!busquedaVisible.value) {
    tipoFilter.value = null;
    clasificacionFilter.value = null;
    rangoFechas.value = null;
  }
}

function formatearDateLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
    if (rangoFechas.value?.[0]) {
      params.desde = `${formatearDateLocal(rangoFechas.value[0])}T00:00:00`;
    }
    if (rangoFechas.value?.[1]) {
      params.hasta = `${formatearDateLocal(rangoFechas.value[1])}T23:59:59`;
    }
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

async function handleNovedadRegister(data) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  error.value = "";
  try {
    await bitacoraService.registrarEvento(cid, {
      tipo: data.tipo,
      clasificacion: data.clasificacion,
      observaciones: data.observaciones,
      fotoUrl: data.fotoUrl || null,
    });
    showDialog.value = false;
    await cargarEventos();
  } catch (e) {
    console.error("Error al registrar la novedad", e);
    error.value = e.response?.data?.message || "Error al registrar la novedad";
  } finally {
    enviando.value = false;
  }
}

watch([tipoFilter, clasificacionFilter, rangoFechas], () => {
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
      <div class="flex items-center gap-2">
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
        <Button
          label="Registrar novedad"
          icon="pi pi-flag"
          severity="primary"
          @click="showDialog = true"
        />
      </div>
    </div>

    <FiltrosBitacora
      v-if="busquedaVisible"
      v-model:tipo="tipoFilter"
      v-model:clasificacion="clasificacionFilter"
      v-model:rango-fechas="rangoFechas"
    />

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
          <div
            class="flex flex-column align-items-center gap-2 py-4 text-text/75"
          >
            <i class="pi pi-book text-4xl"></i>
            <p class="m-0">No hay eventos registrados</p>
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

    <NovedadDialog
      v-model:visible="showDialog"
      :loading="enviando"
      :error="error"
      @register="handleNovedadRegister"
    />
  </div>
</template>
