# Solicitud Backend — Alta de persona: 409 con `personaId` y búsqueda por RUT

## Estado: PENDIENTE (backend)

Referencia: `JhonayoDev/comunidad-frontend#42` (BUG: persona creada desde Personas queda invisible).
Frontend: opción A ya implementada (flujo "crear o reutilizar → vincular"). Este documento cubre la
opción B (y el complemento necesario para RUT).

## Problema

`POST /api/v1/condominios/{cid}/personas` (`PersonaCondominioService.crear`) crea una **persona
global** sin vínculo ni cargo en el condominio. El listado
`GET /api/v1/condominios/{cid}/personas` usa `PersonaRepository.findActivasByCondominioId`, que
solo devuelve personas con un `VinculoPersonaUnidad` activo o un `MiembroCondominio` activo.

Resultado: la persona recién creada queda **huérfana e invisible** en la UI. Al intentar crearla
de nuevo, el backend responde `409`, pero **no devuelve el `personaId`** (el controller lo
documenta: "Si ya existe por email o RUT retorna 409 con el ID para vincularla directamente").

`GlobalExceptionHandler.handleIllegalState` devuelve solo:

```json
{ "status": 409, "error": "Conflict", "message": "Ya existe una persona con el email ..." }
```

## Cambios solicitados

### 1. Incluir `personaId` y `conflicto` en el 409 del alta

En `PersonaCondominioService.crear`, cuando exista email o RUT:

- Buscar la persona existente (`findByEmail` / `findByRutNormalizado`).
- Responder `409` con el ID de esa persona y el campo en conflicto.

Contrato propuesto (extiende `ErrorResponse`, sin romper a los demás consumidores porque son
campos opcionales):

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Ya existe una persona con el email cintya@gmail.com. Búscala por email y vincúlala al condominio directamente.",
  "timestamp": "2026-11-07T12:00:00",
  "personaId": "0f2c...uuid",
  "conflicto": "EMAIL"
}
```

- `personaId`: UUID de la persona existente (no se debe crear otra).
- `conflicto`: `EMAIL` | `RUT`.

Alternativa de implementación: una `PersonaDuplicadaException(personaId, conflicto, message)`
con handler propio que devuelva un DTO dedicado (más explícito y sin tocar `ErrorResponse`).

**Uso frontend:** con `personaId` el alta puede abrir directo el diálogo de vínculo sin depender
de `GET /personas/buscar`, y elimina el caso irrecuperable cuando el conflicto es por RUT.

### 2. Búsqueda por RUT (complemento)

Hoy existe `GET /api/v1/condominios/{cid}/personas/buscar?email=...` (permiso `PERSONA_VER`).
Un `409` por **RUT** con un email distinto no se puede resolver desde la UI: buscar por el email
tipeado devuelve `404` y la persona no aparece en el listado.

Solicitado:

- `GET /api/v1/condominios/{cid}/personas/buscar?rut=12.345.678-5`, o
- aceptar ambos parámetros (`email` **o** `rut`, exactamente uno), normalizando el RUT con
  `RutUtil.normalizar`.

Respuesta: el mismo `PersonaResumenResponse` (incluye `id`, `nombre`, `email`, `rut`, `telefono`,
`activo`). `404` si no existe.

## Notas

- No se pide cambiar el modelo (opción C del issue: asociar la persona al condominio al crearla).
  Si más adelante se quiere precargar personas sin unidad, habría que evaluar una tabla/columna
  `persona_condominio` y ajustar `findActivasByCondominioId`.
- No se pide cambiar el listado: una persona sin vínculo ni cargo debe seguir sin aparecer hasta
  vincularse (ese es el comportamiento esperado del CRM).
- La reactivación de personas inactivas no tiene endpoint; el frontend solo advierte en el diálogo
  de búsqueda. Si se requiere, sería un `PATCH .../personas/{id}/reactivar` (fuera del alcance de
  este issue).

## Criterios de aceptación (backend)

- [ ] `POST /personas` con email duplicado responde `409` con `personaId` y `conflicto="EMAIL"`.
- [ ] `POST /personas` con RUT duplicado responde `409` con `personaId` y `conflicto="RUT"`.
- [ ] `GET /personas/buscar?rut=...` devuelve la persona existente (normaliza el RUT) o `404`.
- [ ] Tests de integración de ambos casos.
