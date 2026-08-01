# Requerimientos — Estadísticas en Tiempo Real para Dashboards (SSE)

**Versión:** 1.0
**Fecha:** 2026-07-31
**Audiencia:** Equipo backend (Spring Boot 3 / Java 17) y frontend (Vue 3 + Pinia + PrimeVue + TanStack Query)
**Objetivo:** Eliminar el polling como estrategia principal de actualización de métricas en los dashboards de condominio y entregar actualizaciones en vivo, extensibles a más métricas.

---

## 1. Contexto y problema

Los dashboards del condominio muestran conteos operativos que hoy se actualizan por **polling**:

- **Guardia**: `TarjetaAccesosActivos` (visitas activas) usa `GET /accesos/conteo-activos` con `refetchInterval: 15s`. Encomiendas pendientes y autorizaciones pendientes se recalculan por refetch/invalidación.
- **Admin**: `DashboardAdminResponse` (totales, activosAhora, anuncios vigentes).

Costos: N requests constantes por pestaña abierta, latencia de hasta 15s, y no reacciona en vivo a cambios hechos desde otra terminal (ej. otro guardia registra una salida).

**Meta:** un canal *server → client* por condominio que notifique cambios de métricas al instante, **extensible** a más métricas (visitas, encomiendas, autorizaciones y las que vengan).

---

## 2. Estado actual del backend (capacidades)

### 2.1 Endpoints de stats existentes

| Endpoint | Responde | Nota |
|---|---|---|
| `GET /dashboard/guardia` | `DashboardGuardiaResponse` | `encomiendas` hardcodeado a `0` |
| `GET /dashboard/admin` | `DashboardAdminResponse` | `ModulosPendientes(0,0)` |
| `GET /dashboard/finanzas` | `DashboardFinanzasResponse` | |
| `GET /accesos/conteo-activos` | `{ activosAhora }` | Único endpoint liviano — creado para polling |
| `GET /encomiendas/activas` | `List` de `PENDIENTE` | Vista guardia, sin paginar |
| `GET /admin/metrics` | SaaS global | `SUPER_ADMIN`, no por condominio |

Todos los conteos son `COUNT` calculados al vuelo sobre repositorios.

### 2.2 Infraestructura asíncrona existente

- **`ApplicationEventPublisher` + `@Async @EventListener`** — patrón ya establecido (`VisitaEventHandler`, `EncomiendaEventHandler` → `NotificacionService` → `DespachadorNotificacion`).
- **Eventos de dominio actuales**: `AccesoIngresadoEvent`, `AutorizacionCreadaEvent`, `EncomiendaRecibidaAppEvent`, `EncomiendaEntregadaAppEvent`.
- **Web Push (RFC 8030)** funcional, pero **unidireccional al Service Worker**: el payload llega al SW y solo muestra notificación nativa; no hidrata la SPA abierta. No es un canal de datos.
- **No hay SSE ni WebSocket** (`spring-boot-starter-web`, MVC). `SseEmitter` está disponible sin dependencia nueva.

### 2.3 Gaps identificados (requieren trabajo en backend)

1. **No existe canal server→client en vivo** para datos de dashboard.
2. **Faltan eventos de dominio** para mutaciones que cambian las métricas:
   - `AccesoService.registrarIngreso` publica `AccesoIngresadoEvent` **solo si había autorización previa** — el ingreso "sin autorización" (caso común en portería) **no emite evento**.
   - `AccesoService.registrarSalida` **no publica ningún evento**. El `activosAhora` cambia en salida y nadie se entera.
   - `EncomiendaService.cerrar` no publica evento.
   - `EncomiendaRecibidaAppEvent` / `EntregadaAppEvent` existen ✓.
3. **Los eventos de encomienda no notifican a GUARDIAS** — audiencia `UNIDAD` (residentes), canales `IN_APP`+`EMAIL` (ni siquiera PUSH). El guardia nunca recibe push de encomiendas.
4. **`DashboardGuardiaResponse.encomiendas` hardcodeado a 0**.

---

## 3. Decisión de arquitectura

**SSE (Server-Sent Events) con `SseEmitter` de Spring MVC.**

| Criterio | SSE | WebSocket |
|---|---|---|
| Direccionalidad | 1-way (suficiente) | bidireccional (no necesario) |
| Dependencia nueva | Ninguna (`SseEmitter` en `spring-boot-starter-web`) | `spring-boot-starter-websocket` + STOMP |
| Reconexión | Nativa + `Last-Event-ID` | Manual |
| Complejidad | Baja | Alta |
| Proxy/render | Reintentos HTTP estándar | Upgrade + reenvío de headers |

### 3.1 Diseño del bus (extensible)

```
DashboardEventBus (singleton, @Component)
├── Map<condominioId, CopyOnWriteArraySet<SseEmitter>>   // por condominio
├── broadcast(UUID condominioId, DashboardUpdate update)
├── suscribir(UUID condominioId, SseEmitter) → registra + heartbeat
└── liberar(UUID condominioId, SseEmitter) → onCompletion/onTimeout

DashboardEventHandlers (@Async @EventListener sobre los eventos de dominio)
├── onAccesoIngresado / onAccesoFinalizado → broadcast(METRICA_VISITAS)
├── onEncomiendaRecibida / Entregada / Cerrada → broadcast(METRICA_ENCOMIENDAS)
└── onAutorizacionCreada → broadcast(METRICA_AUTORIZACIONES)
```

### 3.2 Contrato del mensaje SSE (versionado y extensible)

```json
{
  "tipoEvento": "ENCOMIENDA_ENTREGADA",
  "condominioId": "uuid-del-condominio",
  "metricas": [
    { "clave": "encomiendasPendientes", "valor": 4 },
    { "clave": "visitasActivas", "valor": 2 }
  ],
  "timestamp": 1754000000000
}
```

- El frontend mapea `clave → queryKey` de TanStack Query. Al llegar: `setQueryData` (conteos) o `invalidateQueries` (listas).
- **Agregar una métrica nueva =** el backend publica su evento de dominio con la `clave`; el frontend registra la entrada en su mapa. Sin cambios de transporte ni contrato.
- **Anti-patrón a evitar:** enviar el payload completo del recurso por SSE. Solo se anuncia qué cambió y el nuevo valor del conteo.

---

## 4. Requerimientos funcionales del frontend

### 4.1 Casos de uso

**UC-1 — Visitas activas en vivo** (`TarjetaAccesosActivos`)
Al registrar ingreso o salida desde cualquier terminal, todas las tarjetas abiertas actualizan `visitasActivas` al instante.

**UC-2 — Encomiendas pendientes en vivo** (`TarjetaEncomiendasPendientes`)
Al registrar/entregar/cerrar una encomienda, el conteo de pendientes se actualiza al instante. El SSE además corrige la omisión actual de notificación al guardia (gap §2.3-3).

**UC-3 — Hidratación inicial (snapshot + stream)**
Al abrir el dashboard: 1) `GET /dashboard/guardia` (snapshot), 2) abrir SSE para deltas. Si el snapshot llega después del primer evento, descartar deltas previos al `timestamp` del snapshot o refetchear al conectar.

**UC-4 — Reconexión y consistencia**
Si cae la conexión SSE: reconexión con backoff. Al reconectar (o en `retry`/timeout): **refetch del snapshot completo** para reconciliar deltas perdidos. Uso de `Last-Event-ID` si se desea reentregar desde el último evento.

**UC-5 — Extensión de métricas**
Agregar una métrica = registrar `{ clave: "autorizacionesPendientes", queryKey: ["autorizacionesPendientes", cid] }` en el mapa del composable. El backend agrega la `clave` al evento.

**UC-6 — Degradación elegante (fallback)**
Si SSE no está disponible (auth falla, proxy no lo soporta, navegador sin streaming): volver automáticamente al patrón actual (polling + `refetchOnWindowFocus` + invalidación por mutación). TanStack Query sigue siendo la fuente de verdad; SSE solo acelera. `refetchInterval` baja a un valor de respaldo (ej. 60s) mientras el stream esté vivo.

### 4.2 Diseño frontend propuesto

```
src/composables/useDashboardStream.js        // fetch-stream SSE, reconexión, fallback
src/services/dashboardStreamService.js       // gestión de conexión + parseo
src/composables/useMetricasTiempoReal.js     // registro clave → queryKey, aplica updates
src/components/stats/TarjetaAccesosActivos.vue        // adaptar para escuchar stream
src/components/stats/TarjetaEncomiendasPendientes.vue // espejo de la anterior
```

- `useDashboardStream` expone `conectado`, `ultimoEvento`, `reconectar()`; abre en `onMounted`, cierra en `onUnmounted`.
- `useMetricasTiempoReal` filtra por `condominioId` y aplica `setQueryData` / `invalidateQueries` según el tipo de métrica registrado.
- Las cards reutilizables (`variant: card|badge`, emiten `click`) se suscriben por su clave.

---

## 5. Requerimientos para el backend (por implementar)

1. **Eventos de dominio faltantes** (publicar siempre, no condicional):
   - `AccesoIngresadoEvent` → publicar **siempre**, no solo con autorización previa.
   - Nuevo `AccesoFinalizadoEvent` (salida) en `registrarSalida`.
   - Nuevo `EncomiendaCerradaEvent` en `cerrar`.
2. **`DashboardEventBus`**: registro/broadcast/liberación de emitters + heartbeat cada 15-30s (comentario `:ping`). Abstraer `broadcast` tras una interfaz para permitir Redis pub/sub en el futuro (multi-instancia).
3. **Handlers** `@Async @EventListener` que traducen eventos de dominio → `DashboardUpdate` y hacen `broadcast(condominioId, update)`.
4. **Endpoint** `GET /condominios/{condominioId}/dashboard/stream` (SSE) con `@PreAuthorize("hasPermission(null, 'DASHBOARD_GUARDIA')")` (o el del dashboard correspondiente).
5. **Config de proxy/render**: desactivar buffer de respuesta para SSE (flush por evento).

---

## 6. Plan de implementación conjunto

| Fase | Parte | Entregable |
|---|---|---|
| **F1** | Frontend (sin backend) | Cards reutilizables con `/encomiendas/activas` + polling smart. Arregla el bug del `PageResponse` en `useDashboardGuardia`. |
| **F2** | Backend | Eventos faltantes + `DashboardEventBus` + endpoint SSE + permiso. |
| **F3** | Frontend | `useDashboardStream` + `useMetricasTiempoReal` + integración TanStack + fallback. |
| **F4** | Ambos | Ampliar métricas (autorizaciones pendientes, etc.) y otros dashboards (admin/residente). |

---

## 7. Riesgos y consideraciones

- **Auth del stream**: `EventSource` no permite headers personalizados. **Decisión tomada:** cliente SSE vía `fetch()` + `ReadableStream` leyendo el body — mantiene `Authorization` en header, sin exponer el JWT en URL/logs.
- **Buffering del proxy/render**: requiere flush por evento y `Accept: text/event-stream`.
- **Múltiples instancias**: el bus en memoria no replica entre pods. Abstraer `broadcast` para Redis pub/sub (postergable).
- **Consistencia**: reconciliar con refetch al reconectar (UC-4).
- **Conexiones idle**: heartbeats y timeout razonable; limpieza de emitters muertos.

---

## 8. Estado de F1 (ejecutado)

- `src/services/encomiendasService.js`: `+ getActivas(cid)` → `GET /condominios/{cid}/encomiendas/activas`.
- `src/components/stats/TarjetaEncomiendasPendientes.vue`: card reutilizable (espejo de `TarjetaAccesosActivos`).
- `src/composables/useDashboardGuardia.js`: `encomiendasQuery` → `getActivas(cid)` + `refetchInterval` / `refetchOnWindowFocus`.
- `src/views/dashboard/GuardiaDashboardView.vue`: usa la nueva card y arregla la lista "Encomiendas pendientes".
- `src/composables/useEncomiendas.js`: invalida `encomiendasPendientes` al registrar/entregar.
