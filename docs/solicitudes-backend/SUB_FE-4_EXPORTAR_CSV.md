> MIGRADO A ISSUE — JhonayoDev/comunidad-frontend#30 (sub-issue de #28) — Project "Gestion Comunidad Briku" — CERRADO (implementado)

## FE-4: Botón exportar CSV del resultado

### Entregables
1. Botón "Exportar resultado CSV" en `PlanillaResultado.vue` (solo con `importacionId`).
2. Descarga vía endpoint BE-3 con auth header (sin `window.open` directo).
3. Estado de carga + 404 → "El resultado ya no está disponible (expiró después de 7 días)".

### Implementación (ya en working tree)
- `importacionService.resultadoCsv()`: `api.get(.../resultado, {params:{formato:"csv"}, responseType:"blob"})` — Bearer por interceptor, patrón `plantilla`.
- `usePlanillaDatos.descargarResultado()`: guards `cid` + `resultado.importacionId`,
  descarga `resultado_import_{id}.csv`, `console.error` en catch.
- `PlanillaResultado.vue`: props `exportando`/`errorExportacion`, emit `exportar`;
  cableado solo en `SetupPlanillaView` (única vista que usa el componente).
- `importacionId` vive en `resultado.importacionId` (response del ejecutar);
  el flujo manual de reedición no lo tiene → botón oculto ahí.

### Criterio de aceptación
- [x] Botón visible solo con `importacionId`, loading y error 404 claro
- [ ] E2E real pendiente de BE-3 en staging (briku#78) — hoy el endpoint no existe
- [x] Tests y build verdes (250/250)
