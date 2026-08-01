<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { unidadesService } from "@/services/unidadesService";
import { personasService } from "@/services/personasService";

import Card from "primevue/card";
import Select from "primevue/select";
import Tag from "primevue/tag";
import InputSwitch from "primevue/inputswitch";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Divider from "primevue/divider";

const auth = useAuthStore();

const unidades = ref([]);
const unidadSeleccionada = ref(null);
const vinculos = ref([]);
const loading = ref(true);
const loadingVinculos = ref(false);
const error = ref(null);
const guardando = ref(null);

const tipoLabels = {
  PROPIETARIO: "Propietario",
  ARRENDATARIO: "Arrendatario",
  RESIDENTE_ADICIONAL: "Adicional",
};

const tipoSeverity = {
  PROPIETARIO: "info",
  ARRENDATARIO: "warn",
  RESIDENTE_ADICIONAL: "secondary",
};

const unidadOptions = computed(() =>
  unidades.value.map((u) => ({
    label: `${u.numero}${u.sectorNombre ? ` · ${u.sectorNombre}` : ""}`,
    value: u.id,
  })),
);

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await unidadesService.getUnidades(cid);
    unidades.value = data || [];
  } catch (e) {
    console.error("Error al cargar unidades para CRM", e);
    error.value = "No se pudieron cargar las unidades";
  } finally {
    loading.value = false;
  }
}

async function seleccionarUnidad(id) {
  const cid = auth.condominioActualId;
  if (!cid || !id) {
    vinculos.value = [];
    return;
  }
  loadingVinculos.value = true;
  try {
    const { data } = await personasService.vinculosUnidad(cid, id);
    vinculos.value = data || [];
  } catch (e) {
    console.error("Error al cargar vínculos", e);
    vinculos.value = [];
  } finally {
    loadingVinculos.value = false;
  }
}

async function toggleRecibeNotificaciones(vinculo) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  const nuevo = !vinculo.recibeNotificaciones;
  guardando.value = vinculo.id;
  try {
    await personasService.actualizarRecibeNotificaciones(cid, vinculo.id, nuevo);
    vinculo.recibeNotificaciones = nuevo;
  } catch (e) {
    console.error("Error al actualizar recibe-notificaciones", e);
  } finally {
    guardando.value = null;
  }
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CL");
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div>
      <h1 class="text-xl font-bold m-0">Unidades y Personas</h1>
      <p class="text-sm text-surface-500 m-0 mt-1">
        Gestiona quién recibe notificaciones por casa. El toggle aplica al
        vínculo persona–unidad (afecta el envío real y el stream SSE).
      </p>
    </div>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <Skeleton v-if="loading" width="100%" height="200px" />

    <template v-else>
      <Card>
        <template #content>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold">Selecciona una unidad</label>
            <Select
              v-model="unidadSeleccionada"
              :options="unidadOptions"
              optionLabel="label"
              optionValue="value"
              filter
              placeholder="Buscar unidad…"
              class="w-full"
              @update:modelValue="seleccionarUnidad($event)"
            />
          </div>
        </template>
      </Card>

      <Card v-if="unidadSeleccionada">
        <template #title>
          <div class="flex items-center justify-between">
            <span>Personas vinculadas</span>
            <Tag v-if="vinculos.length" :value="vinculos.length" severity="warn" />
          </div>
        </template>
        <template #content>
          <Skeleton v-if="loadingVinculos" width="100%" height="6rem" />
          <div v-else-if="!vinculos.length" class="text-sm text-surface-400 py-2">
            Sin personas vinculadas a esta unidad.
          </div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="v in vinculos"
              :key="v.id"
              class="flex items-center justify-between p-2 border-round surface-ground"
            >
              <div class="flex items-center gap-3 min-w-0">
                <i class="pi pi-user text-primary"></i>
                <div class="flex flex-col min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium truncate">{{ v.personaNombre }}</span>
                    <Tag
                      :value="tipoLabels[v.tipo] || v.tipo"
                      :severity="tipoSeverity[v.tipo] || 'info'"
                      size="small"
                    />
                  </div>
                  <span class="text-xs text-surface-500">
                    Desde {{ formatFecha(v.fechaInicio) }}
                    <template v-if="!v.activo"> · Vínculo inactivo</template>
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <Tag
                  v-if="v.esOcupante"
                  value="Ocupante"
                  severity="success"
                  size="small"
                />
                <div class="flex items-center gap-1 text-xs text-surface-500">
                  <span>Notif.</span>
                  <InputSwitch
                    :modelValue="v.recibeNotificaciones"
                    :disabled="guardando === v.id || !v.activo"
                    @update:modelValue="toggleRecibeNotificaciones(v)"
                  />
                </div>
              </div>
            </div>
            <Divider />
            <p class="text-xs text-surface-400 m-0">
              "Ocupante" = vive físicamente en la unidad. Con Notif. en OFF no
              recibe notificaciones de esa unidad (ni la señal SSE de mis
              encomiendas).
            </p>
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>
