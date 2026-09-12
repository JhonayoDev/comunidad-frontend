<script setup>
import { ref, computed, onMounted } from "vue";
import { usePlanillaDatos } from "@/composables/usePlanillaDatos";
import PlanillaDatos from "@/components/planilla/PlanillaDatos.vue";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Message from "primevue/message";

const emit = defineEmits(["actualizado"]);

const planilla = usePlanillaDatos({ cargarExistentes: true });

const mostrarCargaArchivo = ref(false);

const puedeMostrarDropzone = computed(
  () => !planilla.modoReedicion || mostrarCargaArchivo.value || planilla.previewData,
);

const previewOmitidas = computed(() => {
  if (!planilla.previewData) return 0;
  const d = planilla.previewData;
  return Math.max(0, (d.totalFilas ?? 0) - (d.filasOk ?? 0) - (d.filasError ?? 0));
});

const previewErrores = computed(() => {
  if (!planilla.previewData?.filas) return [];
  return planilla.previewData.filas.filter((f) => f.estado === "ERROR");
});

async function guardar() {
  await planilla.enviar();
  if (planilla.resultado) {
    emit("actualizado");
  }
}

function onArchivoSeleccionado(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  planilla.previewArchivo(file);
  // reset input para permitir re-subir el mismo archivo (reemplazo)
  event.target.value = "";
}

async function importarArchivo() {
  await planilla.ejecutar();
  if (planilla.resultado) {
    emit("actualizado");
    mostrarCargaArchivo.value = false;
  }
}

function descartarArchivo() {
  planilla.descartarPreviewArchivo();
}

function descargarPlantilla() {
  planilla.descargarPlantilla();
}

onMounted(() => planilla.cargar());
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-users"></i>
        <span>Paso 6 · Planilla de integrantes</span>
      </div>
    </template>
    <template #content>
      <p class="text-sm text-text-muted m-0">
        Registra los integrantes de cada casa: nombre, email, vínculo
        (propietario/arrendatario/residente adicional), responsable de
        comunicaciones y sus vehículos con estacionamientos. Una fila = una
        persona. Puedes cargar un archivo o completar la tabla manualmente.
      </p>

      <!-- Bloque carga desde archivo — modelo staged Microsoft/Meta -->
      <div class="mt-4 flex flex-col gap-3">
        <!-- Estado reedición: dropzone oculto por defecto -->
        <Message
          v-if="planilla.modoReedicion && !puedeMostrarDropzone"
          severity="info"
          :closable="false"
          class="m-0"
        >
          La carga masiva por archivo está disponible solo en la configuración
          inicial. El condominio ya tiene integrantes registrados — usa
          <strong>Editar</strong> en la tabla para cambios puntuales. Si necesitas
          reimportar, habilita la carga con el botón.
        </Message>

        <div
          v-if="planilla.modoReedicion && !puedeMostrarDropzone"
          class="flex flex-wrap gap-2"
        >
          <Button
            label="Cargar desde archivo"
            icon="pi pi-upload"
            size="small"
            variant="outlined"
            @click="mostrarCargaArchivo = true"
          />
          <Button
            label="Descargar plantilla"
            icon="pi pi-download"
            size="small"
            variant="text"
            @click="descargarPlantilla"
          />
        </div>

        <!-- Dropzone + descargar plantilla (visible en setup inicial o tras habilitar) -->
        <template v-if="puedeMostrarDropzone">
          <div class="flex flex-col sm:flex-row gap-2">
            <label
              class="inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-border border-round cursor-pointer bg-surface/60 hover:bg-background/95 transition-colors text-sm flex-1 sm:flex-none"
              :class="planilla.enviando ? 'opacity-60 pointer-events-none' : ''"
            >
              <i class="pi pi-file-arrow-up"></i>
              <span class="truncate">{{
                planilla.archivoNombre || "Seleccionar archivo (.csv / .xlsx)"
              }}</span>
              <input
                type="file"
                accept=".csv,.xlsx"
                class="hidden"
                :disabled="planilla.enviando"
                @change="onArchivoSeleccionado"
              />
            </label>
            <Button
              label="Descargar plantilla"
              icon="pi pi-download"
              variant="text"
              size="small"
              :disabled="planilla.enviando"
              @click="descargarPlantilla"
            />
            <Button
              v-if="planilla.modoReedicion"
              label="Ocultar"
              severity="secondary"
              variant="text"
              size="small"
              @click="mostrarCargaArchivo = false"
            />
          </div>
          <p class="text-xs text-text-muted m-0">
            Formato esperado: columnas
            <code>unidad;tipo_unidad;sector;nombre;email;rut;telefono;tipo_vinculo;es_ocupante;recibe_notificaciones;es_responsable;patente1..3;est1..3;bodega1..3</code>.
            Descarga la plantilla para evitar errores de formato. Máx 1000 filas.
            Re-subir reemplaza el preview anterior.
          </p>
        </template>

        <!-- Error de archivo -->
        <Message v-if="planilla.error && planilla.archivoNombre" severity="error" :closable="false" class="m-0">
          {{ planilla.error }}
        </Message>

        <!-- Preview staged (Microsoft/Meta): resumen + detalle por fila -->
        <Card v-if="planilla.previewData" class="border border-primary/20">
          <template #title>
            <div class="flex items-center gap-2 text-sm">
              <i class="pi pi-eye"></i>
              <span>Previsualización del archivo</span>
              <Tag
                v-if="planilla.archivoNombre"
                :value="planilla.archivoNombre"
                severity="secondary"
                size="small"
              />
            </div>
          </template>
          <template #content>
            <div class="flex flex-wrap gap-2 mb-3">
              <Tag :value="`${planilla.previewData.totalFilas} filas`" severity="secondary" size="small" />
              <Tag :value="`${planilla.previewData.filasOk} OK`" severity="success" size="small" />
              <Tag
                v-if="planilla.previewData.filasError"
                :value="`${planilla.previewData.filasError} con error`"
                severity="danger"
                size="small"
              />
              <Tag
                v-if="previewOmitidas"
                :value="`${previewOmitidas} omitidas`"
                severity="warn"
                size="small"
              />
            </div>

            <Message
              v-if="(planilla.previewData.encabezadosFaltantes || []).length"
              severity="warn"
              :closable="false"
              class="m-0 mb-3"
            >
              Faltan columnas requeridas: {{ planilla.previewData.encabezadosFaltantes.join(", ") }}.
              Descarga la plantilla y completa los encabezados.
            </Message>

            <div v-if="previewErrores.length" class="mb-3">
              <p class="text-sm font-semibold m-0 mb-1">Filas con error (corrige el archivo y vuelve a cargarlo):</p>
              <ul class="m-0 pl-4 text-sm text-danger max-h-40 overflow-auto">
                <li v-for="(f, i) in previewErrores" :key="i">
                  Fila {{ f.numeroFila }} ({{ f.unidad || "—" }} · {{ f.personaNombre || f.email || "—" }}):
                  {{ (f.errores || []).join("; ") }}
                </li>
              </ul>
            </div>

            <div
              v-if="(planilla.previewData.filas || []).length"
              class="max-h-64 overflow-auto border border-border border-round"
            >
              <table class="w-full text-sm">
                <thead class="sticky top-0 bg-surface">
                  <tr>
                    <th class="text-left p-2">#</th>
                    <th class="text-left p-2">Casa</th>
                    <th class="text-left p-2">Nombre</th>
                    <th class="text-left p-2">Email</th>
                    <th class="text-left p-2">Vínculo</th>
                    <th class="text-left p-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="f in planilla.previewData.filas"
                    :key="f.numeroFila"
                    class="border-t border-border"
                    :class="{
                      'bg-green-50': f.estado === 'OK',
                      'bg-red-50': f.estado === 'ERROR',
                      'bg-amber-50': f.estado === 'OMITIDA',
                    }"
                  >
                    <td class="p-2">{{ f.numeroFila }}</td>
                    <td class="p-2">{{ f.unidad || "—" }}</td>
                    <td class="p-2">{{ f.personaNombre || "—" }}</td>
                    <td class="p-2 truncate max-w-32">{{ f.email || "—" }}</td>
                    <td class="p-2">{{ f.tipoVinculo || "—" }}</td>
                    <td class="p-2">
                      <Tag
                        :value="f.estado"
                        :severity="f.estado === 'OK' ? 'success' : f.estado === 'ERROR' ? 'danger' : 'warn'"
                        size="small"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-3 flex flex-wrap gap-2 justify-end">
              <Button
                label="Descartar"
                icon="pi pi-times"
                severity="secondary"
                size="small"
                variant="outlined"
                :disabled="planilla.enviando"
                @click="descartarArchivo"
              />
              <Button
                :label="`Importar ${planilla.previewData.filasOk} filas`"
                icon="pi pi-check"
                size="small"
                :loading="planilla.enviando"
                :disabled="!planilla.previewData.filasOk"
                @click="importarArchivo"
              />
            </div>
          </template>
        </Card>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <Tag :value="`${planilla.filas.length} filas`" severity="secondary" size="small" />
        <Tag
          :value="`${planilla.filasValidas.length} válidas`"
          severity="success"
          size="small"
        />
        <Tag
          v-if="planilla.filasError.length"
          :value="`${planilla.filasError.length} con error`"
          severity="danger"
          size="small"
        />
      </div>

      <!-- Tabla manual — oculta mientras hay preview staged para evitar confusión -->
      <div v-if="!planilla.previewData" class="mt-3">
        <PlanillaDatos :planilla="planilla" solo-unidades-existentes @guardar="guardar" />
      </div>
      <p v-else class="text-xs text-text-muted mt-2 m-0">
        Revisa el preview del archivo arriba. Descártalo para volver a la edición manual.
      </p>

      <div v-if="!planilla.previewData" class="mt-4 flex justify-end">
        <Button
          label="Guardar planilla"
          icon="pi pi-save"
          :loading="planilla.enviando"
          :disabled="!planilla.hayCambios"
          @click="guardar"
        />
      </div>

      <p v-if="planilla.resultado" class="text-sm text-green-500 mt-2 m-0">
        Planilla guardada: {{ planilla.resultado.filasOk ?? planilla.resultado.creadas }} filas
        nuevas · {{ planilla.resultado.actualizadas }} actualizadas ·
        {{ planilla.resultado.eliminadas }} eliminadas ·
        {{ planilla.resultado.personasCreadas ?? 0 }} personas ·
        {{ planilla.resultado.vinculosCreados ?? 0 }} vínculos ·
        {{ planilla.resultado.vehiculosCreados ?? 0 }} vehículos ·
        {{ planilla.resultado.estacionamientosVinculados ?? 0 }} estacionamientos ·
        {{ planilla.resultado.bodegasVinculadas ?? 0 }} bodegas. Paso completado.
      </p>
      <p v-else-if="planilla.previewData" class="text-sm text-amber-500 mt-2 m-0">
        La previsualización detectó {{ planilla.previewData.filasError }} fila(s) con
        error. Corrige el archivo y vuelve a cargarlo, o descártalo para editar manualmente.
      </p>
    </template>
  </Card>
</template>
