<script setup>
import { ref, onMounted } from "vue";
import { adminService } from "@/services/adminService";
import FiltroFechas from "@/components/FiltroFechas.vue";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import AutoComplete from "primevue/autocomplete";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Paginator from "primevue/paginator";

const ACCIONES = [
  { value: "CONDOMINIO_CREAR", label: "Crear condominio", severity: "success" },
  { value: "CONDOMINIO_EDITAR", label: "Editar condominio", severity: "info" },
  { value: "CONDOMINIO_CAPACIDAD_ACTUALIZAR", label: "Actualizar capacidad", severity: "info" },
  { value: "CONDOMINIO_SUSPENDER", label: "Suspender condominio", severity: "danger" },
  { value: "CONDOMINIO_REACTIVAR", label: "Reactivar condominio", severity: "success" },
  { value: "SUSCRIPCION_CAMBIAR", label: "Cambiar plan", severity: "warn" },
  { value: "SUSCRIPCION_PAGAR", label: "Registrar pago", severity: "success" },
  { value: "STORAGE_CONFIG_EDITAR", label: "Editar almacenamiento", severity: "info" },
  { value: "USUARIO_ASIGNAR_ROL", label: "Asignar rol", severity: "info" },
  { value: "USUARIO_REVOCAR_ROL", label: "Revocar rol", severity: "warn" },
  { value: "USUARIO_ACTIVAR", label: "Activar usuario", severity: "success" },
  { value: "USUARIO_DESACTIVAR", label: "Desactivar usuario", severity: "danger" },
  { value: "MODULO_CAMBIAR", label: "Cambiar módulos", severity: "info" },
  { value: "ONBOARDING_COMPLETAR", label: "Completar onboarding", severity: "success" },
  { value: "PLAN_CREAR", label: "Crear plan", severity: "success" },
  { value: "PLAN_EDITAR", label: "Editar plan", severity: "info" },
  { value: "ACCESO_CONDOMINIO", label: "Acceso a condominio", severity: "warn" },
];

const accionMeta = Object.fromEntries(ACCIONES.map((a) => [a.value, a]));

const ORDENES = [
  { label: "Más recientes primero", value: "desc" },
  { label: "Más antiguas primero", value: "asc" },
];

const loading = ref(true);
const error = ref(null);
const registros = ref([]);
const total = ref(0);
const page = ref(0);
const size = ref(50);

const filtros = ref({
  condominio: null,
  accion: null,
  email: "",
  rango: null,
  orden: "desc",
});

const indiceExpandido = ref(-1);

const sugerenciasCondominios = ref([]);
const loadingCondominios = ref(false);
const condominiosMap = ref({});

function formatCondominioSugerencia(c) {
  return c ? `${c.nombre}` : "";
}

async function buscarCondominio(event) {
  const q = (event.query || "").trim();
  loadingCondominios.value = true;
  try {
    const params = { page: 0, size: 10 };
    if (q) params.nombre = q;
    const { data } = await adminService.listarCondominios(params);
    sugerenciasCondominios.value = data.content || [];
  } catch (e) {
    console.error("Error al buscar condominios", e);
    sugerenciasCondominios.value = [];
  } finally {
    loadingCondominios.value = false;
  }
}

function aISOLocalDateTime(d, finDeDia) {
  if (!d) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${finDeDia ? "23:59:59" : "00:00:00"}`;
}

async function cargar() {
  loading.value = true;
  error.value = null;
  try {
    const params = { page: page.value, size: size.value };
    const { condominio, accion, email, rango, orden } = filtros.value;
    params.sort = `createdAt,${orden}`;
    if (condominio?.id) params.condominioId = condominio.id;
    if (accion) params.accion = accion;
    if (email.trim()) params.email = email.trim();
    if (rango?.[0]) params.desde = aISOLocalDateTime(rango[0], false);
    if (rango?.[1]) params.hasta = aISOLocalDateTime(rango[1], true);
    const { data } = await adminService.listarAuditoria(params);
    registros.value = data.content || [];
    total.value = data.totalElements || 0;
  } catch (e) {
    console.error("Error al cargar auditoría", e);
    error.value = "No se pudo cargar el registro de auditoría";
  } finally {
    loading.value = false;
  }
}

async function cargarCondominiosMap() {
  try {
    const { data } = await adminService.listarCondominios({ page: 0, size: 500 });
    const map = {};
    (data.content || []).forEach((c) => {
      map[c.id] = c;
    });
    condominiosMap.value = map;
  } catch (e) {
    console.error("Error al cargar condominios", e);
  }
}

function buscar() {
  indiceExpandido.value = -1;
  page.value = 0;
  cargar();
}

function limpiarFiltros() {
  filtros.value = { condominio: null, accion: null, email: "", rango: null, orden: "desc" };
  buscar();
}

function toggleExpand(idx) {
  indiceExpandido.value = indiceExpandido.value === idx ? -1 : idx;
}

function cambiarOrden() {
  buscar();
}

function toggleOrden() {
  filtros.value.orden = filtros.value.orden === "desc" ? "asc" : "desc";
  buscar();
}

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleString("es-CL", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function condominioDe(r) {
  if (!r.condominioId) return null;
  return condominiosMap.value[r.condominioId] || null;
}

function condominioLabel(r) {
  const c = condominioDe(r);
  return c ? c.nombre : r.condominioId?.slice(0, 8) || "Global";
}

function accionLabel(r) {
  return accionMeta[r.accion]?.label || r.accion;
}

function accionSeverity(r) {
  return accionMeta[r.accion]?.severity || "info";
}

function recursoLabel(r) {
  return r.recursoTipo ? `${r.recursoTipo}:${r.recursoId}` : "";
}

onMounted(() => {
  cargar();
  cargarCondominiosMap();
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Auditoría SaaS</h1>
      <Tag v-if="total" :value="`${total} registros`" severity="secondary" />
    </div>

    <Card>
      <template #content>
        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex flex-col gap-1 min-w-52 flex-1">
            <label class="text-xs text-surface-500">Condominio</label>
            <AutoComplete
              v-model="filtros.condominio"
              :suggestions="sugerenciasCondominios"
              @complete="buscarCondominio"
              :optionLabel="formatCondominioSugerencia"
              :loading="loadingCondominios"
              showClear
              placeholder="Buscar por nombre..."
              size="small"
              class="w-full"
            >
              <template #option="slotProps">
                <div class="flex items-center justify-between gap-2 w-full">
                  <span>{{ slotProps.option.nombre }}</span>
                  <span v-if="slotProps.option.responsableNombre" class="text-xs text-surface-400">
                    {{ slotProps.option.responsableNombre }}
                  </span>
                </div>
              </template>
            </AutoComplete>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Acción</label>
            <Select
              v-model="filtros.accion"
              :options="ACCIONES"
              option-label="label"
              option-value="value"
              placeholder="Todas"
              show-clear
              size="small"
              class="w-56"
            />
          </div>
          <div class="flex flex-col gap-1 flex-1 min-w-52">
            <label class="text-xs text-surface-500">Email</label>
            <IconField>
              <InputIcon class="pi pi-envelope" />
              <InputText
                v-model="filtros.email"
                placeholder="usuario@mail.com"
                class="w-full"
                size="small"
                @keyup.enter="buscar"
              />
            </IconField>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Desde / Hasta</label>
            <FiltroFechas v-model="filtros.rango" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Orden</label>
            <Select
              v-model="filtros.orden"
              :options="ORDENES"
              option-label="label"
              option-value="value"
              size="small"
              class="w-48"
              @change="cambiarOrden"
            />
          </div>
          <Button label="Buscar" icon="pi pi-search" size="small" severity="secondary" @click="buscar" />
          <Button label="Limpiar" size="small" variant="text" @click="limpiarFiltros" />
        </div>
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!registros.length" class="text-center text-surface-400 py-8">No hay registros de auditoría</div>

      <template v-else>
        <!-- Mobile: cards desplegables -->
        <div class="flex flex-col gap-1 md:hidden">
          <div v-for="(r, idx) in registros" :key="r.id">
            <div
              class="flex items-center justify-between gap-2 p-3 border rounded-lg cursor-pointer transition-colors select-none"
              :class="
                indiceExpandido === idx
                  ? 'border-border bg-background rounded-b-none'
                  : 'border-border-secondary bg-surface/90 hover:bg-background/95'
              "
              @click="toggleExpand(idx)"
            >
              <div class="flex items-center gap-2 text-xs min-w-0 flex-1 overflow-hidden">
                <i class="pi pi-building text-text-muted" />
                <span class="text-text font-semibold whitespace-nowrap">{{ condominioLabel(r) }}</span>
                <span class="text-text-muted hidden sm:inline truncate min-w-0">· {{ r.usuarioEmail }}</span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <Tag :value="accionLabel(r)" :severity="accionSeverity(r)" size="small" />
                <i :class="indiceExpandido === idx ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-xs" />
              </div>
            </div>

            <div
              v-if="indiceExpandido === idx"
              class="border border-t-0 border-primary rounded-b-lg p-3 bg-surface"
            >
              <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <span class="text-text-muted">Fecha:</span>
                <span>{{ formatFecha(r.createdAt) }}</span>

                <span class="text-text-muted">Acción:</span>
                <span class="font-medium">{{ accionLabel(r) }}</span>

                <span class="text-text-muted">Usuario:</span>
                <span class="font-medium">{{ r.usuarioEmail || "—" }}</span>

                <span class="text-text-muted">Condominio:</span>
                <span>{{ condominioLabel(r) }}</span>

                <span v-if="r.recursoTipo" class="text-text-muted">Recurso:</span>
                <span v-if="r.recursoTipo">{{ recursoLabel(r) }}</span>

                <span v-if="r.ipAddress" class="text-text-muted">IP:</span>
                <span v-if="r.ipAddress">{{ r.ipAddress }}</span>
              </div>

              <p v-if="r.detalle" class="m-0 mt-2 text-sm">
                <span class="text-text-muted">Detalle:</span> {{ r.detalle }}
              </p>

              <div v-if="r.impersonatedByEmail" class="mt-2">
                <Tag :value="`impersonado por ${r.impersonatedByEmail}`" severity="warn" size="small" />
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop: tabla tipo planilla (estilos en theme/app.css → .planilla) -->
        <div class="planilla hidden md:block">
          <table>
            <thead>
              <tr>
                <th class="sortable select-none" @click="toggleOrden">
                  <span class="inline-flex items-center gap-1">
                    Fecha
                    <i :class="filtros.orden === 'desc' ? 'pi pi-sort-amount-down' : 'pi pi-sort-amount-up-alt'" class="text-xs" />
                  </span>
                </th>
                <th>Acción</th>
                <th>Usuario</th>
                <th>Condominio</th>
                <th>Recurso</th>
                <th>Detalle</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in registros" :key="r.id">
                <td class="whitespace-nowrap text-text-muted">
                  {{ formatFecha(r.createdAt) }}
                </td>
                <td>
                  <Tag :value="accionLabel(r)" :severity="accionSeverity(r)" size="small" />
                </td>
                <td>
                  <div class="font-medium">{{ r.usuarioEmail || "—" }}</div>
                  <div v-if="r.impersonatedByEmail" class="text-xs text-text-muted">por {{ r.impersonatedByEmail }}</div>
                </td>
                <td class="whitespace-nowrap">
                  <div class="flex items-center gap-1">
                    <i class="pi pi-building text-text-muted text-xs" />
                    <span>{{ condominioLabel(r) }}</span>
                  </div>
                </td>
                <td>
                  <span v-if="recursoLabel(r)" class="text-xs">{{ recursoLabel(r) }}</span>
                  <span v-else class="text-text-muted">—</span>
                </td>
                <td class="truncado">
                  <span v-if="r.detalle" class="text-text-muted" :title="r.detalle">{{ r.detalle }}</span>
                  <span v-else class="text-text-muted">—</span>
                </td>
                <td class="whitespace-nowrap text-text-muted">
                  {{ r.ipAddress || "—" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Paginator
          :rows="size"
          :totalRecords="total"
          :first="page * size"
          @page="page = $event.page; indiceExpandido = -1; cargar()"
        />
      </template>
    </template>
  </div>
</template>
