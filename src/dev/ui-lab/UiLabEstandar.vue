<script setup>
import { ref } from "vue";
import Card from "primevue/card";
import Tag from "primevue/tag";
import Button from "primevue/button";
import { ESTANDAR, markupDe } from "@/data/estandarBotones";

// Estándar propuesto desde el catálogo único (misma fuente que AppButton).
// contexto: dialogo (pie con Cancelar + Guardar) | tabla (fila con botón) | suelto.
const ITEMS = ESTANDAR;

const copiado = ref("");

async function copiar(texto, clave) {
  try {
    await navigator.clipboard.writeText(texto);
    copiado.value = clave;
    setTimeout(() => {
      if (copiado.value === clave) copiado.value = "";
    }, 1500);
  } catch (error) {
    console.error("[ui-lab] no se pudo copiar", error);
  }
}

function markupAppButton(item) {
  return `<AppButton intencion="${item.slug}" />`;
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <Card v-for="item in ITEMS" :key="item.slug" :id="`estandar-${item.slug}`" class="scroll-mt-24">
      <template #content>
        <div class="flex flex-wrap items-center gap-2 mb-1">
          <span class="font-bold">{{ item.nombre }}</span>
          <Tag :value="item.contexto" severity="secondary" />
        </div>
        <p class="text-sm text-text-muted m-0 mb-2">{{ item.uso }}</p>

        <code class="block text-xs bg-inset border border-border rounded-lg p-2 break-all mb-2">
          {{ markupDe(item.props) }}
        </code>

        <div class="flex flex-wrap items-center gap-2 mb-2">
          <Button
            :label="copiado === `${item.slug}-btn` ? '¡Copiado!' : 'Copiar Button'"
            icon="pi pi-copy"
            variant="text"
            severity="secondary"
            size="small"
            @click="copiar(markupDe(item.props), `${item.slug}-btn`)"
          />
          <Button
            :label="copiado === `${item.slug}-app` ? '¡Copiado!' : 'Copiar AppButton'"
            icon="pi pi-copy"
            variant="text"
            severity="secondary"
            size="small"
            @click="copiar(markupAppButton(item), `${item.slug}-app`)"
          />
        </div>

        <!-- Estados: normal · disabled · loading (el hover se revisa con el mouse) -->
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <Button v-bind="item.props" />
          <Button v-bind="item.props" disabled />
          <Button v-bind="item.props" loading />
          <span class="text-xs text-text-muted">normal · disabled · loading (hover: pasa el mouse)</span>
        </div>

        <!-- Contexto realista -->
        <div v-if="item.contexto === 'dialogo'" class="border border-border rounded-lg p-3 bg-surface">
          <p class="text-xs text-text-muted m-0 mb-2">Pie de diálogo</p>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" variant="text" />
            <Button label="Guardar" />
          </div>
        </div>

        <div v-if="item.contexto === 'tabla'" class="border border-border rounded-lg p-2 bg-surface">
          <p class="text-xs text-text-muted m-0 mb-1">Fila de tabla</p>
          <div class="flex items-center justify-between p-2 border-round bg-emphasis">
            <div class="flex flex-col">
              <span class="text-sm font-medium">Casa 101</span>
              <span class="text-xs text-text-muted">GC Enero · Vence: 10/02</span>
            </div>
            <Button v-bind="item.props" />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
