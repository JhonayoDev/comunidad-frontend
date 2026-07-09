<script setup>
import { ref, watch, onMounted } from "vue";

import { useAuthStore } from "@/stores/authStore";
import { bitacoraService } from "@/services/bitacoraService";
import { usePaginacion } from "@/composables/usePaginacion";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
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
const turno = ref(null);
const loadingTurno = ref(false);

async function cargarTurno() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loadingTurno.value = true;
  try {
    const { data } = await bitacoraService.miTurno(cid);
    turno.value = data;
  } catch {
    turno.value = null;
  } finally {
    loadingTurno.value = false;
  }
}

async function iniciarTurno() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    await bitacoraService.registrarEvento(cid, { tipo: "TURNO_INICIO", clasificacion: "NORMAL", observaciones: "Inicio de turno" });
    await Promise.all([cargarTurno(), cargarEventos()]);
  } catch (e) {
    console.error("Error al iniciar turno", e);
  }
}

async function finalizarTurno() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    await bitacoraService.registrarEvento(cid, { tipo: "TURNO_FIN", clasificacion: "NORMAL", observaciones: "Fin de turno" });
    await Promise.all([cargarTurno(), cargarEventos()]);
  } catch (e) {
    console.error("Error al finalizar turno", e);
  }
}

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

const tipoLabels = {
  TURNO_INICIO: { label: "Inicio de turno", icon: "pi pi-play" },
  TURNO_FIN: { label: "Fin de turno", icon: "pi pi-stop" },
  COLACION_SALIDA: { label: "Salida a colación", icon: "pi pi-clock" },
  COLACION_REGRESO: { label: "Regreso de colación", icon: "pi pi-check-circle" },
  NOVEDAD: { label: "Novedad", icon: "pi pi-flag" },
};

function severityClasificacion(clas) {
  if (clas === "EMERGENCIA") return "danger";
  if (clas === "URGENTE") return "warn";
  if (clas === "NORMAL") return "success";
  return "info";
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

async function cargarEventos() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const params = { ...pagBitacora.paramsPaginacion.value };
    if (tipoFilter.value) params.tipo = tipoFilter.value.value;
    if (clasificacionFilter.value) params.clasificacion = clasificacionFilter.value.value;
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
  cargarTurno();
  cargarEventos();
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold m-0">Bitácora</h2>
      <Button
        label="Registrar novedad"
        icon="pi pi-flag"
        severity="primary"
        @click="showDialog = true"
      />
    </div>

    <Card v-if="auth.condominioActualRol === 'GUARDIA' && !loadingTurno">
      <template #content>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <i :class="turno?.activo ? 'pi pi-play-circle text-green-500' : 'pi pi-stop-circle text-surface-400'" style="font-size:1.5rem"></i>
            <div>
              <span class="text-sm font-medium">{{ turno?.activo ? 'Turno activo' : 'Sin turno activo' }}</span>
              <span v-if="turno?.activo && turno.inicio" class="text-xs text-surface-400 ml-2">Desde {{ new Date(turno.inicio).toLocaleTimeString('es-CL') }}</span>
            </div>
          </div>
          <div class="flex gap-2">
            <Button v-if="!turno?.activo" label="Iniciar turno" icon="pi pi-play" size="small" severity="success" @click="iniciarTurno" />
            <Button v-if="turno?.activo" label="Finalizar turno" icon="pi pi-stop" size="small" severity="danger" @click="finalizarTurno" />
          </div>
        </div>
      </template>
    </Card>

    <div class="flex gap-2">
      <Select
        v-model="tipoFilter"
        :options="tiposEvento"
        optionLabel="label"
        placeholder="Todos los tipos"
        class="w-11rem"
        clearable
        showClear
      />
      <Select
        v-model="clasificacionFilter"
        :options="clasificaciones"
        optionLabel="label"
        placeholder="Todas las clasificaciones"
        class="w-12rem"
        clearable
        showClear
      />
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
        <Card
          v-for="evento in eventos"
          :key="evento.id"
          class="cursor-pointer hover:surface-hover transition-shadow"
        >
          <template #content>
            <div class="flex items-start gap-3">
              <span
                class="inline-flex align-items-center justify-content-center w-2rem h-2rem border-round"
                :style="{
                  background: evento.clasificacion === 'EMERGENCIA'
                    ? 'var(--p-red-100)'
                    : evento.clasificacion === 'URGENTE'
                      ? 'var(--p-yellow-100)'
                      : 'var(--p-surface-100)',
                }"
              >
                <i
                  class="pi"
                  :class="tipoLabels[evento.tipo]?.icon || 'pi-circle'"
                  style="font-size: 0.9rem"
                ></i>
              </span>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium m-0">
                    {{ tipoLabels[evento.tipo]?.label || evento.tipo }}
                  </p>
                  <div class="flex items-center gap-2">
                    <Tag
                      :value="evento.clasificacion"
                      :severity="severityClasificacion(evento.clasificacion)"
                    />
                    <span class="text-xs text-surface-400">
                      {{ formatearFecha(evento.registradoEn) }}
                    </span>
                  </div>
                </div>
                <p
                  v-if="evento.observaciones"
                  class="text-sm text-surface-600 m-0 mt-2"
                >
                  {{ evento.observaciones }}
                </p>
                <p
                  v-if="evento.registradoPorNombre"
                  class="text-xs text-surface-400 m-0 mt-1"
                >
                  {{ evento.registradoPorNombre }}
                </p>
              </div>
            </div>
          </template>
        </Card>
      </div>
      <Paginator
        :rows="pagBitacora.tamano.value"
        :totalRecords="pagBitacora.totalElementos.value"
        :first="pagBitacora.pagina.value * pagBitacora.tamano.value"
        @page="pagBitacora.alCambiarPagina($event); cargarEventos()"
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
