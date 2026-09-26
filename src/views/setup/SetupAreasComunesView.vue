<script setup>
import { computed, onMounted, ref } from "vue";
import { useConfirm } from "primevue/useconfirm";
import {
  marcarPasoGuardado,
  pasosGuardados,
} from "@/composables/useSetupConfiguracion";
import {
  useSetupAreasComunes,
  TIPOS_ESPACIO,
} from "@/composables/useSetupAreasComunes";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import ConfirmDialog from "primevue/confirmdialog";

const emit = defineEmits(["actualizado"]);

const u = useSetupAreasComunes();
const confirm = useConfirm();

// Paso ya cerrado antes (por Guardar o por cierre sin configurar).
const yaCerrado = computed(() =>
  pasosGuardados.value.has(`${u.cid}:areas-comunes`),
);

function confirmarCerrarSinConfigurar() {
  confirm.require({
    message:
      "Se marcará el paso como completado sin crear áreas comunes. Podrás agregarlas después volviendo a esta vista.",
    header: "Cerrar paso sin configurar",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Cerrar paso",
    rejectLabel: "Cancelar",
    accept: () => {
      marcarPasoGuardado(u.cid, "areas-comunes");
      emit("actualizado");
    },
  });
}

const editando = ref(false);
const snapshotEdicion = ref(null);

function entrarEdicion() {
  // Ni errores ni resultado anterior deben persistir al reintentar.
  u.estado.items.forEach((x) => (x.error = null));
  u.estado.visitas.forEach((x) => (x.error = null));
  u.resultado = null;
  snapshotEdicion.value = JSON.parse(
    JSON.stringify({ items: u.estado.items, visitas: u.estado.visitas }),
  );
  editando.value = true;
}

function cancelarEdicion() {
  if (snapshotEdicion.value) {
    u.estado.items = snapshotEdicion.value.items;
    u.estado.visitas = snapshotEdicion.value.visitas;
  }
  editando.value = false;
}

function salirEdicion() {
  editando.value = false;
  u.ordenarEspacios();
}

function confirmarEliminar(item) {
  confirm.require({
    message: `¿Desactivar el espacio "${item.nombre}"? Podrás recrearlo después con el mismo nombre.`,
    header: "Desactivar espacio",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Desactivar",
    rejectLabel: "Cancelar",
    accept: () => u.eliminarFila(item),
  });
}

const SIN_SECTOR = "__sin_sector__";
const SIN_PISO = "__sin_piso__";

const opcionesSectorFila = computed(() => [
  { value: SIN_SECTOR, label: "Sin sector" },
  ...u.sectoresOpciones,
]);

const opcionesPisoFila = computed(() => [
  { value: SIN_PISO, label: "Sin piso" },
  ...u.pisosOpciones,
]);

function onSectorFilaChange(item) {
  if (item.sectorId === SIN_SECTOR) item.sectorId = null;
}

function onPisoFilaChange(item) {
  if (item.piso === SIN_PISO) item.piso = null;
}

function sectorLabel(item) {
  if (!item.sectorId) return "—";
  return (
    u.sectoresOpciones.find((s) => s.value === item.sectorId)?.label || "—"
  );
}

function pisoLabel(item) {
  if (item.piso === null || item.piso === undefined) return "—";
  return (
    u.pisosOpciones.find((p) => p.value === item.piso)?.label || `${item.piso}`
  );
}

const mensajeResultado = computed(() => {
  const r = u.resultado;
  if (!r) return "";
  const partes = [];
  if (r.creados) partes.push(`${r.creados} espacios creados`);
  if (r.actualizados) partes.push(`${r.actualizados} actualizados`);
  if (r.eliminados) partes.push(`${r.eliminados} eliminados`);
  if (r.visitas) partes.push(`${r.visitas} visitas ubicadas`);
  if (r.vinculadas) partes.push(`${r.vinculadas} visitas vinculadas al condominio`);
  return partes.length ? partes.join(", ") + "." : "Sin cambios.";
});

const erroresResumen = computed(() => [
  ...u.estado.items
    .filter((x) => x.error)
    .map((x) => `${x.nombre}: ${x.error}`),
  ...u.estado.visitas
    .filter((x) => x.error)
    .map((x) => `${x.nombre}: ${x.error}`),
]);

async function guardar() {
  const ok = await u.guardar();
  if (ok) {
    salirEdicion();
    marcarPasoGuardado(u.cid, "areas-comunes");
    emit("actualizado");
  }
}

onMounted(() => u.cargar());
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-building"></i>
        <span>Áreas comunes y visitas</span>
      </div>
    </template>
    <template #content>
      <Message severity="info" :closable="true" class="m-0">
        Pendiente: asignar el representante legal del condominio (vínculo
        PROPIETARIO a la unidad CONDOMINIO desde Residentes).
      </Message>

      <Skeleton v-if="u.cargando" width="100%" height="120px" class="mt-3" />
      <Message
        v-else-if="!u.espaciosHabilitados"
        severity="warn"
        :closable="false"
        class="mt-3"
      >
        Tu cargo no tiene permisos para gestionar espacios comunes (UNIDAD_*).
        Contacta al administrador del condominio.
      </Message>
      <Message v-else-if="u.error" severity="error" class="mt-3">{{
        u.error
      }}</Message>
      <template v-else>
        <div class="flex flex-wrap items-center gap-2 mt-3">
          <Tag
            :value="`${u.estado.items.length} espacios`"
            severity="info"
            size="small"
          />
          <Tag
            :value="`${u.estado.visitas.length} visitas`"
            severity="secondary"
            size="small"
          />
          <Button
            v-if="!editando"
            label="Editar"
            icon="pi pi-pencil"
            variant="text"
            size="small"
            @click="entrarEdicion"
          />
          <template v-else>
            <Button
              label="Listo"
              icon="pi pi-check"
              variant="text"
              size="small"
              @click="salirEdicion"
            />
            <Button
              label="Cancelar"
              variant="text"
              severity="secondary"
              size="small"
              @click="cancelarEdicion"
            />
            <Button
              label="Agregar espacio"
              icon="pi pi-plus"
              variant="text"
              size="small"
              @click="u.agregarFila"
            />
          </template>
        </div>

        <Message
          v-if="erroresResumen.length"
          severity="error"
          :closable="false"
          class="mt-3"
        >
          <div class="flex flex-col gap-1">
            <span>No se pudieron guardar los siguientes:</span>
            <span v-for="(e, i) in erroresResumen" :key="i" class="text-sm">{{ e }}</span>
          </div>
        </Message>

        <Message
          v-else-if="u.motivoBloqueo"
          severity="warn"
          :closable="false"
          class="mt-3"
        >
          {{ u.motivoBloqueo }}
        </Message>

        <!-- Card 1: espacios comunes -->
        <h3 class="text-sm font-semibold mt-4 mb-2">Espacios comunes</h3>
        <div class="planilla hidden md:block">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Piso</th>
                <th>Sector</th>
                <th>Estado</th>
                <th v-if="editando"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in u.estado.items"
                :key="item.id"
                :class="item.marcadoEliminar ? 'opacity-50' : ''"
              >
                <td>
                  <template v-if="editando && !item.marcadoEliminar">
                    <InputText
                      v-model="item.nombre"
                      size="small"
                      class="w-full"
                      maxlength="60"
                    />
                  </template>
                  <template v-else>
                    <span :class="item.marcadoEliminar ? 'line-through' : ''">{{
                      item.nombre
                    }}</span>
                    <Tag
                      v-if="item.esNuevo"
                      value="Nuevo"
                      severity="success"
                      size="small"
                      class="ml-2"
                    />
                    <Tag
                      v-if="u.esDuplicado(item)"
                      value="Duplicado"
                      severity="warn"
                      size="small"
                      class="ml-2"
                      title="Ya hay otra fila con este nombre"
                    />
                  </template>
                </td>
                <td>
                  <template v-if="editando && !item.marcadoEliminar">
                    <Select
                      v-model="item.tipo"
                      :options="
                        TIPOS_ESPACIO.map((t) => ({ label: t, value: t }))
                      "
                      optionLabel="label"
                      optionValue="value"
                      size="small"
                      class="w-full"
                    />
                  </template>
                  <Tag
                    v-else
                    :value="item.tipo"
                    severity="secondary"
                    size="small"
                  />
                </td>
                <td>
                  <template v-if="editando && !item.marcadoEliminar">
                    <Select
                      v-if="u.pisosHabilitados"
                      :modelValue="item.piso ?? SIN_PISO"
                      :options="opcionesPisoFila"
                      optionLabel="label"
                      optionValue="value"
                      size="small"
                      class="w-full"
                      @update:modelValue="
                        (v) => {
                          item.piso = v;
                          onPisoFilaChange(item);
                        }
                      "
                    />
                    <InputNumber
                      v-else
                      v-model="item.piso"
                      size="small"
                      class="w-full"
                      placeholder="—"
                    />
                  </template>
                  <span v-else>{{ pisoLabel(item) }}</span>
                </td>
                <td>
                  <template v-if="editando && !item.marcadoEliminar">
                    <Select
                      :modelValue="item.sectorId ?? SIN_SECTOR"
                      :options="opcionesSectorFila"
                      optionLabel="label"
                      optionValue="value"
                      size="small"
                      class="w-full"
                      @update:modelValue="
                        (v) => {
                          item.sectorId = v;
                          onSectorFilaChange(item);
                        }
                      "
                    />
                  </template>
                  <span v-else>{{ sectorLabel(item) }}</span>
                </td>
                <td>
                  <Tag
                    v-if="item.error"
                    value="No guardado"
                    severity="danger"
                    size="small"
                    :title="item.error"
                  />
                  <Tag
                    v-else-if="item.marcadoEliminar"
                    value="Eliminado"
                    severity="danger"
                    size="small"
                  />
                  <span v-else class="text-green-500 text-sm">Listo</span>
                </td>
                <td v-if="editando">
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    variant="text"
                    size="small"
                    @click="confirmarEliminar(item)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cards mobile: espacios -->
        <div class="flex flex-col gap-2 md:hidden mt-3">
          <div
            v-for="item in u.estado.items"
            :key="item.id"
            class="bg-surface border border-border p-3 border-round"
            :class="item.marcadoEliminar ? 'opacity-50' : ''"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0 flex-1">
                <template v-if="editando && !item.marcadoEliminar">
                  <InputText
                    v-model="item.nombre"
                    size="small"
                    class="w-full"
                    maxlength="60"
                  />
                </template>
                <template v-else>
                  <span
                    class="font-medium"
                    :class="item.marcadoEliminar ? 'line-through' : ''"
                    >{{ item.nombre }}</span
                  >
                  <Tag
                    v-if="item.esNuevo"
                    value="Nuevo"
                    severity="success"
                    size="small"
                    class="ml-2"
                  />
                  <Tag
                    v-if="u.esDuplicado(item)"
                    value="Duplicado"
                    severity="warn"
                    size="small"
                    class="ml-2"
                    title="Ya hay otra fila con este nombre"
                  />
                </template>
              </div>
              <Button
                v-if="editando"
                icon="pi pi-trash"
                severity="danger"
                variant="text"
                size="small"
                @click="confirmarEliminar(item)"
              />
            </div>
            <div class="mt-2 flex flex-col gap-2">
              <template v-if="editando && !item.marcadoEliminar">
                <Select
                  v-model="item.tipo"
                  :options="TIPOS_ESPACIO.map((t) => ({ label: t, value: t }))"
                  optionLabel="label"
                  optionValue="value"
                  size="small"
                  class="w-full"
                />
                <Select
                  v-if="u.pisosHabilitados"
                  :modelValue="item.piso ?? SIN_PISO"
                  :options="opcionesPisoFila"
                  optionLabel="label"
                  optionValue="value"
                  size="small"
                  class="w-full"
                  @update:modelValue="
                    (v) => {
                      item.piso = v;
                      onPisoFilaChange(item);
                    }
                  "
                />
                <InputNumber
                  v-else
                  v-model="item.piso"
                  size="small"
                  class="w-full"
                  placeholder="Piso"
                />
                <Select
                  :modelValue="item.sectorId ?? SIN_SECTOR"
                  :options="opcionesSectorFila"
                  optionLabel="label"
                  optionValue="value"
                  size="small"
                  class="w-full"
                  @update:modelValue="
                    (v) => {
                      item.sectorId = v;
                      onSectorFilaChange(item);
                    }
                  "
                />
                </template>
                <template v-else>
                <span class="text-sm text-surface-400"
                  >{{ item.tipo }} · Piso {{ pisoLabel(item) }} ·
                  {{ sectorLabel(item) }}</span
                >
              </template>
              <Tag
                v-if="item.error"
                :value="item.error"
                severity="danger"
                size="small"
              />
              <Tag
                v-else-if="item.marcadoEliminar"
                value="Eliminado"
                severity="danger"
                size="small"
              />
            </div>
          </div>
          <p v-if="!u.estado.items.length" class="text-sm text-text-muted m-0">
            Sin espacios declarados. Pulsa Editar y agrega el primero.
          </p>
        </div>

        <!-- Card 2: estacionamientos de visita -->
        <h3 class="text-sm font-semibold mt-4 mb-2">
          Estacionamientos de visita (EV-)
        </h3>
        <p v-if="editando && u.estado.visitas.length" class="text-xs text-text-muted mt-0 mb-2">
          Aquí solo se ubican (piso/sector). Para agregar nuevos
          estacionamientos de visita hazlo en el paso Estacionamientos.
        </p>
        <p v-if="!u.estado.visitas.length" class="text-sm text-text-muted m-0">
          Sin estacionamientos de visita. Se crean con prefijo EV- en el paso
          Estacionamientos.
        </p>
        <div v-else class="planilla hidden md:block">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Piso</th>
                <th>Sector</th>
                <th>Vínculo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in u.estado.visitas" :key="item.id">
                <td>{{ item.nombre }}</td>
                <td>
                  <template v-if="editando">
                    <Select
                      v-if="u.pisosHabilitados"
                      :modelValue="item.piso ?? SIN_PISO"
                      :options="opcionesPisoFila"
                      optionLabel="label"
                      optionValue="value"
                      size="small"
                      class="w-full"
                      @update:modelValue="
                        (v) => {
                          item.piso = v;
                          onPisoFilaChange(item);
                        }
                      "
                    />
                    <InputNumber
                      v-else
                      v-model="item.piso"
                      size="small"
                      class="w-full"
                    />
                  </template>
                  <span v-else>{{ pisoLabel(item) }}</span>
                </td>
                <td>
                  <template v-if="editando">
                    <Select
                      :modelValue="item.sectorId ?? SIN_SECTOR"
                      :options="opcionesSectorFila"
                      optionLabel="label"
                      optionValue="value"
                      size="small"
                      class="w-full"
                      @update:modelValue="
                        (v) => {
                          item.sectorId = v;
                          onSectorFilaChange(item);
                        }
                      "
                    />
                  </template>
                  <span v-else>{{ sectorLabel(item) }}</span>
                </td>
                <td>
                  <Tag
                    v-if="item.vinculadoA"
                    :value="item.vinculadoA.tipoUnidad === 'CONDOMINIO' ? 'Condominio' : `Casa ${item.vinculadoA.unidadNumero ?? '—'}`"
                    severity="success"
                    size="small"
                    :title="`Vinculado (${item.vinculadoA.tipoUnidad || ''})`"
                  />
                  <Tag
                    v-else
                    value="Sin vincular"
                    severity="warn"
                    size="small"
                    title="Se vinculará al condominio al guardar"
                  />
                </td>
                <td>
                  <Tag
                    v-if="item.error"
                    value="No guardado"
                    severity="danger"
                    size="small"
                    :title="item.error"
                  />
                  <span v-else class="text-green-500 text-sm">Listo</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cards mobile: visitas -->
        <div
          v-if="u.estado.visitas.length"
          class="flex flex-col gap-2 md:hidden mt-3"
        >
          <div
            v-for="item in u.estado.visitas"
            :key="item.id"
            class="bg-surface border border-border p-3 border-round"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium">{{ item.nombre }}</span>
              <div class="flex items-center gap-1">
                <Tag
                  v-if="item.vinculadoA"
                  :value="item.vinculadoA.tipoUnidad === 'CONDOMINIO' ? 'Condominio' : `Casa ${item.vinculadoA.unidadNumero ?? '—'}`"
                  severity="success"
                  size="small"
                />
                <Tag v-else value="Sin vincular" severity="warn" size="small" />
                <Tag
                  v-if="item.error"
                  :value="item.error"
                  severity="danger"
                  size="small"
                />
              </div>
            </div>
            <div class="mt-2 flex flex-col gap-2">
              <template v-if="editando">
                <Select
                  v-if="u.pisosHabilitados"
                  :modelValue="item.piso ?? SIN_PISO"
                  :options="opcionesPisoFila"
                  optionLabel="label"
                  optionValue="value"
                  size="small"
                  class="w-full"
                  @update:modelValue="
                    (v) => {
                      item.piso = v;
                      onPisoFilaChange(item);
                    }
                  "
                />
                <InputNumber
                  v-else
                  v-model="item.piso"
                  size="small"
                  class="w-full"
                  placeholder="Piso"
                />
                <Select
                  :modelValue="item.sectorId ?? SIN_SECTOR"
                  :options="opcionesSectorFila"
                  optionLabel="label"
                  optionValue="value"
                  size="small"
                  class="w-full"
                  @update:modelValue="
                    (v) => {
                      item.sectorId = v;
                      onSectorFilaChange(item);
                    }
                  "
                />
              </template>
              <span v-else class="text-sm text-text-muted"
                >Piso {{ pisoLabel(item) }} · {{ sectorLabel(item) }}</span
              >
            </div>
          </div>
        </div>

        <Message
          v-if="u.resultado"
          severity="success"
          :closable="false"
          class="mt-2"
        >
          {{ mensajeResultado
          }}<template v-if="!u.tieneErrores"> Paso completado.</template>
        </Message>

        <div v-if="!editando" class="mt-4 flex flex-col items-end gap-2">
          <Button
            :label="
              u.hayCambios
                ? `Guardar áreas (${u.pendientes.total})`
                : 'Guardar áreas'
            "
            icon="pi pi-save"
            :loading="u.enviando"
            :disabled="!u.itemsValidos || !u.hayCambios"
            :title="u.motivoBloqueo || (!u.hayCambios ? 'Sin cambios pendientes' : '')"
            @click="guardar"
          />
          <Button
            v-if="!u.estado.items.length && !u.hayCambios && !yaCerrado"
            label="Cerrar paso sin configurar áreas comunes"
            variant="text"
            severity="secondary"
            size="small"
            @click="confirmarCerrarSinConfigurar"
          />
          <span
            v-if="!u.estado.items.length && yaCerrado"
            class="text-xs text-text-muted"
          >
            Paso cerrado sin áreas comunes. Puedes agregarlas con Editar.
          </span>
        </div>
      </template>
    </template>
  </Card>
  <ConfirmDialog />
</template>
