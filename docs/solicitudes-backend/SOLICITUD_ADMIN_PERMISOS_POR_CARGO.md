# Solicitud Backend — Endpoints de administración de permisos por cargo

**Versión:** 1.0
**Fecha:** 2026-08-13
**Audiencia:** Equipo backend (Spring Boot)
**Estado:** Pendiente de implementación
**Relacionado:** `V9__cargo_permisos_operativos.sql`, `V12__bitacora.sql`, `PermisosCondominioService`

---

## 1. Contexto

El modelo RBAC del backend ya resuelve permisos efectivos = **rol** (`rol_permisos`) + **cargo** (`cargo_permisos`), y `PermisosCondominioService.resolverPermisos` los combina en `GET /me/permisos`. La tabla `cargo_permisos` (cargo → permiso_id) se siembra por migraciones.

Pero **no existe ningún endpoint de administración** para:
1. Listar el **catálogo** de permisos disponibles (tabla `permisos`).
2. Leer los permisos asociados a un **cargo** concreto.
3. **Editar** (asignar/revocar) los permisos de un cargo.

Las vistas de frontend `PermisosMatrixView.vue` (matriz rol×permiso) y `CargosPermisosView.vue` (permisos por cargo) quedaron temporalmente en `EnConstruccionView` hasta que estos endpoints existan (mismo patrón que `SolicitudesView`).

## 2. Solicitud

Tres endpoints bajo un nuevo `AdminCargoPermisoController` (base `/api/v1/admin/cargos`), protegidos con `hasPermission(null, 'ROL_GESTIONAR')` (el permiso que ya gobierna "asignar y revocar roles" — es el más cercano semánticamente; si se prefiere, crear un `CARGO_PERMISO_GESTIONAR` y seedarlo a SUPER_ADMIN + ADMINISTRADOR).

### 2.1 Catálogo de permisos

```
GET /api/v1/admin/permisos/catalogo
```

Response `List<PermisoCatalogoResponse>`:

```json
[
  { "codigo": "UNIDAD_VER", "nombre": "Ver unidades", "descripcion": "Consultar unidades del condominio." },
  { "codigo": "FINANZA_GESTIONAR", "nombre": "Gestionar finanzas", "descripcion": "Registrar cobros, pagos, egresos e ingresos." }
]
```

- `PermisoRepository` ya existe (`findAll()` basta). No inventar códigos: servir SOLO lo que está en la tabla `permisos`.

### 2.2 Permisos por cargo

```
GET /api/v1/admin/cargos/{cargo}/permisos
```

Response `CargoPermisosResponse`:

```json
{
  "cargo": "PRESIDENTE",
  "codigosPermiso": ["UNIDAD_VER", "FINANZA_GESTIONAR", "..."],
  "permisosDetalle": [ { "codigo": "UNIDAD_VER", "nombre": "Ver unidades" } ]
}
```

- `{cargo}` valida contra el enum `CargoCondominio` (`ADMINISTRADOR, PRESIDENTE, TESORERO, SECRETARIO, DELEGADO, CONSERJE, GUARDIA, MANTENCION, JARDINERO`).
- La query ya existe: `SELECT p.codigo FROM cargo_permisos cp JOIN permisos p ON p.id = cp.permiso_id WHERE cp.cargo = :cargo` (mismo patrón que `findPermisosByPersonaIdAndCondominioId` en `MiembroCondominioRepository`, sin el join a `miembros_condominio`).

### 2.3 Actualizar permisos de un cargo

```
PUT /api/v1/admin/cargos/{cargo}/permisos
```

Request `ActualizarCargoPermisosRequest`:

```json
{
  "codigosPermiso": ["UNIDAD_VER", "FINANZA_GESTIONAR", "..."]
}
```

- Semántica **reemplazo total** (upsert): `DELETE FROM cargo_permisos WHERE cargo = :cargo` + insert de los códigos válidos. Más simple y determinista que diff incremental.
- Validar que cada código exista en `permisos` (400 con `ErrorResponse.fields[]` si no).
- Auditarlo en `saas_audit_log` con evento tipo `cargoPermisoEditado` (mismo patrón que `reglaNotificacionEditada`/`PLAN_REACTIVAR`).
- **Importante**: al editar permisos de `ADMINISTRADOR`/`GUARDIA`/`CONSERJE`, tener en cuenta que el rol homónimo tiene sus propios permisos en `rol_permisos`; los del cargo solo aplican a quienes ocupan el cargo sin ese rol. El reemplazo no debe tocar `rol_permisos`.

## 3. Verificación sugerida

1. `GET /admin/permisos/catalogo` con token SUPER_ADMIN → 200, lista real de la tabla `permisos`.
2. `GET /admin/cargos/PRESIDENTE/permisos` → 200 con los seeds de V2/V10/V12.
3. `PUT /admin/cargos/TESORERO/permisos` quitando un permiso → `GET` posterior lo refleja; `GET /me/permisos` de una persona con ese cargo deja de incluirlo.
4. 404 si `{cargo}` no es enum; 400 si un código no existe.
5. Regresión: `GET /me/permisos` y la resolución de audiencias por cargo intactas.

## 4. Notas

- El frontend ya deja las vistas de permisos por rol/cargo como placeholder; al implementar esto, reconectar `PermisosMatrixView.vue` (matriz por rol) y `CargosPermisosView.vue` (por cargo) contra estos endpoints.
- `PermisosMatrixView` (roles) requerirá además un endpoint análogo para `rol_permisos` (`GET/PUT /admin/roles/{rol}/permisos`) — puede incluirse en esta misma solicitud si se prefiere.
- `MisPermisosView.vue` (residente/admin/guardia, no SUPER_ADMIN) ya funciona con `GET /me/permisos` real y cruza contra el catálogo `src/data/permisosCatalogo.js` del frontend (actualizado a los códigos reales del backend).
