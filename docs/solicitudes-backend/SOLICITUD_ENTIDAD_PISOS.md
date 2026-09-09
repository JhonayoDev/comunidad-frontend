# Solicitud Backend — Entidad `Piso` (catálogo de pisos del condominio)

**Versión:** 1.0
**Fecha:** 2026-08-17
**Audiencia:** Equipo backend (Spring Boot / JPA)
**Estado:** ⏳ Pendiente de implementación
**Relacionado:** `SectorController.java`, `V62__permisos_sectores.sql`,
`V65__sectores_nombres_reutilizables.sql` (patrón de índice parcial + dedupe),
`Unidad.java`, `Estacionamiento.java`, `Bodega.java` (columna `piso` Integer)

---

## 1. Resumen ejecutivo

Hoy `piso` es una **columna `Integer` libre** en `Unidad`, `Estacionamiento` y `Bodega`
(soporta negativos/subterráneos). No existe una entidad "Piso" ni endpoints de pisos en el
backend: el frontend (wizard de configuración del ADMINISTRADOR) tipea a mano la lista de
pisos en el modo de numeración "por-piso" y no tiene forma de declarar/validar/describir los
pisos del edificio.

Se pide crear una **entidad `Piso` (catálogo)** con CRUD scoped por condominio, **espejo del
patrón de `Sector`** (misma estructura de controller/permisos/soft-delete, mismo índice
parcial de nombre reutilizable V65). **No cambia las entidades existentes**: el `piso`
Integer de unidades/estacionamientos/bodegas se mantiene; el catálogo sirve para declarar los
pisos del edificio (con nombre/descripción opcionales) y proteger su desactivación mientras
haya unidades/estacionamientos/bodegas activos en ese piso.

---

## 2. Contexto y estado actual (verificado)

- `Unidad.java:48`, `Estacionamiento.java:43`, `Bodega.java:43` → `private Integer piso;`
  (columna libre, sin FK ni validación contra ningún catálogo).
- No existe `Piso` entity/repository/controller/service en el backend (verificado:
  `rg "Piso"` en `src/main/java` solo encuentra la columna `piso`).
- El frontend ya consume la columna `piso`: `GET /unidades`, `GET /estacionamientos`,
  `GET /bodegas` la devuelven; el wizard la usa para numeración "por-piso"
  (`generarNombres(prefijo, "por-piso", {pisos})`).
- Patrón a imitar:
  - `SectorController.java` (`/api/v1/condominios/{cid}/sectores`): `GET` (SECTOR_VER),
    `GET/{id}` (SECTOR_VER), `POST` (SECTOR_CREAR), `POST /batch` (SECTOR_CREAR),
    `PUT/{id}` (SECTOR_EDITAR), `PATCH/{id}/desactivar` (SECTOR_ELIMINAR → 409 con conteos).
  - `V62__permisos_sectores.sql`: permisos `SECTOR_*` + asignación rol/cargos.
  - `V65__sectores_nombres_reutilizables.sql`: índice parcial `uq_sector_cond_nombre_activo
    (condominio_id, nombre) WHERE activo` + dedupe `AndActivoTrue` (desactivar libera el
    nombre; reactivación protegida: 409 si el nombre lo ocupa otro activo).

---

## 3. Problema que resuelve

1. El ADMINISTRADOR no tiene una vista para **declarar los pisos del edificio** (cuántos son,
   nombres opcionales tipo "Subterráneo", descripciones).
2. En el wizard, la numeración "por-piso" exige **tipear la lista de pisos a mano**
   (ej. `1,2,-1`) en cada paso (unidades, estacionamientos, bodegas) — inconsistente y propenso
   a error.
3. No hay forma de **proteger un piso** mientras tenga unidades/estacionamientos/bodegas
   activos (no existe un 409 de "piso en uso" porque no hay entidad que desactivar).

Con el catálogo `Piso`, la vista de pisos (futura etapa del wizard, espejo de sectores)
permite crear/editar/desactivar pisos, la numeración "por-piso" se pre-carga desde
`GET /pisos`, y desactivar un piso con activos da 409.

---

## 4. Requerimientos de implementación

### 4.1 Entidad `Piso` (tabla `pisos`)

```sql
CREATE TABLE pisos (
    piso_id      UUID PRIMARY KEY,
    condominio_id UUID NOT NULL REFERENCES condominios(condominio_id),
    numero       INTEGER NOT NULL,             -- puede ser negativo (subterráneos)
    nombre       VARCHAR(100),                 -- opcional: "Subterráneo", "Piso 1"
    descripcion  VARCHAR(255),                 -- opcional
    activo       BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en    TIMESTAMP NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMP,
    CONSTRAINT fk_pisos_cond FOREIGN KEY (condominio_id) REFERENCES condominios(condominio_id)
);
CREATE INDEX idx_pisos_cond ON pisos (condominio_id);
```

**Índice parcial de número reutilizable** (mismo patrón V65):

```sql
CREATE UNIQUE INDEX uq_piso_cond_numero_activo
    ON pisos (condominio_id, numero) WHERE activo;
```

Reglas derivadas (idénticas a sectores V65):
- Desactivar un piso **libera su número** → se puede recrear (201).
- Renombrar (`PUT` cambiando `numero`) a un número liberado por un inactivo → 200.
- Dedupe solo entre **activos**: dos pisos activos con el mismo `numero` → 409.
- **Reactivación protegida**: `PUT` con `activo=true` valida el dedupe **solo si** el resultado
  es activo Y cambió el `numero` o el piso estaba inactivo → 409 si el número lo ocupa otro activo.

### 4.2 Controller `PisoController` (`/api/v1/condominios/{condominioId}/pisos`)

Espejo de `SectorController`:

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/pisos` | `PISO_VER` | Listar activos ordenados por `numero ASC` |
| GET | `/pisos/{pisoId}` | `PISO_VER` | Detalle |
| POST | `/pisos` | `PISO_CREAR` | Crear unitario → 201 |
| POST | `/pisos/batch` | `PISO_CREAR` | Crear en lote → 201 `{creados:[{id,numero,...}]}`, 409 con `ErrorResponse.fields` |
| PUT | `/pisos/{pisoId}` | `PISO_EDITAR` | `{numero, nombre, descripcion, activo}` |
| PATCH | `/pisos/{pisoId}/desactivar` | `PISO_ELIMINAR` | 204 / **409** si hay activos en ese piso |

Todos scoped: `condominioAccessService.validarAcceso(usuario, condominioId)` + `findByIdAndCondominioId`.

### 4.3 Protección de desactivación (409 con conteos)

`desactivar` debe fallar con 409 (mensaje con conteos por tipo, estilo `SectorService.desactivar`)
si hay **activos** con `piso = piso.numero`:
- unidades (`Unidad` con `activo` y `piso = numero`),
- estacionamientos (`Estacionamiento` con `activo` y `piso = numero`),
- bodegas (`Bodega` con `activo` y `piso = numero`).

> **Decisión de diseño:** la protección usa el `numero` (no un FK). Alternativa futura (NO
> solicitada): migrar las columnas a `piso_id` FK. Hoy se conserva `piso` Integer para no
> tocar las entidades, la numeración ni los batches existentes.

### 4.4 Permisos `PISO_*` (migración nueva)

```sql
INSERT INTO permisos (codigo, nombre, descripcion) VALUES
    ('PISO_VER',      'Ver pisos',      'Consultar pisos del condominio.'),
    ('PISO_CREAR',    'Crear pisos',    'Registrar nuevos pisos en el condominio.'),
    ('PISO_EDITAR',   'Editar pisos',   'Modificar datos de pisos existentes.'),
    ('PISO_ELIMINAR', 'Eliminar pisos', 'Desactivar pisos del condominio (soft delete).')
ON CONFLICT (codigo) DO NOTHING;
```

Asignación sugerida:
- Rol `ADMINISTRADOR` → 4 permisos vía `rol_permisos` (espejo V62).
- Cargo `PRESIDENTE` → 4 permisos; cargo `SECRETARIO` → `PISO_VER/CREAR/EDITAR`;
  cargos `CONSERJE`/`GUARDIA` → solo `PISO_VER`.
- **Recomendación (difiere de V62):** incluir el **cargo `ADMINISTRADOR`** con los 4 permisos.
  En V62 ese cargo quedó sin `SECTOR_*` y el frontend tuvo que degradar con un aviso cuando el
  ADMINISTRADOR residente abre la vista de sectores (403). Para el wizard de pisos queremos
  evitar esa degradación.

---

## 5. Contrato esperado por el frontend

`PisoResponse`: `{ id, numero, nombre, descripcion, activo }`
`CrearPisoRequest`: `{ numero: int, nombre?: string, descripcion?: string }`
`ActualizarPisoRequest`: `{ numero: int, nombre?: string, descripcion?: string, activo: boolean }`
`CrearPisosBatchRequest`: `{ pisos: [CrearPisoRequest] }` → `{ creados: [PisoResponse] }`

Errores 409 como `ErrorResponse` (unitario: `message` legible; batch: `fields[]` con índice +
motivo, p.ej. "Número duplicado" / "Ya existe un piso con el número X").

Casos clave para validar:
1. `POST /pisos` "1" → 201. `PATCH .../desactivar` → 204. `POST /pisos` "1" de nuevo → **201**
   (hoy no existiría: el número queda libre al desactivar).
2. Crear "1" activo y luego otro "1" activo → **409**.
3. `PUT` reactivando un "1" inactivo mientras otro activo lo ocupa → **409**.
4. `PATCH .../desactivar` con una unidad/estacionamiento/bodega **activa** en ese piso → **409**
   con el mensaje de conteo.
5. `GET /pisos` → solo activos, ordenados por `numero ASC`.

---

## 6. Verificación sugerida

1. Con token ADMINISTRADOR del condominio: ciclo completo (crear/renombrar/desactivar/recrear),
   dedupe entre activos, protección de reactivación, y 409 de "piso en uso" con conteos.
2. `GET /unidades`/`/estacionamientos`/`/bodegas` siguen intactos (la columna `piso` no cambia).
3. Regresión: batches de unidades/estacionamientos/bodegas y numeración por-piso intactos.
4. Suite de tests del backend (mencionar el total al responder para confirmar que no se rompió nada).

---

## 7. Decisiones de negocio ya tomadas (no renegociar en implementación)

1. **Los pisos son un catálogo declarativo** (número + etiqueta opcional + descripción), no una
   jerarquía. Un piso no "contiene" a otro.
2. **`piso` Integer se conserva** en unidades/estacionamientos/bodegas. No se pide migrar a FK.
3. **Desactivar un piso libera su número** (reutilizable), consistente con sectores V65,
   estacionamientos/bodegas V63 y unidades V64.
4. **Desactivar un piso con activos está bloqueado** (409 con conteos). Renombrar el número de
   un piso en uso queda **permitido** (es solo etiqueta; la coincidencia es por número al
   desactivar).
5. **Se incluye el cargo `ADMINISTRADOR`** en `PISO_*` (a diferencia de V62) para que el wizard
   no degrade con 403.
