<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { usePlanillaDatos } from "@/composables/usePlanillaDatos";
import PlanillaDatos from "@/components/planilla/PlanillaDatos.vue";
import PlanillaUploader from "@/components/planilla/PlanillaUploader.vue";
import PlanillaStagedPreview from "@/components/planilla/PlanillaStagedPreview.vue";
import PlanillaPermisoAviso from "@/components/planilla/PlanillaPermisoAviso.vue";
import PlanillaResultado from "@/components/planilla/PlanillaResultado.vue";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";

const emit = defineEmits(["actualizado"]);

const auth = useAuthStore();
const planilla = usePlanillaDatos({ cargarExistentes: true });

const tienePermisoImportacion = computed(() =>
  auth.permisos?.includes("IMPORTACION_DATOS"),
);
const sinPermiso = computed(() => !tienePermisoImportacion.value);

const mostrarCargaArchivo = ref(false);

// F4: el dropzone se muestra en setup inicial o al habilitarlo / staged / review.
const puedeMostrarDropzone = computed(
  () =>
    !planilla.modoReedicion ||
    mostrarCargaArchivo.value ||
    planilla.fase === "STAGED" ||
    planilla.fase === "REVIEW",
);

// Staging/review reemplazan la tabla manual para no mezclar fuentes.
const mostrarStaging = computed(
  () => planilla.fase === "STAGED" || planilla.fase === "REVIEW",
);

async function guardar() {
  await planilla.enviar();
  if (planilla.resultado) emit("actualizado");
}

async function validar() {
  await planilla.validarStaging();
}

async function importar() {
  await planilla.ejecutar();
  if (planilla.resultado) {
    emit("actualizado");
    mostrarCargaArchivo.value = false;
  }
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

      <PlanillaPermisoAviso
        v-if="sinPermiso"
        :rol="auth.condominioActualRol || auth.userRole"
        :cargo="auth.condominioActualCargo"
      />

      <div class="mt-4 flex flex-col gap-3">
        <Message
          v-if="planilla.modoReedicion && !puedeMostrarDropzone"
          severity="info"
          :closable="false"
          class="m-0"
        >
          La carga masiva por archivo está disponible solo en la configuración
          inicial. El condominio ya tiene integrantes registrados — usa
          <strong>Editar</strong> en la tabla para cambios puntuales. Si
          necesitas reimportar, habilita la carga con el botón.
        </Message>

        <PlanillaUploader
          :deshabilitado="sinPermiso"
          :enviando="planilla.enviando"
          :archivo-nombre="planilla.archivoNombre"
          :modo-reedicion="planilla.modoReedicion"
          :visible="puedeMostrarDropzone"
          @seleccionar="planilla.cargarStaging"
          @descargar="planilla.descargarPlantilla()"
          @mostrar="mostrarCargaArchivo = true"
          @ocultar="mostrarCargaArchivo = false"
        />

        <Message
          v-if="planilla.enviando && planilla.fase === 'VALIDANDO' && planilla.archivoNombre"
          severity="info"
          :closable="false"
          class="m-0"
        >
          <span class="flex items-center gap-2">
            <i class="pi pi-spin pi-spinner" />
            Validando archivo "{{ planilla.archivoNombre }}"… Esto puede tardar unos segundos con archivos grandes.
          </span>
        </Message>
        <Skeleton v-if="planilla.enviando && planilla.fase === 'VALIDANDO' && planilla.archivoNombre" width="100%" height="220px" class="mt-2" />

        <Message v-if="planilla.error" severity="error" :closable="false" class="m-0">
          {{ planilla.error }}
        </Message>

        <PlanillaStagedPreview
          v-if="mostrarStaging"
          :staging="planilla.previewFilasRaw || []"
          :archivo-pendiente-nombre="planilla.archivoPendiente?.name || ''"
          :preview-data="planilla.previewData"
          :archivo-nombre="planilla.archivoNombre"
          :enviando="planilla.enviando"
          :deshabilitado="sinPermiso"
          :importado="!!planilla.resultado"
          @validar="validar"
          @importar="importar"
          @descartar="planilla.descartarPreviewArchivo()"
          @quitar-fila="planilla.quitarStagingFila"
          @agregar-vehiculo="planilla.agregarStagingVehiculo"
          @quitar-vehiculo="planilla.quitarStagingVehiculo"
          @agregar-bodega="planilla.agregarStagingBodega"
          @quitar-bodega="planilla.quitarStagingBodega"
        />
      </div>

      <template v-if="!mostrarStaging">
        <div class="mt-3 flex flex-wrap gap-2">
          <Tag :value="`${planilla.filas.length} filas`" severity="secondary" size="small" />
          <Tag :value="`${planilla.filasValidas.length} válidas`" severity="success" size="small" />
          <Tag
            v-if="planilla.filasError.length"
            :value="`${planilla.filasError.length} con error`"
            severity="danger"
            size="small"
          />
        </div>

        <div class="mt-3">
          <PlanillaDatos :planilla="planilla" solo-unidades-existentes @guardar="guardar" />
        </div>

        <div class="mt-4 flex justify-between items-center gap-2">
          <Button
            v-if="planilla.filas.length"
            label="Limpiar todo"
            icon="pi pi-trash"
            severity="secondary"
            variant="text"
            size="small"
            :disabled="planilla.enviando"
            @click="planilla.limpiarTodo()"
          />
          <span v-else></span>
          <Button
            label="Guardar planilla"
            icon="pi pi-save"
            :loading="planilla.enviando"
            :disabled="sinPermiso || !planilla.hayCambios"
            :title="sinPermiso ? 'Sin permiso IMPORTACION_DATOS' : ''"
            @click="guardar"
          />
        </div>
      </template>
      <p v-else class="text-xs text-text-muted mt-2 m-0">
        Revisa el borrador o el preview arriba. Descártalo para volver a la edición manual.
      </p>

      <PlanillaResultado
        :resultado="planilla.resultado"
        :preview-filas-error="planilla.previewData ? planilla.previewData.filasError : null"
      />
    </template>
  </Card>
</template>
