> MIGRADO A ISSUE — JhonayoDev/briku#78 — Project "Gestion Comunidad Briku"

## BE-3: Endpoint GET resultado + formato CSV

Depende de: BE-1, BE-2

### Endpoints nuevos

**ImportacionController.java**
```java
// JSON
GET /condominios/{cid}/importaciones/{importacionId}/resultado
→ 200 ImportacionResultadoResponse (deserializado de resultado_json)
→ 404 si no existe o no pertenece al condominio
→ 403 si no tiene IMPORTACION_DATOS

// CSV
GET /condominios/{cid}/importaciones/{importacionId}/resultado?formato=csv
→ 200 text/csv; charset=UTF-8
   Content-Disposition: attachment; filename="resultado_import_{id}.csv"
```

> Nota de revisión: el CSV con **todas las filas** se construye desde
> `importacion_filas` (preservadas gracias a BE-2: `numeroFila, estado,
> datos, errores`), no desde `resultado_json` (que es el agregado +
> `errores[]`). La columna `advertencias` requiere BE-4; si BE-4 aún no
> está, esa columna sale vacía. Sin conflicto de rutas: hoy no existe
> ningún `GET /{importacionId}/*` (solo `POST preview`, `POST {id}/ejecutar`,
> `GET /plantilla`). Reusar el scope `findByIdAndCondominioId` para el 404
> cross-condominio. Permiso `IMPORTACION_DATOS` en ambos.

**Columnas del CSV**

fila,nombre,email,unidad,tipo_vinculo,estado,advertencias,errores

- `advertencias` y `errores` como texto separado por `|`
- Encabezado en español

### Criterio de aceptación
- [ ] GET JSON devuelve el mismo objeto que devolvió el POST ejecutar
- [ ] GET CSV descargable con todas las filas
- [ ] 404 para importacionId inexistente o de otro condominio
- [ ] Test de integración cubre ambos formatos

### Trazabilidad
- Parent spec: `docs/solicitudes-backend/SOLICITUD_HISTORIAL_IMPORTACION_RESULTADO.md` (BE-3)
- Previo: BE-1 (briku#76) · BE-2 (briku#77)
