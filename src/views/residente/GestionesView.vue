<template>
  <div class="p-4 flex flex-col gap-4">
    <h2 class="text-lg font-bold">Gestiones</h2>

    <!-- Visita esperada -->
    <Card>
      <template #content>
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:surface-hover"
          @click="seccionActiva = seccionActiva === 'visita' ? null : 'visita'"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">🚪</span>
            <div>
              <p class="font-medium">Visita esperada</p>
              <p class="text-xs text-surface-400">
                Preautorizar ingreso de visita
              </p>
            </div>
          </div>
          <span class="text-surface-400">{{
            seccionActiva === "visita" ? "∨" : "›"
          }}</span>
        </div>

        <div
          v-if="seccionActiva === 'visita'"
          class="px-4 pb-4 border-t border-surface-200"
        >
          <div class="flex flex-col items-center py-6 gap-2">
            <span class="text-4xl">🚧</span>
            <p class="font-semibold">Próximamente</p>
            <p class="text-sm text-surface-500 text-center">
              Podrás avisar al guardia que espera una visita con anticipación.
            </p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Reserva de áreas comunes -->
    <Card>
      <template #content>
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:surface-hover"
          @click="
            seccionActiva = seccionActiva === 'reserva' ? null : 'reserva'
          "
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">📅</span>
            <div>
              <p class="font-medium">Reservar área común</p>
              <p class="text-xs text-surface-400">
                Quincho, sala multiuso, cancha
              </p>
            </div>
          </div>
          <span class="text-surface-400">{{
            seccionActiva === "reserva" ? "∨" : "›"
          }}</span>
        </div>

        <div
          v-if="seccionActiva === 'reserva'"
          class="px-4 pb-4 border-t border-surface-200"
        >
          <div class="flex flex-col items-center py-6 gap-2">
            <span class="text-4xl">🚧</span>
            <p class="font-semibold">Próximamente</p>
            <p class="text-sm text-surface-500 text-center">
              Podrás reservar espacios comunes del condominio.
            </p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Reclamos y casos -->
    <Card>
      <template #content>
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:surface-hover"
          @click="
            seccionActiva = seccionActiva === 'reclamo' ? null : 'reclamo'
          "
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">📝</span>
            <div>
              <p class="font-medium">Reclamos y casos</p>
              <p class="text-xs text-surface-400">
                Reclamos, sugerencias y solicitudes
              </p>
            </div>
          </div>
          <span class="text-surface-400">{{
            seccionActiva === "reclamo" ? "∨" : "›"
          }}</span>
        </div>

        <div
          v-if="seccionActiva === 'reclamo'"
          class="px-4 pb-4 border-t border-surface-200"
        >
          <div class="flex flex-col gap-3 pt-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">Tipo</label>
              <Select
                v-model="reclamoForm.tipo"
                :options="tiposReclamo"
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione un tipo"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">Descripción</label>
              <Textarea
                v-model="reclamoForm.descripcion"
                placeholder="Describa su reclamo, sugerencia o solicitud"
                rows="3"
                :autoResize="true"
              />
            </div>

            <Message severity="info" :closable="false">
              ⚠️ El envío estará disponible próximamente. Puede redactar su
              mensaje y enviarlo cuando esté listo.
            </Message>

            <Button label="Enviar" size="small" disabled :pt:root:class="'opacity-50'" />

            <Divider class="text-xs">Casos anteriores</Divider>
            <div class="flex flex-col items-center py-4 gap-2">
              <span class="text-3xl">📭</span>
              <p class="text-sm text-surface-500">
                No tienes casos anteriores
              </p>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Mis encomiendas -->
    <Card>
      <template #content>
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:surface-hover"
          @click="$router.push({ name: 'MisEncomiendas' })"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">📦</span>
            <div>
              <p class="font-medium">Mis encomiendas</p>
              <p class="text-xs text-surface-400">
                Paquetes pendientes de retiro
              </p>
            </div>
          </div>
          <span class="text-surface-400">›</span>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from "vue";

import Card from "primevue/card";
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import Message from "primevue/message";
import Button from "primevue/button";
import Divider from "primevue/divider";

const seccionActiva = ref(null);

const tiposReclamo = [
  { label: "Reclamo", value: "RECLAMO" },
  { label: "Sugerencia", value: "SUGERENCIA" },
  { label: "Solicitud", value: "SOLICITUD" },
];

const reclamoForm = ref({
  tipo: "",
  descripcion: "",
});
</script>