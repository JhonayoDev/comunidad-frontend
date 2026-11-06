<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { solicitudesService } from "@/services/solicitudesService";
import { perfilService } from "@/services/perfilService";
import {
  TIPOS_SOLICITUD_ALTA,
  TIPOS_SOLICITUD_API,
  GRUPOS_ESTADO_SOLICITUD,
  ESTADOS_SOLICITUD,
  getTipoSolicitud,
  labelTipoSolicitud,
  labelEstadoSolicitud,
  labelGrupoEstadoSolicitud,
  labelCategoriaSolicitud,
  labelPrioridadSolicitud,
  esCampoVisible,
  valorLegibleCampo,
  construirPayload,
} from "@/data/solicitudTipos";
import { formatearRut, formatearRutCompleto } from "@/utils/validadoresChile";
import { mensajeError } from "@/utils/errores";

import Card from "primevue/card";
import Tag from "primevue/tag";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import InputSwitch from "primevue/inputswitch";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Divider from "primevue/divider";
import Paginator from "primevue/paginator";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const route = useRoute();
const auth = useAuthStore();
const confirm = useConfirm();

const loading = ref(true);
const error = ref(null);
const exito = ref(null);
const solicitudes = ref([]);
const paginacion = ref({ page: 0, size: 20, totalElements: 0, totalPages: 0 });

// Perfil y unidades del residente
const perfil = ref(null);
const unidades = ref([]);

// Filtros
const filtroGrupoEstado = ref("ABIERTA");
const filtroEstado = ref(null);
const filtroTipo = ref(null);
const filtroQ = ref("");

// Formulario nueva solicitud
const showNueva = ref(false);
const enviando = ref(false);
const tipoSeleccionado = ref("SOLICITUD");
const unidadSeleccionada = ref("");
const form = ref({});
const erroresForm = ref({});
const tipoInfo = computed(() => getTipoSolicitud(tipoSeleccionado.value));

// Detalle
const showDetalle = ref(false);
const solicitudActual = ref(null);
const detalle = ref(null);
const loadingDetalle = ref(false);
const nuevoSeguimiento = ref("");
const enviandoSeguimiento = ref(false);

const tipoDetalle = computed(() => getTipoSolicitud(detalle.value?.tipo));
const camposDetalle = computed(() =>
  (tipoDetalle.value?.campos || []).filter((c) =>
    esCampoVisible(c, detalle.value?.datos),
  ),
);

function severityEstado(e) {
  if (e === "RECIBIDA") return "info";
  if (e === "EN_REVISION" || e === "OBSERVADA") return "warn";
  if (e === "RESUELTA") return "success";
  if (e === "RECHAZADA") return "danger";
  return "contrast";
}

function severityPrioridad(p) {
  if (p === "EMERGENCIA") return "danger";
  if (p === "URGENTE") return "warn";
  if (p === "INFO") return "info";
  return "success";
}

function formatearFechaHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function esAbierta(estado) {
  return ["RECIBIDA", "EN_REVISION", "OBSERVADA"].includes(estado);
}

async function cargarPerfil() {
  try {
    const res = await perfilService.getMiPerfil();
    perfil.value = res.data;
  } catch (e) {
    console.error("Error al cargar el perfil", e);
  }
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    const res = await perfilService.getDashboardResidente(cid);
    unidades.value = res.data?.unidades || [];
  } catch (e) {
    console.error("Error al cargar las unidades del residente", e);
  }
}

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) {
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const params = {
      page: paginacion.value.page,
      size: paginacion.value.size,
    };
    if (filtroGrupoEstado.value) params.grupoEstado = filtroGrupoEstado.value;
    if (filtroEstado.value) params.estado = filtroEstado.value;
    if (filtroTipo.value) params.tipo = filtroTipo.value;
    if (filtroQ.value.trim()) params.q = filtroQ.value.trim();

    const res = await solicitudesService.listarMis(cid, params);
    solicitudes.value = res.data?.content || [];
    paginacion.value = {
      page: res.data?.number ?? 0,
      size: res.data?.size ?? 20,
      totalElements: res.data?.totalElements ?? 0,
      totalPages: res.data?.totalPages ?? 0,
    };
  } catch (e) {
    console.error("Error al cargar solicitudes", e);
    error.value = mensajeError(e, "Error al cargar las solicitudes");
  } finally {
    loading.value = false;
  }
}

function aplicarFiltros() {
  paginacion.value.page = 0;
  cargar();
}

function limpiarFiltros() {
  filtroGrupoEstado.value = "ABIERTA";
  filtroEstado.value = null;
  filtroTipo.value = null;
  filtroQ.value = "";
  paginacion.value.page = 0;
  cargar();
}

function onPage(event) {
  paginacion.value.page = event.page;
  paginacion.value.size = event.rows;
  cargar();
}

function prefill(tipoValue) {
  const tipo = getTipoSolicitud(tipoValue);
  if (!tipo) return {};
  return tipo.prefill
    ? tipo.prefill({ rut: perfil.value?.rut, nombre: perfil.value?.nombre })
    : {};
}

function abrirNueva(tipoValue = "SOLICITUD") {
  const tipo =
    getTipoSolicitud(tipoValue) || getTipoSolicitud("SOLICITUD") || null;
  tipoSeleccionado.value = tipo?.value || "SOLICITUD";
  unidadSeleccionada.value = "";
  form.value = prefill(tipoSeleccionado.value);
  erroresForm.value = {};
  exito.value = null;
  showNueva.value = true;
}

function onTipoChange() {
  form.value = prefill(tipoSeleccionado.value);
  erroresForm.value = {};
}

function onRutInput(campoKey) {
  if (form.value[campoKey])
    form.value[campoKey] = formatearRut(form.value[campoKey]);
  delete erroresForm.value[campoKey];
}

function onRutBlur(campoKey) {
  if (form.value[campoKey])
    form.value[campoKey] = formatearRutCompleto(form.value[campoKey]);
}

function validarForm() {
  const tipo = getTipoSolicitud(tipoSeleccionado.value);
  erroresForm.value = tipo?.validacion ? tipo.validacion(form.value) : {};
  return Object.keys(erroresForm.value).length === 0;
}

async function crearSolicitud() {
  if (!validarForm()) return;
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  error.value = null;
  try {
    const payload = construirPayload(tipoSeleccionado.value, form.value, {
      unidadId: unidadSeleccionada.value || null,
    });
    await solicitudesService.crear(cid, payload);
    showNueva.value = false;
    form.value = {};
    exito.value = "Solicitud creada. Puedes seguir su estado en la lista.";
    paginacion.value.page = 0;
    await cargar();
  } catch (e) {
    console.error("Error al crear solicitud", e);
    error.value = mensajeError(e, "Error al crear la solicitud");
  } finally {
    enviando.value = false;
  }
}

async function verDetalle(s) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  solicitudActual.value = s;
  loadingDetalle.value = true;
  showDetalle.value = true;
  nuevoSeguimiento.value = "";
  try {
    const res = await solicitudesService.obtenerMis(cid, s.id);
    detalle.value = res.data;
  } catch (e) {
    console.error("Error al cargar detalle", e);
    error.value = mensajeError(e, "Error al cargar el detalle de la solicitud");
  } finally {
    loadingDetalle.value = false;
  }
}

async function agregarSeguimiento() {
  const cid = auth.condominioActualId;
  if (!cid || !solicitudActual.value || !nuevoSeguimiento.value.trim()) return;
  enviandoSeguimiento.value = true;
  try {
    await solicitudesService.agregarSeguimientoResidente(
      cid,
      solicitudActual.value.id,
      { comentario: nuevoSeguimiento.value.trim() },
    );
    nuevoSeguimiento.value = "";
    await verDetalle(solicitudActual.value);
    await cargar();
  } catch (e) {
    console.error("Error al agregar seguimiento", e);
    error.value = mensajeError(e, "Error al enviar el comentario");
  } finally {
    enviandoSeguimiento.value = false;
  }
}

function confirmarCancelar() {
  confirm.require({
    message: "¿Cancelar esta solicitud? No se podrá revertir.",
    header: "Confirmar cancelación",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Sí, cancelar",
    rejectLabel: "Volver",
    accept: cancelarSolicitud,
  });
}

async function cancelarSolicitud() {
  const cid = auth.condominioActualId;
  if (!cid || !solicitudActual.value) return;
  try {
    await solicitudesService.cancelar(cid, solicitudActual.value.id);
    showDetalle.value = false;
    exito.value = "Solicitud cancelada.";
    await cargar();
  } catch (e) {
    console.error("Error al cancelar", e);
    error.value = mensajeError(e, "Error al cancelar la solicitud");
  }
}

function valorDato(campo) {
  return valorLegibleCampo(
    detalle.value?.tipo,
    campo,
    detalle.value?.datos?.[campo.key],
  );
}

onMounted(async () => {
  await cargarPerfil();
  await cargar();
  const nueva = route.query.nueva;
  if (typeof nueva === "string" && nueva) abrirNueva(nueva);
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <ConfirmDialog />

    <div class="flex items-center justify-between gap-2 flex-wrap">
      <h2 class="text-xl font-bold m-0">Solicitudes y reclamos</h2>
      <Button label="Nueva solicitud" icon="pi pi-plus" @click="abrirNueva()" />
    </div>

    <Message
      v-if="error"
      severity="error"
      :closable="false"
      @close="error = null"
    >
      {{ error }}
    </Message>
    <Message
      v-if="exito"
      severity="success"
      :closable="true"
      @close="exito = null"
    >
      {{ exito }}
    </Message>

    <!-- Filtros -->
    <Card>
      <template #content>
        <div class="flex flex-wrap gap-2 items-end">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Grupo</label>
            <Select
              v-model="filtroGrupoEstado"
              :options="GRUPOS_ESTADO_SOLICITUD"
              optionLabel="label"
              optionValue="value"
              class="w-full md:w-40"
              @change="aplicarFiltros"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Estado</label>
            <Select
              v-model="filtroEstado"
              :options="ESTADOS_SOLICITUD"
              optionLabel="label"
              optionValue="value"
              class="w-full md:w-44"
              placeholder="Todos"
              showClear
              @change="aplicarFiltros"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Tipo</label>
            <Select
              v-model="filtroTipo"
              :options="TIPOS_SOLICITUD_API"
              optionLabel="label"
              optionValue="value"
              class="w-full md:w-56"
              placeholder="Todos"
              showClear
              @change="aplicarFiltros"
            />
          </div>
          <div class="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label class="text-sm font-medium">Buscar</label>
            <InputText
              v-model="filtroQ"
              placeholder="Título, número de solicitud o caso"
              @keydown.enter="aplicarFiltros"
            />
          </div>
          <Button
            label="Limpiar"
            icon="pi pi-filter-slash"
            severity="secondary"
            variant="text"
            @click="limpiarFiltros"
          />
        </div>
      </template>
    </Card>

    <!-- Lista -->
    <Skeleton v-if="loading" width="100%" height="300px" />

    <Card v-else-if="solicitudes.length === 0">
      <template #content>
        <div class="flex flex-col items-center gap-2 py-8">
          <i class="pi pi-inbox text-4xl text-text-subtle"></i>
          <p class="text-text-subprincipal m-0">
            No tienes solicitudes en este grupo
          </p>
          <p class="text-sm text-text-muted m-0">
            Usa "Nueva solicitud" para crear una
          </p>
        </div>
      </template>
    </Card>

    <template v-else>
      <div class="flex flex-col gap-2">
        <Card
          v-for="s in solicitudes"
          :key="s.id"
          class="cursor-pointer"
          @click="verDetalle(s)"
        >
          <template #content>
            <div class="flex items-start justify-between gap-3">
              <div class="flex flex-col gap-1 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs text-text-subprincipal"
                    >#{{ s.numero }}</span
                  >
                  <span class="font-semibold">{{ s.titulo }}</span>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  <Tag
                    :value="labelTipoSolicitud(s.tipo)"
                    size="small"
                    severity="info"
                  />
                  <Tag
                    :value="labelCategoriaSolicitud(s.categoria)"
                    size="small"
                    severity="contrast"
                  />
                  <Tag
                    :value="labelPrioridadSolicitud(s.prioridad)"
                    :severity="severityPrioridad(s.prioridad)"
                    size="small"
                  />
                  <span v-if="s.unidadNumero" class="text-xs text-text-muted">
                    Unidad {{ s.unidadNumero }}
                  </span>
                </div>
                <p class="text-xs text-text-muted m-0">
                  Creada {{ formatearFechaHora(s.creadoEn) }}
                  <span v-if="s.casoNumero"> · Caso #{{ s.casoNumero }}</span>
                </p>
              </div>
              <div class="flex flex-col items-end gap-1">
                <Tag
                  :value="labelEstadoSolicitud(s.estado)"
                  :severity="severityEstado(s.estado)"
                />
                <span class="text-xs text-text-subprincipal">
                  {{ labelGrupoEstadoSolicitud(s.grupoEstado) }}
                </span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <Paginator
        v-if="paginacion.totalElements > paginacion.size"
        :rows="paginacion.size"
        :totalRecords="paginacion.totalElements"
        :first="paginacion.page * paginacion.size"
        @page="onPage"
      />
    </template>

    <!-- Dialog Nueva solicitud -->
    <Dialog
      v-model:visible="showNueva"
      header="Nueva solicitud"
      modal
      :style="{ width: '95%', maxWidth: '620px' }"
    >
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Tipo de solicitud</label>
          <Select
            v-model="tipoSeleccionado"
            :options="TIPOS_SOLICITUD_ALTA"
            optionLabel="label"
            optionValue="value"
            @change="onTipoChange"
          />
          <small v-if="tipoInfo?.descripcion" class="text-xs text-text-muted">
            {{ tipoInfo.descripcion }}
          </small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Casa (opcional)</label>
          <Select
            v-model="unidadSeleccionada"
            :options="unidades"
            optionLabel="numero"
            optionValue="id"
            placeholder="Sin unidad específica"
            showClear
          />
        </div>

        <template v-for="campo in tipoInfo?.campos" :key="campo.key">
          <div v-if="esCampoVisible(campo, form)" class="flex flex-col gap-1">
            <label class="text-sm font-medium">
              {{ campo.label }}
              <span v-if="campo.required" class="text-danger">*</span>
            </label>

            <InputText
              v-if="campo.type === 'rut'"
              v-model="form[campo.key]"
              :placeholder="campo.ayuda"
              :readonly="campo.readonly"
              :class="{ 'p-invalid': erroresForm[campo.key] }"
              maxlength="12"
              @input="onRutInput(campo.key)"
              @blur="onRutBlur(campo.key)"
            />
            <InputText
              v-else-if="campo.type === 'text' || campo.type === 'url'"
              v-model="form[campo.key]"
              :placeholder="campo.ayuda"
              :class="{ 'p-invalid': erroresForm[campo.key] }"
            />
            <Select
              v-else-if="campo.type === 'select'"
              v-model="form[campo.key]"
              :options="campo.options"
              optionLabel="label"
              optionValue="value"
              :placeholder="campo.ayuda"
              :class="{ 'p-invalid': erroresForm[campo.key] }"
            />
            <Textarea
              v-else-if="campo.type === 'textarea'"
              v-model="form[campo.key]"
              :rows="3"
              :placeholder="campo.ayuda"
              :autoResize="true"
              :class="{ 'p-invalid': erroresForm[campo.key] }"
            />
            <div
              v-else-if="campo.type === 'boolean'"
              class="flex items-center gap-2"
            >
              <InputSwitch v-model="form[campo.key]" />
              <span class="text-sm text-text-muted">{{ campo.ayuda }}</span>
            </div>

            <small v-if="erroresForm[campo.key]" class="text-danger">
              {{ erroresForm[campo.key] }}
            </small>
            <small v-else-if="campo.ayuda" class="text-xs text-text-muted">
              {{ campo.ayuda }}
            </small>
          </div>
        </template>

        <div
          v-if="tipoSeleccionado === 'CORRECCION_RUT'"
          class="p-2 bg-inset rounded-border text-xs text-text-muted"
        >
          <i class="pi pi-info-circle" />
          El RUT actual se toma de tu perfil y no se edita aquí. La corrección
          requiere aprobación administrativa explícita.
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="showNueva = false"
        />
        <Button
          label="Crear solicitud"
          icon="pi pi-send"
          :loading="enviando"
          @click="crearSolicitud"
        />
      </template>
    </Dialog>

    <!-- Dialog Detalle -->
    <Dialog
      v-model:visible="showDetalle"
      :header="`Solicitud #${solicitudActual?.numero ?? ''}`"
      modal
      :style="{ width: '95%', maxWidth: '720px' }"
    >
      <div v-if="loadingDetalle" class="flex justify-center py-8">
        <Skeleton width="100%" height="200px" />
      </div>

      <div v-else-if="detalle" class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <span class="font-bold text-lg">{{ detalle.titulo }}</span>
          <div class="flex items-center gap-2 flex-wrap">
            <Tag
              :value="labelTipoSolicitud(detalle.tipo)"
              size="small"
              severity="info"
            />
            <Tag
              :value="labelCategoriaSolicitud(detalle.categoria)"
              size="small"
              severity="contrast"
            />
            <Tag
              :value="labelPrioridadSolicitud(detalle.prioridad)"
              :severity="severityPrioridad(detalle.prioridad)"
              size="small"
            />
            <Tag
              :value="labelEstadoSolicitud(detalle.estado)"
              :severity="severityEstado(detalle.estado)"
              size="small"
            />
            <span v-if="detalle.unidadNumero" class="text-xs text-text-muted">
              Unidad {{ detalle.unidadNumero }}
            </span>
          </div>
        </div>

        <p
          v-if="detalle.descripcion"
          class="text-sm text-text m-0 whitespace-pre-line"
        >
          {{ detalle.descripcion }}
        </p>

        <Message
          v-if="
            detalle.tipo === 'CORRECCION_RUT' && detalle.estado === 'RESUELTA'
          "
          severity="success"
          :closable="false"
        >
          Tu corrección de RUT fue aprobada.
        </Message>

        <Divider v-if="camposDetalle.length" align="left">
          <span class="text-xs font-semibold text-text-muted"
            >Datos de la solicitud</span
          >
        </Divider>
        <div v-if="camposDetalle.length" class="flex flex-col gap-1 text-sm">
          <div
            v-for="campo in camposDetalle"
            :key="campo.key"
            class="flex gap-2"
          >
            <span class="text-text-muted min-w-[150px]"
              >{{ campo.label }}:</span
            >
            <span class="whitespace-pre-wrap">{{ valorDato(campo) }}</span>
          </div>
        </div>

        <template v-if="detalle.casoNumero">
          <Divider align="left">
            <span class="text-xs font-semibold text-text-muted"
              >Caso vinculado</span
            >
          </Divider>
          <div
            class="p-2 bg-inset rounded-border text-sm flex items-center gap-2"
          >
            <i class="pi pi-folder text-primary" />
            <span class="font-medium">Caso #{{ detalle.casoNumero }}</span>
          </div>
        </template>

        <template
          v-if="detalle.estado === 'RECHAZADA' || detalle.estado === 'RESUELTA'"
        >
          <Divider align="left">
            <span class="text-xs font-semibold text-text-muted"
              >Resolución</span
            >
          </Divider>
          <div class="p-2 bg-inset rounded-border text-sm flex flex-col gap-1">
            <span v-if="detalle.resueltoPorNombre">
              Resuelta por {{ detalle.resueltoPorNombre }}
            </span>
            <span v-if="detalle.resueltoEn" class="text-xs text-text-muted">
              {{ formatearFechaHora(detalle.resueltoEn) }}
            </span>
            <span v-if="detalle.motivoResolucion" class="whitespace-pre-line">
              {{ detalle.motivoResolucion }}
            </span>
          </div>
        </template>

        <template v-if="detalle.seguimientos?.length">
          <Divider align="left">
            <span class="text-xs font-semibold text-text-muted"
              >Seguimiento</span
            >
          </Divider>
          <div class="flex flex-col gap-2">
            <div
              v-for="s in detalle.seguimientos"
              :key="s.id"
              class="p-2 bg-inset rounded-border text-sm"
            >
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium">{{ s.realizadoPorNombre }}</span>
                <Tag
                  v-if="s.estadoResultante"
                  :value="labelEstadoSolicitud(s.estadoResultante)"
                  :severity="severityEstado(s.estadoResultante)"
                  size="small"
                />
                <span class="text-xs text-text-subprincipal">
                  {{ formatearFechaHora(s.creadoEn) }}
                </span>
              </div>
              <p class="m-0 mt-1 whitespace-pre-line">{{ s.comentario }}</p>
            </div>
          </div>
        </template>

        <template v-if="esAbierta(detalle.estado)">
          <Divider align="left">
            <span class="text-xs font-semibold text-text-muted">Responder</span>
          </Divider>
          <div class="flex flex-col gap-2">
            <Textarea
              v-model="nuevoSeguimiento"
              rows="3"
              placeholder="Escribe tu comentario..."
              :autoResize="true"
            />
            <div class="flex justify-end">
              <Button
                label="Enviar respuesta"
                icon="pi pi-send"
                :loading="enviandoSeguimiento"
                :disabled="!nuevoSeguimiento.trim()"
                @click="agregarSeguimiento"
              />
            </div>
          </div>

          <Divider align="left">
            <span class="text-xs font-semibold text-text-muted">Acciones</span>
          </Divider>
          <div>
            <Button
              label="Cancelar solicitud"
              icon="pi pi-times"
              severity="danger"
              @click="confirmarCancelar"
            />
          </div>
        </template>
      </div>

      <template #footer>
        <Button
          label="Cerrar"
          severity="secondary"
          variant="text"
          @click="showDetalle = false"
        />
      </template>
    </Dialog>
  </div>
</template>
