<template>
  <div class="p-4 flex flex-col gap-4">
    <!-- Notificaciones Push -->
    <Card>
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-bell" />
          <span>Notificaciones Push</span>
        </div>
      </template>
      <template #content>
        <p class="text-sm text-surface-500 mb-3">
          Recibe alertas al instante cuando llegue una visita, una encomienda o
          haya novedades en tu condominio.
        </p>

        <!-- Estado: Granted -->
        <template v-if="estadoPermiso === 'granted'">
          <div class="flex items-center justify-between py-2">
            <div class="flex flex-col">
              <span class="font-medium">Notificaciones activas</span>
              <span class="text-xs text-surface-400">
                Recibirás alertas en este dispositivo
              </span>
            </div>
            <InputSwitch
              :modelValue="true"
              :loading="cambiando"
              @update:modelValue="toggleOff"
            />
          </div>
        </template>

        <!-- Estado: Default (nunca preguntado) -->
        <template v-else-if="estadoPermiso === 'default'">
          <div class="flex items-center justify-between py-2">
            <div class="flex flex-col">
              <span class="font-medium">Notificaciones inactivas</span>
              <span class="text-xs text-surface-400">
                Actívalas para recibir alertas al instante
              </span>
            </div>
            <Button
              label="Activar"
              icon="pi pi-bell"
              size="small"
              :loading="cambiando"
              @click="toggleOn"
            />
          </div>
        </template>

        <!-- Estado: Denied -->
        <template v-else-if="estadoPermiso === 'denied'">
          <div class="flex items-center justify-between py-2">
            <div class="flex flex-col">
              <span class="font-medium">Notificaciones bloqueadas</span>
              <span class="text-xs text-surface-400">
                El navegador tiene las notificaciones deshabilitadas
              </span>
            </div>
            <InputSwitch :modelValue="false" disabled />
          </div>

          <Divider />

          <div class="flex flex-col gap-2">
            <Message severity="warn" :closable="false" class="text-sm">
              Para reactivar las notificaciones, debes cambiar los permisos
              desde la configuración de tu navegador.
            </Message>

            <Card
              :pt="{
                root: { class: 'bg-surface/75' },
                body: { class: 'p-3' },
                content: { class: 'p-0' },
              }"
            >
              <div class="flex flex-col gap-2 text-sm">
                <span class="font-semibold text-surface-700">
                  Instrucciones paso a paso:
                </span>

                <div class="flex items-start gap-2">
                  <span
                    class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold"
                  >
                    1
                  </span>
                  <span class="text-surface-600">
                    Haz clic en el <strong>candado</strong> (🔒) o
                    <strong>información</strong> (ℹ️) en la barra de dirección.
                  </span>
                </div>

                <div class="flex items-start gap-2">
                  <span
                    class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold"
                  >
                    2
                  </span>
                  <span class="text-surface-600">
                    Busca la opción <strong>"Notificaciones"</strong> y
                    cámbiala a <strong>"Permitir"</strong>.
                  </span>
                </div>

                <div class="flex items-start gap-2">
                  <span
                    class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold"
                  >
                    3
                  </span>
                  <span class="text-surface-600">
                    <strong>Recarga la página</strong> para que los cambios
                    tengan efecto.
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </template>

        <!-- Estado: No soportado -->
        <template v-else-if="estadoPermiso === 'no-soportado'">
          <Message severity="info" :closable="false">
            Tu navegador no soporta notificaciones push. Prueba con Chrome,
            Firefox o Edge.
          </Message>
        </template>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { usePushNotifications } from "@/composables/usePushNotifications";
import Card from "primevue/card";
import InputSwitch from "primevue/inputswitch";
import Button from "primevue/button";
import Divider from "primevue/divider";
import Message from "primevue/message";

const {
  estaActivo,
  estadoPermiso,
  solicitarPermiso,
  desuscribir,
} = usePushNotifications();

const cambiando = ref(false);

async function toggleOn() {
  cambiando.value = true;
  try {
    await solicitarPermiso();
  } finally {
    cambiando.value = false;
  }
}

async function toggleOff() {
  cambiando.value = true;
  try {
    await desuscribir();
  } finally {
    cambiando.value = false;
  }
}
</script>
