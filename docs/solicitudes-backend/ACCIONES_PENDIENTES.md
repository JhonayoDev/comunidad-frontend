# Acciones pendientes — Backend / Frontend

Archivo maestro consolidado de acciones pendientes. Es la fuente única de verdad del estado
de cada ítem; los archivos de solicitud individuales pueden quedar desactualizados (el
estado real vive acá).

Actualizado contra el backend `develop` (head `3efab9e`/`6bc7061`, V57-V74).
Cambios recientes: **SSE dashboard/residente eliminados → polling** (`3efab9e`/`f6aa312`/`3b2a52d`),
**Email por condominio 8B-8D** (V71-V74: `AdminEmailConfigController`, `EmailProviderRouter`, routing por condominio),
**Anuncio async fan-out** (`AnuncioEntregasHandler`, `anuncioAsyncExecutor`), **polling metrics** con `Cache-Control: no-cache`.
Frontend `feature/cambios-sse` (`d7f0f0b`) ya migrado a `useDashboardMetrics`/`useResidenteMetrics`.
Histórico V57-V61 conservado abajo.

## Pendientes de implementación (backend)

### [ ] P1. Auditoría de "desactivar plan" (NUEVO)
- **Solicitud:** ninguna (identificado durante auditoría de vistas superadmin, 2026-08-15)
- **Dónde:** `AdminPlanesController.desactivar` (`PATCH /admin/planes/{id}/desactivar`)
- **Qué falta:** el método no registra auditoría. Falta `auditoriaService.planDesactivado(...)`
  en `AuditoriaService` (no existe el método ni el código `PLAN_DESACTIVAR`) y la llamada en el
  controller (que además no recibe `@AuthenticationPrincipal` ni `HttpServletRequest`).
- **Impacto frontend:** agregar la acción `PLAN_DESACTIVAR` al filtro de `SaasAuditoriaView.vue`
  (hoy solo existe `PLAN_REACTIVAR` en el backend).

### [x] P2. Importación masiva de la planilla de integrantes (contrato v3.0) — ✅ Implementado
- **Solicitud:** `SOLICITUD_IMPORTACION_PLANILLA_V3.md` (reemplaza la v2.0, desactualizada al
  modelo V58/V59: estacionamientos/bodegas como entidades propias, sin vínculo vehículo→est)
- **Backend (implementado, V67):** `POST /importaciones/preview` (multipart `archivo` o JSON
  `{filas}`), `POST /importaciones/{importacionId}/ejecutar` (transacción, borrador consumido →
  404 en segunda llamada), `GET /importaciones/plantilla` (CSV). Permiso `IMPORTACION_DATOS` en
  rol ADMINISTRADOR + cargos ADMINISTRADOR/PRESIDENTE/SECRETARIO. Columna `esResponsable` en
  `vinculos_persona_unidad` (máx 1 por unidad → 409 en `POST /vinculos`). Dedupe por
  unidad/email/patente/nombre; estados por fila OK/ERROR/OMITIDA; límite 1000 filas; borrador
  30 min. Informe de handoff: `docs/informes/INFORME_FRONTEND_IMPORTACION_PLANILLA.md`.
- **Frontend (integrado):** `importacionService.js` (preview archivo/JSON, ejecutar, plantilla);
  `usePlanillaDatos` con `preview()`/`ejecutar()`/`enviar()` reales (preview→ejecutar) +
  `previewData` + `descargarPlantilla()` + refs `estacionamientos`/`bodegas` para AutoComplete;
  `PlanillaDatos.vue` con AutoComplete de casas/est/bodegas declarados y resumen del preview;
  `ImportacionMasivaView.vue` con flujo Previsualizar → "Importar N filas" → resultado real;
  `SetupPlanillaView.vue` label "Paso 6 · Planilla de integrantes". Tests 211/211 OK, build OK.

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

### [ ] P12. Reutilizar números de unidades desactivadas + protección de integridad al renombrar/cambiar tipo con vínculos activos (unidades, estacionamientos y bodegas)
- **Solicitud:** `SOLICITUD_REUTILIZAR_NUMEROS_UNIDADES_Y_PROTECCION_VINCULOS.md` (2026-08-17)
- **Estado backend: ✅ implementado** (informe de handoff recibido). Parte A: migración V64
  (constraint `uq_unidad_numero` → índice único parcial `WHERE activo`, patrón V63) + dedupe
  `existsByCondominioIdAndNumeroAndActivoTrue` en las 3 llamadas (`crear:137`, `crearBatch:202`,
  `actualizar:253`). Parte B: si la entidad tiene **vínculos activos** → ❌ renombrar
  (`numero`/`nombre`), ❌ cambiar `tipo` (unidades), ❌ desactivar (ampliado a **personas +
  vehículos**); ✅ `sector`/`piso` siempre editables (tags). Aplica a `UnidadService.actualizar`,
  `EstacionamientoService.actualizar` y `BodegaService.actualizar` (409 con mensaje legible).
- **Estado frontend: ✅ implementado** — reedición del wizard paso 1 (unidades): `cargar()`
  consulta existentes (excluye CONDOMINIO e inactivas), fase 5 en modo lectura + edición
  (Editar/Listo/Cancelar, celdas, "+ Agregar fila", papelera), `itemsValidos` (números únicos,
  permite "eliminar todo"), `enviar()` batch nuevas + PUT editadas + desactivar eliminadas +
  vuelta a fase 1 si no quedan, navegación inferior oculta durante edición, patrón "Sin sector"
  en fase 4 (fix `clearable` roto), fix typo "Lista"→"Listo". En estacionamientos/bodegas:
  indicador de inmutabilidad (`tieneVinculos` derivado de `propietario`/`arrendatarioEfectivo`/
  `arrendatariosFuturos`) deshabilita nombre/tipo en edición. Tests 176/176 OK, build OK.
- **Gap anotado:** `UnidadResumenResponse` NO expone el conteo de vínculos activos (solo
  `sectorNombre`, sin `sectorId`), por lo que en unidades el indicador de inmutabilidad no se
  puede prender de forma preventiva — se depende del 409 mapeado a la fila. Si se quiere el
  candado preventivo en unidades, pedir al backend un campo `vinculosActivos` (o `sectorId`) en
  `UnidadResumenResponse`.

### [ ] P13. Orden natural de unidades en el backend (NUEVO — revisión futura)
- **Causa raíz:** `UnidadRepository` ordena `ORDER BY u.numero ASC` y `numero` es VARCHAR →
  orden **lexicográfico** (`1, 10, 11, 12, 2, 20, 21...`).
- **Workaround frontend (✅ implementado):** `src/utils/ordenamientoNatural.js`
  (`compararUnidades`/`ordenarUnidades`) + `unidadesService.getUnidades` reordena `res.data`
  in-place con orden natural (`1, 2, 3, ..., 10, 11, ..., 20, 21`; números antes que texto →
  unidad CONDOMINIO al final; maneja mixtos `A-1`/`Casa 10`). Tests 6/6, suite 182/182 OK.
- **Propuesta para futuro (backend):** orden natural en la query, p.ej.
  `ORDER BY (numero ~ '^\d+$') DESC, LENGTH(numero), numero` (o campo de orden numérico
  explícito), para que también clientes externos (móvil/API) queden ordenados. Revisar al
  tocar el repo de unidades.

### [x] P14. Reutilizar nombres de sectores desactivados (dedupe ignora `activo=false`)
- **Solicitud:** `SOLICITUD_SECTORES_NOMBRES_REUTILIZABLES.md` (2026-08-17)
- **Estado backend: ✅ implementado (V65).** `SectorRepository.existsByCondominioIdAndNombreAndActivoTrue`
  en las 3 llamadas (`SectorService.crear:53`, `crearBatch:88`, `actualizar:117-120`). Migración
  `V65__sectores_nombres_reutilizables.sql`: sanitiza duplicados activos y crea el índice parcial
  `uq_sector_cond_nombre_activo ON sectores (condominio_id, nombre) WHERE activo`. Reglas nuevas:
  recrear un nombre desactivado → 201; renombrar a un nombre desactivado → 200; dedupe solo entre
  activos; **reactivación protegida** (`actualizar` valida solo si el resultado es activo Y cambia el
  nombre o el sector estaba inactivo → 409 si el nombre lo ocupa otro activo). `desactivar` intacto
  (204 / 409 con conteos). `GET /sectores` sigue devolviendo solo activos.
- **Estado frontend: ✅ implementado** — vista de gestión de sectores (etapa 2 del wizard):
  `SetupSectoresView.vue` + `useSetupSectores.js` (listar activos con orden natural, crear/editar
  nombre+descripción, desactivar con 409 mapeado a la fila "sector en uso", "eliminar todo" válido,
  degradación con aviso si el cargo no tiene `SECTOR_*` — el cargo ADMINISTRADOR residente no los
  tiene; rol ADMINISTRADOR sí, V62). `unidadesService` += `actualizarSector`/`desactivarSector`.
  `SETUP_PASOS` += paso `sectores` (etapa 2, siempre visible, completado con `unidades > 0`).
  Tests 8/8 nuevos, suite 193/193 OK, build OK.

### [x] P15. Entidad `Piso` — catálogo de pisos del condominio
- **Solicitud:** `SOLICITUD_ENTIDAD_PISOS.md` (2026-08-17)
- **Estado backend: ✅ implementado (V66).** Tabla `pisos` (numero Integer con negativos,
  nombre/descripcion opcionales, `activo`), índice único parcial
  `uq_piso_cond_numero_activo (condominio_id, numero) WHERE activo` (desactivar libera el
  número, patrón V65), permisos `PISO_VER/CREAR/EDITAR/ELIMINAR` — **cargo ADMINISTRADOR con
  los 4** (a diferencia de V62), PRESIDENTE 4, SECRETARIO VER/CREAR/EDITAR, CONSERJE/GUARDIA
  VER. `PisoController` espejo de sectores (`GET/POST/POST batch/PUT/PATCH desactivar` bajo
  `/api/v1/condominios/{cid}/pisos`); `PisoService.actualizar` valida el dedupe solo si el
  resultado queda activo Y cambió el número o estaba inactivo (reactivación protegida);
  `desactivar` → 409 con conteos (unidades/bodegas/estacionamientos/espacios comunes activos
  con ese `piso`). Tests 27 nuevos (PisoIntegrationTest 22 + PisosBatchIntegrationTest 5),
  suite backend 805 OK.
- **Estado frontend: ✅ implementado** — vista de gestión de pisos (etapa 3 del wizard):
  `SetupPisosView.vue` + `useSetupPisos.js` (espejo de sectores: listar activos ordenados por
  número con subterráneos primero, crear/editar número+nombre+descripción, desactivar con 409
  mapeado a la fila "piso en uso" que revierte `marcadoEliminar=false`, banner de resumen,
  Tag compacto "No eliminado" y ConfirmDialog — patrón A+B+C+D); `unidadesService` +=
  `getPisos`/`crearPiso`/`crearPisosBatch`/`actualizarPiso`/`desactivarPiso`. `SETUP_PASOS` +=
  paso `pisos` (etapa 3, entre sectores y estacionamientos, siempre visible, completado con
  `unidades > 0`). Tests 8/8 nuevos (`useSetupPisos.test.js`), suite 203/203 OK, build OK.
- **Acople al wizard de unidades/estacionamientos/bodegas: ✅ implementado** — `useSetupUnidades`
  y `useSetupEntidades` cargan el catálogo (`cargarPisos()` → `GET /pisos`, degradación 403 →
  `pisosHabilitados=false` y piso libre) y exponen `pisosDisponibles`/`pisosOpciones`/`pisosLista`;
  en la numeración "por-piso" de estacionamientos/bodegas se muestra "Pisos declarados: X" con
  botón "Usar declarados" (prefill de la lista `"1,2,-1"`); en fase 5/reedición la columna Piso
  pasa a `Select` de los pisos declarados (opción sentinela "Sin piso", patrón `SIN_SECTOR`) con
  fallback a `InputNumber` si no hay catálogo. Tests 4/4 nuevos, suite 207/207 OK, build OK.

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

## Novedades backend pendientes de frontend (V68-V74)

### [ ] P16. Email por condominio — 8B/8C/8D (V71-V74)
- **Backend (✅ `6bc7061`):** `V71__condominio_email_config.sql` + `V72-V74` permisos/routing; `CondominioEmailConfig`/`CondominioEmailRouting`,
  `EmailProviderRouter` (resuelve Brevo vs SMTP por condominio), `AdminEmailConfigController` (`GET/PUT/DELETE /admin/condominios/{id}/email/config`,
  `POST /config/test`, `GET/PUT /routing`), `SmtpEmailProvider`/`BrevoEmailProvider`, permisos `EMAIL_CONFIG_VER/EDITAR` (`SUPER_ADMIN`/`SOPORTE`).
- **Frontend (❌):** sin servicio ni vista. Falta `adminService` métodos + vista `SaasEmailConfigView.vue` (ruta `admin/condominios/:id/email`, form SMTP + routing + test).
  Ver `docs/arquitectura/PLAN_OPTIMIZACION_ANUNCIO.md` y migraciones V71-V74.

### [ ] P17. Anuncio async fan-out (Plan A)
- **Backend (✅ `b1b0538`):** `AnuncioService.publicar` → `AnuncioPublicadoEvent` → `AnuncioEntregasHandler` `@Async("anuncioAsyncExecutor") AFTER_COMMIT`
  fan-out vía `NotificacionService.procesarEvento` (reusa idempotencia + `EntregaImmediateHandler`/`RetryEntregasJob`). Mismo contrato `POST /condominios/{id}/anuncios` (201 inmediato).
- **Frontend (✅ compatible):** `anunciosService.crear`/`AnunciosView.vue` sin cambio requerido. Opcional: toast "Anuncio publicado — entregas en curso (async)" tras 201.

### [ ] P18. Polling metrics — hardening `@RequiresModule`
- **Backend:** `DashboardController.java:81` (`GET /dashboard/metrics`, `@RequiresModule(CONTROL_ACCESO)`) y `ResidenteDashboardController.java:57` (`/residente/metrics`, `@RequiresModule(ENCOMIENDAS)`) con `Cache-Control: no-cache`.
- **Frontend (gap):** `useDashboardMetrics.js`/`useResidenteMetrics.js` hacen polling incondicional. Si módulo no contratado → 403 en loop cada 30s/60s. Pendiente F2: guard por `listarModulos` o catch 403 → pausar query + mensaje "Módulo no contratado".
- **SSE conservados:** `NotificacionController.java:103` (`/notificaciones/stream`, `NOTIFICACION_VER`, scoped persona) y `AdminMetricsStreamController.java:37` (`/admin/metrics/stream`, `SUPER_ADMIN|SOPORTE`) siguen vigentes.

## Pendientes de verificación (QA)

### [x] Q1. Polling metrics reemplaza SSE (verificado dev) — pendiente staging/prod
- **Backend:** `3b2a52d`/`f6aa312`/`3efab9e` deprecó y eliminó `DashboardStreamController`/`ResidenteDashboardStreamController` y 5 tests asociados.
- **Frontend:** `d7f0f0b` migró a polling 30s/60s (`useDashboardMetrics`/`useResidenteMetrics`).
- **Checklist staging/prod (actualizado):** verificar `GET /dashboard/metrics` y `GET /residente/metrics` con `Cache-Control: no-cache` (conteos frescos), 403 sin módulo, `GET /notificaciones/stream` intacto, y que `MainLayout` no abre streams operativos.
- **Histórico SSE:** `verificacion-sse-staging-prod.md` archivado para dashboard/residente; vigente solo para notificaciones.

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

### [ ] F5. Manejo global de demoras de respuesta (timeout) — revisar cómo tratarlo (NUEVO)
- **Caso ejemplo (2026-08-16):** al guardar estacionamientos en el wizard (fase 5, reedición),
  `enviar()` de `useSetupEntidades.js` lanzó `AxiosError: timeout of 10000ms exceeded`
  (`console.error` en línea 487). Al reintentar, guardó bien.
- **Diagnóstico:** la instancia axios global (`src/services/api.js:11`) tiene `timeout: 10000`.
  `enviar()` hace una cadena de requests secuenciales (batch + PUTs + PATCHes), cada uno con ese
  tope. Causa más probable: **cold start del backend remoto** (`apicomunidad.ideaspace.dpdns.org`)
  — el primer request tras inactividad superó los 10s; al reintentar el servidor ya estaba tibio.
  El batch es atómico (todo-o-nada), por lo que el intento con timeout no creó nada y el reintento
  con los mismos nombres funcionó. En reedición los PUT/PATCH son idempotentes → reintentar es seguro.
- **Pendiente de decidir (global, no solo este caso):**
  - ¿Extender el timeout por request a los endpoints batch (`crearEstacionamientosBatch`,
    `crearBodegasBatch`, `crearSectoresBatch`, `crearUnidadesBatch`) con `{ timeout: 30000 }`?
  - ¿Mensaje distinto ante timeout en `enviar()` (detectar `e.code === 'ECONNABORTED'` +
    `/timeout/` en `e.message`) en vez del genérico "No se pudieron guardar..."?
  - ¿Política global de timeouts/retry en `api.js`? (NO auto-reintento del batch: no es
    idempotente y un reintento automático podría duplicar si el primer intento commiteó).
- **Impacto:** wizard de estacionamientos/bodegas (fase 5) y wizard paso 1 de unidades (batch).

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
| Entidad `Piso` (catálogo de pisos) — `SOLICITUD_ENTIDAD_PISOS.md` (P15, V66) | ✅ Implementado |
| Importación de la planilla de integrantes — `SOLICITUD_IMPORTACION_PLANILLA_V3.md` (P2, V67) | ✅ Implementado |
| Polling operativo/residente reemplaza SSE — `3b2a52d`/`f6aa312`/`3efab9e` + `d7f0f0b` | ✅ Implementado |
| Email por condominio modelo/routing — V71-V74 (`AdminEmailConfigController`) | ✅ Backend / ❌ Frontend (P16) |
| Anuncio async fan-out — `b1b0538` Plan A | ✅ Backend / ✅ Frontend compatible |
