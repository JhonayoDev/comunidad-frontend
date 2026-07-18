<script setup>
import { ref, computed } from "vue";
import {
  PERMISOS, CARGOS, MODULOS,
} from "@/data/permisosMock";

import Card from "primevue/card";
import Button from "primevue/button";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Divider from "primevue/divider";

const cargoSeleccionado = ref(CARGOS[0].codigo);
const editando = ref(false);
const guardando = ref(false);
const mensaje = ref("");

const cargoActual = computed(() => CARGOS.find((c) => c.codigo === cargoSeleccionado.value));

const permisosAgrupados = computed(() => {
  const grupos = {};
  for (const p of PERMISOS) {
    if (!grupos[p.modulo]) grupos[p.modulo] = [];
    grupos[p.modulo].push(p);
  }
  return grupos;
});

function tienePermiso(codigo) {
  if (!cargoActual.value) return false;
  return cargoActual.value.permisos.includes(codigo);
}

function togglePermiso(codigo) {
  if (!editando.value || !cargoActual.value) return;
  const idx = cargoActual.value.permisos.indexOf(codigo);
  if (idx >= 0) {
    cargoActual.value.permisos.splice(idx, 1);
  } else {
    cargoActual.value.permisos.push(codigo);
  }
}

function toggleModulo(modulo) {
  if (!editando.value || !cargoActual.value) return;
  const modPermisos = PERMISOS.filter((p) => p.modulo === modulo).map((p) => p.codigo);
  const todosAsignados = modPermisos.every((cod) => cargoActual.value.permisos.includes(cod));
  if (todosAsignados) {
    cargoActual.value.permisos = cargoActual.value.permisos.filter((cod) => !modPermisos.includes(cod));
  } else {
    for (const cod of modPermisos) {
      if (!cargoActual.value.permisos.includes(cod)) cargoActual.value.permisos.push(cod);
    }
  }
}

function moduloCompleto(modulo) {
  if (!cargoActual.value) return false;
  const modPermisos = PERMISOS.filter((p) => p.modulo === modulo).map((p) => p.codigo);
  return modPermisos.length > 0 && modPermisos.every((cod) => cargoActual.value.permisos.includes(cod));
}

async function guardar() {
  guardando.value = true;
  mensaje.value = "";
  try {
    // TODO: Reemplazar con llamada real:
    // await api.put(`/admin/cargos/${cargoActual.value.codigo}/permisos`, { codigosPermiso: cargoActual.value.permisos });
    await new Promise((r) => setTimeout(r, 300));
    mensaje.value = "Permisos de cargo actualizados (mock)";
    editando.value = false;
  } catch (e) {
    mensaje.value = "Error al guardar permisos";
    console.error("Error guardando permisos de cargo", e);
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Permisos por Cargo</h1>
      <div class="flex gap-2">
        <Button
          :label="editando ? 'Guardar' : 'Editar'"
          :icon="editando ? 'pi pi-check' : 'pi pi-pencil'"
          :loading="guardando"
          size="small"
          :severity="editando ? 'primary' : 'secondary'"
          @click="editando ? guardar() : editando = true"
        />
        <Button v-if="editando" label="Cancelar" severity="secondary" variant="text" size="small" @click="editando = false" />
      </div>
    </div>

    <Card>
      <template #content>
        <div class="flex gap-2 flex-wrap">
          <Button
            v-for="c in CARGOS"
            :key="c.codigo"
            :label="c.nombre"
            :severity="cargoSeleccionado === c.codigo ? 'primary' : 'secondary'"
            variant="outlined"
            size="small"
            @click="cargoSeleccionado = c.codigo; editando = false; mensaje = ''"
          />
        </div>
      </template>
    </Card>

    <Message v-if="mensaje" severity="info" :closable="false">{{ mensaje }}</Message>

    <template v-if="cargoActual">
      <div class="text-sm text-surface-500 mb-2">
        <strong>{{ cargoActual.nombre }}</strong> — {{ cargoActual.descripcion }}
        <Tag :value="cargoActual.permisos.length + ' permisos'" severity="info" size="small" class="ml-2" />
      </div>

      <div v-for="(permisos, modulo) in permisosAgrupados" :key="modulo" class="surface-card p-3 border-round shadow-1">
        <div class="flex items-center gap-2 mb-2">
          <span class="font-bold text-surface-600">{{ MODULOS.find((m) => m.codigo === modulo)?.nombre || modulo }}</span>
          <Button
            v-if="editando"
            :icon="moduloCompleto(modulo) ? 'pi pi-check-square' : 'pi pi-stop'"
            size="small"
            variant="text"
            severity="secondary"
            @click="toggleModulo(modulo)"
            v-tooltip.top="'Toggle todo'"
          />
        </div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="p in permisos"
            :key="p.codigo"
            class="flex items-center gap-1 px-2 py-1 border-round cursor-pointer"
            :class="tienePermiso(p.codigo) ? 'bg-primary-50 text-primary-700 border-1 border-primary-200' : 'bg-surface-50 text-surface-400 border-1 border-surface-200'"
            :style="{ cursor: editando ? 'pointer' : 'default' }"
            @click="togglePermiso(p.codigo)"
          >
            <i :class="tienePermiso(p.codigo) ? 'pi pi-check-circle text-primary' : 'pi pi-circle text-surface-300'" class="text-xs" />
            <span class="text-xs">{{ p.nombre }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
