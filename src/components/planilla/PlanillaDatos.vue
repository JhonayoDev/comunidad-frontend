<script setup>
import { ref, computed, watch } from "vue";
import {
  TIPOS_UNIDAD,
  TIPOS_VINCULO,
  TIPOS_VEHICULO,
  esEstacionamientoVisita,
} from "@/data/planillaColumnas";
import {
  formatearRut,
  formatearRutCompleto,
  formatearTelefono,
} from "@/utils/validadoresChile";

import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import AutoComplete from "primevue/autocomplete";
import Checkbox from "primevue/checkbox";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Paginator from "primevue/paginator";

// Recibe el objeto devuelto por usePlanillaDatos (estado + acciones).
const props = defineProps({
  planilla: { type: Object, required: true },
  // Modo wizard: la casa se selecciona de las unidades existentes y de ahí se
  // derivan tipo y sector (solo lectura). En la importación (default false) se
  // mantiene la escritura libre para permitir unidades nuevas vía CSV.
  soloUnidadesExistentes: { type: Boolean, default: false },
});

const emit = defineEmits(["guardar", "actualizado"]);

const filtroCasa = ref("");

// Modo edición (patrón fase 5 de unidades): por defecto la planilla se muestra
// en revisión (solo lectura); "Editar" habilita los campos y "Cancelar" revierte
// al snapshot tomado al entrar.
const editando = ref(false);
const snapshotEdicion = ref(null);

// Colapso de las secciones de recursos (vehículos/bodegas) en mobile.
const recursosAbiertos = ref({});
function toggleRecursos(id) {
  recursosAbiertos.value[id] =
    recursosAbiertos.value[id] === false ? true : false;
}

const p = computed(() => props.planilla);

const hayVisitas = computed(() =>
  (p.value.estacionamientos || []).some((x) =>
    esEstacionamientoVisita(x.nombre),
  ),
);

const conBodegas = computed(
  () =>
    (p.value.capacidad?.data || p.value.capacidad || {}).capacidadBodegas > 0,
);

const capacidadConfig = [
  { tipo: "CASA", label: "Casas", suffix: "Casas" },
  { tipo: "DEPARTAMENTO", label: "Departamentos", suffix: "Departamentos" },
  {
    tipo: "ESTACIONAMIENTO",
    label: "Estacionamientos",
    suffix: "Estacionamientos",
  },
  { tipo: "BODEGA", label: "Bodegas", suffix: "Bodegas" },
  { tipo: "OTRO", label: "Otro", suffix: "Otro" },
];

const capacidadData = computed(
  () => p.value.capacidad?.data || p.value.capacidad || {},
);

const usoPorTipo = computed(() => {
  const map = {};
  (p.value.unidades || []).forEach((u) => {
    map[u.tipo] = (map[u.tipo] || 0) + 1;
  });
  return map;
});

function capacidadDe(tipo) {
  const cfg = capacidadConfig.find((c) => c.tipo === tipo);
  return capacidadData.value[`capacidad${cfg.suffix}`] ?? null;
}

function usoDe(tipo) {
  return usoPorTipo.value[tipo] || 0;
}

const capacidadVisible = computed(() =>
  capacidadConfig.filter((c) => capacidadDe(c.tipo) != null),
);

// Lista plana de filas (sin agrupación por casa), filtrable por número de casa.
const filasFiltradas = computed(() => {
  const q = filtroCasa.value.trim().toLowerCase();
  if (!q) return p.value.filas;
  return p.value.filas.filter((f) =>
    String(f.unidad || "")
      .toLowerCase()
      .includes(q),
  );
});

// Paginación (Meta: virtualización progresiva, 50/pág evita bloqueo Firefox con 500+ filas)
const pagina = ref(0);
const porPagina = 50;
const filasFiltradasPaginadas = computed(() => {
  const start = pagina.value * porPagina;
  return filasFiltradas.value.slice(start, start + porPagina);
});
watch(filasFiltradas, () => {
  pagina.value = 0;
});
watch(
  () => p.value.filas.length,
  () => {
    if (pagina.value * porPagina >= filasFiltradas.value.length && pagina.value > 0) {
      pagina.value = 0;
    }
  },
);

const totalFilas = computed(() => p.value.filas.length);
const filasConDatos = computed(
  () =>
    p.value.filas.filter(
      (f) => (f.nombre || "").trim() || (f.email || "").trim(),
    ).length,
);

function entrarEdicion() {
  snapshotEdicion.value = JSON.parse(JSON.stringify(p.value.filas));
  editando.value = true;
}

function salirEdicion() {
  editando.value = false;
}

function cancelarEdicion() {
  if (snapshotEdicion.value) p.value.filas = snapshotEdicion.value;
  editando.value = false;
}

const tiposUnidadOpciones = TIPOS_UNIDAD.map((t) => ({ label: t, value: t }));
const tiposVinculoOpciones = TIPOS_VINCULO.map((t) => ({ label: t, value: t }));
const tiposVehiculoOpciones = TIPOS_VEHICULO.map((t) => ({
  label: t,
  value: t,
}));

// ─── Sugerencias AutoComplete (casas/estacionamientos/bodegas declarados) ───
const casasSugerencias = ref([]);
const estSugerencias = ref([]);
const bodegaSugerencias = ref([]);

function buscarCasas(e) {
  const q = (e.query || "").toLowerCase();
  casasSugerencias.value = p.value.unidades
    .filter((u) => u.tipo !== "CONDOMINIO")
    .map((u) => String(u.numero))
    .filter((n) => n.toLowerCase().includes(q));
}

function buscarEst(e) {
  const q = (e.query || "").toLowerCase();
  estSugerencias.value = p.value.estacionamientos
    .filter((x) => !esEstacionamientoVisita(x.nombre))
    .map((x) => x.nombre)
    .filter((n) => n.toLowerCase().includes(q));
}

function buscarBodegas(e) {
  const q = (e.query || "").toLowerCase();
  bodegaSugerencias.value = p.value.bodegas
    .map((x) => x.nombre)
    .filter((n) => n.toLowerCase().includes(q));
}

// ─── Resumen del preview (estados OK/ERROR/OMITIDA por fila) ────────────────
const previewOmitidas = computed(() => {
  if (!p.value.previewData) return 0;
  const d = p.value.previewData;
  return Math.max(0, d.totalFilas - d.filasOk - d.filasError);
});

const previewErrores = computed(() => {
  if (!p.value.previewData) return [];
  return (p.value.previewData.filas || []).filter((f) => f.estado === "ERROR");
});

function erroresDe(f) {
  return (
    p.value.filasConErrores?.find((x) => x.fila.id === f.id)?.errores || []
  );
}

function vehiculosDe(f) {
  return (f.vehiculos || [])
    .map((v) => ({
      uid: v.uid,
      patente: (v.patente || "").trim(),
      tipo: (v.tipo || "").trim(),
      marca: (v.marca || "").trim(),
      modelo: (v.modelo || "").trim(),
      color: (v.color || "").trim(),
      est: (v.estacionamiento || "").trim(),
    }))
    .filter((v) => v.patente);
}

function bodegasDe(f) {
  return (f.bodegas || [])
    .map((b) => (typeof b === "string" ? b : b.nombre || "").trim())
    .filter(Boolean);
}

function guardar() {
  emit("guardar");
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Filtros y acciones -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
      <span class="p-input-icon-left w-full sm:w-64">
        <i class="pi pi-search"></i>
        <InputText
          v-model="filtroCasa"
          placeholder="Filtrar por casa…"
          class="w-full"
        />
      </span>
      <span class="text-sm text-text-muted"> {{ totalFilas }} fila(s) </span>
      <span v-if="hayVisitas" class="text-xs text-text-muted w-full sm:w-auto">
        Los estacionamientos EV-* son de visitas y no se asignan a casas.
      </span>
      <div class="flex gap-1 sm:ml-auto">
        <template v-if="!editando">
          <Button
            label="Editar"
            icon="pi pi-pencil"
            size="small"
            @click="entrarEdicion"
          />
        </template>
        <template v-else>
          <Button
            label="Listo"
            icon="pi pi-check"
            size="small"
            @click="salirEdicion"
          />
          <Button
            label="Cancelar"
            severity="secondary"
            size="small"
            @click="cancelarEdicion"
          />
          <Button
            label="Agregar fila"
            icon="pi pi-plus"
            size="small"
            @click="p.agregarFila()"
          />
        </template>
      </div>
    </div>

    <Message
      v-if="p.borradorRestaurado"
      severity="warn"
      :closable="false"
      class="m-0"
    >
      Se restauró un borrador de esta sesión con {{ totalFilas }} fila(s).
      Puedes continuar donde quedaste.
    </Message>

    <Message
      v-if="p.modoReedicion"
      severity="info"
      :closable="false"
      class="m-0"
    >
      Mostrando {{ totalFilas }} integrante(s) ya registrados en el condominio.
      Pulsa <strong>Editar</strong> para modificar, desvincular o agregar filas.
    </Message>

    <Message
      v-if="p.previewData"
      :severity="previewErrores.length ? 'warn' : 'info'"
      :closable="false"
      class="m-0"
    >
      <template #default>
        <div class="text-sm">
          <strong>Previsualización:</strong> {{ p.previewData.filasOk }} filas
          OK · {{ p.previewData.filasError }} con error ·
          {{ previewOmitidas }} omitidas (vínculo ya existente).
          <span v-if="previewErrores.length" class="block mt-1">
            <span v-for="(e, i) in previewErrores" :key="i" class="block">
              Fila {{ e.numeroFila }} ({{ e.unidad }} · {{ e.personaNombre }}):
              {{ (e.errores || []).join("; ") }}
            </span>
          </span>
        </div>
      </template>
    </Message>

    <Skeleton v-if="p.cargando" width="100%" height="240px" />
    <Message v-else-if="p.error" severity="error" class="m-0">{{
      p.error
    }}</Message>

    <template v-else>
      <div v-if="capacidadVisible.length" class="flex flex-wrap gap-2">
        <div
          v-for="c in capacidadVisible"
          :key="c.tipo"
          class="flex-1 min-w-32 px-3 py-2 flex items-center justify-between gap-2 border border-border rounded-lg"
          style="background-color: var(--color-surface)"
        >
          <span class="text-xs text-text-muted whitespace-nowrap">{{
            c.label
          }}</span>
          <span
            class="text-sm font-semibold"
            :class="usoDe(c.tipo) >= capacidadDe(c.tipo) ? 'text-danger' : ''"
          >
            {{ usoDe(c.tipo) }} / {{ capacidadDe(c.tipo) }}
          </span>
        </div>
      </div>

      <div v-if="!totalFilas" class="text-center text-text-muted py-10">
        <i class="pi pi-inbox text-3xl block mb-2"></i>
        Aún no hay filas. Pulsa <strong>Editar</strong> para agregar la primera.
      </div>
      <div
        v-else-if="!filasFiltradas.length"
        class="text-center text-surface-400 py-10"
      >
        <i class="pi pi-search text-3xl block mb-2"></i>
        Sin filas para ese filtro.
      </div>

      <template v-else>
        <!-- Desktop: tabla tipo Excel (.planilla) -->
        <div class="planilla hidden md:block">
          <table>
            <thead>
              <tr>
                <th>Casa</th>
                <th>Tipo</th>
                <th>Sector</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>RUT</th>
                <th>Teléfono</th>
                <th>Vínculo</th>
                <th class="text-center">Ocup.</th>
                <th class="text-center">Notif.</th>
                <th class="text-center">Resp.</th>
                <th>Vehículos</th>
                <th v-if="conBodegas">Bodegas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in filasFiltradasPaginadas" :key="f.id">
                <td class="whitespace-nowrap align-middle">
                  <template v-if="editando">
                    <AutoComplete
                      v-if="soloUnidadesExistentes"
                      :modelValue="f.unidad"
                      :suggestions="casasSugerencias"
                      @complete="buscarCasas"
                      placeholder="N° casa"
                      dropdown
                      class="w-28"
                      @update:modelValue="p.asignarUnidad(f.id, $event)"
                    />
                    <AutoComplete
                      v-else
                      :modelValue="f.unidad"
                      :suggestions="casasSugerencias"
                      @complete="buscarCasas"
                      placeholder="N°"
                      class="w-24"
                      @update:modelValue="
                        p.actualizarFila(f.id, 'unidad', $event)
                      "
                    />
                  </template>
                  <span v-else>{{ f.unidad || "—" }}</span>
                </td>
                <td class="whitespace-nowrap align-middle">
                  <template v-if="editando">
                    <Tag
                      v-if="soloUnidadesExistentes"
                      :value="f.tipo_unidad || '—'"
                      severity="secondary"
                      size="small"
                    />
                    <Select
                      v-else
                      :modelValue="f.tipo_unidad"
                      :options="tiposUnidadOpciones"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Tipo"
                      class="w-32"
                      @update:modelValue="
                        p.actualizarFila(f.id, 'tipo_unidad', $event)
                      "
                    />
                  </template>
                  <Tag
                    v-else
                    :value="f.tipo_unidad || '—'"
                    severity="secondary"
                    size="small"
                  />
                </td>
                <td class="align-middle">
                  <template v-if="editando">
                    <span
                      v-if="soloUnidadesExistentes"
                      class="text-sm"
                      :class="f.sector ? '' : 'text-surface-400'"
                    >
                      {{ f.sector || "—" }}
                    </span>
                    <InputText
                      v-else
                      :modelValue="f.sector"
                      placeholder="Sector"
                      class="w-full min-w-24"
                      @update:modelValue="
                        p.actualizarFila(f.id, 'sector', $event)
                      "
                    />
                  </template>
                  <span
                    v-else
                    class="text-sm"
                    :class="f.sector ? '' : 'text-surface-400'"
                  >
                    {{ f.sector || "—" }}
                  </span>
                </td>
                <td class="align-middle">
                  <template v-if="editando">
                    <InputText
                      :modelValue="f.nombre"
                      placeholder="Nombre"
                      class="w-full min-w-36"
                      @update:modelValue="
                        p.actualizarFila(f.id, 'nombre', $event)
                      "
                    />
                  </template>
                  <span v-else>{{ f.nombre || "—" }}</span>
                </td>
                <td class="align-middle">
                  <template v-if="editando && f.esNuevo !== false">
                    <InputText
                      :modelValue="f.email"
                      placeholder="Email"
                      class="w-full min-w-40"
                      @update:modelValue="
                        p.actualizarFila(f.id, 'email', $event)
                      "
                    />
                  </template>
                  <span
                    v-else
                    :title="
                      f.esNuevo === false
                        ? 'El email de una persona existente no es editable'
                        : ''
                    "
                  >
                    {{ f.email || "—" }}
                  </span>
                </td>
                <td class="align-middle">
                  <template v-if="editando && f.esNuevo !== false">
                    <InputText
                      v-model="f.rut"
                      placeholder="RUT"
                      maxlength="12"
                      class="w-full min-w-24"
                      @input="f.rut = formatearRut(f.rut)"
                      @blur="f.rut = formatearRutCompleto(f.rut)"
                    />
                  </template>
                  <span
                    v-else
                    :title="
                      f.esNuevo === false
                        ? 'El RUT de una persona existente no es editable'
                        : ''
                    "
                  >
                    {{ f.rut || "—" }}
                  </span>
                </td>
                <td class="align-middle">
                  <template v-if="editando">
                    <InputText
                      v-model="f.telefono"
                      placeholder="Tel."
                      maxlength="16"
                      class="w-full min-w-28"
                      @input="f.telefono = formatearTelefono(f.telefono)"
                      @blur="f.telefono = formatearTelefono(f.telefono)"
                    />
                  </template>
                  <span v-else>{{ f.telefono || "—" }}</span>
                </td>
                <td class="whitespace-nowrap align-middle">
                  <template v-if="editando">
                    <Select
                      :modelValue="f.tipo_vinculo"
                      :options="tiposVinculoOpciones"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Vínculo"
                      class="w-32"
                      @update:modelValue="
                        p.actualizarFila(f.id, 'tipo_vinculo', $event)
                      "
                    />
                  </template>
                  <Tag
                    v-else-if="f.tipo_vinculo"
                    :value="f.tipo_vinculo"
                    :severity="
                      f.tipo_vinculo === 'PROPIETARIO' ? 'info' : 'secondary'
                    "
                    size="small"
                  />
                  <span v-else>—</span>
                </td>
                <td class="align-middle text-center">
                  <div
                    class="flex items-center justify-center gap-1"
                    title="Es ocupante"
                  >
                    <Checkbox
                      :binary="true"
                      :modelValue="f.es_ocupante === 'SI'"
                      :disabled="!editando"
                      @update:modelValue="
                        (v) =>
                          p.actualizarFila(f.id, 'es_ocupante', v ? 'SI' : 'NO')
                      "
                    />
                  </div>
                </td>
                <td class="align-middle text-center">
                  <div
                    class="flex items-center justify-center gap-1"
                    title="Recibe notificaciones"
                  >
                    <Checkbox
                      :binary="true"
                      :modelValue="f.recibe_notificaciones === 'SI'"
                      :disabled="!editando"
                      @update:modelValue="
                        (v) =>
                          p.actualizarFila(
                            f.id,
                            'recibe_notificaciones',
                            v ? 'SI' : 'NO',
                          )
                      "
                    />
                  </div>
                </td>
                <td class="align-middle text-center">
                  <div
                    class="flex items-center justify-center gap-1"
                    title="Responsable de la casa"
                  >
                    <Checkbox
                      :binary="true"
                      :modelValue="f.es_responsable === 'SI'"
                      :disabled="!editando"
                      @update:modelValue="
                        (v) => {
                          if (v) p.marcarResponsable(f.id);
                        }
                      "
                    />
                  </div>
                </td>
                <td class="align-middle min-w-64">
                  <template v-if="editando">
                    <div class="flex flex-col gap-1">
                      <div
                        v-for="v in f.vehiculos || []"
                        :key="v.uid"
                        class="flex flex-col gap-1"
                      >
                        <div class="flex items-center gap-1">
                          <InputText
                            :modelValue="v.patente"
                            placeholder="Patente"
                            class="w-24"
                            @update:modelValue="v.patente = $event"
                          />
                          <Select
                            :modelValue="v.tipo"
                            :options="tiposVehiculoOpciones"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Tipo"
                            class="w-28"
                            @update:modelValue="v.tipo = $event"
                          />
                          <Button
                            icon="pi pi-trash"
                            variant="text"
                            severity="danger"
                            size="small"
                            title="Quitar vehículo"
                            @click="p.quitarVehiculo(f.id, v.uid)"
                          />
                        </div>
                        <AutoComplete
                          :modelValue="v.estacionamiento"
                          :suggestions="estSugerencias"
                          @complete="buscarEst"
                          placeholder="Estacionamiento"
                          class="w-full"
                          @update:modelValue="v.estacionamiento = $event"
                        />
                      </div>
                      <Button
                        label="Agregar vehículo"
                        icon="pi pi-plus"
                        variant="text"
                        size="small"
                        @click="p.agregarVehiculo(f.id)"
                      />
                    </div>
                  </template>
                  <div v-else class="flex flex-col gap-1 text-sm">
                    <span v-for="v in vehiculosDe(f)" :key="v.uid">
                      {{ v.patente
                      }}<template v-if="v.est"> · {{ v.est }}</template>
                    </span>
                    <span v-if="!vehiculosDe(f).length" class="text-surface-400"
                      >—</span
                    >
                  </div>
                </td>
                <td v-if="conBodegas" class="align-middle min-w-40">
                  <template v-if="editando">
                    <div class="flex flex-col gap-1">
                      <div
                        v-for="b in f.bodegas || []"
                        :key="b.uid"
                        class="flex items-center gap-1"
                      >
                        <AutoComplete
                          :modelValue="b.nombre"
                          :suggestions="bodegaSugerencias"
                          @complete="buscarBodegas"
                          placeholder="Bodega"
                          class="flex-1"
                          @update:modelValue="b.nombre = $event"
                        />
                        <Button
                          icon="pi pi-trash"
                          variant="text"
                          severity="danger"
                          size="small"
                          title="Quitar bodega"
                          @click="p.quitarBodega(f.id, b.uid)"
                        />
                      </div>
                      <Button
                        label="Agregar bodega"
                        icon="pi pi-plus"
                        variant="text"
                        size="small"
                        @click="p.agregarBodega(f.id)"
                      />
                    </div>
                  </template>
                  <span v-else class="text-sm">{{
                    bodegasDe(f).join(", ") || "—"
                  }}</span>
                </td>
                <td class="align-middle text-center">
                  <div class="flex items-center justify-center gap-1">
                    <Tag
                      v-if="erroresDe(f).length"
                      value="Errores"
                      severity="danger"
                      size="small"
                    />
                    <Tag
                      v-if="f.es_responsable === 'SI'"
                      value="Responsable"
                      severity="warn"
                      size="small"
                    />
                    <Tag
                      v-if="f.marcadoEliminar"
                      value="Eliminado"
                      severity="danger"
                      size="small"
                    />
                    <Button
                      v-if="editando"
                      icon="pi pi-trash"
                      variant="text"
                      severity="danger"
                      size="small"
                      :title="
                        f.esNuevo === false
                          ? 'Desvincular integrante'
                          : 'Quitar fila'
                      "
                      @click="p.marcarEliminar(f.id)"
                    />
                  </div>
                  <ul
                    v-if="erroresDe(f).length"
                    class="m-0 mt-1 pl-4 text-left text-xs text-danger"
                  >
                    <li v-for="(e, i) in erroresDe(f)" :key="i">{{ e }}</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
          <Paginator
            v-if="filasFiltradas.length > porPagina"
            :rows="porPagina"
            :totalRecords="filasFiltradas.length"
            :first="pagina * porPagina"
            class="mt-2"
            @page="pagina = $event.page"
          />
        </div>

        <!-- Mobile: cards -->
        <div class="flex flex-col gap-2 md:hidden">
          <div
            v-for="f in filasFiltradasPaginadas"
            :key="f.id"
            class="p-2 border-round flex flex-col gap-2"
            :class="erroresDe(f).length ? 'bg-danger/5' : ''"
          >
            <div class="grid grid-cols-2 gap-2">
              <div class="flex flex-col gap-1">
                <label class="text-xs text-surface-400">Casa *</label>
                <template v-if="editando">
                  <AutoComplete
                    v-if="soloUnidadesExistentes"
                    :modelValue="f.unidad"
                    :suggestions="casasSugerencias"
                    @complete="buscarCasas"
                    placeholder="N° casa"
                    dropdown
                    class="w-full"
                    @update:modelValue="p.asignarUnidad(f.id, $event)"
                  />
                  <AutoComplete
                    v-else
                    v-model="f.unidad"
                    :suggestions="casasSugerencias"
                    @complete="buscarCasas"
                    placeholder="N° casa"
                    class="w-full"
                  />
                </template>
                <span v-else class="text-sm">{{ f.unidad || "—" }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs text-surface-400">Tipo</label>
                <template v-if="editando">
                  <Tag
                    v-if="soloUnidadesExistentes"
                    :value="f.tipo_unidad || '—'"
                    severity="secondary"
                    size="small"
                    class="w-fit"
                  />
                  <Select
                    v-else
                    v-model="f.tipo_unidad"
                    :options="tiposUnidadOpciones"
                    optionLabel="label"
                    optionValue="value"
                  />
                </template>
                <Tag
                  v-else
                  :value="f.tipo_unidad || '—'"
                  severity="secondary"
                  size="small"
                  class="w-fit"
                />
              </div>
              <div class="flex flex-col gap-1 col-span-2">
                <label class="text-xs text-surface-400">Nombre *</label>
                <template v-if="editando">
                  <InputText v-model="f.nombre" placeholder="Nombre completo" />
                </template>
                <span v-else class="text-sm">{{ f.nombre || "—" }}</span>
              </div>
              <div class="flex flex-col gap-1 col-span-2">
                <label class="text-xs text-surface-400">Email *</label>
                <template v-if="editando && f.esNuevo !== false">
                  <InputText v-model="f.email" placeholder="email@ejemplo.cl" />
                </template>
                <span
                  v-else
                  class="text-sm"
                  :title="
                    f.esNuevo === false
                      ? 'El email de una persona existente no es editable'
                      : ''
                  "
                >
                  {{ f.email || "—" }}
                </span>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs text-surface-400">RUT</label>
                <template v-if="editando && f.esNuevo !== false">
                  <InputText
                    v-model="f.rut"
                    placeholder="Ej: 12.345.678-9"
                    maxlength="12"
                    @input="f.rut = formatearRut(f.rut)"
                    @blur="f.rut = formatearRutCompleto(f.rut)"
                  />
                </template>
                <span
                  v-else
                  class="text-sm"
                  :title="
                    f.esNuevo === false
                      ? 'El RUT de una persona existente no es editable'
                      : ''
                  "
                >
                  {{ f.rut || "—" }}
                </span>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs text-surface-400">Teléfono</label>
                <template v-if="editando">
                  <InputText
                    v-model="f.telefono"
                    placeholder="Ej: +56 9 1234 5678"
                    maxlength="16"
                    @input="f.telefono = formatearTelefono(f.telefono)"
                    @blur="f.telefono = formatearTelefono(f.telefono)"
                  />
                </template>
                <span v-else class="text-sm">{{ f.telefono || "—" }}</span>
              </div>
              <div class="flex flex-col gap-1 col-span-2">
                <label class="text-xs text-surface-400">Sector</label>
                <template v-if="editando">
                  <span
                    v-if="soloUnidadesExistentes"
                    class="text-sm"
                    :class="f.sector ? '' : 'text-surface-400'"
                  >
                    {{ f.sector || "—" }}
                  </span>
                  <InputText v-else v-model="f.sector" placeholder="Sector A" />
                </template>
                <span
                  v-else
                  class="text-sm"
                  :class="f.sector ? '' : 'text-surface-400'"
                >
                  {{ f.sector || "—" }}
                </span>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs text-surface-400">Vínculo</label>
                <template v-if="editando">
                  <Select
                    v-model="f.tipo_vinculo"
                    :options="tiposVinculoOpciones"
                    optionLabel="label"
                    optionValue="value"
                  />
                </template>
                <Tag
                  v-else-if="f.tipo_vinculo"
                  :value="f.tipo_vinculo"
                  :severity="
                    f.tipo_vinculo === 'PROPIETARIO' ? 'info' : 'secondary'
                  "
                  size="small"
                  class="w-fit"
                />
                <span v-else class="text-sm text-surface-400">—</span>
              </div>
              <div class="flex items-end gap-2 col-span-2">
                <div class="flex items-center gap-2">
                  <Checkbox
                    inputId="ocup"
                    :binary="true"
                    :modelValue="f.es_ocupante === 'SI'"
                    :disabled="!editando"
                    @update:modelValue="
                      (v) =>
                        p.actualizarFila(f.id, 'es_ocupante', v ? 'SI' : 'NO')
                    "
                  />
                  <label for="ocup" class="text-sm">Ocupante</label>
                </div>
                <div class="flex items-center gap-2">
                  <Checkbox
                    inputId="notif"
                    :binary="true"
                    :modelValue="f.recibe_notificaciones === 'SI'"
                    :disabled="!editando"
                    @update:modelValue="
                      (v) =>
                        p.actualizarFila(
                          f.id,
                          'recibe_notificaciones',
                          v ? 'SI' : 'NO',
                        )
                    "
                  />
                  <label for="notif" class="text-sm">Notif.</label>
                </div>
                <div class="flex items-center gap-2">
                  <Checkbox
                    inputId="resp"
                    :binary="true"
                    :modelValue="f.es_responsable === 'SI'"
                    :disabled="!editando"
                    @update:modelValue="
                      (v) => {
                        if (v) p.marcarResponsable(f.id);
                      }
                    "
                  />
                  <label for="resp" class="text-sm">Responsable</label>
                </div>
              </div>
            </div>

            <div
              class="flex flex-col gap-1 border border-border rounded-lg p-2"
            >
              <button
                type="button"
                class="flex items-center justify-between w-full text-left"
                @click="toggleRecursos(f.id)"
              >
                <span class="text-xs font-semibold text-surface-400">
                  Vehículos ({{ (f.vehiculos || []).length }})
                </span>
                <i
                  class="pi text-xs"
                  :class="
                    recursosAbiertos[f.id] !== false
                      ? 'pi-chevron-up'
                      : 'pi-chevron-down'
                  "
                ></i>
              </button>
              <template v-if="recursosAbiertos[f.id] !== false">
                <template v-if="editando">
                  <div
                    v-for="v in f.vehiculos || []"
                    :key="v.uid"
                    class="flex flex-col gap-1"
                  >
                    <InputText
                      :modelValue="v.patente"
                      placeholder="Patente"
                      class="w-full"
                      @update:modelValue="v.patente = $event"
                    />
                    <Select
                      :modelValue="v.tipo"
                      :options="tiposVehiculoOpciones"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Tipo"
                      class="w-full"
                      @update:modelValue="v.tipo = $event"
                    />
                    <div class="flex items-center gap-2">
                      <AutoComplete
                        :modelValue="v.estacionamiento"
                        :suggestions="estSugerencias"
                        @complete="buscarEst"
                        placeholder="Estacionamiento"
                        class="flex-1"
                        @update:modelValue="v.estacionamiento = $event"
                      />
                      <Button
                        icon="pi pi-trash"
                        variant="text"
                        severity="danger"
                        size="small"
                        title="Quitar vehículo"
                        @click="p.quitarVehiculo(f.id, v.uid)"
                      />
                    </div>
                  </div>
                  <Button
                    label="Agregar vehículo"
                    icon="pi pi-plus"
                    variant="text"
                    size="small"
                    @click="p.agregarVehiculo(f.id)"
                  />
                </template>
                <div v-else class="flex flex-col gap-1 text-sm">
                  <span v-for="v in vehiculosDe(f)" :key="v.uid">
                    {{ v.patente
                    }}<template v-if="v.est"> · {{ v.est }}</template>
                  </span>
                  <span v-if="!vehiculosDe(f).length" class="text-surface-400"
                    >—</span
                  >
                </div>
              </template>
            </div>

            <div
              v-if="conBodegas"
              class="flex flex-col gap-1 border border-border rounded-lg p-2"
            >
              <button
                type="button"
                class="flex items-center justify-between w-full text-left"
                @click="toggleRecursos(f.id)"
              >
                <span class="text-xs font-semibold text-surface-400">
                  Bodegas ({{ (f.bodegas || []).length }})
                </span>
                <i
                  class="pi text-xs"
                  :class="
                    recursosAbiertos[f.id] !== false
                      ? 'pi-chevron-up'
                      : 'pi-chevron-down'
                  "
                ></i>
              </button>
              <template v-if="recursosAbiertos[f.id] !== false">
                <template v-if="editando">
                  <div
                    v-for="b in f.bodegas || []"
                    :key="b.uid"
                    class="flex items-center gap-2"
                  >
                    <AutoComplete
                      :modelValue="b.nombre"
                      :suggestions="bodegaSugerencias"
                      @complete="buscarBodegas"
                      placeholder="Bodega"
                      class="flex-1"
                      @update:modelValue="b.nombre = $event"
                    />
                    <Button
                      icon="pi pi-trash"
                      variant="text"
                      severity="danger"
                      size="small"
                      title="Quitar bodega"
                      @click="p.quitarBodega(f.id, b.uid)"
                    />
                  </div>
                  <Button
                    label="Agregar bodega"
                    icon="pi pi-plus"
                    variant="text"
                    size="small"
                    @click="p.agregarBodega(f.id)"
                  />
                </template>
                <span v-else class="text-sm">{{
                  bodegasDe(f).join(", ") || "—"
                }}</span>
              </template>
            </div>

            <div class="flex items-center justify-between">
              <Button
                v-if="editando"
                :label="f.marcadoEliminar ? 'Desmarcar' : 'Quitar'"
                :icon="f.marcadoEliminar ? 'pi pi-undo' : 'pi pi-trash'"
                variant="text"
                :severity="f.marcadoEliminar ? 'secondary' : 'danger'"
                size="small"
                @click="p.marcarEliminar(f.id)"
              />
              <span v-else></span>
              <div class="flex items-center gap-1">
                <Tag
                  v-if="erroresDe(f).length"
                  value="Errores"
                  severity="danger"
                  size="small"
                />
                <Tag
                  v-if="f.marcadoEliminar"
                  value="Eliminado"
                  severity="danger"
                  size="small"
                />
                <Tag
                  v-if="f.es_responsable === 'SI'"
                  value="Responsable"
                  severity="warn"
                  size="small"
                />
                <Tag
                  v-if="f.tipo_vinculo"
                  :value="f.tipo_vinculo"
                  :severity="
                    f.tipo_vinculo === 'PROPIETARIO' ? 'info' : 'secondary'
                  "
                  size="small"
                />
              </div>
            </div>

            <ul v-if="erroresDe(f).length" class="m-0 pl-4 text-sm text-danger">
              <li v-for="(e, i) in erroresDe(f)" :key="i">{{ e }}</li>
            </ul>
          </div>
          <Paginator
            v-if="filasFiltradas.length > porPagina"
            :rows="porPagina"
            :totalRecords="filasFiltradas.length"
            :first="pagina * porPagina"
            class="mt-2 md:hidden"
            @page="pagina = $event.page"
          />
        </div>
      </template>
    </template>
  </div>
</template>

