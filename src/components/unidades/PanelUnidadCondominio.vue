<script setup>
import { computed } from "vue";
import Tag from "primevue/tag";
import { esEstacionamientoVisita } from "@/data/planillaColumnas";
import {
  labelRolRecurso,
  labelTipoUnidad,
  recursosDeUnidad,
} from "@/utils/unidadesConsulta";

const props = defineProps({
  unidad: { type: Object, default: null },
  recursos: { type: Object, default: null },
});

const recursos = computed(
  () =>
    props.recursos ||
    recursosDeUnidad({ porUnidad: {} }, props.unidad?.id),
);

const estacionamientos = computed(() => recursos.value.estacionamientos || []);
const visitas = computed(() =>
  estacionamientos.value.filter((e) => esEstacionamientoVisita(e.nombre)),
);
const otrosEstacionamientos = computed(() =>
  estacionamientos.value.filter((e) => !esEstacionamientoVisita(e.nombre)),
);
const bodegas = computed(() => recursos.value.bodegas || []);
const espacios = computed(() => recursos.value.espacios || []);
</script>

<template>
  <section
    v-if="unidad"
    class="bg-surface border border-border rounded-lg p-3 flex flex-col gap-3"
    aria-label="Bienes comunes del condominio"
  >
    <div class="flex flex-wrap items-center gap-2">
      <i class="pi pi-building text-primary" aria-hidden="true" />
      <h2 class="text-sm font-semibold m-0">
        {{ unidad.numero || "Condominio" }}
      </h2>
      <Tag value="Bienes comunes" severity="secondary" size="small" />
      <span class="text-xs text-text-muted">
        {{ labelTipoUnidad(unidad.tipo) }} · solo lectura
      </span>
    </div>

    <p class="text-xs text-text-muted m-0">
      No es una vivienda: agrupa los estacionamientos de visita, bodegas y
      áreas comunes del condominio. Se administra desde el wizard de
      configuración.
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="bg-inset border border-border-soft rounded-lg p-2 flex flex-col gap-1">
        <span class="text-xs font-semibold text-text-muted">
          Estacionamientos de visita
        </span>
        <div v-if="visitas.length" class="flex flex-wrap gap-1">
          <Tag
            v-for="e in visitas"
            :key="e.id"
            :value="e.nombre"
            severity="info"
            size="small"
          />
        </div>
        <span v-else class="text-xs text-text-subprincipal">—</span>
        <div
          v-if="otrosEstacionamientos.length"
          class="flex flex-wrap items-center gap-1"
        >
          <span class="text-[11px] text-text-subtle">Otros:</span>
          <Tag
            v-for="e in otrosEstacionamientos"
            :key="e.id"
            :value="e.nombre"
            severity="secondary"
            size="small"
          />
        </div>
        <span class="text-[11px] text-text-subtle">
          Prefijo EV- · no se asignan a casas
        </span>
      </div>

      <div class="bg-inset border border-border-soft rounded-lg p-2 flex flex-col gap-1">
        <span class="text-xs font-semibold text-text-muted">Bodegas</span>
        <div v-if="bodegas.length" class="flex flex-wrap gap-1">
          <Tag
            v-for="b in bodegas"
            :key="b.id"
            :value="b.nombre"
            severity="secondary"
            size="small"
          />
        </div>
        <span v-else class="text-xs text-text-subprincipal">—</span>
      </div>

      <div class="bg-inset border border-border-soft rounded-lg p-2 flex flex-col gap-1">
        <span class="text-xs font-semibold text-text-muted">Áreas comunes</span>
        <div v-if="espacios.length" class="flex flex-col gap-1">
          <div
            v-for="a in espacios"
            :key="a.id"
            class="flex items-center justify-between gap-2 text-xs"
          >
            <span class="truncate" :title="a.nombre">{{ a.nombre }}</span>
            <span class="text-text-muted shrink-0">{{ a.rol ? labelRolRecurso(a.rol) : "" }}</span>
          </div>
        </div>
        <span v-else class="text-xs text-text-subprincipal">—</span>
      </div>
    </div>
  </section>
</template>
