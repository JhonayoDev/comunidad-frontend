# Plan de Ejecución: Extraer "Acceso Rápido" a Bottom Navigation Bar Global (PWA Standalone)

Actúa como un Desarrollador Frontend Senior experto en Vue 3 y PWA. Vamos a ejecutar el plan para convertir el menú de accesos rápidos en una Barra de Navegación Inferior (Bottom Navigation Bar) estilo app nativa cuando la app esté instalada como PWA.

---

## 🛠️ Stack Técnico del Proyecto

- **Core:** Vue 3 (Composition API `<script setup>`), Vue Router 4, Pinia, TanStack Query.
- **UI & Estilos:** PrimeVue 4.5.5, Tailwind CSS 4.
- **Testing:** Vitest + `@vue/test-utils`.

---

## 📌 Requisitos Previos y Globales de UX

1. **Meta Viewport (`index.html`):**
   Asegurar que el meta tag contenga `viewport-fit=cover` para permitir que `env(safe-area-inset-bottom)` responda correctamente al área segura de iOS/Android:

   ```html
   <meta
     name="viewport"
     content="width=device-width, initial-scale=1.0, viewport-fit=cover"
   />

   Tacto Nativo en Móviles (CSS Global o en Componentes Nav): CSS
   .bottom-nav-item { -webkit-tap-highlight-color: transparent; user-select:
   none; }
   ```

🚀 Plan Arquitectónico (Fases de Desarrollo)
Fase 1: Composable src/composables/usePwaStandalone.js

Crear composable reactivo para detectar si la PWA corre en modo instalado en un dispositivo táctil:

    Evaluar window.matchMedia("(display-mode: standalone)").matches (Android/Desktop).

    Evaluar window.navigator.standalone === true (iOS Safari).

    Escuchar eventos change en matchMedia, pageshow, focus y appinstalled.

    Incluir check matchMedia("(pointer: coarse)") para restringir la barra a teléfonos/tablets (evita renderizar la barra en ventanas PWA de escritorio).

    Retornar { isStandalone, esTouch, mostrar } donde mostrar = isStandalone && esTouch.

Fase 2: Configuración Única src/config/navegacionAccesoRapido.js

Crear la fuente de verdad para los botones por rol. Cada ítem puede incluir la propiedad isCentralFab: true para habilitar el estilo del botón flotante central:

```JavaScript

export const ACCESO_RAPIDO_GUARDIA = [
  { label: 'Visita', icon: 'pi pi-user-plus', routeName: 'RegistrarVisita' },
  { label: 'Bitácora', icon: 'pi pi-book', routeName: 'Bitacora' },
  { label: 'Escanear', icon: 'pi pi-qrcode', routeName: 'Escanear', isCentralFab: true }, // Botón Flotante Central
  { label: 'Autoriz.', icon: 'pi pi-shield', routeName: 'Autorizaciones' },
  { label: 'Solicitudes', icon: 'pi pi-inbox', routeName: 'Solicitudes' },
];

export const BOTTOM_NAV_BY_ROLE = {
  GUARDIA: ACCESO_RAPIDO_GUARDIA,
  ADMINISTRADOR: [ /* items admin con central FAB opcional */ ],
  RESIDENTE: [ /* items residente con central FAB opcional */ ],
  SUPER_ADMIN: [],
  SOPORTE: []
};

```

Fase 3: Componente src/components/quickaccess/AccesoRapidoCard.vue

Extraer la card actual de GuardiaDashboardView.vue a un componente reutilizable.

    Recibe props: items, title (default "Acceso rápido"), columns (default 3).

    Utiliza AccesoRapidoCard dentro del dashboard usando ACCESO_RAPIDO_GUARDIA.

Fase 4: Composable y Componente BottomNavigation.vue

    src/composables/useBottomNav.js:

        Consume auth.condominioActualRol y filtra ítems con helper de permisos puedeAcceder().

        Evalúa activo(item) comparando route.path (cubre subrutas).

        Expone { items, visible, activo, go }.

    Reescritura de src/components/layout/BottomNavigation.vue:
    (Usar la plantilla mock provista más abajo).

Fase 5: Integración en src/layouts/MainLayout.vue

    Importar usePwaStandalone().

    Ajustar <main :class="{ 'pb-24': mostrar }"> para no tapar contenido.

    Renderizar <BottomNavigation v-if="mostrar" /> y <AppFooter v-else />.

Fase 6: Fallback de Ruta EnConstruccionView.vue

    Crear src/views/common/EnConstruccionView.vue y enlazar la ruta Solicitudes a este vista temporalmente para solucionar el error 404 del backend.

Fase 7: Cobertura de Pruebas

    Crear usePwaStandalone.test.js y BottomNavigation.test.js probando mocks de matchMedia, renderizado por rol y navegación.

🎨 Plantilla Mock de Referencia: BottomNavigation.vue

Utiliza este código de referencia para construir el componente en Vue 3 + Tailwind CSS + PrimeVue. Replícalo garantizando el diseño del botón flotante central:
Fragmento de código

```js

<script setup>
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useBottomNav } from '@/composables/useBottomNav'

const route = useRoute()
const router = useRouter()
const { items, visible, activo, go } = useBottomNav()
</script>

<template>
  <nav
    v-if="visible"
    class="fixed bottom-0 left-0 right-0 z-[50] bg-surface-0 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 shadow-lg pb-[env(safe-area-inset-bottom)]"
  >
    <div class="flex items-center justify-around h-16 px-2 relative">
      <template v-for="item in items" :key="item.routeName">

        <!-- OP 1: Botón Flotante Central (FAB) -->
        <div v-if="item.isCentralFab" class="relative -top-5 flex flex-col items-center">
          <Button :icon="item.icon" @click="go(item)" class="!w-14 !h-14 !p-0 shadow-lg !bg-primary-600 hover:!bg-primary-700 !border-none !text-white transform transition-transform active:scale-95" rounded/>
          <span
            v-if="item.label"
            class="text-[10px] font-medium mt-1 text-surface-600 dark:text-surface-300"
          >
            {{ item.label }}
          </span>
        </div>

        <!-- OP 2: Ítems Estándar -->
        <button
          v-else
          type="button"
          @click="go(item)"
          :class="[
            'bottom-nav-item flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors',
            activo(item)
              ? 'text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-surface-500 hover:text-surface-700 dark:text-surface-400'
          ]"
        >
          <i :class="[item.icon, 'text-xl mb-0.5']"></i>
          <span class="text-[11px] leading-none">{{ item.label }}</span>
        </button>

      </template>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav-item {
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
</style>
```

📋 Instrucciones de Salida

Genera los archivos correspondientes paso a paso comenzando por la Fase 1 (usePwaStandalone.js) y Fase 2 (navegacionAccesoRapido.js).
