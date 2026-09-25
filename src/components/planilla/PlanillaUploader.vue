<script setup>
import { ref } from "vue";
import Button from "primevue/button";
import Popover from "primevue/popover";

// Solo presenta: dropzone + plantilla + ayuda (i). Sin api directa.
// Emite: seleccionar(File), descargar, mostrar, ocultar.
defineProps({
  deshabilitado: { type: Boolean, default: false },
  enviando: { type: Boolean, default: false },
  archivoNombre: { type: String, default: "" },
  modoReedicion: { type: Boolean, default: false },
  // false en reedición hasta que el usuario pulse "Cargar desde archivo"
  visible: { type: Boolean, default: true },
});

const emit = defineEmits(["seleccionar", "descargar", "mostrar", "ocultar"]);

const formatoInfoOp = ref(null);
function toggleFormatoInfo(event) {
  formatoInfoOp.value?.toggle(event);
}

function onChange(event) {
  const file = event.target.files?.[0];
  // reset para permitir re-subir el mismo archivo (reemplazo)
  event.target.value = "";
  if (file) emit("seleccionar", file);
}
</script>

<template>
  <!-- Reedición: carga oculta por defecto -->
  <div v-if="modoReedicion && !visible" class="flex flex-wrap gap-2">
    <Button
      label="Cargar desde archivo"
      icon="pi pi-upload"
      size="small"
      variant="outlined"
      class="bg-surface text-text-muted hover:bg-primary"
      :disabled="deshabilitado"
      title="Sin permiso IMPORTACION_DATOS"
      @click="emit('mostrar')"
    />
    <Button
      label="Descargar plantilla"
      icon="pi pi-download"
      size="small"
      :disabled="deshabilitado"
      title="Sin permiso IMPORTACION_DATOS"
      @click="emit('descargar')"
    />
  </div>

  <template v-else>
    <div class="flex flex-col sm:flex-row gap-2">
      <label
        class="inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-border border-round text-sm flex-1 sm:flex-none"
        :class="[
          deshabilitado || enviando
            ? 'opacity-60 pointer-events-none bg-surface/40'
            : 'cursor-pointer bg-surface/60 hover:bg-background/95',
        ]"
        :title="deshabilitado ? 'Sin permiso IMPORTACION_DATOS' : ''"
      >
        <i class="pi pi-file-arrow-up"></i>
        <span class="truncate">{{
          archivoNombre || "Seleccionar archivo (.csv / .xlsx)"
        }}</span>
        <input
          type="file"
          accept=".csv,.xlsx"
          class="hidden"
          :disabled="deshabilitado || enviando"
          @change="onChange"
        />
      </label>
      <Button
        label="Descargar plantilla"
        icon="pi pi-download"
        size="small"
        :disabled="deshabilitado || enviando"
        :title="deshabilitado ? 'Sin permiso IMPORTACION_DATOS' : ''"
        @click="emit('descargar')"
      />
      <Button
        v-if="modoReedicion"
        label="Ocultar"
        severity="secondary"
        variant="text"
        size="small"
        @click="emit('ocultar')"
      />
    </div>
    <div class="flex items-center gap-1 text-xs text-text-muted">
      <span class="shrink-0">Máx 1000 filas. Nada se envía hasta Validar.</span>
      <Button
        icon="pi pi-info-circle"
        severity="secondary"
        text
        rounded
        size="small"
        aria-label="Ver formato esperado"
        @click="toggleFormatoInfo"
      />
    </div>
    <Popover ref="formatoInfoOp" :style="{ width: '360px', maxWidth: '92vw' }">
      <div class="flex flex-col gap-2 p-1">
        <span class="text-sm font-semibold">Formato esperado</span>
        <p class="text-xs text-text-muted m-0">
          Columnas en orden (separador <code>;</code>). Descarga la plantilla
          para evitar errores.
        </p>
        <code
          class="text-xs bg-surface border border-border p-2 border-round break-all whitespace-pre-wrap"
          >unidad;tipo_unidad;sector;nombre;email;rut;telefono;tipo_vinculo;es_residente;recibe_notificaciones;es_responsable;estacionamiento1..3;patente1..3;bodega1..3</code
        >
        <span class="text-xs text-text-muted"
          >Puedes corregir los datos en la app antes de Validar. El backend
          valida fila a fila (31 cols).</span
        >
      </div>
    </Popover>
  </template>
</template>
