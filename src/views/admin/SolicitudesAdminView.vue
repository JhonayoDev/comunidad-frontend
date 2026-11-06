<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { solicitudesService } from "@/services/solicitudesService";
import { casosService } from "@/services/casosService";
import { unidadesService } from "@/services/unidadesService";
import { personasService } from "@/services/personasService";
import { personalService } from "@/services/personalService";
import {
  TIPOS_SOLICITUD_API,
  CATEGORIAS_SOLICITUD,
  GRUPOS_ESTADO_SOLICITUD,
  ESTADOS_SOLICITUD,
  PRIORIDADES_SOLICITUD,
  getTipoSolicitud,
  labelTipoSolicitud,
  labelEstadoSolicitud,
  labelGrupoEstadoSolicitud,
  labelCategoriaSolicitud,
  labelPrioridadSolicitud,
  esCampoVisible,
  valorLegibleCampo,
} from "@/data/solicitudTipos";
import { mensajeError } from "@/utils/errores";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import InputSwitch from "primevue/inputswitch";
import Tag from "primevue/tag";
import Divider from "primevue/divider";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import DatePicker from "primevue/datepicker";
import Paginator from "primevue/paginator";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const auth = useAuthStore();
const confirm = useConfirm();

const loading = ref(true);
const error = ref(null);
const exito = ref(null);
const solicitudes = ref([]);
const paginacion = ref({ page: 0, size: 20, totalElements: 0, totalPages: 0 });

// Catálogos para filtros y gestión
const opcionesUnidades = ref([]);
const opcionesPersonas = ref([]);
const opcionesCasos = ref([]);
const asignables = ref([]);
const asignacionDisponible = ref(true);

// Filtros
const filtroGrupoEstado = ref("ABIERTA");
const filtroEstado = ref(null);
const filtroCategoria = ref(null);
const filtroTipo = ref(null);
const filtroPrioridad = ref(null);
const filtroUnidad = ref(null);
const filtroPersona = ref(null);
const filtroCaso = ref(null);
const filtroFechaDesde = ref(null);
const filtroFechaHasta = ref(null);
const filtroQ = ref("");

// Detalle
const showDetalle = ref(false);
const solicitudActual = ref(null);
const detalle = ref(null);
const loadingDetalle = ref(false);

const detalleTipo = computed(() => getTipoSolicitud(detalle.value?.tipo));
const camposDetalle = computed(() =>
  (detalleTipo.value?.campos || []).filter((c) =>
    esCampoVisible(c, detalle.value?.datos),
  ),
);
const esCorreccionRut = computed(() => detalle.value?.tipo === "CORRECCION_RUT");
const rutResuelto = computed(
  () => esCorreccionRut.value && detalle.value?.estado === "RESUELTA",
);
const esAbiertaActual = computed(() => esAbierta(detalle.value?.estado));

// Gestión (PATCH: estado operativo, prioridad, responsable)
const estadosOperativos = ESTADOS_SOLICITUD.filter((e) =>
  ["RECIBIDA", "EN_REVISION", "OBSERVADA"].includes(e.value),
);
const gestion = ref({ estado: null, prioridad: null, asignadoAId: null });
const guardandoGestion = ref(false);
const hayCambiosGestion = computed(() => {
  if (!detalle.value) return false;
  return (
    gestion.value.estado !== detalle.value.estado ||
    gestion.value.prioridad !== detalle.value.prioridad ||
    gestion.value.asignadoAId !== detalle.value.asignadoAId
  );
});

// Seguimiento
const nuevoSeguimiento = ref("");
const visibleResidente = ref(true);
const enviandoSeguimiento = ref(false);

// Resolver / aprobar RUT
const showResolver = ref(false);
const errorResolver = ref(null);
const guardandoResolver = ref(false);
const resolverData = ref({ resultado: "RESUELTA", motivo: "" });

// Caso
const showVincularCaso = ref(false);
const casoSeleccionado = ref(null);
const showCrearCaso = ref(false);
const crearCasoData = ref({ titulo: "", descripcion: "", prioridad: "NORMAL" });

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

function severityCategoria(c) {
  return c === "RECLAMO" ? "danger" : "info";
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

function aISOFecha(d) {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function esAbierta(estado) {
  return ["RECIBIDA", "EN_REVISION", "OBSERVADA"].includes(estado);
}

function valorDato(campo) {
  return valorLegibleCampo(
    detalle.value?.tipo,
    campo,
    detalle.value?.datos?.[campo.key],
  );
}

async function cargarOpciones() {
  const cid = auth.condominioActualId;
  if (!cid) return;

  try {
    const res = await unidadesService.getUnidades(cid);
    opcionesUnidades.value = res.data || [];
  } catch (e) {
    console.error("Error al cargar unidades para filtros", e);
  }

  try {
    const res = await personasService.listar(cid);
    opcionesPersonas.value = res.data || [];
  } catch (e) {
    console.error("Error al cargar personas para filtros", e);
  }

  try {
    const res = await casosService.listar(cid, { page: 0, size: 100 });
    opcionesCasos.value = res.data?.content || [];
  } catch (e) {
    console.error("Error al cargar casos para filtros", e);
  }

  try {
    const res = await personalService.listar(cid);
    asignables.value = (res.data || []).filter(
      (p) => p.activo !== false && p.usuarioId,
    );
  } catch (e) {
    console.error("No se pudo listar usuarios asignables (degradación)", e);
    asignables.value = [];
    asignacionDisponible.value = false;
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
    if (filtroCategoria.value) params.categoria = filtroCategoria.value;
    if (filtroTipo.value) params.tipo = filtroTipo.value;
    if (filtroPrioridad.value) params.prioridad = filtroPrioridad.value;
    if (filtroUnidad.value) params.unidadId = filtroUnidad.value;
    if (filtroPersona.value) params.personaId = filtroPersona.value;
    if (filtroCaso.value) params.casoId = filtroCaso.value;
    if (filtroFechaDesde.value) params.fechaDesde = aISOFecha(filtroFechaDesde.value);
    if (filtroFechaHasta.value) params.fechaHasta = aISOFecha(filtroFechaHasta.value);
    if (filtroQ.value.trim()) params.q = filtroQ.value.trim();

    const res = await solicitudesService.listar(cid, params);
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
  filtroCategoria.value = null;
  filtroTipo.value = null;
  filtroPrioridad.value = null;
  filtroUnidad.value = null;
  filtroPersona.value = null;
  filtroCaso.value = null;
  filtroFechaDesde.value = null;
  filtroFechaHasta.value = null;
  filtroQ.value = "";
  paginacion.value.page = 0;
  cargar();
}

function onPage(event) {
  paginacion.value.page = event.page;
  paginacion.value.size = event.rows;
  cargar();
}

async function verDetalle(s) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  solicitudActual.value = s;
  loadingDetalle.value = true;
  showDetalle.value = true;
  nuevoSeguimiento.value = "";
  visibleResidente.value = true;
  try {
    const res = await solicitudesService.obtener(cid, s.id);
    detalle.value = res.data;
    gestion.value = {
      estado: res.data.estado,
      prioridad: res.data.prioridad,
      asignadoAId: res.data.asignadoAId,
    };
  } catch (e) {
    console.error("Error al cargar detalle", e);
    error.value = mensajeError(e, "Error al cargar el detalle de la solicitud");
  } finally {
    loadingDetalle.value = false;
  }
}

async function recargarDetalle() {
  const cid = auth.condominioActualId;
  if (!cid || !solicitudActual.value) return;
  const res = await solicitudesService.obtener(cid, solicitudActual.value.id);
  detalle.value = res.data;
  gestion.value = {
    estado: res.data.estado,
    prioridad: res.data.prioridad,
    asignadoAId: res.data.asignadoAId,
  };
}

async function guardarGestion() {
  const cid = auth.condominioActualId;
  if (!cid || !detalle.value || !hayCambiosGestion.value) return;
  guardandoGestion.value = true;
  error.value = null;
  try {
    const data = {};
    if (gestion.value.estado !== detalle.value.estado) {
      data.estado = gestion.value.estado;
    }
    if (gestion.value.prioridad !== detalle.value.prioridad) {
      data.prioridad = gestion.value.prioridad;
    }
    if (gestion.value.asignadoAId !== detalle.value.asignadoAId) {
      data.asignadoAId = gestion.value.asignadoAId;
    }
    await solicitudesService.actualizar(cid, detalle.value.id, data);
    await recargarDetalle();
    await cargar();
    exito.value = "Solicitud actualizada.";
  } catch (e) {
    console.error("Error al actualizar la solicitud", e);
    error.value = mensajeError(e, "Error al actualizar la solicitud");
  } finally {
    guardandoGestion.value = false;
  }
}

async function agregarSeguimiento() {
  const cid = auth.condominioActualId;
  if (!cid || !detalle.value || !nuevoSeguimiento.value.trim()) return;
  enviandoSeguimiento.value = true;
  error.value = null;
  try {
    await solicitudesService.agregarSeguimiento(cid, detalle.value.id, {
      comentario: nuevoSeguimiento.value.trim(),
      visibleResidente: visibleResidente.value,
    });
    nuevoSeguimiento.value = "";
    await recargarDetalle();
    exito.value = visibleResidente.value
      ? "Respuesta publicada al residente."
      : "Nota interna registrada.";
  } catch (e) {
    console.error("Error al agregar seguimiento", e);
    error.value = mensajeError(e, "Error al agregar el seguimiento");
  } finally {
    enviandoSeguimiento.value = false;
  }
}

function abrirResolucion(resultado) {
  if (!detalle.value) return;
  errorResolver.value = null;
  resolverData.value = {
    resultado,
    motivo: "",
  };
  showResolver.value = true;
}

function confirmarResolucion() {
  if (!resolverData.value.motivo.trim()) return;
  const esRut =
    esCorreccionRut.value && resolverData.value.resultado === "RESUELTA";
  confirm.require({
    message: esRut
      ? `Se corregirá el RUT de ${detalle.value.personaNombre}. Esta acción queda auditada y no se puede deshacer.`
      : `¿Confirmas ${
          resolverData.value.resultado === "RESUELTA" ? "resolver" : "rechazar"
        } la solicitud #${detalle.value.numero}?`,
    header: esRut ? "Aprobar corrección de RUT" : "Confirmar resolución",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Confirmar",
    rejectLabel: "Volver",
    accept: resolverSolicitud,
  });
}

async function resolverSolicitud() {
  const cid = auth.condominioActualId;
  if (!cid || !detalle.value) return;
  guardandoResolver.value = true;
  errorResolver.value = null;
  try {
    const payload = {
      resultado: resolverData.value.resultado,
      motivo: resolverData.value.motivo.trim(),
    };
    if (resolverData.value.resultado === "RESUELTA" && detalle.value.datos?.rutNuevo) {
      payload.datosResolucion = { rutNuevo: detalle.value.datos.rutNuevo };
    }
    await solicitudesService.resolver(cid, detalle.value.id, payload);
    showResolver.value = false;
    await recargarDetalle();
    await cargar();
    exito.value =
      resolverData.value.resultado === "RESUELTA"
        ? "Solicitud resuelta."
        : "Solicitud rechazada.";
  } catch (e) {
    console.error("Error al resolver la solicitud", e);
    errorResolver.value = mensajeError(e, "Error al resolver la solicitud");
  } finally {
    guardandoResolver.value = false;
  }
}

function abrirVincularCaso() {
  casoSeleccionado.value = null;
  showVincularCaso.value = true;
}

async function vincularCaso() {
  const cid = auth.condominioActualId;
  if (!cid || !detalle.value || !casoSeleccionado.value) return;
  error.value = null;
  try {
    await solicitudesService.vincularCaso(cid, detalle.value.id, {
      casoId: casoSeleccionado.value,
    });
    showVincularCaso.value = false;
    await recargarDetalle();
    await cargar();
    exito.value = "Solicitud vinculada al caso.";
  } catch (e) {
    console.error("Error al vincular caso", e);
    error.value = mensajeError(e, "Error al vincular el caso");
  }
}

async function desvincularCaso() {
  const cid = auth.condominioActualId;
  if (!cid || !detalle.value) return;
  error.value = null;
  try {
    await solicitudesService.desvincularCaso(cid, detalle.value.id);
    await recargarDetalle();
    await cargar();
    exito.value = "Solicitud desvinculada del caso.";
  } catch (e) {
    console.error("Error al desvincular caso", e);
    error.value = mensajeError(e, "Error al desvincular el caso");
  }
}

function abrirCrearCaso() {
  if (!detalle.value) return;
  crearCasoData.value = {
    titulo: detalle.value.titulo,
    descripcion: detalle.value.descripcion || "",
    prioridad: detalle.value.prioridad || "NORMAL",
  };
  showCrearCaso.value = true;
}

async function crearCasoDesdeSolicitud() {
  const cid = auth.condominioActualId;
  if (!cid || !detalle.value) return;
  error.value = null;
  try {
    await solicitudesService.crearCaso(cid, detalle.value.id, {
      titulo: crearCasoData.value.titulo || null,
      descripcion: crearCasoData.value.descripcion || null,
      prioridad: crearCasoData.value.prioridad,
    });
    showCrearCaso.value = false;
    await recargarDetalle();
    await cargar();
    exito.value = "Caso creado y vinculado a la solicitud.";
  } catch (e) {
    console.error("Error al crear caso", e);
    error.value = mensajeError(e, "Error al crear el caso");
  }
}

const casosDisponibles = computed(() =>
  opcionesCasos.value.filter((c) => c.estado !== "CERRADO"),
);

const opcionesAsignables = computed(() => {
  const base = asignables.value.map((p) => ({
    label: `${p.nombre}${p.rolEnCondominio ? ` · ${p.rolEnCondominio}` : ""}`,
    value: p.usuarioId,
  }));
  if (
    detalle.value?.asignadoAId &&
    !base.some((o) => o.value === detalle.value.asignadoAId)
  ) {
    base.push({
      label: detalle.value.asignadoANombre || "Asignado actual",
      value: detalle.value.asignadoAId,
    });
  }
  return base;
});

onMounted(async () => {
  await cargarOpciones();
  await cargar();
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <ConfirmDialog />

    <Message v-if="error" severity="error" :closable="false" @close="error = null">
      {{ error }}
    </Message>
    <Message v-if="exito" severity="success" :closable="true" @close="exito = null">
      {{ exito }}
    </Message>

    <!-- Filtros -->
    <Card>
      <template #title>
        <h2 class="text-lg font-bold m-0">Solicitudes y reclamos</h2>
      </template>
      <template #content>
        <div class="flex flex-wrap gap-2 items-end">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Grupo</label>
            <Select
              v-model="filtroGrupoEstado"
              :options="GRUPOS_ESTADO_SOLICITUD"
              optionLabel="label"
              optionValue="value"
              class="w-full md:w-36"
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
              class="w-full md:w-40"
              placeholder="Todos"
              showClear
              @change="aplicarFiltros"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Categoría</label>
            <Select
              v-model="filtroCategoria"
              :options="CATEGORIAS_SOLICITUD"
              optionLabel="label"
              optionValue="value"
              class="w-full md:w-36"
              placeholder="Todas"
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
              class="w-full md:w-52"
              placeholder="Todos"
              showClear
              @change="aplicarFiltros"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Prioridad</label>
            <Select
              v-model="filtroPrioridad"
              :options="PRIORIDADES_SOLICITUD"
              optionLabel="label"
              optionValue="value"
              class="w-full md:w-36"
              placeholder="Todas"
              showClear
              @change="aplicarFiltros"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Unidad</label>
            <Select
              v-model="filtroUnidad"
              :options="opcionesUnidades"
              optionLabel="numero"
              optionValue="id"
              class="w-full md:w-36"
              placeholder="Todas"
              filter
              showClear
              @change="aplicarFiltros"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Persona</label>
            <Select
              v-model="filtroPersona"
              :options="opcionesPersonas"
              optionLabel="nombre"
              optionValue="id"
              class="w-full md:w-44"
              placeholder="Todas"
              filter
              showClear
              @change="aplicarFiltros"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Caso</label>
            <Select
              v-model="filtroCaso"
              :options="opcionesCasos"
              optionLabel="titulo"
              optionValue="id"
              class="w-full md:w-44"
              placeholder="Todos"
              filter
              showClear
              @change="aplicarFiltros"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Desde</label>
            <DatePicker
              v-model="filtroFechaDesde"
              dateFormat="dd/mm/yy"
              showIcon
              class="w-full md:w-40"
              @date-select="aplicarFiltros"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Hasta</label>
            <DatePicker
              v-model="filtroFechaHasta"
              dateFormat="dd/mm/yy"
              showIcon
              class="w-full md:w-40"
              @date-select="aplicarFiltros"
            />
          </div>
          <div class="flex flex-col gap-1 flex-1 min-w-[220px]">
            <label class="text-sm font-medium">Buscar</label>
            <InputText
              v-model="filtroQ"
              placeholder="Título, #solicitud, #caso, persona o unidad"
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
          <p class="text-text-subprincipal m-0">No hay solicitudes con estos filtros</p>
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
                  <span class="text-xs text-text-subprincipal">#{{ s.numero }}</span>
                  <span class="font-semibold">{{ s.titulo }}</span>
                  <Tag
                    :value="labelTipoSolicitud(s.tipo)"
                    size="small"
                    severity="info"
                  />
                  <Tag
                    :value="labelCategoriaSolicitud(s.categoria)"
                    :severity="severityCategoria(s.categoria)"
                    size="small"
                  />
                  <Tag
                    :value="labelPrioridadSolicitud(s.prioridad)"
                    :severity="severityPrioridad(s.prioridad)"
                    size="small"
                  />
                </div>
                <p class="text-xs text-text-muted m-0">
                  {{ formatearFechaHora(s.creadoEn) }}
                  <span v-if="s.personaNombre"> · {{ s.personaNombre }}</span>
                  <span v-if="s.unidadNumero"> · Unidad {{ s.unidadNumero }}</span>
                  <span v-if="s.casoNumero"> · Caso #{{ s.casoNumero }}</span>
                </p>
              </div>
              <div class="flex flex-col items-end gap-1">
                <Tag
                  :value="labelEstadoSolicitud(s.estado)"
                  :severity="severityEstado(s.estado)"
                />
                <span
                  v-if="s.asignadoANombre"
                  class="text-xs text-text-subprincipal"
                >
                  Asignada a {{ s.asignadoANombre }}
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

    <!-- Dialog Detalle -->
    <Dialog
      v-model:visible="showDetalle"
      :header="`Solicitud #${solicitudActual?.numero ?? ''}`"
      modal
      :style="{ width: '95%', maxWidth: '820px' }"
    >
      <div v-if="loadingDetalle" class="flex justify-center py-8">
        <Skeleton width="100%" height="300px" />
      </div>

      <div v-else-if="detalle" class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <span class="font-bold text-lg">{{ detalle.titulo }}</span>
          <div class="flex items-center gap-2 flex-wrap">
            <Tag :value="labelTipoSolicitud(detalle.tipo)" size="small" severity="info" />
            <Tag
              :value="labelCategoriaSolicitud(detalle.categoria)"
              :severity="severityCategoria(detalle.categoria)"
              size="small"
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
            <span class="text-xs text-text-subprincipal">
              {{ labelGrupoEstadoSolicitud(detalle.grupoEstado) }}
            </span>
          </div>
        </div>

        <p
          v-if="detalle.descripcion"
          class="text-sm text-text m-0 whitespace-pre-line"
        >
          {{ detalle.descripcion }}
        </p>

        <Message v-if="rutResuelto" severity="success" :closable="false">
          RUT corregido. Revisar documentos emitidos con el RUT anterior.
        </Message>

        <!-- Datos -->
        <Divider align="left">
          <span class="text-xs font-semibold text-text-muted">Datos</span>
        </Divider>
        <div class="flex flex-col gap-1 text-sm">
          <div class="flex gap-2">
            <span class="text-text-muted min-w-[140px]">Persona:</span>
            <span>{{ detalle.personaNombre || "—" }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-text-muted min-w-[140px]">Unidad:</span>
            <span>{{ detalle.unidadNumero || "—" }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-text-muted min-w-[140px]">Creada por:</span>
            <span>{{ detalle.creadoPorNombre || "—" }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-text-muted min-w-[140px]">Fecha:</span>
            <span>{{ formatearFechaHora(detalle.creadoEn) }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-text-muted min-w-[140px]">Asignada a:</span>
            <span>{{ detalle.asignadoANombre || "Sin asignar" }}</span>
          </div>
          <div v-for="campo in camposDetalle" :key="campo.key" class="flex gap-2">
            <span class="text-text-muted min-w-[140px]">{{ campo.label }}:</span>
            <span class="whitespace-pre-wrap">{{ valorDato(campo) }}</span>
          </div>
        </div>

        <!-- Gestión -->
        <template v-if="esAbiertaActual">
          <Divider align="left">
            <span class="text-xs font-semibold text-text-muted">Gestión</span>
          </Divider>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div class="flex flex-col gap-1">
              <label class="text-xs text-text-muted">Estado</label>
              <Select
                v-model="gestion.estado"
                :options="estadosOperativos"
                optionLabel="label"
                optionValue="value"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-text-muted">Prioridad</label>
              <Select
                v-model="gestion.prioridad"
                :options="PRIORIDADES_SOLICITUD"
                optionLabel="label"
                optionValue="value"
              />
            </div>
            <div v-if="asignacionDisponible" class="flex flex-col gap-1">
              <label class="text-xs text-text-muted">Responsable</label>
              <Select
                v-model="gestion.asignadoAId"
                :options="opcionesAsignables"
                optionLabel="label"
                optionValue="value"
                placeholder="Sin asignar"
              />
            </div>
          </div>
          <div class="flex justify-end">
            <Button
              label="Guardar gestión"
              icon="pi pi-save"
              :loading="guardandoGestion"
              :disabled="!hayCambiosGestion"
              @click="guardarGestion"
            />
          </div>
        </template>

        <!-- Caso -->
        <Divider align="left">
          <span class="text-xs font-semibold text-text-muted">Caso</span>
        </Divider>
        <div v-if="detalle.casoNumero" class="flex items-center gap-2 flex-wrap">
          <i class="pi pi-folder text-primary" />
          <span class="font-medium">Caso #{{ detalle.casoNumero }}</span>
          <Button
            label="Desvincular"
            icon="pi pi-times"
            severity="secondary"
            variant="outlined"
            size="small"
            @click="desvincularCaso"
          />
        </div>
        <div v-else class="flex items-center gap-2 flex-wrap">
          <span class="text-sm text-text-muted">Sin caso vinculado.</span>
          <Button
            label="Vincular a caso"
            icon="pi pi-link"
            severity="secondary"
            @click="abrirVincularCaso"
          />
          <Button
            label="Crear caso"
            icon="pi pi-plus"
            severity="secondary"
            size="small"
            @click="abrirCrearCaso"
          />
        </div>

        <!-- Seguimientos -->
        <Divider align="left">
          <span class="text-xs font-semibold text-text-muted">Seguimientos</span>
        </Divider>
        <div v-if="detalle.seguimientos?.length" class="flex flex-col gap-2">
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
              <span v-if="s.visibleResidente" class="text-xs text-success">
                Visible al residente
              </span>
              <span v-else class="text-xs text-text-muted">Nota interna</span>
            </div>
            <p class="m-0 mt-1 whitespace-pre-line">{{ s.comentario }}</p>
          </div>
        </div>
        <p v-else class="text-sm text-text-muted m-0">Sin seguimientos aún.</p>

        <!-- Responder / nota interna -->
        <template v-if="esAbiertaActual">
          <Divider align="left">
            <span class="text-xs font-semibold text-text-muted">Agregar seguimiento</span>
          </Divider>
          <div class="flex flex-col gap-2">
            <Textarea
              v-model="nuevoSeguimiento"
              rows="2"
              placeholder="Comentario..."
              :autoResize="true"
            />
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2">
                <InputSwitch v-model="visibleResidente" />
                <span class="text-sm text-text-muted">
                  {{
                    visibleResidente
                      ? "Visible para el residente"
                      : "Solo nota interna"
                  }}
                </span>
              </div>
              <Button
                label="Enviar"
                icon="pi pi-send"
                :loading="enviandoSeguimiento"
                :disabled="!nuevoSeguimiento.trim()"
                @click="agregarSeguimiento"
              />
            </div>
          </div>

          <!-- Cierre -->
          <Divider align="left">
            <span class="text-xs font-semibold text-text-muted">Cierre</span>
          </Divider>
          <div class="flex flex-wrap gap-2">
            <Button
              v-if="esCorreccionRut"
              label="Aprobar corrección de RUT"
              icon="pi pi-id-card"
              severity="success"
              @click="abrirResolucion('RESUELTA')"
            />
            <Button
              v-else
              label="Resolver"
              icon="pi pi-check"
              severity="success"
              @click="abrirResolucion('RESUELTA')"
            />
            <Button
              label="Rechazar"
              icon="pi pi-times"
              severity="danger"
              @click="abrirResolucion('RECHAZADA')"
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

    <!-- Dialog Resolver -->
    <Dialog
      v-model:visible="showResolver"
      :header="
        esCorreccionRut && resolverData.resultado === 'RESUELTA'
          ? 'Aprobar corrección de RUT'
          : 'Resolver solicitud'
      "
      modal
      :style="{ width: '95%', maxWidth: '520px' }"
    >
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Resultado</label>
          <Select
            v-model="resolverData.resultado"
            :options="[
              { label: 'Resuelta', value: 'RESUELTA' },
              { label: 'Rechazada', value: 'RECHAZADA' },
            ]"
            optionLabel="label"
            optionValue="value"
          />
        </div>

        <div
          v-if="esCorreccionRut && resolverData.resultado === 'RESUELTA'"
          class="p-2 bg-inset rounded-border text-sm flex flex-col gap-1"
        >
          <span class="font-medium">
            RUT actual: {{ detalle?.datos?.rutActual || "—" }}
          </span>
          <span class="font-medium">
            RUT corregido: {{ detalle?.datos?.rutNuevo || "—" }}
          </span>
          <span class="text-xs text-text-muted">
            Al aprobar se actualiza el RUT de {{ detalle?.personaNombre }} de
            forma atómica y auditada. No hay aprobación automática.
          </span>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Motivo *</label>
          <Textarea
            v-model="resolverData.motivo"
            rows="3"
            placeholder="Explica la resolución..."
            :autoResize="true"
          />
        </div>

        <Message
          v-if="errorResolver"
          severity="error"
          :closable="false"
        >
          {{ errorResolver }}
        </Message>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="showResolver = false"
        />
        <Button
          label="Confirmar"
          icon="pi pi-check"
          :severity="resolverData.resultado === 'RECHAZADA' ? 'danger' : 'success'"
          :loading="guardandoResolver"
          :disabled="!resolverData.motivo.trim()"
          @click="confirmarResolucion"
        />
      </template>
    </Dialog>

    <!-- Dialog Vincular Caso -->
    <Dialog
      v-model:visible="showVincularCaso"
      header="Vincular a caso existente"
      modal
      :style="{ width: '95%', maxWidth: '520px' }"
    >
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Caso abierto</label>
          <Select
            v-model="casoSeleccionado"
            :options="casosDisponibles"
            optionLabel="titulo"
            optionValue="id"
            placeholder="Selecciona un caso"
            filter
            showClear
          />
        </div>
        <p v-if="casoSeleccionado" class="text-sm text-text-muted m-0">
          Se vinculará al caso
          #{{
            casosDisponibles.find((c) => c.id === casoSeleccionado)?.numero
          }}.
        </p>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="showVincularCaso = false"
        />
        <Button
          label="Vincular"
          icon="pi pi-link"
          :disabled="!casoSeleccionado"
          @click="vincularCaso"
        />
      </template>
    </Dialog>

    <!-- Dialog Crear Caso -->
    <Dialog
      v-model:visible="showCrearCaso"
      header="Crear caso desde la solicitud"
      modal
      :style="{ width: '95%', maxWidth: '520px' }"
    >
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Título</label>
          <InputText v-model="crearCasoData.titulo" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Descripción</label>
          <Textarea v-model="crearCasoData.descripcion" rows="3" :autoResize="true" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Prioridad</label>
          <Select
            v-model="crearCasoData.prioridad"
            :options="PRIORIDADES_SOLICITUD"
            optionLabel="label"
            optionValue="value"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="showCrearCaso = false"
        />
        <Button label="Crear caso" icon="pi pi-plus" @click="crearCasoDesdeSolicitud" />
      </template>
    </Dialog>
  </div>
</template>
