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
import Popover from "primevue/popover";

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

const popoverVisibilidad = ref(null);
const popoverPrioridad = ref(null);
const popoverObligatoriedad = ref(null);
function toggleVisibilidad(event) {
  popoverVisibilidad.value.toggle(event);
}
function togglePrioridad(event) {
  popoverPrioridad.value.toggle(event);
}
function toggleObligatoriedad(event) {
  popoverObligatoriedad.value.toggle(event);
}

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
  {
    titulo: "Visibilidad",
    items: [
      { label: "Visible usuario", desc: "Aparece en Perfil > Notificaciones. El usuario puede activar/desactivar los canales no obligatorios." },
      { label: "Solo sistema", desc: "Se envía por los canales configurados pero no aparece en preferencias. El usuario no puede desactivarla. Es de gestión interna (ej. aviso a guardias en turno, reclamo al comité)." },
    ],
  },
  {
    titulo: "Obligatoriedad",
    items: [
      { label: "No obligatorio", desc: "El usuario puede activar o desactivar el canal en Perfil > Notificaciones." },
      { label: "Obligatorio", desc: "El destinatario (según Audiencia) no puede desactivar ese canal. Aunque lo apague, el sistema igual lo envía. Afecta al usuario final; lo ve como toggle bloqueado con Tag 'obligatorio'." },
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
                <div class="flex items-center gap-1">
                  <Tag :value="r.visibleUsuario ? 'Visible usuario' : 'Solo sistema'" :severity="r.visibleUsuario ? 'success' : 'secondary'" size="small" />
                  <Button icon="pi pi-info-circle" severity="secondary" text rounded size="small" aria-label="Qué significa visibilidad" @click="toggleVisibilidad" />
                </div>
              </div>
            </template>
            <template #content>
              <div class="flex flex-col gap-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-surface-500">Audiencia</span>
                  <span>{{ AUDIENCIA_LABELS[r.audiencia] || r.audiencia }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1">
                    <span class="text-surface-500">Prioridad</span>
                    <Button icon="pi pi-info-circle" severity="secondary" text rounded size="small" aria-label="Qué implica cada prioridad" @click="togglePrioridad" />
                  </div>
                  <Tag :value="r.prioridad" :severity="PRIORIDAD_SEVERITY[r.prioridad] || 'info'" size="small" />
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-surface-500">Canales</span>
                  <div class="flex flex-wrap gap-1 justify-end">
                    <Tag v-for="c in r.canales || []" :key="c" :value="CANAL_LABELS[c] || c" :severity="canalSeverity[c] || 'info'" size="small" />
                  </div>
                </div>
                <div class="flex flex-wrap gap-1 mt-1 items-center">
                  <Tag v-if="r.esObligatoriaInapp" value="App obligatoria" severity="danger" size="small" />
                  <Tag v-if="r.esObligatoriaEmail" value="Email obligatorio" severity="danger" size="small" />
                  <Tag v-if="r.esObligatoriaPush" value="Push obligatorio" severity="danger" size="small" />
                  <Button icon="pi pi-info-circle" severity="secondary" text rounded size="small" aria-label="Qué significa obligatoriedad" @click="toggleObligatoriedad" />
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
                <th>
                  <div class="flex items-center gap-1">
                    <span>Obligatoriedad</span>
                    <Button icon="pi pi-info-circle" severity="secondary" text rounded size="small" aria-label="Qué significa obligatoriedad" @click="toggleObligatoriedad" />
                  </div>
                </th>
                <th>
                  <div class="flex items-center gap-1">
                    <span>Visibilidad</span>
                    <Button icon="pi pi-info-circle" severity="secondary" text rounded size="small" aria-label="Qué significa visibilidad" @click="toggleVisibilidad" />
                  </div>
                </th>
                <th>
                  <div class="flex items-center gap-1">
                    <span>Prioridad</span>
                    <Button icon="pi pi-info-circle" severity="secondary" text rounded size="small" aria-label="Qué implica cada prioridad" @click="togglePrioridad" />
                  </div>
                </th>
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
                  <div class="flex items-center gap-1">
                    <Tag :value="r.visibleUsuario ? 'Visible usuario' : 'Solo sistema'" :severity="r.visibleUsuario ? 'success' : 'secondary'" size="small" />
                    <Button icon="pi pi-info-circle" severity="secondary" text rounded size="small" aria-label="Qué significa visibilidad" @click="toggleVisibilidad" />
                  </div>
                </td>
                <td class="whitespace-nowrap">
                  <div class="flex items-center gap-1">
                    <Tag :value="r.prioridad" :severity="PRIORIDAD_SEVERITY[r.prioridad] || 'info'" size="small" />
                    <Button icon="pi pi-info-circle" severity="secondary" text rounded size="small" aria-label="Qué implica cada prioridad" @click="togglePrioridad" />
                  </div>
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
          <div class="flex items-center gap-1">
            <label class="text-sm">Prioridad</label>
            <Button icon="pi pi-info-circle" severity="secondary" text rounded size="small" aria-label="Qué implica cada prioridad" @click="togglePrioridad" />
          </div>
          <Select v-model="form.prioridad" :options="prioridadOptions" option-label="label" option-value="value" class="w-full" />
        </div>
        <Divider />
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1">
              <span class="text-sm">App obligatoria</span>
              <Button icon="pi pi-info-circle" severity="secondary" text rounded size="small" aria-label="Qué significa obligatoriedad" @click="toggleObligatoriedad" />
            </div>
            <InputSwitch v-model="form.esObligatoriaInapp" />
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1">
              <span class="text-sm">Email obligatorio</span>
              <Button icon="pi pi-info-circle" severity="secondary" text rounded size="small" aria-label="Qué significa obligatoriedad" @click="toggleObligatoriedad" />
            </div>
            <InputSwitch v-model="form.esObligatoriaEmail" />
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1">
              <span class="text-sm">Push obligatorio</span>
              <Button icon="pi pi-info-circle" severity="secondary" text rounded size="small" aria-label="Qué significa obligatoriedad" @click="toggleObligatoriedad" />
            </div>
            <InputSwitch v-model="form.esObligatoriaPush" />
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1">
              <span class="text-sm">Visible en preferencias del usuario</span>
              <Button icon="pi pi-info-circle" severity="secondary" text rounded size="small" aria-label="Qué significa visibilidad" @click="toggleVisibilidad" />
            </div>
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

    <Popover ref="popoverVisibilidad" :style="{ width: '340px', maxWidth: '90vw' }">
      <div class="flex flex-col gap-3 p-1">
        <div class="flex items-center gap-2">
          <i class="pi pi-eye text-primary" />
          <span class="font-bold text-sm">Visibilidad</span>
        </div>
        <div class="flex flex-col gap-3 text-sm">
          <div class="flex flex-col gap-1">
            <span class="font-medium">Visible usuario</span>
            <span class="text-xs text-surface-500">Aparece en <strong>Perfil &gt; Notificaciones</strong>. El usuario puede activar o desactivar los canales que no sean obligatorios. Se muestra en su bandeja y preferencias.</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-medium">Solo sistema</span>
            <span class="text-xs text-surface-500">Se envía por los canales configurados, pero <strong>no aparece</strong> en preferencias. El usuario no puede desactivarla. Es de gestión interna del sistema (ej. aviso a guardias en turno, reclamo al comité, reserva a administradores).</span>
          </div>
        </div>
      </div>
    </Popover>

    <Popover ref="popoverPrioridad" :style="{ width: '360px', maxWidth: '90vw' }">
      <div class="flex flex-col gap-3 p-1">
        <div class="flex items-center gap-2">
          <i class="pi pi-flag text-primary" />
          <span class="font-bold text-sm">Prioridad</span>
        </div>
        <p class="text-xs text-surface-500 m-0">Define orden de reintento y reserva de cuota. No cambia el canal, solo la urgencia con la que el sistema la procesa.</p>
        <div class="flex flex-col gap-2 text-sm">
          <div class="flex flex-col gap-1">
            <span class="font-medium"><Tag value="BAJA" severity="info" size="small" class="mr-1" /> Baja</span>
            <span class="text-xs text-surface-500">Informativa. Sin obligatoriedad por defecto. Se reintenta al final, última en cola.</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-medium"><Tag value="NORMAL" severity="warn" size="small" class="mr-1" /> Normal</span>
            <span class="text-xs text-surface-500">Habitual. Se reintenta después de ALTA. Es la prioridad por defecto de la mayoría de avisos.</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-medium"><Tag value="ALTA" severity="danger" size="small" class="mr-1" style="background: var(--p-red-100); color: var(--p-red-700)" /> Alta</span>
            <span class="text-xs text-surface-500">Importante. Reintento prioritario tras CRITICA. Para avisos que deben llegar pronto (visita, reclamo, gasto común).</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-medium"><Tag value="CRITICA" severity="danger" size="small" class="mr-1" /> Crítica</span>
            <span class="text-xs text-surface-500">Máxima prioridad. Reserva <strong>50 cupos diarios de email</strong> (Brevo 300/día) aun con cuota agotada y se reintenta primero. Solo <code>DEUDA_VENCIDA</code> la usa.</span>
          </div>
        </div>
      </div>
    </Popover>

    <Popover ref="popoverObligatoriedad" :style="{ width: '360px', maxWidth: '90vw' }">
      <div class="flex flex-col gap-3 p-1">
        <div class="flex items-center gap-2">
          <i class="pi pi-lock text-primary" />
          <span class="font-bold text-sm">Obligatoriedad por canal</span>
        </div>
        <p class="text-xs text-surface-500 m-0">Cuando <strong>SUPER_ADMIN</strong> (global) o <strong>ADMINISTRADOR</strong> (por condominio) marca un canal como obligatorio, el <strong>destinatario</strong> (según <em>Audiencia</em>: Unidad, Guardias en turno, etc.) <strong>no puede desactivar</strong> ese canal en <strong>Perfil &gt; Notificaciones</strong>.</p>
        <div class="flex flex-col gap-2 text-sm">
          <div class="flex flex-col gap-1">
            <span class="font-medium">¿A quién afecta?</span>
            <span class="text-xs text-surface-500">Al usuario final que recibe la notificación. Aunque apague el canal en sus preferencias, el sistema igual lo envía por ese canal. Ej.: <code>ENCOMIENDA_RECIBIDA</code> con <em>Email obligatorio</em> → el ocupante de la unidad no puede quitar el Email para esa notificación.</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-medium">¿Quién lo ve?</span>
            <span class="text-xs text-surface-500"><strong>SUPER_ADMIN/SOPORTE</strong> lo configura en el catálogo global; <strong>ADMINISTRADOR</strong> lo puede sobrescribir por condominio. El <strong>usuario final</strong> lo ve como toggle bloqueado con candado y <em>Tag “obligatorio”</em> en sus preferencias. Si <em>Visible usuario = Solo sistema</em>, ni siquiera aparece para configurar.</span>
          </div>
        </div>
      </div>
    </Popover>
  </div>
</template>