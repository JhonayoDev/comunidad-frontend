<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { adminService } from "@/services/adminService";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref(null);
const tareas = ref([]);
const enviando = ref(null);

const tareaLabels = {
  CONFIGURAR_STORAGE: "Configurar almacenamiento",
  ASIGNAR_ADMIN: "Asignar administrador",
  CREAR_UNIDADES: "Crear unidades",
  CONFIGURAR_PLANTILLAS: "Configurar plantillas",
};

async function cargar() {
  const cid = route.params.id;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await adminService.listarOnboarding(cid);
    tareas.value = data || [];
  } catch (e) {
    console.error("Error al cargar onboarding", e);
    error.value = "No se pudo cargar el progreso de onboarding";
  } finally {
    loading.value = false;
  }
}

async function completar(codigo) {
  enviando.value = codigo;
  try {
    await adminService.completarTareaOnboarding(route.params.id, codigo);
    await cargar();
  } catch (e) {
    console.error("Error al completar tarea", e);
  } finally {
    enviando.value = null;
  }
}

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Button label="← Volver" size="small" variant="text" icon="pi pi-arrow-left" @click="router.push({ name: 'SaasCondominioDetail', params: { id: route.params.id } })" />
    <h1 class="text-xl font-bold m-0">Onboarding</h1>

    <Skeleton v-if="loading" width="100%" height="200px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!tareas.length" class="text-center text-surface-400 py-8">No hay tareas de onboarding</div>
      <div v-else class="flex flex-col gap-2">
        <Card v-for="t in tareas" :key="t.id">
          <template #content>
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <i :class="t.completada ? 'pi pi-check-circle text-green-500' : 'pi pi-circle text-surface-300'" class="text-xl"></i>
                <div>
                  <span class="font-medium text-sm">{{ tareaLabels[t.tareaCodigo] || t.tareaCodigo }}</span>
                  <div v-if="t.completada" class="text-xs text-green-600">Completada {{ formatFecha(t.completadaEn) }}</div>
                  <div v-else class="text-xs text-surface-400">Pendiente</div>
                </div>
              </div>
              <Button
                v-if="!t.completada"
                label="Completar"
                size="small"
                icon="pi pi-check"
                :loading="enviando === t.tareaCodigo"
                @click="completar(t.tareaCodigo)"
              />
            </div>
          </template>
        </Card>
      </div>
    </template>
  </div>
</template>
