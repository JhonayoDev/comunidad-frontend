<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import {
  PERMISOS, ROLES, CARGOS, MODULOS, permisosEfectivos,
} from "@/data/permisosMock";

import Card from "primevue/card";
import Tag from "primevue/tag";
import Divider from "primevue/divider";
import Message from "primevue/message";

const auth = useAuthStore();
const rol = ref(auth.condominioActualRol || auth.user?.roles?.[0] || "RESIDENTE");
const cargo = ref(auth.condominioActualCargo || null);

const permisosEf = computed(() => permisosEfectivos(rol.value, cargo.value));

const permisosDetalle = computed(() => {
  return permisosEf.value.map((cod) => PERMISOS.find((p) => p.codigo === cod)).filter(Boolean);
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
const totalPropios = computed(() => permisosDetalle.value.length);

const rolInfo = computed(() => ROLES.find((r) => r.codigo === rol.value));
const cargoInfo = computed(() => CARGOS.find((c) => c.codigo === cargo.value));
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <h1 class="text-xl font-bold m-0">Mis Permisos</h1>

    <Card>
      <template #content>
        <div class="flex flex-wrap gap-3 items-center">
          <div>
            <span class="text-sm text-surface-500">Rol:</span>
            <Tag :value="rolInfo?.nombre || rol" severity="info" class="ml-1" />
          </div>
          <div v-if="cargoInfo">
            <span class="text-sm text-surface-500">Cargo:</span>
            <Tag :value="cargoInfo.nombre" severity="warn" class="ml-1" />
          </div>
          <div class="text-sm text-surface-400 ml-auto">
            {{ totalPropios }} de {{ totalPermisos }} permisos
          </div>
        </div>
      </template>
    </Card>

    <div v-for="(permisos, modulo) in agrupados" :key="modulo" class="surface-card p-3 border-round shadow-1">
      <div class="flex items-center gap-2 mb-2">
        <span class="font-bold text-surface-600">{{ MODULOS.find((m) => m.codigo === modulo)?.nombre || modulo }}</span>
        <Tag :value="permisos.length" severity="info" size="small" />
      </div>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="p in permisos"
          :key="p.codigo"
          class="flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 border-1 border-primary-200 border-round text-xs"
        >
          <i class="pi pi-check-circle text-primary text-xs" />
          <span>{{ p.nombre }}</span>
        </div>
      </div>
    </div>

    <div v-if="!permisosDetalle.length" class="text-center text-surface-400 py-8">
      No hay permisos asignados
    </div>
  </div>
</template>
