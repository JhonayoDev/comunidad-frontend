# Solicitud Backend — Rol contextual por condominio y portal trabajador

> MIGRADO A ISSUE — Project "Gestion Comunidad Briku".
> Backend: https://github.com/JhonayoDev/briku/issues/103
> Épica frontend: https://github.com/JhonayoDev/comunidad-frontend/issues/44

## Estado: PENDIENTE (backend) — bug de permisos multi-condominio + feature de portal

Referencia: `JhonayoDev/comunidad-frontend#42` y épica
`docs/solicitudes-backend/EPICA_PERSONAS_MEMBRESIA_CONDOMINIO.md`.
Depende de: `SOLICITUD_MEMBRESIA_PERSONA_CONDOMINIO.md` (P22).

## Problema

### 1. Fuga de permisos del rol global

`PermisosCondominioService.resolverPermisos` cae al rol **global** cuando no hay rol contextual:

```java
Set<String> permisosRol = asignacion != null && asignacion.getRolId() != null
    ? miembroCondominioRepository.findPermisosByRolId(asignacion.getRolId())
    : usuario.getAuthorities()...; // rol global
```

Escenario real:

- Persona X es **administrador externo** del condominio A (`rol global = ADMINISTRADOR`,
  cargo `ADMINISTRADOR` en A).
- Luego se vincula como **residente** en el condominio B (solo `VinculoPersonaUnidad`).
- En B no hay fila `usuario_condominios` con rol → `resolverPermisos` usa el rol global
  `ADMINISTRADOR` → **X obtiene permisos de administrador en B**.

### 2. `usuario_condominios.rol_id` se crea en `null`

`CargoService.asignar` hace:

```java
usuarioCondominioRepository.save(
    new UsuarioCondominio(usuario.getId(), condominioId, true, null));
```

Aunque el cargo sea `ADMINISTRADOR`, `GUARDIA` o `CONSERJE`, el rol contextual queda `null` y se
hereda el global. El modelo de rol por condominio existe en la tabla, pero no se usa.

### 3. Cargos sin acceso ni portal

`CARGOS_CON_ACCESO_SISTEMA = { ADMINISTRADOR, GUARDIA, CONSERJE }`.

- `JARDINERO` y `MANTENCION` no obtienen fila en `usuario_condominios` ni rol contextual.
- No existe rol `TRABAJADOR` ni permisos de portal staff.
- Si a un jardinero se le crea cuenta con rol global `RESIDENTE`, el frontend le muestra el
  portal de residente (mi unidad, deudas, encomiendas), aunque no tenga vínculo.

## Decisión

**El rol es por condominio, no global.** El rol global queda reservado para `SUPER_ADMIN` y
`SOPORTE` (personal SaaS). Para usuarios operativos, los permisos efectivos se resuelven siempre
por:

```
permisos efectivos = permisos del rol contextual (usuario_condominios.rol_id)
                   + permisos de cargos activos (miembros_condominio)
```

Sin fallback al rol global.

## Cambios solicitados

### 1. `usuario_condominios.rol_id` obligatorio para usuarios operativos

- Al asignar un cargo con acceso, setear el `rol_id` correspondiente:
  - `ADMINISTRADOR` → rol `ADMINISTRADOR`
  - `GUARDIA` → rol `GUARDIA`
  - `CONSERJE` → rol `GUARDIA` (o `TRABAJADOR`, ver punto 3)
  - `JARDINERO`/`MANTENCION` → rol `TRABAJADOR` (si tienen cuenta)
- Si el rol no se puede determinar, rechazar la creación de la cuenta con un error claro.

### 2. `resolverPermisos` sin fallback global

Para usuarios no-SaaS:

- Si existe `usuario_condominios` activo con `rol_id` → usar sus permisos.
- Si no existe fila → derivar permisos mínimos desde la membresía:
  - `RESIDENTE`/`PROPIETARIO`/`DEPENDIENTE` → permisos de residente;
  - `TRABAJADOR` → permisos de portal trabajador;
  - `PROVEEDOR` → permisos de portal proveedor (o ninguno);
  - `ADMINISTRADOR_EXTERNO` → permisos de administrador.
- Nunca usar `usuario.getAuthorities()` (rol global) para un usuario operativo.

> Importante: los endpoints siguen protegidos por `@PreAuthorize`. Si un endpoint usa
> `hasRole('ADMINISTRADOR')` con el rol global del JWT, la fuga persiste. Hay que migrar esas
> protecciones a permisos contextuales (`hasPermission`) o resolver el rol del condominio en el
> filtro de autorización.

### 3. Roles nuevos `TRABAJADOR` y `PROVEEDOR`

Crear en `roles` + `rol_permisos`:

**TRABAJADOR** (portal staff):

- `MI_PERFIL_VER`, `MI_PERFIL_EDITAR`
- `COMUNICADO_VER`
- `SOLICITUD_INTERNA_CREAR`, `SOLICITUD_INTERNA_VER`
- `TAREA_VER`, `TAREA_ACTUALIZAR` (si existe el módulo; si no, dejar preparado)
- `ACCESO_VER` solo si el cargo lo requiere (`GUARDIA`/`CONSERJE`)
- **No**: `DASHBOARD_RESIDENTE`, `MIS_DEUDAS`, `ENCOMIENDAS`, `VISITA_*`, `FINANZA_*`,
  `PERSONA_VER`, `UNIDAD_VER`.

**PROVEEDOR** (portal vendor, fase posterior):

- `MI_PERFIL_VER`
- `ORDEN_TRABAJO_VER`, `ORDEN_TRABAJO_ACTUALIZAR`
- `ACCESO_VER` (si requiere ingresar)
- **No** datos de residentes ni finanzas.

> Si el módulo de tareas/órdenes no existe todavía, crear los roles y permisos mínimos
> (`MI_PERFIL_VER`, `COMUNICADO_VER`) y dejar el resto para cuando exista.

### 4. `GET /me/condominios` con contexto

Agregar a `CondominioResumen`:

```json
{
  "tiposParticipacion": ["TRABAJADOR"],
  "rolContextual": "TRABAJADOR",
  "cargo": "JARDINERO"
}
```

El frontend elige el portal:

| Condición | Portal |
|---|---|
| cargo `ADMINISTRADOR`/`PRESIDENTE`/`SECRETARIO`/`TESORERO` o `ADMINISTRADOR_EXTERNO` | Admin |
| cargo `GUARDIA`/`CONSERJE` | Guardia/portería |
| vínculo activo | Residente |
| `TRABAJADOR` sin vínculo | Staff |
| `PROVEEDOR` | Proveedor |

Una persona con varios contextos ve el selector de contexto (píldoras del `AppHeader`).

### 5. Endpoints de portal staff (mínimo)

Si no existen, crear como mínimo:

- `GET /api/v1/me/perfil` (ya existe `GET /me`; reutilizar).
- `GET /api/v1/condominios/{cid}/comunicados` con permiso `COMUNICADO_VER`.
- `GET/POST /api/v1/condominios/{cid}/solicitudes-internas` (o reutilizar solicitudes con
  categoría interna y permiso propio).

Si el alcance es solo cerrar la fuga, se puede entregar el rol `TRABAJADOR` con
`MI_PERFIL_VER` + `COMUNICADO_VER` y dejar tareas/órdenes para una fase posterior.

## Criterios de aceptación (backend)

- [ ] Administrador en A + residente en B: en B **no** tiene permisos de administrador.
- [ ] `usuario_condominios.rol_id` se setea al asignar cargos con acceso.
- [ ] Un jardinero con cuenta obtiene solo permisos de `TRABAJADOR`.
- [ ] Un jardinero **sin** cuenta no aparece como usuario ni puede iniciar sesión.
- [ ] `GET /me/permisos` en B devuelve permisos de residente, no de administrador.
- [ ] `GET /me/condominios` devuelve `tiposParticipacion` y `rolContextual`.
- [ ] Tests de seguridad: jardinero no accede a `DASHBOARD_RESIDENTE`, `MIS_DEUDAS`,
      `ENCOMIENDAS`, `FINANZA_*`.
- [ ] Tests de multi-condominio con roles distintos.

## Impacto frontend

- `CONTEXT_DASHBOARDS` + `NAV_ITEMS_BY_ROLE` + `CARGO_NAV_ITEMS` con contexto `TRABAJADOR`.
- `StaffDashboardView` (o `TrabajadorDashboardView`) con accesos mínimos.
- Guard de rutas por contexto, no solo por rol global.
- `AppHeader`: píldoras de contexto según `tiposParticipacion`.
- `useNavigation` debe usar `rolContextual`/`tiposParticipacion` de `/me/condominios`.

## Fuera de alcance

- Portal proveedor completo (órdenes de trabajo, facturación).
- Módulo de tareas/asistencia (si no existe, se deja preparado).
- Reemplazo total de `hasRole` por `hasPermission` en todos los controllers; se puede hacer por
  fases, priorizando los endpoints de residente/finanzas.
