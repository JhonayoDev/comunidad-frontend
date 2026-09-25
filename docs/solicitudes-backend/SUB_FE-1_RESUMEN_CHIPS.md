> MIGRADO A ISSUE — JhonayoDev/comunidad-frontend#26 — Project "Gestion Comunidad Briku"

## FE-1: Resumen con chips OMITIDA + ADVERTENCIA visibles

### Contexto
`ImportacionMasivaView.vue` mostraba conteos del preview (OK/error) sin chip
propio para OMITIDA (se calculaba `total - ok - error` solo como texto) y sin
nada para advertencias (BE-4, `advertencias[]` por fila, nullable hasta su despliegue).

### Cambios (solo presentación, sin tocar lógica ni llamadas al backend)
- `src/views/admin/ImportacionMasivaView.vue`: 4 chips en preview (`OK` success,
  `ERROR` danger, `OMITIDA` contrast/neutro, `ADVERTENCIA` warn) + mismo patrón
  de chips en el bloque post-ejecutar (con datos reales de `resultado`).
- `src/components/planilla/PlanillaDatos.vue`: el `Message` de preview agrega
  "· N con advertencia" solo si > 0 (vale para import y wizard).

### Detalles de implementación
- `ADVERTENCIA` = nº de filas con `(f.advertencias || []).length > 0` (cuenta filas,
  no advertencias individuales). `null` → 0, no rompe; sin BE-4 el chip no se renderiza.
- Post-ejecutar no hay chip ADVERTENCIA con dato real (el backend no lo devuelve);
  se dejó `v-if="resultado.filasAdvertencia"` a futuro (no renderiza hoy).

### Qué muestra cada resumen (sin duplicar)
| Resumen | Archivo | Fuente |
|---|---|---|
| Chips + texto preview | `ImportacionMasivaView` (solo import) | `previewData` |
| `Message` preview | `PlanillaDatos` (import + wizard) | `previewData` |
| Chips + texto resultado | `ImportacionMasivaView` | `resultado` |
| Texto compacto resultado | `PlanillaResultado` (wizard) | `resultado` |

### Criterio de aceptación
- [ ] Preview con filas OK/ERROR/OMITIDA muestra los 3 chips con conteos correctos
- [ ] Sin BE-4 desplegado no aparece ningún chip amarillo en ningún resumen
- [ ] Tests y build verdes

### Trazabilidad
- Parent spec: `docs/solicitudes-backend/SOLICITUD_HISTORIAL_IMPORTACION_RESULTADO.md` (FE-1)
- Backend: BE-4 (briku#79) provee `advertencias[]`
