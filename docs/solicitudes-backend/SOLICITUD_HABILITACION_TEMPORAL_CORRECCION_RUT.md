# Habilitación temporal para la corrección de RUT

**Versión:** 1.0
**Fecha:** 2026-11-06
**Audiencia:** Equipo backend (Spring Boot)
**Estado:** Pendiente de implementación — frontend preparado con degradación segura
**Relacionado:** frontend JhonayoDev/comunidad-frontend#41 · backend JhonayoDev/briku#95 · `V82__solicitudes_reclamos_y_rut_normalizado.sql` · `V83__tipos_solicitud_bff.sql` · `SolicitudService` · `RutCorreccionService`

> **MIGRADO A ISSUE — Project `Gestion Comunidad Briku` (`PVT_kwHOBkcviM4Bb6yo`):** [JhonayoDev/briku#99](https://github.com/JhonayoDev/briku/issues/99). Este documento se conserva como contexto de la solicitud.

---

## 1. Contexto y problema

Hoy el residente puede abrir `CORRECCION_RUT` desde el alta genérica de solicitudes en cualquier momento, y `POST /solicitudes` **no exige ninguna autorización** para ese tipo. El RUT es un dato de identidad que solo debería corregirse por un error de tipeo excepcional, no como una opción permanente.

Regla de negocio acordada:

1. La persona detecta que su RUT está mal y **contacta a la administración** (fuera de la app: teléfono, WhatsApp o presencial).
2. La administración **habilita la corrección para esa persona** por una ventana de tiempo limitada y con un motivo.
3. Mientras la ventana esté vigente, el residente ve la acción en su perfil y puede crear **una** solicitud `CORRECCION_RUT`.
4. El flujo de aprobación existente no cambia: la solicitud se revisa y, si se aprueba, `RutCorreccionService` actualiza el RUT de forma atómica y audita.
5. Si no hay habilitación, **la app no anuncia la opción**. No se muestra ningún texto del tipo "si tu RUT está mal, avísanos": eso generaría ruido y sugeriría que el dato es editable.

---

## 2. Modelo de datos

Nueva tabla `rut_correccion_habilitaciones` (migración `V84__rut_correccion_habilitaciones.sql`).

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | `UUID` | PK |
| `persona_id` | `UUID` | FK `personas`, obligatorio |
| `condominio_id` | `UUID` | FK `condominios`, obligatorio |
| `habilitada_desde` | `TIMESTAMPTZ` | default `NOW()` |
| `habilitada_hasta` | `TIMESTAMPTZ` | obligatorio, `> habilitada_desde` |
| `motivo` | `VARCHAR(500)` | obligatorio (queda en la auditoría) |
| `estado` | `VARCHAR(20)` | `VIGENTE`, `CONSUMIDA`, `REVOCADA`, `EXPIRADA` |
| `habilitada_por` | `UUID` | FK `usuarios`, obligatorio |
| `consumida_en` | `TIMESTAMPTZ` | se setea al crear la solicitud |
| `solicitud_id` | `UUID` | FK `solicitudes`, la solicitud generada |
| `revocada_en` | `TIMESTAMPTZ` | si el admin la cancela antes de tiempo |
| `revocada_por` | `UUID` | FK `usuarios` |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | auditoría técnica |

Restricciones e índices:

```sql
CREATE UNIQUE INDEX uq_rut_hab_vigente
  ON rut_correccion_habilitaciones (persona_id, condominio_id)
  WHERE estado = 'VIGENTE';

CREATE INDEX ix_rut_hab_persona
  ON rut_correccion_habilitaciones (persona_id, condominio_id);
```

**Por qué tabla y no una columna en `personas`:** una persona puede pertenecer a más de un condominio, la habilitación se otorga en un condominio concreto, y se necesita historial de quién la dio, cuándo, por qué y si se usó. La columna global impediría todo eso.

**Expiración:** el servicio marca perezosamente como `EXPIRADA` cualquier habilitación `VIGENTE` con `habilitada_hasta <= NOW()` antes de crear una nueva o de validar una solicitud. No es obligatorio un job, pero un `@Scheduled` diario mantiene la tabla limpia.

---

## 3. Endpoints

### 3.1 Habilitar

```
POST /api/v1/condominios/{condominioId}/personas/{personaId}/correccion-rut/habilitar
Permiso: PERSONA_RUT_CORREGIR (rol ADMINISTRADOR o cargos con el permiso)
```

Request:

```json
{
  "vigenciaHoras": 72,
  "motivo": "El residente reportó un error de tipeo en su RUT."
}
```

Response `201`:

```json
{
  "personaId": "…",
  "estado": "VIGENTE",
  "habilitadaDesde": "2026-11-06T12:00:00",
  "habilitadaHasta": "2026-11-09T12:00:00",
  "motivo": "El residente reportó un error de tipeo en su RUT.",
  "habilitadaPorNombre": "…"
}
```

Errores:

- `404` si la persona no existe o no tiene vínculo/cargo activo en el condominio.
- `409` si ya existe una habilitación `VIGENTE` para esa persona en ese condominio.
- `400` si `vigenciaHoras` está fuera de `1..168` (máximo 7 días) o `motivo` viene vacío.

### 3.2 Revocar

```
PATCH /api/v1/condominios/{condominioId}/personas/{personaId}/correccion-rut/revocar
Permiso: PERSONA_RUT_CORREGIR
```

- Solo aplica a una habilitación `VIGENTE` (`409` si ya está consumida, revocada o expirada).
- Response `200` con el estado `REVOCADA`.

### 3.3 Consulta para administración

Extender `GET /api/v1/condominios/{condominioId}/personas/{personaId}` (`PersonaDetalleResponse`) con:

```json
"correccionRut": {
  "estado": "VIGENTE",
  "habilitadaHasta": "2026-11-09T12:00:00",
  "motivo": "…",
  "habilitadaPorNombre": "…"
}
```

`correccionRut` es `null` si nunca se habilitó.

### 3.4 Consulta para el residente

Extender `GET /api/v1/me` (`MeResponse`) con:

```json
"rutCorreccionHabilitadaHasta": "2026-11-09T12:00:00"
```

- `null` cuando no hay habilitación vigente.
- El frontend usa este campo como única señal para mostrar la acción. Si el campo no llega (versión anterior del backend), la acción simplemente no se muestra.

### 3.5 Enforcement en el alta

En `SolicitudService.crear`, cuando `request.tipo() == CORRECCION_RUT`:

1. Resolver la persona desde el token (nunca del body).
2. Buscar una habilitación `VIGENTE` con `habilitada_hasta > NOW()` para `(personaId, condominioId)`.
3. Si no existe → `403` con mensaje claro: `"La administración no habilitó la corrección de tu RUT."`
4. Si ya existe una solicitud `CORRECCION_RUT` abierta de esa persona → `409`.
5. Al persistir la solicitud, marcar la habilitación como `CONSUMIDA`, setear `consumida_en` y `solicitud_id` en la misma transacción.

Notas:

- La habilitación se consume **al crear** la solicitud, no al aprobarla. Si la solicitud se rechaza, queda consumida y la administración puede habilitar de nuevo si quiere dar otra oportunidad.
- La aprobación puede ocurrir después de que expire la ventana: la ventana controla *pedir*, no *resolver*.
- `RutCorreccionService` y la auditoría `PERSONA_RUT_CORREGIR` no cambian.
- El RUT sigue siendo global de la persona: si está en dos condominios, el cambio aprobado se refleja en ambos. La habilitación sí es por condominio.

---

## 4. Notificaciones

Nuevo tipo `RUT_CORRECCION_HABILITADA`:

- Audiencia `PERSONA`, prioridad `NORMAL`, canales `IN_APP` + `EMAIL`, `visibleUsuario = true`.
- Texto: "La administración habilitó la corrección de tu RUT hasta el {fecha}. Puedes solicitarla una sola vez."
- Agregar la regla en `CatalogoSeedService` (o migración de catálogo si se prefiere) y en `src/data/reglasCatalogo.js` del frontend.
- Opcional: `RUT_CORRECCION_REVOCADA` para avisar si se cancela antes de tiempo.
- El `RUT_CORREGIDO` existente (audiencia `ADMINISTRACION`) se mantiene igual.

---

## 5. Auditoría

Nuevos códigos en `AuditoriaService`:

- `PERSONA_RUT_CORRECCION_HABILITAR` — incluye `personaId`, `vigenciaHoras`, `motivo`.
- `PERSONA_RUT_CORRECCION_REVOCAR` — incluye `personaId`, `motivo` opcional.

Agregarlos al filtro de acciones de `SaasAuditoriaView.vue`.

---

## 6. Frontend (ya preparado)

Implementado en `feature/solicitudes-reclamos-casos` (degradación segura, sin depender del backend):

- `src/utils/correccionRut.js`: `correccionRutHabilitada(me)` devuelve `{ habilitada, hasta }`; sin fecha, fecha inválida o pasada → no habilitada.
- `PerfilView.vue`: el RUT sigue solo-lectura. La acción "Solicitar corrección de RUT" y el banner con la fecha **solo** aparecen si `rutCorreccionHabilitadaHasta` está vigente. Sin habilitación no se muestra ningún texto alusivo.
- `solicitudTipos.js`: `TIPOS_SOLICITUD_ALTA` excluye `CORRECCION_RUT`; el tipo sigue en `TIPOS_SOLICITUD`/`TIPOS_SOLICITUD_API` para el detalle y los filtros.
- `MisSolicitudesView.vue`: `?nueva=CORRECCION_RUT` se ignora si no hay habilitación; con habilitación, el diálogo muestra el tipo como `Tag` de solo lectura (no aparece en el Select).
- Tests: `correccionRut.test.js` + ajustes en `solicitudTipos.test.js` (345/345 OK).

Pendiente (cuando existan los endpoints):

- `ResidentesView.vue` / detalle de persona: acción "Habilitar corrección de RUT" con motivo y vigencia (24 h / 72 h / 7 días), `ConfirmDialog`, y "Revocar" si está vigente.
- Mostrar la ventana activa en el detalle de la persona.

---

## 7. Casos borde y decisiones

| Caso | Decisión propuesta |
| --- | --- |
| Ya hay una solicitud `CORRECCION_RUT` abierta | `409`, no se crea otra |
| La solicitud se rechaza | La habilitación queda consumida; el admin puede habilitar de nuevo |
| Expira la ventana con la solicitud pendiente | La solicitud sigue su curso; solo se bloquean nuevas altas |
| El RUT nuevo ya existe en otra persona | `409` de `RutCorreccionService` (no se fusionan personas) |
| Persona en dos condominios | Habilitación separada por condominio; el RUT aprobado es global |
| Admin intenta habilitar dos veces | `409` por el índice único parcial |
| Se revoca después de consumida | `409`; la solicitud ya está en curso |

---

## 8. Criterios de aceptación

1. `POST /solicitudes` con `tipo=CORRECCION_RUT` sin habilitación vigente → `403`; con habilitación vigente → `201` y la habilitación queda `CONSUMIDA`.
2. Una segunda solicitud con la misma habilitación → `403` (`409` si la primera sigue abierta).
3. `GET /me` devuelve `rutCorreccionHabilitadaHasta` solo mientras la ventana esté vigente.
4. `POST .../habilitar` con `vigenciaHoras` válido crea la habilitación y dispara la notificación `RUT_CORRECCION_HABILITADA`.
5. `PATCH .../revocar` deja la habilitación `REVOCADA` y ya no permite el alta.
6. Cada habilitación/revocación queda en auditoría.
7. La aprobación de la solicitud sigue actualizando el RUT y auditando `PERSONA_RUT_CORREGIR` sin cambios.
8. Tests backend en verde, incluyendo expiración, consumo, doble habilitación y tenant cruzado.

---

## 9. Referencias

**Backend**

- `src/main/java/com/space/briku/domain/solicitud/service/SolicitudService.java` (`crear`, `resolver`)
- `src/main/java/com/space/briku/domain/solicitud/service/RutCorreccionService.java`
- `src/main/java/com/space/briku/domain/persona/entity/Persona.java`
- `src/main/java/com/space/briku/domain/persona/controller/PersonaController.java`
- `src/main/java/com/space/briku/domain/identity/dto/response/MeResponse.java`
- `src/main/java/com/space/briku/domain/comunicacion/service/CatalogoSeedService.java`
- `src/main/java/com/space/briku/domain/auditoria/service/AuditoriaService.java`
- `src/main/resources/db/migration/V83__tipos_solicitud_bff.sql`

**Frontend**

- `src/utils/correccionRut.js`
- `src/views/residente/PerfilView.vue`
- `src/views/residente/MisSolicitudesView.vue`
- `src/data/solicitudTipos.js`
- `src/data/reglasCatalogo.js`
