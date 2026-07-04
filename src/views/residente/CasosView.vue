<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { casosService } from "@/services/casosService";

import Card from "primevue/card";
import Tag from "primevue/tag";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";

const auth = useAuthStore();
const casos = ref([]);
const loading = ref(true);
const error = ref(null);
const showDialog = ref(false);
const enviando = ref(false);

const clasificaciones = [
  { label: "Normal", value: "NORMAL" },
  { label: "Urgente", value: "URGENTE" },
  { label: "Emergencia", value: "EMERGENCIA" },
  { label: "Informativo", value: "INFO" },
];

const form = ref({
  titulo: "",
  descripcion: "",
  prioridad: "NORMAL",
});

const errores = ref({});

function severityEstado(estado) {
  if (estado === "ABIERTO") return "info";
  if (estado === "EN_GESTION") return "warn";
  if (estado === "RESUELTO") return "success";
  if (estado === "CERRADO") return "contrast";
  return "info";
}

function severityPrioridad(p) {
  if (p === "EMERGENCIA") return "danger";
  if (p === "URGENTE") return "warn";
  if (p === "NORMAL") return "success";
  return "info";
}

function formatearFecha(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function validar() {
  errores.value = {};
  if (!form.value.titulo.trim()) errores.value.titulo = "Título obligatorio";
  return Object.keys(errores.value).length === 0;
}

async function abrirCaso() {
  if (!validar()) return;
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    await casosService.abrir(cid, {
      titulo: form.value.titulo,
      descripcion: form.value.descripcion || null,
      prioridad: form.value.prioridad,
    });
    showDialog.value = false;
    form.value = { titulo: "", descripcion: "", prioridad: "NORMAL" };
    await cargar();
  } catch (e) {
    console.error("Error al abrir caso", e);
    error.value = e.response?.data?.message || "Error al abrir el caso";
  } finally {
    enviando.value = false;
  }
}

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await casosService.listar(cid);
    casos.value = res.data || [];
  } catch (e) {
    console.error("Error al cargar casos", e);
    error.value = "Error al cargar los casos";
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold m-0">Mis casos</h2>
      <Button
        label="Nuevo"
        icon="pi pi-plus"
        size="small"
        @click="showDialog = true"
      />
    </div>

    <template v-if="loading">
      <div class="flex flex-col gap-3">
        <Card v-for="i in 3" :key="i">
          <template #content>
            <Skeleton width="100%" height="4rem" />
          </template>
        </Card>
      </div>
    </template>

    <template v-else-if="casos.length === 0">
      <Card>
        <template #content>
          <div class="flex flex-column align-items-center gap-2 py-4">
            <i class="pi pi-file text-4xl text-surface-300"></i>
            <p class="text-surface-400 m-0">No tienes casos registrados</p>
          </div>
        </template>
      </Card>
    </template>

    <template v-else>
      <div class="flex flex-col gap-3">
        <Card v-for="c in casos" :key="c.id">
          <template #content>
            <div class="flex items-start justify-between">
              <div class="flex flex-col gap-1 flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-surface-400">#{{ c.numero }}</span>
                  <span class="font-semibold">{{ c.titulo }}</span>
                  <Tag
                    :value="c.prioridad"
                    :severity="severityPrioridad(c.prioridad)"
                  />
                </div>
                <p class="text-xs text-surface-500 m-0">
                  {{ c.abiertoPorNombre }} · {{ formatearFecha(c.abiertoEn) }}
                </p>
              </div>
              <Tag
                :value="c.estado"
                :severity="severityEstado(c.estado)"
              />
            </div>
          </template>
        </Card>
      </div>
    </template>

    <Dialog
      v-model:visible="showDialog"
      header="Nuevo caso"
      :modal="true"
      class="w-full max-w-md"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Título *</label>
          <InputText
            v-model="form.titulo"
            placeholder="Resume el motivo"
            :class="{ 'p-invalid': errores.titulo }"
          />
          <small v-if="errores.titulo" class="text-red-500">{{ errores.titulo }}</small>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Prioridad *</label>
          <Select
            v-model="form.prioridad"
            :options="clasificaciones"
            optionLabel="label"
            optionValue="value"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Descripción</label>
          <Textarea
            v-model="form.descripcion"
            rows="4"
            placeholder="Describe el caso en detalle..."
            :autoResize="true"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="showDialog = false"
        />
        <Button
          label="Abrir caso"
          icon="pi pi-check"
          :loading="enviando"
          @click="abrirCaso"
        />
      </template>
    </Dialog>
  </div>
</template>
