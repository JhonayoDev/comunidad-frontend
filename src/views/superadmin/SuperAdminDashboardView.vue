<template>
  <div class="p-4 flex flex-column gap-4">
    <div class="flex align-items-center justify-content-between">
      <h2 class="text-xl font-bold m-0">Panel de administración</h2>
      <Tag :value="`${totalCondominios} condominios`" severity="info" />
    </div>

    <Message v-if="error" severity="warn">{{ error }}</Message>

    <IconField>
      <InputIcon class="pi pi-search" />
      <InputText
        v-model="busqueda"
        placeholder="Buscar condominio..."
        class="w-full"
      />
    </IconField>

    <DataTable
      :value="condominiosFiltrados"
      :loading="loading"
      paginator
      :rows="10"
      dataKey="id"
      class="w-full"
    >
      <template #empty> No hay condominios registrados. </template>

      <Column field="nombre" header="Condominio" sortable />
      <Column field="direccion" header="Dirección" />
      <Column field="rolAcceso" header="Rol" sortable>
        <template #body="{ data }">
          <Tag :value="data.rolAcceso" severity="secondary" />
        </template>
      </Column>
      <Column field="cargo" header="Cargo">
        <template #body="{ data }">
          {{ data.cargo || "—" }}
        </template>
      </Column>
      <Column header="Acciones" style="width: 8rem">
        <template #body="{ data }">
          <Button
            label="Entrar"
            icon="pi pi-arrow-right"
            size="small"
            text
            @click="entrarACondominio(data.id)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useSuperAdminDashboard } from "@/composables/useSuperAdminDashboard";

import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import Tag from "primevue/tag";
import Button from "primevue/button";
import Message from "primevue/message";

const router = useRouter();
const auth = useAuthStore();

const { condominiosFiltrados, totalCondominios, busqueda, loading, error } =
  useSuperAdminDashboard();

function entrarACondominio(condominioId) {
  auth.seleccionarCondominio(condominioId);
  router.push({ name: "Dashboard" });
}
</script>
