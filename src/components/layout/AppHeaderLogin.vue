<template>
  <header
    class="header-text surface-card px-3 py-2 flex align-items-center justify-content-between shadow-1 w-full bg-background/25 rounded-b-lg"
  >
    <div class="header-btn flex align-items-center gap-3">
      <img
        src="../../assets/casa.png"
        alt="Logo"
        class="w-10 h-10 border-circle overflow-hidden object-cover cursor-pointer"
      />
    </div>

    <div class="flex align-items-center gap-1 ml-auto">
      <Button
        class="header-btn"
        :icon="esOscuro ? 'pi pi-moon' : 'pi pi-sun'"
        severity="secondary"
        text
        rounded
        @click="toggleTema"
      />
    </div>
  </header>
</template>

<script setup>
import { ref } from "vue";
import Button from "primevue/button";

const esOscuro = ref(false);

function toggleTema() {
  esOscuro.value = !esOscuro.value;
  document.documentElement.classList.toggle("p-dark", esOscuro.value);
  localStorage.setItem("theme", esOscuro.value ? "dark" : "light");
}

function initTema() {
  const saved = localStorage.getItem("theme");
  esOscuro.value = saved === "dark";
  document.documentElement.classList.toggle("p-dark", esOscuro.value);
}

initTema();
</script>

<style scoped>
.header-text {
  color: var(--p-surface-900);
}
</style>

<!--
  Sin scoped para penetrar PrimeVue y forzar el color del icono.
  El color del icono debe coincidir con el texto del header.
  Cambia el valor de --p-surface-900 si quieres otro color.
-->
<style>
button.header-btn .p-button-icon {
  color: var(--p-surface-900) !important;
}
</style>
