<script setup>
import { ref, computed, watch } from "vue";
import { useModoFoco } from "@/composables/useModoFoco";
import { useFiltroFilas, FILTROS_FILA } from "@/composables/useFiltroFilas";
import {
  vehiculosResumen,
  bodegasResumen,
  estacionamientosResumen,
} from "@/utils/planillaResumen";
import PlanillaFilaDetalle from "@/components/planilla/PlanillaFilaDetalle.vue";
import { TIPOS_UNIDAD, TIPOS_VINCULO, TIPOS_VEHICULO } from "@/data/planillaColumnas";
import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Paginator from "primevue/paginator";

// Staging editable (csv) + review validado. Sin api directa.
// Props planas; emite: validar, importar, descartar (volver a editar).
const props = defineProps({
  staging: { type: Array, default: () => [] },
  archivoPendienteNombre: { type: String, default: "" },
  previewData: { type: Object, default: null },
  archivoNombre: { type: String, default: "" },
  enviando: { type: Boolean, default: false },
  deshabilitado: { type: Boolean, default: false },
  // true cuando ya se ejecutó el import (paso 3 del stepper)
  importado: { type: Boolean, default: false },
  // true si el csv no trae columnas estacionamiento1..3 (formato 32 cols)
  sinEstStandalone: { type: Boolean, default: false },
});

const emit = defineEmits([
  "validar",
  "importar",
  "descartar",
  "limpiar",
  "corregir",
  "quitarFila",
  "agregarVehiculo",
  "quitarVehiculo",
  "agregarBodega",
  "quitarBodega",
  "agregarEstacionamiento",
  "quitarEstacionamiento",
]);

// Paginación (Meta: 50/pág)
const pagina = ref(0);
const porPagina = 50;
const stagingPagina = computed(() => {
  const start = pagina.value * porPagina;
  return (props.staging || []).slice(start, start + porPagina);
});

const { foco, alternar, salir } = useModoFoco();

const tiposUnidadOpciones = TIPOS_UNIDAD.map((t) => ({ label: t, value: t }));
const tiposVinculoOpciones = TIPOS_VINCULO.map((t) => ({ label: t, value: t }));
const tiposVehiculoOpciones = TIPOS_VEHICULO.map((t) => ({ label: t, value: t }));
const siNoOpciones = [
  { label: "—", value: "" },
  { label: "SI", value: "SI" },
  { label: "NO", value: "NO" },
];

// Stepper de guardado (Meta): deja explícito en qué momento se guardan los datos.
// 1 Borrador local (navegador, nada enviado) → 2 Validado (borrador en servidor,
// expira 30 min, nada persistido) → 3 Importado (persistido en el condominio).
const pasoGuardado = computed(() => {
  if (props.importado) return 3;
  if (props.previewData) return 2;
  return 1;
});

const previewOmitidas = computed(() => {
  if (!props.previewData) return 0;
  const d = props.previewData;
  return Math.max(0, (d.totalFilas ?? 0) - (d.filasOk ?? 0) - (d.filasError ?? 0));
});

const previewErrores = computed(() => {
  if (!props.previewData?.filas) return [];
  return props.previewData.filas.filter((f) => f.estado === "ERROR");
});

const hasPreviewFiel = computed(() => {
  const raw = props.staging;
  const filas = props.previewData?.filas;
  return (
    Array.isArray(raw) &&
    raw.length > 0 &&
    Array.isArray(filas) &&
    filas.length === raw.length
  );
});

const estadoPorFila = computed(() => {
  const map = new Map();
  (props.previewData?.filas || []).forEach((f) => {
    map.set(f.numeroFila, f);
  });
  return map;
});

// FE-3: vista unificada para filtrar (staging+preview o backend directo).
// Cada ítem expone {numeroFila, estado, errores, advertencias} + origen.
const filasRevision = computed(() => {
  if (!props.previewData) return [];
  if (hasPreviewFiel.value) {
    return (props.staging || []).map((f, i) => {
      const e = estadoPorFila.value.get(i + 1);
      return {
        numeroFila: i + 1,
        estado: e?.estado || "—",
        errores: e?.errores || [],
        advertencias: e?.advertencias || [],
        staging: f,
      };
    });
  }
  return props.previewData.filas || [];
});

const { filtro, conteos, setFiltro, cumpleFiltroFila } =
  useFiltroFilas(filasRevision);

// staging con número de fila, filtrado (la tabla fiel renderiza item.f).
const stagingConNum = computed(() =>
  filasRevision.value.filter((r) => r.staging && cumpleFiltroFila(r, filtro.value)),
);
const stagingPaginaFiltrada = computed(() => {
  const start = pagina.value * porPagina;
  return stagingConNum.value.slice(start, start + porPagina);
});

// backend (.xlsx) filtrado — reemplaza previewPaginaLimitada.
const backendFiltrada = computed(() =>
  filasRevision.value.filter((r) => !r.staging && cumpleFiltroFila(r, filtro.value)),
);
const previewPaginaLimitada = computed(() => {
  const start = pagina.value * porPagina;
  return backendFiltrada.value.slice(start, start + porPagina);
});

watch(filtro, () => {
  pagina.value = 0;
});

// Preview fiel directo del backend (BE-74: FilaPreview trae vehiculos[],
// estacionamientos[] y bodegas[]) — cubre .xlsx sin parse local.
const backendFiel = computed(() => {
  const filas = props.previewData?.filas || [];
  return filas.length > 0 && filas.every((f) => Array.isArray(f.vehiculos));
});

// Aviso local mínimo en staging (reglas completas las da [Validar]).
function incompleta(f) {
  return !(f.unidad || "").trim() || !(f.nombre || "").trim() || !(f.email || "").trim() || !(f.tipo_vinculo || "").trim();
}

// FE-2: detalle expandible por fila (compacto por defecto, sin saturar con 500+ filas).
// Clave = numeroFila del backend (1-based, coincide con el índice de staging).
const filasExpandidas = ref(new Set());

// Entrada del preview con errores/advertencias — tolera advertencias null (BE-4 pendiente).
function tieneDetalle(entrada) {
  return (
    (entrada?.errores || []).length > 0 || (entrada?.advertencias || []).length > 0
  );
}

function alternarDetalle(numeroFila) {
  const s = new Set(filasExpandidas.value);
  if (s.has(numeroFila)) s.delete(numeroFila);
  else s.add(numeroFila);
  filasExpandidas.value = s;
}
</script>

<template>
  <div v-if="foco" class="modo-foco-fondo" @click="salir" />
  <!-- STAGED: borrador editable antes de cualquier POST -->
  <Card v-if="!previewData" class="border border-primary/20" :class="foco ? 'modo-foco' : ''">
    <template #title>
      <div class="flex items-center gap-2 text-sm">
        <i class="pi pi-file-edit"></i>
        <span>Borrador del archivo</span>
        <Tag
          v-if="archivoNombre"
          :value="archivoNombre"
          severity="secondary"
          size="small"
        />
        <Tag :value="`${staging.length} filas`" severity="info" size="small" />
        <Button
          :icon="foco ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"
          :label="foco ? 'Salir de foco' : 'Foco'"
          severity="secondary"
          text
          size="small"
          class="ml-auto"
          @click="alternar"
        />
      </div>
    </template>
    <template #content>
      <!-- Stepper: ¿qué está guardado y dónde? -->
      <div class="flex flex-col sm:flex-row gap-2 mb-3">
        <div
          v-for="p in [
            { n: 1, label: 'Borrador local', desc: 'Solo en tu navegador. Nada enviado.' },
            { n: 2, label: 'Validado', desc: 'Borrador en servidor (expira 30 min). Nada persistido.' },
            { n: 3, label: 'Importado', desc: 'Datos guardados en el condominio.' },
          ]"
          :key="p.n"
          class="flex-1 flex items-center gap-2 p-2 border-round text-left text-sm"
          :class="
            pasoGuardado === p.n
              ? 'bg-primary text-white'
              : pasoGuardado > p.n
                ? 'bg-surface border border-border'
                : 'bg-surface border border-border opacity-60'
          "
        >
          <span
            class="w-5 h-5 flex items-center justify-center border-round-full text-xs font-bold shrink-0"
            :class="pasoGuardado > p.n ? 'bg-primary text-white' : 'bg-emphasis'"
            >{{ pasoGuardado > p.n ? "✓" : p.n }}</span
          >
          <span>
            <span class="font-medium block">{{ p.label }}</span>
            <span class="text-xs opacity-80 block">{{ p.desc }}</span>
          </span>
        </div>
      </div>

      <p class="text-xs text-text-muted m-0 mb-2">
        Misma estructura del archivo: corrige aquí lo que falte antes de Validar.
        <span v-if="archivoPendienteNombre">El .xlsx se validará directo en el servidor (sin edición local).</span>
      </p>
      <Message v-if="sinEstStandalone" severity="info" :closable="false" class="m-0 mb-2">
        Este archivo es formato 32 columnas (sin <code>estacionamiento1..3</code>): los estacionamientos solo pueden venir junto a un vehículo. Descarga la plantilla actualizada para declarar estacionamientos sin vehículo.
      </Message>

      <template v-if="staging.length">
      <div class="planilla max-h-[68vh] overflow-auto border border-border">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Casa *</th>
              <th>Tipo</th>
              <th>Sector</th>
              <th>Nombre *</th>
              <th>Email *</th>
              <th>RUT</th>
              <th>Teléfono</th>
              <th>Vínculo *</th>
              <th class="text-center">Resid.</th>
              <th class="text-center">Notif.</th>
              <th class="text-center">Resp.</th>
              <th>Estacionamientos</th>
              <th>Vehículos</th>
              <th>Bodegas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(f, pIdx) in stagingPagina"
              :key="f.id || `${pagina * porPagina + pIdx}`"
              :class="incompleta(f) ? 'preview-error' : ''"
            >
              <td>{{ pagina * porPagina + pIdx + 1 }}</td>
              <td><InputText v-model="f.unidad" size="small" class="w-20" /></td>
              <td>
                <Select v-model="f.tipo_unidad" :options="tiposUnidadOpciones" optionLabel="label" optionValue="value" size="small" class="w-28" />
              </td>
              <td><InputText v-model="f.sector" size="small" class="w-24" /></td>
              <td><InputText v-model="f.nombre" size="small" class="w-full min-w-36" /></td>
              <td><InputText v-model="f.email" size="small" class="w-full min-w-40" /></td>
              <td><InputText v-model="f.rut" size="small" class="w-28" /></td>
              <td><InputText v-model="f.telefono" size="small" class="w-32" /></td>
              <td>
                <Select v-model="f.tipo_vinculo" :options="tiposVinculoOpciones" optionLabel="label" optionValue="value" size="small" class="w-32" />
              </td>
              <td>
                <Select v-model="f.es_residente" :options="siNoOpciones" optionLabel="label" optionValue="value" size="small" class="w-20" />
              </td>
              <td>
                <Select v-model="f.recibe_notificaciones" :options="siNoOpciones" optionLabel="label" optionValue="value" size="small" class="w-20" />
              </td>
              <td>
                <Select v-model="f.es_responsable" :options="siNoOpciones" optionLabel="label" optionValue="value" size="small" class="w-20" />
              </td>
              <td class="min-w-32">
                <div class="flex flex-col gap-1">
                  <div v-for="e in f.estacionamientos || []" :key="e.uid" class="flex items-center gap-1">
                    <InputText v-model="e.nombre" placeholder="Est." size="small" class="w-24" />
                    <Button icon="pi pi-trash" variant="text" severity="danger" size="small" title="Quitar" @click="emit('quitarEstacionamiento', f.id, e.uid)" />
                  </div>
                  <Button label="Est." icon="pi pi-plus" variant="text" size="small" @click="emit('agregarEstacionamiento', f.id)" />
                </div>
              </td>
              <td class="min-w-72">
                <div class="flex flex-col gap-1">
                  <div v-for="v in f.vehiculos || []" :key="v.uid" class="flex flex-col gap-1 p-1 border border-border border-round">
                    <div class="flex items-center gap-1">
                      <InputText v-model="v.patente" placeholder="Patente *" size="small" class="w-24" />
                      <Select v-model="v.tipo" :options="tiposVehiculoOpciones" optionLabel="label" optionValue="value" placeholder="Tipo" size="small" class="w-28" />
                      <Button icon="pi pi-trash" variant="text" severity="danger" size="small" title="Quitar vehículo" @click="emit('quitarVehiculo', f.id, v.uid)" />
                    </div>
                    <div class="flex items-center gap-1">
                      <InputText v-model="v.marca" placeholder="Marca" size="small" class="w-full" />
                      <InputText v-model="v.modelo" placeholder="Modelo" size="small" class="w-full" />
                    </div>
                    <div class="flex items-center gap-1">
                      <InputText v-model="v.color" placeholder="Color" size="small" class="w-full" />
                    </div>
                  </div>
                  <Button label="Vehículo" icon="pi pi-plus" variant="text" size="small" @click="emit('agregarVehiculo', f.id)" />
                </div>
              </td>
              <td class="min-w-32">
                <div class="flex flex-col gap-1">
                  <div v-for="b in f.bodegas || []" :key="b.uid" class="flex items-center gap-1">
                    <InputText v-model="b.nombre" placeholder="Bodega" size="small" class="w-24" />
                    <Button icon="pi pi-trash" variant="text" severity="danger" size="small" @click="emit('quitarBodega', f.id, b.uid)" />
                  </div>
                  <Button label="Bodega" icon="pi pi-plus" variant="text" size="small" @click="emit('agregarBodega', f.id)" />
                </div>
              </td>
              <td>
                <Button icon="pi pi-trash" variant="text" severity="danger" size="small" title="Quitar fila" @click="emit('quitarFila', f.id)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Paginator
        v-if="staging.length > porPagina"
        :rows="porPagina"
        :totalRecords="staging.length"
        :first="pagina * porPagina"
        class="mt-2"
        @page="pagina = $event.page"
      />
      </template>
      <p v-else class="text-xs text-text-muted m-0">
        {{ archivoPendienteNombre || "Selecciona un archivo para ver el borrador aquí." }}
      </p>

      <div class="mt-3 flex flex-wrap gap-2 justify-between items-center">
        <Button
          label="Limpiar todo"
          icon="pi pi-trash"
          severity="secondary"
          variant="text"
          size="small"
          :disabled="enviando"
          @click="emit('limpiar')"
        />
        <Button
          label="Validar en servidor"
          icon="pi pi-check-circle"
          size="small"
          :loading="enviando"
          :disabled="deshabilitado || (!staging.length && !archivoPendienteNombre)"
          :title="deshabilitado ? 'Sin permiso IMPORTACION_DATOS' : ''"
          @click="emit('validar')"
        />
      </div>
    </template>
  </Card>

  <!-- REVIEW: validado por el servidor -->
  <Card v-else class="border border-primary/20" :class="foco ? 'modo-foco' : ''">
    <template #title>
      <div class="flex items-center gap-2 text-sm">
        <i class="pi pi-eye"></i>
        <span>Previsualización validada</span>
        <Tag v-if="archivoNombre" :value="archivoNombre" severity="secondary" size="small" />
        <Button
          :icon="foco ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"
          :label="foco ? 'Salir de foco' : 'Foco'"
          severity="secondary"
          text
          size="small"
          class="ml-auto"
          @click="alternar"
        />
      </div>
    </template>
    <template #content>
      <div class="flex flex-col sm:flex-row gap-2 mb-3">
        <div
          v-for="p in [
            { n: 1, label: 'Borrador local', desc: 'Quedó en tu navegador.' },
            { n: 2, label: 'Validado', desc: 'Borrador en servidor (expira 30 min). Nada persistido aún.' },
            { n: 3, label: 'Importado', desc: 'Se guarda al pulsar Importar.' },
          ]"
          :key="p.n"
          class="flex-1 flex items-center gap-2 p-2 border-round text-left text-sm"
          :class="
            pasoGuardado === p.n
              ? 'bg-primary text-white'
              : pasoGuardado > p.n
                ? 'bg-surface border border-border'
                : 'bg-surface border border-border opacity-60'
          "
        >
          <span
            class="w-5 h-5 flex items-center justify-center border-round-full text-xs font-bold shrink-0"
            :class="pasoGuardado > p.n ? 'bg-primary text-white' : 'bg-emphasis'"
            >{{ pasoGuardado > p.n ? "✓" : p.n }}</span
          >
          <span>
            <span class="font-medium block">{{ p.label }}</span>
            <span class="text-xs opacity-80 block">{{ p.desc }}</span>
          </span>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mb-3">
        <Tag :value="`${previewData.totalFilas} filas`" severity="secondary" size="small" />
        <Tag :value="`${previewData.filasOk} OK`" severity="success" size="small" />
        <Tag v-if="previewData.filasError" :value="`${previewData.filasError} con error`" severity="danger" size="small" />
        <Tag v-if="previewOmitidas" :value="`${previewOmitidas} omitidas`" severity="warn" size="small" />
      </div>

      <!-- FE-3: filtro rápido client-side (no toca el backend). -->
      <div class="flex flex-wrap gap-2 mb-3">
        <Button
          v-for="o in FILTROS_FILA"
          :key="o.valor"
          :label="`${o.etiqueta} (${conteos[o.valor] ?? 0})`"
          :severity="filtro === o.valor ? 'primary' : 'secondary'"
          :variant="filtro === o.valor ? undefined : 'outlined'"
          :disabled="o.valor !== 'todos' && !(conteos[o.valor] ?? 0)"
          size="small"
          @click="setFiltro(o.valor)"
        />
      </div>

      <Message
        v-if="(previewData.encabezadosFaltantes || []).length"
        severity="warn"
        :closable="false"
        class="m-0 mb-3"
      >
        Faltan columnas requeridas: {{ previewData.encabezadosFaltantes.join(", ") }}.
        Descarga la plantilla y completa los encabezados.
      </Message>

      <div v-if="previewErrores.length" class="mb-3">
        <p class="text-sm font-semibold m-0 mb-1">Filas con error (vuelve a editar o corrige el archivo):</p>
        <ul class="m-0 pl-4 text-sm text-danger max-h-40 overflow-auto">
          <li v-for="(f, i) in previewErrores" :key="i">
            Fila {{ f.numeroFila }} ({{ f.unidad || "—" }} · {{ f.personaNombre || f.email || "—" }}):
            {{ (f.errores || []).join("; ") }}
          </li>
        </ul>
      </div>

      <!-- Tabla fiel csv -->
      <template v-if="hasPreviewFiel">
      <div v-if="stagingConNum.length" class="planilla max-h-[68vh] overflow-auto border border-border">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Casa</th>
              <th>Tipo</th>
              <th>Sector</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>RUT</th>
              <th>Teléfono</th>
              <th>Vínculo</th>
              <th class="text-center">Resid.</th>
              <th class="text-center">Notif.</th>
              <th class="text-center">Resp.</th>
              <th>Estacionamientos</th>
              <th>Vehículos</th>
              <th>Bodegas</th>
              <th>Estado</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            <template
              v-for="{ staging: f, numeroFila: num } in stagingPaginaFiltrada"
              :key="f.id || num"
            >
            <tr
              :class="{
                'preview-ok': estadoPorFila.get(num)?.estado === 'OK',
                'preview-error': estadoPorFila.get(num)?.estado === 'ERROR',
                'preview-omitida': estadoPorFila.get(num)?.estado === 'OMITIDA',
              }"
            >
              <td>{{ num }}</td>
              <td class="whitespace-nowrap">{{ f.unidad || "—" }}</td>
              <td><Tag :value="f.tipo_unidad || '—'" severity="secondary" size="small" /></td>
              <td>{{ f.sector || "—" }}</td>
              <td class="min-w-36">{{ f.nombre || "—" }}</td>
              <td class="min-w-40">{{ f.email || "—" }}</td>
              <td>{{ f.rut || "—" }}</td>
              <td>{{ f.telefono || "—" }}</td>
              <td><Tag v-if="f.tipo_vinculo" :value="f.tipo_vinculo" :severity="f.tipo_vinculo === 'PROPIETARIO' ? 'info' : 'secondary'" size="small" /><span v-else>—</span></td>
              <td class="text-center">{{ f.es_residente || "—" }}</td>
              <td class="text-center">{{ f.recibe_notificaciones || "—" }}</td>
              <td class="text-center">{{ f.es_responsable || "—" }}</td>
              <td class="min-w-32 text-sm">{{ estacionamientosResumen(f) || "—" }}</td><td class="min-w-48 text-sm">
                <span v-if="vehiculosResumen(f)">{{ vehiculosResumen(f) }}</span>
                <span v-else class="text-surface-400">—</span>
                <ul v-if="estadoPorFila.get(num)?.errores?.length" class="m-0 mt-1 pl-3 text-xs text-danger text-left">
                  <li v-for="(e, ei) in estadoPorFila.get(num).errores" :key="ei">{{ e }}</li>
                </ul>
              </td>
              <td class="min-w-32 text-sm">{{ bodegasResumen(f) || "—" }}</td>
              <td>
                <Tag
                  :value="estadoPorFila.get(num)?.estado || '—'"
                  :severity="estadoPorFila.get(num)?.estado === 'OK' ? 'success' : estadoPorFila.get(num)?.estado === 'ERROR' ? 'danger' : 'warn'"
                  size="small"
                />
              </td>
              <td>
                <Button
                  v-if="tieneDetalle(estadoPorFila.get(num))"
                  :icon="filasExpandidas.has(num) ? 'pi pi-eye-slash' : 'pi pi-eye'"
                  variant="text"
                  size="small"
                  :title="filasExpandidas.has(num) ? 'Ocultar detalle' : 'Ver detalle'"
                  @click="alternarDetalle(num)"
                />
                <span v-else class="text-xs text-surface-400">—</span>
              </td>
            </tr>
            <tr
              v-if="filasExpandidas.has(num)"
              :key="`${f.id || num}-detalle`"
            >
              <td colspan="17">
                <PlanillaFilaDetalle
                  :errores="estadoPorFila.get(num)?.errores || []"
                  :advertencias="estadoPorFila.get(num)?.advertencias || []"
                  :vehiculos-txt="vehiculosResumen(f)"
                  :estacionamientos-txt="estacionamientosResumen(f)"
                  :bodegas-txt="bodegasResumen(f)"
                  :es-adicional="f.tipo_vinculo === 'RESIDENTE_ADICIONAL'"
                  corregible
                  @corregir="emit('corregir', { email: f.email, unidad: f.unidad })"
                />
              </td>
            </tr>
            </template>
          </tbody>
        </table>
      </div>
      <p v-else-if="!stagingConNum.length" class="text-sm text-text-muted m-0">
        Sin filas para este filtro.
      </p>
      <Paginator
        v-if="stagingConNum.length > porPagina"
        :rows="porPagina"
        :totalRecords="stagingConNum.length"
        :first="pagina * porPagina"
        class="mt-2"
        @page="pagina = $event.page"
      />
      </template>

      <!-- Sin staging local (.xlsx o backend antiguo): datos del servidor -->
      <template v-else>
        <Message
          v-if="!backendFiel && archivoNombre?.toLowerCase().endsWith('.xlsx')"
          severity="info"
          :closable="false"
          class="m-0 mb-2"
        >
          Previsualización acotada: actualiza el backend para ver todas las columnas (ver SOLICITUD_PREVIEW_FIEL_IMPORTACION).
        </Message>
        <div v-if="(previewData.filas || []).length" class="tabla-scroll max-h-[68vh] overflow-auto border border-border border-round">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-surface">
              <tr>
                <th class="text-left p-2">#</th>
                <th class="text-left p-2">Casa</th>
                <th class="text-left p-2">Nombre</th>
                <th class="text-left p-2">Email</th>
                <th class="text-left p-2">Vínculo</th>
                <th v-if="backendFiel" class="text-left p-2">Estacionamientos</th>
                <th v-if="backendFiel" class="text-left p-2">Vehículos</th>
                <th v-if="backendFiel" class="text-left p-2">Bodegas</th>
                <th class="text-left p-2">Estado</th>
                <th class="text-left p-2">Detalle</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="f in previewPaginaLimitada" :key="f.numeroFila">
              <tr
                class="border-t border-border"
                :class="{ 'preview-ok': f.estado === 'OK', 'preview-error': f.estado === 'ERROR', 'preview-omitida': f.estado === 'OMITIDA' }"
              >
                <td class="p-2">{{ f.numeroFila }}</td>
                <td class="p-2">{{ f.unidad || "—" }}</td>
                <td class="p-2">{{ f.personaNombre || "—" }}</td>
                <td class="p-2 truncate max-w-32">{{ f.personaEmail || f.email || "—" }}</td>
                <td class="p-2">{{ f.tipoVinculo || "—" }}</td>
                <td v-if="backendFiel" class="p-2">{{ estacionamientosResumen({ estacionamientos: f.estacionamientos }) || "—" }}</td>
                <td v-if="backendFiel" class="p-2">{{ vehiculosResumen({ vehiculos: f.vehiculos }) || "—" }}</td>
                <td v-if="backendFiel" class="p-2">{{ bodegasResumen({ bodegas: f.bodegas }) || "—" }}</td>
                <td class="p-2">
                  <Tag :value="f.estado" :severity="f.estado === 'OK' ? 'success' : f.estado === 'ERROR' ? 'danger' : 'warn'" size="small" />
                </td>
                <td class="p-2">
                  <Button
                    v-if="tieneDetalle(f)"
                    :icon="filasExpandidas.has(f.numeroFila) ? 'pi pi-eye-slash' : 'pi pi-eye'"
                    variant="text"
                    size="small"
                    :title="filasExpandidas.has(f.numeroFila) ? 'Ocultar detalle' : 'Ver detalle'"
                    @click="alternarDetalle(f.numeroFila)"
                  />
                  <span v-else class="text-xs text-surface-400">—</span>
                </td>
              </tr>
              <tr v-if="filasExpandidas.has(f.numeroFila)" :key="`${f.numeroFila}-detalle`">
                <td colspan="10">
                  <PlanillaFilaDetalle
                    :errores="f.errores || []"
                    :advertencias="f.advertencias || []"
                    :vehiculos-txt="backendFiel ? vehiculosResumen(f) : ''"
                    :estacionamientos-txt="backendFiel ? estacionamientosResumen(f) : ''"
                    :bodegas-txt="backendFiel ? bodegasResumen(f) : ''"
                    :es-adicional="f.tipoVinculo === 'RESIDENTE_ADICIONAL'"
                    corregible
                    @corregir="emit('corregir', { email: f.personaEmail || f.email, unidad: f.unidad })"
                  />
                </td>
              </tr>
              </template>
            </tbody>
          </table>
        </div>
        <p v-else-if="!backendFiltrada.length" class="text-sm text-text-muted m-0">
          Sin filas para este filtro.
        </p>
        <Paginator
          v-if="backendFiltrada.length > porPagina"
          :rows="porPagina"
          :totalRecords="backendFiltrada.length"
          :first="pagina * porPagina"
          class="mt-2"
          @page="pagina = $event.page"
        />
      </template>

      <div class="mt-3 flex flex-wrap gap-2 justify-between items-center">
        <Button
          label="Limpiar todo"
          icon="pi pi-trash"
          severity="secondary"
          variant="text"
          size="small"
          :disabled="enviando"
          @click="emit('limpiar')"
        />
        <div class="flex flex-wrap gap-2">
          <Button label="Volver a editar" icon="pi pi-pencil" severity="secondary" size="small" variant="outlined" :disabled="enviando" @click="emit('descartar')" />
          <Button :label="`Importar ${previewData.filasOk} filas`" icon="pi pi-check" size="small" :loading="enviando" :disabled="!previewData.filasOk" @click="emit('importar')" />
        </div>
      </div>
    </template>
  </Card>
</template>
