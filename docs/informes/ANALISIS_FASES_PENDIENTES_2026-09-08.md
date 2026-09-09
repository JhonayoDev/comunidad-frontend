# Análisis — Fases pendientes para retomar (épico post SSE-REMOVAL)

**Fecha:** 2026-09-08  
**Rama:** `chore/f1-higiene-sse-removal` — 4 commits (`6f1c809` F1 → `0fbbfef` F2 → `83cb148` F3 → `b95f35b` F4), `build OK`, `232/232 tests`  
**Último épico cerrado:** volver a acoplarnos al backend tras optimizar SSE (`F1` higiene `AGENTS.md`/`docs/completados`, `F2` hardening `useDashboardMetrics` 30s `CONTROL_ACCESO` + `useResidenteMetrics` 60s `ENCOMIENDAS` con `403 moduleNotSubscribed`, `F3` Email V71-V74 `SaasEmailConfigView`, `F4` toast anuncio + timeout 15s batch + polling SaaS 60s solo vista activa).  
**Archivo maestro:** `docs/solicitudes-backend/ACCIONES_PENDIENTES.md`

> Guardado para retomar el punto fácilmente. La épica SSE está cerrada; lo que sigue es deuda histórica no bloqueante del polling.

## Pendiente backend (requiere implementar en `comunidad` primero)

| # | Qué falta | Por qué importa | Esfuerzo |
|---|---|---|---|
| **P1** `AdminPlanesController.java:desactivar` `ACCIONES_PENDIENTES.md:14` | `PATCH /admin/planes/{id}/desactivar` no audita → falta `AuditoriaService.planDesactivado` + código `PLAN_DESACTIVAR` + `SaasAuditoriaView.vue` filtro | Trazabilidad SaaS | Backend 0.5d |
| **P3** `ACCIONES_PENDIENTES.md:42` | `PasswordResetService.configurarPassword` sin `@Transactional` → 500 + token quemado + `POST /personas/{id}/usuario/reconfigurar` | Soporte no puede reenviar email de setup | Backend 1d |
| **P4** `ACCIONES_PENDIENTES.md:50` | `GET /admin/permisos/catalogo` + `GET/PUT /admin/cargos/{cargo}/permisos` (`ROL_GESTIONAR`) — hoy solo `GET /me/permisos` | `PermisosMatrixView`/`CargosPermisosView` en `EnConstruccionView` | Backend 2d + Frontend 1d |
| **P7** `ACCIONES_PENDIENTES.md:68` | `SolicitudesController` `/solicitudes-registro` 404 | `SolicitudesView` en placeholder | Backend 1d |
| **P5/P6** `ACCIONES_PENDIENTES.md:57` | `CARGOS_PUEDE_CERRAR` + `notificaciones por contexto` (`audiencia` + `noLeidasPorAudiencia`) | Permisos encomiendas / badge por contexto | Análisis pendiente |

## Pendiente frontend (sin backend, implementable ya)

| # | Qué | Cómo | Decisión |
|---|---|---|---|
| **F1** `ACCIONES_PENDIENTES.md:252` `useSetupConfiguracion.js:10` | Wizard `accesos`/`areas-comunes`/`cargos`/`personal` (4 pasos en `EnConstruccionView`) — `SETUP_PASOS` 10 pasos, 6 visibles hoy | Requiere definir specs con backend (qué CRUD/tablas) | ¿Priorizar CRM wizard o dejar placeholder? |
| **F2** `ACCIONES_PENDIENTES.md:257` | Migrar `GestionesView`/`EncomiendasView` legado daisyUI → PrimeVue | Estética, no funcional | ¿Baja prioridad? |
| **P13** `ACCIONES_PENDIENTES.md:143` | Orden natural `UnidadRepository` `ORDER BY numero` léxico → workaround `ordenamientoNatural.js` ya en `unidadesService.js:10` | Backend `ORDER BY LENGTH(numero), numero` para móvil/API | ¿Pedir al backend o mantener workaround? |

## QA pendiente

- **Q2** `ACCIONES_PENDIENTES.md:242` PWA iOS pantalla blanca (instrumentado `frontendErrorReporter.js`) — reproducir en iPhone con build `b95f35b`
- **Q3** `ACCIONES_PENDIENTES.md:247` Pase E2E contra `https://apicomunidad.ideaspace.dpdns.org` (staging `home` vs `Render` failover)

## Recomendación

Próxima épica lógica: **P4 permisos por cargo/rol** (desbloquea 2 vistas y alinea `AGENTS.md:28` catálogo real `permisosCatalogo.js`) o **P3 reenvío email** (soporte).

## Decisiones F4 registradas (2026-09-08)

- **F4a P17:** `AnunciosView.vue:87` `mensajeExito` “Anuncio publicado. Se está notificando a la audiencia seleccionada.” 5s, sin exponer `async`/`anuncioAsyncExecutor`.
- **F4b F5:** `utils/errores.js:43` `esErrorTimeout`/`mensajeError` user-friendly; batch `POST .../batch` con `{ timeout: 15000 }` (global 10s), mensajes sin exponer Render/home-server failover (épica aparte).
- **F4c P18:** Decisión mantener polling 60s solo vista activa (`SuperAdminDashboardView` `onMounted`, reset al volver), no SSE SaaS.

## Cómo retomar

1. `git checkout chore/f1-higiene-sse-removal`
2. `cat docs/informes/ANALISIS_FASES_PENDIENTES_2026-09-08.md`
3. Elegir P4 o P3 para siguiente plan por partes.
