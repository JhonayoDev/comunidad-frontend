<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { vehiculosService } from "@/services/vehiculosService";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";

const router = useRouter();
const auth = useAuthStore();
const patente = ref("");
const resultado = ref(null);
const noEncontrado = ref(false);
const loading = ref(false);
const buscando = ref(false);
const errorMsg = ref("");

async function consultar() {
  const cid = auth.condominioActualId;
  if (!cid || patente.value.length < 2) return;
  loading.value = true;
  buscando.value = true;
  resultado.value = null;
  noEncontrado.value = false;
  errorMsg.value = "";
  try {
    const res = await vehiculosService.listar(cid);
    const vehiculos = res.data || [];
    const encontrado = vehiculos.find((v) => v.patente?.toUpperCase() === patente.value);
    encontrado ? (resultado.value = encontrado) : (noEncontrado.value = true);
  } catch (e) {
    console.error("Error al buscar vehículo:", e);
    errorMsg.value = "Error al consultar. Intente nuevamente.";
  } finally {
    loading.value = false;
    setTimeout(() => { buscando.value = false; }, 300);
  }
}

function irARegistrarVisita() {
  router.push({ name: "RegistrarVisita", query: { patente: patente.value } });
}
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <h1 class="text-xl font-bold m-0">Control de Acceso</h1>

    <Card>
      <template #content>
        <div class="flex flex-col gap-2">
          <label class="text-sm text-surface-400">Ingrese la patente del vehículo</label>
          <div class="flex gap-2">
            <InputText v-model="patente" placeholder="Ej: AB1234" class="flex-1 uppercase" maxlength="10" @keyup.enter="consultar" @input="patente = patente.toUpperCase()" />
            <Button label="Buscar" icon="pi pi-search" :loading="loading && !buscando" :disabled="patente.length < 2" @click="consultar" />
          </div>
        </div>
      </template>
    </Card>

    <Message v-if="errorMsg" severity="error" :closable="false">{{ errorMsg }}</Message>

    <Skeleton v-if="buscando && loading" width="100%" height="120px" />

    <Card v-if="resultado">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-car text-primary"></i>
          <span>Vehículo encontrado</span>
        </div>
      </template>
      <template #content>
        <div class="flex flex-col gap-1 text-sm">
          <p class="m-0"><span class="text-surface-400">Patente:</span> <strong>{{ resultado.patente }}</strong></p>
          <p class="m-0"><span class="text-surface-400">Marca/Modelo:</span> {{ resultado.marca }} {{ resultado.modelo }} — {{ resultado.color }}</p>
          <p v-if="resultado.estacionamientoNumero" class="m-0"><span class="text-surface-400">Estacionamiento:</span> Nº {{ resultado.estacionamientoNumero }}</p>
        </div>
        <Button label="Registrar como visita" icon="pi pi-plus" class="w-full mt-3" severity="secondary" @click="irARegistrarVisita" />
      </template>
    </Card>

    <Card v-if="noEncontrado">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-exclamation-triangle text-danger"></i>
          <span>Patente no registrada</span>
        </div>
      </template>
      <template #content>
        <p class="text-sm text-surface-500 m-0 mb-3">El vehículo con patente {{ patente }} no está registrado en el sistema.</p>
        <Button label="Registrar como visita" icon="pi pi-plus" class="w-full" severity="secondary" @click="irARegistrarVisita" />
      </template>
    </Card>
  </div>
</template>
