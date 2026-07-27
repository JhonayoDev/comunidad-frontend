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
- **`useNotificaciones.js`**: corregido — usa `getTodas(condominioId)`, `marcarLeida(condominioId, notif.id)`, `marcarTodasLeidas(condominioId)`, obtiene `condominioId` del authStore
- **`RegistrarVisitaView`**: `tipo` usa enum API (`VISITA`, `DELIVERY`, `UBER`, `SERVICIO`, `TECNICO`, `OTRO`); campo `nombreVisitante`; single `unidadId`; eliminado `buscarFrecuente`
- **`EncomiendasView`**: formulario usa `tipo` (CARTA/ENCOMIENDA) + `nombreDestinatario`; entregar pide `nombreRetira` + `rutRetira`;
- **`useEncomiendas`**: `entregar(encomienda, nombreRetira, rutRetira)` envía body al backend
- **`useVisitas`**: `registrarSalida` setea `visita.estado = "FINALIZADO"` y `visita.fechaSalida`
- **`PortonView`**: migrado de `consulta-rapida` a `GET /vehiculos` + filtro local por patente + migrado a PrimeVue
- **`VisitasView`**: template usa `nombreVisitante`, `patenteVisitante`, `tipo`, `fechaIngreso`, `fechaSalida`, `estado`; migrado a PrimeVue
- **`GuardiaDashboardView`**: movimientos usan `nombre`, `unidad`, `fecha`; agregados `console.error` en catch blocks
- **`BitacoraView`**: `registradoPorNombre` (no `realizadoPorNombre`), `registradoEn` (no `realizadoEn`); agregados `console.error`
- **`AutorizacionesView`**: `tipoLabels` coincide con enum API; reemplazado `creadoPorNombre` por `createdAt/fechaInicio`; agregado `console.error`
- **`InicioView (residente)`**: encomiendas usa `tipo`, `nombreDestinatario`, `creadoEn`; agregado `console.error`
- **`NotificacionesView`**: migrado a PrimeVue; usa `notif.id` (no `notificacionId`); pasa `condominioId` en llamadas API
- **`MisEncomiendasView`**: migrado a PrimeVue; usa `tipo`, `nombreDestinatario`, `unidadNumero`, `creadoEn`; pasa `condominioId`
- **`PerfilView`**: migrado a PrimeVue + `<Password>`; usa `perfilService.actualizarMe({nombre, telefono})` real; carga perfil de `GET /me`
- Agregados `console.error` en catch blocks de todas las vistas
- Corregido bug de loading infinito en `cargarUnidades()` (resuelve spinner cuando `!cid`)
- Build pasa con `pnpm build`

## Blocked
- **SolicitudesView**: no existe `SolicitudesController` en el backend — llama a `/condominios/{cid}/solicitudes-registro` que devuelve 404
- **consulta-rapida**: no existe endpoint de búsqueda por patente en `VehiculoController` (solo `GET /vehiculos` que lista todos)

## Key Decisions
- Eliminar todos los datos mock porque confundían la depuración — ahora el error real se ve en la consola del navegador
- PortonView usa `GET /vehiculos` + filtro local en vez de un endpoint específico de consulta
- `useEncomiendas.entregar()` ahora recibe `nombreRetira` y `rutRetira` como parámetros obligatorios
- Eliminado `buscarFrecuente()` de `RegistrarVisitaView` porque el backend no expone `GET /accesos/frecuentes`
- Las categorías de tipo de acceso ahora coinciden exactamente con el enum `TipoAutorizacion` del backend
- `useNotificaciones` ahora obtiene `condominioId` desde `authStore` internamente

## Next Steps
- Verificar que todas las vistas funcionan contra la API real
- Solicitar al backend: crear `SolicitudesController` para `/condominios/{cid}/solicitudes-registro`
- Solicitar al backend (mejora): crear endpoint `GET /condominios/{cid}/vehiculos/consulta-rapida?patente=X`
- Migrar vistas legacy que aún usan daisyUI (`GestionesView`, `EncomiendasView`, `SolicitudesView`, `RegistrarVisitaView`) a PrimeVue

## Critical Context
- Backend en `/home/jhonayo/dev/projects/portfolio/comunidad/` — NO modificar
- `TipoAutorizacion` enum: `VISITA`, `DELIVERY`, `UBER`, `SERVICIO`, `TECNICO`, `OTRO`
- `TipoEncomienda` enum: `CARTA`, `ENCOMIENDA`
- `EstadoAcceso` enum: `ACTIVO`, `FINALIZADO`, `RECHAZADO`
- `TipoEventoBitacora` enum: `TURNO_INICIO`, `TURNO_FIN`, `COLACION_SALIDA`, `COLACION_REGRESO`, `NOVEDAD`
- `ClasificacionBitacora` enum: `INFO`, `NORMAL`, `URGENTE`, `EMERGENCIA`
- `DashboardGuardiaResponse` record: `condominio`, `totalUnidades`, `residentesActivos`, `accesos` (con `activosAhora` + `ultimosMovimientos`), `encomiendas`
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
- `src/services/encomiendasService.js`: Fixed `getMisEncomiendas` URL
- `src/services/perfilService.js`: Added `actualizarMe()`
- `src/composables/useNotificaciones.js`: Fixed method calls, added condominioId
- `src/views/notificaciones/NotificacionesView.vue`: PrimeVue migration, field fixes
- `src/views/encomiendas/MisEncomiendasView.vue`: PrimeVue migration, field fixes
- `src/views/residente/PerfilView.vue`: PrimeVue migration, real API
- `src/views/residente/InicioView.vue`: Added console.error
- Backend controllers: `AccesoController`, `AutorizacionController`, `BitacoraController`, `EncomiendaController`, `MisEncomiendaController`, `UnidadController`, `VehiculoController`, `PersonaController`, `DashboardController`, `ResidenteDashboardController`, `NotificacionController`, `MeController`
