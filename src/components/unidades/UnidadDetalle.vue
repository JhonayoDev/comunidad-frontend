<script setup>
import { computed } from "vue";
import Button from "primevue/button";
import Skeleton from "primevue/skeleton";
import Tag from "primevue/tag";
import Message from "primevue/message";
import {
  labelRolRecurso,
  labelTipoVehiculo,
  labelTipoVinculo,
  ordenarVinculos,
  TIPO_VINCULO_SEVERITY,
} from "@/utils/unidadesConsulta";

const props = defineProps({
  unidad: { type: Object, required: true },
  vinculos: { type: Array, default: () => [] },
  recursos: {
    type: Object,
    default: () => ({ vehiculos: [], estacionamientos: [], bodegas: [], espacios: [] }),
  },
  cargando: { type: Boolean, default: false },
  error: { type: String, default: "" },
  puedeVerVinculos: { type: Boolean, default: true },
  puedeEditarPersona: { type: Boolean, default: false },
  puedeDesvincular: { type: Boolean, default: false },
  puedeQuitarPersona: { type: Boolean, default: false },
  puedeVincularPersona: { type: Boolean, default: false },
  puedeEliminarVehiculo: { type: Boolean, default: false },
  puedeAgregarVehiculo: { type: Boolean, default: false },
});

const emit = defineEmits([
  "editar-persona",
  "quitar-persona",
  "vincular-persona",
  "quitar-vehiculo",
  "agregar-vehiculo",
]);

const personas = computed(() => ordenarVinculos(props.vinculos));
const vehiculos = computed(() => props.recursos.vehiculos || []);
const estacionamientos = computed(() => props.recursos.estacionamientos || []);
const bodegas = computed(() => props.recursos.bodegas || []);
const espacios = computed(() => props.recursos.espacios || []);

const tieneAccionesPersona = computed(
  () => props.puedeEditarPersona || props.puedeDesvincular || props.puedeQuitarPersona,
);

const tieneBienes = computed(
  () =>
    estacionamientos.value.length ||
    bodegas.value.length ||
    espacios.value.length,
);
</script>

<template>
  <div class="flex flex-col gap-4 border-t border-border-soft pt-3">
    <!-- Personas -->
    <section class="flex flex-col gap-2" aria-label="Personas de la unidad">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <i class="pi pi-users text-primary" aria-hidden="true" />
          <h3 class="text-sm font-semibold m-0">Personas</h3>
          <Tag
            v-if="!cargando"
            :value="String(personas.length)"
            severity="info"
            size="small"
          />
        </div>
        <Button
          v-if="puedeVincularPersona"
          label="Vincular en Personas"
          icon="pi pi-user-plus"
          size="small"
          severity="secondary"
          variant="text"
          title="El vínculo persona-unidad se gestiona en la vista Personas"
          @click="emit('vincular-persona')"
        />
      </div>

      <Skeleton v-if="cargando" width="100%" height="3.5rem" />
      <Message v-else-if="error" severity="error" :closable="false" size="small">
        {{ error }}
      </Message>
      <div
        v-else-if="!puedeVerVinculos"
        class="text-sm text-text-subprincipal bg-inset border border-border-soft rounded-lg p-3"
      >
        Tu perfil no tiene permiso para ver las personas de esta unidad.
      </div>
      <div
        v-else-if="!personas.length"
        class="text-sm text-text-subprincipal bg-inset border border-border-soft rounded-lg p-3"
      >
        Sin personas vinculadas a esta unidad. El vínculo se crea en Personas.
      </div>

      <div v-else class="flex flex-col gap-1">
        <div
          v-for="v in personas"
          :key="v.id"
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-2 rounded-lg bg-inset border border-border-soft"
        >
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <i class="pi pi-user text-text-muted" aria-hidden="true" />
            <span class="text-sm font-medium truncate" :title="v.personaNombre">
              {{ v.personaNombre }}
            </span>
            <Tag
              :value="labelTipoVinculo(v.tipo)"
              :severity="TIPO_VINCULO_SEVERITY[v.tipo] || 'info'"
              size="small"
            />
            <Tag
              v-if="v.esOcupante"
              value="Vive aquí"
              severity="success"
              size="small"
            />
            <Tag
              v-if="v.esResponsable"
              value="Responsable"
              severity="warn"
              size="small"
            />
          </div>
          <div
            v-if="tieneAccionesPersona"
            class="flex items-center gap-1 shrink-0 self-end sm:self-auto"
          >
            <Button
              v-if="puedeEditarPersona"
              icon="pi pi-pencil"
              severity="secondary"
              variant="text"
              size="small"
              rounded
              :title="`Editar a ${v.personaNombre}`"
              :aria-label="`Editar a ${v.personaNombre}`"
              @click="emit('editar-persona', v)"
            />
            <Button
              v-if="puedeDesvincular || puedeQuitarPersona"
              icon="pi pi-user-minus"
              severity="danger"
              variant="text"
              size="small"
              rounded
              :title="`Quitar a ${v.personaNombre}`"
              :aria-label="`Quitar a ${v.personaNombre}`"
              @click="emit('quitar-persona', v)"
            />
          </div>
        </div>
        <span class="text-[11px] text-text-subtle">
          Residente adicional: no es titular de la casa · Responsable: recibe
          las comunicaciones de la unidad.
        </span>
      </div>
    </section>

    <!-- Vehículos -->
    <section class="flex flex-col gap-2" aria-label="Vehículos de la unidad">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <i class="pi pi-car text-primary" aria-hidden="true" />
          <h3 class="text-sm font-semibold m-0">Vehículos</h3>
          <Tag :value="String(vehiculos.length)" severity="info" size="small" />
        </div>
        <Button
          v-if="puedeAgregarVehiculo"
          label="Agregar vehículo"
          icon="pi pi-plus"
          size="small"
          severity="secondary"
          variant="text"
          @click="emit('agregar-vehiculo')"
        />
      </div>

      <div
        v-if="!vehiculos.length"
        class="text-sm text-text-subprincipal bg-inset border border-border-soft rounded-lg p-3"
      >
        Sin vehículos registrados en esta casa.
      </div>
      <div v-else class="flex flex-col gap-1">
        <div
          v-for="vehiculo in vehiculos"
          :key="vehiculo.id"
          class="flex items-center justify-between gap-2 p-2 rounded-lg bg-inset border border-border-soft"
        >
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <span class="font-mono text-sm font-semibold">
              {{ vehiculo.patente }}
            </span>
            <Tag
              :value="labelTipoVehiculo(vehiculo.tipo)"
              severity="secondary"
              size="small"
            />
            <span class="text-xs text-text-muted truncate">
              {{ [vehiculo.marca, vehiculo.modelo, vehiculo.color].filter(Boolean).join(" · ") || "Sin detalles" }}
            </span>
          </div>
          <Button
            v-if="puedeEliminarVehiculo"
            icon="pi pi-trash"
            severity="danger"
            variant="text"
            size="small"
            rounded
            :title="`Quitar ${vehiculo.patente} de esta casa`"
            :aria-label="`Quitar ${vehiculo.patente} de esta casa`"
            @click="emit('quitar-vehiculo', vehiculo)"
          />
        </div>
      </div>
    </section>

    <!-- Estacionamientos, bodegas y áreas comunes (solo lectura) -->
    <section class="flex flex-col gap-2" aria-label="Bienes vinculados a la unidad">
      <div class="flex items-center gap-2">
        <i class="pi pi-box text-primary" aria-hidden="true" />
        <h3 class="text-sm font-semibold m-0">Estacionamientos, bodegas y áreas comunes</h3>
      </div>

      <div
        v-if="!tieneBienes"
        class="text-sm text-text-subprincipal bg-inset border border-border-soft rounded-lg p-3"
      >
        Sin estacionamientos, bodegas ni áreas comunes vinculadas.
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div
          v-if="estacionamientos.length"
          class="bg-inset border border-border-soft rounded-lg p-2 flex flex-col gap-1"
        >
          <span class="text-xs font-semibold text-text-muted">Estacionamientos</span>
          <div
            v-for="e in estacionamientos"
            :key="e.id"
            class="flex items-center justify-between gap-2 text-xs"
          >
            <span class="truncate" :title="e.nombre">{{ e.nombre }}</span>
            <Tag
              :value="labelRolRecurso(e.rol)"
              severity="info"
              size="small"
            />
          </div>
        </div>

        <div
          v-if="bodegas.length"
          class="bg-inset border border-border-soft rounded-lg p-2 flex flex-col gap-1"
        >
          <span class="text-xs font-semibold text-text-muted">Bodegas</span>
          <div
            v-for="b in bodegas"
            :key="b.id"
            class="flex items-center justify-between gap-2 text-xs"
          >
            <span class="truncate" :title="b.nombre">{{ b.nombre }}</span>
            <Tag
              :value="labelRolRecurso(b.rol)"
              severity="secondary"
              size="small"
            />
          </div>
        </div>

        <div
          v-if="espacios.length"
          class="bg-inset border border-border-soft rounded-lg p-2 flex flex-col gap-1 sm:col-span-2"
        >
          <span class="text-xs font-semibold text-text-muted">Áreas comunes</span>
          <div
            v-for="a in espacios"
            :key="a.id"
            class="flex items-center justify-between gap-2 text-xs"
          >
            <span class="truncate" :title="a.nombre">{{ a.nombre }}</span>
            <Tag
              :value="labelRolRecurso(a.rol)"
              severity="secondary"
              size="small"
            />
          </div>
        </div>
      </div>
      <span class="text-[11px] text-text-subtle">
        Los estacionamientos y bodegas se asignan desde Configuración. Aquí
        solo se consultan.
      </span>
    </section>
  </div>
</template>
