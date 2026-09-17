# Solicitud: Historial de resultado, advertencias y UX de corrección (importación planilla)

> Borrador para `gh issue create`. No crear sub-issues hasta migrar este doc a issue.
> Nota: el número de versión de migración lo define el equipo backend (aquí no se presume versión).

## Contexto

El flujo de importación masiva (`preview → ejecutar`) funciona a nivel de lógica de negocio, pero tiene tres gaps que afectan auditabilidad y UX del ADMINISTRADOR:

1. El resultado del `ejecutar` no se persiste — si el usuario recarga, se pierde (`ImportacionService.java:217` borra el borrador tras ejecutar).
2. Ignorados silenciosos no reportados: persona reutilizada con datos distintos (`aplicarFila():266-279` rama `personasReutilizadas++` sin comparar ni loggear), patente duplicada intra-archivo, recursos de `RESIDENTE_ADICIONAL` ignorados (`vinculaRecursos=false`, `:321,352,362`).
3. `OMITIDA` es invisible en el resumen (header `preview` solo cuenta `OK/ERROR`, `:118-126`; `OMITIDA = total - ok - error` calculada en cliente) y no hay filtro/exportación de resultados.

## Alcance

- Backend: BE-1 → BE-2 → BE-3 → BE-4 (BE-4 en paralelo con FE-1).
- Frontend: FE-1 → FE-2 → FE-3 → FE-4 → FE-5.
- Sin cambios al motor de importación existente (mismo `validar()`/`aplicarFila()`, solo se agrega observabilidad + persistencia del resultado).

## ⚠️ Numeración de migraciones (revisado 2026-09-16)

**No usar V68.** El backend ya va en **V75** (`V68__entregas_enviando_claim` … `V75__plantillas_sistema_onboarding_y_reset`). La migración de este issue debe ser la siguiente libre (**V76** o la que indique el equipo backend). Los borradores viejos `SOLICITUD_FIX_PERMISO_IMPORTACION_V68.md` / `SOLICITUD_PREVIEW_FIEL_IMPORTACION_V69.md` usaban números que hoy colisionan con migraciones reales — no presumir versión en títulos futuros.

---

## BACKEND

### BE-1 — Migración: `estado` + `resultado_json` en `importaciones`

**Objetivo:** el `Importacion` deja de ser borrador efímero y pasa a tener ciclo de vida consultable.

**Cambios:**
```sql
ALTER TABLE importaciones ADD COLUMN estado VARCHAR(12) NOT NULL DEFAULT 'PENDIENTE';
ALTER TABLE importaciones ADD COLUMN resultado_json TEXT;
-- backfill: filas vivas = PENDIENTE (las COMPLETADA se borraban, no hay que migrar)
```

**Archivos:** `V7X__importacion_estado_resultado.sql` (nuevo), `Importacion.java` (+2 campos).
**Criterio:** `SELECT estado FROM importaciones` responde; filas existentes quedan `PENDIENTE`.

### BE-2 — Persistir resultado en `ejecutar` (COMPLETADA, no borrar)

**Objetivo:** `ejecutar()` conserva borrador + filas y guarda el agregado, en vez de `importacionRepository.delete()`.

**Cambios (`ImportacionService.java`):**
- `previewDesde():132-138` setea `estado=PENDIENTE`.
- `ejecutar():217` → `importacion.setEstado("COMPLETADA"); importacion.setResultadoJson(serialize(response)); save()` (no `delete`).
- Limpieza lazy `:129` (`deleteByCondominioIdAndExpiraEnBefore`) se acota a `WHERE estado='PENDIENTE'` para no borrar historial.
- Segunda ejecución del mismo `id`: antes `404`, ahora `409` (ya COMPLETADA) o `GET` del resultado — definir en el issue.

**Criterio:** ejecutar dos veces el mismo `importacionId` no pierde datos; `GET` (BE-3) devuelve lo mismo que devolvió el `POST`.

### BE-3 — Endpoint GET resultado + formato CSV

**Objetivo:** consultar importaciones pasadas y exportarlas.

**Propuesta de contrato (a confirmar por backend):**
```
GET /condominios/{cid}/importaciones/{importacionId}
→ { importacionId, estado, totalFilas, filasOk, filasOmitidas, filasError,
    contadores:{...}, errores:[{numeroFila,mensaje}], createdAt }

GET /condominios/{cid}/importaciones?size=&page=
→ página de cabeceras (para futuro historial por condominio)

GET /condominios/{cid}/importaciones/{importacionId}/csv
→ text/csv con columnas: numero_fila,estado,unidad,nombre,email,tipo_vinculo,detalle
```

Permiso: `IMPORTACION_DATOS` (mismo que preview/ejecutar/plantilla). Índice sugerido: `(condominio_id, estado, created_at)`.

**Archivos:** `ImportacionController.java` (+2-3 métodos), `ImportacionRepository.java` (queries).
**Criterio:** recargar post-ejecutar reconstruye la vista desde `GET`; CSV abre en Excel con `;`.

### BE-4 — Advertencias en `validar()` por divergencia de persona

**Objetivo:** lo hoy silencioso pasa a `estado=OK + warnings[]` visibles.

**Casos (todos hoy se descartan sin comparar):**
1. Persona reutilizada (`ctx.personas.get(email) != null`, `:267-279` — entidad completa `nombre/rut/telefono` disponible vía `findByEmailIn`) con `nombre/rut/telefono` distintos al archivo.
2. Patente duplicada intra-archivo (hoy `ERROR`; evaluar degradar a advertencia si la fila es por lo demás válida — a definir).
3. Fila `RESIDENTE_ADICIONAL` con vehículos/est/bodegas (hoy ignorados por `vinculaRecursos=false`).

**Contrato propuesto (no breaking):** `FilaPreview` suma `warnings: string[]` (nullable; frontend viejo lo ignora). Resumen suma `filasAdvertencia` (derivado, no rompe `filasOk/filasError`). Ver precaución de serialización: `FilaImportacion` se persiste como JSON en `importacion_filas.datos` con `JsonMapper` defaults — campo nuevo debe ser nullable + guard `null` (precedente BE-74 en `estacionamientosDe/vehiculosDe/bodegasDe`), o `@JsonIgnoreProperties(ignoreUnknown=true)`.

**Criterio:** preview con `juan@gmail.com` (BD: "Juan Pérez" / archivo: "Juan P.") → fila `OK` con `warnings=["El nombre difiere del registrado: ..."]`.

---

## FRONTEND

### FE-1 — Resumen con chips OMITIDA + ADVERTENCIA separados

Hoy: `PlanillaStagedPreview.vue:398-403` (tags OK/error/omitidas calculadas en cliente) y `PlanillaDatos.vue:324-343` (Message preview). Agregar chip `ADVERTENCIA` (severidad `warn`, distinto de `OMITIDA`) alimentado de `warnings[]` (BE-4) con fallback `0` si el backend aún no lo envía.

### FE-2 — Detalle por fila expandible

`previewData.filas[]` ya trae `errores[]` por fila; agregar `warnings[]` y fila expandible (solo la fila abierta renderiza detalle, paginación 50/pág existente) para no saturar con 500+ filas. Aplica a `PlanillaStagedPreview.vue` (tabla fiel) y al fallback `.xlsx`.

### FE-3 — Filtros por estado en preview y resultado

`Select` múltiple o chips toggle: `TODAS / OK / ERROR / OMITIDA / ADVERTENCIA`. Filtrado en cliente sobre `previewData.filas` y sobre `resultado.errores` (mapear `ErrorFila.numeroFila` → fila). Sin nuevo endpoint.

### FE-4 — Botón exportar CSV del resultado

Descarga cliente (construye CSV desde `previewData.filas` + `resultado`) desde el día 1; migrar a `GET .../csv` (BE-3) cuando exista, con degradación al CSV local. Columnas: `numero_fila,estado,unidad,nombre,email,tipo_vinculo,detalle`.

### FE-5 — Reedición post-import desde el resultado

Al completar `ejecutar`, `usePlanillaDatos.ejecutar()` ya limpia staging y llama `reconstruirFilas()` → `modoReedicion`. Conectar el CTA "Revisar integrantes" del `PlanillaResultado.vue` a ese estado y, cuando exista BE-3, sembrar reedición desde `GET resultado` tras recarga.

**Archivos frontend:** `PlanillaStagedPreview.vue`, `PlanillaResultado.vue`, `ImportacionMasivaView.vue`, `SetupPlanillaView.vue`, `usePlanillaDatos.js`.

---

## Orden de implementación

```
BE-1 → BE-2 → BE-3 ─┬─→ BE-4 ─→ FE-1 → FE-2 → FE-3 → FE-4 → FE-5
                    └─→ FE-1 (puede avanzar con warnings=0 hasta BE-4)
```

Cada sub-issue cierra con build + tests verdes del repo que toca.

## Referencias

- Backend: `ImportacionService.java` (`previewDesde:107`, `ejecutar:172`, `validar:467`, `aplicarFila:234`, `construirContexto:581`), `Importacion.java`, `ImportacionFila.java`, `ImportacionController.java`, `V67__importacion_planilla.sql`, `ImportacionPreviewResponse.java`, `FilaImportacion.java`, `ImportacionResultadoResponse.java`.
- Frontend: `src/composables/usePlanillaDatos.js`, `src/components/planilla/PlanillaStagedPreview.vue`, `src/components/planilla/PlanillaResultado.vue`, `src/components/planilla/PlanillaDatos.vue`, `src/views/admin/ImportacionMasivaView.vue`, `src/views/setup/SetupPlanillaView.vue`.
