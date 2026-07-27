<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useVisitas } from "../../composables/useVisitas";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";

const router = useRouter();

const { visitas, loading, error, cargar, registrarSalida } = useVisitas();

const filtros = ref({ patente: "", nombre: "", estado: "ACTIVO" });

const estadosFiltro = [
  { label: "Todas", value: "" },
  { label: "Activas", value: "ACTIVO" },
  { label: "Con salida", value: "FINALIZADO" },
];

let timeout = null;
function buscar() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    const params = {};
    if (filtros.value.patente) params.patente = filtros.value.patente;
    if (filtros.value.nombre) params.nombre = filtros.value.nombre;
    if (filtros.value.estado !== "") params.estado = filtros.value.estado;
    cargar(params);
  }, 400);
}

async function handleSalida(visita) {
  const resultado = await registrarSalida(visita);
  if (resultado !== true) alert(resultado);
}

function limpiarFiltros() {
  filtros.value = { patente: "", nombre: "", estado: "ACTIVO" };
  cargar({ estado: "ACTIVO" });
}

function formatFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function estadoSeverity(e) {
  return e === "ACTIVO" ? "success" : "info";
}

onMounted(() => cargar({ estado: "ACTIVO" }));
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Visitas</h1>
      <Button label="Nueva" icon="pi pi-plus" size="small" @click="router.push({ name: 'RegistrarVisita' })" />
    </div>

    <Card>
      <template #content>
        <div class="flex flex-col gap-2">
          <InputText v-model="filtros.patente" placeholder="Buscar por patente" class="uppercase" @input="filtros.patente = filtros.patente.toUpperCase(); buscar()" />
          <InputText v-model="filtros.nombre" placeholder="Buscar por nombre" @input="buscar()" />
          <div class="flex gap-2">
            <Select v-model="filtros.estado" :options="estadosFiltro" optionLabel="label" optionValue="value" placeholder="Filtrar" class="flex-1" size="small" @change="buscar()" />
            <Button label="Limpiar" severity="secondary" variant="text" size="small" @click="limpiarFiltros" />
          </div>
        </div>
      </template>
    </Card>

    <Message v-if="error" severity="warn" :closable="false">{{ error }}</Message>

    <Skeleton v-if="loading" width="100%" height="300px" />

    <div v-else-if="!visitas.length" class="text-center text-surface-400 py-8">
      <i class="pi pi-inbox text-4xl block mb-2"></i>
      <span>No hay visitas registradas</span>
    </div>

    <div v-else class="flex flex-col gap-2">
      <Card v-for="visita in visitas" :key="visita.id">
        <template #content>
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="font-semibold m-0">{{ visita.nombreVisitante }}</p>
              <p v-if="visita.patenteVisitante" class="text-sm font-mono text-surface-500 m-0">{{ visita.patenteVisitante }}</p>
              <p class="text-xs text-surface-400 m-0">{{ visita.tipo }}</p>
              <p class="text-xs text-surface-300 m-0">{{ formatFecha(visita.fechaIngreso) }}</p>
            </div>
            <div class="flex flex-col items-end gap-2 shrink-0">
              <Tag :value="visita.estado === 'ACTIVO' ? 'Activa' : 'Salió'" :severity="estadoSeverity(visita.estado)" size="small" />
              <Button v-if="visita.estado === 'ACTIVO'" label="Registrar salida" size="small" severity="secondary" variant="outlined" @click="handleSalida(visita)" />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
