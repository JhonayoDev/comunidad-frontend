# Estándar de botones Briku (v1)

Fuente ejecutable: `src/data/estandarBotones.js` (el `.vue` de ejemplo es `AppButton`).
Verificación visual: `/dev/ui-lab` (solo DEV). Decisiones que lo respaldan: `audit/03-decisiones-visuales.json`.
Estado de la revisión: 91 estándar, 25 a migrar, 0 descartadas, 0 sin decidir (116 firmas, 401 usos).

## 1. Intención → markup permitido

| Intención | Cuándo | Markup | Tamaño | Ícono |
| --- | --- | --- | --- | --- |
| Primaria | Acción principal de la vista o diálogo (una sola por contexto). | `<Button label="Guardar" />` | default | opcional (pi-plus en crear/agregar) |
| Secundaria | Acción alternativa no destructiva con peso visual medio. | `<Button label="Buscar" severity="secondary" />` | default | opcional |
| Cancelar / texto secundario | Salir sin guardar: siempre texto secundario. | `<Button label="Cancelar" severity="secondary" variant="text" />` | default | no |
| Contorno / editar | Editar con etiqueta en formularios y cards (en tablas va solo ícono). | `<Button label="Editar" severity="secondary" variant="outlined" size="small" />` | small | opcional |
| Solo ícono tabla | Acción neutra por fila sin etiqueta (requiere title o aria-label). | `<Button icon="pi pi-trash" severity="secondary" variant="text" size="small" rounded title="Quitar" />` | small | sí (es el contenido) |
| Peligro texto (tabla) | Quitar por fila solo si es destructiva. | `<Button icon="pi pi-trash" severity="danger" variant="text" size="small" rounded title="Quitar" />` | small | sí (es el contenido) |
| Peligro sólido | Acción destructiva e irreversible. | `<Button label="Eliminar" severity="danger" />` | default | opcional |
| Ingreso | Excepción semántica: registrar ingreso (verde). | `<Button label="Registrar ingreso" severity="success" />` | default | opcional |
| Salida | Excepción semántica: registrar salida (amarillo). | `<Button label="Registrar salida" severity="warn" />` | default | opcional |
| Info de dominio | Excepción semántica: información del dominio (azul). | `<Button label="Ver detalle" severity="info" />` | default | opcional |
| Texto / link | Navegación terciaria o ver-más. | `<Button label="Ver todas" variant="text" severity="secondary" size="small" />` | small | no |

## 2. Reglas de uso

- Una sola primaria por vista/diálogo; en pies de diálogo el orden es Cancelar (texto) + Primaria.
- `size="small"` solo en tablas/filas densas; fuera de tablas, tamaño default.
- Solo ícono exige `title` o `aria-label` (accesibilidad).
- La vista aporta contenido (`label`/`icon`/`title`); el estilo sale del catálogo + tema.
- Excepción puntual: prop de estilo explícita + comentario `<!-- desvía del estándar: motivo -->` (AppButton avisa en DEV).
- Excepciones semánticas (success/warn/info) solo para ingreso/salida/info de dominio; el resto usa primaria/secundaria/peligro.

## 3. Prohibiciones

- `style` inline en botones
- clases de color en botones (`text-*`, `bg-*`, `border-*`, `surface-*`)
- tokens `{surface.N}` directos en vistas
- props legadas `text`/`outlined`/`link` (usar `variant`)
- `severity="primary"` explícita (primary ya es el default)
- `title` genérico que no describa la acción

## 4. Migración (ver `audit/04-plan-migracion-botones.md`)

- 25 firmas / 119 usos en `04-plan`; regla: conservar label/icono/title de cada uso, solo cambia estilo; `flex-1`/`w-full` se conservan, clases de color se eliminan.
- Desviaciones con QA pendiente: ver issue de desviaciones visuales (dinámicos, no-botones, heredados, clases custom).

## 5. Mantenimiento

1. Re-correr `scripts/audit-primevue-v2.mjs` tras cambios grandes: toda firma fuera del catálogo es una desviación (o se migra, o se propone como intención nueva tras revisión visual en `/dev/ui-lab`).
2. `/dev/ui-lab` refleja `prime-theme.js` en vivo (lee `--p-*` reales): recargar basta tras tocar el tema.
3. Re-exportar decisiones del lab solo si se reabre una revisión por firmas nuevas → crece `03-decisiones-visuales.json` (acta).
