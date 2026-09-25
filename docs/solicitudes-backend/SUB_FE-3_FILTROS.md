> MIGRADO A ISSUE — JhonayoDev/comunidad-frontend#29 (sub-issue de #28) — Project "Gestion Comunidad Briku" — CERRADO (implementado)

## FE-3: Filtros por estado (client-side)

### Entregables
1. Barra de filtro rápido sobre la tabla: Todos (N), Requieren atención (N),
   Solo errores (N), Con advertencias (N), Omitidas (N) — client-side, sin backend.
2. Default `atencion` si hay errores/advertencias, si no `todos`.
3. Mismo patrón en `PlanillaResultado.vue`.
4. El filtro persiste al expandir/colapsar filas (FE-2).

### Implementación (ya en working tree)
- `src/composables/useFiltroFilas.js` (nuevo): `filtro` + `conteos` + `filasFiltradas`
  + `setFiltro`; `null` = sin advertencias; default auto hasta fijado manual.
- `src/utils/planillaResumen.js` (nuevo): helpers compartidos staging/`FilaPreview`.
- `src/components/planilla/PlanillaFilaDetalle.vue` (nuevo): detalle presentacional.
- `PlanillaStagedPreview.vue`: filtra ambas tablas (fiel CSV y backend `.xlsx`),
  resetea página al filtrar, mensaje "Sin filas para este filtro".
- `PlanillaResultado.vue`: tabs + lista compacta filtrable de `resultadoFilas`.
- `usePlanillaDatos.js`: `resultadoFilas` preservadas al ejecutar (el ejecutar
  no devuelve detalle por fila); filtro independiente preview vs resultado.
- Se mantuvo paginación 50/pág (el filtro se aplica antes de paginar).
- Test nuevo `useFiltroFilas.test.js`.

### Criterio de aceptación
- [x] Tabs con conteos en preview (ambas tablas) y resultado
- [x] Default atencion/todos según datos; null no rompe
- [x] Tests y build verdes (250/250)
