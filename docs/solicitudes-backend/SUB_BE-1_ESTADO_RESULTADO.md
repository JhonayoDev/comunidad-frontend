> MIGRADO A ISSUE — JhonayoDev/briku#76 — Project "Gestion Comunidad Briku"

## BE-1: Migración V76 — estado + resultado_json en importaciones

### Contexto
`Importacion.java` hoy solo tiene `expiraEn` para inferir estado.
Necesitamos persistir el resultado del ejecutar y distinguir
PENDIENTE vs COMPLETADA para que la purga lazy no borre historial.

> Nota de numeración: se usa **V76** porque el backend ya va en V75
> (`V68__entregas_enviando_claim` … `V75__plantillas_sistema_onboarding_y_reset`).
> Si al tomar el issue ya existe V76, renombrar a la siguiente libre.

### Cambios requeridos

**V76__importacion_estado_resultado.sql**
```sql
ALTER TABLE importaciones
  ADD COLUMN estado VARCHAR(12) NOT NULL DEFAULT 'PENDIENTE';

ALTER TABLE importaciones
  ADD COLUMN resultado_json TEXT;

-- Opcional futuro (no en esta migración):
-- CREATE INDEX idx_importaciones_cond_estado
--   ON importaciones(condominio_id, estado, created_at);
```

**Importacion.java**
- Agregar campo `String estado` (default `"PENDIENTE"`)
- Agregar campo `String resultadoJson`
- No usar `@Enumerated` — VARCHAR + validación en servicio

### Criterio de aceptación
- [ ] Migración aplica sin error sobre schema actual (V75 existente)
- [ ] `ImportacionIntegrationTest` sigue verde
- [ ] Filas vivas después de migración tienen `estado = 'PENDIENTE'`

### Trazabilidad
- Parent spec: `docs/solicitudes-backend/SOLICITUD_HISTORIAL_IMPORTACION_RESULTADO.md` (BE-1)
- Siguiente: BE-2 (persistir resultado en ejecutar)
