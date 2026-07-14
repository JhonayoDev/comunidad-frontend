<script setup>
import fondoweb from "@/assets/fondoweb.webp";
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
</script>

<template>
  <div class="min-h-screen relative overflow-hidden flex flex-col">
    <!-- Imagen de fondo -->
    <div
      class="absolute inset-0 bg-cover bg-center bg-fixed blur-md"
      :style="{ backgroundImage: `url(${fondoweb})` }"
    />

    <!-- Overlay SOLO sobre la imagen -->
    <div class="absolute inset-0 bg-background opacity-35" />

    <!-- Contenido -->
    <div class="relative z-10 flex min-h-screen flex-col">
      <AppHeader />
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
      <AppFooter />
    </div>
  </div>
</template>
