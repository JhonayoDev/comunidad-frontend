<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Card from "primevue/card";
import Button from "primevue/button";

const props = defineProps({
  modulo: { type: String, default: "" },
});

const route = useRoute();
const router = useRouter();

const modulo = computed(
  () => props.modulo || route.query.modulo || route.name || "Módulo",
);

function volver() {
  router.back();
}
</script>

<template>
  <div class="p-4 flex justify-center">
    <Card class="w-full max-w-md">
      <template #content>
        <div class="flex flex-col items-center gap-3 py-6 text-center">
          <i
            class="pi pi-wrench text-4xl"
            style="color: var(--p-primary-400)"
          ></i>
          <p class="text-lg font-bold m-0">{{ modulo }}</p>
          <p class="text-sm text-text-muted m-0">
            Este módulo está en construcción. Volveremos pronto.
          </p>
          <Button
            label="Volver"
            icon="pi pi-arrow-left"
            severity="secondary"
            variant="outlined"
            @click="volver"
          />
        </div>
      </template>
    </Card>
  </div>
</template>
