<script setup>
import { ref, computed, onMounted } from "vue";
import { adminService } from "@/services/adminService";
import { AUDIENCIA_LABELS, AUDIENCIA_DESC, CANAL_LABELS, CANAL_DESC, PRIORIDAD_SEVERITY, PRIORIDAD_DESC } from "@/data/reglasCatalogo";
import InfoAyudaVista from "@/components/common/InfoAyudaVista.vue";
import { useConfirm } from "primevue/useconfirm";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Select from "primevue/select";
import MultiSelect from "primevue/multiselect";
import Checkbox from "primevue/checkbox";
import InputSwitch from "primevue/inputswitch";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Dialog from "primevue/dialog";
import Divider from "primevue/divider";
import ConfirmDialog from "primevue/confirmdialog";

const confirm = useConfirm();

const loading = ref(true);
const error = ref(null);
const reglas = ref([]);

const showEditar = ref(false);
const editando = ref(null);
const enviando = ref(false);
const resultado = ref(null);
const form = ref({
  audiencia: null,
  canales: [],
  prioridad: null,
  esObligatoriaInapp: false,
  esObligatoriaEmail: false,
  esObligatoriaPush: false,
  visibleUsuario: false,
});

const canalOptions = Object.entries(CANAL_LABELS).map(([value, label]) => ({ label, value }));
const audienciaOptions = Object.entries(AUDIENCIA_LABELS).map(([value, label]) => ({ label, value }));
const prioridadOptions = [
  { label: "Baja", value: "BAJA" },
  { label: "Normal", value: "NORMAL" },
  { label: "Alta", value: "ALTA" },
  { label: "Crítica", value: "CRITICA" },
];

const canalSeverity = { IN_APP: "info", EMAIL: "warn", PUSH: "success" };

const seccionesAyuda = [
  {
    titulo: "Audiencia",
    items: Object.entries(AUDIENCIA_LABELS).map(([value, label]) => ({
      label,
      desc: AUDIENCIA_DESC[value],
    })),
  },
  {
    titulo: "Canales",
    items: Object.entries(CANAL_LABELS).map(([value, label]) => ({
      label,
      desc: CANAL_DESC[value],
    })),
  },
  {
    titulo: "Prioridad",
    items: [
      { label: "Baja", desc: PRIORIDAD_DESC.BAJA },
      { label: "Normal", desc: PRIORIDAD_DESC.NORMAL },
      { label: "Alta", desc: PRIORIDAD_DESC.ALTA },
      { label: "Crítica", desc: PRIORIDAD_DESC.CRITICA },
    ],
  },
];

const todosCanalesSeleccionados = computed(
  () => form.value.canales?.length === canalOptions.length,
);

const canalesValidos = computed(() => form.value.canales?.length > 0);

function toggleTodosCanales() {
  form.value.canales = todosCanalesSeleccionados.value ? [] : canalOptions.map((o) => o.value);
}

const hayCambios = computed(() => {
  if (!editando.value) return false;
  return (
    form.value.audiencia !== editando.value.audiencia ||
    form.value.prioridad !== editando.value.prioridad ||
    form.value.esObligatoriaInapp !== editando.value.esObligatoriaInapp ||
    form.value.esObligatoriaEmail !== editando.value.esObligatoriaEmail ||
    form.value.esObligatoriaPush !== editando.value.esObligatoriaPush ||
    form.value.visibleUsuario !== editando.value.visibleUsuario ||
    JSON.stringify(form.value.canales) !== JSON.stringify(editando.value.canales || [])
  );
});

function tipoLabel(tipo) {
  return tipo.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function canalesLabel(canales) {
  if (!canales?.length) return "—";
  return canales.map((c) => CANAL_LABELS[c] || c).join(", ");
}

async function cargar() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await adminService.listarCatalogoReglas();
    reglas.value = data || [];
  } catch (e) {
    console.error("Error al cargar catálogo de reglas de notificación", e);
    error.value = "No se pudo cargar el catálogo de reglas de notificación";
  } finally {
    loading.value = false;
  }
}

function abrirEditar(r) {
  editando.value = r;
  form.value = {
    audiencia: r.audiencia,
    canales: [...(r.canales || [])],
    prioridad: r.prioridad,
    esObligatoriaInapp: r.esObligatoriaInapp,
    esObligatoriaEmail: r.esObligatoriaEmail,
    esObligatoriaPush: r.esObligatoriaPush,
    visibleUsuario: r.visibleUsuario,
  };
  resultado.value = null;
  showEditar.value = true;
}

function confirmarGuardar() {
  confirm.require({
    message: `¿Guardar los cambios de la regla "${tipoLabel(editando.value.tipoNotificacion)}"? Se aplicará a todos los condominios que no tengan sobrescritura.`,
    header: "Guardar regla global",
    acceptLabel: "Guardar",
    rejectLabel: "Cancelar",
    accept: () => guardar(),
  });
}

function confirmarCancelar() {
  if (!hayCambios.value) {
    showEditar.value = false;
    return;
  }
  confirm.require({
    message: "Hay cambios sin guardar. ¿Salir sin guardar?",
    header: "Descartar cambios",
    acceptLabel: "Descartar",
    rejectLabel: "Seguir editando",
    accept: () => {
      showEditar.value = false;
    },
  });
}

async function guardar() {
  if (!editando.value) return;
  enviando.value = true;
  resultado.value = null;
  try {
    await adminService.actualizarReglaCatalogo(editando.value.tipoNotificacion, form.value);
    showEditar.value = false;
    editando.value = null;
    await cargar();
  } catch (e) {
    console.error("Error al guardar regla del catálogo", e);
    resultado.value = e.response?.data?.message || "No se pudo guardar la regla.";
  } finally {
    enviando.value = false;
  }
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div>
      <div class="flex items-center gap-1">
        <h1 class="text-xl font-bold m-0">Catálogo de reglas de notificación</h1>
        <InfoAyudaVista titulo="Reglas de notificación" :secciones="seccionesAyuda" />
      </div>
      <p class="text-sm text-surface-500 m-0 mt-1">
        Reglas globales que aplican a todos los condominios que no tengan sobrescritura propia.
      </p>
    </div>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <template v-else>
      <div v-if="!reglas.length" class="text-center text-surface-400 py-8">No hay reglas en el catálogo</div>

      <template v-else>
        <!-- Mobile: cards -->
        <div class="grid grid-cols-1 gap-3 md:hidden">
          <Card v-for="r in reglas" :key="r.tipoNotificacion">
            <template #title>
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm">{{ tipoLabel(r.tipoNotificacion) }}</span>
                <Tag :value="r.visibleUsuario ? 'Visible usuario' : 'Solo sistema'" :severity="r.visibleUsuario ? 'success' : 'secondary'" size="small" />
              </div>
            </template>
            <template #content>
              <div class="flex flex-col gap-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-surface-500">Audiencia</span>
                  <span>{{ AUDIENCIA_LABELS[r.audiencia] || r.audiencia }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-surface-500">Prioridad</span>
                  <Tag :value="r.prioridad" :severity="PRIORIDAD_SEVERITY[r.prioridad] || 'info'" size="small" />
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-surface-500">Canales</span>
                  <div class="flex flex-wrap gap-1 justify-end">
                    <Tag v-for="c in r.canales || []" :key="c" :value="CANAL_LABELS[c] || c" :severity="canalSeverity[c] || 'info'" size="small" />
                  </div>
                </div>
                <div class="flex flex-wrap gap-1 mt-1">
                  <Tag v-if="r.esObligatoriaInapp" value="App obligatoria" severity="danger" size="small" />
                  <Tag v-if="r.esObligatoriaEmail" value="Email obligatorio" severity="danger" size="small" />
                  <Tag v-if="r.esObligatoriaPush" value="Push obligatorio" severity="danger" size="small" />
                </div>
              </div>
            </template>
            <template #footer>
              <Button label="Editar" size="small" severity="secondary" variant="outlined" class="w-full" @click="abrirEditar(r)" />
            </template>
          </Card>
        </div>

        <!-- Desktop: tabla tipo planilla (estilos en theme/app.css → .planilla) -->
        <div class="planilla hidden md:block">
          <table>
            <thead>
              <tr>
                <th>Regla</th>
                <th>Audiencia</th>
                <th>Canales</th>
                <th>Obligatoriedad</th>
                <th>Visibilidad</th>
                <th>Prioridad</th>
                <th class="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in reglas" :key="r.tipoNotificacion">
                <td class="whitespace-nowrap">
                  <div class="font-medium">{{ tipoLabel(r.tipoNotificacion) }}</div>
                </td>
                <td class="whitespace-nowrap">{{ AUDIENCIA_LABELS[r.audiencia] || r.audiencia }}</td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <Tag v-for="c in r.canales || []" :key="c" :value="CANAL_LABELS[c] || c" :severity="canalSeverity[c] || 'info'" size="small" />
                  </div>
                </td>
                <td class="whitespace-nowrap">
                  <div class="flex flex-col gap-1">
                    <span v-if="r.esObligatoriaInapp" class="inline-flex items-center gap-1">
                      <i class="pi pi-mobile text-xs text-danger" /> App
                    </span>
                    <span v-if="r.esObligatoriaEmail" class="inline-flex items-center gap-1">
                      <i class="pi pi-envelope text-xs text-danger" /> Email
                    </span>
                    <span v-if="r.esObligatoriaPush" class="inline-flex items-center gap-1">
                      <i class="pi pi-bell text-xs text-danger" /> Push
                    </span>
                    <span v-if="!r.esObligatoriaInapp && !r.esObligatoriaEmail && !r.esObligatoriaPush" class="text-text-muted">—</span>
                  </div>
                </td>
                <td class="whitespace-nowrap">
                  <Tag :value="r.visibleUsuario ? 'Visible usuario' : 'Solo sistema'" :severity="r.visibleUsuario ? 'success' : 'secondary'" size="small" />
                </td>
                <td class="whitespace-nowrap">
                  <Tag :value="r.prioridad" :severity="PRIORIDAD_SEVERITY[r.prioridad] || 'info'" size="small" />
                </td>
                <td class="text-right whitespace-nowrap">
                  <Button label="Editar" size="small" severity="secondary" variant="outlined" @click="abrirEditar(r)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <Dialog v-model:visible="showEditar" :header="editando ? `Editar — ${tipoLabel(editando.tipoNotificacion)}` : 'Editar regla'" modal :style="{ width: '95%', maxWidth: '520px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Audiencia</label>
          <Select v-model="form.audiencia" :options="audienciaOptions" option-label="label" option-value="value" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Canales</label>
          <MultiSelect v-model="form.canales" :options="canalOptions" option-label="label" option-value="value" placeholder="Seleccionar canales" :show-toggle-all="false" class="w-full" :class="{ 'p-invalid': !canalesValidos }">
            <template #header>
              <div class="flex items-center gap-2 px-3 py-2">
                <Checkbox :binary="true" :modelValue="todosCanalesSeleccionados" @change="toggleTodosCanales" />
                <span class="text-sm">Seleccionar todos</span>
              </div>
            </template>
          </MultiSelect>
          <Message v-if="!canalesValidos" severity="warn" :closable="false" size="small">
            Selecciona al menos un canal para la regla.
          </Message>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Prioridad</label>
          <Select v-model="form.prioridad" :options="prioridadOptions" option-label="label" option-value="value" class="w-full" />
        </div>
        <Divider />
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-sm">App obligatoria</span>
            <InputSwitch v-model="form.esObligatoriaInapp" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm">Email obligatorio</span>
            <InputSwitch v-model="form.esObligatoriaEmail" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm">Push obligatorio</span>
            <InputSwitch v-model="form.esObligatoriaPush" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm">Visible en panel del usuario</span>
            <InputSwitch v-model="form.visibleUsuario" />
          </div>
        </div>
        <Message v-if="resultado" severity="error" :closable="false">{{ resultado }}</Message>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="confirmarCancelar" />
        <Button label="Guardar" icon="pi pi-check" :loading="enviando" :disabled="!canalesValidos" @click="confirmarGuardar" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>