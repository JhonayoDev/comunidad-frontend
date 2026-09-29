# Button — validación de la Fase 2 y decisiones para la Fase 3

## 1. Validación del resultado de la IA

Verifiqué las cifras clave del informe contra `primevue-inventory.json`:

| Dato del informe | Real | Estado |
|---|---|---|
| 401 usos de Button | 401 | ✅ |
| 152 firmas distintas | 152 | ✅ |
| 44 usos con prop `text` heredada | 44 | ✅ |
| 193 usos con `variant` | 193 | ✅ |
| 0 estilos inline | 0 | ✅ |
| 3 con `severity="primary"` explícita | 3 | ✅ |
| Familia más grande: V1 (secondary + text) = 39 | 39 | ✅ |

**Los números son confiables.** La tabla en sí es una interpretación de la IA (categoría por etiqueta + ícono), así que es la parte a revisar tú.

### Hallazgo: las 152 variantes están infladas

La firma incluía `title` y los valores de `class`, y eso crea variantes falsas (p. ej. V5, V25, V34, V35, V80, V81 son la misma papelera con distinto título). Recalculando sobre el mismo JSON:

| Criterio de firma | Variantes |
|---|---|
| Original (con title y class) | 152 |
| Ignorando `title` | 140 |
| Ignorando `title` y `class` | 119 |
| Además normalizando `text` heredado → `variant="text"` | **117** |

Y ~50 de esas son usos únicos (singletons) que caen casi todos en los 3 grupos ya identificados: duplicados por tamaño, por severidad, o "no-botones".

**Recomendación:** corre `audit-primevue-v2.mjs` (adjunto) antes de decidir el estándar. Agrupa por estilo real y lista las clases aparte, así la Fase 3 trabaja con ~117 grupos limpios, no 152.

### Puntos a revisar a mano en la tabla (posibles errores de la IA)

- **V132 "Anterior"** clasificado como *primaria*, pero V31 y V122 (misma etiqueta) son texto/cancelar.
- **V33 "Editar"** clasificado *primaria* por ser sólido; por intención es *secundaria/edición*.
- **V95 "Crear usuario"** (info + texto) clasificado *solo ícono*; si tiene etiqueta no lo es.
- **V4** figura como "Nativo" pero usa la prop heredada `text` (44 usos así en total).
- **V106 (check rojo "Cerrar caso")**: el ícono es check pero la acción es cerrar caso; revisar si debe ser peligro o primaria.

---

## 2. Las 10 dudas — propuesta de respuesta

Son propuestas mías; **las decisiones son tuyas**. Corrige la columna "Tu decisión" y pásale este archivo a la IA en la Fase 3.

| # | Duda | Propuesta | Tu decisión |
|---|---|---|---|
| 1 | ¿Primaria siempre sólida por defecto? ¿Ícono obligatorio? | Sí, sólida sin `severity` (implícita). Ícono **opcional**, sin regla por etiqueta salvo `pi-plus` en acciones de crear. | ☐ |
| 2 | ¿Cancelar siempre texto secundario? | Sí: `severity="secondary" variant="text"` (V1). Migrar V8, V16, V24, V64, V150. | ☐ |
| 3 | ¿Editar cómo? ¿Editar amarillo (V108)? | En tabla (solo ícono): `variant="text"` pequeño. Con etiqueta en formularios: `secondary` + `outlined` pequeño. V108 probablemente error → pasar a estándar. | ☐ |
| 4 | Papelera de "Limpiar" ¿gris o rojo? | **Gris** (`secondary` + `text`). Rojo (`danger`) solo para acciones destructivas/irreversibles. | ☐ |
| 5 | ¿Unificar familia papelera con título por parámetro? | Sí. El `title` no es parte de la variante. | ☐ |
| 6 | ¿Buscar con lupa: un solo estilo? | Sí: V12 (`secondary` pequeño). Migrar V39, V103, V104, V107. | ☐ |
| 7 | ¿Migrar `text`/`link` heredados a `variant`? | Sí, es un cambio mecánico y de bajo riesgo. Verifica en la doc de tu versión (4.5.5) que están marcados como deprecated. | ☐ |
| 8 | ¿Verde/amarillo/info por dominio son intencionales? | Documentarlos como **excepciones semánticas** explícitas: ingreso = `success`, salida = `warn`, info = `info`. Fuera de la escala primaria/secundaria/peligro. | ☐ |
| 9 | ¿Acordeones/pasos/modos con clases siguen siendo `Button`? | No. Son otra cosa: cabeceras colapsables → `Accordion`/`Panel`; wizard → `Stepper`; filtros segmentados y selector de modo → `SelectButton`. **Dejarlo para una fase aparte** (Fase 7): es rediseño de componente, no estandarización de estilo. | ☐ |
| 10 | ¿Ojo "Ver errores" rojo (V77)? | Neutro (`secondary` + `text`), como el resto de ojos. Rojo sugiere destruir, no ver. | ☐ |

---

## 3. Orden de trabajo sugerido

1. Correr `audit-primevue-v2.mjs` y revisar el inventario limpio. ⏸
2. Responder la tabla de decisiones (sección 2). ⏸
3. Prompt de Fase 3 (abajo) para redactar `audit/02-estandar-button.md`. ⏸
4. Recién ahí, migración vista por vista.

---

## 4. Prompt de la Fase 3 (copiar y pegar)

Adjunta a la IA: `audit/primevue-inventory-v2.md`, `audit/01-categorizacion-button.md` y este archivo con la columna "Tu decisión" completada.

````markdown
NO modifiques ningún archivo del proyecto en esta fase. Solo genera `audit/02-estandar-button.md`.

Insumos:
- `audit/primevue-inventory-v2.md` (inventario limpio, firmas sin title/class)
- `audit/01-categorizacion-button.md` (tu categorización anterior)
- `FASE2_VALIDACION_Y_DECISIONES_BUTTON.md`, columna "Tu decisión": mis respuestas a las 10 dudas. Son vinculantes; si alguna es ambigua, pregúntame antes de asumir.

Contexto: PrimeVue 4.5.5, preset Aura personalizado en `src/theme/prime-theme.js`.

Entrega `audit/02-estandar-button.md` con:

1. **Tabla de intenciones → markup exacto permitido**, una fila por intención (primaria, secundaria, peligro, cancelar, texto/link, solo ícono, y las excepciones semánticas ingreso/salida/info). Cada fila: markup de ejemplo, tamaños permitidos, ¿ícono permitido/obligatorio?
2. **Qué se resuelve con props nativos y qué requiere tokens del preset.** Si algo hoy depende de `class` custom, dime si se puede llevar al preset (indica el token) o si debe quedar como clase.
3. **Reglas de uso**: máximo de primarias por vista/diálogo, orden de botones en diálogos, cuándo usar `size="small"`, botones solo ícono (`aria-label`/`title` obligatorio).
4. **Prohibiciones**: `style` inline, colores hardcodeados, props heredadas `text`/`outlined`/`link`, `severity="primary"` explícita.
5. **Tabla de migración**: para cada variante V1..Vn del inventario v2, `Variante | Usos | Intención | Se migra a | Cambio necesario`. Marca "sin cambio" donde ya cumple.
6. **Excluidos**: lista los usos que NO se migran en esta fase (no-botones, genéricos por datos) con el motivo.
7. **Comparación de las opciones A (props+preset), B (wrapper `AppButton`), C (clases globales)** para mi caso y una recomendación.
8. **Dudas restantes**, si las hay.

Formato: markdown estructurado, sin código de migración todavía.
````

**⏸ Pausa final:** revisa `02-estandar-button.md` y apruébalo antes de migrar cualquier vista.
