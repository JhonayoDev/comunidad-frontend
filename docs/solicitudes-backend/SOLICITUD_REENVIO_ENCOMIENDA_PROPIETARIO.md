# Solicitud Backend — Reenvío de notificación de encomienda/carta a propietario (o persona específica)

> **MIGRADO A ISSUE** — 2026-09-08: Este doc queda como banner histórico. La trazabilidad vive en **GitHub Project `Gestion Comunidad Briku` (3)** + **Issue #19** `P4 follow-up: reenvío de notificación de encomienda/carta a propietario (PERSONA)` https://github.com/JhonayoDev/comunidad-frontend/issues/19 y su **sub-issue backend** `JhonayoDev/briku` (cuando se cree con `--parent 19`). Ver `AGENTS.md: Workflow — GitHub Project y Issues`. El `Project` es la guía; este `.md` se conserva solo para referencia.

**Fecha:** 2026-09-08
**Contexto:** `feature/p4-permisos-bff` — regla general `ENCOMIENDA_RECIBIDA` ahora `UNIDAD_TITULAR` (SUPER_ADMIN global). Caso observado: carta a nombre del propietario de una casa arrendada → titular es arrendatario (residente), propietario no residente no recibe nada. Flujo deseado sin romper la regla general.
**Para:** Equipo backend — dejar documentado para cuando se llegue a la vista `EncomiendasView`/`EncomiendasView detalle`.

---

## 1. Casos de uso

- **CU-1 Reenvío post-notificación:** La encomienda ya se registró (notificación fue a `UNIDAD_TITULAR` → arrendatario). El arrendatario avisa “es para el dueño”, administración pide al conserje **reenviar la misma notificación pero al propietario** (PROPIETARIO no ocupante) sin crear otra encomienda.
- **CU-2 Envío directo al registrar:** El conserje identifica al recibir la carta que es para el propietario no residente y quiere **notificar directamente a esa persona** (PERSONA) en lugar de al titular genérico, sin pasar por el reenvío.

Ambos respetan la regla general `UNIDAD_TITULAR` para el 95% de los casos; son excepciones puntuales.

---

## 2. Análisis de factibilidad (backend actual)

- **Notificación de encomienda es por unidad:** `EncomiendaEventHandler.java:42` crea `SolicitudNotificacion.builder().tipo(ENCOMIENDA_RECIBIDA).contexto(paraUnidad(condominioId, unidadId))` — audiencia efectiva sale del catálogo (`CatalogoSeedService.java:76` ahora `UNIDAD_TITULAR`) y `DestinatarioResolver.java:55` `UNIDAD_TITULAR → findPersonaIdsParaNotificarTitularesPorUnidad` (`PROPIETARIO`/`ARRENDATARIO` con `activo` + `recibeNotificaciones`). No hay `audienciaForzada` en este flujo.
- **PERSONA sí está soportado como audiencia forzada:** `SolicitudNotificacion.java:26` `audienciaForzada` + `ContextoNotificacion.java:18` `paraPersona(condominioId, personaId)` — `NotificacionService.java:113` prioriza `audienciaForzada` sobre regla (`regla = audienciaForzada != null ? forzada : catalogo.obtener(...)`). `AnuncioEntregasHandler.java:49` ya lo usa para anuncios. `DestinatarioResolver.java:72` `PERSONA` solo requiere `personaId` y no consulta `unidadId`.
- **Encomienda es `ENCOMIENDA` recurso:** `EncomiendaEventHandler` usa `TipoRecurso.ENCOMIENDA` + `recursoId=encomiendaId` — reenviar puede reusar el mismo `recursoId` para que la notificación apunte a la misma encomienda (historial `GET /encomiendas/{id}` ya existe).
- **Identificación de titular vs ocupante:** `VinculoPersonaUnidad.tipo` (`PROPIETARIO`/`ARRENDATARIO`/`RESIDENTE_ADICIONAL`) + `esOcupante`. `UNIDAD_TITULAR` ya resuelve propietario+arrendatario; `PERSONA` permite elegir uno solo (ej. solo `PROPIETARIO`). El conserje puede buscar por `personaId` vía `GET /personas?search=` o por unidad `GET /unidades/{id}/vinculos`.

**Conclusión:** Factible sin tocar la regla general. Basta exponer un endpoint que cree una **nueva notificación `ENCOMIENDA_RECIBIDA` con `audienciaForzada=PERSONA` y `personaId` elegido**, reutilizando `NotificacionService.procesarEvento` (mismo camino que anuncios). No crea duplicado de encomienda.

---

## 3. Solicitud (2 endpoints mínimos)

Base: `/api/v1/condominios/{condominioId}/encomiendas` — `EncomiendaController.java:23` (`@PreAuthorize hasPermission(null,'ENCOMIENDA_CREAR')` aplica igual; cerrar ya pide `ENCOMIENDA_ENTREGAR`).

### 3.1 Reenvío puntual a persona (CU-1)

```
POST /api/v1/condominios/{condominioId}/encomiendas/{encomiendaId}/reenviar-notificacion
@PreAuthorize("hasPermission(null,'ENCOMIENDA_CREAR')") // o NOTIFICACION_ENVIAR si se prefiere
Content-Type: application/json

{ "personaId": "uuid-del-propietario" }

Response 201 { "notificacionId": "uuid", "audiencia": "PERSONA", "personaId": "..." }
```

- Valida `encomiendaId` pertenece a `condominioId` y está en `PENDIENTE`/`ENTREGADA` (permite reenviar incluso entregada para trazabilidad).
- Valida `personaId` existe y tiene algún vínculo/cargo con el condominio (mismo `CondominioAccessService.validarAcceso` indirecto vía `personaId`).
- Crea `SolicitudNotificacion.builder().tipo(ENCOMIENDA_RECIBIDA).condominioId(...).contexto(paraPersona(...)).tipoRecurso(ENCOMIENDA).recursoId(encomiendaId).audienciaForzada(PERSONA).build()` y llama `notificacionService.procesarEvento`.
- No cambia `EstadoEncomienda` ni `encomienda_historial`; solo notificación. Auditar con `notificacionReenviada` si se quiere (opcional).

### 3.2 Envío directo al registrar (CU-2, opcional pero recomendado)

```
POST /api/v1/condominios/{condominioId}/encomiendas
Body: RegistrarEncomiendaRequest + opcional
  { "unidadId": "uuid", "tipo": "CARTA", "nombreDestinatario": "Juan Pérez",
    "destinatarioPersonaId": "uuid-del-propietario" } // nullable
```

- Si `destinatarioPersonaId` viene, el `EncomiendaService.registrar` publica `SolicitudNotificacion` con `audienciaForzada=PERSONA` + `paraPersona` en lugar de `paraUnidad`. Si es `null`, mantiene flujo actual `UNIDAD_TITULAR` (regla efectiva).
- Alternativa sin tocar `RegistrarEncomiendaRequest`: que el frontend haga `POST /encomiendas` (crea con regla general) y luego inmediato `POST /encomiendas/{id}/reenviar-notificacion` con `personaId` — 2 requests, sin cambio de DTO. Esta alternativa evita migración de contrato y es la recomendada para V1.

---

## 4. Frontend — cómo se usará cuando lleguemos a la vista

- **En `EncomiendasView` detalle (`GET /encomiendas/{id}`):** botón `Reenviar notificación` → `AutoComplete` de personas de la unidad (`GET /unidades/{id}/vinculos` → `GET /personas`) + buscador global `GET /personas?nombre=` si es propietario no residente de otra unidad. Al elegir, `POST /encomiendas/{id}/reenviar-notificacion { personaId }` → `Message success` “Notificación reenviada a <nombre>”. La encomienda sigue `PENDIENTE` hasta `PATCH /entregar`.
- **En `RegistrarEncomiendaDialog.vue`:** añadir `Select` “Notificar a: Titular(es) (regla) / Persona específica” — si elige persona, tras `POST /encomiendas` hacer el reenvío inmediato (flujo 2 requests). Mostrar `Tag` con `personaNombre` elegido.

---

## 5. Verificación sugerida

1. Registrar encomienda para unidad arrendada (regla `UNIDAD_TITULAR`) → `GET /me/permisos` del arrendatario la ve, propietario también si es `PROPIETARIO`.
2. `POST /encomiendas/{id}/reenviar-notificacion { personaId: propietarioNoResidente }` con `GUARDIA`/`CONSERJE` (`ENCOMIENDA_CREAR`) → `201`, `GET /notificaciones/sync` del propietario muestra nueva `ENCOMIENDA_RECIBIDA` con `recursoId` igual.
3. Registrar con `destinatarioPersonaId` (si se implementa 3.2) → solo esa persona recibe, no el titular genérico.
4. `400` si `personaId` no existe o sin vínculo; `404` si `encomiendaId` no es del condominio.
