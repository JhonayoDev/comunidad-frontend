# Solicitud Backend — Motor de Notificaciones V2 (fix, audiencias granulares, stream SSE)

**Versión:** 1.0
**Fecha:** 2026-08-01
**Audiencia:** Equipo backend (Spring Boot / `comunicacion`, `dashboard`, `vinculo`, `infrastructure.web`)
**Estado:** Pendiente de implementación
**Relacionado:** `REQUERIMIENTOS_STATS_TIEMPO_REAL.md` (arquitectura SSE), `SOLICITUD_STREAM_ENCOMIENDAS_RESIDENTE.md` (patrón de stream scoped por persona ya implementado), `verificacion-sse-staging-prod.md`

---

## 1. Contexto

El motor de enrutamiento de notificaciones ya existe y está operativo:

- **Catálogo global** (`CatalogoReglasNotificacion`): 16 reglas por `TipoNotificacion` con `audiencia`, `canales`, `prioridad`, `esObligatoria`.
- **Sobrescrituras por condominio** (`reglas_notificacion_condominio`): CRUD en `PUT /personal/reglas-notificacion/{tipo}`, campos `audiencia` / `canales` / `prioridad` / `habilitada` (null = usar default global).
- **`DestinatarioResolver`**: traduce `TipoAudiencia` a personaIds reales (`PERSONA`, `UNIDAD`, `COMITE`, `GUARDIAS`, `ADMINISTRADORES`, `PROPIETARIOS`, `RESIDENTES`, `TODOS`).
- **Preferencias por usuario** (`PreferenciaNotificacion`): toggle `enApp` / `email` / `push` por persona×tipo; ignoradas si la regla es obligatoria.
- **Canales**: `IN_APP`, `EMAIL` (vía `EmailSender`), `PUSH`; entrega por persona en `despachador.despachar()`.
- **Frontend**: `ReglasNotificacionView.vue` ya consume `/personal/reglas-notificacion` y `reglasCatalogo.js` refleja el catálogo.

Esta solicitud cierra cuatro brechas detectadas en revisión profunda del backend:

### Brecha 1 — Bug: las sobrescrituras por condominio NO se aplican al envío real

`NotificacionService.procesarEvento` (`NotificacionService.java:89`) llama:

```java
ReglaNotificacion regla = catalogo.obtener(solicitud.getTipo()); // ← sin condominioId
```

pero el catálogo ya ofrece la variante correcta `obtener(tipo, condominioId)` que aplica la sobrescritura del condominio. **Consecuencia**: si un admin deshabilita EMAIL para encomiendas en su condominio, la regla global `ENCOMIENDA_RECIBIDA → [IN_APP, EMAIL, PUSH]` sigue rigiendo el envío real. Además `obtener(tipo, condominioId)` retorna `null` cuando `habilitada = false`, y `procesarEvento` desreferencia `regla.audiencia()` → NPE. El contrato en el propio catálogo (líneas 24-26) dice: *"Los handlers de eventos que conocen el condominioId deben llamar a obtener(TipoNotificacion, UUID)."*

### Brecha 2 — Faltan audiencias granulares para "residentes actuales" y "titular"

El modelo `VinculoPersonaUnidad` ya distingue:
- `esOcupante` (vive físicamente en la unidad),
- `recibeNotificaciones` (opt-in por persona-unidad),
- `tipo` (`PROPIETARIO | ARRENDATARIO | RESIDENTE_ADICIONAL`),
- `activo` y `fechaFin` (null = vínculo vigente).

Pero las audiencias existentes para notificaciones son toscas:
- `UNIDAD` (`findPersonaIdsParaNotificarPorUnidad`) filtra `activo + recibeNotificaciones` pero **incluye propietarios que no viven ahí** (no exige `esOcupante`).
- `RESIDENTES` exige `esOcupante` pero es por condominio (todas las unidades), no por unidad.

El negocio necesita: *"encomienda solo a los que viven en la casa, no al propietario no residente"* y *"en casa X, solo al arrendatario/propietario residente; en otras, también a los adicionales"*.

### Brecha 3 — No hay stream SSE de notificaciones

Hoy la bandeja se mantiene con polling `GET /notificaciones/sync` (120s fijo en el frontend). Existen ya dos buses SSE independientes (operativo `dashboard/stream`, residente `dashboard/residente/stream`), ambos scoped y verificado su patrón en producción dev. Falta el equivalente para la bandeja del usuario autenticado.

### Brecha 4 — El stream SSE del residente no filtra por `esOcupante` / `recibeNotificaciones`

`ResidenteEncomiendasEventHandler.notificar` usa `findPersonaIdsByUnidadIdAndCondominioIdAndActivoTrue` (solo `activo`) → un propietario no residente vinculado a la unidad recibe la señal SSE de "mis encomiendas" aunque no deba. Incoherente con las audiencias de notificaciones y con el flag `recibeNotificaciones`.

---

## 2. Solicitud

### 2.1 Fix de `NotificacionService.procesarEvento`

**Archivo:** `domain/comunicacion/service/NotificacionService.java:89`

- Cambiar `catalogo.obtener(solicitud.getTipo())` por `catalogo.obtener(solicitud.getTipo(), solicitud.getCondominioId())`.
- Manejar `regla == null` (sobrescritura con `habilitada = false`): loguear y retornar sin generar (no NPE).
- Verificar que `AUDIENCIAS_INSTITUCIONALES` y `resolverCanalesEfectivos` usen la regla efectiva (ya la reciben por parámetro).

**Impacto:** el admin recupera control real sobre canales/audiencia por condominio; se elimina el NPE al deshabilitar un tipo.

### 2.2 Audiencias granulares nuevas

**Archivo:** `domain/comunicacion/entity/TipoAudiencia.java` + `DestinatarioResolver` + `VinculoPersonaUnidadRepository`

Agregar dos valores al enum:

```java
/** Ocupantes actuales de una unidad concreta (esOcupante = true, activo, recibeNotificaciones). */
UNIDAD_OCUPANTES,

/** Titular de la unidad (PROPIETARIO o ARRENDATARIO, excluye RESIDENTE_ADICIONAL). */
UNIDAD_TITULAR,
```

Nuevas queries en `VinculoPersonaUnidadRepository` (mismo estilo de las proyecciones de notificación existentes):

```java
@Query("SELECT v.persona.id FROM VinculoPersonaUnidad v " +
    "WHERE v.unidad.id = :unidadId AND v.esOcupante = true AND v.activo = true AND v.recibeNotificaciones = true")
List<UUID> findPersonaIdsParaNotificarOcupantesPorUnidad(@Param("unidadId") UUID unidadId);

@Query("SELECT v.persona.id FROM VinculoPersonaUnidad v " +
    "WHERE v.unidad.id = :unidadId AND v.tipo IN ('PROPIETARIO','ARRENDATARIO') AND v.activo = true AND v.recibeNotificaciones = true")
List<UUID> findPersonaIdsParaNotificarTitularesPorUnidad(@Param("unidadId") UUID unidadId);
```

Casos en `DestinatarioResolver`:
- `UNIDAD_OCUPANTES` → `findPersonaIdsParaNotificarOcupantesPorUnidad(contexto.getUnidadId())`.
- `UNIDAD_TITULAR` → `findPersonaIdsParaNotificarTitularesPorUnidad(contexto.getUnidadId())`.
- Ambos requieren `contexto.getUnidadId()` (como `UNIDAD` hoy): loguear warning y retornar `List.of()` si falta.

Nota: las reglas globales del catálogo se pueden ajustar a estas audiencias (p.ej. `ENCOMIENDA_RECIBIDA` → `UNIDAD_OCUPANTES`) sin romper nada, ya que la sobrescritura por condominio gana.

### 2.3 PATCH de `recibeNotificaciones` por vínculo (toggle del CRM)

**Nuevo endpoint** en el controller de vínculos (donde viva el CRUD de `vinculos_persona_unidad`), scoped por condominio:

```
PATCH /api/v1/condominios/{condominioId}/vincular-persona-unidad/{vinculoId}/recibe-notificaciones
Body: { "recibeNotificaciones": boolean }
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRADOR')")
```

- Valida que el vínculo pertenezca al condominio (`condominio.id == condominioId`).
- Persiste el flag y retorna el vínculo actualizado (o 204).
- Propósito: la vista CRM "Unidades y Personas" del frontend permite al admin decidir quién recibe notificaciones por casa.

### 2.4 Stream SSE de notificaciones (scoped por persona)

Nuevo bus en memoria, espejo de `SseResidenteEventPublisher` pero para la bandeja:

```
GET /api/v1/condominios/{condominioId}/notificaciones/stream
@PreAuthorize("hasPermission(null, 'NOTIFICACION_VER')")
produces: text/event-stream
```

- `condominioAccessService.validarAcceso(usuario, condominioId)` + scoping por `(condominioId, personaId)`.
- Heartbeat `:ping` (~15s), timeout 30 min, callbacks de limpieza, headers anti-buffer (mismo patrón de los streams existentes).
- **Snapshot mínimo y seguro**: el primer frame es solo el conteo de no leídas (decidido con el frontend — la lista se lee por REST `/sync`, nunca por SSE, para no exponer contenido sensible en el stream):

```
event: notificacion
data: {"tipoEvento":"SNAPSHOT_INICIAL","condominioId":"...","noLeidas":2,"notificacionId":null,"timestamp":...}
```

- **Evento de cambio**: señal de invalidación con el id, sin payload del recurso (mismo anti-patrón de los streams existentes: no transportar la entidad por SSE):

```
event: notificacion
data: {"tipoEvento":"NOTIFICACION_CREADA","condominioId":"...","notificacionId":"uuid","noLeidas":null,"timestamp":...}
```

- **Emisión**: publicar la señal tras `notificacionRepository.save(notificacion)` en `procesarEvento` (mismo ciclo de vida: el handler escucha un evento de dominio publicado AFTER_COMMIT o se invoca directamente desde el service; si se usa un `@TransactionalEventListener`, respetar `@Async` como los handlers de dashboard).
- **Scoping**: el destinatario de la notificación es `personaId`; notificar SOLO al suscriptor `(condominioId, personaId)` de esa notificación. Aislamiento total por persona.

### 2.5 Alinear el stream SSE del residente con la audiencia real

**Archivo:** `domain/dashboard/service/ResidenteEncomiendasEventHandler.java:90-95`

Cambiar la resolución de destinatarios de `findPersonaIdsByUnidadIdAndCondominioIdAndActivoTrue` a una query que filtre también `esOcupante = true` (vive en la unidad). Mantener el mismo condominio como restricción adicional:

```java
@Query("""
    SELECT DISTINCT v.persona.id FROM VinculoPersonaUnidad v
    WHERE v.unidad.id = :unidadId
      AND v.condominio.id = :condominioId
      AND v.activo = true
      AND v.esOcupante = true
    """)
Set<UUID> findPersonaIdsOcupantesByUnidadIdAndCondominioIdAndActivoTrue(...)
```

(La query existente se conserva para otros callers si la tiene; el handler del residente usa la nueva.)

### 2.6 Deprecar endpoints muertos (solo anotación, sin borrado)

- `GET /accesos/conteo-activos` — sin callers en el frontend (la tarjeta de visitas es 100% SSE).
- `GET /encomiendas/activas` — sin callers (la lista pendiente se eliminó del dashboard del guardia).
- `GET /notificaciones/badge` — **mantenerlo vivo** (el frontend lo usa como fallback del App Badge nativo vía PushManager). Solo documentar que es deprecado para polling periódico (ya está anotado en el controller); no remover.

---

## 3. Impacto en el frontend (una vez implementado)

- **`MainLayout.vue`**: conectar el stream de notificaciones cuando el usuario tenga `NOTIFICACION_VER` (independiente de los streams de dashboard; mismo `watchEffect` de condominio).
- **`notificacionesStreamService.js`** (nuevo): cliente SSE scoped por persona, mismo transporte/backoff que `residenteStreamService.js`.
- **`useNotificacionesTiempoReal.js`** (nuevo): registrar `NOTIFICACION_CREADA` → invalidar la query del badge; `SNAPSHOT_INICIAL` siembra `noLeidas`. `useNotificaciones` pasa de `refetchInterval: 120000` fijo a reactivo (vivo sin polling; caída → gracia 1 min → fallback 2 min).
- **`ReglasNotificacionView.vue`**: añadir editor de `audiencia` (hoy el Select solo muestra) y `prioridad`, usando las audiencias nuevas.
- **Vista CRM "Unidades y Personas"** (nueva, `SUPER_ADMIN/ADMINISTRADOR`): tabla unidades → personas con `tipo`, `esOcupante`, `recibeNotificaciones` (toggle → PATCH 2.3), `activo`.
- **`PerfilView.vue`**: añadir toggle `push` en preferencias (hoy solo `enApp`/`email`).
- Limpiar métodos muertos de services (`getActivas`, `getConteoActivos` ya fuera; quitar referencias a los endpoints deprecados).

---

## 4. Aceptación (criterios)

- [ ] Un admin deshabilita EMAIL para `ENCOMIENDA_RECIBIDA` en su condominio → el envío real NO manda email (verificable en `entregas_notificacion`); el resto de condominios mantiene el global.
- [ ] `habilitada = false` en una sobrescritura no lanza NPE y no genera notificaciones para ese tipo.
- [ ] `UNIDAD_OCUPANTES`: con `esOcupante=false` en el vínculo de un propietario, este no recibe la notificación de encomienda de esa unidad; con `esOcupante=true` sí.
- [ ] `UNIDAD_TITULAR`: una persona con solo vínculo `RESIDENTE_ADICIONAL` no recibe; `PROPIETARIO`/`ARRENDATARIO` sí.
- [ ] `PATCH .../recibe-notificaciones` actualiza el flag y respeta el scoping por condominio.
- [ ] `GET /condominios/{cid}/notificaciones/stream` con `NOTIFICACION_VER` abre la conexión, recibe `SNAPSHOT_INICIAL` con `noLeidas` correcto y `:ping` sin eventos; al crear una notificación para esa persona llega `NOTIFICACION_CREADA` y **no** llega a otra persona del mismo condominio.
- [ ] El stream del residente ya no notifica a propietarios no ocupantes.
- [ ] `/badge` sigue respondiendo (no se removió) y `/sync` sigue siendo la fuente de la lista.

---

## 5. Alternativas descartadas

- **Extender `/sync` con polling corto**: más tráfico, no es "en vivo" (el negocio espera actualización instantánea del badge/campanita como ya tiene el dashboard).
- **Reutilizar el stream operativo o el del residente para notificaciones**: audiencias distintas (condominio vs persona) y permisos distintos (`DASHBOARD_*` vs `NOTIFICACION_VER`) — se mantienen como buses independientes por audiencia (regla acordada: no mezclar audiencias de permisos distintos en un mismo stream).
- **Enviar la lista de notificaciones por SSE**: expone contenido sensible en un canal de baja visibilidad; `noLeidas` (entero) + señal de invalidación es suficiente y es el patrón ya verificado.
- **Eliminar `/badge` ahora**: rompería el fallback de App Badge nativo del frontend (PushManager); se depreca solo cuando el stream + REST cubran el caso completo.
