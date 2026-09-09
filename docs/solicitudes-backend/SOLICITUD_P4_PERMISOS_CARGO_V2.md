# Solicitud Backend — P4 V2 Permisos por Cargo (BFF validado)

**Versión:** 2.0 (BFF) — reemplaza/añade detalle a `SOLICITUD_ADMIN_PERMISOS_POR_CARGO.md` v1.0  
**Fecha:** 2026-09-08  
**Rama frontend:** `feature/p4-permisos-bff` (`feb8d94` + `5e82ab8` + `ad41261`)  
**Módulo BFF:** `src/modules/permisos/` (lista por cargo validada, mock `localStorage bff:cargo-permisos` con seeds V12→V72)  
**Estado:** Pendiente backend — frontend listo para cambiar `cargoPermisos.service.js` de mock a `api.get/put` sin tocar vista

---

## 1. Contexto BFF

El RBAC backend resuelve `permisos efectivos = rol (rol_permisos) + cargo (cargo_permisos)` y `GET /me/permisos` ya funciona (`MisPermisosView.vue` + `permisosCatalogo.js` 70 códigos V2→V39).  
Falta exponer administración por cargo. El frontend iteró en `src/modules/permisos/views/CargosPermisosView.vue` con **lista por cargo** (Select 9 cargos `CargoCondominio` + búsqueda + Card por `MODULOS` colapsable + Checkbox + ConfirmDialog reemplazo total). La UX está validada en `http://localhost:5173/superadmin/permisos/cargos` (mobile colapsable + Ir arriba). El mock persiste en `localStorage` y valida `400 fields` si el código no existe.

Este documento pide **solo lo que el módulo necesita** (BFF) — sin pedir matriz ni roles aún.

---

## 2. Endpoints solicitados

Base: `/api/v1/admin` — `AdminCargoPermisoController`

### 2.1 Catálogo

```
GET /api/v1/admin/permisos/catalogo
@PreAuthorize("hasPermission(null, 'ROL_GESTIONAR')")
```

Response `200 List<PermisoCatalogoResponse>`:

```json
[
  { "codigo": "UNIDAD_VER", "nombre": "Ver unidades", "descripcion": "Consultar unidades del condominio.", "modulo": "GESTION" },
  { "codigo": "ROL_GESTIONAR", "nombre": "Gestionar roles", "descripcion": "Asignar y revocar roles a usuarios.", "modulo": "GESTION" }
]
```

- Servir **solo** lo que está en tabla `permisos` (`SELECT codigo,nombre,descripcion,modulo FROM permisos ORDER BY modulo,codigo`). No inventar códigos.
- `modulo` viene de `permisosCatalogo.js` (`GESTION`, `ACCESOS`, `CASOS`, `RESERVAS`, `FINANZAS`, `COMUNICACION`, `BITACORA`, `ALMACENAMIENTO`, `DASHBOARDS`, `SAAS`) — si el backend no lo tiene, puede inferirlo o añadir columna `modulo` (el frontend ya lo agrupa así).

### 2.2 Lectura por cargo

```
GET /api/v1/admin/cargos/{cargo}/permisos
@PreAuthorize("hasPermission(null, 'ROL_GESTIONAR')")
```

Path `{cargo}` valida contra `CargoCondominio` enum (`ADMINISTRADOR,PRESIDENTE,TESORERO,SECRETARIO,DELEGADO,CONSERJE,GUARDIA,MANTENCION,JARDINERO`) → `404` si no existe.

Response `200 CargoPermisosResponse`:

```json
{
  "cargo": "GUARDIA",
  "codigosPermiso": ["ACCESO_VER", "ACCESO_REGISTRAR_INGRESO", "ACCESO_REGISTRAR_SALIDA", "DASHBOARD_GUARDIA"],
  "permisosDetalle": [
    { "codigo": "ACCESO_VER", "nombre": "Ver accesos", "descripcion": "Consultar registros de ingreso y salida.", "modulo": "ACCESOS" }
  ]
}
```

- `permisosDetalle` opcional pero útil para no hacer join en frontend (si no, basta `codigosPermiso` y el frontend cruza con catálogo).
- Query: `SELECT p.codigo FROM cargo_permisos cp JOIN permisos p ON p.id=cp.permiso_id WHERE cp.cargo=:cargo` (mismo patrón que `MiembroCondominioRepository.findPermisosByPersonaIdAndCondominioId` sin join a `miembros_condominio`).

### 2.3 Reemplazo total por cargo

```
PUT /api/v1/admin/cargos/{cargo}/permisos
@PreAuthorize("hasPermission(null, 'ROL_GESTIONAR')")
Content-Type: application/json

{ "codigosPermiso": ["UNIDAD_VER", "FINANZA_VER", "..."] }
```

- Semántica **reemplazo total** (upsert): `DELETE FROM cargo_permisos WHERE cargo=:cargo` + `INSERT` de cada código válido — determinista, evita diff incremental.
- Validar cada código existe en `permisos` → `400` con `ErrorResponse.fields[]` (`{ field: "codigosPermiso", message: "Código no existe: X" }`) — el módulo BFF ya muestra `fields` así.
- No tocar `rol_permisos` al editar `ADMINISTRADOR`/`GUARDIA`/`CONSERJE` (el rol homónimo tiene permisos propios; el cargo solo aplica a quien lo ocupa).
- Auditar en `saas_audit_log` con `cargoPermisoEditado` (mismo patrón que `reglaNotificacionEditada`/`PLAN_REACTIVAR`), con `actor`, `cargo`, `codigosAntes/Después`.
- Response `200` con mismo `CargoPermisosResponse` actualizado.

---

## 3. Permisos y seguridad

- `@PreAuthorize("hasPermission(null, 'ROL_GESTIONAR')")` — ya seed a `SUPER_ADMIN` y a `ADMINISTRADOR` (rol+cargo `V39`). Es el permiso que ya gobierna `PersonalCondominioController:asignarCargo` (`hasPermission(#condominioId, 'Condominio','ROL_GESTIONAR')`), coherente.
- Si se prefiere granularidad, crear `CARGO_PERMISO_GESTIONAR` y seedarlo a `SUPER_ADMIN` + `ADMINISTRADOR` — pero no es necesario para V2.

## 4. Validación sugerida

1. `GET /admin/permisos/catalogo` con `SUPER_ADMIN` → `200` 70 códigos, `ROL_GESTIONAR` presente.
2. `GET /admin/cargos/GUARDIA/permisos` → `200` con `ACCESO_REGISTRAR_INGRESO` (seed V12).
3. `PUT /admin/cargos/TESORERO/permisos` quitando `FINANZA_GESTIONAR` → `GET` posterior lo refleja; `GET /me/permisos` de un `TESORERO` deja de incluirlo.
4. `GET /admin/cargos/INVALIDO/permisos` → `404`; `PUT` con código inexistente → `400 fields`.
5. Regresión `GET /me/permisos` intacto.

## 5. Qué NO se pide en V2 (fuera de BFF)

- `GET/PUT /admin/roles/{rol}/permisos` (matriz `PermisosMatrixView`) — se pedirá en V3 si la lista por cargo no basta. El módulo ya tiene placeholder `MatrizPermisos.vue` para fase 2.
- No se pide paginación ni filtros — catálogo es ~70 filas.

## 6. Frontend — cómo cambia

`src/modules/permisos/services/cargoPermisos.service.js:1` mock actual:

```js
getCatalogo() → { data: PERMISOS }
getCargoPermisos(cargo) → { data: { cargo, codigosPermiso } } // localStorage
putCargoPermisos(cargo, codigos) → valida + persiste + console.info
```

Tras implementar backend, cambiar a:

```js
getCatalogo() { return api.get("/admin/permisos/catalogo"); }
getCargoPermisos(cargo) { return api.get(`/admin/cargos/${cargo}/permisos`); }
putCargoPermisos(cargo, cods) { return api.put(`/admin/cargos/${cargo}/permisos`, { codigosPermiso: cods }); }
```

Sin tocar `useCargoPermisos.js` ni `CargosPermisosView.vue` (colapsables + Ir arriba ya validados, `ADMINISTRADOR` cargo warn incluido).

---

**Entregable esperado:** 3 endpoints + `cargoPermisoEditado` audit + `400 fields` — el módulo BFF queda real sin cambios visuales.
