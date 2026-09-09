<script setup>
import { ref } from "vue";
import { parsearCsv, normalizarFilas } from "@/utils/csvParser";
import { usePlanillaDatos } from "@/composables/usePlanillaDatos";
import { COLUMNAS_DEFAULT, clavesColumnas, filasCrudasADinamicas } from "@/data/planillaColumnas";
import PlanillaDatos from "@/components/planilla/PlanillaDatos.vue";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Message from "primevue/message";

// ─── Ejemplo demo (mismo formato persona-por-fila que la planilla) ─────────
const EJEMPLO_CSV = [
  clavesColumnas(COLUMNAS_DEFAULT).join(";"),
  "1;CASA;Sector A;Francisca Morales Díaz;francisca.morales@test.com;18.901.234-5;+56978901234;PROPIETARIO;SI;SI;SI;ABCD01;AUTO;Toyota;Corolla;Blanco;E-1;;;;;;;",
  "1;CASA;Sector A;Camila Reyes Vidal;camila.reyes@test.com;30.123.456-7;+56990123457;RESIDENTE_ADICIONAL;SI;SI;NO;;;;;;;;;;;",
  "3;CASA;Sector B;Hernán Vargas Soto;hernan.vargas@test.com;19.012.345-6;+56989012345;PROPIETARIO;SI;SI;SI;ABCD02;AUTO;Hyundai;Tucson;Gris;E-3;ABCD03;CAMIONETA;Chevrolet;Colorado;Plateado;E-2;",
  "6;CASA;Sector B;Roberto Fuentes Mora;roberto.fuentes@test.com;14.567.890-1;+56934567890;PROPIETARIO;SI;SI;SI;ABCD04;AUTO;Mazda;3;Azul;E-6;ABCD05;AUTO;Kia;Cerato;Rojo;E-6;",
].join("\n");

const nombreArchivo = ref(null);
const encabezadosFaltantes = ref([]);

const planilla = usePlanillaDatos({ cargarExistentes: true });

function procesarCsv(texto) {
  const { encabezados, filas: filasCrudas } = parsearCsv(texto);
  const claves = clavesColumnas(COLUMNAS_DEFAULT);
  encabezadosFaltantes.value = claves.filter((c) => !encabezados.includes(c));
  const filasNorm = normalizarFilas(encabezados, filasCrudas, COLUMNAS_DEFAULT);
  planilla.filas = filasCrudasADinamicas(filasNorm).map((f) => ({
    id: `csv-${Math.random().toString(36).slice(2)}`,
    ...f,
  }));
}

function cargarArchivo(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  nombreArchivo.value = file.name;
  const reader = new FileReader();
  reader.onload = () => procesarCsv(String(reader.result || ""));
  reader.readAsText(file);
}

function cargarEjemplo() {
  nombreArchivo.value = "planilla_demo.csv";
  procesarCsv(EJEMPLO_CSV);
}

function descargarPlantilla() {
  planilla.descargarPlantilla();
}

function previsualizar() {
  planilla.preview();
}

function importar() {
  planilla.ejecutar();
}
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Card>
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-upload"></i>
          <span>Importación de datos</span>
        </div>
      </template>
      <template #content>
        <p class="text-sm text-surface-400 m-0">
          Carga la planilla del condominio desde un archivo CSV o Excel, o
          regístrala manualmente con <strong>Agregar</strong>. Una fila = una
          persona vinculada a una casa, con sus vehículos y estacionamientos.
        </p>

        <div class="mt-4 flex flex-col sm:flex-row gap-2">
          <label
            class="inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-border border-round cursor-pointer bg-surface/60 hover:bg-background/95 transition-colors text-sm"
          >
            <i class="pi pi-file-arrow-up"></i>
            <span>{{ nombreArchivo || "Seleccionar archivo (.csv / .xlsx)" }}</span>
            <input type="file" accept=".csv,.xlsx" class="hidden" @change="cargarArchivo" />
          </label>
          <Button
            label="Usar ejemplo demo"
            icon="pi pi-book"
            variant="outlined"
            size="small"
            @click="cargarEjemplo"
          />
          <Button
            label="Descargar plantilla"
            icon="pi pi-download"
            variant="text"
            size="small"
            @click="descargarPlantilla"
          />
        </div>

        <div v-if="encabezadosFaltantes.length" class="mt-3">
          <Message severity="warn" :closable="false">
            Faltan columnas en el encabezado:
            {{ encabezadosFaltantes.join(", ") }}.
          </Message>
        </div>
      </template>
    </Card>

    <PlanillaDatos :planilla="planilla" @guardar="importar" />

    <Card v-if="planilla.filas.length">
      <template #content>
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <Tag :value="`${planilla.filas.length} filas`" severity="secondary" />
            <Tag :value="`${planilla.filasValidas.length} válidas`" severity="success" />
            <Tag
              v-if="planilla.filasError.length"
              :value="`${planilla.filasError.length} con error`"
              severity="danger"
            />
          </div>
          <div class="flex-1 text-sm text-surface-400">
            <template v-if="planilla.previewData">
              Previsualización: {{ planilla.previewData.filasOk }} filas OK ·
              {{ planilla.previewData.filasError }} con error ·
              {{ planilla.previewData.totalFilas - planilla.previewData.filasOk - planilla.previewData.filasError }}
              omitidas.
            </template>
            <template v-else-if="planilla.filasError.length">
              {{ planilla.filasError.length }} fila(s) con errores no se importarán.
              Corrige la planilla y vuelve a intentarlo.
            </template>
            <template v-else>
              Previsualiza la planilla antes de importar.
            </template>
          </div>
          <Button
            v-if="!planilla.previewData"
            label="Previsualizar"
            icon="pi pi-eye"
            :loading="planilla.enviando"
            :disabled="!planilla.filasValidas.length"
            @click="previsualizar"
          />
          <Button
            v-else
            :label="`Importar ${planilla.previewData.filasOk} filas`"
            icon="pi pi-check"
            :loading="planilla.enviando"
            :disabled="!planilla.previewData.filasOk"
            @click="importar"
          />
        </div>

        <Message v-if="planilla.resultado" severity="success" :closable="false" class="mt-3">
          <template #default>
            <div class="text-sm">
              <strong>Importación completada:</strong>
              {{ planilla.resultado.filasOk }} filas OK ·
              {{ planilla.resultado.filasOmitidas }} omitidas ·
              {{ planilla.resultado.filasError }} con error.
              <span class="block mt-1">
                {{ planilla.resultado.unidadesCreadas }} unidades ·
                {{ planilla.resultado.personasCreadas }} personas
                ({{ planilla.resultado.personasReutilizadas }} reutilizadas) ·
                {{ planilla.resultado.vinculosCreados }} vínculos ·
                {{ planilla.resultado.vehiculosCreados }} vehículos ·
                {{ planilla.resultado.estacionamientosVinculados }} estacionamientos ·
                {{ planilla.resultado.bodegasVinculadas }} bodegas.
              </span>
              <span v-if="planilla.resultado.errores?.length" class="block mt-1 text-danger">
                <span v-for="(e, i) in planilla.resultado.errores" :key="i" class="block">
                  Fila {{ e.numeroFila }}: {{ e.mensaje }}
                </span>
              </span>
            </div>
          </template>
        </Message>
      </template>
    </Card>
  </div>
</template>