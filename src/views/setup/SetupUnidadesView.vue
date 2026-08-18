<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useConfirm } from "primevue/useconfirm";
import {
  useSetupUnidades,
  TIPOS_UNIDAD_CREAR,
  PASOS_UNIDADES,
} from "@/composables/useSetupUnidades";
import { MODOS_NUMERACION } from "@/utils/numeracionUnidades";

import Card from "primevue/card";
import Button from "primevue/button";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import ConfirmDialog from "primevue/confirmdialog";

const emit = defineEmits(["actualizado"]);

const u = useSetupUnidades();
const confirm = useConfirm();

const asignarTodosValor = ref(null);
const SIN_SECTOR = "__sin_sector__";

const opcionesAsignarTodos = computed(() => {
  if (!u.sectoresOpciones.length) return [];
  return [{ ref: SIN_SECTOR, label: "Sin sector" }, ...u.sectoresOpciones];
});

const opcionesSectorFila = computed(() => [
  { ref: SIN_SECTOR, label: "Sin sector" },
  ...u.sectoresOpciones,
]);

watch(
  () => u.estado.paso,
  () => {
    asignarTodosValor.value = null;
  },
);

function aplicarAsignarTodos() {
  u.asignarTodos(asignarTodosValor.value === SIN_SECTOR ? null : asignarTodosValor.value);
}

function onSectorFilaChange(un) {
  if (un.sectorRef === SIN_SECTOR) un.sectorRef = null;
}

const SIN_PISO = "__sin_piso__";

const opcionesPisoFila = computed(() => [
  { value: SIN_PISO, label: "Sin piso" },
  ...u.pisosOpciones,
]);

function onPisoFilaChange(un) {
  if (un.piso === SIN_PISO) un.piso = null;
}

function pisoLabel(un) {
  if (un.piso === null || un.piso === undefined) return "—";
  const o = u.pisosOpciones.find((p) => p.value === un.piso);
  return o ? o.label : `${un.piso}`;
}

function tipoLabel(v) {
  return TIPOS_UNIDAD_CREAR.find((t) => t.value === v)?.label || v;
}

function sectorLabel(ref) {
  const o = u.sectoresOpciones.find((s) => s.ref === ref);
  return o ? o.label : "Sin sector";
}

function irAPaso(n) {
  if (n < u.estado.paso) u.estado.paso = n;
}

const editando = ref(false);
const snapshotEdicion = ref(null);

function entrarEdicion() {
  // Los errores de un guardado anterior no deben persistir al reintentar.
  u.estado.unidades.forEach((x) => (x.error = null));
  snapshotEdicion.value = JSON.parse(JSON.stringify(u.estado.unidades));
  editando.value = true;
}

function cancelarEdicion() {
  if (snapshotEdicion.value) u.estado.unidades = snapshotEdicion.value;
  editando.value = false;
}

function salirEdicion() {
  editando.value = false;
  u.ordenarUnidades();
}

function confirmarEliminar(un) {
  confirm.require({
    message: `¿Desactivar la unidad "${un.numero}"? No se podrá si tiene personas, vehículos u otras entidades activas vinculadas.`,
    header: "Desactivar unidad",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Desactivar",
    rejectLabel: "Cancelar",
    accept: () => u.eliminarFila(un),
  });
}

const mensajeResultado = computed(() => {
  const r = u.resultado;
  if (!r) return "";
  const partes = [];
  if (r.creadas) partes.push(`${r.creadas} unidades creadas`);
  if (r.actualizadas) partes.push(`${r.actualizadas} actualizadas`);
  if (r.eliminadas) partes.push(`${r.eliminadas} eliminadas`);
  return partes.length ? partes.join(", ") + "." : "Sin cambios.";
});

const erroresResumen = computed(() =>
  u.estado.unidades.filter((x) => x.error).map((x) => `${x.numero}: ${x.error}`)
);

async function guardar() {
  const ok = await u.enviar();
  if (ok) {
    salirEdicion();
    emit("actualizado");
  }
}

onMounted(() => u.cargar());
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-home"></i>
        <span>{{ u.modoReedicion ? "Edición de unidades" : "Paso 1 · Creación de unidades" }}</span>
      </div>
    </template>
    <template #content>
      <p class="text-sm text-surface-400 m-0">
        <template v-if="u.modoReedicion">
          Revisa y edita las unidades ya creadas: corrige número, tipo, piso o
          sector, agrega más filas o elimina las que no correspondan. La unidad
          del condominio es automática y no se edita aquí.
        </template>
        <template v-else>
          Define las unidades del condominio. La unidad del condominio se crea
          automáticamente y los estacionamientos/bodegas son entidades
          independientes (no se crean aquí).
        </template>
      </p>

      <Skeleton v-if="u.cargando" width="100%" height="200px" class="mt-3" />
      <Message v-else-if="u.error" severity="error" class="mt-3">{{ u.error }}</Message>

      <template v-else>
        <!-- Stepper de fases (oculto en reedición: se entra directo a fase 5) -->
        <div v-if="!u.modoReedicion" class="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            v-for="p in PASOS_UNIDADES"
            :key="p.numero"
            type="button"
            class="flex-1 flex items-center gap-2 p-2 border-round text-left transition-colors text-sm"
            :class="
              u.estado.paso === p.numero
                ? 'bg-primary text-white'
                : u.estado.paso > p.numero
                  ? 'bg-surface border border-border cursor-pointer'
                  : 'bg-surface border border-border opacity-60'
            "
            @click="irAPaso(p.numero)"
          >
            <span
              class="w-5 h-5 flex items-center justify-center border-round-full text-xs font-bold"
              :class="u.estado.paso > p.numero ? 'bg-primary text-white' : 'bg-emphasis'"
              >{{ p.numero }}</span
            >
            <span class="hidden sm:inline font-medium">{{ p.label }}</span>
          </button>
        </div>

        <!-- Fase 1: Tipo y cantidad -->
        <div v-if="u.estado.paso === 1" class="mt-4 flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm">Tipo de unidad</label>
            <Select
              v-model="u.estado.tipo"
              :options="TIPOS_UNIDAD_CREAR"
              optionLabel="label"
              optionValue="value"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm">Cantidad</label>
            <InputNumber
              v-model="u.estado.cantidad"
              :min="1"
              :max="1000"
              class="w-full"
            />
          </div>
          <small class="text-xs text-surface-400">
            La cantidad define el total para numeración correlativa. En "Por
            piso" el total se calcula de pisos × unidades por piso.
          </small>
        </div>

        <!-- Fase 2: Numeración -->
        <div v-else-if="u.estado.paso === 2" class="mt-4 flex flex-col gap-3">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="m in MODOS_NUMERACION"
              :key="m.value"
              type="button"
              class="flex-1 min-w-[140px] flex flex-col gap-1 p-3 border-round text-left transition-colors"
              :class="
                u.estado.modo === m.value
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border hover:bg-emphasis'
              "
              @click="u.estado.modo = m.value"
            >
              <span class="text-sm font-medium">{{ m.label }}</span>
              <span class="text-xs opacity-80">{{ m.descripcion }}</span>
            </button>
          </div>

          <div v-if="u.estado.modo === 'correlativo'" class="flex flex-col sm:flex-row gap-3">
            <div class="flex flex-col gap-1 flex-1">
              <label class="text-sm">Desde</label>
              <InputText v-model="u.estado.desde" placeholder="1" />
            </div>
            <div class="flex flex-col gap-1 flex-1">
              <label class="text-sm">Cantidad</label>
              <InputNumber
                v-model="u.estado.cantidad"
                :min="1"
                :max="1000"
                class="w-full"
              />
            </div>
          </div>

          <div v-else-if="u.estado.modo === 'por-piso'" class="flex flex-col sm:flex-row gap-3">
            <div class="flex flex-col gap-1 flex-1">
              <label class="text-sm">Pisos</label>
              <InputNumber v-model="u.estado.pisos" :min="1" :max="99" class="w-full" />
            </div>
            <div class="flex flex-col gap-1 flex-1">
              <label class="text-sm">Unidades por piso</label>
              <InputNumber v-model="u.estado.porPiso" :min="1" :max="99" class="w-full" />
            </div>
          </div>

          <Tag
            v-if="u.estado.modo === 'por-piso' && u.pisosDisponibles.length"
            :value="`Pisos declarados: ${u.pisosLista}`"
            severity="info"
            size="small"
            class="self-start"
          />

          <div v-else class="flex flex-col gap-1">
            <label class="text-sm">Lista de números (uno por línea o separados por coma)</label>
            <Textarea v-model="u.estado.personalizado" rows="6" />
          </div>

          <Tag
            :value="`${u.totalGeneradas} unidades generadas`"
            :severity="u.totalGeneradas ? 'info' : 'secondary'"
            size="small"
          />
        </div>

        <!-- Fase 3: Sectores -->
        <div v-else-if="u.estado.paso === 3" class="mt-4 flex flex-col gap-3">
          <Message v-if="!u.sectoresHabilitados" severity="warn" :closable="false">
            Tu cargo no tiene permisos para agrupar por sectores. Las unidades
            se guardarán sin agrupar.
          </Message>

          <template v-else>
            <div class="flex flex-col gap-1">
              <label class="text-sm">Agrupación</label>
              <Select
                v-model="u.estado.sectorOrigen"
                :options="[
                  { label: 'Sin agrupar', value: 'sin-sector' },
                  { label: 'Crear sectores nuevos', value: 'nuevo' },
                  { label: 'Usar sectores existentes', value: 'existente' },
                ]"
                optionLabel="label"
                optionValue="value"
              />
            </div>

            <div v-if="u.estado.sectorOrigen === 'sin-sector'" class="text-sm text-surface-400">
              Las unidades se crearán sin sector asignado.
            </div>

            <div v-else-if="u.estado.sectorOrigen === 'nuevo'" class="flex flex-col gap-3">
              <div
                v-for="(s, i) in u.estado.sectoresNuevos"
                :key="s.uid"
                class="flex flex-col sm:flex-row gap-2 items-end"
              >
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-sm">Nombre del sector {{ i + 1 }}</label>
                  <InputText v-model="s.nombre" placeholder="Ej: Torre A" />
                </div>
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-sm">Descripción (opcional)</label>
                  <InputText v-model="s.descripcion" />
                </div>
                <Button
                  v-if="u.estado.sectoresNuevos.length > 1"
                  icon="pi pi-times"
                  severity="danger"
                  variant="text"
                  size="small"
                  @click="u.eliminarSectorNuevo(i)"
                />
              </div>
              <div>
                <Button
                  label="Agregar sector"
                  icon="pi pi-plus"
                  size="small"
                  variant="text"
                  @click="u.agregarSectorNuevo"
                />
              </div>
            </div>

            <div v-else class="text-sm text-surface-400">
              Selecciona el sector de cada unidad en la siguiente fase
              (Asignación).
            </div>
          </template>
        </div>

        <!-- Fase 4: Asignación -->
        <div v-else-if="u.estado.paso === 4" class="mt-4 flex flex-col gap-3">
          <div v-if="u.sectoresOpciones.length" class="flex flex-col sm:flex-row gap-2 items-center">
            <label class="text-sm">Asignar todos a:</label>
            <Select
              v-model="asignarTodosValor"
              :options="opcionesAsignarTodos"
              optionLabel="label"
              optionValue="ref"
              placeholder="Sin sector"
              class="sm:w-64"
            />
            <Button
              label="Aplicar"
              icon="pi pi-check"
              size="small"
              :disabled="!asignarTodosValor"
              @click="aplicarAsignarTodos"
            />
          </div>
          <small v-else class="text-xs text-surface-400">
            Las unidades se guardarán sin sector.
          </small>

          <!-- Tabla desktop -->
          <div v-if="u.estado.unidades.length" class="planilla hidden md:block">
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Tipo</th>
                  <th>Piso</th>
                  <th>Sector</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="un in u.estado.unidades" :key="un.id">
                  <td>{{ un.numero }}</td>
                  <td>{{ tipoLabel(un.tipo) }}</td>
                  <td>{{ un.piso ?? "—" }}</td>
                  <td>
                    <Select
                      v-if="u.sectoresOpciones.length"
                      v-model="un.sectorRef"
                      :options="opcionesSectorFila"
                      optionLabel="label"
                      optionValue="ref"
                      placeholder="Sin sector"
                      class="w-full"
                      @change="onSectorFilaChange(un)"
                    />
                    <span v-else>Sin sector</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Cards mobile -->
          <div v-if="u.estado.unidades.length" class="flex flex-col gap-2 md:hidden">
            <div
              v-for="un in u.estado.unidades"
              :key="un.id"
              class="bg-surface border border-border p-3 border-round"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-medium">{{ un.numero }}</span>
                <Tag :value="tipoLabel(un.tipo)" severity="info" size="small" />
              </div>
              <div class="mt-2 flex flex-col gap-1">
                <Select
                  v-if="u.sectoresOpciones.length"
                  v-model="un.sectorRef"
                  :options="opcionesSectorFila"
                  optionLabel="label"
                  optionValue="ref"
                  placeholder="Sin sector"
                  class="w-full"
                  @change="onSectorFilaChange(un)"
                />
                <span v-else class="text-sm text-surface-400">Sin sector</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Fase 5: Revisar y guardar -->
        <div v-else class="mt-4 flex flex-col gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <Tag :value="`${u.estado.unidades.length} unidades`" severity="info" size="small" />
            <Button
              v-if="!editando"
              label="Editar"
              icon="pi pi-pencil"
              variant="text"
              size="small"
              @click="entrarEdicion"
            />
            <template v-else>
              <Button label="Listo" icon="pi pi-check" variant="text" size="small" @click="salirEdicion" />
              <Button label="Cancelar" variant="text" severity="secondary" size="small" @click="cancelarEdicion" />
              <Button label="Agregar fila" icon="pi pi-plus" variant="text" size="small" @click="u.agregarFila" />
            </template>
          </div>

          <Message
            v-if="erroresResumen.length"
            severity="error"
            :closable="false"
            class="mt-3"
          >
            <div class="flex flex-col gap-1">
              <span>No se pudieron guardar las siguientes unidades:</span>
              <span v-for="(e, i) in erroresResumen" :key="i" class="text-sm">{{ e }}</span>
            </div>
          </Message>

          <Message
            v-if="u.envelopeExcedido"
            severity="warn"
            :closable="false"
            >Atención: estas unidades podrían superar el límite del plan contratado
            ({{ u.capacidad.planUnidadLimit }} entidades en total). El backend
            validará el cupo al guardar.</Message
          >

          <div class="planilla hidden md:block">
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Tipo</th>
                  <th>Piso</th>
                  <th>Sector</th>
                  <th>Estado</th>
                  <th v-if="editando"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="un in u.estado.unidades"
                  :key="un.id"
                  :class="un.marcadoEliminar ? 'opacity-50' : ''"
                >
                  <td>
                    <template v-if="editando && !un.marcadoEliminar">
                      <InputText v-model="un.numero" size="small" class="w-full" />
                    </template>
                    <template v-else>
                      <span :class="un.marcadoEliminar ? 'line-through' : ''">{{ un.numero }}</span>
                      <Tag v-if="un.esNuevo" value="Nuevo" severity="success" size="small" class="ml-2" />
                    </template>
                  </td>
                  <td>
                    <template v-if="editando && !un.marcadoEliminar">
                      <Select
                        v-model="un.tipo"
                        :options="TIPOS_UNIDAD_CREAR"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                      />
                    </template>
                    <span v-else>{{ tipoLabel(un.tipo) }}</span>
                  </td>
                  <td>
                    <template v-if="editando && !un.marcadoEliminar">
                      <Select
                        v-if="opcionesPisoFila.length"
                        v-model="un.piso"
                        :options="opcionesPisoFila"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Sin piso"
                        class="w-full"
                        @change="onPisoFilaChange(un)"
                      />
                      <InputNumber
                        v-else
                        v-model="un.piso"
                        size="small"
                        class="w-full"
                        :min-fraction-digits="0"
                        :max-fraction-digits="0"
                      />
                    </template>
                    <span v-else>{{ pisoLabel(un) }}</span>
                  </td>
                  <td>
                    <template v-if="editando && !un.marcadoEliminar && u.sectoresOpciones.length">
                      <Select
                        v-model="un.sectorRef"
                        :options="opcionesSectorFila"
                        optionLabel="label"
                        optionValue="ref"
                        placeholder="Sin sector"
                        class="w-full"
                        @change="onSectorFilaChange(un)"
                      />
                    </template>
                    <span v-else>{{ sectorLabel(un.sectorRef) }}</span>
                  </td>
                  <td>
                    <Tag
                      v-if="un.error"
                      value="No eliminada"
                      severity="danger"
                      size="small"
                      :title="un.error"
                    />
                    <Tag v-else-if="un.marcadoEliminar" value="Eliminado" severity="danger" size="small" />
                    <span v-else class="text-green-500 text-sm">Listo</span>
                  </td>
                  <td v-if="editando">
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      variant="text"
                      size="small"
                      @click="confirmarEliminar(un)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Cards mobile -->
          <div class="flex flex-col gap-2 md:hidden">
            <div
              v-for="un in u.estado.unidades"
              :key="un.id"
              class="bg-surface border border-border p-3 border-round"
              :class="un.marcadoEliminar ? 'opacity-50' : ''"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <template v-if="editando && !un.marcadoEliminar">
                    <InputText v-model="un.numero" size="small" class="w-full" />
                  </template>
                  <template v-else>
                    <span class="font-medium" :class="un.marcadoEliminar ? 'line-through' : ''">{{ un.numero }}</span>
                    <Tag v-if="un.esNuevo" value="Nuevo" severity="success" size="small" class="ml-2" />
                  </template>
                </div>
                <div class="flex items-center gap-1">
                  <Tag v-if="!editando" :value="tipoLabel(un.tipo)" severity="info" size="small" />
                  <Button
                    v-if="editando"
                    icon="pi pi-trash"
                    severity="danger"
                    variant="text"
                    size="small"
                    @click="confirmarEliminar(un)"
                  />
                </div>
              </div>
              <div class="mt-2 flex flex-col gap-1">
                <template v-if="editando && !un.marcadoEliminar">
                  <label class="text-xs text-surface-400">Tipo</label>
                  <Select
                    v-model="un.tipo"
                    :options="TIPOS_UNIDAD_CREAR"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                  <div class="flex items-center gap-2">
                    <label class="text-xs text-surface-400 w-10">Piso</label>
                    <Select
                      v-if="opcionesPisoFila.length"
                      v-model="un.piso"
                      :options="opcionesPisoFila"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Sin piso"
                      class="flex-1"
                      @change="onPisoFilaChange(un)"
                    />
                    <InputNumber
                      v-else
                      v-model="un.piso"
                      size="small"
                      class="flex-1"
                      :min-fraction-digits="0"
                      :max-fraction-digits="0"
                    />
                  </div>
                  <template v-if="u.sectoresOpciones.length">
                    <label class="text-xs text-surface-400">Sector</label>
                    <Select
                      v-model="un.sectorRef"
                      :options="opcionesSectorFila"
                      optionLabel="label"
                      optionValue="ref"
                      placeholder="Sin sector"
                      class="w-full"
                      @change="onSectorFilaChange(un)"
                    />
                  </template>
                </template>
                <span v-else class="text-sm text-surface-400">
                  Piso {{ un.piso ?? "—" }} · {{ sectorLabel(un.sectorRef) }}
                </span>
                <Tag v-if="un.error" :value="un.error" severity="danger" size="small" />
                <Tag v-else-if="un.marcadoEliminar" value="Eliminado" severity="danger" size="small" />
              </div>
            </div>
          </div>

          <p v-if="u.resultado" class="text-sm text-green-500 mt-2 m-0">
            {{ mensajeResultado }}<template v-if="!u.tieneErrores"> Paso completado.</template>
          </p>
        </div>

        <!-- Navegación (oculta durante el modo edición: solo la toolbar de
             edición Listo/Cancelar/Agregar fila controla la fase 5) -->
        <div v-if="!editando" class="mt-4 flex justify-between items-center gap-2">
          <Button
            v-if="u.estado.paso > 1 && !u.modoReedicion"
            label="Anterior"
            icon="pi pi-arrow-left"
            variant="text"
            size="small"
            @click="u.atras"
          />
          <span v-else></span>

          <template v-if="u.estado.paso < 5">
            <Button
              label="Continuar"
              icon="pi pi-arrow-right"
              icon-pos="right"
              size="small"
              :disabled="!u.validoPaso(u.estado.paso)"
              @click="u.siguiente"
            />
          </template>
          <Button
            v-else
            label="Guardar unidades"
            icon="pi pi-save"
            :loading="u.enviando"
            :disabled="!u.itemsValidos"
            @click="guardar"
          />
        </div>
      </template>
    </template>
  </Card>
  <ConfirmDialog />
</template>
