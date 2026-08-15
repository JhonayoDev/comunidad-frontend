<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { adminService } from "@/services/adminService";
import { almacenamientoService } from "@/services/almacenamientoService";
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

const tipoAccesoOptions = [
  {
    label: "Administrador externo",
    value: "ADMIN_ROL",
    desc: "Rol ADMINISTRADOR + cargo Administrador. Profesional que administra el condominio.",
  },
  {
    label: "Administrador interno",
    value: "ADMIN_CARGO",
    desc: "Rol RESIDENTE + cargo Administrador. Residente que ocupa el cargo (revocable).",
  },
  {
    label: "Presidente",
    value: "PRESIDENTE",
    desc: "Rol RESIDENTE + cargo Presidente.",
  },
  {
    label: "Tesorero",
    value: "TESORERO",
    desc: "Rol RESIDENTE + cargo Tesorero.",
  },
  {
    label: "Secretario",
    value: "SECRETARIO",
    desc: "Rol RESIDENTE + cargo Secretario.",
  },
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
  tipoAcceso: "ADMIN_ROL",
});
const miembros = ref([]);

const adminNombreRef = ref(null);
const adminEmailRef = ref(null);
const adminRutRef = ref(null);
const adminTelefonoRef = ref(null);

const resultadoAdmin = ref(null);
const resultadoStorage = ref(null);
const resultadoUnidades = ref(null);

// ── Paso 4: activación de la cuenta del administrador ──
const cuentaAdminPersonaId = ref(null);
const cuentaAdminEmail = ref(null);
const cuentaAdminPasswordSetAt = ref(null);
const verificandoCuenta = ref(false);
let cuentaPollingTimer = null;

// ── Onboarding helpers ────────────────────────────────
const tareaCompletada = (codigo) =>
  tareas.value.find((t) => t.tareaCodigo === codigo)?.completada || false;

const progreso = computed(() => {
  const pasos = [
    tareaCompletada("CONFIGURAR_STORAGE"),
    tareaCompletada("CREAR_UNIDADES"),
    tareaCompletada("ASIGNAR_ADMIN"),
    Boolean(cuentaAdminPasswordSetAt.value),
  ];
  const hechas = pasos.filter(Boolean).length;
  return Math.round((hechas / pasos.length) * 100);
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

// ── Paso 4: estado de activación de la cuenta del admin ──
function adminAsignadoObj() {
  return miembros.value.find(
    (m) => ["ADMINISTRADOR", "PRESIDENTE"].includes(m.cargo) && m.activo,
  );
}

function sincronizarPollingCuenta() {
  const pendiente = Boolean(
    cuentaAdminPersonaId.value && !cuentaAdminPasswordSetAt.value,
  );
  if (pendiente && !cuentaPollingTimer) {
    cuentaPollingTimer = setInterval(() => cargarEstadoCuentaAdmin(), 20000);
  } else if (!pendiente && cuentaPollingTimer) {
    clearInterval(cuentaPollingTimer);
    cuentaPollingTimer = null;
  }
}

async function cargarEstadoCuentaAdmin() {
  const admin = adminAsignadoObj();
  if (!admin) {
    cuentaAdminPersonaId.value = null;
    cuentaAdminEmail.value = null;
    cuentaAdminPasswordSetAt.value = null;
    sincronizarPollingCuenta();
    return;
  }
  cuentaAdminPersonaId.value = admin.personaId;
  cuentaAdminEmail.value = admin.personaEmail || null;
  try {
    const { data } = await adminService.listarUsuarios(cid, {
      activo: true,
      size: 200,
    });
    const usuarios = data.content || [];
    const usuario = usuarios.find((u) => u.personaId === admin.personaId);
    cuentaAdminPasswordSetAt.value = usuario?.passwordSetAt ?? null;
  } catch (e) {
    console.error(
      "Error al consultar activación de la cuenta del administrador",
      e,
    );
  } finally {
    sincronizarPollingCuenta();
  }
}

async function verificarCuenta() {
  verificandoCuenta.value = true;
  try {
    await cargarEstadoCuentaAdmin();
  } finally {
    verificandoCuenta.value = false;
  }
}

function formatFechaHora(f) {
  if (!f) return "—";
  return new Date(f).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Carga inicial ─────────────────────────────────────
async function cargar() {
  loading.value = true;
  error.value = null;
  try {
    const [condRes, miembrosRes, planesRes] = await Promise.all([
      adminService.obtenerCondominio(cid),
      miembrosService.listar(cid),
      adminService.listarPlanes(),
    ]);
    condominio.value = condRes.data;
    const c = condRes.data;
    miembros.value = miembrosRes.data || [];
    planes.value = planesRes.data || [];
    capacidadConfig.forEach((cc) => {
      capacidadForm.value[cc.tipo] = c?.[`capacidad${cc.suffix}`] ?? null;
    });
    if (!adminForm.value.nombre && c?.responsableNombre) {
      adminForm.value.nombre = c.responsableNombre;
    }
    if (!adminForm.value.email && c?.responsableEmail) {
      adminForm.value.email = c.responsableEmail;
    }
    if (!adminForm.value.telefono && c?.responsableTelefono) {
      adminForm.value.telefono = c.responsableTelefono;
    }
    await cargarTareas();
    // CONFIGURAR_PLANTILLAS no tiene lógica real en el onboarding: se
    // completa automáticamente para que el progreso refleje solo las 3
    // secciones reales y el condominio pueda pasar a COMPLETADO.
    await completarTarea("CONFIGURAR_PLANTILLAS");
    await cargarStorage();
    await cargarEstadoCuentaAdmin();
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
      "Capacidad declarada. El administrador creará unidades, estacionamientos y bodegas; el límite duro es el envelope del plan (suma ≤ cupo del plan).";
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
const cargoElegido = computed(() =>
  ["ADMIN_ROL", "ADMIN_CARGO"].includes(adminForm.value.tipoAcceso)
    ? "ADMINISTRADOR"
    : adminForm.value.tipoAcceso,
);

const rolElegido = computed(() =>
  adminForm.value.tipoAcceso === "ADMIN_ROL" ? "ADMINISTRADOR" : "RESIDENTE",
);

const tipoAccesoActual = computed(() =>
  tipoAccesoOptions.find((o) => o.value === adminForm.value.tipoAcceso),
);

async function crearAdministrador() {
  guardando.value = "admin";
  resultadoAdmin.value = null;
  const f = adminForm.value;

  errores.value = {};
  validarNombre(f.nombre, "adminNombre", "Ingresa el nombre del administrador");
  validarEmail(f.email, "adminEmail");
  validarRut(f.rut, "adminRut");
  validarTelefono(f.telefono, "adminTelefono");
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

    await personasService.crearUsuario(cid, personaId, {
      rol: rolElegido.value,
    });

    await miembrosService.asignar(cid, {
      personaId,
      cargo: cargoElegido.value,
      fechaInicio: fechaHoy(),
    });

    const { data } = await miembrosService.listar(cid);
    miembros.value = data || [];
    resultadoAdmin.value = `${tipoAccesoActual.value?.label ?? "Cuenta"} creada con rol ${rolElegido.value} y cargo ${cargoElegido.value}. Se envió un email con el enlace para configurar su contraseña.`;
    await cargarEstadoCuentaAdmin();
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
    await cargarEstadoCuentaAdmin();
  } finally {
    guardando.value = null;
  }
}

onMounted(cargar);
onUnmounted(() => {
  if (cuentaPollingTimer) {
    clearInterval(cuentaPollingTimer);
    cuentaPollingTimer = null;
  }
});
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
              Declara la capacidad esperada de cada tipo (informativa).
              Estacionamientos y bodegas son entidades independientes (no
              unidades). El límite real es el envelope del plan: la suma
              declarada de unidades + estacionamientos + bodegas no puede
              superar el cupo del plan.
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
                  class="w-full sm:w-40 min-w-0"
                  input-class="min-w-0"
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
              <label class="text-sm">Tipo de acceso</label>
              <Select
                v-model="adminForm.tipoAcceso"
                :options="tipoAccesoOptions"
                option-label="label"
                option-value="value"
                fluid
              />
              <small v-if="tipoAccesoActual" class="text-surface-500">{{
                tipoAccesoActual.desc
              }}</small>
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
              Se creará la persona, su cuenta de usuario con rol
              {{ rolElegido }} y el cargo {{ cargoElegido }}. Se enviará un
              email con el enlace para configurar su contraseña. Los datos se
              prellenan con el responsable del condominio declarado al
              crearlo.
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
                >La sección avanza solo al hacer clic en "Guardar sección" una vez creado el administrador o presidente. Luego queda el paso 4: la activación de su cuenta.</span
              >
            </div>
          </div>
        </template>
      </Card>

      <!-- 4. Activación de la cuenta del administrador -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i
              :class="
                cuentaAdminPasswordSetAt
                  ? 'pi pi-check-circle text-green-500'
                  : 'pi pi-clock text-amber-500'
              "
              class="text-lg"
            ></i>
            <span>4. Activación de la cuenta</span>
            <Tag
              v-if="cuentaAdminPasswordSetAt"
              value="Cuenta activada"
              severity="success"
              size="small"
            />
            <Tag
              v-else-if="cuentaAdminPersonaId"
              value="Pendiente de activar"
              severity="warn"
              size="small"
            />
          </div>
        </template>
        <template #content>
          <div
            v-if="!cuentaAdminPersonaId"
            class="text-sm text-surface-500 m-0"
          >
            Crea el administrador o presidente en la sección 3 para continuar.
          </div>
          <div v-else class="flex flex-col gap-3">
            <p class="text-sm m-0">
              La cuenta de <strong>{{ cuentaAdminEmail }}</strong> se creó con
              una contraseña temporal.
              <template v-if="!cuentaAdminPasswordSetAt">
                El onboarding se completa cuando esta persona configure su
                contraseña desde el enlace del email; así podrá iniciar sesión
                y administrar el condominio.
              </template>
              <template v-else>
                La persona ya configuró su contraseña y puede iniciar sesión.
              </template>
            </p>

            <Message
              v-if="cuentaAdminPasswordSetAt"
              severity="success"
              :closable="false"
              >Cuenta activada el
              {{ formatFechaHora(cuentaAdminPasswordSetAt) }}. El onboarding
              está completo.</Message
            >
            <Message v-else severity="warn" :closable="false"
              >Email de configuración enviado — pendiente de activación. El
              estado se verifica automáticamente; también puedes hacerlo
              manualmente.</Message
            >

            <div v-if="!cuentaAdminPasswordSetAt">
              <Button
                label="Verificar de nuevo"
                icon="pi pi-refresh"
                size="small"
                severity="secondary"
                variant="outlined"
                :loading="verificandoCuenta"
                @click="verificarCuenta"
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
      <div
        v-else-if="cuentaAdminPersonaId && !cuentaAdminPasswordSetAt"
        class="text-center text-amber-600 font-medium"
      >
        Onboarding casi completo: falta que {{ cuentaAdminEmail }} active su
        cuenta (paso 4).
      </div>
    </template>
  </div>
</template>

