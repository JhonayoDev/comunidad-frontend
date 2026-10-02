<script setup>
import { ref } from "vue";
import Card from "primevue/card";
import Panel from "primevue/panel";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Menu from "primevue/menu";
import Dialog from "primevue/dialog";
import Drawer from "primevue/drawer";
import Select from "primevue/select";
import DatePicker from "primevue/datepicker";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Tabs from "primevue/tabs";
import TabList from "primevue/tablist";
import Tab from "primevue/tab";
import TabPanels from "primevue/tabpanels";
import TabPanel from "primevue/tabpanel";
// NOTA: Toast no se incluye porque la app no lo usa y requeriría
// registrar ToastService en main.js (cambio global fuera del alcance
// del UI Lab). Ver informe de ETAPA 1.

const dialogoVisible = ref(false);
const drawerVisible = ref(false);
const tabActiva = ref("0");

const proveedor = ref("CLOUDFLARE_R2");
const proveedores = [
  { label: "Cloudflare R2", value: "CLOUDFLARE_R2" },
  { label: "Google Drive", value: "GOOGLE_DRIVE" },
];

const fecha = ref(null);
const texto = ref("");

const filas = ref([
  { numero: "101", tipo: "Casa", estado: "VENCIDO", monto: 124500 },
  { numero: "102", tipo: "Casa", estado: "PAGADO", monto: 118000 },
  { numero: "201", tipo: "Departamento", estado: "PENDIENTE", monto: 96500 },
  { numero: "E-1", tipo: "Estacionamiento", estado: "PAGADO", monto: 15000 },
  { numero: "B-3", tipo: "Bodega", estado: "VENCIDO", monto: 12000 },
]);

const menuItems = ref([
  { label: "Mi unidad", icon: "pi pi-home" },
  { label: "Encomiendas", icon: "pi pi-box" },
  { label: "Notificaciones", icon: "pi pi-bell" },
  { separator: true },
  { label: "Cerrar sesión", icon: "pi pi-sign-out" },
]);

function formatoMonto(n) {
  return `$${Number(n).toLocaleString("es-CL")}`;
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Card -->
    <Card>
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-home text-primary" />
          <span>Card de ejemplo</span>
        </div>
      </template>
      <template #content>
        <p class="m-0 text-sm text-text-muted">
          Contenido de la tarjeta con texto principal y texto secundario para
          revisar contraste en claro y oscuro.
        </p>
        <div class="flex gap-2 mt-3 flex-wrap">
          <Button label="Primario" />
          <Button label="Secundario" severity="secondary" />
          <Button label="Peligro" severity="danger" />
        </div>
      </template>
    </Card>

    <!-- Panel -->
    <Panel header="Panel de ejemplo" toggleable>
      <p class="m-0 text-sm">
        Cuerpo del panel. Sirve para comparar su fondo y borde contra los de
        Card y Dialog en ambos modos.
      </p>
    </Panel>

    <!-- DataTable (5 filas) -->
    <Card>
      <template #title><span class="text-base font-bold">DataTable · 5 filas</span></template>
      <template #content>
        <DataTable :value="filas" size="small" stripedRows>
          <Column field="numero" header="Unidad" />
          <Column field="tipo" header="Tipo" />
          <Column field="estado" header="Estado" />
          <Column field="monto" header="Monto">
            <template #body="slotProps">
              {{ formatoMonto(slotProps.data.monto) }}
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Menu -->
    <Card>
      <template #title><span class="text-base font-bold">Menu</span></template>
      <template #content>
        <Menu :model="menuItems" class="w-full" />
      </template>
    </Card>

    <!-- Formulario: Select + DatePicker + InputText -->
    <Card>
      <template #title><span class="text-base font-bold">Formulario (Select · DatePicker · InputText)</span></template>
      <template #content>
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label class="font-medium text-sm">Proveedor</label>
            <Select
              v-model="proveedor"
              :options="proveedores"
              optionLabel="label"
              optionValue="value"
              placeholder="Elige un proveedor"
              fluid
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-medium text-sm">Fecha</label>
            <DatePicker v-model="fecha" placeholder="dd/mm/aaaa" fluid showIcon />
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-medium text-sm">Texto</label>
            <InputText v-model="texto" placeholder="Escribe algo…" fluid />
          </div>
        </div>
      </template>
    </Card>

    <!-- Tabs -->
    <Card>
      <template #title><span class="text-base font-bold">Tabs</span></template>
      <template #content>
        <Tabs v-model:value="tabActiva">
          <TabList>
            <Tab value="0">General</Tab>
            <Tab value="1">Deudas</Tab>
            <Tab value="2">Ajustes</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="0"><p class="m-0 text-sm">Contenido de la pestaña General.</p></TabPanel>
            <TabPanel value="1"><p class="m-0 text-sm">Contenido de la pestaña Deudas.</p></TabPanel>
            <TabPanel value="2"><p class="m-0 text-sm">Contenido de la pestaña Ajustes.</p></TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>

    <!-- Dialog + Drawer (disparadores) -->
    <Card>
      <template #title><span class="text-base font-bold">Dialog · Drawer</span></template>
      <template #content>
        <div class="flex gap-2 flex-wrap">
          <Button label="Abrir Dialog" icon="pi pi-external-link" @click="dialogoVisible = true" />
          <Button
            label="Abrir Drawer"
            icon="pi pi-bars"
            severity="secondary"
            @click="drawerVisible = true"
          />
        </div>
      </template>
    </Card>

    <Dialog v-model:visible="dialogoVisible" modal header="Dialog de ejemplo" class="w-[95%] max-w-lg">
      <p class="m-0 text-sm">
        Cuerpo del diálogo. Revisa fondo del overlay, color del texto y
        visibilidad del botón de cierre en claro y oscuro.
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" text @click="dialogoVisible = false" />
          <Button label="Guardar" @click="dialogoVisible = false" />
        </div>
      </template>
    </Dialog>

    <Drawer v-model:visible="drawerVisible" header="Drawer de ejemplo">
      <p class="m-0 text-sm">Contenido lateral, mismo patrón que el menú del header.</p>
    </Drawer>
  </div>
</template>
