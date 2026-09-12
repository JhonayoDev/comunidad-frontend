# Solicitud: Carga CSV/XLSX en wizard fase Planilla (SetupPlanillaView)

> MIGRADO A ISSUE — Project `Gestion Comunidad Briku` `PVT_kwHOBkcviM4Bb6yo` (`Users/JhonayoDev/projects/3`). Ver issue creado con `gh issue create --project "Gestion Comunidad Briku"`.

## Contexto
El wizard de configuración (`SetupPlanillaView.vue` paso 6) hoy solo permite carga manual fila-a-fila vía `PlanillaDatos.vue` + `usePlanillaDatos` (JSON `previewJson`/`ejecutar`). El backend YA soporta ambos formatos vía `ImportacionController.previewDesdeArchivo` (multipart `archivo` .csv/.xlsx, `PlanillaParser` CommonsCSV + POI, `MAX_FILAS=1000`, TTL 30m) y `previewDesdeJson`, pero el frontend no usa `importacionService.previewArchivo`.

## Objetivo
Habilitar carga masiva desde archivo **solo en configuración inicial** (antes de persistir vínculos), con preview staged estilo Microsoft/Meta (upload → preview validado → review inline → commit explícito). Soportar `.csv` y `.xlsx`, reemplazo al re-subir, y botón Descargar plantilla para limitar errores de formato.

## Requisitos
1. **Ambos formatos**: `POST /condominios/{cid}/importaciones/preview` multipart `archivo` (ya existe) para csv/xlsx. Validación server es fuente única.
2. **Reemplazo**: al cargar nuevo archivo estando con preview/borrador `esNuevo`, reemplazar `filas` (descartar sessionStorage previo).
3. **Bloqueo post-vínculos**: si `modoReedicion=true` (vínculos activos ya persistidos `reconstruirFilas`), ocultar dropzone y mostrar Message info + toggle "Cargar desde archivo" que re-habilita el dropzone solo si el usuario lo presiona (dropzone colapsable). No permitir carga global una vez configurado; solo edición puntual.
4. **UX preview** (modelo Microsoft/Meta):
   - Dropzone + `Descargar plantilla` (`GET /importaciones/plantilla`) siempre visible (fuera de reedición) para limitar errores.
   - Tras `previewArchivo`: resumen sticky `X OK · Y error · Z omitidas` + encabezados faltantes + tabla con chips estado por fila (OK rojo ERROR gris OMITIDA) — reusar `PlanillaDatos` + `previewData.filas`.
   - CTAs: `Descartar` + `Importar N filas` (`ejecutar` con `importacionId`). TTL 30m / 404 re-ejecutar => pedir recarga.
5. **Validaciones front tempranas**: `accept .csv,.xlsx`, size, MAX 1000, mostrar errores 400 con `Message`.

## No alcance
- Carga global post-setup con auditoría/integridad completa (quedará para análisis futuro).
- Parser xlsx cliente (se delega al backend).

## Criterios de aceptación
- [ ] Subir .csv y .xlsx en wizard inicial hace `previewArchivo` y muestra preview con errores por fila.
- [ ] Re-subir reemplaza filas.
- [ ] Con vínculos ya creados, dropzone oculto por defecto, botón "Cargar desde archivo" lo re-habilita, y `Descargar plantilla` sigue disponible.
- [ ] Build OK, tests OK.

## Referencias
- `src/composables/usePlanillaDatos.js:743` `preview()`/`importacionService.js:7` `previewArchivo`
- `src/views/setup/SetupPlanillaView.vue:1` `src/components/planilla/PlanillaDatos.vue:1`
- Backend `ImportacionController.java:41` `PlanillaParser.java:30` `ImportacionService.java:70`
