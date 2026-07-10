<template>
  <div class="min-h-screen flex flex-col surface-ground">
    <AppHeader />
    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
</script>
