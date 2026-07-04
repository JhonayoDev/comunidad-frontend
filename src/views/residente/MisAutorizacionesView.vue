<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { autorizacionesService } from "@/services/autorizacionesService";

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
const autorizaciones = ref([]);
const unidades = ref([]);
const loading = ref(true);
const error = ref(null);
const showDialog = ref(false);
const enviando = ref(false);

const tiposAcceso = [
  { label: "Visita", value: "VISITA" },
  { label: "Delivery", value: "DELIVERY" },
  { label: "Uber", value: "UBER" },
  { label: "Servicio", value: "SERVICIO" },
  { label: "Técnico", value: "TECNICO" },
  { label: "Otro", value: "OTRO" },
];

const form = ref({
  unidadId: "",
  tipo: "VISITA",
  nombre: "",
  rut: "",
  telefono: "",
  empresa: "",
  patenteVisitante: "",
  cantidadPersonas: 1,
  fechaInicio: "",
  fechaFin: "",
  observacion: "",
});

const errores = ref({});

const tipoLabels = {
  VISITA: "Visita",
  DELIVERY: "Delivery",
  UBER: "Uber",
  SERVICIO: "Servicio",
  TECNICO: "Técnico",
  OTRO: "Otro",
};

function severityEstado(estado) {
  if (estado === "PENDIENTE") return "warn";
  if (estado === "UTILIZADA") return "info";
  if (estado === "EXPIRADA") return "contrast";
  if (estado === "CANCELADA") return "danger";
  return "warn";
}

function formatearFecha(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatearRango(inicio, fin) {
  if (!inicio || !fin) return "";
  const di = new Date(inicio);
  const df = new Date(fin);
  const mismoDia = di.toDateString() === df.toDateString();
  if (mismoDia) {
    return `${di.toLocaleDateString("es-CL", { day: "numeric", month: "short" })} · ${di.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} - ${df.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `${formatearFecha(inicio)} - ${formatearFecha(fin)}`;
}

function ahoraLocal() {
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  return ahora.toISOString().slice(0, 16);
}

function horaFinMinima() {
  if (!form.value.fechaInicio) return ahoraLocal();
  return form.value.fechaInicio;
}

function validar() {
  errores.value = {};
  if (!form.value.unidadId) errores.value.unidadId = "Selecciona una unidad";
  if (!form.value.nombre.trim()) errores.value.nombre = "Nombre obligatorio";
  if (!form.value.fechaInicio) errores.value.fechaInicio = "Fecha inicio obligatoria";
  if (!form.value.fechaFin) errores.value.fechaFin = "Fecha fin obligatoria";
  if (form.value.fechaInicio && form.value.fechaFin && form.value.fechaInicio > form.value.fechaFin) {
    errores.value.fechaFin = "Debe ser posterior a la fecha de inicio";
  }
  return Object.keys(errores.value).length === 0;
}

function abrirDialog() {
  form.value = {
    unidadId: unidades.value[0]?.id || "",
    tipo: "VISITA",
    nombre: "",
    rut: "",
    telefono: "",
    empresa: "",
    patenteVisitante: "",
    cantidadPersonas: 1,
    fechaInicio: ahoraLocal(),
    fechaFin: "",
    observacion: "",
  };
  errores.value = {};
  showDialog.value = true;
}

async function crearAutorizacion() {
  if (!validar()) return;
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    await autorizacionesService.crear(cid, {
      unidadId: form.value.unidadId,
      tipo: form.value.tipo,
      nombre: form.value.nombre,
      rut: form.value.rut || null,
      telefono: form.value.telefono || null,
      empresa: form.value.empresa || null,
      patenteVisitante: form.value.patenteVisitante?.toUpperCase() || null,
      cantidadPersonas: form.value.cantidadPersonas || 1,
      fechaInicio: new Date(form.value.fechaInicio).toISOString(),
      fechaFin: new Date(form.value.fechaFin).toISOString(),
      observacion: form.value.observacion || null,
    });
    showDialog.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al crear autorización", e);
    error.value = e.response?.data?.message || "Error al crear autorización";
  } finally {
    enviando.value = false;
  }
}

async function cancelarAutorizacion(id) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    await autorizacionesService.cancelar(cid, id);
    await cargar();
  } catch (e) {
    console.error("Error al cancelar autorización", e);
    error.value = e.response?.data?.message || "Error al cancelar autorización";
  }
}

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await autorizacionesService.misAutorizaciones(cid);
    autorizaciones.value = res.data || [];
  } catch (e) {
    console.error("Error al cargar autorizaciones", e);
    error.value = "Error al cargar autorizaciones";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    const res = await import("@/services/perfilService").then(m =>
      m.perfilService.getDashboardResidente(cid)
    );
    unidades.value = res.data?.unidades || [];
  } catch (e) {
    console.error("Error al cargar unidades", e);
  }
  await cargar();
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold m-0">Mis autorizaciones</h2>
      <Button
        label="Nueva"
        icon="pi pi-plus"
        size="small"
        @click="abrirDialog"
      />
    </div>

    <template v-if="loading">
      <div class="flex flex-col gap-3">
        <Card v-for="i in 3" :key="i">
          <template #content>
            <Skeleton width="100%" height="4.5rem" />
          </template>
        </Card>
      </div>
    </template>

    <template v-else-if="autorizaciones.length === 0">
      <Card>
        <template #content>
          <div class="flex flex-column align-items-center gap-2 py-4">
            <i class="pi pi-verified text-4xl text-surface-300"></i>
            <p class="text-surface-400 m-0">No tienes autorizaciones activas</p>
          </div>
        </template>
      </Card>
    </template>

    <template v-else>
      <div class="flex flex-col gap-3">
        <Card v-for="a in autorizaciones" :key="a.id">
          <template #content>
            <div class="flex items-start justify-between">
              <div class="flex flex-col gap-1 flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-semibold">{{ a.nombre }}</span>
                  <Tag
                    :value="tipoLabels[a.tipo] || a.tipo"
                    severity="info"
                  />
                </div>
                <p class="text-sm text-surface-500 m-0">
                  Casa {{ a.unidadNumero }}
                  <span v-if="a.patenteVisitante">
                    · {{ a.patenteVisitante }}
                  </span>
                  <span v-if="a.cantidadPersonas > 1">
                    · {{ a.cantidadPersonas }} personas
                  </span>
                </p>
                <p class="text-xs text-surface-400 m-0">
                  {{ formatearRango(a.fechaInicio, a.fechaFin) }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  v-if="a.estado === 'PENDIENTE'"
                  label=""
                  icon="pi pi-times"
                  severity="danger"
                  variant="text"
                  size="small"
                  @click="cancelarAutorizacion(a.id)"
                />
                <Tag
                  :value="a.estado"
                  :severity="severityEstado(a.estado)"
                />
              </div>
            </div>
            <p
              v-if="a.observacion"
              class="text-xs text-surface-500 mt-2 mb-0 italic"
            >
              {{ a.observacion }}
            </p>
          </template>
        </Card>
      </div>
    </template>

    <Dialog
      v-model:visible="showDialog"
      header="Nueva autorización"
      :modal="true"
      class="w-full max-w-lg"
    >
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Unidad *</label>
          <Select
            v-model="form.unidadId"
            :options="unidades"
            optionLabel="numero"
            optionValue="id"
            placeholder="Selecciona unidad"
            :class="{ 'p-invalid': errores.unidadId }"
          />
          <small v-if="errores.unidadId" class="text-red-500">{{ errores.unidadId }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Tipo *</label>
          <Select
            v-model="form.tipo"
            :options="tiposAcceso"
            optionLabel="label"
            optionValue="value"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Nombre *</label>
          <InputText
            v-model="form.nombre"
            placeholder="Nombre del visitante"
            :class="{ 'p-invalid': errores.nombre }"
          />
          <small v-if="errores.nombre" class="text-red-500">{{ errores.nombre }}</small>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">RUT</label>
            <InputText v-model="form.rut" placeholder="12.345.678-9" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Teléfono</label>
            <InputText v-model="form.telefono" placeholder="+56 9 1234 5678" />
          </div>
        </div>

        <div v-if="form.tipo === 'SERVICIO' || form.tipo === 'TECNICO'" class="flex flex-col gap-1">
          <label class="text-sm font-medium">Empresa</label>
          <InputText v-model="form.empresa" placeholder="Nombre de la empresa" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Patente</label>
          <InputText
            v-model="form.patenteVisitante"
            placeholder="XXBB12"
            class="uppercase"
            @input="form.patenteVisitante = form.patenteVisitante?.toUpperCase()"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Cantidad de personas</label>
          <InputText
            v-model="form.cantidadPersonas"
            type="number"
            min="1"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Desde *</label>
            <InputText
              v-model="form.fechaInicio"
              type="datetime-local"
              :min="ahoraLocal()"
              :class="{ 'p-invalid': errores.fechaInicio }"
            />
            <small v-if="errores.fechaInicio" class="text-red-500">{{ errores.fechaInicio }}</small>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Hasta *</label>
            <InputText
              v-model="form.fechaFin"
              type="datetime-local"
              :min="horaFinMinima()"
              :class="{ 'p-invalid': errores.fechaFin }"
            />
            <small v-if="errores.fechaFin" class="text-red-500">{{ errores.fechaFin }}</small>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Observación</label>
          <Textarea
            v-model="form.observacion"
            rows="2"
            placeholder="Opcional"
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
          label="Crear"
          icon="pi pi-check"
          :loading="enviando"
          @click="crearAutorizacion"
        />
      </template>
    </Dialog>
  </div>
</template>
