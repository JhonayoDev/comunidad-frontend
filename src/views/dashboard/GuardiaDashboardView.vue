<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import api from "@/services/api";
import { encomiendasService } from "@/services/encomiendasService";
import { bitacoraService } from "@/services/bitacoraService";
import { autorizacionesService } from "@/services/autorizacionesService";

import Card from "primevue/card";
import Tag from "primevue/tag";
import Badge from "primevue/badge";
import Button from "primevue/button";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import InputText from "primevue/inputtext";

const router = useRouter();
const auth = useAuthStore();
const dashboard = ref(null);
const turno = ref(null);
const encomiendas = ref([]);
const autorizaciones = ref([]);
const loading = ref(true);
const error = ref(null);
const turnoLoading = ref(false);
let timerInterval = null;

const accionesLabels = {
  TURNO_INICIO: { label: "Iniciar turno", icon: "pi pi-play", severity: "success" },
  TURNO_FIN: { label: "Finalizar turno", icon: "pi pi-stop", severity: "danger" },
  COLACION_SALIDA: { label: "Salir a colación", icon: "pi pi-clock", severity: "warn" },
  COLACION_REGRESO: { label: "Regresar de colación", icon: "pi pi-check-circle", severity: "info" },
  NOVEDAD: { label: "Registrar novedad", icon: "pi pi-pencil", severity: "help" },
};

const tiempoTranscurrido = ref("");
const showNovedadDialog = ref(false);
const enviandoNovedad = ref(false);
const nuevaNovedad = ref({
  tipo: "NOVEDAD",
  clasificacion: "NORMAL",
  observaciones: "",
  fotoUrl: "",
});

const clasificaciones = [
  { label: "Normal", value: "NORMAL" },
  { label: "Urgente", value: "URGENTE" },
  { label: "Emergencia", value: "EMERGENCIA" },
  { label: "Informativo", value: "INFO" },
];

function actualizarTiempo() {
  if (!turno.value?.ultimoEventoEn) {
    tiempoTranscurrido.value = "";
    return;
  }
  const desde = new Date(turno.value.ultimoEventoEn);
  const ahora = new Date();
  const diff = Math.floor((ahora - desde) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  tiempoTranscurrido.value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatearFecha(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

async function ejecutarAccion(tipo) {
  if (tipo === "NOVEDAD") {
    showNovedadDialog.value = true;
    return;
  }
  const cid = auth.condominioActualId;
  if (!cid) return;
  turnoLoading.value = true;
  try {
    await bitacoraService.registrarEvento(cid, { tipo, clasificacion: "NORMAL" });
    const res = await bitacoraService.miTurno(cid);
    turno.value = res.data;
    actualizarTiempo();
  } catch (e) {
    console.error("Error al registrar acción de turno", e);
    error.value = "Error al registrar acción de turno";
  } finally {
    turnoLoading.value = false;
  }
}

async function registrarNovedad() {
  if (!nuevaNovedad.value.observaciones.trim()) return;
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviandoNovedad.value = true;
  try {
    await bitacoraService.registrarEvento(cid, {
      tipo: nuevaNovedad.value.tipo,
      clasificacion: nuevaNovedad.value.clasificacion,
      observaciones: nuevaNovedad.value.observaciones,
      fotoUrl: nuevaNovedad.value.fotoUrl || null,
    });
    showNovedadDialog.value = false;
    nuevaNovedad.value = {
      tipo: "NOVEDAD",
      clasificacion: "NORMAL",
      observaciones: "",
      fotoUrl: "",
    };
    const res = await bitacoraService.miTurno(cid);
    turno.value = res.data;
    actualizarTiempo();
  } catch (e) {
    console.error("Error al registrar novedad", e);
    error.value = "Error al registrar novedad";
  } finally {
    enviandoNovedad.value = false;
  }
}

function severityEstado(estado) {
  if (estado === "ACTIVO") return "success";
  if (estado === "FINALIZADO") return "info";
  if (estado === "RECHAZADO") return "danger";
  return "warn";
}

onMounted(async () => {
  const cid = auth.condominioActualId;
  if (!cid) {
    error.value = "Selecciona un condominio primero";
    loading.value = false;
    return;
  }
  try {
    const [resDash, resTurno, resEnv, resAuth] = await Promise.all([
      api.get(`/condominios/${cid}/dashboard/guardia`),
      bitacoraService.miTurno(cid),
      encomiendasService.getEncomiendas(cid, { estado: "PENDIENTE" }),
      autorizacionesService.listar(cid, { estado: "PENDIENTE" }),
    ]);
    dashboard.value = resDash.data;
    turno.value = resTurno.data;
    encomiendas.value = resEnv.data || [];
    autorizaciones.value = resAuth.data || [];

    if (turno.value?.enTurno) {
      actualizarTiempo();
      timerInterval = setInterval(actualizarTiempo, 1000);
    }
  } catch (e) {
    console.error("Error al cargar dashboard guardia", e);
    error.value = "Error al cargar el dashboard";
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  clearInterval(timerInterval);
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <template v-if="loading">
      <Card><template #content><Skeleton width="100%" height="5rem" /></template></Card>
      <div class="grid grid-cols-2 gap-3">
        <Card v-for="i in 4" :key="i"><template #content><Skeleton width="100%" height="4rem" /></template></Card>
      </div>
      <Card><template #content><Skeleton width="100%" height="8rem" /></template></Card>
    </template>

    <template v-else-if="dashboard">
      <!-- Card: Estado de Turno -->
      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span
                class="inline-block w-3 h-3 border-round"
                :style="{ background: turno?.enTurno ? 'var(--p-green-500)' : 'var(--p-gray-400)' }"
              ></span>
              <div>
                <p class="font-bold m-0">
                  {{ turno?.enTurno ? "En turno" : "Sin turno activo" }}
                </p>
                <p v-if="turno?.enTurno" class="text-sm text-surface-500 m-0">
                  {{ tiempoTranscurrido }} · desde {{ formatearFecha(turno?.ultimoEventoEn) }}
                </p>
                <p v-if="turno?.enColacion" class="text-sm text-yellow-600 m-0 font-medium">
                  En colación
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <Button
                v-for="accion in turno?.accionesDisponibles || []"
                :key="accion"
                :label="accionesLabels[accion]?.label || accion"
                :icon="accionesLabels[accion]?.icon"
                :severity="accionesLabels[accion]?.severity"
                size="small"
                :loading="turnoLoading"
                @click="ejecutarAccion(accion)"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 gap-3">
        <Card
          class="cursor-pointer hover:surface-hover transition-shadow"
          @click="router.push({ name: 'Visitas' })"
        >
          <template #content>
            <div class="text-center">
              <p class="text-3xl font-bold m-0 text-green-600">
                {{ dashboard.accesos?.activosAhora || 0 }}
              </p>
              <p class="text-xs text-surface-500 m-0 mt-1">Accesos activos</p>
            </div>
          </template>
        </Card>
        <Card
          class="cursor-pointer hover:surface-hover transition-shadow"
          @click="router.push({ name: 'Encomiendas' })"
        >
          <template #content>
            <div class="text-center">
              <p class="text-3xl font-bold m-0" style="color: var(--p-primary-400)">
                {{ dashboard.encomiendas || encomiendas.length || 0 }}
              </p>
              <p class="text-xs text-surface-500 m-0 mt-1">Encomiendas</p>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="text-center">
              <p class="text-3xl font-bold m-0" style="color: var(--p-primary-400)">
                {{ dashboard.totalUnidades || 0 }}
              </p>
              <p class="text-xs text-surface-500 m-0 mt-1">Unidades</p>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="text-center">
              <p class="text-3xl font-bold m-0" style="color: var(--p-primary-400)">
                {{ dashboard.residentesActivos || 0 }}
              </p>
              <p class="text-xs text-surface-500 m-0 mt-1">Residentes</p>
            </div>
          </template>
        </Card>
      </div>

      <!-- Últimos movimientos -->
      <Card
        v-if="dashboard.accesos?.ultimosMovimientos?.length"
        class="cursor-pointer hover:surface-hover transition-shadow"
        @click="router.push({ name: 'Visitas' })"
      >
        <template #title>Últimos accesos</template>
        <template #content>
          <div class="flex flex-col gap-2">
            <div
              v-for="(mov, idx) in dashboard.accesos.ultimosMovimientos.slice(0, 5)"
              :key="idx"
              class="flex items-center justify-between p-2 border-round hover:bg-emphasis"
            >
              <div class="flex items-center gap-3">
                <i class="pi pi-arrow-right text-green-500"></i>
                <div>
                  <p class="text-sm font-medium m-0">{{ mov.nombre }}</p>
                  <p class="text-xs text-surface-500 m-0">
                    Casa {{ mov.unidad }} · {{ formatearFecha(mov.fecha) }}
                  </p>
                </div>
              </div>
              <span class="text-xs text-surface-400">{{ mov.tipo }}</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Encomiendas pendientes -->
      <Card
        v-if="encomiendas.length > 0"
        class="cursor-pointer hover:surface-hover transition-shadow"
        @click="router.push({ name: 'Encomiendas' })"
      >
        <template #title>
          <div class="flex items-center justify-between">
            <span>Encomiendas pendientes</span>
            <Badge :value="encomiendas.length" severity="warn" />
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-2">
            <div
              v-for="env in encomiendas.slice(0, 4)"
              :key="env.id"
              class="flex items-center justify-between p-2 border-round hover:bg-emphasis"
            >
              <div class="flex items-center gap-3">
                <i class="pi pi-inbox text-lg text-primary"></i>
                <div>
                  <p class="text-sm font-medium m-0">{{ env.descripcion || env.receptorNombre }}</p>
                  <p class="text-xs text-surface-500 m-0">
                    Casa {{ env.unidadNumero }} · {{ formatearFecha(env.fechaIngreso || env.fechaRecepcion) }}
                  </p>
                </div>
              </div>
              <Tag value="Pendiente" severity="warn" />
            </div>
          </div>
        </template>
      </Card>

      <!-- Autorizaciones pendientes -->
      <Card
        v-if="autorizaciones.length > 0"
        class="cursor-pointer hover:surface-hover transition-shadow"
        @click="router.push({ name: 'Autorizaciones' })"
      >
        <template #title>
          <div class="flex items-center justify-between">
            <span>Autorizaciones pendientes</span>
            <Badge :value="autorizaciones.length" severity="warn" />
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-2">
            <div
              v-for="auth in autorizaciones.slice(0, 4)"
              :key="auth.id"
              class="flex items-center justify-between p-2 border-round hover:bg-emphasis"
            >
              <div class="flex items-center gap-3">
                <i class="pi pi-verified text-lg" style="color: var(--p-primary-400)"></i>
                <div>
                  <p class="text-sm font-medium m-0">{{ auth.nombre }}</p>
                  <p class="text-xs text-surface-500 m-0">
                    Casa {{ auth.unidadNumero }} · {{ auth.tipo }}
                  </p>
                </div>
              </div>
              <span class="text-xs text-surface-400">
                {{ new Date(auth.fechaInicio).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) }}
              </span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Acceso rápido -->
      <Card>
        <template #title>Acceso rápido</template>
        <template #content>
          <div class="grid grid-cols-3 gap-2">
            <Button
              label="Registrar visita"
              icon="pi pi-user-plus"
              severity="primary"
              @click="router.push({ name: 'RegistrarVisita' })"
            />
            <Button
              label="Consultar patente"
              icon="pi pi-search"
              severity="secondary"
              variant="outlined"
              @click="router.push({ name: 'Porton' })"
            />
            <Button
              label="Accesos activos"
              icon="pi pi-shield"
              severity="secondary"
              variant="outlined"
              @click="router.push({ name: 'Visitas' })"
            />
            <Button
              label="Encomiendas"
              icon="pi pi-box"
              severity="secondary"
              variant="outlined"
              @click="router.push({ name: 'Encomiendas' })"
            />
            <Button
              label="Autorizaciones"
              icon="pi pi-verified"
              severity="secondary"
              variant="outlined"
              @click="router.push({ name: 'Autorizaciones' })"
            />
            <Button
              label="Bitácora"
              icon="pi pi-book"
              severity="secondary"
              variant="outlined"
              @click="router.push({ name: 'Bitacora' })"
            />
            <Button
              label="Solicitudes"
              icon="pi pi-pencil"
              severity="secondary"
              variant="outlined"
              @click="router.push({ name: 'Solicitudes' })"
            />
          </div>
        </template>
      </Card>

      <Dialog
        v-model:visible="showNovedadDialog"
        header="Registrar novedad"
        :modal="true"
        class="w-full max-w-md"
      >
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Clasificación</label>
            <Select
              v-model="nuevaNovedad.clasificacion"
              :options="clasificaciones"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona clasificación"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Descripción</label>
            <Textarea
              v-model="nuevaNovedad.observaciones"
              rows="4"
              placeholder="Describe la novedad..."
              :autoResize="true"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Foto (opcional)</label>
            <InputText
              v-model="nuevaNovedad.fotoUrl"
              placeholder="URL de la foto"
            />
          </div>
        </div>
        <template #footer>
          <Button
            label="Cancelar"
            severity="secondary"
            variant="text"
            @click="showNovedadDialog = false"
          />
          <Button
            label="Registrar"
            icon="pi pi-check"
            :disabled="!nuevaNovedad.observaciones.trim()"
            :loading="enviandoNovedad"
            @click="registrarNovedad"
          />
        </template>
      </Dialog>
    </template>
  </div>
</template>
