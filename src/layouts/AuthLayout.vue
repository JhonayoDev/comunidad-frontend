<script setup>
import fondoweb from "@/assets/fondoweb.webp";
import AppHeader from "@/components/layout/AppHeaderLogin.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
</script>

<template>
  <!-- Shell de alto fijo igual al viewport real (dvh): header y footer fijos,
       scroll interno solo en <main>. Así el footer siempre queda visible y la
       card de login/recuperación nunca corta en pantallas pequeñas. -->
  <div
    class="relative flex flex-col overflow-hidden h-screen supports-[height:100dvh]:h-dvh"
  >
    <!-- Imagen de fondo -->
    <div
      class="absolute inset-0 bg-cover bg-center blur-md"
      :style="{ backgroundImage: `url(${fondoweb})` }"
    />

    <!-- Overlay SOLO sobre la imagen -->
    <div class="absolute inset-0 bg-background opacity-35" />

    <!-- Contenido -->
    <div class="relative z-10 flex-1 min-h-0 flex flex-col">
      <AppHeader />

      <main class="flex-1 min-h-0 overflow-y-auto flex flex-col px-4">
        <!-- m-auto: centra la card cuando hay espacio y scrollea bien cuando
             el contenido excede el alto del <main> -->
        <div class="w-full max-w-sm m-auto py-4">
          <RouterView />
        </div>
      </main>

      <AppFooter />
    </div>
  </div>
</template>
