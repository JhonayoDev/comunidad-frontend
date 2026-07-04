<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { casosService } from "@/services/casosService";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Textarea from "primevue/textarea";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Divider from "primevue/divider";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";

const auth = useAuthStore();

const loading = ref(true);
const error = ref(null);
const casos = ref([]);

const filtroEstado = ref(null);
const showDetalle = ref(false);
const showSeguimiento = ref(false);
const showCerrar = ref(false);
const casoActual = ref(null);
const detalle = ref(null);
const enviando = ref(false);

const formSeguimiento = ref({ comentario: "", nuevoEstado: null });
const resumenCierre = ref("");

const estados = [
  { label: "Todos", value: null },
  { label: "Abierto", value: "ABIERTO" },
  { label: "En gestión", value: "EN_GESTION" },
  { label: "Resuelto", value: "RESUELTO" },
  { label: "Cerrado", value: "CERRADO" },
];

function severityEstado(e) {
  if (e === "ABIERTO") return "info";
  if (e === "EN_GESTION") return "warn";
  if (e === "RESUELTO") return "success";
  if (e === "CERRADO") return "contrast";
  return "info";
}

function severityPrioridad(p) {
  if (p === "EMERGENCIA") return "danger";
  if (p === "URGENTE") return "warn";
  if (p === "NORMAL") return "success";
  return "info";
}

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const params = {};
    if (filtroEstado.value) params.estado = filtroEstado.value;
    const { data } = await casosService.listar(cid, params);
    casos.value = data;
  } catch (e) {
    console.error("Error al cargar casos", e);
    error.value = "No se pudieron cargar los casos";
  } finally {
    loading.value = false;
  }
}

async function verDetalle(c) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  casoActual.value = c;
  try {
    const { data } = await casosService.obtener(cid, c.id);
    detalle.value = data;
    showDetalle.value = true;
  } catch (e) {
    console.error("Error al cargar detalle del caso", e);
  }
}

function abrirSeguimiento() {
  formSeguimiento.value = { comentario: "", nuevoEstado: null };
  showSeguimiento.value = true;
}

async function agregarSeguimiento() {
  const cid = auth.condominioActualId;
  if (!cid || !casoActual.value) return;
  enviando.value = true;
  try {
    await casosService.agregarSeguimiento(cid, casoActual.value.id, {
      comentario: formSeguimiento.value.comentario,
      nuevoEstado: formSeguimiento.value.nuevoEstado || null,
    });
    showSeguimiento.value = false;
    await verDetalle(casoSeguimiento.value);
  } catch (e) {
    console.error("Error al agregar seguimiento", e);
  } finally {
    enviando.value = false;
  }
}

let casoSeguimiento = null;

async function abrirCerrar(c) {
  casoActual.value = c;
  resumenCierre.value = "";
  showCerrar.value = true;
}

async function cerrarCaso() {
  const cid = auth.condominioActualId;
  if (!cid || !casoActual.value) return;
  enviando.value = true;
  try {
    await casosService.cerrar(cid, casoActual.value.id, resumenCierre.value);
    showCerrar.value = false;
    casoActual.value = null;
    showDetalle.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al cerrar caso", e);
  } finally {
    enviando.value = false;
  }
}

function formatearFecha(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <h1 class="text-xl font-bold m-0">Casos</h1>

    <Card>
      <template #content>
        <div class="flex gap-2 items-center">
          <Select
            v-model="filtroEstado"
            :options="estados"
            optionLabel="label"
            optionValue="value"
            placeholder="Filtrar por estado"
            class="w-44"
            size="small"
            @change="cargar"
          />
        </div>
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!casos.length" class="text-center text-surface-400 py-8">
        No hay casos registrados
      </div>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="c in casos"
          :key="c.id"
          class="surface-card p-3 border-round shadow-1 flex items-center justify-between cursor-pointer hover:shadow-3 transition-shadow"
          @click="verDetalle(c)"
        >
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-surface-400">#{{ c.numero }}</span>
              <span class="font-medium">{{ c.titulo }}</span>
              <Tag :value="c.prioridad" :severity="severityPrioridad(c.prioridad)" size="small" />
            </div>
            <div class="text-xs text-surface-500 mt-1">
              {{ c.abiertoPorNombre }} · {{ formatearFecha(c.abiertoEn) }}
            </div>
          </div>
          <Tag :value="c.estado" :severity="severityEstado(c.estado)" />
        </div>
      </div>
    </template>

    <Dialog v-model:visible="showDetalle" header="Detalle del caso" modal :style="{ width: '95%', maxWidth: '600px' }">
      <template v-if="detalle">
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs text-surface-400">#{{ detalle.numero }}</span>
            <span class="font-bold text-lg">{{ detalle.titulo }}</span>
            <Tag :value="detalle.prioridad" :severity="severityPrioridad(detalle.prioridad)" size="small" />
            <Tag :value="detalle.estado" :severity="severityEstado(detalle.estado)" size="small" />
          </div>
          <p v-if="detalle.descripcion" class="text-sm text-surface-700 m-0 whitespace-pre-line">{{ detalle.descripcion }}</p>
          <div class="text-xs text-surface-400">
            Abierto por {{ detalle.abiertoPorNombre }} · {{ formatearFecha(detalle.abiertoEn) }}
          </div>

          <Divider v-if="detalle.seguimientos?.length" align="left">
            <span class="text-xs font-semibold text-surface-500">Seguimientos</span>
          </Divider>
          <div v-if="detalle.seguimientos?.length" class="flex flex-col gap-2">
            <div
              v-for="s in detalle.seguimientos"
              :key="s.id"
              class="p-2 surface-50 border-round text-sm"
            >
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ s.realizadoPorNombre }}</span>
                <Tag v-if="s.estadoResultante" :value="s.estadoResultante" :severity="severityEstado(s.estadoResultante)" size="small" />
                <span class="text-xs text-surface-400">{{ formatearFecha(s.creadoEn) }}</span>
              </div>
              <p class="m-0 mt-1 whitespace-pre-line">{{ s.comentario }}</p>
            </div>
          </div>

          <div v-if="detalle.estado === 'CERRADO'" class="mt-2 p-2 surface-50 border-round">
            <p class="text-xs font-semibold m-0 text-surface-500">Resumen de cierre</p>
            <p class="text-sm m-0 whitespace-pre-line">{{ detalle.resumenCierre }}</p>
            <p class="text-xs text-surface-400 mt-1">Cerrado por {{ detalle.cerradoPorNombre }} · {{ formatearFecha(detalle.cerradoEn) }}</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2">
          <Button
            v-if="detalle && detalle.estado !== 'CERRADO'"
            label="Seguimiento"
            icon="pi pi-comment"
            severity="secondary"
            @click="abrirSeguimiento"
          />
          <Button
            v-if="detalle && detalle.estado !== 'CERRADO'"
            label="Cerrar caso"
            icon="pi pi-check"
            severity="danger"
            @click="showCerrar = true"
          />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="showSeguimiento" header="Agregar seguimiento" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Comentario</label>
          <Textarea v-model="formSeguimiento.comentario" rows="3" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Nuevo estado (opcional)</label>
          <Select
            v-model="formSeguimiento.nuevoEstado"
            :options="estados.filter(e => e.value && e.value !== 'CERRADO')"
            optionLabel="label"
            optionValue="value"
            placeholder="Sin cambio"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showSeguimiento = false" />
        <Button label="Guardar" :loading="enviando" @click="agregarSeguimiento" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showCerrar" header="Cerrar caso" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <p class="text-sm m-0">¿Estás seguro de cerrar este caso? Esta acción es irreversible.</p>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Resumen de cierre</label>
          <Textarea v-model="resumenCierre" rows="3" placeholder="Explica cómo se resolvió" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showCerrar = false" />
        <Button label="Cerrar caso" severity="danger" :loading="enviando" @click="cerrarCaso" />
      </template>
    </Dialog>
  </div>
</template>
