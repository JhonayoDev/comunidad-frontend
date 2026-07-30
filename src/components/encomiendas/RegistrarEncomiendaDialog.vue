<script setup>
import { ref, computed, watch } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { unidadesService } from "@/services/unidadesService";
import Dialog from "primevue/dialog";
import AutoComplete from "primevue/autocomplete";
import Select from "primevue/select";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";

const props = defineProps({
  visible: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits(["update:visible", "register"]);

const auth = useAuthStore();
const unidades = ref([]);
const loadingUnidades = ref(false);
const errores = ref({});
const previewUrl = ref(null);
const archivo = ref(null);
const unidadSeleccionada = ref(null);
const sugerenciasUnidades = ref([]);

const form = ref({ tipo: null, nombreDestinatario: "" });

const tiposEncomienda = [
  { label: "Carta", value: "CARTA" },
  { label: "Encomienda / Paquete", value: "ENCOMIENDA" },
];

const unidadesVisibles = computed(() =>
  (unidades.value || [])
    .filter((u) => u.tipo === "CASA")
    .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true })),
);

async function cargarUnidades() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  loadingUnidades.value = true;
  try {
    const { data } = await unidadesService.getUnidades(cid);
    unidades.value = data || [];
  } catch (e) {
    console.error("Error al cargar unidades:", e);
  } finally {
    loadingUnidades.value = false;
  }
}

function buscarUnidad(event) {
  const query = (event.query || "").toLowerCase();
  if (!query) {
    sugerenciasUnidades.value = [];
    return;
  }
  sugerenciasUnidades.value = unidadesVisibles.value.filter((u) => {
    const num = (u.numero || "").toLowerCase();
    return num.includes(query);
  });
}

function formatUnidad(unidad) {
  return `Casa ${unidad.numero}`;
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      form.value = { tipo: null, nombreDestinatario: "" };
      unidadSeleccionada.value = null;
      sugerenciasUnidades.value = [];
      errores.value = {};
      archivo.value = null;
      previewUrl.value = null;
      cargarUnidades();
    }
  },
);

function validar() {
  errores.value = {};
  if (!unidadSeleccionada.value) errores.value.unidadId = "Seleccione una casa";
  if (!form.value.tipo) errores.value.tipo = "Seleccione un tipo";
  if (!form.value.nombreDestinatario.trim()) errores.value.nombreDestinatario = "Campo obligatorio";
  return Object.keys(errores.value).length === 0;
}

function onFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  archivo.value = file;
  const reader = new FileReader();
  reader.onload = (e) => { previewUrl.value = e.target.result; };
  reader.readAsDataURL(file);
}

function quitarFoto() {
  archivo.value = null;
  previewUrl.value = null;
}

function handleRegister() {
  if (!validar()) return;
  emit("register", {
    formData: {
      unidadId: unidadSeleccionada.value.id,
      tipo: form.value.tipo,
      nombreDestinatario: form.value.nombreDestinatario,
    },
    archivo: archivo.value,
  });
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Nueva encomienda"
    modal
    :closable="!loading"
    class="w-full max-w-md m-4 bg-surface"
  >
    <div class="flex flex-col gap-3">
      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

      <p class="text-sm text-text/90 m-0">
        Registrar una nueva encomienda o carta para una casa
      </p>

      <div class="bg-background/90 p-3 flex flex-col gap-3 rounded-lg border border-border/60 shadow-lg">
        <div class="flex flex-col gap-1">
          <label class="text-sm">Tipo <span class="text-text-muted">(obligatorio)</span></label>
          <Select
            v-model="form.tipo"
            :options="tiposEncomienda"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccione tipo"
            :class="{ 'p-invalid': errores.tipo }"
            class="w-full"
          />
          <small v-if="errores.tipo" class="text-red-500">{{ errores.tipo }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm">Nombre destinatario <span class="text-text-muted">(obligatorio)</span></label>
          <InputText
            v-model="form.nombreDestinatario"
            placeholder="Nombre del destinatario"
            :class="{ 'p-invalid': errores.nombreDestinatario }"
          />
          <small v-if="errores.nombreDestinatario" class="text-red-500">{{ errores.nombreDestinatario }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm">Casa destino <span class="text-text-muted">(obligatorio)</span></label>
          <Skeleton v-if="loadingUnidades" width="100%" height="2.5rem" />
          <AutoComplete
            v-else
            v-model="unidadSeleccionada"
            :suggestions="sugerenciasUnidades"
            @complete="buscarUnidad"
            :optionLabel="formatUnidad"
            forceSelection
            showClear
            placeholder="Escriba el número de casa (ej: 10)"
            :class="{ 'p-invalid': errores.unidadId }"
            class="w-full"
            :loading="loadingUnidades"
          >
            <template #option="slotProps">
              <span>{{ formatUnidad(slotProps.option) }}</span>
            </template>
          </AutoComplete>
          <small v-if="errores.unidadId" class="text-red-500">{{ errores.unidadId }}</small>
          <small v-else class="text-text-muted">Escriba el número y seleccione de las sugerencias</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm">Fotografía <span class="text-text-muted">(opcional)</span></label>
          <div v-if="!previewUrl" class="flex gap-2">
            <Button label="Tomar foto" icon="pi pi-camera" size="small" severity="secondary" variant="outlined" class="rounded-lg border border-border/80" @click="$refs.fileInput.click()" />
            <Button label="Seleccionar" icon="pi pi-image" size="small" severity="secondary" variant="outlined" class="rounded-lg border border-border/80" @click="$refs.fileInput.click()" />
          </div>
          <div v-else class="relative">
            <img :src="previewUrl" alt="Preview" class="w-full h-40 object-cover rounded-lg border border-border/60" />
            <Button icon="pi pi-times" severity="danger" text rounded size="small" class="absolute top-1 right-1" @click="quitarFoto" />
          </div>
          <input ref="fileInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onFileChange" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 w-full">
        <Button
          class="flex-1 rounded-lg border border-border/80 shadow-lg"
          label="Cancelar"
          severity="secondary"
          text
          :disabled="loading"
          @click="$emit('update:visible', false)"
        />
        <Button
          class="flex-1 rounded-lg shadow-lg"
          label="Registrar"
          icon="pi pi-check"
          :disabled="!form.nombreDestinatario.trim() || !form.tipo || !unidadSeleccionada"
          :loading="loading"
          @click="handleRegister"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.hidden { display: none; }
</style>
