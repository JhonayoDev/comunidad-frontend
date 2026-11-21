<script setup>
import { computed, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Message from "primevue/message";
import { TIPOS_VEHICULO } from "@/data/planillaColumnas";
import { labelTipoVehiculo } from "@/utils/unidadesConsulta";

const props = defineProps({
  visible: { type: Boolean, default: false },
  unidad: { type: Object, default: null },
  vehiculosExistentes: { type: Array, default: () => [] },
  puedeCrear: { type: Boolean, default: true },
  guardando: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits(["update:visible", "mover", "crear"]);

const modo = ref("EXISTENTE");
const seleccionadoId = ref(null);
const patente = ref("");
const tipo = ref("AUTO");
const marca = ref("");
const modelo = ref("");
const color = ref("");
const errorLocal = ref("");

const tipos = TIPOS_VEHICULO.map((value) => ({
  label: labelTipoVehiculo(value),
  value,
}));

const opciones = computed(() =>
  props.vehiculosExistentes.map((v) => ({
    label: `${v.patente} · ${labelTipoVehiculo(v.tipo)} · Unidad ${v.unidadNumero || "—"}`,
    value: v.id,
    vehiculo: v,
  })),
);

const vehiculoSeleccionado = computed(
  () =>
    props.vehiculosExistentes.find((v) => v.id === seleccionadoId.value) || null,
);

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return;
    errorLocal.value = "";
    seleccionadoId.value = null;
    patente.value = "";
    tipo.value = "AUTO";
    marca.value = "";
    modelo.value = "";
    color.value = "";
    modo.value = opciones.value.length ? "EXISTENTE" : "NUEVO";
  },
);

watch(
  () => props.vehiculosExistentes,
  (lista) => {
    // Si se agotan los vehículos movibles, el diálogo vuelve a "Nuevo".
    if (props.visible && !lista.length) modo.value = "NUEVO";
  },
);

function mover() {
  if (!vehiculoSeleccionado.value) {
    errorLocal.value = "Selecciona un vehículo para moverlo a esta casa.";
    return;
  }
  errorLocal.value = "";
  emit("mover", vehiculoSeleccionado.value);
}

function crear() {
  const valor = patente.value.trim().toUpperCase();
  if (valor.length < 4) {
    errorLocal.value = "Ingresa una patente válida (mínimo 4 caracteres).";
    return;
  }
  errorLocal.value = "";
  emit("crear", {
    patente: valor,
    tipo: tipo.value,
    unidadId: props.unidad?.id,
    marca: marca.value.trim() || null,
    modelo: modelo.value.trim() || null,
    color: color.value.trim() || null,
  });
}
</script>

<template>
  <Dialog
    :draggable="false"
    :visible="visible"
    header="Agregar vehículo"
    modal
    :style="{ width: '95%', maxWidth: '480px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-3">
      <p v-if="unidad" class="text-sm m-0">
        Destino: <strong>unidad {{ unidad.numero }}</strong>
      </p>

      <div class="flex flex-wrap gap-2" role="tablist" aria-label="Tipo de alta de vehículo">
        <Button
          label="Mover uno existente"
          icon="pi pi-arrow-right-arrow-left"
          size="small"
          :severity="modo === 'EXISTENTE' ? 'primary' : 'secondary'"
          :variant="modo === 'EXISTENTE' ? undefined : 'outlined'"
          @click="modo = 'EXISTENTE'"
        />
        <Button
          v-if="puedeCrear"
          label="Crear uno nuevo"
          icon="pi pi-plus"
          size="small"
          :severity="modo === 'NUEVO' ? 'primary' : 'secondary'"
          :variant="modo === 'NUEVO' ? undefined : 'outlined'"
          @click="modo = 'NUEVO'"
        />
      </div>

      <template v-if="modo === 'EXISTENTE'">
        <div v-if="!opciones.length" class="text-sm text-text-subprincipal">
          No hay vehículos en otras casas para mover. Crea uno nuevo.
        </div>
        <div v-else class="flex flex-col gap-1">
          <label for="vehiculo-existente" class="text-sm font-medium">
            Vehículo a mover
          </label>
          <Select
            id="vehiculo-existente"
            v-model="seleccionadoId"
            :options="opciones"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona un vehículo"
            filter
            class="w-full"
          />
          <span class="text-xs text-text-muted">
            Se cierra el vínculo con su casa actual y se abre uno nuevo en esta
            unidad. No se duplica el vehículo.
          </span>
        </div>
      </template>

      <template v-else>
        <div class="flex flex-col gap-1">
          <label for="vehiculo-patente" class="text-sm font-medium">Patente</label>
          <InputText
            id="vehiculo-patente"
            v-model="patente"
            class="w-full uppercase"
            maxlength="10"
            placeholder="ABCD12"
            autocomplete="off"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="vehiculo-tipo" class="text-sm font-medium">Tipo</label>
          <Select
            id="vehiculo-tipo"
            v-model="tipo"
            :options="tipos"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div class="flex flex-col gap-1">
            <label for="vehiculo-marca" class="text-sm font-medium">Marca</label>
            <InputText id="vehiculo-marca" v-model="marca" maxlength="50" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="vehiculo-modelo" class="text-sm font-medium">Modelo</label>
            <InputText id="vehiculo-modelo" v-model="modelo" maxlength="50" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="vehiculo-color" class="text-sm font-medium">Color</label>
            <InputText id="vehiculo-color" v-model="color" maxlength="30" />
          </div>
        </div>
        <span class="text-xs text-text-muted">
          Si la patente ya existe en otro condominio, se reutiliza el vehículo
          global. En este condominio no puede haber dos vehículos activos con la
          misma patente.
        </span>
      </template>

      <Message v-if="errorLocal" severity="warn" :closable="false">
        {{ errorLocal }}
      </Message>
      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    </div>

    <template #footer>
      <Button
        label="Cancelar"
        severity="secondary"
        :disabled="guardando"
        @click="emit('update:visible', false)"
      />
      <Button
        v-if="modo === 'EXISTENTE'"
        label="Mover a esta casa"
        icon="pi pi-arrow-right"
        :loading="guardando"
        :disabled="!opciones.length"
        @click="mover"
      />
      <Button
        v-else
        label="Agregar vehículo"
        icon="pi pi-plus"
        :loading="guardando"
        @click="crear"
      />
    </template>
  </Dialog>
</template>
