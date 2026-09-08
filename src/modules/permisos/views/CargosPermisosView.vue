<script setup>
import { onMounted, watch } from "vue";
import { useCargoPermisos } from "@/modules/permisos/composables/useCargoPermisos";
import Card from "primevue/card";
import Button from "primevue/button";
import Select from "primevue/select";
import InputText from "primevue/inputtext";
import Checkbox from "primevue/checkbox";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const confirm = useConfirm();
const { cargo, codigos, loading, error, guardando, busqueda, porModulo, totalActivos, toggle, cargar, guardar, CARGOS } = useCargoPermisos();

const cargoOptions = CARGOS.map((c) => ({ label: c, value: c }));

onMounted(cargar);
watch(cargo, cargar);

function confirmarGuardar() {
  confirm.require({
    message: `¿Guardar ${totalActivos.value} permisos para el cargo ${cargo.value}? Reemplazo total (se audita cargoPermisoEditado).`,
    header: "Guardar permisos del cargo",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Guardar",
    rejectLabel: "Cancelar",
    accept: async () => {
      const ok = await guardar();
      if (ok) {
        // feedback vía Message ya en error (null = éxito silencioso)
      }
    },
  });
}
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
      <h1 class="text-xl font-bold m-0">Permisos por cargo — BFF</h1>
      <Tag :value="`${totalActivos} activos`" severity="info" />
    </div>

    <Card>
      <template #content>
        <div class="flex flex-col sm:flex-row gap-2">
          <Select v-model="cargo" :options="cargoOptions" optionLabel="label" optionValue="value" placeholder="Cargo" class="w-full sm:w-64" />
          <InputText v-model="busqueda" placeholder="Buscar código/nombre/descripción" class="w-full sm:flex-1" />
          <Button label="Guardar" icon="pi pi-save" :loading="guardando" @click="confirmarGuardar" />
        </div>
        <Message v-if="error" severity="error" :closable="false" class="mt-2">{{ error }}</Message>
        <Message severity="info" :closable="false" class="mt-2 text-xs">
          Módulo BFF en iteración — datos en <code>localStorage bff:cargo-permisos</code> (mock de `cargo_permisos` V12→V72). Al implementar el backend, el service cambia a <code>GET/PUT /admin/cargos/{cargo}/permisos</code> sin tocar esta vista.
        </Message>
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <template v-else>
      <div v-for="grupo in porModulo" :key="grupo.codigo" class="bg-surface border border-border p-3 border-round">
        <div class="flex items-center gap-2 mb-2">
          <span class="font-bold text-text">{{ grupo.nombre }}</span>
          <Tag :value="grupo.permisos.length" severity="secondary" size="small" />
          <Tag :value="grupo.permisos.filter((p) => p.activo).length + ' activos'" severity="info" size="small" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <label
            v-for="p in grupo.permisos"
            :key="p.codigo"
            class="flex items-start gap-2 p-2 border-round cursor-pointer hover:bg-emphasis"
            :title="p.descripcion"
          >
            <Checkbox :modelValue="p.activo" binary @update:modelValue="toggle(p.codigo)" />
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-medium leading-tight">{{ p.nombre }}</span>
              <span class="text-xs font-mono text-surface-400">{{ p.codigo }}</span>
              <span class="text-xs text-surface-500 line-clamp-2">{{ p.descripcion }}</span>
            </div>
          </label>
        </div>
      </div>
    </template>

    <ConfirmDialog />
  </div>
</template>
