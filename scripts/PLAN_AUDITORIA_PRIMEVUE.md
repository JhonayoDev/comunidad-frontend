# Plan de auditoría y estandarización de PrimeVue (Briku frontend)

## Objetivo

Saber **qué componentes PrimeVue existen hoy, cómo están escritos en cada vista**, agruparlos por variante real, decidir un estándar y migrar vista por vista sin romper nada.

## Principio clave

**No le pidas a la IA que "escanee y recuerde".** Los LLM son malos contando y siendo exhaustivos sobre muchos archivos. Divide el trabajo:

| Tarea | Quién |
|---|---|
| Extraer inventario (qué, dónde, con qué props/clases) | **Script determinista** (abajo) |
| Interpretar, categorizar, proponer estándar | **IA local**, leyendo el inventario (no el repo entero) |
| Decidir el estándar final | **Tú** |
| Migrar vista por vista | **IA local**, con checklist y validación tuya |

El inventario generado por script es la "fuente de verdad" y se puede volver a correr al final para comprobar que todo quedó consolidado.

---

## Fase 0 — Preparación

- [ ] Rama nueva: `chore/ui-audit-primevue`
- [ ] Anotar versión de PrimeVue (`npm ls primevue`) y el preset/tema en uso (Aura, Lara, custom)
- [ ] Anotar cómo se registran los componentes: import local por vista, o global en `main.ts`/plugin
- [ ] Crear carpeta `audit/` en la raíz del frontend

**⏸ Pausa:** confirma versión + tema antes de seguir (cambia qué props existen, p. ej. `text`/`outlined` vs `variant`).

---

## Fase 1 — Inventario automático (script)

Guarda como `scripts/audit-primevue.mjs` (Node 18+, sin dependencias):

```js
#!/usr/bin/env node
// Uso: node scripts/audit-primevue.mjs [srcDir] [Componentes,separados,por,coma]
// Ej:  node scripts/audit-primevue.mjs src Button,InputText,Select,Dialog
import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.argv[2] ?? 'src'
const COMPONENTS = (process.argv[3] ?? 'Button').split(',').map((s) => s.trim())

// Props que NO definen "estilo" (lógica/datos): se ignoran para agrupar variantes.
const IGNORE = [
  /^label$/, /^:label$/, /^@/, /^v-model/, /^v-if$/, /^v-else/, /^v-show$/, /^v-for$/,
  /^:key$/, /^key$/, /^ref$/, /^id$/, /^:id$/, /^name$/, /^:name$/, /^type$/, /^:type$/,
  /^:disabled$/, /^disabled$/, /^:loading$/, /^loading$/, /^v-tooltip/, /^aria-/, /^:aria-/,
  /^data-/, /^:data-/, /^:model-value$/, /^:modelValue$/, /^:options$/, /^:value$/, /^value$/,
  /^placeholder$/, /^:placeholder$/, /^:visible$/, /^v-model:visible$/, /^header$/, /^:header$/,
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (name === 'node_modules' || name.startsWith('.')) continue
    statSync(p).isDirectory() ? walk(p, out) : p.endsWith('.vue') && out.push(p)
  }
  return out
}

// Extrae el texto completo de una etiqueta de apertura respetando comillas.
function readOpenTag(src, start) {
  let i = start, q = null
  while (i < src.length) {
    const c = src[i]
    if (q) { if (c === q) q = null }
    else if (c === '"' || c === "'") q = c
    else if (c === '>') return src.slice(start, i + 1)
    i++
  }
  return null
}

function parseAttrs(tag) {
  const body = tag.replace(/^<[\w-]+/, '').replace(/\/?>$/, '')
  const re = /([:@#]?[\w.\-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g
  const attrs = []
  let m
  while ((m = re.exec(body))) attrs.push([m[1], m[2] ?? m[3] ?? true])
  return attrs
}

const kebab = (s) => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
const found = []

for (const file of walk(ROOT)) {
  const src = readFileSync(file, 'utf8')
  for (const comp of COMPONENTS) {
    const re = new RegExp(`<(${comp}|${kebab(comp)}|P${comp})(?=[\\s/>])`, 'g')
    let m
    while ((m = re.exec(src))) {
      const tag = readOpenTag(src, m.index)
      if (!tag) continue
      const line = src.slice(0, m.index).split('\n').length
      const attrs = parseAttrs(tag)
      const style = attrs.filter(([k]) => !IGNORE.some((r) => r.test(k)))
      const signature = style
        .map(([k, v]) => (v === true ? k : `${k}="${v}"`))
        .sort()
        .join(' ') || '(default)'
      found.push({ component: comp, file: relative('.', file), line, signature, attrs: Object.fromEntries(attrs) })
    }
  }
}

mkdirSync('audit', { recursive: true })
writeFileSync('audit/primevue-inventory.json', JSON.stringify(found, null, 2))

// Reporte markdown agrupado por componente -> firma de estilo
let md = '# Inventario PrimeVue\n\n'
md += `Generado: ${new Date().toISOString()}\n\nTotal de usos: **${found.length}**\n\n`
for (const comp of COMPONENTS) {
  const uses = found.filter((f) => f.component === comp)
  md += `## ${comp} (${uses.length} usos)\n\n`
  const groups = new Map()
  for (const u of uses) {
    if (!groups.has(u.signature)) groups.set(u.signature, [])
    groups.get(u.signature).push(u)
  }
  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
  md += `Variantes distintas: **${sorted.length}**\n\n`
  sorted.forEach(([sig, list], i) => {
    md += `### ${comp} · V${i + 1} — ${list.length} usos\n\n`
    md += '```\n' + sig + '\n```\n\n'
    const files = [...new Set(list.map((u) => `${u.file}:${u.line}`))]
    md += files.slice(0, 15).map((f) => `- ${f}`).join('\n')
    if (files.length > 15) md += `\n- … y ${files.length - 15} más`
    md += '\n\n'
  })
}
writeFileSync('audit/primevue-inventory.md', md)
console.log(`Listo: ${found.length} usos. Ver audit/primevue-inventory.md`)
```

Ejecutar:

```bash
node scripts/audit-primevue.mjs src Button
```

Empieza **solo con `Button`**, valida, y luego amplía (`InputText,Select,Dialog,DataTable,Tag,Card`).

**Limitaciones conocidas:** no detecta clases aplicadas desde `<style>` o desde wrappers propios; si tienes componentes envoltorio (`AppButton.vue`) agrégalos a la lista de componentes.

**⏸ Pausa:** revisa `audit/primevue-inventory.md`. ¿Las cifras te parecen razonables? ¿Se está colando ruido en las firmas? Si sí, ajusta `IGNORE` antes de seguir.

---

## Fase 2 — Categorización con la IA local

Dale **solo el inventario** (no el repo) y este prompt:

````markdown
Lee `audit/primevue-inventory.md` y `audit/primevue-inventory.json`.
NO modifiques ningún archivo en esta fase.

Contexto: proyecto Vue 3 + PrimeVue (versión: <X>, tema: <Y>). Quiero estandarizar el uso de componentes.

Tarea, solo para el componente `Button`:
1. Agrupa las variantes (V1, V2, …) según su **intención de UI**, usando estas categorías:
   - primaria (acción principal de la vista)
   - secundaria
   - peligro / destructiva
   - texto / link
   - solo ícono
   - cancelar / neutra
   - otra (explica)
2. Para cada variante indica: categoría sugerida, si usa solo props/severity nativos de PrimeVue o depende de `class`/`style` custom, y si parece un duplicado o error de otra variante (ej.: `severity="primary"` vs sin severity).
3. Detecta **inconsistencias**: misma intención escrita de formas distintas.
4. Entrega una tabla markdown: `Variante | Usos | Categoría | Nativo/Custom | Duplicado de | Comentario`.
5. Al final lista las **dudas** que necesitas que yo resuelva. No asumas: pregunta.

Formato: markdown estructurado, sin fragmentos de código todavía.
````

Guarda la salida en `audit/01-categorizacion-button.md`.

**⏸ Pausa:** valida la tabla. Corrige categorías mal asignadas a mano y responde las dudas. Solo entonces pasa a la Fase 3.

---

## Fase 3 — Definir el estándar (decisión tuya, con apoyo de la IA)

Decide primero **dónde vive el estándar**. Tres opciones, de más a menos recomendada para PrimeVue 4:

| Opción | Cuándo conviene |
|---|---|
| **A. Solo props nativos + tema/preset** (`severity`, `outlined`, `text`, `size`; colores vía design tokens del preset) | Tu caso ideal: cero CSS custom, máxima consistencia |
| **B. Wrapper propio** (`AppButton.vue` con props `intent="primary"\|"danger"\|…` que mapea a props de Prime) | Si quieres que la IA no pueda "inventar" variantes |
| **C. Clases utilitarias globales** (`.btn-primary`, …) | Solo si ya dependes mucho de CSS propio; es lo más frágil |

Prompt:

````markdown
Con base en `audit/01-categorizacion-button.md` (ya validado por mí), propón el estándar para Button en Briku.

Entrega un archivo `audit/02-estandar-button.md` con:
1. Tabla de **intenciones → cómo se escribe** (exactamente el markup permitido, un ejemplo por intención).
2. Qué se puede resolver con props nativos de PrimeVue y qué requeriría configurar el preset/tokens (dime cuáles tokens).
3. Reglas de uso: cuántos botones primarios por vista/diálogo, orden (cancelar a la izquierda, acción principal a la derecha), tamaños permitidos, íconos.
4. Lista de **cosas prohibidas** (ej.: `style=""` inline en Button, colores hardcodeados).
5. Compara opción A, B y C para mi caso y recomienda una, justificando.

No toques código todavía.
````

**⏸ Pausa:** elige tú la opción y aprueba las reglas. Este archivo se vuelve la **guía oficial**.

---

## Fase 4 — Regla permanente para la IA (evita que reaparezca el problema)

Una vez aprobado el estándar, agrégalo al archivo de contexto que lea tu IA local (`CLAUDE.md`, `AGENTS.md`, reglas del IDE, etc.):

````markdown
## UI — PrimeVue (obligatorio)

- Los botones se escriben SOLO según `audit/02-estandar-button.md`.
- Antes de crear un componente PrimeVue nuevo, busca una vista existente que use el mismo componente y copia su patrón.
- Prohibido: `style` inline y colores hardcodeados en componentes PrimeVue.
- Si una intención no está en el estándar, pregunta antes de inventar una variante.
````

---

## Fase 5 — Migración vista por vista

**No migres todo de golpe.** Una vista por vez, con validación tuya.

Prompt (repetir por vista):

````markdown
Migra SOLO el archivo `<ruta/Vista.vue>` al estándar de `audit/02-estandar-button.md`.

Reglas:
- Cambia únicamente lo relacionado con Button (props/clases). No toques lógica, handlers ni otros componentes.
- Entrégame el archivo **completo** listo para copiar y pegar.
- Antes del archivo, lista en una tabla cada cambio: `Línea | Antes | Después | Intención detectada`.
- Si alguna intención es ambigua, pregúntame en vez de decidir.
````

Checklist por vista:

- [ ] Diff revisado
- [ ] Vista probada visualmente (claro/oscuro si aplica, móvil por ser PWA)
- [ ] Commit pequeño: `refactor(ui): estandariza botones en <Vista>`

Orden sugerido: empieza por la vista **más simple**, valida el flujo, luego las vistas con más botones o los diálogos compartidos.

---

## Fase 6 — Verificación y cierre

1. Vuelve a correr `node scripts/audit-primevue.mjs src Button`
2. Meta: variantes distintas ≈ número de intenciones del estándar (ej.: 5–6), sin firmas raras
3. Repite el ciclo Fases 1–5 para el siguiente componente (`InputText`, `Select`, `Dialog`, `DataTable`, `Tag`)
4. Opcional: añade una regla ESLint (`vue/no-restricted-syntax` o `vue/no-restricted-static-attribute`) o corre el script en CI para fallar si aparece una firma fuera del estándar

---

## Orden de componentes sugerido

1. `Button` (mayor impacto)
2. `InputText` / `Select` / `DatePicker` (formularios)
3. `Dialog` + `ConfirmDialog` (patrones de modales)
4. `DataTable` (columnas, acciones por fila)
5. `Tag` / `Badge` / `Message` / `Toast` (estados y feedback)

## Resumen de pausas de validación

| # | Después de | Qué validas |
|---|---|---|
| 1 | Fase 0 | Versión de PrimeVue, tema, registro de componentes |
| 2 | Fase 1 | Que el inventario sea fiel y sin ruido |
| 3 | Fase 2 | Categorías y dudas resueltas |
| 4 | Fase 3 | Estándar y dónde vive (A/B/C) |
| 5 | Cada vista en Fase 5 | Diff + prueba visual |
