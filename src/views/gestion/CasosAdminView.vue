<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { casosService } from "@/services/casosService";
import { solicitudesService } from "@/services/solicitudesService";
import {
  labelTipoSolicitud,
  labelCategoriaSolicitud,
  labelEstadoSolicitud,
} from "@/data/solicitudTipos";
import { mensajeError } from "@/utils/errores";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Textarea from "primevue/textarea";
import Select from "primevue/select";
import InputText from "primevue/inputtext";
import Checkbox from "primevue/checkbox";
import Tag from "primevue/tag";
import Divider from "primevue/divider";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Paginator from "primevue/paginator";

const auth = useAuthStore();

const loading = ref(true);
const error = ref(null);
const exito = ref(null);
const casos = ref([]);
const paginacion = ref({ page: 0, size: 20, totalElements: 0, totalPages: 0 });

const filtroEstado = ref(null);
const filtroQ = ref("");

const showDetalle = ref(false);
const showSeguimiento = ref(false);
const showCerrar = ref(false);
const showVincular = ref(false);
const casoActual = ref(null);
const detalle = ref(null);
const loadingDetalle = ref(false);
const enviando = ref(false);

const formSeguimiento = ref({ comentario: "", nuevoEstado: null });
const resumenCierre = ref("");

const solicitudesDisponibles = ref([]);
const seleccionadas = ref([]);
const cargandoSolicitudes = ref(false);

const estados = [
  { label: "Todos", value: null },
  { label: "Abierto", value: "ABIERTO" },
  { label: "En gestión", value: "EN_GESTION" },
  { label: "Resuelto", value: "RESUELTO" },
  { label: "Cerrado", value: "CERRADO" },
];

const ESTADO_CASO_LABELS = {
  ABIERTO: "Abierto",
  EN_GESTION: "En gestión",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
};

const TIPO_REFERENCIA_LABELS = {
  BITACORA_ENTRY: "Bitácora",
  RECLAMO: "Reclamo",
  GASTO_EXTRAORDINARIO: "Gasto extraordinario",
  OTRO: "Otro",
};

function labelEstadoCaso(estado) {
  return ESTADO_CASO_LABELS[estado] || estado;
}

function labelTipoReferencia(tipo) {
  return TIPO_REFERENCIA_LABELS[tipo] || tipo;
}

const estadosSeguimiento = [
  { label: "Sin cambio", value: null },
  { label: "Abierto", value: "ABIERTO" },
  { label: "En gestión", value: "EN_GESTION" },
  { label: "Resuelto", value: "RESUELTO" },
];

const tieneFinanzas = computed(
  () =>
    (detalle.value?.gastos?.length || 0) +
      (detalle.value?.cargosAdicionales?.length || 0) +
      (detalle.value?.mantenciones?.length || 0) >
    0,
);

function severityEstado(e) {
  if (e === "ABIERTO") return "info";
  if (e === "EN_GESTION") return "warn";
  if (e === "RESUELTO") return "success";
  if (e === "CERRADO") return "contrast";
  return "info";
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

function formatearMonto(monto) {
  if (monto === null || monto === undefined) return "—";
  const n = Number(monto);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP" });
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
    if (filtroEstado.value) params.estado = filtroEstado.value;
    if (filtroQ.value.trim()) params.q = filtroQ.value.trim();

    const { data } = await casosService.listar(cid, params);
    casos.value = data?.content || [];
    paginacion.value = {
      page: data?.number ?? 0,
      size: data?.size ?? 20,
      totalElements: data?.totalElements ?? 0,
      totalPages: data?.totalPages ?? 0,
    };
  } catch (e) {
    console.error("Error al cargar casos", e);
    error.value = mensajeError(e, "No se pudieron cargar los casos");
  } finally {
    loading.value = false;
  }
}

async function verDetalle(c) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  casoActual.value = c;
  loadingDetalle.value = true;
  showDetalle.value = true;
  try {
    const { data } = await casosService.obtener(cid, c.id);
    detalle.value = data;
  } catch (e) {
    console.error("Error al cargar detalle del caso", e);
    error.value = mensajeError(e, "Error al cargar el detalle del caso");
  } finally {
    loadingDetalle.value = false;
  }
}

async function recargarDetalle() {
  const cid = auth.condominioActualId;
  if (!cid || !casoActual.value) return;
  const { data } = await casosService.obtener(cid, casoActual.value.id);
  detalle.value = data;
}

function onPage(event) {
  paginacion.value.page = event.page;
  paginacion.value.size = event.rows;
  cargar();
}

function aplicarFiltros() {
  paginacion.value.page = 0;
  cargar();
}

function limpiarFiltros() {
  filtroEstado.value = null;
  filtroQ.value = "";
  paginacion.value.page = 0;
  cargar();
}

function abrirSeguimiento() {
  formSeguimiento.value = { comentario: "", nuevoEstado: null };
  showSeguimiento.value = true;
}

async function agregarSeguimiento() {
  const cid = auth.condominioActualId;
  if (!cid || !detalle.value || !formSeguimiento.value.comentario.trim()) return;
  enviando.value = true;
  error.value = null;
  try {
    await casosService.agregarSeguimiento(cid, detalle.value.id, {
      comentario: formSeguimiento.value.comentario.trim(),
      nuevoEstado: formSeguimiento.value.nuevoEstado || null,
    });
    showSeguimiento.value = false;
    await recargarDetalle();
    await cargar();
    exito.value = "Seguimiento agregado.";
  } catch (e) {
    console.error("Error al agregar seguimiento", e);
    error.value = mensajeError(e, "Error al agregar el seguimiento");
  } finally {
    enviando.value = false;
  }
}

function abrirCerrar() {
  resumenCierre.value = "";
  showCerrar.value = true;
}

async function cerrarCaso() {
  const cid = auth.condominioActualId;
  if (!cid || !detalle.value || !resumenCierre.value.trim()) return;
  enviando.value = true;
  error.value = null;
  try {
    await casosService.cerrar(cid, detalle.value.id, resumenCierre.value.trim());
    showCerrar.value = false;
    showDetalle.value = false;
    casoActual.value = null;
    exito.value = "Caso cerrado.";
    await cargar();
  } catch (e) {
    console.error("Error al cerrar caso", e);
    error.value = mensajeError(e, "Error al cerrar el caso");
  } finally {
    enviando.value = false;
  }
}

async function abrirVincularSolicitudes() {
  const cid = auth.condominioActualId;
  if (!cid || !detalle.value) return;
  cargandoSolicitudes.value = true;
  seleccionadas.value = [];
  try {
    const { data } = await solicitudesService.listar(cid, { page: 0, size: 100 });
    const vinculadas = new Set((detalle.value.solicitudes || []).map((s) => s.id));
    solicitudesDisponibles.value = (data?.content || []).filter(
      (s) => !s.casoId && !vinculadas.has(s.id),
    );
    showVincular.value = true;
  } catch (e) {
    console.error("Error al cargar solicitudes para vincular", e);
    error.value = mensajeError(e, "Error al cargar las solicitudes disponibles");
  } finally {
    cargandoSolicitudes.value = false;
  }
}

async function vincularSeleccionadas() {
  const cid = auth.condominioActualId;
  if (!cid || !detalle.value || !seleccionadas.value.length) return;
  enviando.value = true;
  error.value = null;
  try {
    for (const solicitudId of seleccionadas.value) {
      await solicitudesService.vincularCaso(cid, solicitudId, {
        casoId: detalle.value.id,
      });
    }
    showVincular.value = false;
    await recargarDetalle();
    await cargar();
    exito.value = "Solicitudes vinculadas al caso.";
  } catch (e) {
    console.error("Error al vincular solicitudes", e);
    error.value = mensajeError(e, "Error al vincular las solicitudes");
  } finally {
    enviando.value = false;
  }
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between gap-2 flex-wrap">
      <h1 class="text-xl font-bold m-0">Casos</h1>
    </div>

    <Message v-if="error" severity="error" :closable="false" @close="error = null">
      {{ error }}
    </Message>
    <Message v-if="exito" severity="success" :closable="true" @close="exito = null">
      {{ exito }}
    </Message>

    <Card>
      <template #content>
        <div class="flex flex-wrap gap-2 items-end">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Estado</label>
            <Select
              v-model="filtroEstado"
              :options="estados"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              class="w-full md:w-40"
              @change="aplicarFiltros"
            />
          </div>
          <div class="flex flex-col gap-1 flex-1 min-w-[220px]">
            <label class="text-sm font-medium">Buscar</label>
            <InputText
              v-model="filtroQ"
              placeholder="Título, #caso, persona o unidad"
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

    <Skeleton v-if="loading" width="100%" height="300px" />

    <Card v-else-if="!casos.length">
      <template #content>
        <div class="flex flex-col items-center gap-2 py-8">
          <i class="pi pi-folder text-4xl text-text-subtle"></i>
          <p class="text-text-subprincipal m-0">No hay casos registrados</p>
        </div>
      </template>
    </Card>

    <template v-else>
      <div class="flex flex-col gap-2">
        <Card
          v-for="c in casos"
          :key="c.id"
          class="cursor-pointer"
          @click="verDetalle(c)"
        >
          <template #content>
            <div class="flex items-start justify-between gap-3">
              <div class="flex flex-col gap-1 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs text-text-subprincipal">#{{ c.numero }}</span>
                  <span class="font-medium">{{ c.titulo }}</span>
                  <Tag
                    :value="c.prioridad"
                    :severity="severityPrioridad(c.prioridad)"
                    size="small"
                  />
                </div>
                <div class="text-xs text-text-muted">
                  {{ c.abiertoPorNombre }} · {{ formatearFechaHora(c.abiertoEn) }}
                </div>
              </div>
              <Tag :value="labelEstadoCaso(c.estado)" :severity="severityEstado(c.estado)" />
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

    <!-- Detalle -->
    <Dialog
      v-model:visible="showDetalle"
      header="Detalle del caso"
      modal
      :style="{ width: '95%', maxWidth: '900px' }"
    >
      <div v-if="loadingDetalle" class="flex justify-center py-8">
        <Skeleton width="100%" height="300px" />
      </div>

      <div v-else-if="detalle" class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs text-text-subprincipal">#{{ detalle.numero }}</span>
            <span class="font-bold text-lg">{{ detalle.titulo }}</span>
            <Tag
              :value="detalle.prioridad"
              :severity="severityPrioridad(detalle.prioridad)"
              size="small"
            />
            <Tag :value="labelEstadoCaso(detalle.estado)" :severity="severityEstado(detalle.estado)" size="small" />
          </div>
          <p v-if="detalle.descripcion" class="text-sm text-text m-0 whitespace-pre-line">
            {{ detalle.descripcion }}
          </p>
          <div class="text-xs text-text-subprincipal">
            Abierto por {{ detalle.abiertoPorNombre }} ·
            {{ formatearFechaHora(detalle.abiertoEn) }}
          </div>
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
                :value="labelEstadoCaso(s.estadoResultante)"
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
        <p v-else class="text-sm text-text-muted m-0">Sin seguimientos aún.</p>

        <!-- Solicitudes vinculadas -->
        <Divider align="left">
          <span class="text-xs font-semibold text-text-muted">
            Solicitudes vinculadas ({{ detalle.solicitudes?.length || 0 }})
          </span>
        </Divider>
        <div v-if="detalle.solicitudes?.length" class="flex flex-col gap-2">
          <div
            v-for="s in detalle.solicitudes"
            :key="s.id"
            class="p-2 bg-inset rounded-border text-sm"
          >
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs text-text-subprincipal">#{{ s.numero }}</span>
              <span class="font-medium">{{ s.titulo }}</span>
              <Tag :value="labelTipoSolicitud(s.tipo)" size="small" severity="info" />
              <Tag
                :value="labelCategoriaSolicitud(s.categoria)"
                size="small"
                severity="contrast"
              />
              <Tag
                :value="labelEstadoSolicitud(s.estado)"
                :severity="severityEstado(s.estado)"
                size="small"
              />
            </div>
            <div class="text-xs text-text-muted mt-1">
              {{ s.personaNombre || "—" }}
              <span v-if="s.unidadNumero"> · Unidad {{ s.unidadNumero }}</span>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-text-muted m-0">
          Este caso no tiene solicitudes vinculadas.
        </p>
        <div v-if="detalle.estado !== 'CERRADO'">
          <Button
            label="Vincular solicitudes"
            icon="pi pi-link"
            severity="secondary"
            @click="abrirVincularSolicitudes"
          />
        </div>

        <!-- Referencias -->
        <template v-if="detalle.referencias?.length">
          <Divider align="left">
            <span class="text-xs font-semibold text-text-muted">Referencias</span>
          </Divider>
          <div class="flex flex-col gap-2">
            <div
              v-for="r in detalle.referencias"
              :key="r.id"
              class="p-2 bg-inset rounded-border text-sm flex flex-col gap-1"
            >
              <div class="flex items-center gap-2 flex-wrap">
                <Tag :value="labelTipoReferencia(r.tipo)" size="small" severity="secondary" />
                <span class="text-xs text-text-subprincipal">
                  {{ formatearFechaHora(r.vinculadoEn) }}
                </span>
              </div>
              <span v-if="r.descripcionSnapshot" class="whitespace-pre-line">
                {{ r.descripcionSnapshot }}
              </span>
              <span class="text-xs text-text-muted">
                Vinculado por {{ r.vinculadoPorNombre }}
              </span>
            </div>
          </div>
        </template>

        <!-- Finanzas -->
        <Divider align="left">
          <span class="text-xs font-semibold text-text-muted">Finanzas</span>
        </Divider>
        <div v-if="tieneFinanzas" class="flex flex-col gap-3">
          <template v-if="detalle.gastos?.length">
            <div class="text-sm font-semibold">Gastos ({{ detalle.gastos.length }})</div>
            <div class="flex flex-col gap-2">
              <div
                v-for="g in detalle.gastos"
                :key="g.id"
                class="p-2 bg-inset rounded-border text-sm flex items-center justify-between gap-2 flex-wrap"
              >
                <div class="flex flex-col">
                  <span class="font-medium">{{ g.descripcion }}</span>
                  <span class="text-xs text-text-muted">
                    {{ formatearFechaHora(g.fechaGasto) }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ formatearMonto(g.monto) }}</span>
                  <Tag :value="g.estado" size="small" severity="secondary" />
                </div>
              </div>
            </div>
          </template>

          <template v-if="detalle.cargosAdicionales?.length">
            <div class="text-sm font-semibold">
              Cargos adicionales ({{ detalle.cargosAdicionales.length }})
            </div>
            <div class="flex flex-col gap-2">
              <div
                v-for="c in detalle.cargosAdicionales"
                :key="c.id"
                class="p-2 bg-inset rounded-border text-sm flex items-center justify-between gap-2 flex-wrap"
              >
                <div class="flex flex-col">
                  <span class="font-medium">{{ c.descripcion }}</span>
                  <span class="text-xs text-text-muted">
                    Unidad {{ c.unidadNumero || "—" }} ·
                    {{ formatearFechaHora(c.fechaCargo) }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ formatearMonto(c.monto) }}</span>
                  <Tag :value="c.estado" size="small" severity="secondary" />
                </div>
              </div>
            </div>
          </template>

          <template v-if="detalle.mantenciones?.length">
            <div class="text-sm font-semibold">
              Mantenciones ({{ detalle.mantenciones.length }})
            </div>
            <div class="flex flex-col gap-2">
              <div
                v-for="m in detalle.mantenciones"
                :key="m.id"
                class="p-2 bg-inset rounded-border text-sm flex items-center justify-between gap-2 flex-wrap"
              >
                <div class="flex flex-col">
                  <span class="font-medium">{{ m.titulo }}</span>
                  <span class="text-xs text-text-muted">
                    {{ m.proveedorTexto || "Sin proveedor" }} ·
                    {{ formatearFechaHora(m.fechaProgramada) }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ formatearMonto(m.montoPagado) }}</span>
                  <Tag :value="m.estado" size="small" severity="secondary" />
                </div>
              </div>
            </div>
          </template>
        </div>
        <p v-else class="text-sm text-text-muted m-0">
          Sin movimientos financieros vinculados.
        </p>

        <!-- Cierre -->
        <template v-if="detalle.estado === 'CERRADO'">
          <Divider align="left">
            <span class="text-xs font-semibold text-text-muted">Resumen de cierre</span>
          </Divider>
          <div class="p-2 bg-inset rounded-border">
            <p class="text-sm m-0 whitespace-pre-line">{{ detalle.resumenCierre }}</p>
            <p class="text-xs text-text-subprincipal mt-1 m-0">
              Cerrado por {{ detalle.cerradoPorNombre }} ·
              {{ formatearFechaHora(detalle.cerradoEn) }}
            </p>
          </div>
        </template>
      </div>

      <template #footer>
        <div class="flex gap-2 flex-wrap justify-end">
          <Button
            v-if="detalle && detalle.estado !== 'CERRADO'"
            label="Seguimiento"
            icon="pi pi-comment"
            severity="secondary"
            @click="abrirSeguimiento"
          />
          <Button
            v-if="detalle && detalle.estado !== 'CERRADO'"
            label="Cerrar caso"
            icon="pi pi-check"
            severity="danger"
            @click="abrirCerrar"
          />
          <Button
            v-else
            label="Cerrar"
            severity="secondary"
            variant="text"
            @click="showDetalle = false"
          />
        </div>
      </template>
    </Dialog>

    <!-- Seguimiento -->
    <Dialog
      v-model:visible="showSeguimiento"
      header="Agregar seguimiento"
      modal
      :style="{ width: '95%', maxWidth: '420px' }"
    >
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Comentario</label>
          <Textarea v-model="formSeguimiento.comentario" rows="3" :autoResize="true" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Nuevo estado (opcional)</label>
          <Select
            v-model="formSeguimiento.nuevoEstado"
            :options="estadosSeguimiento"
            optionLabel="label"
            optionValue="value"
            placeholder="Sin cambio"
          />
        </div>
      </div>
      <template #footer>
        <Button
          severity="secondary"
          variant="text"
          label="Cancelar"
          @click="showSeguimiento = false"
        />
        <Button
          label="Guardar"
          :loading="enviando"
          :disabled="!formSeguimiento.comentario.trim()"
          @click="agregarSeguimiento"
        />
      </template>
    </Dialog>

    <!-- Vincular solicitudes -->
    <Dialog
      v-model:visible="showVincular"
      header="Vincular solicitudes al caso"
      modal
      :style="{ width: '95%', maxWidth: '620px' }"
    >
      <div v-if="cargandoSolicitudes" class="flex justify-center py-4">
        <Skeleton width="100%" height="120px" />
      </div>
      <div v-else-if="!solicitudesDisponibles.length" class="text-sm text-text-muted">
        No hay solicitudes sin caso disponibles para vincular.
      </div>
      <div v-else class="flex flex-col gap-2 max-h-80 overflow-y-auto">
        <label
          v-for="s in solicitudesDisponibles"
          :key="s.id"
          class="flex items-start gap-2 p-2 bg-inset rounded-border cursor-pointer"
        >
          <Checkbox v-model="seleccionadas" :value="s.id" />
          <div class="flex flex-col">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs text-text-subprincipal">#{{ s.numero }}</span>
              <span class="text-sm font-medium">{{ s.titulo }}</span>
              <Tag :value="labelTipoSolicitud(s.tipo)" size="small" severity="info" />
            </div>
            <span class="text-xs text-text-muted">
              {{ s.personaNombre || "—" }}
              <span v-if="s.unidadNumero"> · Unidad {{ s.unidadNumero }}</span>
            </span>
          </div>
        </label>
      </div>
      <template #footer>
        <Button
          severity="secondary"
          variant="text"
          label="Cancelar"
          @click="showVincular = false"
        />
        <Button
          label="Vincular seleccionadas"
          icon="pi pi-link"
          :loading="enviando"
          :disabled="!seleccionadas.length"
          @click="vincularSeleccionadas"
        />
      </template>
    </Dialog>

    <!-- Cerrar caso -->
    <Dialog
      v-model:visible="showCerrar"
      header="Cerrar caso"
      modal
      :style="{ width: '95%', maxWidth: '420px' }"
    >
      <div class="flex flex-col gap-3">
        <p class="text-sm m-0">
          ¿Estás seguro de cerrar este caso? Esta acción es irreversible.
        </p>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Resumen de cierre</label>
          <Textarea
            v-model="resumenCierre"
            rows="3"
            placeholder="Explica cómo se resolvió"
            :autoResize="true"
          />
        </div>
      </div>
      <template #footer>
        <Button
          severity="secondary"
          variant="text"
          label="Cancelar"
          @click="showCerrar = false"
        />
        <Button
          label="Cerrar caso"
          severity="danger"
          :loading="enviando"
          :disabled="!resumenCierre.trim()"
          @click="cerrarCaso"
        />
      </template>
    </Dialog>
  </div>
</template>
