# Solicitud Backend — Stream SSE de encomiendas para el residente (mis-encomiendas en vivo)

**Versión:** 1.0
**Fecha:** 2026-08-01
**Audiencia:** Equipo backend (Spring Boot / `DashboardStreamController`, `SseDashboardEventPublisher`, `DashboardMetricsEventHandler`, `MetricasSnapshotService`)
**Estado:** Pendiente de implementación
**Relacionado:** `REQUERIMIENTOS_STATS_TIEMPO_REAL.md` (arquitectura SSE), `SOLICITUD_SNAPSHOT_INICIAL_SSE.md` (patrón de snapshot inicial ya implementado)

---

## 1. Contexto

El stream SSE actual `GET /api/v1/condominios/{condominioId}/dashboard/stream` es **exclusivo del dashboard operativo**:

- Exige `DASHBOARD_GUARDIA` o `DASHBOARD_ADMIN` (`DashboardStreamController`), por lo que un usuario con rol `RESIDENTE` **no puede suscribirse**.
- `encomiendasPendientes` es un conteo **global del condominio** (`countByCondominioIdAndEstado` en `MetricasSnapshotService`), no el de las unidades del residente.

En el frontend, la card `TarjetaEncomiendasResidente` (`src/components/encomiendas/`) muestra las encomiendas **PENDIENTES de las unidades del residente** desde `GET /mis-encomiendas`. Hoy solo refetchea al montar o al cambiar de condominio: si el guardia registra una encomienda para la unidad del residente mientras su pantalla está abierta, esta **no se actualiza en vivo**.

### Problema concreto

- El residente debe recargar la vista para ver una encomienda recién recibida.
- No existe canal server→client scoped por persona (el operativo es por condominio y no filtra por unidad).

---

## 2. Solicitud

**Nuevo endpoint SSE scoped al residente** que notifique cuando cambia la lista de encomiendas de las unidades del residente autenticado.

### Endpoint propuesto

```
GET /api/v1/condominios/{condominioId}/dashboard/residente/stream
@PreAuthorize("hasPermission(null, 'DASHBOARD_RESIDENTE')")
produces: text/event-stream
```

Mismo patrón que el stream operativo (`DashboardStreamController.stream`):

- Registro de un `SseEmitter` por conexión.
- Heartbeat `:ping` (~15-30s).
- Flush por evento y headers anti-buffer (`Cache-Control: no-cache`, `X-Accel-Buffering: no`).

### Filtrado por persona (scoping)

El backend ya resuelve las unidades del residente con `VinculoRepository.findByPersonaIdAndActivoTrue(...)` filtrado por condominio — el mismo patrón que usa `AutorizacionService.misAutorizaciones`. Se propone:

- El publisher mantiene emitters por `(condominioId, personaId)`.
- Al recibir `EncomiendaRecibidaAppEvent` (o `EncomiendaEntregadaAppEvent` / `EncomiendaCerradaEvent`), notificar **solo** a los emitters cuyo vínculo activo incluye la `unidadId` del evento.

### Contrato del evento

Reutilizar el payload existente del stream operativo (evento `metrica`), sin cambios de transporte:

**Variante A — señal + invalidación (recomendada):**

```
event: metrica
data: {"tipoEvento":"ENCOMIENDA_RECIBIDA","condominioId":"...",
       "unidadId":"...","unidadNumero":"...","encomiendaId":"...",
       "timestamp":1785539000000}
```

- El frontend, al recibirlo, **invalida** `["misEncomiendas", cid]` y refetchea `GET /mis-encomiendas`.
- Alineado con el anti-patrón del informe de requerimientos (§3.2: *no enviar el payload completo del recurso por SSE; solo anunciar qué cambió*).
- Misma mecánica que `ENCOMIENDA_ENTREGADA` / `ENCOMIENDA_CERRADA` para quitar ítems de la lista.

**Variante B — con resumen (sin refetch):**

```
data: {"tipoEvento":"ENCOMIENDA_RECIBIDA","condominioId":"...",
       "encomienda": { ...campos de EncomiendaResumenResponse... },
       "timestamp":1785539000000}
```

- El frontend antepone el ítem al estado local con `setQueryData` (sin refetch).
- Más fluido, pero el evento transporta datos de la entidad (duplica el mapeo) y hay que lidiar con el desorden de lista (la API ordena por fecha).

**Recomendación:** implementar la **Variante A**. Es la de menor superficie y la más consistente con `mis-encomiendas` como única fuente de verdad.

### Snapshot inicial (recomendado)

Al suscribir, emitir un `SNAPSHOT_INICIAL` con el conteo de pendientes del residente (mismo patrón ya implementado en `SOLICITUD_SNAPSHOT_INICIAL_SSE.md`), o simplemente invalidar la query al conectar. Evita que la card quede stale entre el fetch del snapshot y el primer evento.

---

## 3. Impacto en el frontend (una vez implementado)

- **`MainLayout.vue`**: ampliar el `watchEffect` actual (hoy conecta el stream solo con `DASHBOARD_GUARDIA`/`DASHBOARD_ADMIN`) para también conectar cuando el permiso sea `DASHBOARD_RESIDENTE`, usando el stream nuevo.
- **`useMetricasTiempoReal.js`** (o un composable nuevo `useMisEncomiendasTiempoReal.js`): registrar el evento `ENCOMIENDA_RECIBIDA/ENTREGADA/CERRADA` → invalidar `["misEncomiendas", cid]`.
- **`TarjetaEncomiendasResidente.vue`**: migrar a `useQuery(["misEncomiendas", cid])` para que la invalidación la refetchee. Con stream vivo NO hay polling (SSE fuente primaria); si el stream cae, aplicar el mismo patrón de gracia (1 min) + fallback (2 min) que el dashboard operativo.
- **Fallback**: si el residente no tiene el permiso (o el stream falla), la card mantiene su fetch on-mount actual.

---

## 4. Aceptación (criterios)

- [ ] `GET /condominios/{cid}/dashboard/residente/stream` con token `RESIDENTE` abre la conexión y recibe `:ping` (heartbeat) sin eventos de cambio.
- [ ] El guardia registra una encomienda para la unidad X → el residente vinculado a X recibe `ENCOMIENDA_RECIBIDA`; un residente **no** vinculado a X **no** lo recibe.
- [ ] El frontend refetchea `mis-encomiendas` y la card muestra la encomienda al instante (y la quita al entregar/cerrar).
- [ ] Aislamiento total: los eventos del stream operativo (guardia/admin) no se mezclan con los del stream del residente.
- [ ] El snapshot inicial (si se implementa) entrega el conteo correcto al conectar/reconectar.

---

## 5. Alternativas descartadas

- **Extender el stream operativo para aceptar `DASHBOARD_RESIDENTE`**: no sirve — su métrica `encomiendasPendientes` es un conteo global del condominio, no el de las unidades del residente.
- **Polling en el frontend**: posible hoy, pero no es "en vivo"; esta solicitud busca el mismo nivel de actualización instantánea que ya tiene el dashboard del guardia.
