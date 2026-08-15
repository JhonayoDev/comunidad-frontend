<script setup>
import { onMounted } from "vue";
import { usePlanillaDatos } from "@/composables/usePlanillaDatos";
import PlanillaDatos from "@/components/planilla/PlanillaDatos.vue";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";

const emit = defineEmits(["actualizado"]);

const planilla = usePlanillaDatos({ cargarExistentes: true });

async function guardar() {
  await planilla.enviar();
  if (planilla.resultado && !planilla.filasError.length) {
    emit("actualizado");
  }
}

onMounted(() => planilla.cargar());
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-users"></i>
        <span>Paso 2 · Planilla de integrantes</span>
      </div>
    </template>
    <template #content>
      <p class="text-sm text-surface-400 m-0">
        Registra los integrantes de cada casa: nombre, email, vínculo
        (propietario/arrendatario/residente adicional), responsable de
        comunicaciones y sus vehículos con estacionamientos. Una fila = una
        persona.
      </p>

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

      <div class="mt-3">
        <PlanillaDatos :planilla="planilla" @guardar="guardar" />
      </div>

      <div class="mt-4 flex justify-end">
        <Button
          label="Guardar planilla"
          icon="pi pi-save"
          :loading="planilla.enviando"
          :disabled="!planilla.filasValidas.length"
          @click="guardar"
        />
      </div>

      <p v-if="planilla.resultado" class="text-sm text-green-500 mt-2 m-0">
        Planilla guardada ({{ planilla.resultado.filasOk }} filas). Paso
        completado.
      </p>
    </template>
  </Card>
</template>