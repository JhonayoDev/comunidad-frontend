# Verificación SSE — Dashboard en Tiempo Real (Staging / Prod)

**Estado:** ⏳ PENDIENTE — se ejecuta cuando el backend con `DashboardStreamController` esté desplegado en staging y prod.
**Versión frontend relacionada:** F3 (integración SSE completa, build OK).
**Contrato de referencia:** `REQUERIMIENTOS_STATS_TIEMPO_REAL.md`.

---

## 1. Contexto

El frontend ya consume el stream SSE de métricas del dashboard operativo:

- **Endpoint:** `GET {VITE_API_URL}/condominios/{condominioId}/dashboard/stream` (`text/event-stream`)
- **Auth:** `Authorization: Bearer <JWT>` + permiso `DASHBOARD_GUARDIA` o `DASHBOARD_ADMIN`
- **Cliente:** `src/services/dashboardStreamService.js` (fetch + ReadableStream), reconexión con backoff 1s→30s
- **Integración:** `src/composables/useMetricasTiempoReal.js` (clave → queryKey) montado app-wide en `MainLayout.vue`
- **Fallback:** con stream vivo **no hay polling** (el SSE es la fuente primaria). Si el stream cae, hay una gracia de 1 min sin polling (le da tiempo a la reconexión con backoff) y solo si sigue caído el polling de respaldo sube a 2 min.
- **Conteo de encomiendas:** la tarjeta lee `metricas.encomiendasPendientes` (SSE); la lista completa `GET /encomiendas/activas` ya NO se pide desde el dashboard del guardia. Antes del primer evento se siembra desde `dashboard.encomiendas` (snapshot real del backend).
- **Stale-safety:** `metricas` se limpia SOLO al cambiar de condominio. En la reconexión del MISMO condominio NO se resetea (el backend envía `SNAPSHOT_INICIAL` como primer frame y repuebla al instante); un valor SSE viejo nunca enmascara el seed porque el snapshot llega primero. Al reconectar también se invalida `["dashboardGuardia", cid]` para reconciliar el seed con el snapshot.

Esta prueba verifica que el backend desplegado cumple el contrato y que el flujo completo (evento → tarjeta actualizada) funciona en staging y prod.

---

## 2. Precondiciones

- [ ] Backend con `DashboardStreamController`, `SseDashboardEventPublisher` y `DashboardMetricsEventHandler` desplegado en el ambiente.
- [ ] Endpoint expuesto sin buffering por el proxy (ver §4.4).
- [ ] Existe un condominio con usuario de prueba que tenga permiso `DASHBOARD_GUARDIA` o `DASHBOARD_ADMIN`.
- [ ] Obtener un `ACCESS_TOKEN` válido (login normal desde la app o `/auth/refresh`).

---

## 3. Contrato esperado (resumen)

Heartbeat:

```
:ping   ← cada ~15s (default app.dashboard.sse.heartbeat-ms)
```

Evento de métricas:

```
event: metrica
data: {"tipoEvento":"ENCOMIENDA_RECIBIDA","condominioId":"<uuid>","metricas":[{"clave":"encomiendasPendientes","valor":4}],"timestamp":1754000000000}
```

Claves soportadas: `visitasActivas`, `encomiendasPendientes`, `autorizacionesPendientes`.

Headers de respuesta esperados: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`.

---

## 4. Pasos de verificación

### 4.1 Endpoint disponible

```bash
curl -sS -N \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: text/event-stream" \
  "https://<URL>/api/v1/condominios/<CONDOMINIO_ID>/dashboard/stream"
```

**Esperado:** conexión abierta que no termina; dentro de ~15s aparece `:ping`. Cerrar con Ctrl+C.

### 4.2 Autenticación y permisos

| Caso | Comando | Esperado |
|---|---|---|
| Sin token | `curl -sS -N "…/stream"` | `401` |
| Token sin permiso `DASHBOARD_*` | con token de un residente | `403` |
| Token con permiso | con token de guardia/admin | conexión abierta |

### 4.3 Eventos reales (disparados desde otra terminal)

Con el `curl` del §4.1 corriendo, desde la app (u otro `curl`):

1. Registrar ingreso de visita → `event: metrica` con `visitasActivas`.
2. Registrar salida → `visitasActivas` baja.
3. Registrar encomienda → `encomiendasPendientes` sube.
4. Entregar encomienda → `encomiendasPendientes` baja.

**Esperado:** cada acción dispara un frame `metrica` en < 2s tras el commit.

### 4.4 Streaming real (no buffering del proxy)

- Los `:ping` deben llegar **individualmente** cada ~15s (si llegan en ráfagas acumuladas, el proxy está bufferizando).
- Los eventos `metrica` deben aparecer al instante, no agrupados en el próximo heartbeat.
- Si hay Nginx/Render en el medio, confirmar flush por evento. El backend ya envía `X-Accel-Buffering: no`.

### 4.5 Multi-tenant (filtro por condominio)

- Abrir el stream de dos condominios distintos (dos tokens/tabs).
- Disparar una acción en el condominio A.
- **Esperado:** solo el stream de A recibe el evento; el de B solo recibe `:ping`.

### 4.6 E2E en la app (criterio principal de aceptación)

1. Abrir el dashboard de Guardia con dos pestañas.
2. Desde la pestaña 2, registrar un ingreso de visita.
3. **Esperado:** `TarjetaAccesosActivos` de la pestaña 1 actualiza el conteo en < 2s (sin recargar).
4. Repetir con encomienda (`TarjetaEncomiendasPendientes`).
5. Abrir DevTools → Network → filtrar `stream` → confirmar conexión `text/event-stream` viva, y `streamVivo=true` en consola (`[dashboardStreamService]` logs de reconexión solo si cae).

### 4.7 Reconexión y consistencia (UC-4)

1. Con el stream vivo, cortar la red (o detener el proceso backend del stream) ~20s.
2. **Esperado:** logs `[dashboardStreamService] Reconectando…` con backoff (1s, 2s, 4s… máx 30s), y al reconectar las queries registradas hacen refetch del snapshot (se reconcilian deltas perdidos), incluyendo `["dashboardGuardia", cid]` para renovar el seed de las cards.
3. Restaurar red → el stream vuelve y el polling de respaldo se desactiva (`refetchIntervalMetrica` = sin polling).

> **Stale-safety:** tras una reconexión las cards muestran el seed del snapshot (no el último valor SSE) hasta que llega el primer evento fresco. Verificar con un tab cargado antes de una caída: el conteo de encomiendas no debe quedarse congelado en un valor viejo (p. ej. `0`).

### 4.8 Fallback (UC-6)

- Desactivar el permiso `DASHBOARD_*` del usuario (o forzar 403 en el stream).
- **Esperado:** durante la **gracia de 1 min** la app NO hace polling (le da tiempo a la reconexión con backoff de recuperarse sola); si el stream sigue caído pasada la gracia, degrada a **polling de respaldo de 2 min** (`refetchIntervalMetrica` = 120s) solo para `autorizacionesPendientes` y el snapshot del dashboard, sin errores visibles al usuario. El conteo de visitas y de encomiendas queda congelado en el último valor SSE hasta que el stream vuelva (no hay endpoints livianos de conteo); su valor inicial se siembra desde el snapshot (`dashboard.accesos.activosAhora` y `dashboard.encomiendas` respectivamente).

### 4.9 Sin polling con stream vivo (control de tráfico)

- Con el dashboard del guardia abierto y el stream SSE conectado, en DevTools → Network dejar el filtro de requests **sin actividad durante ~90s**.
- **Esperado:** NO aparecen requests de `conteo-activos` ni `encomiendas/activas` en reposo; solo la conexión `stream` viva. El conteo de visitas y de encomiendas se actualiza únicamente por SSE.

---

## 5. Criterios de aceptación

| # | Criterio | ¿Cumple? |
|---|---|---|
| A | `curl` del §4.1 se mantiene abierto con `:ping` cada ~15s | ☐ |
| B | 401 sin token / 403 sin permiso `DASHBOARD_*` | ☐ |
| C | Cada ingreso/salida/encomienda dispara `event: metrica` con la clave correcta en < 2s | ☐ |
| D | Los eventos fluyen individualmente (sin buffering del proxy) | ☐ |
| E | Los eventos llegan SOLO al condominio correspondiente (§4.5) | ☐ |
| F | La tarjeta de visitas/encomiendas se actualiza en < 2s en otra pestaña (§4.6) | ☐ |
| G | Reconexión con backoff y refetch del snapshot al reconectar (§4.7) | ☐ |
| H | Con stream caído, la app respeta la gracia de 1 min y degrada a polling de 2 min sin romperse (§4.8) | ☐ |
| I | En reposo con stream vivo no hay polling de métricas (§4.9) | ☐ |
| J | Un valor SSE viejo (p. ej. `0` de antes de existir datos) no enmascara el seed: tras reconectar, las cards muestran el snapshot hasta el primer evento (§4.7) | ☐ |

---

## 6. Si algo falla — qué capturar

- Payload del `curl` crudo (§4.1–4.3): frames exactos recibidos.
- DevTools → Network → respuesta del `stream`: `Content-Type`, headers de cache/buffering, timing.
- Consola del navegador: logs `[dashboardStreamService]` y `[useMetricasTiempoReal]` (métricas desconocidas aparecen como `métrica SSE desconocida`).
- Estado del backend: logs de `SseDashboardEventPublisher` (debug) y de `DashboardMetricsEventHandler`.
- Indicar ambiente (staging/prod), fecha/hora y token de prueba (o condominio de prueba).

---

## 7. Estado por ambiente

| Ambiente | URL esperada | Estado |
|---|---|---|
| Staging | `https://apicomunidad.ideaspace.dpdns.org/api/v1` | ⏳ pendiente |
| Prod | por definir | ⏳ pendiente |
