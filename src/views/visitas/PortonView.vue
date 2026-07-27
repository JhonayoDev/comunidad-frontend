<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { busquedaService } from "@/services/busquedaService";
import { visitasService } from "@/services/visitasService";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";

const router = useRouter();
const auth = useAuthStore();
const patente = ref("");
const resultado = ref(null);
const loading = ref(false);
const errorMsg = ref("");
const accionOk = ref("");

const tipoLabels = {
  VEHICULO_RESIDENTE: { label: "Residente", severity: "success" },
  PREAUTORIZACION: { label: "Pre-autorizado", severity: "info" },
  VEHICULO_FRECUENTE: { label: "Frecuente", severity: "warn" },
  DESCONOCIDO: { label: "Desconocido", severity: "danger" },
  PERSONA_RESIDENTE: { label: "Residente", severity: "success" },
  AUTORIZACION_SIN_VEHICULO: { label: "Sin vehículo", severity: "info" },
};

async function consultar() {
  const cid = auth.condominioActualId;
  if (!cid || patente.value.length < 2) return;
  loading.value = true;
  resultado.value = null;
  errorMsg.value = "";
  accionOk.value = "";
  try {
    const { data } = await busquedaService.porPatente(cid, patente.value);
    resultado.value = data;
  } catch (e) {
    console.error("Error al buscar por patente:", e);
    errorMsg.value = "Error al consultar. Intente nuevamente.";
  } finally {
    loading.value = false;
  }
}

async function registrarIngreso() {
  const cid = auth.condominioActualId;
  if (!cid || !resultado.value) return;
  try {
    await visitasService.registrarIngreso(cid, {
      patenteVisitante: patente.value,
      nombreVisitante: resultado.value.titulo || patente.value,
    });
    accionOk.value = "Ingreso registrado correctamente";
    resultado.value = null;
    patente.value = "";
  } catch (e) {
    console.error("Error al registrar ingreso:", e);
    errorMsg.value = e.response?.data?.message || "Error al registrar ingreso";
  }
}

function irARegistrarVisita() {
  router.push({ name: "RegistrarVisita", query: { patente: patente.value } });
}

function tieneAccion(accion) {
  return resultado.value?.acciones?.includes(accion);
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
            <InputText
              v-model="patente"
              placeholder="Ej: AB1234"
              class="flex-1 uppercase"
              maxlength="10"
              @keyup.enter="consultar"
              @input="patente = patente.toUpperCase()"
            />
            <Button label="Buscar" icon="pi pi-search" :loading="loading" :disabled="patente.length < 2" @click="consultar" />
          </div>
        </div>
      </template>
    </Card>

    <Message v-if="errorMsg" severity="error" :closable="false">{{ errorMsg }}</Message>
    <Message v-if="accionOk" severity="success" :closable="false">{{ accionOk }}</Message>

    <Skeleton v-if="loading" width="100%" height="120px" />

    <Card v-if="resultado && resultado.tipoResultado !== 'DESCONOCIDO'">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-car text-primary"></i>
          <span>Vehículo identificado</span>
          <Tag :value="tipoLabels[resultado.tipoResultado]?.label || resultado.tipoResultado" :severity="tipoLabels[resultado.tipoResultado]?.severity || 'info'" size="small" />
        </div>
      </template>
      <template #content>
        <div class="flex flex-col gap-1 text-sm">
          <p class="m-0"><span class="text-surface-400">Identificado como:</span> <strong>{{ resultado.titulo }}</strong></p>
          <p v-if="resultado.subtitulo" class="m-0"><span class="text-surface-400">Ubicación:</span> {{ resultado.subtitulo }}</p>
          <p v-if="resultado.detalle" class="m-0"><span class="text-surface-400">Detalle:</span> {{ resultado.detalle }}</p>
        </div>
        <div class="flex flex-wrap gap-2 mt-3">
          <Button v-if="tieneAccion('REGISTRAR_INGRESO')" label="Registrar ingreso" icon="pi pi-sign-in" severity="success" @click="registrarIngreso" />
          <Button v-if="tieneAccion('NUEVA_VISITA')" label="Nueva visita" icon="pi pi-plus" severity="secondary" @click="irARegistrarVisita" />
        </div>
      </template>
    </Card>

    <Card v-if="resultado && resultado.tipoResultado === 'DESCONOCIDO'">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-exclamation-triangle text-danger"></i>
          <span>Patente no registrada</span>
        </div>
      </template>
      <template #content>
        <p class="text-sm text-surface-500 m-0 mb-3">
          {{ resultado.titulo || `El vehículo con patente ${patente} no está registrado en el sistema.` }}
        </p>
        <Button label="Registrar como visita" icon="pi pi-plus" class="w-full" severity="secondary" @click="irARegistrarVisita" />
      </template>
    </Card>
  </div>
</template>
