<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { PERMISOS, MODULOS } from "@/data/permisosCatalogo";

import Card from "primevue/card";
import Tag from "primevue/tag";

const auth = useAuthStore();

const permisosEfectivos = computed(() => auth.permisos || []);

const permisosDetalle = computed(() => {
  return permisosEfectivos.value
    .map((cod) => PERMISOS.find((p) => p.codigo === cod))
    .filter(Boolean);
});

const sinCatalogo = computed(() => {
  return permisosEfectivos.value.filter((cod) => !PERMISOS.some((p) => p.codigo === cod));
});

const agrupados = computed(() => {
  const grupos = {};
  for (const p of permisosDetalle.value) {
    if (!grupos[p.modulo]) grupos[p.modulo] = [];
    grupos[p.modulo].push(p);
  }
  return grupos;
});

const totalPermisos = computed(() => PERMISOS.length);
const totalPropios = computed(() => permisosEfectivos.value.length);
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <h1 class="text-xl font-bold m-0">Mis Permisos</h1>

    <Card>
      <template #content>
        <div class="flex flex-wrap gap-3 items-center">
          <div>
            <span class="text-sm text-surface-500">Rol:</span>
            <Tag :value="auth.condominioActualRol || auth.user?.roles?.[0] || '—'" severity="info" class="ml-1" />
          </div>
          <div v-if="auth.condominioActualCargo">
            <span class="text-sm text-surface-500">Cargo:</span>
            <Tag :value="auth.condominioActualCargo" severity="warn" class="ml-1" />
          </div>
          <div class="text-sm text-surface-400 ml-auto">
            {{ totalPropios }} de {{ totalPermisos }} permisos
          </div>
        </div>
      </template>
    </Card>

    <div v-for="(permisos, modulo) in agrupados" :key="modulo" class="bg-surface border border-border p-3 border-round">
      <div class="flex items-center gap-2 mb-2">
        <span class="font-bold text-text">{{ MODULOS.find((m) => m.codigo === modulo)?.nombre || modulo }}</span>
        <Tag :value="permisos.length" severity="info" size="small" />
      </div>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="p in permisos"
          :key="p.codigo"
          class="flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 border-1 border-primary-200 border-round text-xs"
          :title="p.descripcion"
        >
          <i class="pi pi-check-circle text-primary text-xs" />
          <span>{{ p.nombre }}</span>
        </div>
      </div>
    </div>

    <div v-if="sinCatalogo.length" class="bg-surface border border-border p-3 border-round">
      <div class="flex items-center gap-2 mb-2">
        <span class="font-bold text-text">Permisos sin catalogar</span>
        <Tag :value="sinCatalogo.length" severity="warn" size="small" />
      </div>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="cod in sinCatalogo"
          :key="cod"
          class="flex items-center gap-1 px-2 py-1 bg-background border border-border border-round text-xs"
          :title="'Permiso real del backend no documentado en el catálogo frontend'"
        >
          <i class="pi pi-exclamation-triangle text-warning text-xs" />
          <span class="font-mono">{{ cod }}</span>
        </div>
      </div>
    </div>

    <div v-if="!permisosDetalle.length" class="text-center text-surface-400 py-8">
      No hay permisos asignados
    </div>
  </div>
</template>
