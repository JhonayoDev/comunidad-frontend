<script setup>
import { useRouter } from "vue-router";
import { useBusquedaPatente } from "@/composables/useBusquedaPatente";
import { useUnidades } from "@/composables/useUnidades";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Dialog from "primevue/dialog";

const props = defineProps({
  compact: { type: Boolean, default: false },
});

const router = useRouter();

const {
  patente,
  resultado,
  loading,
  errorMsg,
  successMsg,
  tipoInfo,
  ingresoDialogVisible,
  registrando,
  ingresoForm,
  erroresForm,
  consultar,
  tieneAccion,
  abrirDialogIngreso,
  confirmarIngreso,
  cerrarMensajes,
} = useBusquedaPatente();

const { unidades } = useUnidades();

const categorias = [
  { value: "VISITA", label: "Visita personal" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "UBER", label: "Uber / Taxi" },
  { value: "SERVICIO", label: "Servicio" },
  { value: "TECNICO", label: "Técnico" },
  { value: "OTRO", label: "Otro" },
];

function irANuevaVisita() {
  router.push({ name: "RegistrarVisita", query: { patente: patente.value } });
}

function irAVerDetalle() {
  router.push({ name: "BusquedaDetalle", query: { patente: patente.value, tipo: resultado.value?.tipoResultado } });
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <Card v-if="!compact">
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

    <div v-else class="flex flex-col gap-2">
      <label class="text-sm text-surface-400">Consultar patente</label>
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

    <template v-if="errorMsg || successMsg">
      <Message v-if="errorMsg" severity="error" :closable="true" @close="cerrarMensajes">{{ errorMsg }}</Message>
      <Message v-if="successMsg" severity="success" :closable="true" @close="cerrarMensajes">{{ successMsg }}</Message>
    </template>

    <Skeleton v-if="loading" width="100%" height="140px" />

    <Card v-if="resultado && resultado.tipoResultado !== 'DESCONOCIDO'" class="border-1 border-primary-200">
      <template #title>
        <div class="flex items-center gap-2">
          <i :class="['pi', tipoInfo?.icon || 'pi-car', 'text-primary']"></i>
          <span class="text-base">Vehículo identificado</span>
          <Tag :value="tipoInfo?.label || resultado.tipoResultado" :severity="tipoInfo?.severity || 'info'" size="small" />
        </div>
      </template>
      <template #content>
        <div class="flex flex-col gap-1 text-sm">
          <p class="m-0"><span class="text-surface-400">Identificado como:</span> <strong>{{ resultado.titulo }}</strong></p>
          <p v-if="resultado.subtitulo" class="m-0"><span class="text-surface-400">Ubicación:</span> {{ resultado.subtitulo }}</p>
          <p v-if="resultado.detalle" class="m-0"><span class="text-surface-400">Detalle:</span> {{ resultado.detalle }}</p>
        </div>
        <div class="flex flex-wrap gap-2 mt-3">
          <Button v-if="tieneAccion('REGISTRAR_INGRESO')" label="Registrar ingreso" icon="pi pi-sign-in" severity="success" @click="abrirDialogIngreso" />
          <Button v-if="tieneAccion('NUEVA_VISITA')" label="Nueva visita" icon="pi pi-plus" severity="secondary" @click="irANuevaVisita" />
          <Button v-if="tieneAccion('VER_DETALLE')" label="Ver detalle" icon="pi pi-info-circle" severity="info" variant="outlined" @click="irAVerDetalle" />
        </div>
      </template>
    </Card>

    <Card v-if="resultado && resultado.tipoResultado === 'DESCONOCIDO'" class="border-1 border-yellow-200">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-exclamation-triangle" style="color: var(--p-yellow-500)"></i>
          <span>Patente no registrada</span>
        </div>
      </template>
      <template #content>
        <p class="text-sm text-surface-500 m-0 mb-3">
          {{ resultado.titulo || `El vehículo con patente ${patente} no está registrado en el sistema.` }}
        </p>
        <div class="flex flex-wrap gap-2">
          <Button label="Registrar como visita" icon="pi pi-plus" severity="secondary" @click="irANuevaVisita" />
        </div>
      </template>
    </Card>

    <Dialog
      v-model:visible="ingresoDialogVisible"
      header="Registrar ingreso"
      modal
      :closable="!registrando"
      class="w-full max-w-md"
    >
      <div class="flex flex-col gap-3">
        <p class="text-sm text-surface-500 m-0">
          Confirmar ingreso de <strong>{{ resultado?.titulo || patente }}</strong>
        </p>

        <div class="flex flex-col gap-1">
          <label class="text-sm">Casa destino</label>
          <Select
            v-model="ingresoForm.unidadId"
            :options="unidades"
            optionLabel="numero"
            optionValue="id"
            placeholder="Seleccione una casa"
            :class="{ 'p-invalid': erroresForm.unidadId }"
          />
          <small v-if="erroresForm.unidadId" class="text-red-500">{{ erroresForm.unidadId }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm">Tipo de visita</label>
          <Select
            v-model="ingresoForm.tipo"
            :options="categorias"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccione tipo"
            :class="{ 'p-invalid': erroresForm.tipo }"
          />
          <small v-if="erroresForm.tipo" class="text-red-500">{{ erroresForm.tipo }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm">Cantidad de personas</label>
          <InputNumber
            v-model="ingresoForm.cantidadPersonas"
            :min="1"
            :max="50"
            class="w-full"
            :class="{ 'p-invalid': erroresForm.cantidadPersonas }"
          />
          <small v-if="erroresForm.cantidadPersonas" class="text-red-500">{{ erroresForm.cantidadPersonas }}</small>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text :disabled="registrando" @click="ingresoDialogVisible = false" />
        <Button label="Registrar" icon="pi pi-check" severity="success" :loading="registrando" @click="confirmarIngreso" />
      </template>
    </Dialog>
  </div>
</template>
