<script setup>
import fondoweb from "@/assets/fondoweb.webp";
import AppHeader from "@/components/layout/AppHeaderLogin.vue";
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

      <main class="flex-1 flex items-center justify-center px-4">
        <div class="w-full max-w-sm">
          <RouterView />
        </div>
      </main>

      <AppFooter />
    </div>
  </div>
</template>
