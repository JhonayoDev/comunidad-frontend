# AGENTS.md — Comunidad Frontend

## Goal
Alinear todos los módulos del frontend (GUARDIA y RESIDENTE) con los endpoints reales del backend, manteniendo responsividad mobile-first con PrimeVue + Tailwind.

## Constraints & Preferences
- No modificar el backend
- Usar PrimeVue 4.5.5 (Card, Avatar, Tag, Badge, Button, Dialog, Select, Textarea, InputText, Message, Skeleton, Divider, Password)
- Mobile-first responsive con CSS/Tailwind + PrimeVue
- pnpm, nunca npm
- Sin datos mock — todos los servicios llaman directamente al API
- `console.error` en todos los catch blocks para depuración visible
- Todos los endpoints scoped por condominio: `/api/v1/condominios/{condominioId}/...`

## Done
- Revisados todos los controllers del backend y sus DTOs
- Mapeados todos los campos de request/response contra cada vista del frontend
- Eliminados todos los datos mock de todos los servicios
- **`encomiendasService.js`**: `getMisEncomiendas` usa URL correcta `/condominios/{cid}/mis-encomiendas`
- **`perfilService.js`**: agregado `actualizarMe(data)` → `PUT /me`
- **`useNotificaciones.js`**: corregido — usa `getTodas(condominioId)`, `getSync(condominioId)` (con `refetchInterval: 120000`), `marcarLeida(condominioId, notif.id)`, `marcarTodasLeidas(condominioId)`, obtiene `condominioId` del authStore
- **`RegistrarVisitaView`**: `tipo` usa enum API (`VISITA`, `DELIVERY`, `UBER`, `SERVICIO`, `TECNICO`, `OTRO`); campo `nombreVisitante`; single `unidadId`; eliminado `buscarFrecuente`
- **`EncomiendasView`**: formulario usa `tipo` (CARTA/ENCOMIENDA) + `nombreDestinatario`; entregar pide `nombreRetira` + `rutRetira`;
- **`useEncomiendas`**: `entregar(encomienda, nombreRetira, rutRetira)` envía body al backend
- **`useVisitas`**: `registrarSalida` setea `visita.estado = "FINALIZADO"` y `visita.fechaSalida`
- **`PortonView`**: migrado a usar `<BuscadorPatenteCard />` con `GET /busqueda/por-patente`
- **`RegistrarVisitaView`**: migrado a `useUnidades` con TanStack Query; cambiado Select por AutoComplete para búsqueda por número de casa; acepta pre-fill desde BuscadorPatenteCard
- **`useBusquedaPatente.js`**: creado — orquesta búsqueda por patente + detección de acceso activo para salida rápida; botón "Registrar ingreso" navega a RegistrarVisitaView con datos pre-rellenados
- **`BuscadorPatenteCard.vue`** (`src/components/visitas/`): creado — componente reutilizable con props `compact` para dashboard/vista completa; función `extraerUnidadDeResultado` parsea subtitulo/detalle para pre-fill de casa
- **`ConfirmarSalidaDialog.vue`** (`src/components/visitas/`): creado — subcomponente presentacional para salida rápida con datos del acceso activo
- **`VisitasView`**: template usa `nombreVisitante`, `patenteVisitante`, `tipo`, `fechaIngreso`, `fechaSalida`, `estado`; migrado a PrimeVue
- **`GuardiaDashboardView`**: movimientos usan `nombre`, `unidad`, `fecha`; agregados `console.error` en catch blocks
- **`BitacoraView`**: `registradoPorNombre` (no `realizadoPorNombre`), `registradoEn` (no `realizadoEn`); agregados `console.error`
- **`AutorizacionesView`**: `tipoLabels` coincide con enum API; reemplazado `creadoPorNombre` por `createdAt/fechaInicio`; agregado `console.error`
- **`InicioView (residente)`**: encomiendas usa `tipo`, `nombreDestinatario`, `creadoEn`; agregado `console.error`
- **`NotificacionesView`**: migrado a PrimeVue; usa `notif.id` (no `notificacionId`); pasa `condominioId` en llamadas API
- **`MisEncomiendasView`**: migrado a PrimeVue; usa `tipo`, `nombreDestinatario`, `unidadNumero`, `creadoEn`; pasa `condominioId`
- **`PerfilView`**: migrado a PrimeVue + `<Password>`; usa `perfilService.actualizarMe({nombre, telefono})` real; carga perfil de `GET /me`
- **`TarjetaEncomiendasPendientes.vue`**: creado — card reutilizable para conteo de encomiendas pendientes; en F1 usaba `GET /encomiendas/activas`, hoy conteo en vivo solo vía SSE (`metricas.encomiendasPendientes`) con seed desde `conteoInicial`
- **`encomiendasService.js`**: `getActivas()` agregado en F1 y luego **eliminado** (sin callers tras quitar la lista del dashboard del guardia)
- **`useDashboardGuardia.js`**: `encomiendasQuery` (via `getActivas()`, arregla bug PageResponse vs array) creado en F1 y luego **eliminado**
- **`GuardiaDashboardView.vue`**: usa `TarjetaEncomiendasPendientes`; lista pendientes con campos reales (`nombreDestinatario`, `unidadNumero`, `tipo`, `creadoEn`)
- **`useEncomiendas.js`**: invalida `["encomiendas", cid]` al registrar/entregar (con optimistic update + rollback en entregar)
- **`REQUERIMIENTOS_STATS_TIEMPO_REAL.md`**: creado — informe de requerimientos SSE para estadísticas en tiempo real (entregable al backend, fase F2/F3)
- **`sseParser.js`**: creado — parser SSE puro e incremental (frames, `data` multilínea, `:ping`, CRLF) para leer el stream con `fetch()` + `ReadableStream` (EventSource no soporta headers)
- **`dashboardStreamService.js`**: creado — cliente SSE singleton vía `fetch()` + `ReadableStream` con `Authorization: Bearer`, dedupe por condominio, reconexión con backoff (1s→30s), `streamVivo` ref compartido a nivel de módulo
- **`useMetricasTiempoReal.js`**: creado — registro `clave SSE → queryKey` (visitasActivas soloConteo / autorizacionesPendientes invalidate / encomiendasPendientes soloConteo), `refetchIntervalMetrica` computed reactivo (**sin polling con stream vivo**; **gracia 1 min sin polling y luego fallback a 2 min solo si el stream sigue caído** — no inunda de peticiones), refetch del snapshot al reconectar, **no resetea `metricas` al reconectar el MISMO condominio** (el backend envía `SNAPSHOT_INICIAL` como primer frame y repuebla al instante; solo se limpia al cambiar de condominio), invalida `["dashboardGuardia", cid]` al reconectar
- **`MainLayout.vue`**: stream SSE conectado app-wide con `watchEffect` cuando hay condominio + permiso `DASHBOARD_GUARDIA` o `DASHBOARD_ADMIN`; se aborta al cambiar condominio/cerrar sesión; también invoca `useMetricasTiempoReal()` app-wide para que la suscripción a eventos/estado quede registrada en cualquier rol (arregla el badge del admin, que nunca registraba la suscripción por no montar el dashboard del guardia)
- **`SOLICITUD_SNAPSHOT_INICIAL_SSE.md`**: creado — solicitud al backend para publicar un snapshot de métricas (todas las claves) al suscribirse al stream, evitando que las cards queden stale entre el fetch del snapshot y el primer evento de cambio. **Backend lo implementó y verificó** (informe de vuelta): `SNAPSHOT_INICIAL` como primer frame del stream
- **`TarjetaAccesosActivos.vue`**: conteo en vivo solo vía SSE (`metricas.visitasActivas`); antes del primer evento muestra `conteoInicial` (sembrado desde `dashboard.accesos.activosAhora`) — ya NO consulta `GET /accesos/conteo-activos` (endpoint eliminado del service). Mismas condiciones que la tarjeta de encomiendas
- **`TarjetaEncomiendasPendientes.vue`**: conteo en vivo solo vía SSE (`metricas.encomiendasPendientes`); antes del primer evento muestra `conteoInicial` (sembrado desde `dashboard.encomiendas`) — ya NO consulta `GET /encomiendas/activas` (eliminada la lista completa del dashboard del guardia)
- **`GuardiaDashboardView.vue`**: eliminada la sección "Encomiendas pendientes" (lista) y su query `encomiendas/activas`; quedan visitas, unidades, residentes y autorizaciones; agregado indicador visual de conexión SSE (`estaVivo` de `useMetricasTiempoReal`) sobre la grilla de tarjetas
- **`AdminDashboardView.vue`**: el badge de accesos también recibe `:conteo-inicial` desde `dashboard.accesos.activosAhora` (seed del snapshot); NO usa composables de métricas — el conteo en vivo del badge llega porque `TarjetaAccesosActivos` importa el reactive `metricas` y la suscripción app-wide en `MainLayout.vue` lo puebla
- **`useDashboardGuardia.js`**: polling reactivo vía `refetchIntervalMetrica()` (sin polling con stream vivo; gracia 1 min y fallback a 2 min si el stream sigue caído); eliminado `encomiendasQuery` y `conteoActivosQuery`; `dashboard = computed(() => dashboardQuery.data)` (sin fallback `?? []` — el `[]` truthy enmascaraba el snapshot y renderizaba `conteo-inicial` 0)
- **`visitasService.js`**: eliminado `getConteoActivos` (sin callers tras mover la tarjeta de visitas a SSE puro)
- **`vite.config.js`**: `devOptions.enabled: false` para el PWA en dev — el SW (solo push, no cachea) se reinstalaba constantemente con `autoUpdate`; en producción el build lo incluye igual
- Agregados `console.error` en catch blocks de todas las vistas
- Corregido bug de loading infinito en `cargarUnidades()` (resuelve spinner cuando `!cid`)
- **Sistema de respaldo probado**: `useMetricasTiempoReal` con gracia de 1 min sin polling y fallback a 2 min solo si el stream sigue caído; cubierto por tests (`useMetricasTiempoReal.test.js`) y verificado en vivo contra el backend real (snapshot + eventos de cambio + `:ping`)
- Build pasa con `pnpm build`

## Blocked
- **SolicitudesView**: no existe `SolicitudesController` en el backend — llama a `/condominios/{cid}/solicitudes-registro` que devuelve 404. **Mitigado temporalmente**: la ruta `Solicitudes` ahora renderiza `EnConstruccionView` (placeholder) hasta que el backend implemente el controller; el archivo `SolicitudesView.vue` se conserva en el repo para reconectarlo después.

## Componentes Creados
- **`BuscadorPatenteCard.vue`** (`src/components/visitas/`): Componente reutilizable para búsqueda por patente. Props: `compact`. Consulta en paralelo `/busqueda/por-patente` + `GET /accesos?estado=ACTIVO` para detectar si hay acceso activo que permita salida rápida.
- **`ConfirmarSalidaDialog.vue`** (`src/components/visitas/`): Subcomponente del BuscadorPatenteCard. Dialog modal que muestra datos del acceso activo (visitante, unidad, fecha ingreso, tipo, personas) y permite confirmar salida con observación opcional.
- **`TarjetaEncomiendasPendientes.vue`**: Card reutilizable para conteo de encomiendas pendientes. Props: `variant` ('card'|'badge'), `conteoInicial` (seed del snapshot). Emite `click`. Conteo en vivo solo vía SSE (`metricas.encomiendasPendientes`) — no fetchea la lista completa.
- **`TarjetaAccesosActivos.vue`**: Card reutilizable para conteo de visitas activas. Props: `variant` ('card'|'badge'), `conteoInicial` (seed del snapshot). Emite `click`. Conteo en vivo solo vía SSE (`metricas.visitasActivas`) — no fetchea `GET /accesos/conteo-activos` (eliminado).
- **`AccesoRapidoCard.vue`** (`src/components/quickaccess/`): Card "Acceso rápido" extraída del dashboard del guardia a componente reutilizable. Props: `items` (array `{label, icon, routeName, query?, severity?, variant?, isCentralFab?}`), `title`, `columns`. Items con `isCentralFab` se renderizan como botón primary (destacado).
- **`BottomNavigation.vue`** (`src/components/layout/`, reescrito): Bottom Navigation Bar global estilo app nativa, solo en PWA instalada standalone + touch. Botón central flotante (FAB) con ícono de casa y label "Home" que lleva al dashboard del rol (`GuardiaDashboard`/`Dashboard`/`Inicio`) vía `isCentralFab`. Solo visible con rol con items configurados (`GUARDIA`/`ADMINISTRADOR`/`RESIDENTE`). Respeto `env(safe-area-inset-bottom)`.
- **`EnConstruccionView.vue`** (`src/views/common/`): Pantalla placeholder "en construcción". Recibe `modulo` por prop o `route.query.modulo`. Usada por la ruta `Solicitudes` (sin backend aún); la ruta `Escanear` queda registrada para un futuro escáner QR.

## Composable
- **`useBusquedaPatente.js`**: Orquesta dos consultas paralelas en `consultar()`: (1) `busquedaService.porPatente()` y (2) `accesosService.listar(estado=ACTIVO)` — filtra localmente por patente para detectar `accesoSalida`. Expone `confirmarSalida(observacion)`. Maneja errores de campo del backend (`ErrorResponse.fields[]`).
- **`usePwaStandalone.js`**: Detecta si la app corre como PWA instalada en dispositivo táctil. `matchMedia('(display-mode: standalone)')` + `navigator.standalone` (iOS) + `(pointer: coarse)`. Escucha `change`, `pageshow`, `focus` y `appinstalled`. Expone `{ isStandalone, esTouch, mostrar }` con `mostrar = isStandalone && esTouch`.
- **`useBottomNav.js`**: Consume `BOTTOM_NAV_BY_ROLE` según `condominioActualRol`, filtra con `puedeAcceder()` (helper ahora expuesto por `useNavigation`). `activo(item)` compara `route.path` (cubre subrutas). Expone `{ items, visible, activo, go }`.

## Flujo de Ingreso Rápido (desde búsqueda)
El guardia busca una patente → si el vehículo está identificado, botón "Registrar ingreso" navega a `RegistrarVisitaView` con `patente`, `nombre` (desde `titulo`), `unidad` (parseada de `subtitulo/detalle`) y `autorizacionId` (si es PREAUTORIZACION). El guardia completa los datos faltantes y confirma.

## Flujo de Salida Rápida
El guardia busca una patente → si hay un acceso ACTIVO con esa patente, aparece botón "Registrar salida" → Dialog muestra datos del acceso → confirma → `PATCH /accesos/{id}/salida`.

## Key Decisions
- Eliminar todos los datos mock porque confundían la depuración — ahora el error real se ve en la consola del navegador
- PortonView ahora usa `GET /busqueda/por-patente` en vez de `GET /vehiculos` + filtro local
- `useEncomiendas.entregar()` ahora recibe `nombreRetira` y `rutRetira` como parámetros obligatorios
- Eliminado `buscarFrecuente()` de `RegistrarVisitaView` porque el backend no expone `GET /accesos/frecuentes`
- Las categorías de tipo de acceso ahora coinciden exactamente con el enum `TipoAutorizacion` del backend
- `useNotificaciones` ahora obtiene `condominioId` desde `authStore` internamente
- `useBusquedaPatente` consulta en paralelo `/busqueda/por-patente` + `/accesos?estado=ACTIVO` para detectar acceso activo y permitir salida rápida
- `ConfirmarSalidaDialog` es subcomponente presentacional — toda la lógica vive en `useBusquedaPatente`
- El botón "Registrar ingreso" en `BuscadorPatenteCard` navega a `RegistrarVisitaView` con datos pre-rellenados, evitando lógica duplicada de ingreso
- `RegistrarVisitaView` usa `AutoComplete` de PrimeVue para buscar casa por número con sugerencias al escribir
- **Con stream SSE vivo NO hay polling** de métricas (el SSE es la fuente primaria); si el stream cae, hay una gracia de 1 min sin polling (le da tiempo a la reconexión con backoff) y solo si sigue caído se activa el polling de respaldo a 2 min. Reducción de tráfico: 0 requests de `conteo-activos`/`encomiendas/activas` en reposo
- **Al reconectar el SSE** se invalidan las queries registradas (refetch del snapshot) para reconciliar deltas perdidos sin depender del polling
- **Eliminada la sección "Encomiendas pendientes"** del dashboard del guardia y con ella la petición `GET /encomiendas/activas` (lista completa). El conteo de la tarjeta sale del SSE (`metricas.encomiendasPendientes`) y antes del primer evento se siembra desde `dashboard.encomiendas` (snapshot ya real, no hardcodeado)
- **Ambas tarjetas de métricas (visitas y encomiendas) trabajan 100% con SSE** — misma condición y misma fuente primaria. El seed del snapshot es la única lectura inicial: `dashboard.accesos.activosAhora` (visitas) y `dashboard.encomiendas` (encomiendas). El fallback `dashboardQuery.data ?? []` se eliminó porque el `[]` (truthy) enmascaraba el snapshot y hacía renderizar `conteo-inicial = 0` en recargas con stream caído
- **Bottom Navigation Bar es PWA-only**: se muestra solo cuando `display-mode: standalone` (o iOS `navigator.standalone`) + `pointer: coarse`. El FAB central es "Home" (ícono casa) y navega al dashboard del rol; los sets por rol se definen en `BOTTOM_NAV_BY_ROLE` con `conHomeCentral()` (2 items a cada lado del FAB). Reemplaza la card "Acceso rápido" en móvil instalado (que ahora vive en `AccesoRapidoCard.vue`). En navegador de escritorio se mantiene la card del dashboard y el footer.

## Next Steps
- **Verificar SNAPSHOT_INICIAL en dev**: ✅ verificado en vivo (backend reiniciado) — primer frame `event: metrica` con `tipoEvento: SNAPSHOT_INICIAL` y las 3 claves (visitasActivas 7, encomiendasPendientes 7, autorizacionesPendientes 0) coincidiendo con `GET /dashboard/guardia`; evento de cambio `ENCOMIENDA_RECIBIDA` incrementa el conteo; `:ping` cada ~15s. Pendiente verificar en staging/prod según checklist en `docs/verificacion-sse-staging-prod.md`
- Verificar que todas las vistas funcionan contra la API real
- Solicitar al backend: crear `SolicitudesController` para `/condominios/{cid}/solicitudes-registro`
- Solicitar al backend (mejora): crear endpoint `GET /condominios/{cid}/vehiculos/consulta-rapida?patente=X`
- Migrar vistas legacy que aún usan daisyUI (`GestionesView`, `EncomiendasView`, `SolicitudesView`) a PrimeVue

## Critical Context
- Backend en `/home/jhonayo/dev/projects/portfolio/comunidad/` — NO modificar
- `TipoAutorizacion` enum: `VISITA`, `DELIVERY`, `UBER`, `SERVICIO`, `TECNICO`, `OTRO`
- `TipoEncomienda` enum: `CARTA`, `ENCOMIENDA`
- `EstadoAcceso` enum: `ACTIVO`, `FINALIZADO`, `RECHAZADO`
- `TipoEventoBitacora` enum: `TURNO_INICIO`, `TURNO_FIN`, `COLACION_SALIDA`, `COLACION_REGRESO`, `NOVEDAD`
- `ClasificacionBitacora` enum: `INFO`, `NORMAL`, `URGENTE`, `EMERGENCIA`
- `DashboardGuardiaResponse` record: `condominio`, `totalUnidades`, `residentesActivos`, `accesos` (con `activosAhora` + `ultimosMovimientos`), `encomiendas` (conteo PENDIENTE real, ya no hardcodeado a 0 — sirve de seed para la tarjeta)
- `Movimiento` record: `nombre`, `tipo`, `unidad`, `fecha`
- `ResidenteDashboardResponse` record: `nombre`, `email`, `unidades` (lista de `UnidadInfo`)
- `UnidadInfo` record: `id`, `numero`, `tipo`, `vehiculos`, `personas`, `gastoActual`
- `GastoUnidadInfo` record: `periodo`, `fechaVencimiento`, `monto`, `estadoPago`, `fechaPago`
- `EncomiendaResumenResponse`: `id`, `unidadNumero`, `tipo`, `nombreDestinatario`, `estado`, `creadoEn`, `creadoPorNombre`, `nombreRetira`, `rutRetira`, `observaciones`
- `NotificacionResponse`: `id`, `tipo`, `titulo`, `mensaje`, `tipoRecurso`, `recursoId`, `prioridad`, `leido`, `fechaCreacion`, `fechaLectura`
- `MeResponse`: `personaId`, `nombre`, `email`, `roles`
- Build pasa con `pnpm build`
- `.env` apunta a `https://apicomunidad.ideaspace.dpdns.org/api/v1`

## Relevant Files
- `src/config/navegacionAccesoRapido.js`: fuente única de ítems de acceso rápido/bottom nav por rol (`ACCESO_RAPIDO_GUARDIA` + `BOTTOM_NAV_BY_ROLE` con GUARDIA/ADMINISTRADOR/RESIDENTE, FAB central "Home" vía `conHomeCentral()`)
- `src/composables/usePwaStandalone.js`: detección PWA standalone + touch (ver Composable)
- `src/composables/useBottomNav.js`: ítems + estado activo + navegación de la bottom nav (ver Composable)
- `src/components/layout/BottomNavigation.vue`: barra global con FAB central (ver Componentes Creados)
- `src/components/quickaccess/AccesoRapidoCard.vue`: card reutilizable de accesos rápidos (ver Componentes Creados)
- `src/services/encomiendasService.js`: `getEncomiendas`, `getEncomienda`, `registrar`, `entregar` (PATCH `.../{id}/entregar`), `cerrar` (PATCH `.../{id}/cerrar`), `getMisEncomiendas` (URL corregida `/condominios/{cid}/mis-encomiendas`), `getAccesosEncomiendas` (`/encomiendas/accesos`); **`getActivas` eliminado**
- `src/services/perfilService.js`: Added `actualizarMe()`
- `src/composables/useNotificaciones.js`: Fixed method calls, added condominioId; usa `getTodas`, `getSync` (polling 120s), `marcarLeida`, `marcarTodasLeidas`
- `src/services/notificacionesService.js`: `getTodas`, `getBadge`, `getSync`, `marcarLeida` (PATCH `.../{id}/leida`), `marcarTodasLeidas` (PATCH `.../todas-leidas`), `listarPlantillas`, `guardarPlantilla`, `restaurarPlantilla`
- `src/views/notificaciones/NotificacionesView.vue`: PrimeVue migration, field fixes
- `src/views/encomiendas/MisEncomiendasView.vue`: PrimeVue migration, field fixes
- `src/views/residente/PerfilView.vue`: PrimeVue migration, real API
- `src/views/residente/InicioView.vue`: Added console.error
- `src/components/stats/TarjetaEncomiendasPendientes.vue`: Reusable pending-packages count card — conteo solo vía SSE (`metricas.encomiendasPendientes`), seed desde `conteoInicial`, sin `GET /encomiendas/activas`
- `src/components/stats/TarjetaAccesosActivos.vue`: Reusable active-visits count card — conteo solo vía SSE (`metricas.visitasActivas`), seed desde `conteoInicial`, sin `GET /accesos/conteo-activos`
- `src/composables/useDashboardGuardia.js`: `encomiendasQuery` y `conteoActivosQuery` eliminados; `dashboardQuery` y `autorizacionesQuery` con `refetchIntervalMetrica` (sin polling con stream vivo; gracia 1 min / fallback 2 min); `dashboard = computed(() => dashboardQuery.data)` (sin fallback `?? []`)
- `src/services/visitasService.js`: `getConteoActivos` eliminado (sin callers)
- `src/views/dashboard/GuardiaDashboardView.vue`: indicador visual de conexión SSE (`estaVivo`) + `conteo-inicial` en tarjeta de accesos
- `src/utils/sseParser.js`: Pure incremental SSE frame parser (frames, multiline data, `:ping`, CRLF) — tested with Vitest
- `src/composables/__tests__/useMetricasTiempoReal.test.js`: prueba el sistema de respaldo con módulos reales + timers falsos — stream vivo sin polling, gracia de 1 min sin polling, fallback a 2 min tras la gracia, vuelve a SSE al reconectar, parpadeo breve no activa polling
- `src/services/dashboardStreamService.js`: SSE client via `fetch()` + `ReadableStream`, reconnect backoff, dedupe by condominio, `streamVivo` singleton ref
- `src/composables/useMetricasTiempoReal.js`: clave→queryKey registry + `refetchIntervalMetrica` (sin polling con stream vivo; gracia 1 min / fallback 2 min)
- `src/layouts/MainLayout.vue`: app-wide SSE mount via `watchEffect` (condominio + permiso `DASHBOARD_*`)
- `REQUERIMIENTOS_STATS_TIEMPO_REAL.md`: SSE requirements report for the backend team
- `docs/verificacion-sse-staging-prod.md`: Pending SSE verification checklist for staging/prod
- Backend controllers: `AccesoController`, `AutorizacionController`, `BitacoraController`, `EncomiendaController`, `MisEncomiendaController`, `UnidadController`, `VehiculoController`, `PersonaController`, `DashboardController`, `DashboardStreamController`, `ResidenteDashboardController`, `NotificacionController`, `MeController`
