<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useSetupEntidades, PASOS_ENTIDADES } from "@/composables/useSetupEntidades";
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

const props = defineProps({
  entidad: { type: String, default: "estacionamiento" },
});
const emit = defineEmits(["actualizado"]);

const u = useSetupEntidades({ entidad: props.entidad });

const etiquetas = computed(() => ({
  singular: props.entidad === "bodega" ? "bodega" : "estacionamiento",
  plural: props.entidad === "bodega" ? "bodegas" : "estacionamientos",
}));

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

function onSectorFilaChange(item) {
  if (item.sectorRef === SIN_SECTOR) item.sectorRef = null;
}

function sectorLabel(ref) {
  const o = u.sectoresOpciones.find((s) => s.ref === ref);
  return o ? o.label : "Sin sector";
}

function irAPaso(n) {
  if (n < u.estado.paso) u.estado.paso = n;
}

async function guardar() {
  const ok = await u.enviar();
  if (ok) emit("actualizado");
}

onMounted(() => u.cargar());
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <i :class="props.entidad === 'bodega' ? 'pi pi-box' : 'pi pi-car'"></i>
        <span>Creación de {{ etiquetas.plural }}</span>
      </div>
    </template>
    <template #content>
      <p class="text-sm text-surface-400 m-0">
        <template v-if="u.multigrupo">
          Registra todos los estacionamientos en una sola ventana: propietarios
          (prefijo E-) y visitas (prefijo EV-). El piso se guarda como columna,
          no en el nombre.
        </template>
        <template v-else>
          Define las {{ etiquetas.plural }} del condominio. El prefijo del
          nombre es editable y el piso se guarda como columna, no en el nombre.
        </template>
      </p>

      <Skeleton v-if="u.cargando" width="100%" height="200px" class="mt-3" />
      <Message v-else-if="u.error" severity="error" class="mt-3">{{ u.error }}</Message>

      <template v-else>
        <!-- Stepper de fases -->
        <div class="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            v-for="p in PASOS_ENTIDADES"
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

        <!-- Fase 1: Cantidad y prefijo -->
        <div v-if="u.estado.paso === 1" class="mt-4 flex flex-col gap-3">
          <!-- Multi-grupo (estacionamientos: propietarios + visitas) -->
          <template v-if="u.multigrupo">
            <div
              v-for="(g, i) in u.estado.grupos"
              :key="g.uid"
              class="bg-surface border border-border p-3 border-round flex flex-col gap-3"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-medium">Grupo {{ i + 1 }}</span>
                <Button
                  v-if="u.estado.grupos.length > 1"
                  icon="pi pi-times"
                  severity="danger"
                  variant="text"
                  size="small"
                  @click="u.eliminarGrupo(g.uid)"
                />
              </div>
              <div class="flex flex-col sm:flex-row gap-3">
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-sm">Nombre del grupo</label>
                  <InputText v-model="g.nombre" placeholder="Propietarios" />
                </div>
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-sm">Prefijo</label>
                  <InputText v-model="g.prefijo" placeholder="E-" />
                </div>
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-sm">Cantidad</label>
                  <InputNumber v-model="g.cantidad" :min="1" :max="1000" class="w-full" />
                </div>
              </div>
            </div>
            <div>
              <Button
                label="Agregar grupo"
                icon="pi pi-plus"
                size="small"
                variant="text"
                @click="u.agregarGrupo"
              />
            </div>
          </template>

          <!-- Un solo bloque (bodegas) -->
          <template v-else>
            <div class="flex flex-col gap-1">
              <label class="text-sm">Prefijo del nombre</label>
              <InputText v-model="u.estado.grupos[0].prefijo" placeholder="B-" />
              <small class="text-xs text-surface-400">
                Ej: "B-" genera B-1, B-2, ...
              </small>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm">Cantidad</label>
              <InputNumber
                v-model="u.estado.grupos[0].cantidad"
                :min="1"
                :max="1000"
                class="w-full"
              />
            </div>
          </template>

          <small class="text-xs text-surface-400">
            La cantidad define el total para numeración correlativa. En "Por
            piso" el total se calcula de pisos × unidades por piso.
          </small>
        </div>

        <!-- Fase 2: Numeración -->
        <div v-else-if="u.estado.paso === 2" class="mt-4 flex flex-col gap-3">
          <!-- Multi-grupo: numeración por grupo -->
          <template v-if="u.multigrupo">
            <div
              v-for="g in u.estado.grupos"
              :key="g.uid"
              class="bg-surface border border-border p-3 border-round flex flex-col gap-3"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-medium">{{ u.grupoLabel(g.uid) }}</span>
                <Tag
                  :value="`${u.nombresDe(g).length} generados`"
                  :severity="u.nombresDe(g).length ? 'info' : 'secondary'"
                  size="small"
                />
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="m in MODOS_NUMERACION"
                  :key="m.value"
                  type="button"
                  class="flex-1 min-w-[140px] flex flex-col gap-1 p-3 border-round text-left transition-colors"
                  :class="
                    g.modo === m.value
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border hover:bg-emphasis'
                  "
                  @click="g.modo = m.value"
                >
                  <span class="text-sm font-medium">{{ m.label }}</span>
                  <span class="text-xs opacity-80">{{ m.descripcion }}</span>
                </button>
              </div>

              <div v-if="g.modo === 'correlativo'" class="flex flex-col sm:flex-row gap-3">
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-sm">Desde</label>
                  <InputText v-model="g.desde" placeholder="1" />
                </div>
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-sm">Cantidad</label>
                  <InputNumber v-model="g.cantidad" :min="1" :max="1000" class="w-full" />
                </div>
              </div>

              <div v-else-if="g.modo === 'por-piso'" class="flex flex-col sm:flex-row gap-3">
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-sm">Pisos (separados por coma)</label>
                  <InputText v-model="g.pisos" placeholder="1,2,-1" />
                  <small class="text-xs text-surface-400">
                    Usa negativos para subterráneos. El piso se guarda como
                    columna, no en el nombre.
                  </small>
                </div>
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-sm">Unidades por piso</label>
                  <InputNumber v-model="g.porPiso" :min="1" :max="99" class="w-full" />
                </div>
              </div>

              <div v-else class="flex flex-col gap-1">
                <label class="text-sm">Lista de nombres (uno por línea o separados por coma)</label>
                <Textarea v-model="g.personalizado" rows="4" />
              </div>
            </div>

            <Message v-if="u.nombresDuplicados.length" severity="warn" :closable="false">
              Nombres repetidos entre grupos: {{ u.nombresDuplicados.join(", ") }}.
              Usa prefijos distintos para cada grupo.
            </Message>
          </template>

          <!-- Un solo bloque (bodegas) -->
          <template v-else>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="m in MODOS_NUMERACION"
                :key="m.value"
                type="button"
                class="flex-1 min-w-[140px] flex flex-col gap-1 p-3 border-round text-left transition-colors"
                :class="
                  u.estado.grupos[0].modo === m.value
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border hover:bg-emphasis'
                "
                @click="u.estado.grupos[0].modo = m.value"
              >
                <span class="text-sm font-medium">{{ m.label }}</span>
                <span class="text-xs opacity-80">{{ m.descripcion }}</span>
              </button>
            </div>

            <div
              v-if="u.estado.grupos[0].modo === 'correlativo'"
              class="flex flex-col sm:flex-row gap-3"
            >
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-sm">Desde</label>
                <InputText v-model="u.estado.grupos[0].desde" placeholder="1" />
              </div>
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-sm">Cantidad</label>
                <InputNumber
                  v-model="u.estado.grupos[0].cantidad"
                  :min="1"
                  :max="1000"
                  class="w-full"
                />
              </div>
            </div>

            <div
              v-else-if="u.estado.grupos[0].modo === 'por-piso'"
              class="flex flex-col sm:flex-row gap-3"
            >
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-sm">Pisos (separados por coma)</label>
                <InputText v-model="u.estado.grupos[0].pisos" placeholder="1,2,-1" />
                <small class="text-xs text-surface-400">
                  Usa negativos para subterráneos. El piso se guarda como
                  columna, no en el nombre.
                </small>
              </div>
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-sm">Unidades por piso</label>
                <InputNumber
                  v-model="u.estado.grupos[0].porPiso"
                  :min="1"
                  :max="99"
                  class="w-full"
                />
              </div>
            </div>

            <div v-else class="flex flex-col gap-1">
              <label class="text-sm">Lista de nombres (uno por línea o separados por coma)</label>
              <Textarea v-model="u.estado.grupos[0].personalizado" rows="6" />
            </div>
          </template>

          <Tag
            :value="`${u.totalGeneradas} ${etiquetas.plural} generados`"
            :severity="u.totalGeneradas ? 'info' : 'secondary'"
            size="small"
          />
        </div>

        <!-- Fase 3: Sectores -->
        <div v-else-if="u.estado.paso === 3" class="mt-4 flex flex-col gap-3">
          <Message v-if="!u.sectoresHabilitados" severity="warn" :closable="false">
            Tu cargo no tiene permisos para agrupar por sectores. Los
            {{ etiquetas.plural }} se guardarán sin agrupar.
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
              Los {{ etiquetas.plural }} se crearán sin sector asignado.
            </div>

            <div v-else-if="u.estado.sectorOrigen === 'nuevo'" class="flex flex-col gap-3">
              <div
                v-for="(s, i) in u.estado.sectoresNuevos"
                :key="s.uid"
                class="flex flex-col sm:flex-row gap-2 items-end"
              >
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-sm">Nombre del sector {{ i + 1 }}</label>
                  <InputText v-model="s.nombre" placeholder="Ej: Estacionamiento Torre A" />
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
              Selecciona el sector de cada {{ etiquetas.singular }} en la
              siguiente fase (Asignación).
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
            Los {{ etiquetas.plural }} se guardarán sin sector.
          </small>

          <!-- Tabla desktop -->
          <div v-if="u.estado.items.length" class="planilla hidden md:block">
            <table>
              <thead>
                <tr>
                  <th v-if="u.multigrupo">Grupo</th>
                  <th>Nombre</th>
                  <th>Piso</th>
                  <th>Sector</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in u.estado.items" :key="item.id">
                  <td v-if="u.multigrupo">{{ u.grupoLabel(item.grupoUid) }}</td>
                  <td>{{ item.nombre }}</td>
                  <td>{{ item.piso ?? "—" }}</td>
                  <td>
                    <Select
                      v-if="u.sectoresOpciones.length"
                      v-model="item.sectorRef"
                      :options="opcionesSectorFila"
                      optionLabel="label"
                      optionValue="ref"
                      placeholder="Sin sector"
                      class="w-full"
                      @change="onSectorFilaChange(item)"
                    />
                    <span v-else>Sin sector</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Cards mobile -->
          <div v-if="u.estado.items.length" class="flex flex-col gap-2 md:hidden">
            <div
              v-for="item in u.estado.items"
              :key="item.id"
              class="bg-surface border border-border p-3 border-round"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <span class="font-medium">{{ item.nombre }}</span>
                  <span v-if="u.multigrupo" class="block text-xs text-surface-400">
                    {{ u.grupoLabel(item.grupoUid) }}
                  </span>
                </div>
                <Tag :value="`Piso ${item.piso ?? '—'}`" severity="secondary" size="small" />
              </div>
              <div class="mt-2 flex flex-col gap-1">
                <Select
                  v-if="u.sectoresOpciones.length"
                  v-model="item.sectorRef"
                  :options="opcionesSectorFila"
                  optionLabel="label"
                  optionValue="ref"
                  placeholder="Sin sector"
                  class="w-full"
                  @change="onSectorFilaChange(item)"
                />
                <span v-else class="text-sm text-surface-400">Sin sector</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Fase 5: Revisar y guardar -->
        <div v-else class="mt-4 flex flex-col gap-3">
          <div class="flex flex-wrap gap-2">
            <Tag :value="`${u.estado.items.length} ${etiquetas.plural}`" severity="info" size="small" />
            <Tag v-if="u.multigrupo" :value="`${u.estado.grupos.length} grupos`" severity="secondary" size="small" />
            <Tag v-else :value="`Prefijo: ${u.estado.grupos[0].prefijo || '—'}`" severity="secondary" size="small" />
          </div>

          <Message
            v-if="u.envelopeExcedido"
            severity="warn"
            :closable="false"
            >Atención: estos {{ etiquetas.plural }} podrían superar el límite del
            plan contratado ({{ u.capacidad.planUnidadLimit }} entidades en
            total). El backend validará el cupo al guardar.</Message
          >

          <div class="planilla hidden md:block">
            <table>
              <thead>
                <tr>
                  <th v-if="u.multigrupo">Grupo</th>
                  <th>Nombre</th>
                  <th>Piso</th>
                  <th>Sector</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in u.estado.items" :key="item.id">
                  <td v-if="u.multigrupo">{{ u.grupoLabel(item.grupoUid) }}</td>
                  <td>{{ item.nombre }}</td>
                  <td>{{ item.piso ?? "—" }}</td>
                  <td>{{ sectorLabel(item.sectorRef) }}</td>
                  <td>
                    <Tag
                      v-if="item.error"
                      :value="item.error"
                      severity="danger"
                      size="small"
                    />
                    <span v-else class="text-green-500 text-sm">Listo</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex flex-col gap-2 md:hidden">
            <div
              v-for="item in u.estado.items"
              :key="item.id"
              class="bg-surface border border-border p-3 border-round"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <span class="font-medium">{{ item.nombre }}</span>
                  <span v-if="u.multigrupo" class="block text-xs text-surface-400">
                    {{ u.grupoLabel(item.grupoUid) }}
                  </span>
                </div>
                <Tag :value="`Piso ${item.piso ?? '—'}`" severity="secondary" size="small" />
              </div>
              <div class="mt-1 flex items-center justify-between gap-2 text-sm">
                <span class="text-surface-400">{{ sectorLabel(item.sectorRef) }}</span>
                <Tag
                  v-if="item.error"
                  :value="item.error"
                  severity="danger"
                  size="small"
                />
              </div>
            </div>
          </div>

          <p v-if="u.resultado" class="text-sm text-green-500 mt-2 m-0">
            {{ u.resultado.creadas }} {{ etiquetas.plural }} creados. Paso completado.
          </p>
        </div>

        <!-- Navegación -->
        <div class="mt-4 flex justify-between items-center gap-2">
          <Button
            v-if="u.estado.paso > 1"
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
            :label="`Guardar ${etiquetas.plural}`"
            icon="pi pi-save"
            :loading="u.enviando"
            :disabled="!u.estado.items.length"
            @click="guardar"
          />
        </div>
      </template>
    </template>
  </Card>
</template>