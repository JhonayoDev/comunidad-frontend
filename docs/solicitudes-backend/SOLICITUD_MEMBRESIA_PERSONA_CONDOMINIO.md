# Solicitud Backend — Membresía persona-condominio y alta atómica de personas

> MIGRADO A ISSUE — Project "Gestion Comunidad Briku".
> Backend: https://github.com/JhonayoDev/briku/issues/101
> Épica frontend: https://github.com/JhonayoDev/comunidad-frontend/issues/44

## Estado: PENDIENTE (backend)

Referencia: `JhonayoDev/comunidad-frontend#42` (BUG: persona creada desde Personas queda invisible).
Épica frontend: `docs/solicitudes-backend/EPICA_PERSONAS_MEMBRESIA_CONDOMINIO.md`.
Absorbe y amplía `SOLICITUD_409_PERSONA_ID.md` (P21).

## Problema

Hoy la visibilidad de una persona en un condominio **no es explícita**: se deriva de tener un
`VinculoPersonaUnidad` activo o un `MiembroCondominio` activo. Eso produce cuatro fallas:

1. `POST /condominios/{cid}/personas` crea una **persona global** sin relación con el condominio.
2. `GET /condominios/{cid}/personas` usa `PersonaRepository.findActivasByCondominioId`, que exige
   vínculo o cargo activo → la persona recién creada queda invisible.
3. El alta es de dos pasos (`POST /personas` → `POST /vinculos` o `POST /miembros`) **sin
   atomicidad**:
   - cancelar en el segundo paso deja una persona huérfana;
   - perder la conexión a mitad del registro deja una persona huérfana;
   - reintentar responde `409` y **no devuelve `personaId`**.
4. Un trabajador sin unidad (jardinero, aseo, mantención) no tiene relación con el condominio;
   "crear sin vincular" lo deja invisible y tampoco aparece en Miembros.

## Decisión de modelo

Separar **identidad global** de **membresía por condominio**:

```
persona (global, email/RUT único)
  └── persona_condominio (membresía: ACTIVO / PENDIENTE / INACTIVO)
        ├── vinculos_persona_unidad   → vivienda / propiedad
        ├── miembros_condominio       → cargo
        └── usuario_condominios       → rol contextual + acceso al portal
```

La membresía es la **puerta de entrada** al condominio. Los vínculos y cargos siguen existiendo,
pero ya no son la única fuente de visibilidad.

## Tabla `personas_condominios`

```sql
CREATE TABLE personas_condominios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condominio_id   UUID NOT NULL,
    persona_id      UUID NOT NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
        -- ACTIVO | PENDIENTE | INACTIVO
    tipo_alta       VARCHAR(30) NOT NULL,
        -- RESIDENTE | PROPIETARIO | DEPENDIENTE | TRABAJADOR
        -- | PROVEEDOR | ADMINISTRADOR_EXTERNO
    origen          VARCHAR(30) NOT NULL DEFAULT 'ALTA_MANUAL',
        -- ALTA_MANUAL | IMPORTACION | WIZARD | INVITACION
    fecha_inicio    DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin       DATE,
    creado_por      UUID,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_personas_condominios PRIMARY KEY (id),
    CONSTRAINT fk_persona_condominio FOREIGN KEY (condominio_id)
        REFERENCES condominios (id) ON DELETE RESTRICT,
    CONSTRAINT fk_persona_membresia FOREIGN KEY (persona_id)
        REFERENCES personas (id) ON DELETE RESTRICT,
    CONSTRAINT uq_persona_condominio UNIQUE (condominio_id, persona_id)
);

CREATE INDEX idx_personas_condominios_cond_estado
    ON personas_condominios (condominio_id, estado);
CREATE INDEX idx_personas_condominios_persona
    ON personas_condominios (persona_id);
```

> El número de migración propuesto es `V85`; el backend puede ajustarlo si hay migraciones en curso.

### Por qué `tipo_alta` y no un `tipo_participacion` único

Una persona puede ser **residente y trabajadora** en el mismo condominio. Se guarda el tipo con el
que se dio de alta y la API devuelve un **conjunto derivado** `tiposParticipacion`:

| Tipo derivado | Regla |
|---|---|
| `PROPIETARIO` | vínculo activo `PROPIETARIO` |
| `ARRENDATARIO` | vínculo activo `ARRENDATARIO` |
| `DEPENDIENTE` | vínculo activo `RESIDENTE_ADICIONAL` |
| `TRABAJADOR` | cargo activo en `JARDINERO`/`MANTENCION`/`CONSERJE`/`GUARDIA`, o `tipo_alta = TRABAJADOR` |
| `ADMINISTRACION` | cargo activo `ADMINISTRADOR`/`PRESIDENTE`/`TESORERO`/`SECRETARIO`/`DELEGADO`, o `tipo_alta = ADMINISTRADOR_EXTERNO` |
| `PROVEEDOR` | `tipo_alta = PROVEEDOR` |

Así "residente que además es presidente" o "trabajador que además vive en el condominio" no
duplican membresías.

### Estados

| Estado | Cuándo | Visible en `GET /personas` |
|---|---|---|
| `ACTIVO` | Membresía vigente | Sí (default) |
| `PENDIENTE` | Invitación / importación con error / alta explícita sin asociar | Solo con `?estado=PENDIENTE` |
| `INACTIVO` | Baja del condominio | No (histórico) |

## Contrato API

### 1. Alta atómica (crear o reutilizar + asociar)

`POST /api/v1/condominios/{cid}/personas`

Request (exactamente uno de `persona` o `personaId`):

```json
{
  "persona": {
    "nombre": "Ana Pérez",
    "email": "ana@example.com",
    "rut": "12.345.678-5",
    "telefono": "+56 9 1234 5678"
  },
  "personaId": null,
  "asociacion": {
    "tipo": "UNIDAD | CARGO | PROVEEDOR | PENDIENTE",
    "unidad": {
      "unidadId": "uuid",
      "tipoVinculo": "PROPIETARIO | ARRENDATARIO | RESIDENTE_ADICIONAL",
      "esOcupante": true,
      "recibeNotificaciones": true,
      "esResponsable": false,
      "fechaInicio": "2026-11-10"
    },
    "cargo": {
      "cargo": "JARDINERO",
      "fechaInicio": "2026-11-10"
    },
    "proveedor": {
      "empresa": "Jardines del Sur",
      "rubro": "Jardinería",
      "contacto": "+56 9 8765 4321"
    }
  }
}
```

Response `201`:

```json
{
  "personaId": "uuid",
  "membresiaId": "uuid",
  "estado": "ACTIVO",
  "tiposParticipacion": ["TRABAJADOR"],
  "vinculoId": null,
  "miembroId": "uuid"
}
```

Reglas:

- **Todo en una sola transacción.** Si falla la asociación (unidad ocupada, cargo único ya
  asignado, etc.), no se persiste ni la persona ni la membresía.
- Si la persona ya existe por email/RUT y se envía `persona` en vez de `personaId`, responder
  `409` con `personaId` y `conflicto` (ver punto 6) para que el frontend reintente con
  `personaId`.
- `asociacion.tipo = PENDIENTE` crea la membresía en estado `PENDIENTE` sin vínculo/cargo
  (solo para invitaciones, importación o "guardar sin asociar" explícito).

### 2. Listado por membresía

`GET /api/v1/condominios/{cid}/personas?estado=ACTIVO|PENDIENTE|TODOS&tipoParticipacion=...&q=...`

- `estado` default `ACTIVO`.
- `q` busca por nombre/email/RUT.
- Respuesta paginada o lista (mantener el contrato actual si ya está paginado).
- Cada ítem incluye:
  - `personaId`, `nombre`, `email`, `rut`, `telefono`, `activo`;
  - `membresiaId`, `estadoMembresia`, `tipoAlta`;
  - `tiposParticipacion` (array);
  - `cargoPrincipal`, `unidadPrincipal`;
  - `tieneUsuario`, `passwordSetAt`, `emailPendiente`.

### 3. Detalle

`GET /api/v1/condominios/{cid}/personas/{personaId}`

Extiende `PersonaDetalleResponse` con:

```json
{
  "membresia": {
    "id": "uuid",
    "estado": "ACTIVO",
    "tipoAlta": "TRABAJADOR",
    "fechaInicio": "2026-11-10",
    "fechaFin": null
  },
  "tiposParticipacion": ["TRABAJADOR"]
}
```

### 4. Membresía

`PATCH /api/v1/condominios/{cid}/personas/{personaId}/membresia`

```json
{ "estado": "ACTIVO", "tipoAlta": "RESIDENTE" }
```

- Permite reactivar (`INACTIVO → ACTIVO`) y cambiar el tipo de alta.
- No crea vínculos/cargos; para eso está el punto 5.

### 5. Agregar asociación a una membresía existente

`POST /api/v1/condominios/{cid}/personas/{personaId}/asociaciones`

```json
{
  "tipo": "UNIDAD | CARGO | PROVEEDOR",
  "unidad": { "...": "..." },
  "cargo": { "...": "..." },
  "proveedor": { "...": "..." }
}
```

- Reutiliza las validaciones existentes de `VinculoService.crear` y `CargoService.asignar`.
- Si la membresía está `PENDIENTE`, pasa a `ACTIVO` al asociar.

### 6. Búsqueda global y 409 recuperable (P21)

`GET /api/v1/condominios/{cid}/personas/buscar?email=...` **o** `?rut=...`
(exactamente uno; normalizar el RUT con `RutUtil.normalizar`).

- `404` si no existe.
- Respuesta: `PersonaResumenResponse` + `membresias: [{ condominioId, condominioNombre, estado, tipoAlta }]`
  para que el frontend muestre "ya pertenece a este condominio como X" / "pertenece a otro
  condominio".

`POST /personas` con email/RUT duplicado:

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Ya existe una persona con el email ...",
  "personaId": "uuid",
  "conflicto": "EMAIL | RUT"
}
```

### 7. `/me/condominios`

Agregar a `CondominioResumen`:

```json
{
  "tiposParticipacion": ["RESIDENTE", "TRABAJADOR"],
  "rolContextual": "RESIDENTE"
}
```

El frontend usa esto para elegir el portal/contexto sin adivinar por rol global.

## Migración y backfill

`V85__personas_condominios.sql`:

1. Crear la tabla e índices.
2. Backfill de membresías para personas con vínculo o cargo activo:

```sql
INSERT INTO personas_condominios
    (condominio_id, persona_id, estado, tipo_alta, origen, fecha_inicio)
SELECT DISTINCT
    x.condominio_id,
    x.persona_id,
    'ACTIVO',
    CASE
        WHEN x.tiene_cargo THEN 'TRABAJADOR'
        WHEN x.tipo_vinculo = 'PROPIETARIO' THEN 'PROPIETARIO'
        WHEN x.tipo_vinculo = 'ARRENDATARIO' THEN 'RESIDENTE'
        ELSE 'DEPENDIENTE'
    END,
    'BACKFILL',
    COALESCE(x.fecha_inicio, CURRENT_DATE)
FROM (
    SELECT v.condominio_id, v.persona_id, v.tipo::text AS tipo_vinculo,
           v.fecha_inicio, FALSE AS tiene_cargo
    FROM vinculos_persona_unidad v
    WHERE v.activo = TRUE
    UNION ALL
    SELECT m.condominio_id, m.persona_id, NULL, m.fecha_inicio, TRUE
    FROM miembros_condominio m
    WHERE m.activo = TRUE
) x
ON CONFLICT (condominio_id, persona_id) DO NOTHING;
```

> Ajustar el `CASE` si una persona tiene vínculo y cargo a la vez: la membresía es una sola fila;
> `tiposParticipacion` se deriva en la API.

## Permisos

Reutilizar los existentes:

- `PERSONA_VER` — listado, detalle, búsqueda.
- `PERSONA_CREAR` — alta atómica.
- `PERSONA_EDITAR` — membresía y asociaciones.
- `PERSONA_ELIMINAR` — baja (ver P23).
- `VINCULO_CREAR` — asociación a unidad.
- `USUARIO_GESTIONAR` — asignación de cargo.

No se requiere permiso nuevo para esta fase. Si se quiere separar, proponer `MEMBRESIA_GESTIONAR`.

## Criterios de aceptación (backend)

- [ ] `POST /personas` con `asociacion.tipo=UNIDAD` crea persona + membresía + vínculo en una
      transacción; si el vínculo falla, **no queda persona creada**.
- [ ] `POST /personas` con `asociacion.tipo=CARGO` crea persona + membresía + cargo; el
      trabajador aparece en `GET /personas` y en `GET /miembros`.
- [ ] `POST /personas` con `personaId` reutiliza la persona existente y solo asocia.
- [ ] `409` por email/RUT devuelve `personaId` y `conflicto`.
- [ ] `GET /personas/buscar?rut=...` normaliza y devuelve la persona o `404`.
- [ ] `GET /personas` lista por membresía (incluye trabajadores sin unidad).
- [ ] `GET /personas?estado=PENDIENTE` devuelve las membresías pendientes.
- [ ] `PATCH .../membresia` reactiva y cambia `tipoAlta`.
- [ ] `POST .../asociaciones` agrega vínculo/cargo a una membresía existente y la activa.
- [ ] La misma persona puede tener membresías en dos condominios sin duplicar `persona`.
- [ ] Backfill idempotente: correr la migración dos veces no duplica filas.
- [ ] Tests de integración de alta atómica, 409, búsqueda por RUT, listado y multi-condominio.

## Impacto frontend

- Fase 0 (ahora): alta unificada con vínculo o cargo, sin "Crear sin vincular", reintento y
  búsqueda que permite asignar cargo.
- Fase 3 (después de este backend): pestaña "Pendientes de asociar", selector de tipo de
  incorporación, badges de `tiposParticipacion` y contexto de portal.

## Fuera de alcance

- Baja por condominio → `SOLICITUD_BAJA_PERSONA_POR_CONDOMINIO.md` (P23).
- Rol contextual por condominio y portal trabajador →
  `SOLICITUD_ROL_CONTEXTUAL_POR_CONDOMINIO.md` (P24).
