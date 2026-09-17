> MIGRADO A ISSUE — JhonayoDev/comunidad-frontend#27 — Project "Gestion Comunidad Briku"

## FE-2: Detalle por fila expandible

### Contexto
`PlanillaStagedPreview.vue:351-555` mostraba todo plano (Tag por fila + lista de
errores). Con 477 filas la UI se satura y cuesta distinguir qué corregir.

### Cambios (solo presentación)
- `src/components/planilla/PlanillaStagedPreview.vue`: filas expandibles en
  **ambas tablas** (fiel CSV por staging y backend `.xlsx` sin staging local).
- `src/components/planilla/PlanillaResultado.vue`: lista de errores post-ejecutar
  colapsable (`Ver N errores`).

### Detalles de implementación
- Sin `Accordion`/`DataTable` (las tablas son HTML plano): expand manual con
  `Set` de `numeroFila` + `alternarDetalle()` + fila `<tr><td colspan>` con:
  errores (ícono rojo), advertencias (amarillo + "Este campo fue ignorado —
  para corregirlo usa la edición manual después del import") y "Se vinculará"
  (vehículos/est/bodegas, con nota si es `RESIDENTE_ADICIONAL`).
- Fila compacta: número, nombre, email, unidad, tipo, estado (chip); botón ojo
  solo si hay errores/advertencias ("—" en caso contrario, sin expansión).
- Filas OK sin advertencias no expanden. `advertencias[]` null → array vacío.
- `PlanillaResultado`: el response solo trae agregado + `errores[]` (sin filas),
  por eso el expand aplica a la lista de errores, no a filas.
- Mobile: `PlanillaStagedPreview` no tiene cards (viven en `PlanillaDatos`,
  no tocado); las tablas usan `overflow-auto` y el detalle hereda el contenedor.

### Criterio de aceptación
- [ ] Expandir fila ERROR y OMITIDA en ambas tablas muestra errores/advertencias/recursos
- [ ] Filas OK sin advertencias no tienen botón de detalle
- [ ] Paginar con > 50 filas conserva el expandido (clave `numeroFila`, no índice)
- [ ] Toggle de errores en `PlanillaResultado` colapsa/expande
- [ ] Tests y build verdes

### Trazabilidad
- Parent spec: `docs/solicitudes-backend/SOLICITUD_HISTORIAL_IMPORTACION_RESULTADO.md` (FE-2)
- Previo: FE-1 · Siguiente: FE-3 (filtros por estado)
