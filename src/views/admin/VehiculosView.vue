<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { vehiculosService } from "@/services/vehiculosService";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const auth = useAuthStore();
const confirm = useConfirm();

const cid = () => auth.condominioActualId;

const loading = ref(true);
const error = ref(null);
const vehiculos = ref([]);
const filtroPatente = ref("");

const showCrear = ref(false);
const showEditar = ref(false);
const showEstacionamiento = ref(false);
const vehiculoEditando = ref(null);
const enviando = ref(false);

const formCrear = ref({ patente: "", marca: "", modelo: "", color: "", tipo: "AUTO", propietarioNombre: "" });
const formEditar = ref({ patente: "", marca: "", modelo: "", color: "", tipo: "AUTO", propietarioNombre: "" });
const formEstacionamiento = ref({ numero: "" });

const tiposVehiculo = [
  { label: "Auto", value: "AUTO" },
  { label: "Camioneta", value: "CAMIONETA" },
  { label: "Moto", value: "MOTO" },
  { label: "Otro", value: "OTRO" },
];

async function cargar() {
  if (!cid()) return;
  loading.value = true;
  error.value = null;
  try {
    const params = {};
    if (filtroPatente.value) params.patente = filtroPatente.value;
    const { data } = await vehiculosService.listar(cid(), params);
    vehiculos.value = data;
  } catch (e) {
    console.error("Error al cargar vehículos", e);
    error.value = "No se pudieron cargar los vehículos";
  } finally {
    loading.value = false;
  }
}

function abrirCrear() {
  formCrear.value = { patente: "", marca: "", modelo: "", color: "", tipo: "AUTO", propietarioNombre: "" };
  showCrear.value = true;
}

async function crearVehiculo() {
  if (!cid()) return;
  enviando.value = true;
  try {
    await vehiculosService.crear(cid(), formCrear.value);
    showCrear.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al crear vehículo", e);
  } finally {
    enviando.value = false;
  }
}

function abrirEditar(v) {
  vehiculoEditando.value = v;
  formEditar.value = { patente: v.patente, marca: v.marca, modelo: v.modelo, color: v.color, tipo: v.tipo, propietarioNombre: v.propietarioNombre || "" };
  showEditar.value = true;
}

async function editarVehiculo() {
  if (!cid() || !vehiculoEditando.value) return;
  enviando.value = true;
  try {
    await vehiculosService.actualizar(cid(), vehiculoEditando.value.id, formEditar.value);
    showEditar.value = false;
    vehiculoEditando.value = null;
    await cargar();
  } catch (e) {
    console.error("Error al editar vehículo", e);
  } finally {
    enviando.value = false;
  }
}

function confirmarDesactivar(v) {
  confirm.require({
    message: `¿Desactivar vehículo ${v.patente}?`,
    header: "Confirmar",
    acceptLabel: "Desactivar",
    rejectLabel: "Cancelar",
    accept: () => desactivarVehiculo(v),
  });
}

async function desactivarVehiculo(v) {
  if (!cid()) return;
  try {
    await vehiculosService.desactivar(cid(), v.id);
    await cargar();
  } catch (e) {
    console.error("Error al desactivar vehículo", e);
  }
}

function abrirEstacionamiento(v) {
  vehiculoEditando.value = v;
  formEstacionamiento.value = { numero: "" };
  showEstacionamiento.value = true;
}

async function vincularEstacionamiento() {
  if (!cid() || !vehiculoEditando.value) return;
  enviando.value = true;
  try {
    await vehiculosService.vincularEstacionamiento(cid(), vehiculoEditando.value.id, formEstacionamiento.value);
    showEstacionamiento.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al vincular estacionamiento", e);
  } finally {
    enviando.value = false;
  }
}

async function desvincularEstacionamiento(v) {
  if (!cid()) return;
  try {
    await vehiculosService.desvincularEstacionamiento(cid(), v.id);
    await cargar();
  } catch (e) {
    console.error("Error al desvincular estacionamiento", e);
  }
}

let timeout;
function onBuscar() {
  clearTimeout(timeout);
  timeout = setTimeout(cargar, 300);
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold m-0">Vehículos</h1>
      <Button label="Nuevo vehículo" icon="pi pi-plus" size="small" @click="abrirCrear" />
    </div>

    <Card>
      <template #content>
        <InputText v-model="filtroPatente" placeholder="Buscar por patente..." class="w-full uppercase" @input="onBuscar" />
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!vehiculos.length" class="text-center text-surface-400 py-8">No hay vehículos registrados</div>
      <div v-else class="flex flex-col gap-2">
        <div v-for="v in vehiculos" :key="v.id" class="surface-card p-3 border-round shadow-1">
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold font-mono">{{ v.patente }}</span>
                <Tag :value="v.tipo" severity="info" size="small" />
                <Tag v-if="!v.activo" value="Baja" severity="secondary" size="small" />
              </div>
              <span class="text-sm text-surface-500">{{ v.marca }} {{ v.modelo }} — {{ v.color }}</span>
              <span v-if="v.propietarioNombre" class="text-xs text-surface-400 ml-2">{{ v.propietarioNombre }}</span>
              <div v-if="v.estacionamientos?.length" class="text-xs text-surface-400">
                Est.: {{ v.estacionamientos.map(e => `N°${e.numero}`).join(', ') }}
              </div>
            </div>
            <div class="flex items-center gap-1">
              <Button v-if="v.activo" icon="pi pi-car" variant="text" size="small" severity="success" @click="abrirEstacionamiento(v)" />
              <Button icon="pi pi-pencil" variant="text" size="small" severity="secondary" @click="abrirEditar(v)" />
              <Button v-if="v.activo" icon="pi pi-trash" variant="text" size="small" severity="danger" @click="confirmarDesactivar(v)" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <Dialog v-model:visible="showCrear" header="Nuevo vehículo" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1"><label class="text-sm">Patente</label><InputText v-model="formCrear.patente" class="uppercase" /></div>
        <div class="flex flex-col gap-1"><label class="text-sm">Marca</label><InputText v-model="formCrear.marca" /></div>
        <div class="flex flex-col gap-1"><label class="text-sm">Modelo</label><InputText v-model="formCrear.modelo" /></div>
        <div class="flex flex-col gap-1"><label class="text-sm">Color</label><InputText v-model="formCrear.color" /></div>
        <div class="flex flex-col gap-1"><label class="text-sm">Tipo</label><Select v-model="formCrear.tipo" :options="tiposVehiculo" optionLabel="label" optionValue="value" /></div>
        <div class="flex flex-col gap-1"><label class="text-sm">Propietario</label><InputText v-model="formCrear.propietarioNombre" placeholder="Opcional" /></div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showCrear = false" />
        <Button label="Crear" :loading="enviando" @click="crearVehiculo" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showEditar" header="Editar vehículo" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1"><label class="text-sm">Patente</label><InputText v-model="formEditar.patente" class="uppercase" /></div>
        <div class="flex flex-col gap-1"><label class="text-sm">Marca</label><InputText v-model="formEditar.marca" /></div>
        <div class="flex flex-col gap-1"><label class="text-sm">Modelo</label><InputText v-model="formEditar.modelo" /></div>
        <div class="flex flex-col gap-1"><label class="text-sm">Color</label><InputText v-model="formEditar.color" /></div>
        <div class="flex flex-col gap-1"><label class="text-sm">Tipo</label><Select v-model="formEditar.tipo" :options="tiposVehiculo" optionLabel="label" optionValue="value" /></div>
        <div class="flex flex-col gap-1"><label class="text-sm">Propietario</label><InputText v-model="formEditar.propietarioNombre" /></div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showEditar = false" />
        <Button label="Guardar" :loading="enviando" @click="editarVehiculo" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showEstacionamiento" header="Vincular estacionamiento" modal :style="{ width: '95%', maxWidth: '350px' }">
      <p class="text-sm text-surface-500 m-0 mb-3">Para {{ vehiculoEditando?.patente }}</p>
      <div class="flex flex-col gap-1">
        <label class="text-sm">N° estacionamiento</label>
        <InputText v-model="formEstacionamiento.numero" placeholder="Ej: 12" />
      </div>
      <div class="flex justify-between mt-3">
        <Button v-if="vehiculoEditando?.estacionamientos?.length" label="Desvincular" severity="danger" variant="text" @click="desvincularEstacionamiento(vehiculoEditando); showEstacionamiento = false" />
        <Button label="Vincular" :loading="enviando" @click="vincularEstacionamiento" />
      </div>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>
