<script setup>
import { computed, onMounted, ref } from "vue";
import { useConfirm } from "primevue/useconfirm";
import { useSetupSectores } from "@/composables/useSetupSectores";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Skeleton from "primevue/skeleton";
import ConfirmDialog from "primevue/confirmdialog";

const emit = defineEmits(["actualizado"]);

const u = useSetupSectores();
const confirm = useConfirm();

const editando = ref(false);
const snapshotEdicion = ref(null);

function entrarEdicion() {
  // Los errores de un guardado anterior no deben persistir al reintentar.
  u.estado.items.forEach((x) => (x.error = null));
  snapshotEdicion.value = JSON.parse(JSON.stringify(u.estado.items));
  editando.value = true;
}

function cancelarEdicion() {
  if (snapshotEdicion.value) u.estado.items = snapshotEdicion.value;
  editando.value = false;
}

function salirEdicion() {
  editando.value = false;
  u.ordenarSectores();
}

function confirmarEliminar(item) {
  confirm.require({
    message: `¿Desactivar el sector "${item.nombre}"? No se podrá si tiene unidades, bodegas o estacionamientos activos asignados.`,
    header: "Desactivar sector",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Desactivar",
    rejectLabel: "Cancelar",
    accept: () => u.eliminarFila(item),
  });
}

const mensajeResultado = computed(() => {
  const r = u.resultado;
  if (!r) return "";
  const partes = [];
  if (r.creados) partes.push(`${r.creados} sectores creados`);
  if (r.actualizados) partes.push(`${r.actualizados} actualizados`);
  if (r.eliminados) partes.push(`${r.eliminados} eliminados`);
  return partes.length ? partes.join(", ") + "." : "Sin cambios.";
});

const erroresResumen = computed(() =>
  u.estado.items.filter((x) => x.error).map((x) => `${x.nombre}: ${x.error}`)
);

async function guardar() {
  const ok = await u.guardar();
  if (ok) {
    salirEdicion();
    emit("actualizado");
  }
}

onMounted(() => u.cargar());
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-sitemap"></i>
        <span>Sectores</span>
      </div>
    </template>
    <template #content>
      <Skeleton v-if="u.cargando" width="100%" height="120px" />
      <Message v-else-if="!u.sectoresHabilitados" severity="warn" :closable="false">
        Tu cargo no tiene permisos para gestionar sectores (SECTOR_*). Contacta
        al administrador del condominio.
      </Message>
      <Message v-else-if="u.error" severity="error">{{ u.error }}</Message>
      <template v-else>
        <div class="flex flex-wrap items-center gap-2">
          <Tag :value="`${u.estado.items.length} sectores`" severity="info" size="small" />
          <Button
            v-if="!editando"
            label="Editar"
            icon="pi pi-pencil"
            variant="text"
            size="small"
            @click="entrarEdicion"
          />
          <template v-else>
            <Button label="Listo" icon="pi pi-check" variant="text" size="small" @click="salirEdicion" />
            <Button label="Cancelar" variant="text" severity="secondary" size="small" @click="cancelarEdicion" />
            <Button label="Agregar fila" icon="pi pi-plus" variant="text" size="small" @click="u.agregarFila" />
          </template>
        </div>

        <Message
          v-if="erroresResumen.length"
          severity="error"
          :closable="false"
          class="mt-3"
        >
          <div class="flex flex-col gap-1">
            <span>No se pudieron guardar los siguientes sectores:</span>
            <span v-for="(e, i) in erroresResumen" :key="i" class="text-sm">{{ e }}</span>
          </div>
        </Message>

        <div class="planilla hidden md:block mt-3">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th v-if="editando"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in u.estado.items"
                :key="item.id"
                :class="item.marcadoEliminar ? 'opacity-50' : ''"
              >
                <td>
                  <template v-if="editando && !item.marcadoEliminar">
                    <InputText v-model="item.nombre" size="small" class="w-full" />
                  </template>
                  <template v-else>
                    <span :class="item.marcadoEliminar ? 'line-through' : ''">{{ item.nombre }}</span>
                    <Tag v-if="item.esNuevo" value="Nuevo" severity="success" size="small" class="ml-2" />
                  </template>
                </td>
                <td>
                  <template v-if="editando && !item.marcadoEliminar">
                    <InputText v-model="item.descripcion" size="small" class="w-full" />
                  </template>
                  <span v-else>{{ item.descripcion || "—" }}</span>
                </td>
                <td>
                  <Tag
                    v-if="item.error"
                    value="No eliminado"
                    severity="danger"
                    size="small"
                    :title="item.error"
                  />
                  <Tag v-else-if="item.marcadoEliminar" value="Eliminado" severity="danger" size="small" />
                  <span v-else class="text-green-500 text-sm">Listo</span>
                </td>
                <td v-if="editando">
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    variant="text"
                    size="small"
                    @click="confirmarEliminar(item)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cards mobile -->
        <div class="flex flex-col gap-2 md:hidden mt-3">
          <div
            v-for="item in u.estado.items"
            :key="item.id"
            class="bg-surface border border-border p-3 border-round"
            :class="item.marcadoEliminar ? 'opacity-50' : ''"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0 flex-1">
                <template v-if="editando && !item.marcadoEliminar">
                  <InputText v-model="item.nombre" size="small" class="w-full" />
                </template>
                <template v-else>
                  <span class="font-medium" :class="item.marcadoEliminar ? 'line-through' : ''">{{ item.nombre }}</span>
                  <Tag v-if="item.esNuevo" value="Nuevo" severity="success" size="small" class="ml-2" />
                </template>
              </div>
              <Button
                v-if="editando"
                icon="pi pi-trash"
                severity="danger"
                variant="text"
                size="small"
                @click="confirmarEliminar(item)"
              />
            </div>
            <div class="mt-2 flex flex-col gap-1">
              <template v-if="editando && !item.marcadoEliminar">
                <label class="text-xs text-surface-400">Descripción</label>
                <InputText v-model="item.descripcion" size="small" class="w-full" />
              </template>
              <span v-else class="text-sm text-surface-400">{{ item.descripcion || "Sin descripción" }}</span>
              <Tag v-if="item.error" :value="item.error" severity="danger" size="small" />
              <Tag v-else-if="item.marcadoEliminar" value="Eliminado" severity="danger" size="small" />
            </div>
          </div>
        </div>

        <p v-if="u.resultado" class="text-sm text-green-500 mt-2 m-0">
          {{ mensajeResultado }}<template v-if="!u.tieneErrores"> Paso completado.</template>
        </p>

        <div v-if="!editando" class="mt-4 flex justify-end">
          <Button
            label="Guardar sectores"
            icon="pi pi-save"
            :loading="u.enviando"
            :disabled="!u.itemsValidos"
            @click="guardar"
          />
        </div>
      </template>
    </template>
  </Card>
  <ConfirmDialog />
</template>