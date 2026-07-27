<template>
  <div class="p-4 flex flex-col gap-4 max-w-2xl mx-auto w-full">
    <Message v-if="error" severity="error">
      {{ error?.response?.data?.message || "Error al cargar configuración" }}
    </Message>

    <Card>
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-cloud-upload" />
          <span>Configuración de Almacenamiento</span>
        </div>
      </template>
      <template #content>
        <Skeleton v-if="isLoading" width="100%" height="300px" />
        <form v-else @submit.prevent="guardar" class="flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="w-full sm:flex-1">
              <label class="font-medium text-sm">Proveedor</label>
              <Select
                v-model="form.proveedor"
                :options="proveedores"
                optionLabel="label"
                optionValue="value"
                fluid
                :pt="{
                  root: {
                    style: {
                      '--p-select-background': 'var(--p-surface-200)',
                      '--p-select-placeholder-color': 'var(--p-surface-400)',
                    },
                  },
                }"
              />
            </div>
            <div class="w-full sm:flex-1 flex items-end">
              <div class="flex items-center gap-2 w-full">
                <InputSwitch v-model="form.activa" :binary="true" :inputId="'activa-switch'" />
                <label for="activa-switch" class="font-medium text-sm cursor-pointer">Activa</label>
              </div>
            </div>
          </div>

          <template v-if="form.proveedor === 'CLOUDFLARE_R2'">
            <Divider align="left"><span class="text-xs text-surface-500">Cloudflare R2</span></Divider>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="font-medium text-sm">Bucket</label>
                <InputText v-model="form.r2Bucket" placeholder="mi-condominio" fluid />
              </div>
              <div>
                <label class="font-medium text-sm">Account ID</label>
                <InputText v-model="form.r2AccountId" placeholder="abc123" fluid />
              </div>
              <div>
                <label class="font-medium text-sm">Access Key ID</label>
                <InputText v-model="form.r2AccessKeyId" placeholder="..." fluid />
              </div>
              <div>
                <label class="font-medium text-sm">Secret Key</label>
                <InputText v-model="form.r2SecretKey" type="password" placeholder="Dejar vacío para mantener el valor actual" fluid />
                <small v-if="config?.hasSecretKey" class="text-green-600 text-xs">Ya configurada</small>
                <small v-else class="text-surface-400 text-xs">Obligatorio si no hay una configurada</small>
              </div>
              <div class="sm:col-span-2">
                <label class="font-medium text-sm">Public URL</label>
                <InputText v-model="form.r2PublicUrl" placeholder="https://pub-abc.r2.dev" fluid />
              </div>
            </div>
          </template>

          <template v-if="form.proveedor === 'GOOGLE_DRIVE'">
            <Divider align="left"><span class="text-xs text-surface-500">Google Drive</span></Divider>
            <div>
              <label class="font-medium text-sm">Folder ID</label>
              <InputText v-model="form.driveFolderId" placeholder="1ABC..." fluid />
            </div>
            <div>
              <label class="font-medium text-sm">Service Account (JSON)</label>
              <Textarea v-model="form.driveCredentials" :autoResize="true" rows="6" placeholder='{ "type": "service_account", ... }' fluid />
              <small v-if="config?.hasDriveCredentials" class="text-green-600 text-xs">Ya configuradas</small>
              <small v-else class="text-surface-400 text-xs">Obligatorio si no hay credenciales configuradas</small>
            </div>
          </template>

          <div class="flex justify-end pt-2">
            <Button type="submit" :loading="isSaving" label="Guardar" icon="pi pi-check" />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { reactive, watch, computed } from "vue";
import { useConfiguracionAlmacenamiento } from "@/composables/useConfiguracionAlmacenamiento";

const { query, mutation } = useConfiguracionAlmacenamiento();

const proveedores = [
  { label: "Cloudflare R2", value: "CLOUDFLARE_R2" },
  { label: "Google Drive", value: "GOOGLE_DRIVE" },
];

const config = computed(() => query.data.value);

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

watch(config, (val) => {
  if (!val) return;
  form.proveedor = val.proveedor || "CLOUDFLARE_R2";
  form.r2Bucket = val.r2Bucket || "";
  form.r2AccountId = val.r2AccountId || "";
  form.r2AccessKeyId = val.r2AccessKeyId || "";
  form.r2SecretKey = "";
  form.r2PublicUrl = val.r2PublicUrl || "";
  form.driveFolderId = val.driveFolderId || "";
  form.driveCredentials = "";
  form.activa = val.activa !== false;
}, { immediate: false });

const isLoading = computed(() => query.isLoading.value);
const error = computed(() => query.error.value);
const isSaving = computed(() => mutation.isPending.value);

function guardar() {
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

  mutation.mutate(payload);
}
</script>
