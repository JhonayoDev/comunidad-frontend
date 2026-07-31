# Solicitud Backend — Snapshot inicial de métricas al suscribirse al stream SSE

**Versión:** 1.1
**Fecha:** 2026-07-31
**Audiencia:** Equipo backend (Spring Boot / `DashboardStreamController`, `SseDashboardEventPublisher`)
**Estado:** ✅ **Implementado y verificado en backend** (informe de vuelta recibido el 2026-07-31)
**Relacionado:** `REQUERIMIENTOS_STATS_TIEMPO_REAL.md` (arquitectura SSE), `docs/verificacion-sse-staging-prod.md`

> **Actualización 1.1:** El backend implementó el cambio. Contrato emitido por el
> backend: evento `metrica` con `tipoEvento: "SNAPSHOT_INICIAL"` como primer
> frame en cada suscripción y reconexión, con las claves `visitasActivas`,
> `encomiendasPendientes` y `autorizacionesPendientes`. El frontend lo aplica
> transparentemente (mismo handler `metrica`, `tipoEvento` opaco). El frontend
> ya no resetea los conteos en la reconexión del mismo condominio: el snapshot
> los repuebla de inmediato.

---

## 1. Contexto

El stream `GET /api/v1/condominios/{condominioId}/dashboard/stream` hoy solo **publica métricas cuando ocurre un cambio** de dominio (ingreso/salida de acceso, encomienda recibida/entregada/cerrada, autorización creada).

Al suscribirse un cliente, **no se envía ningún evento hasta el primer cambio posterior**. El frontend rellena las tarjetas con el seed del snapshot (`GET /dashboard/guardia`), pero ese seed puede quedar **stale** si un cambio ocurrió entre el fetch del snapshot y el establecimiento de la conexión SSE (o en otra terminal).

### Problema concreto en el frontend

- `TarjetaAccesosActivos` y `TarjetaEncomiendasPendientes` muestran `conteoInicial` (seed del snapshot) hasta que llega el **primer evento SSE**.
- Si no ocurre ningún cambio después de la conexión, el valor mostrado es el del snapshot, que puede no coincidir con el conteo real del backend.
- Tras una **reconexión** (caída del stream), el frontend limpia los conteos previos y vuelve al seed; la reconciliación depende de un refetch del snapshot (ya implementado) **y** del siguiente evento de cambio.

---

## 2. Solicitud

**Al suscribir un nuevo `SseEmitter` (o al reconectar), el backend debe publicar inmediatamente un evento con los valores actuales de todas las claves de métrica registradas.**

### Contrato propuesto (reutiliza el payload existente)

Mismo formato de `DashboardMetricasEvent` — sin cambios de transporte ni del schema del frontend:

```
event: metrica
data: {"tipoEvento":"SNAPSHOT_INICIAL","condominioId":"...",
       "metricas":[
         {"clave":"visitasActivas","valor":7},
         {"clave":"encomiendasPendientes","valor":7},
         {"clave":"autorizacionesPendientes","valor":2}
       ],
       "timestamp": 1785539000000}
```

Puntos de decisión para el equipo backend:

1. **Lugar de emisión:** en `SseDashboardEventPublisher.suscribir(...)`, después de registrar el emitter — publicar un `DashboardMetricasEvent` con `tipoEvento = SNAPSHOT_INICIAL` y las tres claves actuales.
2. **Claves a incluir:** todas las que el dashboard operativo publica (`visitasActivas`, `encomiendasPendientes`, `autorizacionesPendientes`). Idealmente centralizadas en `DashboardMetricsEventHandler` (constantes existentes).
3. **Dónde leer los valores:** misma lógica que los handlers (`RegistroAccesoRepository.countByCondominioIdAndEstado`, `EncomiendaRepository.countByCondominioIdAndEstado`, `AutorizacionAccesoRepository.countByCondominioIdAndEstado`). Se recomienda un método único `SnapshotService.obtener(condominioId)` reutilizable.
4. **Alternativa (si se prefiere no recalcular en cada conexión):** un evento `event: snapshot` dedicado que el frontend trate igual que `metrica`. Cualquiera de las dos opciones es compatible con el frontend actual.

---

## 3. Impacto en el frontend (una vez implementado)

- Al recibir el snapshot, el frontend sobrescribe `metricas` con los valores frescos **inmediatamente**, sin esperar el primer evento de cambio (mejora UC-3 del informe de requerimientos).
- Las tarjetas pasan de "seed del snapshot" a "valor SSE real" en cuanto la conexión queda estable.
- No requiere cambios de código en el frontend: el payload `metrica` ya se parsea y aplica.

---

## 4. Aceptación (criterios)

- [ ] Al abrir `GET /dashboard/stream` con un token de GUARDIA/ADMIN, el cliente recibe un evento `metrica` (o `snapshot`) con las claves `visitasActivas`, `encomiendasPendientes`, `autorizacionesPendientes` en el primer frame, **antes** de cualquier evento de cambio.
- [ ] Los valores del snapshot coinciden con `GET /dashboard/guardia` (mismo `condominioId`).
- [ ] El snapshot no rompe la reconexión con backoff del frontend (es un evento más del stream).
- [ ] Heartbeat `:ping` se mantiene en paralelo.
