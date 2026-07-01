<template>
  <div class="min-h-screen flex flex-col surface-ground">
    <AppHeader />
    <main class="flex-1 overflow-y-auto pb-20">
      <RouterView />
    </main>
    <BottomNavigation />
  </div>
</template>

<script setup>
import AppHeader from "@/components/layout/AppHeader.vue";
import BottomNavigation from "@/components/layout/BottomNavigation.vue";
</script>
