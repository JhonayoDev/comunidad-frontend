<template>
  <nav
    v-if="visible"
    class="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 shadow-lg bg-surface/90 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
  >
    <div class="flex items-center justify-around h-12 px-2 relative">
      <template v-for="item in items" :key="item.routeName">
        <div
          v-if="item.isCentralFab"
          class="relative -top-3.5 flex flex-col items-center"
        >
          <Button
            :icon="item.icon"
            severity="primary"
            rounded
            class="!w-12 !h-12 !p-0 shadow-lg transform transition-transform active:scale-95"
            aria-label="Acción principal"
            @click="go(item)"
          />
          <span
            v-if="item.label"
            class="text-[10px] font-medium mt-1.5 text-text-muted"
          >
            {{ item.label }}
          </span>
        </div>

        <button
          v-else
          type="button"
          :class="[
            'bottom-nav-item flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors',
            activo(item)
              ? 'text-primary font-semibold'
              : 'text-text-muted hover:text-text',
          ]"
          @click="go(item)"
        >
          <i :class="[item.icon, 'text-xl mb-0.5']"></i>
          <span class="text-[11px] leading-none">{{ item.label }}</span>
        </button>
      </template>
    </div>
  </nav>
</template>

<script setup>
import Button from "primevue/button";
import { useBottomNav } from "@/composables/useBottomNav";

const { items, visible, activo, go } = useBottomNav();
</script>

<style scoped>
.bottom-nav-item {
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
</style>
