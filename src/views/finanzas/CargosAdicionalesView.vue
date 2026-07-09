<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { finanzasService } from "@/services/finanzasService";
import { useUnidades } from "@/composables/useUnidades";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Textarea from "primevue/textarea";
import Select from "primevue/select";
import DatePicker from "primevue/datepicker";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";

const auth = useAuthStore();
const { unidades, cargarUnidades } = useUnidades();

const loading = ref(true);
const error = ref(null);
const cargos = ref([]);
const categorias = ref([]);

const filtroEstado = ref(null);

const showCrear = ref(false);
const showAnular = ref(false);
const cargoSeleccionado = ref(null);
const enviando = ref(false);

const form = ref({
  unidadId: null,
  categoriaId: null,
  descripcion: "",
  monto: null,
  fechaCargo: new Date(),
  fechaVencimiento: null,
  casoId: null,
});
const motivoAnulacion = ref("");

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const [cargosRes, catRes] = await Promise.all([
      finanzasService.listarCargosAdicionales(cid, { estado: filtroEstado.value || undefined }),
      finanzasService.listarCategorias(cid),
    ]);
    cargos.value = cargosRes.data;
    categorias.value = catRes.data;
  } catch (e) {
    console.error("Error al cargar cargos adicionales", e);
    error.value = "No se pudieron cargar los cargos adicionales";
  } finally {
    loading.value = false;
  }
}

function abrirCrear() {
  form.value = {
    unidadId: null,
    categoriaId: null,
    descripcion: "",
    monto: null,
    fechaCargo: new Date(),
    fechaVencimiento: null,
    casoId: null,
  };
  showCrear.value = true;
}

async function crearCargo() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    const payload = {
      ...form.value,
      fechaCargo: formatearFecha(form.value.fechaCargo),
      fechaVencimiento: form.value.fechaVencimiento ? formatearFecha(form.value.fechaVencimiento) : null,
    };
    await finanzasService.crearCargoAdicional(cid, payload);
    showCrear.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al crear cargo adicional", e);
  } finally {
    enviando.value = false;
  }
}

function abrirAnular(cargo) {
  cargoSeleccionado.value = cargo;
  motivoAnulacion.value = "";
  showAnular.value = true;
}

async function anularCargo() {
  const cid = auth.condominioActualId;
  if (!cid || !cargoSeleccionado.value) return;
  enviando.value = true;
  try {
    await finanzasService.anularCargoAdicional(cid, cargoSeleccionado.value.id, motivoAnulacion.value);
    showAnular.value = false;
    cargoSeleccionado.value = null;
    await cargar();
  } catch (e) {
    console.error("Error al anular cargo adicional", e);
  } finally {
    enviando.value = false;
  }
}

function formatearFecha(d) {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const categoriasActivas = computed(() =>
  categorias.value.filter((c) => c.activa !== false)
);

const estadoSeverity = (estado) => {
  if (estado === "PENDIENTE" || estado === "ACTIVO") return "warn";
  if (estado === "PAGADO") return "success";
  if (estado === "ANULADO") return "danger";
  return "info";
};

onMounted(() => {
  cargarUnidades();
  cargar();
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold m-0">Cargos Adicionales</h1>
      <Button label="Nuevo cargo" icon="pi pi-plus" size="small" @click="abrirCrear" />
    </div>

    <Card>
      <template #content>
        <div class="flex gap-2 items-center">
          <Select
            v-model="filtroEstado"
            :options="[
              { label: 'Todos', value: null },
              { label: 'Pendiente', value: 'PENDIENTE' },
              { label: 'Pagado', value: 'PAGADO' },
              { label: 'Anulado', value: 'ANULADO' },
            ]"
            optionLabel="label"
            optionValue="value"
            placeholder="Estado"
            class="w-40"
            size="small"
            @change="cargar"
          />
        </div>
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!cargos.length" class="text-center text-surface-400 py-8">
        No hay cargos adicionales registrados
      </div>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="c in cargos"
          :key="c.id"
          class="surface-card p-3 border-round shadow-1"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ c.descripcion }}</span>
                <Tag :value="c.estado" :severity="estadoSeverity(c.estado)" size="small" />
              </div>
              <div class="text-sm text-surface-500">
                Unidad {{ c.unidadNumero }} — {{ c.categoriaNombre }}
                <span v-if="c.fechaVencimiento"> — Vence: {{ c.fechaVencimiento }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-lg">{{ c.monto?.toLocaleString("es-CL") }}</span>
              <Button
                v-if="c.estado !== 'ANULADO'"
                icon="pi pi-ban"
                severity="danger"
                variant="text"
                size="small"
                @click="abrirAnular(c)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <Dialog v-model:visible="showCrear" header="Nuevo cargo adicional" modal :style="{ width: '95%', maxWidth: '500px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Unidad</label>
          <Select
            v-model="form.unidadId"
            :options="unidades"
            optionLabel="numero"
            optionValue="id"
            placeholder="Seleccionar"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Categoría</label>
          <Select
            v-model="form.categoriaId"
            :options="categoriasActivas"
            optionLabel="nombre"
            optionValue="id"
            placeholder="Seleccionar"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Descripción</label>
          <Textarea v-model="form.descripcion" rows="2" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Monto</label>
          <InputNumber v-model="form.monto" :min="0" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Fecha cargo</label>
          <DatePicker v-model="form.fechaCargo" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Fecha vencimiento</label>
          <DatePicker v-model="form.fechaVencimiento" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showCrear = false" />
        <Button label="Guardar" :loading="enviando" @click="crearCargo" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showAnular" header="Anular cargo" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <p class="text-sm m-0">¿Estás seguro de anular este cargo?</p>
        <p class="text-sm text-surface-500 m-0">{{ cargoSeleccionado?.descripcion }} — {{ cargoSeleccionado?.monto?.toLocaleString("es-CL") }}</p>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Motivo</label>
          <Textarea v-model="motivoAnulacion" rows="2" placeholder="Indica el motivo" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showAnular = false" />
        <Button label="Anular" severity="danger" :loading="enviando" @click="anularCargo" />
      </template>
    </Dialog>
  </div>
</template>
