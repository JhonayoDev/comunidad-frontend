<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { adminService } from "@/services/adminService";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Password from "primevue/password";
import ToggleSwitch from "primevue/toggleswitch";
import Select from "primevue/select";
import Dialog from "primevue/dialog";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const route = useRoute();
const router = useRouter();
const confirm = useConfirm();

const condominioId = route.params.id;

const loadingConfig = ref(true);
const errorConfig = ref(null);
const tieneConfig = ref(false);
const guardando = ref(false);
const probando = ref(false);
const eliminando = ref(false);
const testResult = ref(null);
const mensaje = ref(null);

const form = ref({
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPassword: "",
  remitenteDefault: "",
  activo: true,
  tlsEnabled: true,
});

// ── Routing ──
const routingList = ref([]);
const loadingRouting = ref(true);
const errorRouting = ref(null);
const showRoutingDialog = ref(false);
const guardandoRouting = ref(false);
const routingForm = ref({ tipoNotificacion: "", proveedor: "BREVO" });

const proveedores = [
  { label: "Brevo (global)", value: "BREVO" },
  { label: "SMTP propio", value: "SMTP_PROPIO" },
];

// Subset de TipoNotificacion del backend (ver TipoNotificacion.java)
const tiposNotificacion = [
  "VISITA_PREAUTORIZADA",
  "VISITA_INGRESADA",
  "VISITA_RECHAZADA",
  "ENCOMIENDA_RECIBIDA",
  "ENCOMIENDA_ENTREGADA",
  "RECLAMO_CREADO",
  "RECLAMO_RESPONDIDO",
  "RECLAMO_CERRADO",
  "RESERVA_CREADA",
  "RESERVA_APROBADA",
  "RESERVA_RECHAZADA",
  "ANUNCIO_GENERAL_PUBLICADO",
  "GASTO_COMUN_PUBLICADO",
  "PAGO_REGISTRADO",
  "PAGO_CONFIRMADO",
].map((v) => ({ label: v, value: v }));

async function cargarConfig() {
  loadingConfig.value = true;
  errorConfig.value = null;
  testResult.value = null;
  try {
    const { data } = await adminService.getEmailConfig(condominioId);
    tieneConfig.value = true;
    form.value = {
      smtpHost: data.smtpHost || "",
      smtpPort: data.smtpPort || 587,
      smtpUser: data.smtpUser || "",
      // password no vuelve del backend (encriptado) → queda vacío, debe reingresarse
      smtpPassword: "",
      remitenteDefault: data.remitenteDefault || "",
      activo: data.activo ?? true,
      tlsEnabled: data.tlsEnabled ?? true,
    };
  } catch (e) {
    if (e?.response?.status === 404) {
      tieneConfig.value = false;
      form.value = {
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPassword: "",
        remitenteDefault: "",
        activo: true,
        tlsEnabled: true,
      };
    } else if (e?.response?.status === 403) {
      if (e?.moduleNotSubscribed) errorConfig.value = "Módulo no contratado para este condominio.";
      else errorConfig.value = "No tienes permiso para ver la configuración de email.";
      console.error("Error al cargar email config (403)", e);
    } else {
      errorConfig.value = e?.response?.data?.message || "No se pudo cargar la configuración de email.";
      console.error("Error al cargar email config", e);
    }
  } finally {
    loadingConfig.value = false;
  }
}

async function cargarRouting() {
  loadingRouting.value = true;
  errorRouting.value = null;
  try {
    const { data } = await adminService.getEmailRouting(condominioId);
    routingList.value = Array.isArray(data) ? data : [];
  } catch (e) {
    if (e?.response?.status === 404) routingList.value = [];
    else {
      errorRouting.value = e?.response?.data?.message || "No se pudo cargar el routing.";
      console.error("Error al cargar routing", e);
    }
  } finally {
    loadingRouting.value = false;
  }
}

function validarForm() {
  const f = form.value;
  if (!f.smtpHost?.trim()) return "Ingresa el host SMTP.";
  if (!f.smtpPort || f.smtpPort < 1 || f.smtpPort > 65535) return "Puerto SMTP inválido (1-65535).";
  if (!f.smtpUser?.trim()) return "Ingresa el usuario SMTP.";
  if (!f.smtpPassword?.trim()) return "Ingresa la contraseña SMTP.";
  if (!f.remitenteDefault?.trim()) return "Ingresa el remitente por defecto.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.remitenteDefault.trim())) return "Remitente debe ser un email válido.";
  return null;
}

async function guardar() {
  const err = validarForm();
  if (err) {
    mensaje.value = { severity: "warn", text: err };
    return;
  }
  guardando.value = true;
  mensaje.value = null;
  testResult.value = null;
  try {
    const payload = {
      smtpHost: form.value.smtpHost.trim(),
      smtpPort: Number(form.value.smtpPort),
      smtpUser: form.value.smtpUser.trim(),
      smtpPassword: form.value.smtpPassword,
      remitenteDefault: form.value.remitenteDefault.trim(),
      activo: !!form.value.activo,
      tlsEnabled: !!form.value.tlsEnabled,
    };
    await adminService.putEmailConfig(condominioId, payload);
    tieneConfig.value = true;
    mensaje.value = { severity: "success", text: "Configuración guardada." };
    // limpiar password tras guardar (backend la encripta)
    form.value.smtpPassword = "";
  } catch (e) {
    console.error("Error al guardar email config", e);
    const msg = e?.response?.data?.message || "No se pudo guardar la configuración.";
    const fieldMsg = e?.response?.data?.fields?.map((f) => `${f.field}: ${f.message}`).join(", ");
    mensaje.value = { severity: "error", text: fieldMsg || msg };
  } finally {
    guardando.value = false;
  }
}

function confirmarEliminar() {
  confirm.require({
    message: "¿Eliminar la configuración SMTP de este condominio? El envío volverá a Brevo global.",
    header: "Eliminar configuración",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Eliminar",
    rejectLabel: "Cancelar",
    acceptClass: "p-button-danger",
    accept: async () => {
      eliminando.value = true;
      try {
        await adminService.deleteEmailConfig(condominioId);
        tieneConfig.value = false;
        form.value.smtpPassword = "";
        mensaje.value = { severity: "success", text: "Configuración eliminada." };
      } catch (e) {
        console.error("Error al eliminar email config", e);
        mensaje.value = { severity: "error", text: e?.response?.data?.message || "No se pudo eliminar." };
      } finally {
        eliminando.value = false;
      }
    },
  });
}

async function probarConexion() {
  const err = validarForm();
  if (err) {
    testResult.value = { exitoso: false, mensaje: err, latenciaMs: 0 };
    return;
  }
  probando.value = true;
  testResult.value = null;
  try {
    const payload = {
      smtpHost: form.value.smtpHost.trim(),
      smtpPort: Number(form.value.smtpPort),
      smtpUser: form.value.smtpUser.trim(),
      smtpPassword: form.value.smtpPassword,
      remitenteDefault: form.value.remitenteDefault.trim(),
      activo: !!form.value.activo,
      tlsEnabled: !!form.value.tlsEnabled,
    };
    const { data } = await adminService.testEmailConfig(condominioId, payload);
    testResult.value = data;
  } catch (e) {
    console.error("Error al probar SMTP", e);
    testResult.value = {
      exitoso: false,
      mensaje: e?.response?.data?.message || e?.message || "Fallo al probar conexión.",
      latenciaMs: 0,
    };
  } finally {
    probando.value = false;
  }
}

function abrirRouting(tipo = "", proveedor = "BREVO") {
  routingForm.value = { tipoNotificacion: tipo, proveedor };
  showRoutingDialog.value = true;
}

async function guardarRouting() {
  if (!routingForm.value.tipoNotificacion?.trim()) {
    errorRouting.value = "Selecciona el tipo de notificación.";
    return;
  }
  if (!routingForm.value.proveedor) {
    errorRouting.value = "Selecciona el proveedor.";
    return;
  }
  guardandoRouting.value = true;
  errorRouting.value = null;
  try {
    const payload = {
      tipoNotificacion: routingForm.value.tipoNotificacion.trim(),
      proveedor: routingForm.value.proveedor,
    };
    await adminService.putEmailRouting(condominioId, payload);
    showRoutingDialog.value = false;
    await cargarRouting();
  } catch (e) {
    console.error("Error al guardar routing", e);
    errorRouting.value = e?.response?.data?.message || "No se pudo guardar el routing.";
  } finally {
    guardandoRouting.value = false;
  }
}

function proveedorSeverity(p) {
  if (p === "BREVO") return "info";
  if (p === "SMTP_PROPIO") return "success";
  return "secondary";
}

onMounted(() => {
  cargarConfig();
  cargarRouting();
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <Button icon="pi pi-arrow-left" severity="secondary" variant="text" @click="router.back()" />
      <h1 class="text-xl font-bold m-0">Email por condominio</h1>
      <Tag v-if="tieneConfig" value="Configurado" severity="success" size="small" />
      <Tag v-else value="Sin configurar" severity="secondary" size="small" />
    </div>

    <Message v-if="mensaje" :severity="mensaje.severity" :closable="true" @close="mensaje = null">{{ mensaje.text }}</Message>

    <!-- Config SMTP -->
    <Card>
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-envelope text-primary"></i>
          <span>Configuración SMTP</span>
        </div>
      </template>
      <template #subtitle>
        Credenciales SMTP propias del condominio. Si no se configura, el envío usa Brevo global. Requiere <strong>EMAIL_CONFIG_VER/EDITAR</strong> (SUPER_ADMIN/SOPORTE).
      </template>
      <template #content>
        <Skeleton v-if="loadingConfig" width="100%" height="220px" />
        <Message v-else-if="errorConfig" severity="error" :closable="false">{{ errorConfig }}</Message>
        <div v-else class="flex flex-col gap-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm">Host SMTP *</label>
              <InputText v-model="form.smtpHost" placeholder="smtp.mailgun.org" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm">Puerto *</label>
              <InputNumber v-model="form.smtpPort" :min="1" :max="65535" class="w-full" input-class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm">Usuario SMTP *</label>
              <InputText v-model="form.smtpUser" placeholder="postmaster@condominio.cl" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm">Contraseña *</label>
              <Password v-model="form.smtpPassword" placeholder="••••••••" :feedback="false" toggleMask class="w-full" input-class="w-full" />
              <small class="text-xs text-surface-400">No se prellena al editar; reingresa para guardar.</small>
            </div>
            <div class="flex flex-col gap-1 md:col-span-2">
              <label class="text-sm">Remitente por defecto *</label>
              <InputText v-model="form.remitenteDefault" placeholder="no-reply@condominio.cl" />
            </div>
          </div>
          <div class="flex gap-4 mt-1">
            <div class="flex items-center gap-2">
              <ToggleSwitch v-model="form.activo" inputId="cfg-activo" />
              <label for="cfg-activo" class="text-sm">Activo</label>
            </div>
            <div class="flex items-center gap-2">
              <ToggleSwitch v-model="form.tlsEnabled" inputId="cfg-tls" />
              <label for="cfg-tls" class="text-sm">TLS</label>
            </div>
          </div>

          <Message v-if="testResult" :severity="testResult.exitoso ? 'success' : 'error'" :closable="false">
            <div class="flex flex-col gap-1">
              <span class="font-medium">{{ testResult.exitoso ? "Conexión exitosa" : "Fallo de conexión" }} · {{ testResult.latenciaMs }} ms</span>
              <span class="text-xs break-words">{{ testResult.mensaje }}</span>
              <span v-if="testResult.remitenteDefault" class="text-xs">Remitente: {{ testResult.remitenteDefault }}</span>
            </div>
          </Message>

          <div class="flex gap-2 flex-wrap">
            <Button label="Guardar configuración" icon="pi pi-save" :loading="guardando" @click="guardar" />
            <Button label="Probar conexión" icon="pi pi-bolt" severity="secondary" variant="outlined" :loading="probando" @click="probarConexion" />
            <Button v-if="tieneConfig" label="Eliminar" icon="pi pi-trash" severity="danger" variant="outlined" :loading="eliminando" @click="confirmarEliminar" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Routing -->
    <Card>
      <template #title>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <i class="pi pi-share-alt text-primary"></i>
            <span>Routing por tipo de notificación</span>
          </div>
          <Button label="Nuevo routing" icon="pi pi-plus" size="small" @click="abrirRouting()" />
        </div>
      </template>
      <template #subtitle>
        Define por cada <strong>tipoNotificacion</strong> si el email sale por <strong>BREVO</strong> o <strong>SMTP_PROPIO</strong>. Vacío = usa el por defecto (Brevo).
      </template>
      <template #content>
        <Skeleton v-if="loadingRouting" width="100%" height="120px" />
        <Message v-else-if="errorRouting" severity="error" :closable="false">{{ errorRouting }}</Message>
        <div v-else-if="!routingList.length" class="text-sm text-surface-400 py-2">Sin routing personalizado — todos los tipos usan Brevo.</div>
        <div v-else class="overflow-x-auto">
          <table class="planilla w-full">
            <thead>
              <tr>
                <th>Tipo notificación</th>
                <th>Proveedor</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in routingList" :key="r.id || r.tipoNotificacion">
                <td class="font-medium">{{ r.tipoNotificacion }}</td>
                <td><Tag :value="r.proveedor" :severity="proveedorSeverity(r.proveedor)" size="small" /></td>
                <td class="text-right">
                  <Button icon="pi pi-pencil" size="small" severity="secondary" variant="text" @click="abrirRouting(r.tipoNotificacion, r.proveedor)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </Card>

    <ConfirmDialog />

    <Dialog v-model:visible="showRoutingDialog" header="Routing de email" modal :style="{ width: '95%', maxWidth: '420px' }">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Tipo notificación *</label>
          <Select v-model="routingForm.tipoNotificacion" :options="tiposNotificacion" optionLabel="label" optionValue="value" placeholder="Selecciona tipo" filter class="w-full" />
          <small class="text-xs text-surface-400">o escribe uno no listado</small>
          <InputText v-model="routingForm.tipoNotificacion" placeholder="EJ: VISITA_INGRESADA" class="mt-1" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Proveedor *</label>
          <Select v-model="routingForm.proveedor" :options="proveedores" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <Message v-if="errorRouting" severity="error" :closable="false">{{ errorRouting }}</Message>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showRoutingDialog = false" />
        <Button label="Guardar routing" :loading="guardandoRouting" @click="guardarRouting" />
      </template>
    </Dialog>
  </div>
</template>
