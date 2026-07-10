# Sistema de Temas de Comunidad

## Objetivo

Este proyecto utiliza **PrimeVue** como biblioteca de componentes y **Tailwind CSS v4** para el diseño personalizado.

La idea principal es que **todos los colores de la aplicación tengan un único origen**.

No se deben escribir colores hexadecimal (`#003366`, `#ffffff`, etc.) directamente dentro de los componentes.

En su lugar, toda la identidad visual se administra desde la carpeta:

```text
src/theme/
```

---

# Estructura

```text
src/
└── theme/
    ├── colors.js
    ├── prime-theme.js
    ├── index.js
    ├── app.css
    └── README.md
```

Cada archivo tiene una responsabilidad específica.

---

# Flujo general

La información fluye siempre en esta dirección:

```text
colors.js
        │
        ▼
prime-theme.js
        │
        ▼
PrimeVue genera variables CSS

        (--p-*)

        │
        ▼
app.css

(alias para Tailwind)

        │
        ▼

Nuestros componentes Vue
```

Es importante entender que **PrimeVue es quien genera las variables CSS finales**.

Nosotros solamente le entregamos nuestros colores.

---

# Archivo: colors.js

Este es el archivo más importante del sistema.

Aquí vive la identidad visual completa de la aplicación.

Ejemplo:

```javascript
light: {
  background;

  surface;

  text.primary;

  text.secondary;

  border;

  primary;

  success;

  warning;

  danger;

  info;
}
```

y exactamente lo mismo para el modo oscuro.

Este archivo **NO conoce PrimeVue**.

No sabe qué es `surface-100`.

No sabe qué es `primary-500`.

Simplemente describe la marca.

Por ejemplo:

```javascript
primary: "#003366";
```

significa:

> "El color corporativo de Comunidad es este."

No significa:

> "PrimeVue debe usar este color para los botones."

Esa traducción ocurre después.

---

# ¿Cuándo modificar colors.js?

Siempre.

Si mañana cambia la identidad visual de la empresa, solamente debería modificarse este archivo.

Ejemplos:

Cambiar azul corporativo

```javascript
primary;
```

Cambiar color de fondo

```javascript
background;
```

Cambiar color de texto

```javascript
text.primary;
```

Cambiar color de éxito

```javascript
success;
```

Nunca deberían aparecer colores hexadecimal en los componentes.

---

# Archivo: prime-theme.js

PrimeVue no entiende conceptos como:

- background
- surface
- card
- text

PrimeVue utiliza su propio sistema de Design Tokens.

Por ejemplo:

```text
surface-0

surface-50

surface-100

surface-200

primary-500
```

Este archivo actúa como un traductor.

Por ejemplo:

```text
colors.light.background

↓

PrimeVue surface-100
```

o

```text
colors.light.primary

↓

PrimeVue primary-500
```

Gracias a esto, el resto del proyecto nunca necesita conocer cómo funciona internamente PrimeVue.

---

# ¿Por qué existen tantos "surface"?

PrimeVue necesita una escala completa porque los componentes utilizan diferentes niveles de color.

Por ejemplo:

- fondo principal
- cards
- diálogos
- overlays
- hover
- menús
- tablas

Aunque nosotros solamente pensemos en:

```text
Background
```

y

```text
Surface
```

PrimeVue necesita varios tonos.

Actualmente solamente utilizamos algunos niveles.

En el futuro podremos agregar más sin modificar el resto del proyecto.

---

# Archivo: app.css

Una vez que PrimeVue genera sus variables CSS:

```css
--p-primary-color

--p-text-color

--p-surface-100

--p-content-border-color
```

las convertimos en nombres más fáciles de recordar para Tailwind.

Por ejemplo:

```css
--color-background
```

realmente apunta a

```css
--p-surface-100
```

y

```css
--color-primary
```

apunta a

```css
--p-primary-color
```

Nosotros nunca usamos directamente:

```css
--p-surface-100
```

porque pertenece a PrimeVue.

Utilizamos siempre nuestros alias.

---

# ¿Cómo utilizar los colores?

Con Tailwind.

Ejemplos:

```html
<div class="bg-background"></div>
```

```html
<div class="bg-surface"></div>
```

```html
<p class="text-text"></p>
```

```html
<p class="text-text-muted"></p>
```

```html
<div class="border border-border"></div>
```

```html
<button class="bg-primary" />
```

```html
<span class="text-success"></span>
```

Los colores cambiarán automáticamente cuando PrimeVue cambie entre modo claro y oscuro.

---

# ¿Cuándo usar PrimeVue y cuándo Tailwind?

PrimeVue proporciona los componentes.

Ejemplos:

- Button
- DataTable
- Dialog
- Drawer
- Calendar
- InputText

Tailwind sirve para construir el layout y aplicar estilos propios.

Ejemplos:

- Flex
- Grid
- Espaciado
- Márgenes
- Padding
- Alineación
- Tamaños
- Colores personalizados

En general:

PrimeVue resuelve el comportamiento.

Tailwind resuelve el diseño.

---

# ¿Dónde debo cambiar un color?

## Cambió la identidad visual

Modificar:

```text
colors.js
```

---

## Un componente específico necesita un pequeño ajuste

Modificar:

```css
app.css
```

o crear una clase CSS específica.

---

## Un componente de PrimeVue necesita un override

Crear una regla CSS específica para ese componente.

Ejemplo:

```css
.p-button {
}
```

Intentar no modificar `colors.js` para solucionar problemas aislados de un componente.

---

# Buenas prácticas

✔ Utilizar siempre los alias definidos en `app.css`.

✔ Mantener todos los colores corporativos en `colors.js`.

✔ Evitar colores hexadecimal dentro de componentes Vue.

✔ Preferir clases de Tailwind antes que estilos inline.

✔ Mantener `prime-theme.js` como un simple adaptador entre nuestro sistema de diseño y PrimeVue.

---

# Filosofía del proyecto

Este proyecto intenta separar tres responsabilidades distintas.

## 1. Identidad visual

Describe los colores de la marca.

Archivo:

```text
colors.js
```

---

## 2. Integración con PrimeVue

Traduce nuestros colores al sistema interno de PrimeVue.

Archivo:

```text
prime-theme.js
```

---

## 3. Desarrollo diario

Los desarrolladores utilizan únicamente clases de Tailwind y componentes de PrimeVue.

No necesitan conocer cómo funciona internamente el sistema de temas.

Gracias a esta separación, si en el futuro se decide cambiar PrimeVue por otra biblioteca de componentes, la mayor parte de la identidad visual podrá mantenerse. Solo será necesario reemplazar el adaptador (`prime-theme.js`) sin modificar los colores definidos por la aplicación.
