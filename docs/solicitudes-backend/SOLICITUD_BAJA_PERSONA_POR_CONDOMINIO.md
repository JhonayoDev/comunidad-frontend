# Solicitud Backend — Baja de persona por condominio (sin desactivar la identidad global)

> MIGRADO A ISSUE — Project "Gestion Comunidad Briku".
> Backend: https://github.com/JhonayoDev/briku/issues/102
> Épica frontend: https://github.com/JhonayoDev/comunidad-frontend/issues/44

## Estado: PENDIENTE (backend) — bug multi-condominio

Referencia: `JhonayoDev/comunidad-frontend#42` y épica
`docs/solicitudes-backend/EPICA_PERSONAS_MEMBRESIA_CONDOMINIO.md`.
Depende de: `SOLICITUD_MEMBRESIA_PERSONA_CONDOMINIO.md` (P22).

## Problema

`PersonaCondominioService.desactivar(condominioId, personaId)` hace tres cosas:

```java
// 1. Desactiva vínculos del condominio  ✓ correcto
vinculoRepository.findByPersonaIdAndCondominioIdAndActivoTrue(personaId, condominioId)
    .forEach(v -> { v.setActivo(false); ... });

// 2. Desactiva cargos del condominio     ✓ correcto
miembroRepository.findByCondominioIdAndPersonaIdAndActivoTrue(condominioId, personaId)
    .forEach(m -> { m.setActivo(false); ... });

// 3. Desactiva la cuenta y la persona GLOBALMENTE  ✗ bug
usuarioRepository.findByPersonaId(personaId).ifPresent(u -> {
  u.setActivo(false);
  usuarioRepository.save(u);
});
persona.setActivo(false);
personaRepository.save(persona);
```

Consecuencias:

- Si la persona pertenece a **dos condominios**, darla de baja en A la saca de
  `GET /personas` en B (la query exige `p.activo = true`) aunque su vínculo/cargo en B siga
  activo.
- Pierde el **login en todos los condominios** (`usuario.activo = false`).
- El frontend no puede revertirlo desde B: no hay endpoint de reactivación.

Esto contradice el modelo multi-tenant: la identidad es global, la pertenencia es local.

## Cambios solicitados

### 1. La baja es local al condominio

`PATCH /api/v1/condominios/{cid}/personas/{personaId}/desactivar`

Debe:

- pasar la membresía a `INACTIVO` y setear `fecha_fin`;
- desactivar los `VinculoPersonaUnidad` activos **de ese condominio**;
- desactivar los `MiembroCondominio` activos **de ese condominio**;
- desactivar la fila `usuario_condominios` **de ese condominio** (si existe);
- **NO** tocar `persona.activo` ni `usuario.activo`.

Body opcional:

```json
{ "motivo": "Cambio de administración" }
```

Response `204`.

### 2. Reactivación local

`PATCH /api/v1/condominios/{cid}/personas/{personaId}/reactivar`

- Pasa la membresía a `ACTIVO` y limpia `fecha_fin`.
- No recrea vínculos/cargos automáticamente; el frontend los vuelve a asociar.
- Response `200` con el detalle de la persona.

> Alternativa: resolverlo con `PATCH .../membresia { estado: "ACTIVO" }` (P22). Se deja explícito
> para que el frontend tenga una acción clara.

### 3. Desactivación global solo cuando corresponde

La persona/usuario global solo debe desactivarse cuando:

- no le queda **ninguna membresía activa** en ningún condominio, **y**
- se ejecuta una acción explícita de plataforma (SaaS) o un job de limpieza.

No debe ocurrir como efecto colateral de una baja local.

### 4. El listado no depende de `persona.activo`

`GET /condominios/{cid}/personas` debe filtrar por `personas_condominios.estado = 'ACTIVO'`
(y opcionalmente `persona.activo = true` solo si la persona fue desactivada globalmente por SaaS).

Si una persona fue desactivada globalmente (por ejemplo, fraude), todas sus membresías deben
quedar inactivas o el listado debe excluirla; definir la regla explícitamente.

### 5. Auditoría

Registrar la baja y la reactivación con:

- `condominioId`, `personaId`, `usuarioId` (actor), `motivo`, `timestamp`;
- acción `PERSONA_DESACTIVAR` / `PERSONA_REACTIVAR` (o las que ya use el proyecto).

## Criterios de aceptación (backend)

- [ ] Persona con membresía activa en A y B: `desactivar` en A deja B visible en `GET /personas`.
- [ ] La misma persona puede seguir iniciando sesión y accediendo a B tras la baja en A.
- [ ] `desactivar` en A no modifica `persona.activo` ni `usuario.activo`.
- [ ] `reactivar` en A vuelve a mostrar la persona en A sin afectar B.
- [ ] Si se desactiva la última membresía activa, la cuenta global queda inactiva solo por acción
      explícita/job (documentar).
- [ ] Tests de integración multi-condominio (A y B).
- [ ] Auditoría de baja/reactivación.

## Impacto frontend

- `PersonasView`: el botón "Desactivar" debe hablar de **"quitar del condominio"**, no de
  "eliminar persona".
- Tras la baja, refrescar el listado y mostrar confirmación.
- Si la persona pertenece a otros condominios, no advertir que "se eliminará la cuenta".
- La vista de detalle debe poder reactivar (`PATCH .../reactivar`).

## Fuera de alcance

- Borrado físico de personas (no existe y no se pide).
- Limpieza automática de cuentas sin membresías (job aparte).
