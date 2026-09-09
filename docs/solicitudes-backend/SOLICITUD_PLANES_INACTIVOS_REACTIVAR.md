# Solicitud Backend — Planes inactivos visibles + reactivación

## Estado: IMPLEMENTADA (backend)

- `GET /api/v1/admin/planes?incluirInactivos=true` — query param (default `false`). `AdminPlanesController.java:31`, `AdminPlanService.java:21`, `PlanRepository.java:13`.
- `PATCH /api/v1/admin/planes/{id}/reactivar` — permiso `PLAN_GESTIONAR`, setea `activo=true` y registra auditoría `PLAN_REACTIVAR`. `AdminPlanesController.java:78`, `AdminPlanService.java:69`, `AuditoriaService.java:189`.
- Verificación: `AdminPlanesIntegrationTest` (5 tests) + `AuditoriaIntegrationTest` pasan.

## Frontend (conectado)

- `adminService.listarPlanes(incluirInactivos = false)` — la vista de planes llama con `true`.
- `adminService.reactivarPlan(id)` → `PATCH /admin/planes/{id}/reactivar`.
- `SaasPlanesView.vue`: `cargar()` usa `listarPlanes(true)`; botón "Reactivar" (con confirmación) en cards de planes inactivos; desactivar/reactivar actualizan el estado local sin refetch.

## Problema original

`GET /api/v1/admin/planes` usa `PlanRepository.findByActivoTrueOrderByPrecioMensualAsc()`, por lo que **solo devuelve planes activos**. Al desactivar un plan (`PATCH /admin/planes/{id}/desactivar`), este desaparece de la vista de planes del SUPER_ADMIN y **no existe forma de reactivarlo** (no hay endpoint `reactivar`).

El frontend ya está preparado para renderizar planes inactivos (Tag "Inactivo", botón "Desactivar" oculto, card atenuada), pero el backend nunca los entrega.

## Cambios solicitados (implementados)

1. **Listar también los inactivos**: `GET /api/v1/admin/planes` acepta `?incluirInactivos=true` (default `false`). El frontend llama con `incluirInactivos=true` en la vista de planes del SUPER_ADMIN.

2. **Endpoint de reactivación**: `PATCH /api/v1/admin/planes/{id}/reactivar` (permiso `PLAN_GESTIONAR`) setea `activo = true`. El frontend muestra un botón "Reactivar" en las cards de planes inactivos.

## Nota frontend (implementado)

- `SaasPlanesView.vue` mantiene el plan desactivado en la lista local durante la sesión (marcado `activo: false`, card con `opacity-60` y Tag "Inactivo") en vez de refetchear, que lo hacía desaparecer.
- Con el punto 1 implementado, `cargar()` usa `listarPlanes(true)` y los inactivos persisten tras recargar.
- El botón "Reactivar" quedó conectado al endpoint del punto 2.