> MIGRADO A ISSUE — JhonayoDev/comunidad-frontend#28 — Project "Gestion Comunidad Briku"

# feat(import): auditoría, advertencias y UX de corrección — épica completa

## Problema
El flujo de importación masiva es técnicamente sólido pero tiene tres gaps
que afectan la auditabilidad y la experiencia del administrador:

1. El resultado del ejecutar no se persiste — si el usuario recarga, se pierde
2. Los ignorados silenciosos (persona reutilizada con datos distintos,
   patente duplicada, recursos de ADICIONAL ignorados) no se reportan
3. OMITIDA es invisible en el resumen y no hay forma de filtrar ni exportar

## Sub-issues

### Backend (`JhonayoDev/briku`)
- [ ] JhonayoDev/briku#76 BE-1 — Migración V76: estado + resultado_json en importaciones
- [ ] JhonayoDev/briku#77 BE-2 — Persistir resultado en ejecutar (COMPLETADA, no borrar)
- [ ] JhonayoDev/briku#78 BE-3 — Endpoint GET resultado + formato CSV
- [ ] JhonayoDev/briku#79 BE-4 — Advertencias en validar() por divergencia de persona

### Frontend (`JhonayoDev/comunidad-frontend`)
- [x] #26 FE-1 — Resumen con chips OMITIDA + ADVERTENCIA separados
- [x] #27 FE-2 — Detalle por fila expandible
- [x] #29 FE-3 — Filtros por estado (client-side)
- [x] #30 FE-4 — Botón exportar CSV del resultado
- [x] #31 FE-5 — Flujo de corrección post-import y reedición

## Orden de implementación

BE-1 → BE-2 → BE-3 → BE-4
↓
FE-1 → FE-2 → FE-3 → FE-4 → FE-5

BE-4 y FE-1 pueden ir en paralelo una vez que BE-2 esté desplegado.
FE-4 requiere BE-3 disponible en staging.

## Criterio de cierre
- Administrador puede ver resultado completo aunque recargue la página
- Filas con datos ignorados muestran advertencia explicativa
- Filtro rápido por estado sin llamadas extra al backend
- CSV descargable del resultado por 7 días post-import
- Flujo claro desde advertencia → corrección en modo reedición

## Archivos clave
### Backend
- `ImportacionService.java` — previewDesde(), ejecutar(), validar(), aplicarFila()
- `Importacion.java` / `ImportacionFila.java` — entidades
- `ImportacionController.java` — endpoints
- `V67__importacion_planilla.sql` — referencia para V76

### Frontend
- `ImportacionMasivaView.vue` — stepper principal
- `PlanillaStagedPreview.vue` — tabla de preview
- `PlanillaResultado.vue` — vista de resultado
- `usePlanillaDatos.js` — lógica de estado

> Nota: la numeración correcta es V76 (V68–V75 ya existen en el backend).
> Spec de referencia: `docs/solicitudes-backend/SOLICITUD_HISTORIAL_IMPORTACION_RESULTADO.md`.
