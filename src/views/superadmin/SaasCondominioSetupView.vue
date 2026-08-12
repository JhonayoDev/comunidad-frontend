<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { adminService } from "@/services/adminService";
import { almacenamientoService } from "@/services/almacenamientoService";
import { unidadesService } from "@/services/unidadesService";
import { personasService } from "@/services/personasService";
import { miembrosService } from "@/services/miembrosService";
import { useValidacionChile } from "@/composables/useValidacionChile";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import InputSwitch from "primevue/inputswitch";
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import ProgressBar from "primevue/progressbar";

const route = useRoute();
const router = useRouter();
const cid = route.params.id;

const loading = ref(true);
const error = ref(null);
const tareas = ref([]);
const condominio = ref(null);
const guardando = ref(null);

const proveedores = [
  { label: "Cloudflare R2", value: "CLOUDFLARE_R2" },
  { label: "Google Drive", value: "GOOGLE_DRIVE" },
];

const tipoVinculoOptions = [
  { label: "Propietario", value: "PROPIETARIO" },
  { label: "Arrendatario", value: "ARRENDATARIO" },
  { label: "Residente adicional", value: "RESIDENTE_ADICIONAL" },
];

const cargoOptions = [
  { label: "Administrador", value: "ADMINISTRADOR" },
  { label: "Presidente", value: "PRESIDENTE" },
  { label: "Tesorero", value: "TESORERO" },
  { label: "Secretario", value: "SECRETARIO" },
];

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

// ── Estado por sección ────────────────────────────────
const storageForm = ref({
  proveedor: "CLOUDFLARE_R2",
  activa: true,
  r2Bucket: "",
  r2AccountId: "",
  r2AccessKeyId: "",
  r2SecretKey: "",
  r2PublicUrl: "",
  driveFolderId: "",
  driveCredentials: "",
});

const unidades = ref([]);
const planes = ref([]);

const capacidadConfig = [
  { tipo: "CASA", label: "Casas", suffix: "Casas" },
  { tipo: "DEPARTAMENTO", label: "Departamentos", suffix: "Departamentos" },
  { tipo: "ESTACIONAMIENTO", label: "Estacionamientos", suffix: "Estacionamientos" },
  { tipo: "BODEGA", label: "Bodegas", suffix: "Bodegas" },
  { tipo: "OTRO", label: "Otro", suffix: "Otro" },
];

const capacidadForm = ref({
  CASA: null,
  DEPARTAMENTO: null,
  ESTACIONAMIENTO: null,
  BODEGA: null,
  OTRO: null,
});

const adminForm = ref({
  nombre: "",
  email: "",
  rut: "",
  telefono: "",
  vincularUnidad: false,
  unidadId: null,
  tipoVinculo: "PROPIETARIO",
  cargo: "ADMINISTRADOR",
});
const miembros = ref([]);

const adminNombreRef = ref(null);
const adminEmailRef = ref(null);
const adminRutRef = ref(null);
const adminTelefonoRef = ref(null);

const resultadoAdmin = ref(null);
const resultadoStorage = ref(null);
const resultadoUnidades = ref(null);

// ── Onboarding helpers ────────────────────────────────
const tareaCompletada = (codigo) =>
  tareas.value.find((t) => t.tareaCodigo === codigo)?.completada || false;

const tareaLabels = {
  CONFIGURAR_STORAGE: "Configurar almacenamiento",
  ASIGNAR_ADMIN: "Asignar administrador",
  CREAR_UNIDADES: "Crear unidades",
  CONFIGURAR_PLANTILLAS: "Configurar plantillas",
};

const progreso = computed(() => {
  if (!tareas.value.length) return 0;
  const completadas = tareas.value.filter((t) => t.completada).length;
  return Math.round((completadas / tareas.value.length) * 100);
});

async function completarTarea(codigo) {
  if (tareaCompletada(codigo)) return;
  try {
    await adminService.completarTareaOnboarding(cid, codigo);
    await cargarTareas();
  } catch (e) {
    console.error("Error al completar tarea de onboarding", e);
  }
}

async function cargarTareas() {
  const { data } = await adminService.listarOnboarding(cid);
  tareas.value = data || [];
}

function fechaHoy() {
  return new Date().toISOString().slice(0, 10);
}

// ── Carga inicial ─────────────────────────────────────
async function cargar() {
  loading.value = true;
  error.value = null;
  try {
    const [condRes, unidadesRes, miembrosRes, planesRes] = await Promise.all([
      adminService.obtenerCondominio(cid),
      unidadesService.getUnidades(cid),
      miembrosService.listar(cid),
      adminService.listarPlanes(),
    ]);
    condominio.value = condRes.data;
    unidades.value = unidadesRes.data || [];
    miembros.value = miembrosRes.data || [];
    planes.value = planesRes.data || [];
    capacidadConfig.forEach((c) => {
      capacidadForm.value[c.tipo] = condRes.data?.[`capacidad${c.suffix}`] ?? null;
    });
    await cargarTareas();
    await cargarStorage();
  } catch (e) {
    console.error("Error al cargar wizard", e);
    error.value = "No se pudo cargar la configuración del condominio";
  } finally {
    loading.value = false;
  }
}

async function cargarStorage() {
  try {
    const { data } = await almacenamientoService.obtener(cid);
    if (data) {
      storageForm.value.proveedor = data.proveedor || "CLOUDFLARE_R2";
      storageForm.value.r2Bucket = data.r2Bucket || "";
      storageForm.value.r2AccountId = data.r2AccountId || "";
      storageForm.value.r2AccessKeyId = data.r2AccessKeyId || "";
      storageForm.value.r2SecretKey = "";
      storageForm.value.r2PublicUrl = data.r2PublicUrl || "";
      storageForm.value.driveFolderId = data.driveFolderId || "";
      storageForm.value.driveCredentials = "";
      storageForm.value.activa = data.activa !== false;
    }
  } catch (e) {
    console.error("Error al cargar configuración de almacenamiento", e);
  }
}

// ── Sección 1: Almacenamiento ─────────────────────────
const storageValido = computed(() => {
  const f = storageForm.value;
  if (f.proveedor === "CLOUDFLARE_R2") {
    return Boolean(f.r2Bucket.trim() && f.r2AccountId.trim() && f.r2AccessKeyId.trim() && f.r2SecretKey.trim());
  }
  return Boolean(f.driveFolderId.trim() && f.driveCredentials.trim());
});

async function guardarStorage() {
  guardando.value = "storage";
  resultadoStorage.value = null;
  try {
    const payload = {
      proveedor: storageForm.value.proveedor,
      activa: storageForm.value.activa,
    };
    if (storageForm.value.proveedor === "CLOUDFLARE_R2") {
      payload.r2Bucket = storageForm.value.r2Bucket || null;
      payload.r2AccountId = storageForm.value.r2AccountId || null;
      payload.r2AccessKeyId = storageForm.value.r2AccessKeyId || null;
      payload.r2SecretKey = storageForm.value.r2SecretKey || null;
      payload.r2PublicUrl = storageForm.value.r2PublicUrl || null;
    } else {
      payload.driveFolderId = storageForm.value.driveFolderId || null;
      payload.driveCredentials = storageForm.value.driveCredentials || null;
    }
    await almacenamientoService.guardar(cid, payload);
    resultadoStorage.value = "Almacenamiento configurado correctamente.";
    await completarTarea("CONFIGURAR_STORAGE");
  } catch (e) {    console.error("Error al guardar almacenamiento", e);
    resultadoStorage.value =
      "No se pudo guardar la configuración de almacenamiento.";
  } finally {
    guardando.value = null;
  }
}

// ── Sección 2: Capacidad de unidades por tipo ─────────
const capacidadResumen = computed(() =>
  capacidadConfig.map((c) => ({
    ...c,
    capacidad: condominio.value?.[`capacidad${c.suffix}`] ?? null,
    total: condominio.value?.[`total${c.suffix}`] ?? 0,
  })),
);

const planActual = computed(() =>
  planes.value.find((p) => p.id === condominio.value?.planId),
);

const sumaCapacidad = computed(() =>
  capacidadConfig.reduce(
    (acc, c) => acc + (Number(capacidadForm.value[c.tipo]) || 0),
    0,
  ),
);

const capacidadValida = computed(() => sumaCapacidad.value > 0);

function esMensajeError(msg) {
  return ["No ", "Ocurrió", "Ingresa", "La "].some((p) => msg.startsWith(p));
}

async function guardarCapacidad() {
  guardando.value = "capacidad";
  resultadoUnidades.value = null;
  try {
    const payload = {};
    capacidadConfig.forEach((c) => {
      payload[`capacidad${c.suffix}`] = Number(capacidadForm.value[c.tipo]) || 0;
    });
    const { data } = await adminService.actualizarCondominio(cid, payload);
    condominio.value = data;
    resultadoUnidades.value =
      "Capacidad guardada. El administrador podrá crear las unidades dentro de estos límites.";
    await completarTarea("CREAR_UNIDADES");
  } catch (e) {
    console.error("Error al guardar capacidad", e);
    const msg = e.response?.data?.message;
    resultadoUnidades.value = msg || "No se pudo guardar la capacidad.";
  } finally {
    guardando.value = null;
  }
}

// ── Sección 3: Administrador / Presidente ─────────────
async function crearAdministrador() {
  guardando.value = "admin";
  resultadoAdmin.value = null;
  const f = adminForm.value;

  errores.value = {};
  validarNombre(f.nombre, "adminNombre", "Ingresa el nombre del administrador");
  validarEmail(f.email, "adminEmail");
  validarRut(f.rut, "adminRut");
  validarTelefono(f.telefono, "adminTelefono");
  if (f.vincularUnidad && !f.unidadId) {
    errores.value.adminUnidadId = "Selecciona la unidad a la que se vinculará";
  }
  if (Object.keys(errores.value).length) {
    focusPrimerError([
      ["adminNombre", adminNombreRef],
      ["adminEmail", adminEmailRef],
      ["adminRut", adminRutRef],
      ["adminTelefono", adminTelefonoRef],
    ]);
    return;
  }

  try {
    let personaId = null;
    try {
      const { data } = await personasService.crear(cid, {
        nombre: f.nombre.trim(),
        email: normalizarEmail(f.email),
        rut: f.rut ? normalizarRut(f.rut) : undefined,
        telefono: f.telefono ? normalizarTelefono(f.telefono) : undefined,
      });
      personaId = data.id;
    } catch (e) {
      if (e.response?.status === 409) {
        const { data } = await personasService.buscarPorEmail(
          cid,
          normalizarEmail(f.email),
        );
        personaId = data.id;
      } else {
        throw e;
      }
    }

    if (f.vincularUnidad && f.unidadId) {
      await personasService.crearVinculo(cid, {
        personaId,
        unidadId: f.unidadId,
        tipo: f.tipoVinculo,
        esOcupante: true,
        recibeNotificaciones: true,
        fechaInicio: fechaHoy(),
      });
    }

    await personasService.crearUsuario(cid, personaId, {
      rol: "ADMINISTRADOR",
    });

    await miembrosService.asignar(cid, {
      personaId,
      cargo: f.cargo,
      fechaInicio: fechaHoy(),
    });

    const { data } = await miembrosService.listar(cid);
    miembros.value = data || [];
    resultadoAdmin.value = `${f.cargo === "PRESIDENTE" ? "Presidente" : "Administrador"} creado. Se envió un email con el enlace para configurar su contraseña.`;
  } catch (e) {
    console.error("Error al crear administrador", e);
    const fields = e.response?.data?.fields;
    resultadoAdmin.value =
      fields && Object.keys(fields).length
        ? Object.values(fields).join(". ")
        : "No se pudo crear el administrador.";
  } finally {
    guardando.value = null;
  }
}

function adminAsignado() {
  return miembros.value.some(
    (m) => ["ADMINISTRADOR", "PRESIDENTE"].includes(m.cargo) && m.activo,
  );
}

async function guardarSeccionAdmin() {
  guardando.value = "admin-seccion";
  try {
    await completarTarea("ASIGNAR_ADMIN");
  } finally {
    guardando.value = null;
  }
}

// ── Sección 4: Plantillas ─────────────────────────────
async function completarPlantillas() {
  guardando.value = "plantillas";
  try {
    await completarTarea("CONFIGURAR_PLANTILLAS");
  } finally {
    guardando.value = null;
  }
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div>
      <h1 class="text-xl font-bold m-0">Puesta en marcha</h1>
      <div v-if="condominio" class="text-sm text-surface-500">
        {{ condominio.nombre }}
      </div>
    </div>

    <Skeleton v-if="loading" width="100%" height="400px" />
    <Message v-else-if="error" severity="error">{{ error }}</Message>

    <template v-else>
      <Card>
        <template #content>
          <div class="flex items-center justify-between gap-3 mb-2">
            <span class="text-sm font-medium">Progreso del onboarding</span>
            <span class="text-sm text-primary font-bold">{{ progreso }}%</span>
          </div>
          <ProgressBar :value="progreso" />
        </template>
      </Card>

      <!-- 1. Almacenamiento -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i
              :class="
                tareaCompletada('CONFIGURAR_STORAGE')
                  ? 'pi pi-check-circle text-green-500'
                  : 'pi pi-circle text-surface-300'
              "
              class="text-lg"
            ></i>
            <span>1. Almacenamiento</span>
            <Tag
              v-if="tareaCompletada('CONFIGURAR_STORAGE')"
              value="Listo"
              severity="success"
              size="small"
            />
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm">Proveedor</label>
              <Select
                v-model="storageForm.proveedor"
                :options="proveedores"
                option-label="label"
                option-value="value"
                fluid
              />
            </div>

            <template v-if="storageForm.proveedor === 'CLOUDFLARE_R2'">
              <div class="flex flex-col gap-1">
                <label class="text-sm">Bucket</label>
                <InputText
                  v-model="storageForm.r2Bucket"
                  placeholder="mi-condominio"
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-sm">Account ID</label>
                  <InputText
                    v-model="storageForm.r2AccountId"
                    placeholder="abc123"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm">Access Key ID</label>
                  <InputText
                    v-model="storageForm.r2AccessKeyId"
                    placeholder="..."
                  />
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm">Secret Key</label>
                <InputText
                  v-model="storageForm.r2SecretKey"
                  type="password"
                  placeholder="Dejar vacío para mantener el valor actual"
                />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm">URL pública</label>
                <InputText
                  v-model="storageForm.r2PublicUrl"
                  placeholder="https://pub-abc.r2.dev"
                />
              </div>
            </template>

            <template v-else>
              <div class="flex flex-col gap-1">
                <label class="text-sm">Carpeta de Drive (Folder ID)</label>
                <InputText
                  v-model="storageForm.driveFolderId"
                  placeholder="1ABC..."
                />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm"
                  >Credenciales (service account JSON)</label
                >
                <Textarea
                  v-model="storageForm.driveCredentials"
                  :autoResize="true"
                  rows="4"
                  placeholder='{ "type": "service_account", ... }'
                />
              </div>
            </template>

            <div class="flex items-center gap-2">
              <InputSwitch v-model="storageForm.activa" :binary="true" />
              <label class="text-sm cursor-pointer">Activa</label>
            </div>

            <Message
              v-if="resultadoStorage"
              :severity="
                resultadoStorage.startsWith('No') ? 'error' : 'success'
              "
              :closable="false"
              >{{ resultadoStorage }}</Message
            >

            <div>
              <Button
                label="Guardar almacenamiento"
                icon="pi pi-save"
                :disabled="!storageValido"
                :loading="guardando === 'storage'"
                @click="guardarStorage"
              />
            </div>
            <p v-if="!storageValido" class="text-xs text-surface-400 m-0">
              Completa los campos del proveedor para guardar.
            </p>
          </div>
        </template>
      </Card>

      <!-- 2. Unidades -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i
              :class="
                tareaCompletada('CREAR_UNIDADES')
                  ? 'pi pi-check-circle text-green-500'
                  : 'pi pi-circle text-surface-300'
              "
              class="text-lg"
            ></i>
            <span>2. Capacidad de unidades</span>
            <Tag
              v-if="tareaCompletada('CREAR_UNIDADES')"
              value="Listo"
              severity="success"
              size="small"
            />
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-4">
            <p class="text-sm text-surface-500 m-0">
              Declara la cantidad de unidades de cada tipo que tiene el
              condominio según el contrato. El administrador podrá crear
              unidades (casas, departamentos, estacionamientos, bodegas, etc.)
              hasta alcanzar estos límites; no podrá superarlos.
            </p>

            <div class="flex flex-col gap-2">
              <div
                v-for="c in capacidadResumen"
                :key="c.tipo"
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 border-round bg-surface-50"
              >
                <div class="flex flex-col">
                  <span class="text-sm font-medium">{{ c.label }}</span>
                  <span class="text-xs text-surface-500">
                    {{
                      condominio
                        ? `${c.total} creadas${
                            c.capacidad != null ? ` de ${c.capacidad}` : " (sin límite declarado)"
                          }`
                        : "—"
                    }}
                  </span>
                </div>
                <InputNumber
                  v-model="capacidadForm[c.tipo]"
                  :min="0"
                  :max="planActual?.unidadLimit"
                  placeholder="Capacidad"
                  class="w-full sm:w-40"
                />
              </div>
            </div>

            <div class="flex flex-wrap gap-2 text-sm">
              <Tag severity="info">Total declarado: {{ sumaCapacidad }}</Tag>
              <Tag v-if="planActual" severity="secondary">
                Límite del plan {{ planActual.nombre }}: {{ planActual.unidadLimit }}
              </Tag>
            </div>

            <Message
              v-if="resultadoUnidades"
              :severity="esMensajeError(resultadoUnidades) ? 'error' : 'success'"
              :closable="false"
              >{{ resultadoUnidades }}</Message
            >

            <div class="flex flex-col gap-1 pt-2 border-t">
              <Button
                label="Guardar sección"
                icon="pi pi-save"
                severity="secondary"
                :disabled="!capacidadValida || tareaCompletada('CREAR_UNIDADES')"
                :loading="guardando === 'capacidad'"
                @click="guardarCapacidad"
              />
              <span class="text-xs text-surface-400"
                >La sección avanza solo al hacer clic en "Guardar sección" con al menos una capacidad declarada. Si la suma supera el límite del plan, el backend lo rechazará.</span
              >
            </div>
          </div>
        </template>
      </Card>

      <!-- 3. Administrador / Presidente -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i
              :class="
                tareaCompletada('ASIGNAR_ADMIN')
                  ? 'pi pi-check-circle text-green-500'
                  : 'pi pi-circle text-surface-300'
              "
              class="text-lg"
            ></i>
            <span>3. Administrador / Presidente</span>
            <Tag
              v-if="tareaCompletada('ASIGNAR_ADMIN')"
              value="Listo"
              severity="success"
              size="small"
            />
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-3">
            <div v-if="adminAsignado()" class="flex items-center gap-2">
              <Tag value="Administrador asignado" severity="success" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm">Cargo a asignar</label>
              <Select
                v-model="adminForm.cargo"
                :options="cargoOptions"
                option-label="label"
                option-value="value"
                fluid
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm">Nombre</label>
              <InputText
                ref="adminNombreRef"
                v-model="adminForm.nombre"
                :class="{ 'p-invalid': errores.adminNombre }"
              />
              <small v-if="errores.adminNombre" class="text-red-500">{{
                errores.adminNombre
              }}</small>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm">Email</label>
              <InputText
                ref="adminEmailRef"
                v-model="adminForm.email"
                type="email"
                :class="{ 'p-invalid': errores.adminEmail }"
              />
              <small v-if="errores.adminEmail" class="text-red-500">{{
                errores.adminEmail
              }}</small>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="flex flex-col gap-1">
                <label class="text-sm">RUT (opcional)</label>
                <InputText
                  ref="adminRutRef"
                  v-model="adminForm.rut"
                  maxlength="12"
                  placeholder="12.345.678-9"
                  :class="{ 'p-invalid': errores.adminRut }"
                  @input="adminForm.rut = onRutInput(adminForm.rut)"
                  @blur="adminForm.rut = onRutBlur(adminForm.rut)"
                />
                <small v-if="errores.adminRut" class="text-red-500">{{
                  errores.adminRut
                }}</small>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm">Teléfono (opcional)</label>
                <InputText
                  ref="adminTelefonoRef"
                  v-model="adminForm.telefono"
                  maxlength="16"
                  placeholder="+56 9 1234 5678"
                  :class="{ 'p-invalid': errores.adminTelefono }"
                  @input="
                    adminForm.telefono = onTelefonoInput(adminForm.telefono)
                  "
                  @blur="
                    adminForm.telefono = onTelefonoBlur(adminForm.telefono)
                  "
                />
                <small v-if="errores.adminTelefono" class="text-red-500">{{
                  errores.adminTelefono
                }}</small>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <InputSwitch v-model="adminForm.vincularUnidad" :binary="true" />
              <label class="text-sm cursor-pointer"
                >Vincular a una unidad (será también residente)</label
              >
            </div>
            <template v-if="adminForm.vincularUnidad">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-sm">Unidad</label>
                  <Select
                    v-model="adminForm.unidadId"
                    :options="unidades"
                    option-label="numero"
                    option-value="id"
                    placeholder="Selecciona unidad"
                    :class="{ 'p-invalid': errores.adminUnidadId }"
                  />
                  <small v-if="errores.adminUnidadId" class="text-red-500">{{
                    errores.adminUnidadId
                  }}</small>
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm">Tipo de vínculo</label>
                  <Select
                    v-model="adminForm.tipoVinculo"
                    :options="tipoVinculoOptions"
                    option-label="label"
                    option-value="value"
                  />
                </div>
              </div>
            </template>

            <Message
              v-if="resultadoAdmin"
              :severity="resultadoAdmin.startsWith('No') ? 'error' : 'success'"
              :closable="false"
              >{{ resultadoAdmin }}</Message
            >

            <div>
              <Button
                label="Crear administrador"
                icon="pi pi-user-plus"
                :loading="guardando === 'admin'"
                @click="crearAdministrador"
              />
            </div>
            <p class="text-xs text-surface-400 m-0">
              Se creará la persona, su cuenta de usuario (rol ADMINISTRADOR) y
              se le enviará un email para configurar su contraseña. También
              quedará con el cargo seleccionado.
            </p>

            <div class="flex flex-col gap-1 pt-2 border-t">
              <Button
                label="Guardar sección"
                icon="pi pi-save"
                severity="secondary"
                :disabled="!adminAsignado() || tareaCompletada('ASIGNAR_ADMIN')"
                :loading="guardando === 'admin-seccion'"
                @click="guardarSeccionAdmin"
              />
              <span class="text-xs text-surface-400"
                >La sección avanza solo al hacer clic en "Guardar sección" una vez creado el administrador o presidente.</span
              >
            </div>
          </div>
        </template>
      </Card>

      <!-- 4. Plantillas -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i
              :class="
                tareaCompletada('CONFIGURAR_PLANTILLAS')
                  ? 'pi pi-check-circle text-green-500'
                  : 'pi pi-circle text-surface-300'
              "
              class="text-lg"
            ></i>
            <span>4. Plantillas</span>
            <Tag
              v-if="tareaCompletada('CONFIGURAR_PLANTILLAS')"
              value="Listo"
              severity="success"
              size="small"
            />
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-3">
            <p class="text-sm m-0">
              Las plantillas de notificación y gasto común se configuran desde
              las vistas del administrador del condominio. Puedes marcar esta
              tarea como completada cuando las hayas revisado.
            </p>
            <div>
              <Button
                label="Marcar como completada"
                icon="pi pi-check"
                size="small"
                severity="secondary"
                :loading="guardando === 'plantillas'"
                @click="completarPlantillas"
              />
            </div>
          </div>
        </template>
      </Card>

      <div
        v-if="progreso === 100"
        class="text-center text-green-600 font-medium"
      >
        ¡Puesta en marcha completa! El condominio está listo.
      </div>
    </template>
  </div>
</template>

