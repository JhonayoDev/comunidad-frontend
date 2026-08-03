# Solicitud Backend — Notificaciones por contexto (residente / cargo)

**Versión:** 1.0
**Fecha:** 2026-08-03
**Audiencia:** Equipo backend (Spring Boot / `Notificacion`, `NotificacionController`, `SseNotificacionEventPublisher`)
**Estado:** Pendiente de análisis
**Relacionado:** `SOLICITUD_MOTOR_NOTIFICACIONES_V2.md` (motor de notificaciones), contexto dual residente/cargo (Fase 2 del frontend)

---

## 1. Contexto

El frontend implementa un **contexto dual**: un residente que además tiene cargos (ADMINISTRADOR, PRESIDENTE, TESORERO, SECRETARIO, DELEGADO) conserva su vista de residente y, además, tiene tarjetas para cada cargo. Al activar una tarjeta, el menú, el home y las vistas cambian a ese cargo.

Para que la campana de notificaciones **filtre por el contexto activo** y cada tarjeta de cargo muestre su **badge de no leídas**, el frontend necesita saber **a qué audiencia/cargo iba dirigida cada notificación**.

### Problema concreto

- `Notificacion` (entidad) solo guarda `destinatarioPersonaId` — **no guarda la audiencia destino** (persona, unidad, cargo, comité, etc.).
- `NotificacionResponse` no expone ese dato → el frontend no puede separar "notificaciones de residente" de "notificaciones del cargo".
- El stream SSE (`NotificacionStreamEvent`) solo trae `noLeidas` global, sin desglose por audiencia.
- Adicionalmente, `CondominioResumen.cargo` expone **un solo** cargo por condominio (el primero activo), por lo que un usuario con varios cargos no puede ver todas sus tarjetas.

---

## 2. Solicitud

### 2.1. Persistir la audiencia destino en cada notificación

Agregar a `notificaciones` la columna `audiencia` (`TipoAudiencia`), poblada en la creación a partir de la regla/evento que resolvió el destinatario (el mismo `DestinatarioResolver` que hoy entrega `destinatarioPersonaId` puede propagar la audiencia).

Ejemplo de valores: `PERSONA`, `UNIDAD`, `UNIDAD_OCUPANTES`, `UNIDAD_TITULAR`, `COMITE`, `GUARDIAS`, `ADMINISTRADORES`, `PROPIETARIOS`, `RESIDENTES`, `TODOS`.

Exponer el campo en `NotificacionResponse`:

```java
public record NotificacionResponse(
    UUID id,
    String tipo,
    String titulo,
    String mensaje,
    String tipoRecurso,
    UUID recursoId,
    String prioridad,
    boolean leido,
    String audiencia,          // NUEVO — TipoAudiencia que resolvió al destinatario
    LocalDateTime fechaCreacion,
    LocalDateTime fechaLectura) { ... }
```

### 2.2. Snapshot SSE con desglose por audiencia

Ampliar `NotificacionStreamEvent` para que el `SNAPSHOT_INICIAL` incluya `noLeidasPorAudiencia` (mapa `audiencia → conteo`), además del `noLeidas` global actual:

```json
{
  "tipoEvento": "SNAPSHOT_INICIAL",
  "condominioId": "uuid-del-condominio",
  "notificacionId": null,
  "noLeidas": 3,
  "noLeidasPorAudiencia": { "RESIDENTES": 1, "ADMINISTRADORES": 2, "COMITE": 0 },
  "timestamp": 1785539000000
}
```

El evento de cambio (`NOTIFICACION_CREADA`) puede seguir siendo liviano (solo `notificacionId`); la lista se lee por `GET /notificaciones/sync` (fuente de verdad), que ya devolverá `audiencia` por item tras el punto 2.1.

### 2.3. Endpoint de cargos de la persona

Crear `GET /api/v1/me/cargos?condominioId={id}` que devuelva **todos** los cargos activos de la persona en ese condominio (hoy `CondominioResumen.cargo` solo trae uno):

```json
{ "condominioId": "uuid", "cargos": ["ADMINISTRADOR", "PRESIDENTE"] }
```

Esto permite mostrar todas las tarjetas de cargo cuando una persona ocupa más de uno.

### 2.4. Push con distintivo por contexto

Con `audiencia` disponible, el frontend puede prefijar el título del push según el contexto (ej: `Presidente: El tesorero publicó los gastos comunes`). No requiere cambios en el backend de push (el `NotificacionResponse` ya entrega `titulo`/`mensaje`); el prefijo lo compone la app al mostrar.

---

## 3. Impacto en el frontend (una vez implementado)

- **Filtro por contexto:** la campana muestra solo las notificaciones cuya `audiencia` pertenece al contexto activo (residente → audiencias personales/residentes; cargo → su audiencia: `ADMINISTRADORES`, `COMITE`, `GUARDIAS`, etc.).
- **Badge por tarjeta:** cada tarjeta de cargo muestra el conteo de no leídas de su audiencia (`noLeidasPorAudiencia`).
- **Home/campana consistentes:** al activar el contexto de un cargo, el home y las notificaciones corresponden a ese cargo.
- **Multi-cargo:** con `GET /me/cargos` se renderizan todas las tarjetas.

---

## 4. Aceptación (criterios)

- [ ] `NotificacionResponse` incluye `audiencia` con el valor correcto para una notificación dirigida a `COMITE`/`ADMINISTRADORES`/`GUARDIAS`/persona.
- [ ] `GET /notificaciones/sync` devuelve `audiencia` por item.
- [ ] El `SNAPSHOT_INICIAL` del stream incluye `noLeidasPorAudiencia` sin romper el `noLeidas` global (compatibilidad con el frontend actual).
- [ ] `GET /me/cargos?condominioId=X` devuelve todos los cargos activos de la persona (lista).
- [ ] Una notificación para la audiencia `ADMINISTRADORES` llega a la conexión SSE de la persona con cargo ADMINISTRADOR (aislamiento por persona intacto).
