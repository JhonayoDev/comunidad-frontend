<script setup>
import { ref, computed } from "vue";
import { TIPOS_UNIDAD, TIPOS_VINCULO, TIPOS_VEHICULO } from "@/data/planillaColumnas";

import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Checkbox from "primevue/checkbox";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";

// Recibe el objeto devuelto por usePlanillaDatos (estado + acciones).
const props = defineProps({
  planilla: { type: Object, required: true },
});

const emit = defineEmits(["guardar", "actualizado"]);

const filtroCasa = ref("");
const colapsadas = ref(new Set());

const p = computed(() => props.planilla);

const conBodegas = computed(() =>
  (p.value.capacidad?.data || p.value.capacidad || {}).capacidadBodegas > 0,
);

const capacidadConfig = [
  { tipo: "CASA", label: "Casas", suffix: "Casas" },
  { tipo: "DEPARTAMENTO", label: "Departamentos", suffix: "Departamentos" },
  { tipo: "ESTACIONAMIENTO", label: "Estacionamientos", suffix: "Estacionamientos" },
  { tipo: "BODEGA", label: "Bodegas", suffix: "Bodegas" },
  { tipo: "OTRO", label: "Otro", suffix: "Otro" },
];

const capacidadData = computed(() => p.value.capacidad?.data || p.value.capacidad || {});

const usoPorTipo = computed(() => {
  const map = {};
  (p.value.unidades || []).forEach((u) => {
    map[u.tipo] = (map[u.tipo] || 0) + 1;
  });
  return map;
});

function capacidadDe(tipo) {
  const cfg = capacidadConfig.find((c) => c.tipo === tipo);
  return capacidadData.value[`capacidad${cfg.suffix}`] ?? null;
}

function usoDe(tipo) {
  return usoPorTipo.value[tipo] || 0;
}

const capacidadVisible = computed(() =>
  capacidadConfig.filter((c) => capacidadDe(c.tipo) != null),
);

const grupos = computed(() => {
  const map = new Map();
  p.value.filas.forEach((f) => {
    const casa = (f.unidad || "").trim() || "(sin casa)";
    if (!map.has(casa)) map.set(casa, []);
    map.get(casa).push(f);
  });
  const orden = (f) => {
    const r = f.es_responsable === "SI" ? 0 : 1;
    const v = TIPOS_VINCULO.indexOf((f.tipo_vinculo || "").toUpperCase());
    return [r, v < 0 ? 99 : v, (f.nombre || "").toLowerCase()];
  };
  return [...map.entries()]
    .filter(([casa]) => !filtroCasa.value || casa.toLowerCase().includes(filtroCasa.value.toLowerCase()))
    .map(([casa, filas]) => ({
      casa,
      filas: [...filas].sort((a, b) => {
        const ra = orden(a);
        const rb = orden(b);
        return ra[0] - rb[0] || ra[1] - rb[1] || ra[2].localeCompare(rb[2]);
      }),
    }))
    .sort((a, b) => a.casa.localeCompare(b.casa, undefined, { numeric: true }));
});

const totalFilas = computed(() => p.value.filas.length);
const filasConDatos = computed(() =>
  p.value.filas.filter((f) => (f.nombre || "").trim() || (f.email || "").trim()).length,
);

function toggle(casa) {
  const set = new Set(colapsadas.value);
  if (set.has(casa)) set.delete(casa);
  else set.add(casa);
  colapsadas.value = set;
}

function expandirTodas() {
  colapsadas.value = new Set();
}

function contraerTodas() {
  colapsadas.value = new Set(grupos.value.map((g) => g.casa));
}

const tiposUnidadOpciones = TIPOS_UNIDAD.map((t) => ({ label: t, value: t }));
const tiposVinculoOpciones = TIPOS_VINCULO.map((t) => ({ label: t, value: t }));
const tiposVehiculoOpciones = TIPOS_VEHICULO.map((t) => ({ label: t, value: t }));

function erroresDe(f) {
  return p.value.filasConErrores?.find((x) => x.fila.id === f.id)?.errores || [];
}

function vehiculosDe(f) {
  return [1, 2, 3]
    .map((i) => ({
      n: i,
      patente: (f[`patente${i}`] || "").trim(),
      tipo: (f[`tipo_vehiculo${i}`] || "").trim(),
      marca: (f[`marca${i}`] || "").trim(),
      modelo: (f[`modelo${i}`] || "").trim(),
      color: (f[`color${i}`] || "").trim(),
      est: (f[`est${i}`] || "").trim(),
    }))
    .filter((v) => v.patente);
}

function bodegasDe(f) {
  return [1, 2, 3].map((i) => (f[`bodega${i}`] || "").trim()).filter(Boolean);
}

function guardar() {
  emit("guardar");
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Filtros y acciones -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
      <span class="p-input-icon-left w-full sm:w-64">
        <i class="pi pi-search"></i>
        <InputText
          v-model="filtroCasa"
          placeholder="Filtrar por casa…"
          class="w-full"
        />
      </span>
      <span class="text-sm text-surface-400">
        {{ grupos.length }} casa(s) · {{ totalFilas }} fila(s)
      </span>
      <div class="flex gap-1 sm:ml-auto">
        <Button label="Expandir" icon="pi pi-angle-down" variant="text" size="small" @click="expandirTodas" />
        <Button label="Contraer" icon="pi pi-angle-up" variant="text" size="small" @click="contraerTodas" />
        <Button label="Agregar" icon="pi pi-plus" size="small" @click="p.agregarFila()" />
      </div>
    </div>

    <Message v-if="p.borradorRestaurado" severity="warn" :closable="false" class="m-0">
      Se restauró un borrador de esta sesión con {{ totalFilas }} fila(s). Puedes
      continuar donde quedaste.
    </Message>

    <Skeleton v-if="p.cargando" width="100%" height="240px" />
    <Message v-else-if="p.error" severity="error" class="m-0">{{ p.error }}</Message>

    <template v-else>
      <div v-if="capacidadVisible.length" class="flex flex-wrap gap-2">
        <div
          v-for="c in capacidadVisible"
          :key="c.tipo"
          class="flex-1 min-w-32 px-3 py-2 flex items-center justify-between gap-2 border border-border rounded-lg"
          style="background-color: var(--color-surface)"
        >
          <span class="text-xs text-text-muted whitespace-nowrap">{{ c.label }}</span>
          <span
            class="text-sm font-semibold"
            :class="usoDe(c.tipo) >= capacidadDe(c.tipo) ? 'text-danger' : ''"
          >
            {{ usoDe(c.tipo) }} / {{ capacidadDe(c.tipo) }}
          </span>
        </div>
      </div>

      <div v-if="!grupos.length" class="text-center text-surface-400 py-10">
        <i class="pi pi-inbox text-3xl block mb-2"></i>
        Aún no hay filas. Usa <strong>Agregar</strong> para registrar al primer
        integrante de una casa.
      </div>

      <!-- Grupos por casa -->
      <div v-for="g in grupos" :key="g.casa" class="flex flex-col gap-1">
        <!-- Header del grupo -->
        <button
          type="button"
          class="flex items-center gap-2 p-2 border-round surface-ground hover:bg-emphasis transition-colors text-left w-full"
          @click="toggle(g.casa)"
        >
          <i class="pi text-xs" :class="colapsadas.has(g.casa) ? 'pi-angle-right' : 'pi-angle-down'"></i>
          <span class="font-semibold whitespace-nowrap">Casa {{ g.casa }}</span>
          <Tag
            :value="`${g.filas.length} ${g.filas.length === 1 ? 'integrante' : 'integrantes'}`"
            severity="secondary"
            size="small"
          />
          <span v-if="g.filas.some((f) => f.es_responsable === 'SI')" class="text-xs text-surface-400">
            Responsable: {{ g.filas.find((f) => f.es_responsable === 'SI')?.nombre }}
          </span>
        </button>

        <!-- Filas del grupo -->
        <template v-if="!colapsadas.has(g.casa)">
          <div
            v-for="f in g.filas"
            :key="f.id"
            class="p-2 border-round flex flex-col gap-2"
            :class="erroresDe(f).length ? 'bg-danger/5' : ''"
          >
            <!-- Mobile: cards -->
            <div class="md:hidden flex flex-col gap-2">
              <div class="grid grid-cols-2 gap-2">
                <div class="flex flex-col gap-1">
                  <label class="text-xs text-surface-400">Casa *</label>
                  <InputText v-model="f.unidad" placeholder="N° casa" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs text-surface-400">Tipo</label>
                  <Select v-model="f.tipo_unidad" :options="tiposUnidadOpciones" optionLabel="label" optionValue="value" />
                </div>
                <div class="flex flex-col gap-1 col-span-2">
                  <label class="text-xs text-surface-400">Nombre *</label>
                  <InputText v-model="f.nombre" placeholder="Nombre completo" />
                </div>
                <div class="flex flex-col gap-1 col-span-2">
                  <label class="text-xs text-surface-400">Email *</label>
                  <InputText v-model="f.email" placeholder="email@ejemplo.cl" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs text-surface-400">RUT</label>
                  <InputText v-model="f.rut" placeholder="12.345.678-9" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs text-surface-400">Teléfono</label>
                  <InputText v-model="f.telefono" placeholder="+569…" />
                </div>
                <div class="flex flex-col gap-1 col-span-2">
                  <label class="text-xs text-surface-400">Sector</label>
                  <InputText v-model="f.sector" placeholder="Sector A" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs text-surface-400">Vínculo</label>
                  <Select v-model="f.tipo_vinculo" :options="tiposVinculoOpciones" optionLabel="label" optionValue="value" />
                </div>
                <div class="flex items-end gap-2 col-span-2">
                  <div class="flex items-center gap-2">
                    <Checkbox
                      inputId="ocup"
                      :binary="true"
                      :modelValue="f.es_ocupante === 'SI'"
                      @update:modelValue="(v) => p.actualizarFila(f.id, 'es_ocupante', v ? 'SI' : 'NO')"
                    />
                    <label for="ocup" class="text-sm">Ocupante</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <Checkbox
                      inputId="notif"
                      :binary="true"
                      :modelValue="f.recibe_notificaciones === 'SI'"
                      @update:modelValue="(v) => p.actualizarFila(f.id, 'recibe_notificaciones', v ? 'SI' : 'NO')"
                    />
                    <label for="notif" class="text-sm">Notif.</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <Checkbox
                      inputId="resp"
                      :binary="true"
                      :modelValue="f.es_responsable === 'SI'"
                      @update:modelValue="(v) => { if (v) p.marcarResponsable(f.id) }"
                    />
                    <label for="resp" class="text-sm">Responsable</label>
                  </div>
                </div>
              </div>

              <div v-for="v in [1, 2, 3]" :key="v" class="flex flex-col gap-1">
                <label class="text-xs text-surface-400">Vehículo {{ v }} (patente → est.)</label>
                <div class="grid grid-cols-[1fr_auto_1fr] gap-2">
                  <InputText
                    :modelValue="f[`patente${v}`]"
                    placeholder="Patente"
                    @update:modelValue="p.actualizarFila(f.id, `patente${v}`, $event)"
                  />
                  <InputText
                    :modelValue="f[`est${v}`]"
                    placeholder="Est."
                    class="w-20"
                    @update:modelValue="p.actualizarFila(f.id, `est${v}`, $event)"
                  />
                  <Select
                    :modelValue="f[`tipo_vehiculo${v}`]"
                    :options="tiposVehiculoOpciones"
                    optionLabel="label"
                    optionValue="value"
                    class="w-28"
                    @update:modelValue="p.actualizarFila(f.id, `tipo_vehiculo${v}`, $event)"
                  />
                </div>
              </div>

              <div v-if="p.capacidad?.capacidadBodegas > 0" class="flex flex-col gap-1">
                <label class="text-xs text-surface-400">Bodegas</label>
                <div class="flex gap-2">
                  <InputText
                    v-for="b in 3"
                    :key="b"
                    :modelValue="f[`bodega${b}`]"
                    :placeholder="`Bodega ${b}`"
                    class="w-28"
                    @update:modelValue="p.actualizarFila(f.id, `bodega${b}`, $event)"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between">
                <Button
                  label="Quitar"
                  icon="pi pi-trash"
                  variant="text"
                  severity="danger"
                  size="small"
                  @click="p.eliminarFila(f.id)"
                />
                <Tag
                  v-if="f.tipo_vinculo"
                  :value="f.tipo_vinculo"
                  :severity="f.tipo_vinculo === 'PROPIETARIO' ? 'info' : 'secondary'"
                  size="small"
                />
              </div>
            </div>

            <!-- Desktop: tabla tipo Excel (.planilla) -->
            <div class="planilla hidden md:block">
              <table>
                <thead>
                  <tr>
                    <th>Casa</th>
                    <th>Tipo</th>
                    <th>Sector</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>RUT</th>
                    <th>Teléfono</th>
                    <th>Vínculo</th>
                    <th class="text-center">Ocup.</th>
                    <th class="text-center">Notif.</th>
                    <th class="text-center">Resp.</th>
                    <th>Vehículo 1</th>
                    <th>Vehículo 2</th>
                    <th>Vehículo 3</th>
                    <th v-if="conBodegas">Bodegas</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="f in g.filas" :key="f.id">
                    <td class="whitespace-nowrap align-middle">
                      <InputText
                        :modelValue="f.unidad"
                        placeholder="N°"
                        class="w-16"
                        @update:modelValue="p.actualizarFila(f.id, 'unidad', $event)"
                      />
                    </td>
                    <td class="whitespace-nowrap align-middle">
                      <Select
                        :modelValue="f.tipo_unidad"
                        :options="tiposUnidadOpciones"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Tipo"
                        class="w-32"
                        @update:modelValue="p.actualizarFila(f.id, 'tipo_unidad', $event)"
                      />
                    </td>
                    <td class="align-middle">
                      <InputText
                        :modelValue="f.sector"
                        placeholder="Sector"
                        class="w-full min-w-24"
                        @update:modelValue="p.actualizarFila(f.id, 'sector', $event)"
                      />
                    </td>
                    <td class="align-middle">
                      <InputText
                        :modelValue="f.nombre"
                        placeholder="Nombre"
                        class="w-full min-w-36"
                        @update:modelValue="p.actualizarFila(f.id, 'nombre', $event)"
                      />
                    </td>
                    <td class="align-middle">
                      <InputText
                        :modelValue="f.email"
                        placeholder="Email"
                        class="w-full min-w-40"
                        @update:modelValue="p.actualizarFila(f.id, 'email', $event)"
                      />
                    </td>
                    <td class="align-middle">
                      <InputText
                        :modelValue="f.rut"
                        placeholder="RUT"
                        class="w-full min-w-24"
                        @update:modelValue="p.actualizarFila(f.id, 'rut', $event)"
                      />
                    </td>
                    <td class="align-middle">
                      <InputText
                        :modelValue="f.telefono"
                        placeholder="Tel."
                        class="w-full min-w-28"
                        @update:modelValue="p.actualizarFila(f.id, 'telefono', $event)"
                      />
                    </td>
                    <td class="whitespace-nowrap align-middle">
                      <Select
                        :modelValue="f.tipo_vinculo"
                        :options="tiposVinculoOpciones"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Vínculo"
                        class="w-32"
                        @update:modelValue="p.actualizarFila(f.id, 'tipo_vinculo', $event)"
                      />
                    </td>
                    <td class="align-middle text-center">
                      <div class="flex items-center justify-center gap-1" title="Es ocupante">
                        <Checkbox
                          :binary="true"
                          :modelValue="f.es_ocupante === 'SI'"
                          @update:modelValue="(v) => p.actualizarFila(f.id, 'es_ocupante', v ? 'SI' : 'NO')"
                        />
                      </div>
                    </td>
                    <td class="align-middle text-center">
                      <div class="flex items-center justify-center gap-1" title="Recibe notificaciones">
                        <Checkbox
                          :binary="true"
                          :modelValue="f.recibe_notificaciones === 'SI'"
                          @update:modelValue="(v) => p.actualizarFila(f.id, 'recibe_notificaciones', v ? 'SI' : 'NO')"
                        />
                      </div>
                    </td>
                    <td class="align-middle text-center">
                      <div class="flex items-center justify-center gap-1" title="Responsable de la casa">
                        <Checkbox
                          :binary="true"
                          :modelValue="f.es_responsable === 'SI'"
                          @update:modelValue="(v) => { if (v) p.marcarResponsable(f.id) }"
                        />
                      </div>
                    </td>
                    <td class="whitespace-nowrap align-middle">
                      <div class="flex items-center gap-1">
                        <InputText
                          :modelValue="f[`patente1`]"
                          placeholder="Patente"
                          class="w-24"
                          @update:modelValue="p.actualizarFila(f.id, 'patente1', $event)"
                        />
                        <InputText
                          :modelValue="f[`est1`]"
                          placeholder="Est"
                          class="w-16"
                          @update:modelValue="p.actualizarFila(f.id, 'est1', $event)"
                        />
                      </div>
                    </td>
                    <td class="whitespace-nowrap align-middle">
                      <div class="flex items-center gap-1">
                        <InputText
                          :modelValue="f[`patente2`]"
                          placeholder="Patente"
                          class="w-24"
                          @update:modelValue="p.actualizarFila(f.id, 'patente2', $event)"
                        />
                        <InputText
                          :modelValue="f[`est2`]"
                          placeholder="Est"
                          class="w-16"
                          @update:modelValue="p.actualizarFila(f.id, 'est2', $event)"
                        />
                      </div>
                    </td>
                    <td class="whitespace-nowrap align-middle">
                      <div class="flex items-center gap-1">
                        <InputText
                          :modelValue="f[`patente3`]"
                          placeholder="Patente"
                          class="w-24"
                          @update:modelValue="p.actualizarFila(f.id, 'patente3', $event)"
                        />
                        <InputText
                          :modelValue="f[`est3`]"
                          placeholder="Est"
                          class="w-16"
                          @update:modelValue="p.actualizarFila(f.id, 'est3', $event)"
                        />
                      </div>
                    </td>
                    <td v-if="conBodegas" class="whitespace-nowrap align-middle">
                      <div class="flex items-center gap-1">
                        <InputText
                          v-for="b in 3"
                          :key="b"
                          :modelValue="f[`bodega${b}`]"
                          placeholder="B"
                          class="w-14"
                          @update:modelValue="p.actualizarFila(f.id, `bodega${b}`, $event)"
                        />
                      </div>
                    </td>
                    <td class="align-middle text-center">
                      <Button
                        icon="pi pi-trash"
                        variant="text"
                        severity="danger"
                        size="small"
                        title="Quitar fila"
                        @click="p.eliminarFila(f.id)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ul v-if="erroresDe(f).length" class="m-0 pl-4 text-sm text-danger">
              <li v-for="(e, i) in erroresDe(f)" :key="i">{{ e }}</li>
            </ul>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>