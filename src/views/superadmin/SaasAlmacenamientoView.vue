<script setup>
import { ref, onMounted, reactive } from "vue";
import { adminService } from "@/services/adminService";
import { almacenamientoService } from "@/services/almacenamientoService";

import Card from "primevue/card";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Select from "primevue/select";
import InputSwitch from "primevue/inputswitch";
import Divider from "primevue/divider";
import Paginator from "primevue/paginator";

const loading = ref(true);
const error = ref(null);
const condominios = ref([]);
const configs = ref({}); // { [condominioId]: { data, error, status } }
const total = ref(0);
const page = ref(0);
const size = ref(20);

const showEditar = ref(false);
const editandoId = ref(null);
const guardando = ref(false);
const mensaje = ref(null);

const proveedores = [
  { label: "Cloudflare R2", value: "CLOUDFLARE_R2" },
  { label: "Google Drive", value: "GOOGLE_DRIVE" },
];

const form = reactive({
  proveedor: "CLOUDFLARE_R2",
  r2Bucket: "",
  r2AccountId: "",
  r2AccessKeyId: "",
  r2SecretKey: "",
  r2PublicUrl: "",
  driveFolderId: "",
  driveCredentials: "",
  activa: true,
});

async function cargar() {
  loading.value = true;
  error.value = null;
  try {
    const params = { page: page.value, size: size.value };
    const { data } = await adminService.listarCondominios(params);
    condominios.value = data.content || [];
    total.value = data.totalElements || 0;
    // BFF: por fila GET /configuracion-almacenamiento (404 → Sin configurar)
    const results = await Promise.allSettled(
      condominios.value.map((c) => almacenamientoService.obtener(c.id)),
    );
    const map = {};
    results.forEach((r, idx) => {
      const cid = condominios.value[idx].id;
      if (r.status === "fulfilled") {
        map[cid] = { data: r.value.data, status: 200 };
      } else {
        const status = r.reason?.response?.status;
        if (status === 404) map[cid] = { data: null, status: 404 };
        else {
          map[cid] = { data: null, status, error: r.reason };
          console.error("Error al cargar config almacenamiento", cid, r.reason);
        }
      }
    });
    configs.value = map;
  } catch (e) {
    console.error("Error al cargar condominios", e);
    error.value = "No se pudieron cargar los condominios";
  } finally {
    loading.value = false;
  }
}

function usoPct(c) {
  if (!c.storageLimitMb) return 0;
  return Math.min(100, Math.round((c.storageUsadoMb / c.storageLimitMb) * 100));
}

function cfgDe(cid) {
  return configs.value[cid] || { data: null, status: null };
}

function abrirEditar(cid) {
  editandoId.value = cid;
  const cfg = cfgDe(cid).data;
  form.proveedor = cfg?.proveedor || "CLOUDFLARE_R2";
  form.r2Bucket = cfg?.r2Bucket || "";
  form.r2AccountId = cfg?.r2AccountId || "";
  form.r2AccessKeyId = cfg?.r2AccessKeyId || "";
  form.r2SecretKey = "";
  form.r2PublicUrl = cfg?.r2PublicUrl || "";
  form.driveFolderId = cfg?.driveFolderId || "";
  form.driveCredentials = "";
  form.activa = cfg?.activa !== false;
  mensaje.value = null;
  showEditar.value = true;
}

async function guardar() {
  if (!editandoId.value) return;
  guardando.value = true;
  mensaje.value = null;
  try {
    const payload = {
      proveedor: form.proveedor,
      activa: form.activa,
    };
    if (form.proveedor === "CLOUDFLARE_R2") {
      payload.r2Bucket = form.r2Bucket || null;
      payload.r2AccountId = form.r2AccountId || null;
      payload.r2AccessKeyId = form.r2AccessKeyId || null;
      payload.r2SecretKey = form.r2SecretKey || null;
      payload.r2PublicUrl = form.r2PublicUrl || null;
      payload.driveFolderId = null;
      payload.driveCredentials = null;
    } else {
      payload.r2Bucket = null;
      payload.r2AccountId = null;
      payload.r2AccessKeyId = null;
      payload.r2SecretKey = null;
      payload.r2PublicUrl = null;
      payload.driveFolderId = form.driveFolderId || null;
      payload.driveCredentials = form.driveCredentials || null;
    }
    const { data } = await almacenamientoService.guardar(editandoId.value, payload);
    configs.value[editandoId.value] = { data, status: 200 };
    showEditar.value = false;
  } catch (e) {
    console.error("Error al guardar configuración", e);
    mensaje.value = e?.response?.data?.message || "No se pudo guardar la configuración.";
  } finally {
    guardando.value = false;
  }
}

onMounted(cargar);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Almacenamiento por condominio</h1>
      <Tag value="BFF" severity="info" size="small" />
    </div>
    <p class="text-sm text-surface-500 m-0">
      Configuración por condominio (<code>GET/PUT /condominios/{id}/configuracion-almacenamiento</code> con <code>ALMACENAMIENTO_CONFIGURAR</code>). 404 → Sin configurar. SUPER_ADMIN tiene permiso vía <code>rol_permisos</code>.
    </p>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>

    <template v-else>
      <div v-if="!condominios.length" class="text-center text-surface-400 py-8">No hay condominios</div>

      <template v-else>
        <!-- Desktop: planilla -->
        <div class="planilla hidden md:block">
          <table>
            <thead>
              <tr>
                <th>Condominio</th>
                <th>Plan</th>
                <th>Uso</th>
                <th>Proveedor</th>
                <th>Activa</th>
                <th>Credencial</th>
                <th class="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in condominios" :key="c.id">
                <td>
                  <div class="font-medium">{{ c.nombre }}</div>
                  <div class="text-xs text-surface-400">{{ c.id.slice(0, 8) }}</div>
                </td>
                <td class="whitespace-nowrap">{{ c.planNombre }}</td>
                <td class="min-w-40">
                  <div class="text-xs">{{ (c.storageUsadoMb / 1024).toFixed(1) }} / {{ (c.storageLimitMb / 1024).toFixed(1) }} GB</div>
                  <div class="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden mt-1">
                    <div class="h-full rounded-full" :class="usoPct(c) >= 100 ? 'bg-red-500' : 'bg-primary'" :style="{ width: usoPct(c) + '%' }"></div>
                  </div>
                </td>
                <td class="whitespace-nowrap">
                  <template v-if="cfgDe(c.id).status === 404">
                    <Tag value="Sin configurar" severity="secondary" size="small" />
                  </template>
                  <template v-else-if="cfgDe(c.id).data">
                    <Tag :value="cfgDe(c.id).data.proveedor" severity="info" size="small" />
                  </template>
                  <template v-else>
                    <Tag value="—" severity="secondary" size="small" />
                  </template>
                </td>
                <td class="whitespace-nowrap">
                  <Tag v-if="cfgDe(c.id).data" :value="cfgDe(c.id).data.activa ? 'Sí' : 'No'" :severity="cfgDe(c.id).data.activa ? 'success' : 'secondary'" size="small" />
                  <span v-else class="text-xs text-surface-400">—</span>
                </td>
                <td class="whitespace-nowrap">
                  <template v-if="cfgDe(c.id).data">
                    <Tag v-if="cfgDe(c.id).data.hasSecretKey || cfgDe(c.id).data.hasDriveCredentials" value="Configurada" severity="success" size="small" />
                    <Tag v-else value="Falta credencial" severity="warn" size="small" />
                  </template>
                  <span v-else class="text-xs text-surface-400">—</span>
                </td>
                <td class="text-right whitespace-nowrap">
                  <Button label="Editar" size="small" severity="secondary" variant="outlined" @click="abrirEditar(c.id)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile: cards -->
        <div class="grid grid-cols-1 gap-3 md:hidden">
          <Card v-for="c in condominios" :key="c.id">
            <template #content>
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-bold text-sm">{{ c.nombre }}</span>
                  <Tag :value="c.planNombre" severity="secondary" size="small" />
                </div>
                <div class="text-xs text-surface-500">{{ (c.storageUsadoMb / 1024).toFixed(1) }} / {{ (c.storageLimitMb / 1024).toFixed(1) }} GB</div>
                <div class="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
                  <div class="h-full rounded-full" :class="usoPct(c) >= 100 ? 'bg-red-500' : 'bg-primary'" :style="{ width: usoPct(c) + '%' }"></div>
                </div>
                <div class="flex flex-wrap gap-1">
                  <Tag v-if="cfgDe(c.id).status === 404" value="Sin configurar" severity="secondary" size="small" />
                  <template v-else-if="cfgDe(c.id).data">
                    <Tag :value="cfgDe(c.id).data.proveedor" severity="info" size="small" />
                    <Tag :value="cfgDe(c.id).data.activa ? 'Activa' : 'Inactiva'" :severity="cfgDe(c.id).data.activa ? 'success' : 'secondary'" size="small" />
                  </template>
                </div>
                <Button label="Editar" size="small" severity="secondary" variant="outlined" class="w-full" @click="abrirEditar(c.id)" />
              </div>
            </template>
          </Card>
        </div>

        <Paginator :rows="size" :totalRecords="total" :first="page * size" @page="page = $event.page; cargar()" />
      </template>
    </template>

    <Dialog v-model:visible="showEditar" header="Configuración de Almacenamiento" modal :style="{ width: '95%', maxWidth: '520px' }">
      <div class="flex flex-col gap-4">
        <Message v-if="mensaje" severity="error" :closable="false">{{ mensaje }}</Message>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Proveedor</label>
          <Select v-model="form.proveedor" :options="proveedores" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div class="flex items-center gap-2">
          <InputSwitch v-model="form.activa" :binary="true" inputId="saas-activa" />
          <label for="saas-activa" class="text-sm">Activa</label>
        </div>

        <template v-if="form.proveedor === 'CLOUDFLARE_R2'">
          <Divider align="left"><span class="text-xs text-surface-500">Cloudflare R2</span></Divider>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm">Bucket</label>
              <InputText v-model="form.r2Bucket" placeholder="mi-condominio" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm">Account ID</label>
              <InputText v-model="form.r2AccountId" placeholder="abc123" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm">Access Key ID</label>
              <InputText v-model="form.r2AccessKeyId" placeholder="..." />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm">Secret Key</label>
              <InputText v-model="form.r2SecretKey" type="password" placeholder="Vacío mantiene actual" />
              <small v-if="cfgDe(editandoId)?.data?.hasSecretKey" class="text-green-600 text-xs">Ya configurada</small>
            </div>
            <div class="sm:col-span-2 flex flex-col gap-1">
              <label class="text-sm">Public URL</label>
              <InputText v-model="form.r2PublicUrl" placeholder="https://pub-abc.r2.dev" />
            </div>
          </div>
        </template>

        <template v-else>
          <Divider align="left"><span class="text-xs text-surface-500">Google Drive</span></Divider>
          <div class="flex flex-col gap-1">
            <label class="text-sm">Folder ID</label>
            <InputText v-model="form.driveFolderId" placeholder="1ABC..." />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm">Service Account (JSON)</label>
            <Textarea v-model="form.driveCredentials" :autoResize="true" rows="6" placeholder='{ "type": "service_account", ... }' />
            <small v-if="cfgDe(editandoId)?.data?.hasDriveCredentials" class="text-green-600 text-xs">Ya configuradas</small>
          </div>
        </template>
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" variant="text" @click="showEditar = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="guardando" @click="guardar" />
      </template>
    </Dialog>
  </div>
</template>
