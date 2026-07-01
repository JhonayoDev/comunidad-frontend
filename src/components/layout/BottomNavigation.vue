<template>
  <nav
    class="fixed bottom-0 left-0 right-0 surface-card border-top-1 surface-border"
  >
    <div class="flex justify-content-around py-2">
      <Button
        v-for="item in navItems"
        :key="item.routeName"
        :icon="item.icon"
        :label="item.label"
        text
        :class="{ 'text-primary': currentRoute === item.routeName }"
        @click="goTo(item.routeName)"
      />
    </div>
  </nav>
</template>

<script setup>
import Button from "primevue/button";
import { useNavigation } from "@/composables/useNavigation";

const { navItems, currentRoute, goTo } = useNavigation();
</script>
