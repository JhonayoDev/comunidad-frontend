# Acciones pendientes — Backend / Frontend

Archivo maestro consolidado de acciones pendientes. Es la fuente única de verdad del estado
de cada ítem; los archivos de solicitud individuales pueden quedar desactualizados (el
estado real vive acá).

Actualizado contra el backend `develop` (head `0cea179`, merge `feat/espacios-comunes`,
V57-V61).

## Pendientes de implementación (backend)

### [ ] P1. Auditoría de "desactivar plan" (NUEVO)
- **Solicitud:** ninguna (identificado durante auditoría de vistas superadmin, 2026-08-15)
- **Dónde:** `AdminPlanesController.desactivar` (`PATCH /admin/planes/{id}/desactivar`)
- **Qué falta:** el método no registra auditoría. Falta `auditoriaService.planDesactivado(...)`
  en `AuditoriaService` (no existe el método ni el código `PLAN_DESACTIVAR`) y la llamada en el
  controller (que además no recibe `@AuthenticationPrincipal` ni `HttpServletRequest`).
- **Impacto frontend:** agregar la acción `PLAN_DESACTIVAR` al filtro de `SaasAuditoriaView.vue`
  (hoy solo existe `PLAN_REACTIVAR` en el backend).

### [ ] P2. Importación masiva Excel/CSV (contrato v2.0)
- **Solicitud:** `SOLICITUD_IMPORTACION_MASIVA_EXCEL_CSV.md` (formato persona-por-fila)
- **Qué falta:** endpoints `POST /importaciones/preview` y `POST /importaciones/{id}/ejecutar`
  (permiso `IMPORTACION_DATOS`). El frontend (`ImportacionMasivaView.vue` y `SetupPlanillaView.vue`)
  ya valida localmente y el botón "Importar datos"/"Guardar planilla" es simulado
  (`usePlanillaDatos.enviar`).

### [ ] P3. Reenvío de email de configuración de contraseña
- **Solicitud:** `SOLICITUD_REENVIO_EMAIL_CONFIGURAR_CONTRASENA.md`
- **Qué falta:** (1) fix de `PasswordResetService.configurarPassword` sin `@Transactional`
  → **500 LazyInitializationException** en `setup-password` (el token válido se marca usado
  antes del 500, por eso queda quemado); (2) endpoint
  `POST /condominios/{cid}/personas/{personaId}/usuario/reconfigurar` (permiso `USUARIO_GESTIONAR`)
  que genera un token `SETUP_PASSWORD` nuevo y reenvía el email.

### [ ] P4. Administración de permisos por cargo/rol
- **Solicitud:** `SOLICITUD_ADMIN_PERMISOS_POR_CARGO.md`
- **Qué falta:** `GET /admin/permisos/catalogo`, `GET/PUT /admin/cargos/{cargo}/permisos`,
  `GET/PUT /admin/roles/{rol}/permisos`, permiso `ROL_GESTIONAR`. Hoy solo existe lectura
  efectiva vía `GET /me/permisos`. `PermisosMatrixView`/`CargosPermisosView` están en
  `EnConstruccionView` hasta que exista.

### [ ] P5. Cerrar encomiendas con cargo ADMINISTRADOR
- **Solicitud:** `SOLICITUD_CARGO_ADMINISTRADOR_CIERRE_ENCOMIENDAS.md` (pendiente de análisis)
- **Qué falta:** definir si `CARGOS_PUEDE_CERRAR` debe incluir el cargo ADMINISTRADOR
  (residente con ese cargo hoy no puede cerrar encomiendas).

### [ ] P6. Notificaciones por contexto (conteos por contexto)
- **Solicitud:** `SOLICITUD_NOTIFICACIONES_POR_CONTEXTO.md` (pendiente de análisis)
- **Qué falta:** columna `audiencia` en notificaciones + `noLeidasPorAudiencia` en snapshot
  SSE + `GET /me/cargos` + push con prefijo. Fase 1 (cargo ADMINISTRADOR) ya está hecha;
  los conteos por contexto llegan en Fase 2.

### [ ] P7. Controller de Solicitudes
- **Qué falta:** `SolicitudesController` para `/condominios/{cid}/solicitudes-registro`.
  Hoy `SolicitudesView.vue` renderiza `EnConstruccionView` (el endpoint devuelve 404).

### [ ] P8. Consulta rápida de vehículos (mejora)
- **Qué falta:** endpoint `GET /condominios/{cid}/vehiculos/consulta-rapida?patente=X`
  (hoy la búsqueda por patente usa `/busqueda/por-patente`).

### [ ] P10. Batch de estacionamientos y bodegas (para wizard paso "Estacionamientos y bodegas")
- **Solicitud:** `SOLICITUD_BATCH_ESTACIONAMIENTOS_BODEGAS.md` (2026-08-15)
- **Estado backend: ✅ implementado** en `feature/batch-estacionamientos-bodegas` — `POST
  /condominios/{id}/estacionamientos/batch` y `POST /condominios/{id}/bodegas/batch`
  (permiso `UNIDAD_CREAR`, 201 con `{creados:[{id,nombre,piso,sectorId,sectorNombre,activo}]}`,
  409 atómico con `ErrorResponse.fields` fila a fila, dedupe nombre lote+BD, `sectorId` por
  `findByIdAndCondominioId` y envelope acumulado). **Fix G2** aplicado: crear/actualizar
  unitarios de estacionamiento/bodega resuelven el sector con `findByIdAndCondominioId`
  (sector de otro condominio → 409). Tests: 12+12 nuevos, regresión verde (Estacionamiento 14,
  Bodega 14, UnidadesBatch 14, SectoresBatch 6, CapacidadUnidades 9).
- **Estado frontend: ✅ implementado** — dos pasos **separados** `estacionamientos` y `bodegas`
  en `SETUP_PASOS` (rutas `setup/estacionamientos` y `setup/bodegas`, cada uno **condicional**:
  oculto si no hay capacidad declarada ni creados; `SetupLayout` usa `:key="route.name"` para
  remontar `SetupEntidadesView` al navegar entre ambos); `useSetupEntidades.js` +
  `SetupEntidadesView.vue` (generalización de las 5 fases de unidades sin tipo; **estacionamientos
  con MÚLTIPLES GRUPOS en una sola ventana** — propietarios `E-` + visitas `EV-` fusionados en un
  único batch, columna "Grupo" en revisión; bodegas un solo bloque; piso como columna con
  subterráneos negativos; sectores nuevos vía `POST /sectores/batch`);
  `estacionamientosService.js`/`bodegasService.js` con `crearBatch`; `useSetupConfiguracion`
  carga `getCapacidad` y oculta cada paso si su entidad no aplica. **Fase 5 con modo edición +
  re-entrada CRUD completo**: toggle global "Editar" (celdas editables, "+ Agregar fila", papelera con
  "Eliminado", Cancelar con snapshot); `cargar()` consulta existentes vía `cfg.listar` y entra
  en `modoReedicion` (oculta stepper/nav, solo "Guardar"); `enviar()` en reedición = batch solo
  de filas nuevas + PUT individual de editadas + PATCH desactivar de eliminadas, con mensaje
  "X creados, Y actualizados, Z eliminados"; `itemsValidos` bloquea Guardar; `envelopeExcedido`
  cuenta solo filas nuevas en reedición. **Columna "Tipo" + prefijo fijo**: en fase 5 el nombre
  se edita como prefijo no editable + sufijo (`prefijoDe`/`sufijoDe`), el Select de tipo
  (Propietarios/Visitas) reclasifica todas las filas; fase 1 con prefijo disabled; re-entrada
  asegura el grupo `EV-` e infiere `grupoUid` por prefijo más largo (`grupoPorNombre`). Tests
  167/167 OK, build OK.

### [ ] P11. Reutilizar nombres de estacionamientos/bodegas desactivadas (dedupe ignora `activo=false`)
- **Solicitud:** `SOLICITUD_REUTILIZAR_NOMBRES_TRAS_DESACTIVAR.md` (2026-08-16)
- **Estado backend: ✅ implementado** (rama `feature/batch-estacionamientos-bodegas`) — migración
  `V63__reutilizar_nombres_tras_desactivar.sql` (reemplaza los constraints UNIQUE
  `(condominio_id, nombre)` por índices únicos parciales `WHERE activo` en `estacionamientos` y
  `bodegas`) + dedupe cambiado a `existsByCondominioIdAndNombreAndActivoTrue` en las 6 llamadas
  (`crear`, `crearBatch`, `actualizar` de ambos servicios). Tests actualizados (recrea nombres
  desactivados → 201).
- **Estado frontend: ✅ implementado** — `itemsValidos` permite "eliminar todo" en reedición;
  `guardar()` sale del modo edición al guardar bien; `enviar()` vuelve a modo creación (fase 1) si
  tras guardar no quedan entidades activas ni filas nuevas (reset de `estado` + `resultado=null`).
  Tests 170/170 OK, build OK.

### [ ] P9. Batch de unidades y sectores (para wizard paso 1)
- **Solicitud:** `SOLICITUD_BATCH_UNIDADES_SECTORES.md` (2026-08-15)
- **Estado backend: ✅ implementado** en `feature/batch-unidades-sectores` — `POST
  /condominios/{id}/unidades/batch` (atómico, 409 con `ErrorResponse.fields` fila a fila,
  valida dedupe, `tipo != CONDOMINIO`, `sectorId` por `findByIdAndCondominioId` y envelope
  acumulado) y `POST /sectores/batch` (`{creados:[...]}`). Tests: UnidadesBatch 14/14,
  SectoresBatch 6/6, regresión OK.
- **Estado frontend: ✅ implementado** — `SetupUnidadesView.vue` (5 fases: tipo/cantidad →
  numeración → sectores → asignación → revisar/guardar) vía `useSetupUnidades.js` +
  `numeracionUnidades.js`; borrador sessionStorage; sectores batch primero, unidades batch
  después; errores 409 mapeados a fila; degradación si el cargo no tiene `SECTOR_*` (403).
  `SETUP_PASOS` reordenado: unidades paso 1, planilla paso 2.

## Pendientes de verificación (QA)

### [ ] Q1. Verificación SSE en staging/prod
- **Checklist:** `verificacion-sse-staging-prod.md`
- **Qué falta:** verificar `SNAPSHOT_INICIAL`, eventos de cambio y `:ping` en staging/prod
  (en dev ya está verificado).

### [ ] Q2. Reproducir pantalla blanca PWA iOS
- **Instrumentado:** `frontendErrorReporter` + beacons `__frontend-error`/`__frontend-boot`.
- **Qué falta:** reproducir en el iPhone PWA con el build instrumentado y leer
  `comunidad:html-loaded`, `comunidad:frontend-hitos` y `comunidad:frontend-errors`.

### [ ] Q3. Verificar todas las vistas contra la API real
- **Qué falta:** pase de verificación de las vistas contra la API real.

## Pendientes del frontend (sin backend)

### [ ] F1. Pasos 2-5 del wizard de configuración del administrador
- `useSetupConfiguracion` define `accesos`/`areas-comunes`/`cargos`/`personal` como
  `EnConstruccionView`. El CRM de datos (soft delete `PATCH .../desactivar`) es el paso
  natural para conectar una vista `GestionDatosView` con `PlanillaDatos.vue`.

### [ ] F2. Migrar vistas legacy daisyUI a PrimeVue
- `GestionesView`, `EncomiendasView`, `SolicitudesView`.

### [ ] F3. Reconectar `SolicitudesView.vue`, `PermisosMatrixView.vue`, `CargosPermisosView.vue`
- Los archivos `.vue` se conservan; reconectarlos cuando existan los endpoints de P7 y P4.

### [ ] F4. Vistas CRUD de Estacionamientos y Bodegas (NUEVO — gap tras V57-V59)
- Estacionamientos (`/estacionamientos`) y bodegas (`/bodegas`) son entidades independientes
  (V57-V59) con CRUD + vínculos: `GET/POST`, `GET/PUT/{id}`, `PATCH/{id}/desactivar`,
  `GET/POST /{id}/vinculos` (`tipo` `TipoVinculoEstacionamiento`, `unidadId`, `fechaInicio/Fin`)
  y `PATCH /{id}/vinculos/{vinculoId}/desactivar`. Permisos `UNIDAD_VER/CREAR/EDITAR/ELIMINAR`.
- **Frontend:** NO existen `estacionamientosService.js`/`bodegasService.js` ni vistas admin.
  Al implementarlas, reemplazar la nota informativa de `UnidadesView.vue` ("entidades
  independientes, no se registran aquí") por enlaces a las nuevas vistas.
- La vinculación vehículo→estacionamiento (obsoleta) se eliminó de `VehiculosView.vue` y
  `vehiculosService.js` (los endpoints no existen en `VehiculoController`).

## Implementadas (referencia)

| Ítem | Estado |
| --- | --- |
| Capacidad de unidades por tipo (V51) — `SOLICITUD_CAPACIDAD_UNIDADES_POR_TIPO.md` | ✅ Implementado |
| Endpoint `GET /condominios/{id}/capacidad-unidades` (V60) — `SOLICITUD_ENDPOINT_CAPACIDAD_UNIDADES.md` | ✅ Implementado |
| Motor de Notificaciones V2 — `SOLICITUD_MOTOR_NOTIFICACIONES_V2.md` | ✅ Implementado |
| Stream SSE de encomiendas del residente — `SOLICITUD_STREAM_ENCOMIENDAS_RESIDENTE.md` | ✅ Implementado |
| Snapshot inicial SSE — `SOLICITUD_SNAPSHOT_INICIAL_SSE.md` | ✅ Implementado |
| Detección de cuenta activada (V52) — `SOLICITUD_DETECCION_CUENTA_ACTIVADA.md` | ✅ Implementado |
| Ordenamiento de auditoría — `SOLICITUD_ORDENAMIENTO_AUDITORIA.md` | ✅ Implementado |
| Planes inactivos + reactivación — `SOLICITUD_PLANES_INACTIVOS_REACTIVAR.md` | ✅ Implementado |
| Plantillas globales superadmin — `SOLICITUD_PLANTILLAS_GLOBALES_SUPERADMIN.md` | ✅ Implementado |
| Batch de unidades y sectores — `SOLICITUD_BATCH_UNIDADES_SECTORES.md` (P9) | ✅ Implementado |
| `SOLICITUD_IMPORTACION_MASIVA_EXCEL_CSV.md` (ver P2) | ⏳ Pendiente |
