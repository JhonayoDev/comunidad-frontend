> MIGRADO A ISSUE — JhonayoDev/briku#80 — Project "Gestion Comunidad Briku"

## BE-5: Incluir filas[] en GET resultado JSON (auditoría post-recarga)

### Contexto
El `GET /{id}/resultado` JSON devuelve solo el agregado (conteos + `errores[]`).
Las filas con `advertencias[]` viven en `importacion_filas.datos` (FilaImportacion
con advertencias desde BE-4) pero no se exponen por JSON — solo por CSV.
El frontend pierde badges/filtros/detalle al recargar (hoy solo memoria).

Depende de: BE-2, BE-3, BE-4 (todas cerradas)

### Cambios requeridos

**ImportacionResultadoResponse.java** — agregar campo nullable al final:
```java
List<FilaPreview> filas // reusa FilaPreview de ImportacionPreviewResponse; null en viejos
```
Dirección segura: JSON viejo sin `filas` → `null` en record nuevo (missing = null,
sin fallo). No requiere migración (va dentro de `resultado_json`).

**ImportacionService.java**
- `ejecutar()`: al construir el response, mapear las filas validadas OK/OMITIDA
  (mismo mapeo de `previewDesde():151-163`) → `filas` persiste en `resultado_json`.
- `resultado()`: sin cambio (deserializa el mismo objeto).
- `resultadoCsv()`: sin cambio (sigue desde `importacion_filas`).

### Criterio de aceptación
- [ ] `POST ejecutar` devuelve `filas[]` con `advertencias[]` por fila
- [ ] `GET resultado` tras recarga devuelve lo mismo (incluye `filas[]`)
- [ ] `resultado_json` viejos (sin `filas`) deserializan con `filas = null`
- [ ] Test: ejecutar → GET resultado incluye filas con advertencia

### Trazabilidad
- Épica: `docs/solicitudes-backend/SOLICITUD_HISTORIAL_IMPORTACION_RESULTADO.md`
  (auditoría 7 días) · Frontend FE-5 hidrata `resultadoFilas` desde aquí cuando exista
  (hoy: memoria + sessionStorage como respaldo)
- Previo: BE-2 (briku#77) · BE-3 (briku#78) · BE-4 (briku#79)
