<script setup>
import { useRouter } from "vue-router";
import Card from "primevue/card";
import Button from "primevue/button";

const props = defineProps({
  title: { type: String, default: "Acceso rápido" },
  items: { type: Array, required: true },
  columns: { type: Number, default: 3 },
});

const router = useRouter();

function go(item) {
  const target = { name: item.routeName };
  if (item.query) target.query = item.query;
  router.push(target);
}
</script>

<template>
  <Card>
    <template #title>
      <span class="text-text/90">{{ title }}</span>
    </template>
    <template #content>
      <div
        class="grid gap-2"
        :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
      >
        <Button
          v-for="item in items"
          :key="item.routeName"
          :label="item.label"
          :icon="item.icon"
          :severity="item.isCentralFab ? 'primary' : 'secondary'"
          :variant="item.isCentralFab ? 'filled' : 'outlined'"
          @click="go(item)"
        />
      </div>
    </template>
  </Card>
</template>
