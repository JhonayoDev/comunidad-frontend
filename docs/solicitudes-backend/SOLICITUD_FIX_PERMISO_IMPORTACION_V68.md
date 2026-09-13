# Solicitud BE: Fix permiso IMPORTACION_DATOS para SUPER_ADMIN/SOPORTE (V68)

> Estado: PENDIENTE BACKEND. Frontend en `feature/planilla-csv-wizard` ya respeta 403 estricto (avisa y no bypass).

## Problema
`V67__importacion_planilla.sql:18-30` creó `IMPORTACION_DATOS` pero solo lo asignó a:

* `rol_permisos` → `ADMINISTRADOR`
* `cargo_permisos` → `ADMINISTRADOR`, `PRESIDENTE`, `SECRETARIO`

Omitió a `SUPER_ADMIN` y `SOPORTE`. En `PermisosCondominioService.java:49` los globales devuelven `usuario.getAuthorities()` directo, pero si el rol no tiene el permiso en `rol_permisos`, `hasPermission(null,'IMPORTACION_DATOS')` en `ImportacionController.java:42,56,70,84` da 403 incluso para SUPER_ADMIN. Repro: `GET /condominios/{id}/importaciones/plantilla` como SUPER_ADMIN → 403.

Además `RuntimePermissionService.java:33` cachea 45s, por lo que tras asignar el permiso hace falta re-login o esperar TTL.

## Solicitud
Crear `V68__fix_permiso_importacion_superadmin.sql`:

```sql
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.codigo='IMPORTACION_DATOS'
WHERE r.codigo IN ('SUPER_ADMIN','SOPORTE')
ON CONFLICT DO NOTHING;
-- Opcional: si SOPORTE no debe importar, solo SUPER_ADMIN.
```

Alternativa: `INSERT ... WHERE r.codigo='SUPER_ADMIN'` si SOPORTE no debe tenerlo (discutir).

## Criterio aceptación
* `GET /condominios/{cid}/importaciones/plantilla` como SUPER_ADMIN → 200 `text/csv`
* `POST /condominios/{cid}/importaciones/preview` multipart .csv/.xlsx como SUPER_ADMIN → 200 preview
* `GET /me/permisos?condominioId={cid}` como SUPER_ADMIN incluye `IMPORTACION_DATOS`

## Frontend
`SetupPlanillaView.vue` + `usePlanillaDatos.js` en `feature/planilla-csv-wizard` ya no hace fallback local: en 403 muestra `Message error/warn` con `No tienes permiso ... Contacta al SUPER_ADMIN` y deshabilita `input file`, `Descargar plantilla` y `Guardar planilla` (computed `tienePermisoImportacion = auth.permisos.includes('IMPORTACION_DATOS')`). No bypass de regla.

## Referencias
* `src/views/setup/SetupPlanillaView.vue:16` `tienePermisoImportacion`
* `src/composables/usePlanillaDatos.js:923,766` mensajes 403 estrictos
* `src/data/permisosCatalogo.js:53` catálogo
