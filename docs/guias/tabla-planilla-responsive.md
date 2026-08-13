# Guía — Tabla "planilla" responsive (mobile cards + desktop tabla Excel)

> **Versión:** 1.0
> **Fecha:** 2026-08-12
> **Uso actual:** `SaasAuditoriaView.vue`
> **Estilos reutilizables:** `.planilla` en `src/theme/app.css`

Patrón para mostrar listas/datos tabulares con buena lectura en ambos contextos:

- **Mobile:** cards con header compacto (clickeable) que despliegan el body con el detalle completo.
- **Desktop:** tabla con celdas tipo planilla (Excel) sobre **fondo sólido**, zebra, header fijo y scroll horizontal cuando faltan columnas.

---

## 1. Regla de oro (la más importante)

**NO usar las clases `surface-card`, `border-round`, `shadow-1`** (y similares del viejo
preset de PrimeVue). En este proyecto **no existen** y no resuelven a ningún color → todo lo
que las use queda **transparente**, ilegible en claro y oscuro (fue el bug que motivó este
patrón).

En su lugar, usar **siempre** los tokens del tema (`app.css`):

| Necesidad | Clase/alias |
|---|---|
| Fondo sólido de card/panel | `bg-surface` o `var(--color-surface)` |
| Fondo de página / header | `bg-background` o `var(--color-background)` |
| Texto normal | `text-text` / `var(--color-text)` |
| Texto secundario | `text-text-muted` / `var(--color-text-muted)` |
| Bordes | `border-border` / `var(--color-border)` |
| Semánticos | `text-success` / `text-warning` / `text-danger` / `text-info` |

---

## 2. La tabla desktop (`.planilla`)

Definida en `src/theme/app.css` dentro de `@layer components`. Una sola clase `.planilla`
en el contenedor estiliza el `<table>`, `<thead>`, `<tbody>`, zebra y hover:

```html
<div class="planilla hidden md:block">
  <table>
    <thead>
      <tr>
        <th>Columna A</th>
        <th class="sortable" @click="toggleOrden">
          <span class="inline-flex items-center gap-1">
            Fecha
            <i :class="orden === 'desc' ? 'pi pi-sort-amount-down' : 'pi pi-sort-amount-up-alt'" class="text-xs" />
          </span>
        </th>
        <th>Columna C</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in items" :key="item.id">
        <td class="whitespace-nowrap text-text-muted">{{ item.a }}</td>
        <td class="truncado">
          <span :title="item.detalle" class="text-text-muted">{{ item.detalle }}</span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

Qué hace `.planilla` por ti:

- **Fondo sólido** `var(--color-surface)` (blanco en claro / gris en oscuro).
- **Zebra sólido**: filas pares mezclan `background 40%` sobre `surface` con `color-mix`
  (no un overlay transparente → siempre legible).
- **Hover** al 70% del mismo `background`.
- Header con `background`, texto `text-muted` en mayúsculas y bordes.
- Borde de celda en toda la grilla (planilla) y `min-width: 900px` + `overflow-x: auto`
  para scroll horizontal en pantallas angostas.
- `th.sortable` → cursor pointer + hover. `td.truncado` → columna de detalle truncada
  con `text-overflow: ellipsis` (el `title` del `<span>` da el tooltip).

> Personalización por celda: se siguen usando utilitarios Tailwind en las `<td>`
> (`whitespace-nowrap`, `text-text-muted`, etc.). La clase base se puede ajustar en
> `app.css` una sola vez.

---

## 3. Las cards mobile

La parte mobile es layout (no estilo): header clicable + body desplegable. Envolver el
contenedor con `md:hidden` para que solo exista por debajo del breakpoint:

```html
<!-- Mobile -->
<div class="flex flex-col gap-1 md:hidden">
  <div v-for="(item, idx) in items" :key="item.id">
    <!-- Header (clic para expandir) -->
    <div
      class="flex items-center justify-between gap-2 p-3 border rounded-lg cursor-pointer transition-colors select-none"
      :class="expandido === idx
        ? 'border-border bg-background rounded-b-none'
        : 'border-border-secondary bg-surface/90 hover:bg-background/95'"
      @click="expandido = expandido === idx ? -1 : idx"
    >
      <div class="flex items-center gap-2 text-xs min-w-0 flex-1 overflow-hidden">
        <i class="pi pi-building text-text-muted" />
        <span class="text-text font-semibold whitespace-nowrap">{{ item.titulo }}</span>
        <span class="text-text-muted hidden sm:inline truncate min-w-0">· {{ item.subtitulo }}</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <Tag :value="item.estadoLabel" :severity="item.severity" size="small" />
        <i :class="expandido === idx ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-xs" />
      </div>
    </div>

    <!-- Body desplegable -->
    <div v-if="expandido === idx" class="border border-t-0 border-primary rounded-b-lg p-3 bg-surface">
      <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <span class="text-text-muted">Campo:</span>
        <span>{{ item.valor }}</span>
      </div>
      <p v-if="item.detalle" class="m-0 mt-2 text-sm">
        <span class="text-text-muted">Detalle:</span> {{ item.detalle }}
      </p>
    </div>
  </div>
</div>
```

Notas:

- `expandido` guarda el **índice** de la fila abierta (una a la vez, estilo acordeón).
- Resetear `expandido = -1` al **cambiar de página / aplicar filtros**.
- El header solo muestra lo esencial (1 línea); todo lo demás vive en el body.

---

## 4. Consejos de comportamiento

- **Breakpoint:** la tabla aparece con `hidden md:block` (≥768px). Si la tabla tiene muchas
  columnas, subirlo a `lg:` es válido — cambiar solo en esos dos modificadores.
- **Paginación:** el `<Paginator>` va **después** de ambos bloques (se comparte).
- **Ordenamiento:** si el backend ordena (param `sort`), el header clicable debe reiniciar la
  página a 0 y disparar la misma búsqueda que el botón "Buscar".
- **Iconos de fila:** usar íconos `pi pi-*` pequeños (`text-xs`) con `text-text-muted`.

---

## 5. Ejemplo real

Ver `src/views/superadmin/SaasAuditoriaView.vue` (filtros + `div.planilla` desktop +
cards `md:hidden` + Select de orden + header "Fecha" clicable).
