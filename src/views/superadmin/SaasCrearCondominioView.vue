<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { adminService } from "@/services/adminService";
import { useValidacionChile } from "@/composables/useValidacionChile";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";

const router = useRouter();

const loading = ref(true);
const error = ref(null);
const planes = ref([]);
const enviando = ref(false);

const {
  errores,
  validarNombre,
  validarRut,
  validarEmail,
  validarTelefono,
  onRutInput,
  onRutBlur,
  onTelefonoInput,
  onTelefonoBlur,
  focusPrimerError,
  normalizarRut,
  normalizarTelefono,
  normalizarEmail,
} = useValidacionChile();

const form = ref({
  nombre: "",
  rut: "",
  direccion: "",
  responsableNombre: "",
  responsableEmail: "",
  responsableTelefono: "",
  planId: null,
});

const nombreRef = ref(null);
const rutRef = ref(null);
const responsableNombreRef = ref(null);
const responsableEmailRef = ref(null);
const responsableTelefonoRef = ref(null);

async function cargarPlanes() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await adminService.listarPlanes();
    planes.value = (data || []).filter((p) => p.activo);
  } catch (e) {
    console.error("Error al cargar planes", e);
    error.value = "No se pudieron cargar los planes";
  } finally {
    loading.value = false;
  }
}

function validarFormulario() {
  errores.value = {};
  const f = form.value;
  validarNombre(
    f.nombre,
    "nombre",
    "Ingresa el nombre del condominio (mínimo 2 caracteres)",
  );
  validarRut(f.rut, "rut");
  validarNombre(
    f.responsableNombre,
    "responsableNombre",
    "Ingresa el nombre del responsable",
  );
  validarEmail(f.responsableEmail, "responsableEmail");
  validarTelefono(f.responsableTelefono, "responsableTelefono");
  return Object.keys(errores.value).length === 0;
}

function focusPrimerErrorForm() {
  focusPrimerError([
    ["nombre", nombreRef],
    ["rut", rutRef],
    ["responsableNombre", responsableNombreRef],
    ["responsableEmail", responsableEmailRef],
    ["responsableTelefono", responsableTelefonoRef],
  ]);
}

async function crear() {
  if (!validarFormulario()) {
    focusPrimerErrorForm();
    return;
  }
  enviando.value = true;
  error.value = null;
  try {
    const body = {
      nombre: form.value.nombre.trim(),
      rut: form.value.rut ? normalizarRut(form.value.rut) : null,
      direccion: form.value.direccion.trim() || null,
      responsableNombre: form.value.responsableNombre.trim(),
      responsableEmail: normalizarEmail(form.value.responsableEmail),
      responsableTelefono: form.value.responsableTelefono
        ? normalizarTelefono(form.value.responsableTelefono)
        : null,
      planId: form.value.planId,
    };
    const { data } = await adminService.crearCondominio(body);
    router.push({ name: "SaasCondominioDetail", params: { id: data.id } });
  } catch (e) {
    console.error("Error al crear condominio", e);
    const data = e.response?.data;
    if (data?.fields) {
      data.fields.forEach((f) => {
        errores.value[f.field] = f.message;
      });
    } else {
      error.value = data?.message || "No se pudo crear el condominio";
    }
  } finally {
    enviando.value = false;
  }
}

onMounted(cargarPlanes);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Nuevo condominio</h1>
    </div>

    <Skeleton v-if="loading" width="100%" height="200px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <Card v-else>
      <template #content>
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm"
              >Nombre <span class="text-red-500">*</span></label
            >
            <InputText
              ref="nombreRef"
              v-model="form.nombre"
              placeholder="Ej: Condominio Los Cipreses"
              :class="{ 'p-invalid': errores.nombre }"
            />
            <small v-if="errores.nombre" class="text-red-500">{{
              errores.nombre
            }}</small>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm">RUT</label>
              <InputText
                ref="rutRef"
                v-model="form.rut"
                placeholder="Ej: 76.123.456-7"
                maxlength="12"
                :class="{ 'p-invalid': errores.rut }"
                @input="form.rut = onRutInput(form.rut)"
                @blur="form.rut = onRutBlur(form.rut)"
              />
              <small v-if="errores.rut" class="text-red-500">{{
                errores.rut
              }}</small>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm">Dirección</label>
              <InputText
                v-model="form.direccion"
                :class="{ 'p-invalid': errores.direccion }"
              />
              <small v-if="errores.direccion" class="text-red-500">{{
                errores.direccion
              }}</small>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm"
              >Responsable <span class="text-red-500">*</span></label
            >
            <InputText
              ref="responsableNombreRef"
              v-model="form.responsableNombre"
              placeholder="Nombre del administrador"
              :class="{ 'p-invalid': errores.responsableNombre }"
            />
            <small v-if="errores.responsableNombre" class="text-red-500">{{
              errores.responsableNombre
            }}</small>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm"
                >Email responsable <span class="text-red-500">*</span></label
              >
              <InputText
                ref="responsableEmailRef"
                v-model="form.responsableEmail"
                type="email"
                :class="{ 'p-invalid': errores.responsableEmail }"
              />
              <small v-if="errores.responsableEmail" class="text-red-500">{{
                errores.responsableEmail
              }}</small>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm">Teléfono responsable</label>
              <InputText
                ref="responsableTelefonoRef"
                v-model="form.responsableTelefono"
                placeholder="Ej: +56 9 1234 5678"
                maxlength="16"
                :class="{ 'p-invalid': errores.responsableTelefono }"
                @input="
                  form.responsableTelefono = onTelefonoInput(
                    form.responsableTelefono,
                  )
                "
                @blur="
                  form.responsableTelefono = onTelefonoBlur(
                    form.responsableTelefono,
                  )
                "
              />
              <small v-if="errores.responsableTelefono" class="text-red-500">{{
                errores.responsableTelefono
              }}</small>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm">Plan</label>
            <Select
              v-model="form.planId"
              :options="planes"
              option-label="nombre"
              option-value="id"
              placeholder="Básico (por defecto)"
              class="w-full"
              :show-clear="true"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancelar"
            severity="secondary"
            variant="text"
            @click="router.push({ name: 'SuperAdminDashboard' })"
          />
          <Button
            label="Crear condominio"
            icon="pi pi-check"
            :loading="enviando"
            @click="crear"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

