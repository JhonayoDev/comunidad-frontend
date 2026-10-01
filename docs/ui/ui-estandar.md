# Estándar de UI de Briku

> Este archivo es la fuente de verdad para el uso de colores, superficies y botones.
> Referenciarlo desde `CLAUDE.md` / `AGENTS.md` para que la IA local lo siga.
> Última actualización: 2026-09-30.

---

## Regla general

**Ningún componente ni vista elige un color directamente.**
Todo elemento declara qué **rol** cumple y el color del rol vive en `src/theme/prime-theme.js`.
Para cambiar "todos los botones principales a un azul más oscuro" → una línea en el tema, nada más.

---

## Tokens de texto

| Clase Tailwind | Cuándo usarla | Reemplaza |
|---|---|---|
| `text-text` | Texto principal, títulos, labels importantes | `text-surface-900`, `text-surface-700`, `var(--p-surface-900)` |
| `text-text-subprincipal` | Texto semi-principal, cuerpo de contenido | `text-surface-400` (uso con `/85`) |
| `text-text-muted` | Fechas, labels secundarios, descripciones, empty-states | `text-surface-400`, `text-surface-500`, `var(--p-surface-600)` |
| `text-text-subtle` | Solo decorativo: íconos inactivos, placeholders | `text-surface-300`, `text-surface-0` |
| `text-primary-contrast` | Texto sobre `bg-primary` o botón principal | `#fff`, `#ffffff` en atributos `style` |
| `text-success` | Íconos de éxito, checks | `text-green-500` |
| `text-success-strong` | Montos positivos, texto de éxito | `text-green-600` |
| `text-danger` | Validación de formularios, mensajes de error | `text-red-500` |
| `text-danger-strong` | Montos negativos, estados "Pendiente" | `text-red-600` |
| `text-warning` | Alertas, morosos | `text-orange-600` |
| `text-banner-text` | Texto dentro del `NotificationBanner` | `text-surface-0` |

**Prohibido:** `text-surface-N`, colores hexadecimales directos, `text-red/green/blue/…-N`.

---

## Tokens de superficie

| Clase Tailwind | Cuándo usarla | Reemplaza |
|---|---|---|
| `bg-background` | Fondo de página | fondo raíz |
| `bg-elevated` | Modales, popovers, diálogos de confirmación | `bg-surface-800` en el banner, fondos de overlay |
| `bg-surface` | Cards, paneles principales | `bg-surface` original |
| `bg-inset` | Sub-superficie dentro de una card, filas expandidas | `bg-surface-50`, `bg-surface-100` |
| `bg-subtle-light` | Fondo muy sutil, hover suave de filas | `bg-surface-50` |
| `bg-subtle` | Fondo de skeleton, filas alternas | `bg-surface-100` |
| `bg-track` | Pista de barras de progreso | `bg-surface-200` |
| `bg-banner` | Fondo del `NotificationBanner` | `bg-surface-800` |

**Prohibido:** `bg-surface-N`, `bg-red/green/…-N`.

---

## Tokens de borde

| Clase Tailwind | Cuándo usarla | Reemplaza |
|---|---|---|
| `border-border` | Borde fuerte, inputs, marcos principales | `border-border` original |
| `border-border-secondary` | Borde de énfasis secundario | `border-border-secondary` original |
| `border-border-soft` | Divisor entre filas/secciones | `border-surface-200` |
| `border-border-subtle` | Borde muy suave, casi invisible | `border-surface-100` |
| `border-banner-border` | Borde del `NotificationBanner` | `border-surface-300` |

**Prohibido:** `border-surface-N`.

---

## Botones — solo props PrimeVue, nunca clases de color ni `style`

### Tabla de intenciones

| Intención | Markup exacto | Cuándo |
|---|---|---|
| **Principal** | `<Button label="Guardar" />` | La acción que se quiere que el usuario haga. Máximo 1 por vista o diálogo. |
| **Secundario sólido** | `<Button label="Buscar" severity="secondary" />` | Acción alternativa importante que compite con la principal. |
| **Terciario / Cancelar** | `<Button label="Cancelar" severity="secondary" variant="text" />` | Cancelar, volver, acciones de baja jerarquía. |
| **Contorno** | `<Button label="Editar" severity="secondary" variant="outlined" size="small" />` | Editar en formularios o acciones secundarias con énfasis visual. |
| **Solo ícono en tabla** | `<Button icon="pi pi-trash" severity="secondary" variant="text" size="small" rounded title="Quitar" />` | Acciones en filas de tabla. `title` obligatorio. |
| **Peligro sólido** | `<Button label="Eliminar" severity="danger" />` | Acción destructiva con diálogo de confirmación. |
| **Peligro texto (tabla)** | `<Button icon="pi pi-trash" severity="danger" variant="text" size="small" rounded title="Quitar" />` | Quitar en tabla sin confirmación adicional. |
| **Ingreso** | `<Button label="Registrar ingreso" severity="success" />` | Registrar ingreso de dominio. |
| **Salida** | `<Button label="Registrar salida" severity="warn" />` | Registrar salida de dominio. |
| **Info de dominio** | `<Button label="Ver detalle" severity="info" />` | Acciones informativas de dominio. |
| **Link / navegación** | `<Button label="Ver todas" variant="text" severity="secondary" size="small" />` | Navegación dentro de texto o ancla. |

### Reglas de uso

- **Máximo 1 botón principal** por vista o diálogo.
- **Orden en diálogos:** Cancelar a la izquierda, acción principal a la derecha.
- **`size="small"`** solo en filas de tabla y acciones compactas.
- **`title` obligatorio** en botones solo-ícono (accesibilidad).
- **Prohibido:** `class` con colores, sombras o bordes en `<Button>`; `style` inline; `severity="primary"` explícito (es el default).

---

## CSS propio — reglas

| Situación | Correcto | Incorrecto |
|---|---|---|
| Color de texto en `<style>` | `color: var(--color-text)` | `color: var(--p-surface-900)` |
| Texto atenuado en `<style>` | `color: var(--color-text-muted)` | `color: var(--p-surface-600)` |
| Fondo de card en `<style>` | `background: var(--color-surface)` | `background: var(--p-surface-100)` |
| Override de variable PrimeVue | Solo si no hay token semántico que lo cubra | `--p-select-background: var(--p-surface-200)` |

---

## Antes de crear algo nuevo

1. Leer este archivo primero.
2. Buscar una vista existente que use el mismo componente y copiar su patrón.
3. Si la intención no está en la tabla de botones → preguntar antes de inventar una variante.
4. Si el rol de color no está en las tablas → preguntar antes de usar `surface-N` o un hexadecimal.
5. **Nunca** agregar clases `surface-N`, `red/green/blue-N`, ni colores hexadecimales en vistas.

---

## Intercambio de colores del botón principal (para pruebas visuales)

En `src/theme/prime-theme.js`, la función `buttonScheme()` tiene dos bloques marcados:
- `[SWAP-LIGHT]` → actualmente en modo claro (azul de marca `#173a6a`)
- `[SWAP-DARK]`  → actualmente en modo oscuro (azul profundo `#002d5c`)

Para probar el inverso, intercambia los bloques entre los modos `"light"` y `"dark"`.
