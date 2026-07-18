<script setup>
import { ref, onMounted } from "vue";
import { adminService } from "@/services/adminService";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import DatePicker from "primevue/datepicker";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Paginator from "primevue/paginator";

const loading = ref(true);
const error = ref(null);
const registros = ref([]);
const total = ref(0);
const page = ref(0);
const size = ref(50);

const filtros = ref({ condominioId: "", accion: "", email: "", desde: null, hasta: null });

async function cargar() {
  loading.value = true;
  error.value = null;
  try {
    const params = { page: page.value, size: size.value };
    if (filtros.value.condominioId) params.condominioId = filtros.value.condominioId;
    if (filtros.value.accion) params.accion = filtros.value.accion;
    if (filtros.value.email) params.email = filtros.value.email;
    if (filtros.value.desde) params.desde = formatearFecha(filtros.value.desde);
    if (filtros.value.hasta) params.hasta = formatearFecha(filtros.value.hasta);
    const { data } = await adminService.listarAuditoria(params);
    registros.value = data.content || [];
    total.value = data.totalElements || 0;
  } catch (e) {
    console.error("Error al cargar auditoría", e);
    error.value = "No se pudo cargar el registro de auditoría";
  } finally {
    loading.value = false;
  }
}

function formatearFecha(d) {
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleString("es-CL", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function buscar() {
  page.value = 0;
  cargar();
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <h1 class="text-xl font-bold m-0">Auditoría SaaS</h1>

    <Card>
      <template #content>
        <div class="flex flex-wrap gap-2 items-end">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Condominio ID</label>
            <InputText v-model="filtros.condominioId" placeholder="UUID" class="w-32" size="small" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Acción</label>
            <InputText v-model="filtros.accion" placeholder="Ej: CONDOMINIO_CREAR" class="w-36" size="small" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Email</label>
            <InputText v-model="filtros.email" placeholder="usuario@mail.com" class="w-36" size="small" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Desde</label>
            <DatePicker v-model="filtros.desde" size="small" class="w-28" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-surface-500">Hasta</label>
            <DatePicker v-model="filtros.hasta" size="small" class="w-28" />
          </div>
          <Button label="Buscar" icon="pi pi-search" size="small" severity="secondary" @click="buscar" />
        </div>
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!registros.length" class="text-center text-surface-400 py-8">No hay registros de auditoría</div>
      <div v-else class="flex flex-col gap-1">
        <div v-for="r in registros" :key="r.id" class="surface-card p-3 border-round shadow-1 text-sm">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <Tag :value="r.accion" size="small" severity="info" />
              <span class="font-medium">{{ r.usuarioEmail }}</span>
            </div>
            <span class="text-xs text-surface-400">{{ formatFecha(r.createdAt) }}</span>
          </div>
          <div v-if="r.detalle" class="text-xs text-surface-500 mt-1">{{ r.detalle }}</div>
          <div class="text-xs text-surface-400 mt-1">
            {{ r.recursoTipo }}:{{ r.recursoId }}
            <span v-if="r.ipAddress"> · IP: {{ r.ipAddress }}</span>
          </div>
        </div>
        <Paginator :rows="size" :totalRecords="total" :first="page * size" @page="page = $event.page; cargar()" />
      </div>
    </template>
  </div>
</template>
