<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { casosService } from "@/services/casosService";

import Card from "primevue/card";
import Select from "primevue/select";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Message from "primevue/message";
import Button from "primevue/button";
import Divider from "primevue/divider";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";

const router = useRouter();
const auth = useAuthStore();

const seccionActiva = ref(null);
const casos = ref([]);
const loadingCasos = ref(false);
const enviando = ref(false);
const error = ref(null);
const exito = ref(null);

const prioridades = [
  { label: "Informativo", value: "INFO" },
  { label: "Normal", value: "NORMAL" },
  { label: "Urgente", value: "URGENTE" },
  { label: "Emergencia", value: "EMERGENCIA" },
];

const form = ref({
  titulo: "",
  descripcion: "",
  prioridad: "NORMAL",
});

function severityPrioridad(p) {
  if (p === "EMERGENCIA") return "danger";
  if (p === "URGENTE") return "warn";
  if (p === "NORMAL") return "success";
  return "info";
}

function severityEstado(e) {
  if (e === "ABIERTO") return "info";
  if (e === "EN_GESTION") return "warn";
  if (e === "RESUELTO") return "success";
  if (e === "CERRADO") return "contrast";
  return "info";
}

function formatearFecha(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

async function cargarCasos() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loadingCasos.value = true;
  try {
    const { data } = await casosService.listar(cid);
    casos.value = data;
  } catch (e) {
    console.error("Error al cargar casos", e);
  } finally {
    loadingCasos.value = false;
  }
}

async function enviarCaso() {
  if (!form.value.titulo.trim()) return;
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  error.value = null;
  exito.value = null;
  try {
    await casosService.abrir(cid, {
      titulo: form.value.titulo,
      descripcion: form.value.descripcion || null,
      prioridad: form.value.prioridad,
    });
    form.value = { titulo: "", descripcion: "", prioridad: "NORMAL" };
    exito.value = "Caso creado correctamente";
    await cargarCasos();
  } catch (e) {
    console.error("Error al crear caso", e);
    error.value = e.response?.data?.message || "Error al crear el caso";
  } finally {
    enviando.value = false;
  }
}

onMounted(cargarCasos);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <h2 class="text-lg font-bold">Gestiones</h2>

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
              <p class="text-xs text-surface-400">Preautorizar ingreso de visita</p>
            </div>
          </div>
          <span class="text-surface-400">{{ seccionActiva === "visita" ? "∨" : "›" }}</span>
        </div>
        <div v-if="seccionActiva === 'visita'" class="px-4 pb-4 border-t border-surface-200">
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

    <Card>
      <template #content>
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:surface-hover"
          @click="seccionActiva = seccionActiva === 'reserva' ? null : 'reserva'"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">📅</span>
            <div>
              <p class="font-medium">Reservar área común</p>
              <p class="text-xs text-surface-400">Quincho, sala multiuso, cancha</p>
            </div>
          </div>
          <span class="text-surface-400">{{ seccionActiva === "reserva" ? "∨" : "›" }}</span>
        </div>
        <div v-if="seccionActiva === 'reserva'" class="px-4 pb-4 border-t border-surface-200">
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

    <Card>
      <template #content>
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:surface-hover"
          @click="seccionActiva = seccionActiva === 'reclamo' ? null : 'reclamo'"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">📝</span>
            <div>
              <p class="font-medium">Reclamos y casos</p>
              <p class="text-xs text-surface-400">Reclamos, sugerencias y solicitudes</p>
            </div>
          </div>
          <span class="text-surface-400">{{ seccionActiva === "reclamo" ? "∨" : "›" }}</span>
        </div>
        <div v-if="seccionActiva === 'reclamo'" class="px-4 pb-4 border-t border-surface-200">
          <div class="flex flex-col gap-3 pt-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">Título *</label>
              <InputText v-model="form.titulo" placeholder="Resume tu reclamo o solicitud" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">Prioridad</label>
              <Select v-model="form.prioridad" :options="prioridades" optionLabel="label" optionValue="value" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">Descripción</label>
              <Textarea v-model="form.descripcion" placeholder="Describe tu caso en detalle" rows="3" :autoResize="true" />
            </div>
            <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
            <Message v-if="exito" severity="success" :closable="false">{{ exito }}</Message>
            <Button label="Enviar caso" size="small" :loading="enviando" :disabled="!form.titulo.trim()" @click="enviarCaso" />

            <Divider class="text-xs">Casos anteriores</Divider>
            <Skeleton v-if="loadingCasos" width="100%" height="80px" />
            <div v-else-if="!casos.length" class="flex flex-col items-center py-4 gap-2">
              <span class="text-3xl">📭</span>
              <p class="text-sm text-surface-500">No tienes casos anteriores</p>
            </div>
            <div v-else class="flex flex-col gap-2">
              <div
                v-for="c in casos.slice(0, 5)"
                :key="c.id"
                class="surface-50 p-2 border-round cursor-pointer hover:surface-100"
                @click="router.push({ name: 'MisCasos' })"
              >
                <div class="flex items-center gap-2">
                  <span class="text-xs text-surface-400">#{{ c.numero }}</span>
                  <span class="text-sm font-medium">{{ c.titulo }}</span>
                  <Tag :value="c.prioridad" :severity="severityPrioridad(c.prioridad)" size="small" />
                </div>
                <div class="text-xs text-surface-400 flex items-center gap-2 mt-1">
                  <Tag :value="c.estado" :severity="severityEstado(c.estado)" size="small" />
                  <span>{{ formatearFecha(c.abiertoEn) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:surface-hover"
          @click="router.push({ name: 'MisEncomiendas' })"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">📦</span>
            <div>
              <p class="font-medium">Mis encomiendas</p>
              <p class="text-xs text-surface-400">Paquetes pendientes de retiro</p>
            </div>
          </div>
          <span class="text-surface-400">›</span>
        </div>
      </template>
    </Card>
  </div>
</template>
