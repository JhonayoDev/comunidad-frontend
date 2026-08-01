# Guía: Cómo personalizar los colores de los botones

> **Autor:** Frontend  
> **Alcance:** Botones PrimeVue (`<Button />`) en el frontend de Comunidad.  
> **Stack:** PrimeVue 4.5.5 + Tailwind CSS + tema propio (`@primeuix/themes`).

---

## 1. Cómo se estructuran los colores (3 niveles)

Los colores de un botón se pueden tocar en **tres niveles**, de lo global a lo puntual:

### Nivel 1 — Tema global: `src/theme/prime-theme.js`

Aquí viven los **design tokens** que generan las variables CSS (`--p-*`) que usa PrimeVue.

- `semantic.colorScheme.light.primary` / `semantic.colorScheme.dark.primary` → el azul principal de la app:
  - `color` → color base (fondo de botones filled, acentos)
  - `hoverColor` → hover de filled
  - `activeColor` → active de filled
  - `border` / `borderSecondary` → bordes
  - `textPrincipal` / `textSecondary` → textos principales y secundarios
- `semantic.primary.50–950` → la **escala** de azules a la que apuntan referencias como `{primary-500}`.
- `components.button.outlined.primary` / `components.button.outlined.secondary` → tokens de botones **outlined** (color, borderColor, hover/active).
- `components.button.text.secondary` → tokens de botones **text**.

> Cambiar algo aquí afecta **toda la app** (botones, links, checkbox, selects, etc.).

### Nivel 2 — Por botón (template): props + clases

En cada `<Button />` se puede cambiar el estilo con:

- `severity` → paleta semántica: `primary`, `secondary`, `danger`, `success`, `info`, `warn`, `help`, `contrast`.
- `variant` → forma: `filled` (relleno, el default), `outlined`, `text`, `link`.
- Clases Tailwind **con `!`** para forzar colores puntuales: `!bg-primary`, `!text-text-inverse`, `!border-primary`.

### Nivel 3 — `src/style.css`

Comportamiento touch/desktop global:

- Hover neutro en táctil (evita el "stuck hover").
- Flash de presión (`:active`) con tintes.
- Ripple de PrimeVue oculto en móvil (`.p-ink`).
- Clases utilitarias custom (`.btn-no-bg`, `.body-btn`).

---

## 2. Tokens actuales (referencia)

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--p-primary-color` | `#003366` | `#003366` | Fondo de botones filled, acento principal |
| `--p-primary-hover-color` | `#265e95` (`primary-500`) | `#265e95` | Hover de filled |
| `--p-primary-active-color` | `#00488f` | `#00488f` | Active de filled |
| `--p-primary-text-principal` | `#1a1a1a` | `#ffffff` | Texto principal |
| `--p-primary-text-secondary` | `#5a5c61` | `#b3b3b7` | Texto secundario / outlined secondary |
| `--p-primary-border` | `#004d99` | `#004d99` | Borde de outlined primary |
| `--p-primary-border-secondary` | `#b0cfef` | `#b0cfef` | Borde de outlined secondary |
| `--p-danger-500` | `#c53b3b` | `#c53b3b` | Tinte de text danger |
| `--p-button-primary-background` | `#003366` | `#003366` | Fondo filled primary |
| `--p-button-primary-color` | blanco (contraste) | blanco | Texto filled primary |
| `--p-button-primary-active-background` | `#00488f` | `#00488f` | Flash de presión filled |
| `--p-button-outlined-primary-color` | `textPrincipal` | `textPrincipal` | Texto outlined primary |
| `--p-button-outlined-primary-border-color` | `#004d99` | `#004d99` | Borde outlined primary |
| `--p-button-outlined-secondary-color` | `#5a5c61` | `#b3b3b7` | Texto outlined secondary |
| `--p-button-outlined-secondary-border-color` | `#b0cfef` | `#b0cfef` | Borde outlined secondary |
| `--p-button-outlined-secondary-hover-background` | 8% de `textSecondary` | 8% de `textSecondary` | Hover outlined secondary |

---

## 3. Ejemplos listos para copiar

### Ejemplo A — Lupa activa en azul con letras blancas

Hoy la lupa de `EncomiendasView.vue` alterna `outlined` `secondary`/`primary`. Para que al **activarse** se pinte azul relleno con texto blanco, se cambia el `variant` de forma dinámica:

```html
<Button
  icon="pi pi-search"
  size="small"
  :severity="busquedaVisible ? 'primary' : 'secondary'"
  :variant="busquedaVisible ? 'filled' : 'outlined'"
  class="rounded-lg shrink-0"
  aria-label="Buscar"
  :aria-pressed="busquedaVisible"
  @click="toggleBusqueda"
/>
```

- `variant="filled"` **no agrega clase extra** en PrimeVue: es el look relleno por defecto, así que toma `--p-button-primary-*` (fondo `#003366`, texto blanco).
- En móvil ya lo cubren las reglas de `src/style.css` para botones filled (hover neutro + flash al presionar).

### Ejemplo B — Cambiar el color de la lupa inactiva (outlined secondary)

Editar en `src/theme/prime-theme.js` → `components.button.outlined.secondary`:

```js
secondary: {
  color: "{primary.textSecondary}",
  borderColor: "{primary.borderSecondary}",
  hoverBackground: "color-mix(in srgb, {primary.textSecondary} 8%, transparent)",
  activeBackground: "color-mix(in srgb, {primary.textSecondary} 16%, transparent)",
},
```

> Afecta a **todos** los botones `outlined` `secondary` de la app.

### Ejemplo C — Cambiar el azul base de toda la app

Editar `semantic.colorScheme.light.primary.color` (y `dark`) en `src/theme/prime-theme.js`:

```js
primary: {
  color: "#003366", // ← nuevo azul
  hoverColor: "{primary-500}",
  activeColor: "#00488f",
  ...
}
```

> Cambia botones filled, links, checkbox, focus, etc.

### Ejemplo D — Botón puntual con clase Tailwind

Sin tocar el tema, se fuerzan colores en un botón específico:

```html
<Button
  label="Buscar"
  severity="primary"
  variant="outlined"
  class="!bg-primary !text-text-inverse !border-primary"
/>
```

- `!bg-primary` → `var(--p-primary-color)`
- `!text-text-inverse` → `var(--p-primary-text-inverse)`
- `!border-primary` → `var(--p-primary-border)`

---

## 4. Comportamiento touch (resumen de `src/style.css`)

- **`@media (pointer: coarse), (hover: none)`**:
  - Filled: hover/focus neutros (look base), `:active` muestra el tinte `--p-button-primary-active-background`.
  - Outlined: hover neutro, `:active` muestra tinte 16% del tema.
  - Text: hover neutro, `:active` muestra tinte 12% (`primary`, `secondary`, `danger`).
  - `.p-ink` (ripple) oculto en móvil.
- **`@media (hover: hover) and (pointer: fine)`**:
  - Filled: hover con `--p-button-primary-hover-background`.
  - Outlined/text: usan sus propios tokens de hover (no se fuerzan).

---

## 5. Archivos clave

| Archivo | Rol |
|---|---|
| `src/theme/prime-theme.js` | Tokens globales (paletas, colorScheme, componentes) |
| `src/theme/colors.js` | Paletas light/dark base (`text`, `background`, `border`, `danger`, etc.) |
| `src/theme/app.css` | Mapeo `--color-*` de Tailwind a tokens PrimeVue |
| `src/style.css` | Comportamiento touch/desktop de botones |
| `src/views/encomiendas/EncomiendasView.vue` | Lupa con `variant`/`severity` dinámicos |
