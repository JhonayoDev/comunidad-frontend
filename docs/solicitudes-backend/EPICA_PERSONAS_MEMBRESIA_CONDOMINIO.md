# Épica — Reformulación del alta de personas y membresía por condominio

> MIGRADO A ISSUE — Project "Gestion Comunidad Briku".
> Frontend: https://github.com/JhonayoDev/comunidad-frontend/issues/44
> Backend: https://github.com/JhonayoDev/briku/issues/101 · https://github.com/JhonayoDev/briku/issues/102 · https://github.com/JhonayoDev/briku/issues/103

## Estado: PENDIENTE

Referencia: `JhonayoDev/comunidad-frontend#42` (BUG: persona creada desde Personas queda invisible).

## Contexto

El issue #42 destapó un problema de **lógica de operación**, no solo de UI: la persona y su
asociación al condominio son dos escrituras separadas, y la visibilidad depende de la segunda.
Cualquier interrupción entre ambas deja el registro huérfano y bloquea email/RUT para reintentar.

Casos que hoy fallan:

1. **Cancelar en el segundo paso** → la persona ya se creó y queda invisible.
2. **Trabajador sin unidad** (jardinero, aseo, mantención) → no hay dónde asociarlo; "crear sin
   vincular" lo deja invisible y tampoco aparece en Miembros.
3. **Pérdida de conexión a mitad del registro** → persona invisible; el reintento responde `409`
   y no hay forma directa de recuperar el `personaId`.
4. **Misma persona en un segundo condominio** → la baja en A la desactiva globalmente y rompe B.

## Decisión de modelo

Separar **identidad global** de **membresía por condominio**:

```
persona (global, email/RUT único)
  └── persona_condominio (membresía: ACTIVO / PENDIENTE / INACTIVO)
        ├── vinculos_persona_unidad   → vivienda / propiedad
        ├── miembros_condominio       → cargo
        └── usuario_condominios       → rol contextual + portal
```

El portal se elige por membresía + rol contextual + cargo, **nunca** por rol global.

## Flujo objetivo (una sola ventana)

1. **Datos personales** (nombre, email, RUT, teléfono).
2. **¿Cómo se incorpora al condominio?**
   - **A una unidad** → propietario / arrendatario / residente adicional.
   - **A un cargo** → jardinero / mantención / conserje / guardia.
   - **Proveedor** → servicio externo recurrente (sin unidad).
3. Botón final: **"Guardar persona y asociación"** → un solo request atómico.

Reglas:

- **Cancelar antes de guardar** → no se crea nada.
- **Falla la asociación** → no se persiste nada (backend atómico) o queda `PENDIENTE` con reintento.
- **Se corta internet** → reintento limpio; si la persona ya existe, `409` con `personaId` y
  "Buscar y vincular".
- **Sin "Crear sin vincular"** en el flujo normal.
- **Buscar persona** permite vincular a unidad **o** asignar cargo.

## Fases

### Fase 0 — Frontend ahora (sin backend)

- [ ] Quitar "Crear sin vincular" del diálogo de alta.
- [ ] Alta unificada: datos → asociación (unidad o cargo) en un solo diálogo.
- [ ] Guardar = crear/reutilizar persona + vínculo/cargo; si falla la asociación, estado
      "Persona creada, falta asociarla" + **Reintentar**.
- [ ] "Buscar persona" permite **vincular a una unidad** o **asignar un cargo**.
- [ ] `409` → "Buscar y vincular".
- [ ] Refrescar listado tras crear/asociar.
- [ ] Tests del composable y de la vista.

> Esta fase ya cubre jardineros/aseo vía cargo y arregla el bug inmediato sin esperar backend.

### Fase 1 — Backend: membresía + alta atómica (P22)

- [ ] `personas_condominios` + backfill.
- [ ] `POST /personas` atómico (crear o reutilizar + asociar).
- [ ] `GET /personas` por membresía.
- [ ] `PATCH .../membresia`.
- [ ] `POST .../asociaciones`.
- [ ] `409` con `personaId` + `conflicto` y búsqueda por RUT (P21).
- [ ] `GET /me/condominios` con `tiposParticipacion`.

### Fase 2 — Backend: baja local y rol contextual (P23/P24)

- [ ] `desactivar` por condominio (no global).
- [ ] `reactivar` local.
- [ ] `usuario_condominios.rol_id` obligatorio.
- [ ] `resolverPermisos` sin fallback al rol global.
- [ ] Rol `TRABAJADOR` (y `PROVEEDOR` futuro).

### Fase 3 — Frontend: membresía y portal trabajador

- [ ] Pestaña **"Pendientes de asociar"** + banner en Personas.
- [ ] Selector de tipo de incorporación.
- [ ] Badges de `tiposParticipacion`.
- [ ] Contexto `TRABAJADOR`: dashboard + nav + guard de rutas.
- [ ] "Buscar persona" muestra membresías existentes.
- [ ] Píldoras de contexto en `AppHeader`.

### Fase 4 — QA

- [ ] Los 16 casos de uso.
- [ ] Multi-condominio (A y B).
- [ ] Baja local y reactivación.
- [ ] Aislamiento de portal (jardinero no ve residente).
- [ ] Importación masiva.
- [ ] Reintentos y `409`.

## Casos de uso

| # | Caso | Membresía | Vínculo | Cargo | Cuenta / rol | Portal |
|---|---|---|---|---|---|---|
| 1 | Nuevo arrendatario | `RESIDENTE` | `ARRENDATARIO` | — | Opcional `RESIDENTE` | Residente |
| 2 | Propietario que no vive | `PROPIETARIO` | `PROPIETARIO` (`esOcupante=false`) | — | Opcional `PROPIETARIO` | Propietario |
| 3 | Familiar / dependiente | `RESIDENTE` | `RESIDENTE_ADICIONAL` | — | Opcional `RESIDENTE` | Residente |
| 4 | Jardinero | `TRABAJADOR` | — | `JARDINERO` | Sin cuenta | — |
| 5 | Persona de aseo | `TRABAJADOR` | — | `MANTENCION` (o `ASEO`) | Sin cuenta | — |
| 6 | Conserje | `TRABAJADOR` | — | `CONSERJE` | `CONSERJE` | Trabajador/guardia |
| 7 | Guardia | `TRABAJADOR` | — | `GUARDIA` | `GUARDIA` | Guardia |
| 8 | Proveedor recurrente | `PROVEEDOR` | — | — | Opcional | Proveedor |
| 9 | Administrador externo | `ADMINISTRADOR_EXTERNO` | — | `ADMINISTRADOR` | `ADMINISTRADOR` | Admin |
| 10 | Presidente que vive ahí | `RESIDENTE` + `ADMINISTRACION` | vínculo | `PRESIDENTE` | `RESIDENTE` | Residente + Admin |
| 11 | Residente que además trabaja | `RESIDENTE` + `TRABAJADOR` | vínculo | cargo | Sí | Residente + Staff |
| 12 | Trabajador que se muda | `TRABAJADOR` + `RESIDENTE` | vínculo nuevo | cargo previo | Sí | Staff + Residente |
| 13 | Residente que se va y queda propietario | `PROPIETARIO` | `PROPIETARIO` (`esOcupante=false`) | — | Sí | Propietario |
| 14 | Baja en condo A | `INACTIVO` en A, `ACTIVO` en B | — | — | Cuenta intacta | Solo B |
| 15 | Importación masiva | `ACTIVO` por fila | vínculo | cargo si aplica | Opcional | Según tipo |
| 16 | Invitación | `PENDIENTE` → `ACTIVO` | al aceptar | al aceptar | Al aceptar | — |

## Decisiones cerradas

1. **Un email = una persona.** Política estándar; no se cambia.
2. **Trabajadores estables → cargo**, no visita recurrente. Proveedor puntual → visitas.
3. **Jardinero/aseo sin cuenta** al inicio; si necesitan login, rol `TRABAJADOR`.
4. **Cargo `ASEO`**: se usa `MANTENCION` por ahora; evaluar `ASEO` si se necesita distinguir.
5. **Baja local**, no global; la cuenta global se desactiva solo si no quedan membresías activas.
6. **Rol contextual obligatorio**, sin fallback al rol global para usuarios operativos.
7. **Alta atómica**; `PENDIENTE` solo para invitaciones/importación o "guardar sin asociar"
   explícito.

## Solicitudes backend relacionadas

- `SOLICITUD_MEMBRESIA_PERSONA_CONDOMINIO.md` (P22, incluye P21).
- `SOLICITUD_BAJA_PERSONA_POR_CONDOMINIO.md` (P23).
- `SOLICITUD_ROL_CONTEXTUAL_POR_CONDOMINIO.md` (P24).
- `SOLICITUD_409_PERSONA_ID.md` (P21, absorbido por P22).

## Criterios de aceptación de la épica

- [ ] Ninguna persona queda invisible por cancelar, perder conexión o fallar la asociación.
- [ ] Un trabajador sin unidad se registra con cargo y aparece en Personas y Miembros.
- [ ] La misma persona puede pertenecer a dos condominios con relaciones distintas.
- [ ] La baja en un condominio no afecta a los demás.
- [ ] Un jardinero con cuenta no accede a datos de residentes.
- [ ] El listado muestra el tipo de participación y permite filtrar por estado.
- [ ] Tests, `pnpm build` y `pnpm verificar:estandar` OK.
