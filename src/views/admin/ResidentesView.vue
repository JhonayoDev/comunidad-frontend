<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { personasService } from "@/services/personasService";
import { unidadesService } from "@/services/unidadesService";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import { useConfirm } from "primevue/useconfirm";
import ConfirmDialog from "primevue/confirmdialog";

const auth = useAuthStore();
const confirm = useConfirm();

const loading = ref(true);
const error = ref(null);
const personas = ref([]);
const unidades = ref([]);

const busqueda = ref("");

const showPersona = ref(false);
const showCrearPersona = ref(false);
const showEditarPersona = ref(false);
const showVinculos = ref(false);
const showCrearVinculo = ref(false);
const showCrearUsuario = ref(false);
const personaSeleccionada = ref(null);
const vinculos = ref([]);
const enviando = ref(false);

const formPersona = ref({ nombre: "", email: "" });
const formEditarPersona = ref({ nombre: "", email: "" });
const formVinculo = ref({ personaId: null, unidadId: null, tipo: null, fechaInicio: null, autorizado: true });
const formUsuario = ref({ email: null, password: null });

const tiposVinculo = [
  { label: "Propietario", value: "PROPIETARIO" },
  { label: "Arrendatario", value: "ARRENDATARIO" },
  { label: "Residente adicional", value: "RESIDENTE_ADICIONAL" },
];

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loading.value = true;
  error.value = null;
  try {
    const [personasRes, unidadesRes] = await Promise.all([
      personasService.listar(cid),
      unidadesService.getUnidades(cid),
    ]);
    personas.value = personasRes.data;
    unidades.value = unidadesRes.data;
  } catch (e) {
    console.error("Error al cargar personas", e);
    error.value = "No se pudieron cargar los datos";
  } finally {
    loading.value = false;
  }
}

const personasFiltradas = computed(() => {
  if (!busqueda.value) return personas.value;
  const q = busqueda.value.toLowerCase();
  return personas.value.filter(
    (p) => p.nombre?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q),
  );
});

function abrirCrear() {
  formPersona.value = { nombre: "", email: "" };
  showCrearPersona.value = true;
}

async function crearPersona() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    await personasService.crear(cid, formPersona.value);
    showCrearPersona.value = false;
    await cargar();
  } catch (e) {
    console.error("Error al crear persona", e);
  } finally {
    enviando.value = false;
  }
}

function abrirEditar(p) {
  personaSeleccionada.value = p;
  formEditarPersona.value = { nombre: p.nombre, email: p.email };
  showEditarPersona.value = true;
}

async function editarPersona() {
  const cid = auth.condominioActualId;
  if (!cid || !personaSeleccionada.value) return;
  enviando.value = true;
  try {
    await personasService.actualizar(cid, personaSeleccionada.value.id, formEditarPersona.value);
    showEditarPersona.value = false;
    personaSeleccionada.value = null;
    await cargar();
  } catch (e) {
    console.error("Error al editar persona", e);
  } finally {
    enviando.value = false;
  }
}

function confirmarDesactivar(p) {
  confirm.require({
    message: `¿Desactivar a ${p.nombre}?`,
    header: "Confirmar",
    acceptLabel: "Desactivar",
    rejectLabel: "Cancelar",
    accept: () => desactivarPersona(p),
  });
}

async function desactivarPersona(p) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  try {
    await personasService.desactivar(cid, p.id);
    await cargar();
  } catch (e) {
    console.error("Error al desactivar persona", e);
  }
}

async function verVinculos(p) {
  const cid = auth.condominioActualId;
  if (!cid) return;
  personaSeleccionada.value = p;
  try {
    // Try to get vinculos for each unidad this persona might belong to
    const allVinculos = [];
    for (const u of unidades.value) {
      try {
        const { data } = await personasService.vinculosUnidad(cid, u.id);
        if (data?.length) {
          allVinculos.push(...data.map(v => ({ ...v, unidadNumero: u.numero })));
        }
      } catch { /* skip */ }
    }
    vinculos.value = allVinculos;
  } catch (e) {
    console.error("Error al cargar vínculos", e);
  }
  showVinculos.value = true;
}

function abrirCrearVinculo() {
  formVinculo.value = { personaId: null, unidadId: null, tipo: null, fechaInicio: new Date().toISOString().split('T')[0], autorizado: true };
  showCrearVinculo.value = true;
}

async function crearVinculo() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  enviando.value = true;
  try {
    await personasService.crearVinculo(cid, formVinculo.value);
    showCrearVinculo.value = false;
  } catch (e) {
    console.error("Error al crear vínculo", e);
  } finally {
    enviando.value = false;
  }
}

function abrirCrearUsuario(p) {
  personaSeleccionada.value = p;
  formUsuario.value = { email: "", password: "" };
  showCrearUsuario.value = true;
}

async function crearUsuario() {
  const cid = auth.condominioActualId;
  if (!cid || !personaSeleccionada.value) return;
  enviando.value = true;
  try {
    await personasService.crearUsuario(cid, personaSeleccionada.value.id, formUsuario.value);
    showCrearUsuario.value = false;
    personaSeleccionada.value = null;
  } catch (e) {
    console.error("Error al crear usuario", e);
  } finally {
    enviando.value = false;
  }
}

function formatearFecha(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CL");
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold m-0">Residentes</h1>
      <Button label="Nueva persona" icon="pi pi-plus" size="small" @click="abrirCrear" />
    </div>

    <Card>
      <template #content>
        <InputText v-model="busqueda" placeholder="Buscar por nombre o email..." class="w-full" />
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <div v-if="!personasFiltradas.length" class="text-center text-surface-400 py-8">
        No hay personas registradas
      </div>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="p in personasFiltradas"
          :key="p.id"
          class="surface-card p-3 border-round shadow-1"
        >
          <div class="flex items-center justify-between">
            <div>
              <span class="font-medium">{{ p.nombre }}</span>
              <span class="text-sm text-surface-500 ml-2">{{ p.email }}</span>
            </div>
            <div class="flex items-center gap-1">
              <Button icon="pi pi-link" variant="text" size="small" severity="secondary" @click="verVinculos(p)" />
              <Button icon="pi pi-user-plus" variant="text" size="small" severity="info" @click="abrirCrearUsuario(p)" />
              <Button icon="pi pi-pencil" variant="text" size="small" severity="secondary" @click="abrirEditar(p)" />
              <Button icon="pi pi-trash" variant="text" size="small" severity="danger" @click="confirmarDesactivar(p)" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <Dialog v-model:visible="showCrearPersona" header="Nueva persona" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Nombre</label>
          <InputText v-model="formPersona.nombre" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Email</label>
          <InputText v-model="formPersona.email" type="email" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showCrearPersona = false" />
        <Button label="Crear" :loading="enviando" @click="crearPersona" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showEditarPersona" header="Editar persona" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Nombre</label>
          <InputText v-model="formEditarPersona.nombre" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Email</label>
          <InputText v-model="formEditarPersona.email" type="email" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showEditarPersona = false" />
        <Button label="Guardar" :loading="enviando" @click="editarPersona" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showVinculos" header="Vínculos" modal :style="{ width: '95%', maxWidth: '500px' }">
      <div class="flex flex-col gap-2">
        <Button label="Nuevo vínculo" icon="pi pi-plus" size="small" @click="abrirCrearVinculo" />
        <div v-if="!vinculos.length" class="text-center text-surface-400 py-4">Sin vínculos</div>
        <div v-for="v in vinculos" :key="v.id" class="flex justify-between items-center p-2 surface-50 border-round">
          <div>
            <span class="text-sm font-medium">{{ v.usuarioNombre || v.nombreExterno }}</span>
            <Tag :value="v.tipo" size="small" class="ml-2" />
          </div>
          <span class="text-xs text-surface-400">{{ v.unidadNumero }}</span>
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="showCrearVinculo" header="Nuevo vínculo" modal :style="{ width: '95%', maxWidth: '400px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Persona ID</label>
          <InputText v-model="formVinculo.personaId" placeholder="UUID de la persona" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Unidad</label>
          <Select v-model="formVinculo.unidadId" :options="unidades" optionLabel="numero" optionValue="id" placeholder="Seleccionar" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Tipo</label>
          <Select v-model="formVinculo.tipo" :options="tiposVinculo" optionLabel="label" optionValue="value" placeholder="Seleccionar" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showCrearVinculo = false" />
        <Button label="Guardar" :loading="enviando" @click="crearVinculo" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showCrearUsuario" header="Crear usuario" modal :style="{ width: '95%', maxWidth: '400px' }">
      <p class="text-sm text-surface-500 m-0 mb-3">Crear usuario para {{ personaSeleccionada?.nombre }}</p>
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Email (opcional)</label>
          <InputText v-model="formUsuario.email" type="email" placeholder="Usar email de la persona" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Password (opcional)</label>
          <InputText v-model="formUsuario.password" type="password" placeholder="Generar automático" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showCrearUsuario = false" />
        <Button label="Crear usuario" :loading="enviando" @click="crearUsuario" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>
