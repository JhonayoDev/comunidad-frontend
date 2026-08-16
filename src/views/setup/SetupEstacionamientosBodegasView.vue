<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useSetupConfiguracion, SETUP_PASOS } from "@/composables/useSetupConfiguracion";
import SetupEntidadesView from "./SetupEntidadesView.vue";

import Card from "primevue/card";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";

const emit = defineEmits(["actualizado"]);

const { cargando, error, capacidad, cargar } = useSetupConfiguracion();

const pasoNumero = computed(
  () => SETUP_PASOS.findIndex((p) => p.key === "estacionamientos-bodegas") + 1,
);

function aplica(tipo) {
  const cap = capacidad.value;
  if (!cap) return true; // sin datos de capacidad → mostrar la pestaña
  const c = tipo === "estacionamiento" ? cap.capacidadEstacionamientos : cap.capacidadBodegas;
  const t = tipo === "estacionamiento" ? cap.totalEstacionamientos : cap.totalBodegas;
  return (c ?? 0) > 0 || (t ?? 0) > 0;
}

const tabs = computed(() => [
  { key: "estacionamiento", label: "Estacionamientos", icon: "pi pi-car", visible: aplica("estacionamiento") },
  { key: "bodega", label: "Bodegas", icon: "pi pi-box", visible: aplica("bodega") },
]);

const tabsVisibles = computed(() => tabs.value.filter((t) => t.visible));

const tabActivo = ref("estacionamiento");

watch(tabsVisibles, (vis) => {
  if (vis.length && !vis.some((t) => t.key === tabActivo.value)) {
    tabActivo.value = vis[0].key;
  }
});

function recargar() {
  cargar();
  emit("actualizado");
}

onMounted(cargar);
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-car"></i>
        <span>Paso {{ pasoNumero }} · Estacionamientos y bodegas</span>
      </div>
    </template>
    <template #content>
      <p class="text-sm text-surface-400 m-0">
        Crea los estacionamientos y bodegas del condominio. Solo se muestran las
        entidades declaradas en la capacidad. Los estacionamientos/bodegas pueden
        tener sectores propios (se crean aquí si los necesitas).
      </p>

      <Skeleton v-if="cargando" width="100%" height="200px" class="mt-3" />
      <Message v-else-if="error" severity="error" class="mt-3">{{ error }}</Message>

      <template v-else>
        <div v-if="tabsVisibles.length" class="mt-4 flex gap-2">
          <button
            v-for="t in tabsVisibles"
            :key="t.key"
            type="button"
            class="flex-1 flex items-center justify-center gap-2 p-3 border-round text-sm font-medium transition-colors"
            :class="
              tabActivo === t.key
                ? 'bg-primary text-white'
                : 'bg-surface border border-border hover:bg-emphasis'
            "
            @click="tabActivo = t.key"
          >
            <i :class="t.icon"></i>
            <span>{{ t.label }}</span>
          </button>
        </div>
        <Message v-else severity="info" :closable="false" class="mt-3">
          No hay estacionamientos ni bodegas declarados para este condominio.
        </Message>

        <div v-if="tabActivo === 'estacionamiento' && aplica('estacionamiento')" class="mt-4">
          <SetupEntidadesView entidad="estacionamiento" @actualizado="recargar" />
        </div>
        <div v-else-if="tabActivo === 'bodega' && aplica('bodega')" class="mt-4">
          <SetupEntidadesView entidad="bodega" @actualizado="recargar" />
        </div>
      </template>
    </template>
  </Card>
</template>