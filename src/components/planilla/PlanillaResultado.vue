<script setup>
import { ref } from "vue";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Message from "primevue/message";
import { useFiltroFilas, FILTROS_FILA } from "@/composables/useFiltroFilas";
import {
  vehiculosResumen,
  bodegasResumen,
  estacionamientosResumen,
} from "@/utils/planillaResumen";
import PlanillaFilaDetalle from "@/components/planilla/PlanillaFilaDetalle.vue";

// Presenta el resultado del guardar/importar + (FE-3) las filas del preview
// preservadas para filtrar. Sin api directa: exportar se delega al padre.
const props = defineProps({
  resultado: { type: Object, default: null },
  previewFilasError: { type: Number, default: null },
  // FE-3: filas del preview (FilaPreview[]) conservadas al ejecutar.
  filas: { type: Array, default: null },
  // FE-4: descarga del CSV (BE-3). Solo si hay importacionId.
  exportando: { type: Boolean, default: false },
  errorExportacion: { type: String, default: null },
});

const emit = defineEmits(["exportar", "corregir"]);

// FE-3: mismo filtro client-side del preview (estado independiente).
const { filtro, conteos, filasFiltradas, setFiltro } = useFiltroFilas(
  () => props.filas || [],
);

// FE-2/FE-3: expand de filas del resultado (independiente del filtro).
const filasExpandidas = ref(new Set());

function tieneDetalle(f) {
  return (f?.errores || []).length > 0 || (f?.advertencias || []).length > 0;
}

function alternarDetalle(numeroFila) {
  const s = new Set(filasExpandidas.value);
  if (s.has(numeroFila)) s.delete(numeroFila);
  else s.add(numeroFila);
  filasExpandidas.value = s;
}
</script>

<template>
  <p v-if="resultado" class="text-sm text-green-500 mt-2 m-0">
    Planilla guardada:
    {{ resultado.filasOk ?? resultado.creadas }} filas
    nuevas · {{ resultado.actualizadas }} actualizadas ·
    {{ resultado.eliminadas }} eliminadas ·
    {{ resultado.personasCreadas ?? 0 }} personas ·
    {{ resultado.vinculosCreados ?? 0 }} vínculos ·
    {{ resultado.vehiculosCreados ?? 0 }} vehículos ·
    {{ resultado.estacionamientosVinculados ?? 0 }}
    estacionamientos ·
    {{ resultado.bodegasVinculadas ?? 0 }} bodegas. Paso
    completado.
    <span v-if="resultado.errores?.length" class="block mt-1">
      <Button
        :label="
          filasExpandidas.has('__errores')
            ? `Ocultar ${resultado.errores.length} errores`
            : `Ver ${resultado.errores.length} errores`
        "
        :icon="filasExpandidas.has('__errores') ? 'pi pi-eye-slash' : 'pi pi-eye'"
        variant="text"
        severity="danger"
        size="small"
        @click="alternarDetalle('__errores')"
      />
      <span v-show="filasExpandidas.has('__errores')">
        <span
          v-for="(e, i) in resultado.errores"
          :key="i"
          class="block text-danger"
        >
          Fila {{ e.numeroFila }}: {{ e.mensaje }}
        </span>
      </span>
    </span>
  </p>
  <div v-if="resultado?.importacionId" class="mt-2">
    <Button
      label="Exportar resultado CSV"
      icon="pi pi-download"
      variant="outlined"
      size="small"
      :loading="exportando"
      :disabled="exportando"
      @click="emit('exportar')"
    />
    <Message v-if="errorExportacion" severity="error" :closable="false" class="mt-2">
      {{ errorExportacion }}
    </Message>
  </div>
  <div v-if="(filas || []).length" class="mt-3">
    <div class="flex flex-wrap gap-2 mb-2">
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
    <div v-if="filasFiltradas.length" class="flex flex-col gap-1 max-h-80 overflow-auto">
      <div
        v-for="f in filasFiltradas"
        :key="f.numeroFila"
        class="p-2 border border-border border-round"
      >
        <button
          type="button"
          class="flex items-center gap-2 w-full text-left text-sm"
          @click="tieneDetalle(f) && alternarDetalle(f.numeroFila)"
        >
          <span class="font-semibold">#{{ f.numeroFila }}</span>
          <span>{{ f.unidad || "—" }} · {{ f.personaNombre || f.personaEmail || "—" }}</span>
          <Tag
            :value="f.estado"
            :severity="f.estado === 'OK' ? 'success' : f.estado === 'ERROR' ? 'danger' : 'warn'"
            size="small"
            class="ml-auto"
          />
          <i
            v-if="tieneDetalle(f)"
            class="pi text-xs"
            :class="filasExpandidas.has(f.numeroFila) ? 'pi-eye-slash' : 'pi-eye'"
          />
        </button>
        <PlanillaFilaDetalle
          v-if="filasExpandidas.has(f.numeroFila)"
          :errores="f.errores || []"
          :advertencias="f.advertencias || []"
          :vehiculos-txt="vehiculosResumen(f)"
          :estacionamientos-txt="estacionamientosResumen(f)"
          :bodegas-txt="bodegasResumen(f)"
          :es-adicional="f.tipoVinculo === 'RESIDENTE_ADICIONAL'"
          corregible
          @corregir="emit('corregir', { email: f.personaEmail || f.email, unidad: f.unidad })"
        />
      </div>
    </div>
    <p v-else class="text-sm text-text-muted m-0">Sin filas para este filtro.</p>
  </div>
  <p v-else-if="previewFilasError !== null" class="text-sm text-amber-500 mt-2 m-0">
    La previsualización detectó {{ previewFilasError }} fila(s) con
    error. Vuelve a editar o corrige el archivo.
  </p>
</template>
