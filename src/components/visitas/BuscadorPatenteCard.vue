<script setup>
import { useRouter } from "vue-router";
import { useBusquedaPatente } from "@/composables/useBusquedaPatente";
import ConfirmarSalidaDialog from "./ConfirmarSalidaDialog.vue";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";

const props = defineProps({
  compact: { type: Boolean, default: false },
});

const router = useRouter();

const {
  patente,
  resultados,
  indiceSeleccionado,
  loading,
  errorMsg,
  successMsg,
  tipoInfo,
  hayMas,
  accesoSalida,
  salidaDialogVisible,
  confirmandoSalida,
  salidaError,
  consultar,
  limpiar,
  tieneAccion,
  toggleExpand,
  abrirDialogSalida,
  confirmarSalida,
  cerrarMensajes,
  buscarMas,
  tipoLabel,
  tipoSeverity,
} = useBusquedaPatente();

function extraerPatenteDeSubtitulo(res) {
  if (!res) return patente.value;
  const m = res.subtitulo?.match(/Coincidencia parcial:\s*(\S+)/);
  return m ? m[1] : patente.value;
}

function extraerPatenteDeResultado(res) {
  if (!res) return patente.value;
  const m = res.subtitulo?.match(/Coincidencia parcial:\s*(\S+)/);
  return m ? m[1] : patente.value;
}

function infoCompacta(res) {
  if (!res) return "";
  const partes = [];
  if (res.unidadNumero) partes.push(`Casa ${res.unidadNumero}`);
  if (res.titulo) partes.push(res.titulo);
  return partes.join(" · ");
}

function irARegistrarIngreso(res) {
  const query = { patente: extraerPatenteDeSubtitulo(res) };
  query.nombre = res.titulo;
  if (res.tipoResultado === "PREAUTORIZACION" && res.referenciaId) {
    query.autorizacionId = res.referenciaId;
  }
  if (res.unidadNumero) query.unidad = res.unidadNumero;
  router.push({ name: "RegistrarVisita", query });
}

function irANuevaVisita() {
  router.push({ name: "RegistrarVisita", query: { patente: patente.value } });
}

function irAVerDetalle(res) {
  const p = extraerPatenteDeSubtitulo(res);
  router.push({
    name: "BusquedaDetalle",
    query: { patente: p, tipo: res.tipoResultado },
  });
}

function onInputChange() {
  patente.value = patente.value.toUpperCase();
  buscarMas(patente.value);
}

function onSalidaConfirmada(observacion) {
  confirmarSalida(observacion);
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <Card v-if="!compact">
      <template #content>
        <div class="flex flex-col gap-2">
          <label class="text-sm text-text/95"
            >Ingrese la patente del vehículo</label
          >
          <div class="flex gap-2">
            <InputText
              v-model="patente"
              placeholder="Ej: AB1234"
              class="flex-1 uppercase border-border"
              maxlength="10"
              @keyup.enter="consultar"
              @input="onInputChange"
            />
            <Button
              label="Buscar"
              icon="pi pi-search"
              :loading="loading"
              :disabled="patente.length < 3"
              @click="consultar"
            />
          </div>
        </div>
      </template>
    </Card>

    <div v-else class="flex flex-col gap-2">
      <label class="text-sm text-text/98">Consultar patente</label>
      <div class="grid grid-cols-[1fr_auto] gap-2">
        <InputText
          v-model="patente"
          placeholder="Ej: AB1234"
          class="min-w-0 uppercase border-border"
          maxlength="10"
          @keyup.enter="consultar"
          @input="onInputChange"
        />
        <Button
          label="Buscar"
          icon="pi pi-search"
          :loading="loading"
          :disabled="patente.length < 3"
          @click="consultar"
        />
      </div>
    </div>

    <template v-if="errorMsg || successMsg">
      <Message
        v-if="errorMsg"
        severity="error"
        :closable="true"
        @close="cerrarMensajes"
        >{{ errorMsg }}</Message
      >
      <Message
        v-if="successMsg"
        severity="success"
        :closable="true"
        @close="cerrarMensajes"
        >{{ successMsg }}</Message
      >
    </template>

    <Skeleton v-if="loading" width="100%" height="140px" />

    <!-- SINGLE RESULT: exact match -->
    <Card
      v-if="
        resultados.length === 1 && resultados[0].tipoResultado !== 'DESCONOCIDO'
      "
      class="border border-border-secondary"
    >
      <template #title>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <i :class="['pi', tipoInfo?.icon || 'pi-car', 'text-text/70']"></i>
            <span class="text-base text-text/95">Vehículo identificado</span>
            <Tag
              :value="tipoLabel(resultados[0])"
              :severity="tipoSeverity(resultados[0])"
              size="small"
            />
          </div>
          <Button
            class="btn-no-bg body-btn"
            icon="pi pi-times"
            severity="secondary"
            text
            rounded
            size="small"
            @click="limpiar"
          />
        </div>
      </template>
      <template #content>
        <div class="flex flex-col gap-1 text-sm">
          <p class="m-0">
            <span class="text-text-muted">A nombre de: </span>
            <strong>{{ resultados[0].titulo }}</strong>
          </p>
          <p v-if="resultados[0].subtitulo" class="m-0">
            <span class="text-text-muted">Ubicación: </span>
            {{ resultados[0].subtitulo }}
          </p>
          <p v-if="resultados[0].detalle" class="m-0">
            <span class="text-text-muted">Detalle: </span>
            {{ resultados[0].detalle }}
          </p>
        </div>
        <div class="grid grid-cols-[1fr_auto] gap-2 mt-3">
          <Button
            v-if="tieneAccion('REGISTRAR_INGRESO', resultados[0])"
            label="Registrar ingreso"
            icon="pi pi-sign-in"
            severity="success"
            @click="irARegistrarIngreso(resultados[0])"
          />
          <Button
            v-if="accesoSalida"
            label="Registrar salida"
            icon="pi pi-sign-out"
            severity="warn"
            @click="abrirDialogSalida"
          />
          <Button
            v-if="tieneAccion('NUEVA_VISITA', resultados[0])"
            label="Nueva visita"
            icon="pi pi-plus"
            severity="secondary"
            @click="irANuevaVisita"
          />
          <Button
            v-if="tieneAccion('VER_DETALLE', resultados[0])"
            label="Ver detalle"
            icon="pi pi-info-circle"
            severity="info"
            variant="outlined"
            @click="irAVerDetalle(resultados[0])"
          />
        </div>
      </template>
    </Card>

    <!-- MULTIPLE RESULTS: mini-cards with expand -->
    <div v-if="resultados.length > 1" class="flex flex-col gap-1">
      <div class="flex items-center justify-between">
        <span class="text-sm text-text/90"
          >{{ resultados.length }} resultado(s)</span
        >
        <Button
          class="btn-no-bg body-btn"
          icon="pi pi-times"
          label="Limpiar"
          severity="secondary"
          text
          size="small"
          @click="limpiar"
        />
      </div>
      <div v-for="(res, idx) in resultados" :key="idx">
        <div
          class="flex items-center justify-between gap-2 p-3 border rounded-lg cursor-pointer transition-colors select-none"
          :class="
            indiceSeleccionado === idx
              ? 'border-border bg-background rounded-b-none'
              : 'border-border-secondary bg-surface/90 hover:bg-background/95'
          "
          @click="toggleExpand(idx)"
        >
          <div
            class="flex items-center gap-1 text-xs min-w-0 flex-1 overflow-hidden"
          >
            <span class="text-text font-semibold whitespace-nowrap">{{
              extraerPatenteDeResultado(res)
            }}</span>
            <span
              v-if="infoCompacta(res)"
              class="text-text-muted truncate min-w-0"
              >· {{ infoCompacta(res) }}</span
            >
          </div>
          <Tag
            :value="tipoLabel(res)"
            :severity="tipoSeverity(res)"
            size="small"
            class="shrink-0"
          />
          <i
            :class="
              indiceSeleccionado === idx
                ? 'pi pi-chevron-up'
                : 'pi pi-chevron-down'
            "
            class="text-xs shrink-0"
          ></i>
        </div>

        <div
          v-if="indiceSeleccionado === idx"
          class="border border-t-0 border-primary rounded-b-lg p-3 bg-surface"
        >
          <div class="flex flex-col gap-1 text-sm">
            <p v-if="res.subtitulo" class="m-0">
              <span class="text-text-muted">Tipo: </span>
              {{ res.subtitulo }}
            </p>
            <p v-if="res.unidadNumero" class="m-0">
              <span class="text-text-muted">Unidad: </span> Casa
              {{ res.unidadNumero }}
            </p>
            <p v-if="res.detalle" class="m-0">
              <span class="text-text-muted">Detalle: </span> {{ res.detalle }}
            </p>
          </div>
          <div class="grid grid-cols-[1fr_auto] gap-2 mt-3">
            <Button
              v-if="tieneAccion('REGISTRAR_INGRESO', res)"
              label="Registrar ingreso"
              icon="pi pi-sign-in"
              severity="success"
              @click="irARegistrarIngreso(res)"
            />
            <Button
              v-if="accesoSalida"
              label="Registrar salida"
              icon="pi pi-sign-out"
              severity="warn"
              @click="abrirDialogSalida"
            />
            <Button
              v-if="tieneAccion('VER_DETALLE', res)"
              label="Ver detalle"
              icon="pi pi-info-circle"
              severity="info"
              variant="outlined"
              @click="irAVerDetalle(res)"
            />
          </div>
        </div>
      </div>

      <Message
        v-if="hayMas"
        severity="info"
        :closable="false"
        class="text-xs mt-1 text-text-inverse bg-background-inverse/60 border-2 border-amber-300"
      >
        <i class="pi pi-info-circle mr-1"></i>
        Hay más resultados. Ingrese más caracteres para precisar.
      </Message>
    </div>

    <!-- DESCONOCIDO -->
    <Card
      v-if="
        resultados.length === 1 && resultados[0].tipoResultado === 'DESCONOCIDO'
      "
      class="border border-border-secondary"
    >
      <template #title>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <i
              class="pi pi-exclamation-triangle"
              style="color: var(--p-yellow-500)"
            ></i>
            <span>Patente no registrada</span>
          </div>
          <Button
            class="btn-no-bg body-btn"
            icon="pi pi-times"
            severity="secondary"
            text
            rounded
            size="small"
            @click="limpiar"
          />
        </div>
      </template>
      <template #content>
        <p class="text-sm text-text/90 m-0 mb-3">
          {{
            resultados[0].titulo ||
            `El vehículo con patente ${patente} no está registrado en el sistema.`
          }}
        </p>
        <div class="flex flex-wrap gap-2">
          <Button
            label="Registrar como visita"
            icon="pi pi-plus"
            @click="irANuevaVisita"
          />
          <Button
            v-if="accesoSalida"
            label="Registrar salida"
            icon="pi pi-sign-out"
            severity="warn"
            @click="abrirDialogSalida"
          />
        </div>
      </template>
    </Card>

    <ConfirmarSalidaDialog
      v-model:visible="salidaDialogVisible"
      :acceso="accesoSalida"
      :patente="patente"
      :loading="confirmandoSalida"
      :error="salidaError"
      @confirm="onSalidaConfirmada"
      @cancel="salidaDialogVisible = false"
    />
  </div>
</template>
