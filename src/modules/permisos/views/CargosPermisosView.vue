<script setup>
import { onMounted, watch, ref } from "vue";
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

// Secciones colapsables (mobile-first): todas expandidas por defecto, colapsables para navegar
const expandidos = ref(new Set());

onMounted(() => {
  cargar();
  // expandir todo al inicio
  expandidos.value = new Set(porModulo.value.map((g) => g.codigo));
});
watch(cargo, async () => {
  await cargar();
  expandidos.value = new Set(porModulo.value.map((g) => g.codigo));
});
watch(porModulo, (grupos, prev) => {
  // solo expandir grupos que aparecen por primera vez (ej. filtro de búsqueda),
  // sin re-expandir los que el usuario colapsó manualmente
  const prevCodigos = new Set((prev || []).map((g) => g.codigo));
  const next = new Set(expandidos.value);
  let cambio = false;
  grupos.forEach((g) => {
    if (!prevCodigos.has(g.codigo) && !next.has(g.codigo)) {
      next.add(g.codigo);
      cambio = true;
    }
  });
  if (cambio) expandidos.value = next;
});

function toggleGrupo(codigo) {
  const next = new Set(expandidos.value);
  if (next.has(codigo)) next.delete(codigo);
  else next.add(codigo);
  expandidos.value = next;
}

function irArriba() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  // también intenta scrollear el <main> del MainLayout en PWA standalone
  const main = document.querySelector("main");
  if (main) main.scrollTo({ top: 0, behavior: "smooth" });
}

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
        <Message v-if="cargo === 'ADMINISTRADOR'" severity="warn" :closable="false" class="mt-2 text-xs">
          <strong>ADMINISTRADOR</strong> como <em>cargo</em> (esta vista, <code>cargo_permisos</code>) aplica tanto al <strong>administrador externo</strong> (rol <code>ADMINISTRADOR</code> + cargo <code>ADMINISTRADOR</code>) como al <strong>propietario administrador</strong> (rol <code>RESIDENTE</code> + cargo <code>ADMINISTRADOR</code>). Sus permisos efectivos son <code>rol + cargo</code>; editar este cargo afecta a ambos. Los permisos del <em>rol</em> <code>ADMINISTRADOR</code> (<code>rol_permisos</code>) se gestionan aparte en “Matriz de Permisos”.
        </Message>
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <template v-else>
      <div v-for="grupo in porModulo" :key="grupo.codigo" class="bg-surface border border-border border-round overflow-hidden">
        <button
          class="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-emphasis transition-colors"
          @click="toggleGrupo(grupo.codigo)"
        >
          <div class="flex items-center gap-2">
            <i :class="expandidos.has(grupo.codigo) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs text-surface-400"></i>
            <span class="font-bold text-text">{{ grupo.nombre }}</span>
            <Tag :value="grupo.permisos.length" severity="secondary" size="small" />
            <Tag :value="grupo.permisos.filter((p) => p.activo).length + ' activos'" severity="info" size="small" />
          </div>
          <span class="text-xs text-surface-400 hidden sm:inline">{{ expandidos.has(grupo.codigo) ? 'Ocultar' : 'Mostrar' }}</span>
        </button>
        <div v-show="expandidos.has(grupo.codigo)" class="p-3 pt-0">
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
      </div>

      <!-- Botón ir arriba (desktop y mobile) -->
      <div class="flex justify-center pt-2">
        <Button label="Ir arriba" icon="pi pi-arrow-up" severity="secondary" variant="outlined" size="small" @click="irArriba" />
      </div>
    </template>

    <ConfirmDialog />
  </div>
</template>
