<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { adminService } from "@/services/adminService";

import Card from "primevue/card";
import Button from "primevue/button";
import ToggleSwitch from "primevue/toggleswitch";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref(null);
const modulos = ref([]);
const enviando = ref(false);
const mensajeOk = ref("");

const moduloLabels = {
  FINANZAS: { label: "Finanzas", icon: "pi pi-chart-line" },
  ENCOMIENDAS: { label: "Encomiendas", icon: "pi pi-box" },
  BITACORA: { label: "Bitácora", icon: "pi pi-book" },
  STORAGE: { label: "Almacenamiento", icon: "pi pi-folder" },
  CASOS: { label: "Casos / Reclamos", icon: "pi pi-file" },
  CONTROL_ACCESO: { label: "Control de Acceso", icon: "pi pi-shield" },
  GASTOS_COMUNES: { label: "Gastos Comunes", icon: "pi pi-calendar" },
  COMUNICACION: { label: "Comunicación", icon: "pi pi-megaphone" },
};

async function cargar() {
  const cid = route.params.id;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await adminService.listarModulos(cid);
    modulos.value = data || [];
  } catch (e) {
    console.error("Error al cargar módulos", e);
    error.value = "No se pudieron cargar los módulos";
  } finally {
    loading.value = false;
  }
}

async function guardar() {
  const cid = route.params.id;
  enviando.value = true;
  mensajeOk.value = "";
  try {
    const habilitados = modulos.value.filter((m) => m.habilitado).map((m) => m.moduloCodigo);
    await adminService.actualizarModulos(cid, { habilitados });
    mensajeOk.value = "Módulos actualizados correctamente";
    await cargar();
  } catch (e) {
    console.error("Error al guardar módulos", e);
    error.value = "Error al guardar la configuración";
  } finally {
    enviando.value = false;
  }
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Button label="← Volver" size="small" variant="text" icon="pi pi-arrow-left" @click="router.push({ name: 'SaasCondominioDetail', params: { id: route.params.id } })" />
    <h1 class="text-xl font-bold m-0">Módulos del condominio</h1>

    <Skeleton v-if="loading" width="100%" height="200px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>
    <Message v-if="mensajeOk" severity="success" :closable="true">{{ mensajeOk }}</Message>

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card v-for="m in modulos" :key="m.moduloCodigo">
          <template #content>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i :class="moduloLabels[m.moduloCodigo]?.icon || 'pi pi-cog'" class="text-primary text-xl"></i>
                <span class="font-medium text-sm">{{ moduloLabels[m.moduloCodigo]?.label || m.moduloCodigo }}</span>
              </div>
              <ToggleSwitch v-model="m.habilitado" />
            </div>
          </template>
        </Card>
      </div>
      <Button label="Guardar cambios" icon="pi pi-check" :loading="enviando" class="self-start" @click="guardar" />
    </template>
  </div>
</template>
