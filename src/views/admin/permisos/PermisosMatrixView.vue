<script setup>
import { ref, computed } from "vue";
import {
  PERMISOS, ROLES, MODULOS,
} from "@/data/permisosMock";

import Card from "primevue/card";
import Button from "primevue/button";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Message from "primevue/message";

const moduloFiltro = ref(null);
const editando = ref(null);
const guardando = ref(false);
const mensaje = ref("");

const modulosOptions = [{ label: "Todos los módulos", value: null }, ...MODULOS.map((m) => ({ label: m.nombre, value: m.codigo }))];

const permisosVisibles = computed(() => {
  if (!moduloFiltro.value) return PERMISOS;
  return PERMISOS.filter((p) => p.modulo === moduloFiltro.value);
});

const permisosAgrupados = computed(() => {
  const grupos = {};
  for (const p of permisosVisibles.value) {
    if (!grupos[p.modulo]) grupos[p.modulo] = [];
    grupos[p.modulo].push(p);
  }
  return grupos;
});

function tienePermiso(rol, permisoCodigo) {
  return rol.permisos.includes(permisoCodigo);
}

function togglePermiso(rol, permisoCodigo) {
  if (editando.value !== rol.codigo) return;
  const idx = rol.permisos.indexOf(permisoCodigo);
  if (idx >= 0) {
    rol.permisos.splice(idx, 1);
  } else {
    rol.permisos.push(permisoCodigo);
  }
}

function toggleModulo(rol, modulo) {
  if (editando.value !== rol.codigo) return;
  const modPermisos = PERMISOS.filter((p) => p.modulo === modulo).map((p) => p.codigo);
  const todosAsignados = modPermisos.every((cod) => rol.permisos.includes(cod));
  if (todosAsignados) {
    rol.permisos = rol.permisos.filter((cod) => !modPermisos.includes(cod));
  } else {
    for (const cod of modPermisos) {
      if (!rol.permisos.includes(cod)) rol.permisos.push(cod);
    }
  }
}

function moduloCompleto(rol, modulo) {
  const modPermisos = PERMISOS.filter((p) => p.modulo === modulo).map((p) => p.codigo);
  return modPermisos.length > 0 && modPermisos.every((cod) => rol.permisos.includes(cod));
}

function empezarEditar(rol) {
  editando.value = rol.codigo;
  mensaje.value = "";
}

function cancelarEditar() {
  editando.value = null;
  mensaje.value = "";
}

async function guardar(rol) {
  guardando.value = true;
  mensaje.value = "";
  try {
    // TODO: Reemplazar con llamada real:
    // await api.put(`/admin/roles/${rol.codigo}/permisos`, { codigosPermiso: rol.permisos });
    await new Promise((r) => setTimeout(r, 300));
    mensaje.value = "Permisos actualizados (mock)";
    editando.value = null;
  } catch (e) {
    mensaje.value = "Error al guardar permisos";
    console.error("Error guardando permisos", e);
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold m-0">Matriz de Permisos</h1>
      <div class="w-48">
        <Select v-model="moduloFiltro" :options="modulosOptions" optionLabel="label" optionValue="value" placeholder="Filtrar módulo" class="w-full" size="small" />
      </div>
    </div>

    <Message v-if="mensaje" severity="info" :closable="false">{{ mensaje }}</Message>

    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-surface-200">
            <th class="text-left p-2 font-semibold min-w-48">Permiso</th>
            <th v-for="r in ROLES" :key="r.codigo" class="text-center p-2 font-semibold min-w-28">
              <div class="flex flex-col items-center gap-1">
                <span class="text-xs">{{ r.nombre }}</span>
                <Tag :value="r.codigo" severity="info" size="small" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(permisos, modulo) in permisosAgrupados" :key="modulo">
            <tr class="bg-surface-50 border-b border-surface-200">
              <td class="p-2 font-bold text-surface-600" colspan="100%">
                <div class="flex items-center gap-2">
                  <span>{{ MODULOS.find((m) => m.codigo === modulo)?.nombre || modulo }}</span>
                  <div class="flex gap-1" v-if="editando">
                    <Button
                      v-for="r in ROLES"
                      :key="r.codigo"
                      size="small"
                      :icon="moduloCompleto(r, modulo) ? 'pi pi-check-square' : 'pi pi-stop'"
                      variant="text"
                      severity="secondary"
                      @click="toggleModulo(r, modulo)"
                      v-tooltip.top="'Toggle todo el módulo'"
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr v-for="p in permisos" :key="p.codigo" class="border-b border-surface-100 hover:bg-surface-50">
              <td class="p-2">
                <span class="font-medium">{{ p.nombre }}</span>
                <span class="text-xs text-surface-400 ml-1">{{ p.codigo }}</span>
              </td>
              <td v-for="r in ROLES" :key="r.codigo" class="text-center p-2" @click="togglePermiso(r, p.codigo)">
                <i
                  :class="tienePermiso(r, p.codigo) ? 'pi pi-check text-green-600' : 'pi pi-times text-surface-200'"
                  :style="{ cursor: editando === r.codigo ? 'pointer' : 'default', opacity: editando === r.codigo ? 1 : 0.7 }"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div class="flex gap-2">
      <Button
        v-for="r in ROLES"
        :key="r.codigo"
        :label="editando === r.codigo ? 'Guardar ' + r.nombre : 'Editar ' + r.nombre"
        :loading="guardando"
        :severity="editando === r.codigo ? 'primary' : 'secondary'"
        size="small"
        @click="editando === r.codigo ? guardar(r) : empezarEditar(r)"
      />
      <Button v-if="editando" label="Cancelar" severity="secondary" variant="text" size="small" @click="cancelarEditar" />
    </div>
  </div>
</template>
