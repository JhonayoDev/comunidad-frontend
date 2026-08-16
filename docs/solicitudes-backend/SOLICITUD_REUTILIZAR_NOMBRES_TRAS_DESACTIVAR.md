# Solicitud Backend — Reutilizar nombres de estacionamientos/bodegas desactivadas (dedupe ignora `activo=false`)

**Versión:** 1.0
**Fecha:** 2026-08-16
**Audiencia:** Equipo backend (Spring Boot / JPA)
**Estado:** Pendiente de implementación
**Relacionado:** `BodegaRepository.java`, `EstacionamientoRepository.java`, `BodegaService.java`,
`EstacionamientoService.java`, `SOLICITUD_BATCH_ESTACIONAMIENTOS_BODEGAS.md` (implementada)

---

## 1. Resumen ejecutivo

El ADMINISTRADOR puede **desactivar** (soft-delete, `activo=false`) estacionamientos y bodegas desde
el wizard de configuración (fase 5 en modo edición, `PATCH .../{id}/desactivar`). Hoy, si luego
intenta **crear una nueva entidad con el mismo nombre** de una desactivada, el backend responde
**409 "Ya existe ... con el nombre: X"** porque el dedupe por nombre
(`existsByCondominioIdAndNombre`) **no excluye las filas inactivas**.

Se solicita que el dedupe de nombres considere **solo entidades activas**, de modo que un nombre
desactivado pueda reutilizarse al crear (unitario y batch) y al renombrar. Requiere una migración de
base de datos (V63) que convierta los constraints UNIQUE en índices únicos parciales `WHERE activo`
(ver §4.1); no requiere permisos nuevos.

---

## 2. Contexto y estado actual (verificado)

### 2.1 Soft-delete

- `BodegaService.desactivar` (`BodegaService.java:194-208`) y `EstacionamientoService.desactivar`:
  marcan `activo=false` (no borran la fila) y **bloquean** si la entidad tiene vínculos activos
  (409 "Desactívalos primero"). Correcto, no se toca.
- Los listados (`findActivasConSectorByCondominioId`, `findActivasByCondominioIdAndNombreContaining`)
  y los conteos (`countByCondominioIdAndActivoTrue`, envelope del plan) ya filtran por `activo=true`.

### 2.2 Dedupe por nombre (el problema)

El dedupe usa una **derived query sin filtro de `activo`**:

- `BodegaRepository.java:30` → `boolean existsByCondominioIdAndNombre(UUID condominioId, String nombre);`
- `EstacionamientoRepository.java:30` → `boolean existsByCondominioIdAndNombre(UUID condominioId, String nombre);`

Llamadas (mismas líneas en ambos servicios):

| Operación                | BodegaService | EstacionamientoService |
| ------------------------ | ------------- | ---------------------- |
| `crear` (unitario)       | línea 71      | línea 71               |
| `crearBatch`             | línea 129     | línea 129              |
| `actualizar` (renombrar) | línea 175     | línea 175              |

Como la fila desactivada sigue existiendo en la tabla, el nombre queda **ocupado para siempre**:
recrearlo devuelve 409. Esto rompe el flujo natural del wizard: "eliminé todas las bodegas y quiero
volver a crearlas con la misma numeración".

---

## 3. Problema que resuelve

En el wizard de configuración (pasos "Estacionamientos" y "Bodegas"), el ADMINISTRADOR puede
eliminar todas las entidades de un tipo (fase 5 → papelera → Guardar) y luego volver al wizard de
creación para regenerarlas en lote con la misma numeración (`B-1`, `B-2`, ...). Sin este fix, el
batch falla completo con 409 por fila ("Ya existe una bodega con el nombre: B-1") y el admin no
puede recrear la numeración original.

---

## 4. Requerimientos de implementación

### 4.1 Migración de base de datos OBLIGATORIA (V63)

**Corrección a la v1.0:** la versión anterior afirmaba "sin migración", pero eso es incorrecto.
Ambas tablas tienen un constraint UNIQUE a nivel de BD sobre **todas** las filas (activas e
inactivas):

- `V58:39` → `CONSTRAINT uq_estac_cond_nombre UNIQUE (condominio_id, nombre)`
- `V59:42` → `CONSTRAINT uq_bodega_cond_nombre UNIQUE (condominio_id, nombre)`

Si solo se cambiara la derived query, el `INSERT` de un nombre con una fila inactiva existente
violaría el constraint → `DataIntegrityViolationException` → 500 (no hay handler global para ese
tipo en `GlobalExceptionHandler`), no el 201 esperado.

**Solución:** migración `V63__reutilizar_nombres_tras_desactivar.sql` que reemplaza cada constraint
por un **índice único parcial** que solo aplica a filas activas:

```sql
ALTER TABLE estacionamientos DROP CONSTRAINT uq_estac_cond_nombre;
CREATE UNIQUE INDEX uq_estac_cond_nombre_activo
    ON estacionamientos (condominio_id, nombre) WHERE activo;

ALTER TABLE bodegas DROP CONSTRAINT uq_bodega_cond_nombre;
CREATE UNIQUE INDEX uq_bodega_cond_nombre_activo
    ON bodegas (condominio_id, nombre) WHERE activo;
```

El índice único parcial es la garantía de integridad a nivel BD (defensa en profundidad contra
carreras entre nodos del despliegue híbrido): permite coexistir una fila activa y una inactiva con
el mismo nombre, pero impide dos activas.

### 4.2 Cambiar el dedupe a solo activas

Reemplazar la derived query por una que excluya `activo=false` en **ambos repositorios**:

```java
// BodegaRepository.java
boolean existsByCondominioIdAndNombreAndActivoTrue(UUID condominioId, String nombre);

// EstacionamientoRepository.java
boolean existsByCondominioIdAndNombreAndActivoTrue(UUID condominioId, String nombre);
```

(Alternativa equivalente con `@Query` explícita: `SELECT COUNT(b) > 0 FROM Bodega b
WHERE b.condominio.id = :condominioId AND b.nombre = :nombre AND b.activo = true`.)

Actualizar las **6 llamadas** (3 por servicio: `crear`, `crearBatch`, `actualizar`) al nuevo método.
El mensaje de error se mantiene ("Ya existe ... con el nombre: X") — solo cambia el criterio.

### 4.3 Sin cambios en desactivar ni en listados

- `desactivar` sigue siendo soft-delete con bloqueo por vínculos activos.
- Los listados/conteos ya excluyen inactivas; no se tocan.
- El envelope del plan (`countByCondominioIdAndActivoTrue`) ya no cuenta las desactivadas, por lo
  que recrear un nombre desactivado **no** consume cupo extra. Consistente.

---

## 5. Contrato esperado por el frontend (para validar el request/response)

Flujo de reedición del wizard (fase 5):

1. `PATCH /condominios/{cid}/bodegas/{id}/desactivar` (o estacionamientos) por cada fila eliminada.
2. El frontend vuelve al wizard de creación (fase 1) si no quedan entidades activas.
3. `POST /condominios/{cid}/bodegas/batch` (o estacionamientos) con la numeración original
   (`B-1`, `B-2`, ...) → **debe responder 201** (hoy responde 409 por fila).

---

## 6. Verificación sugerida

1. Con token ADMINISTRADOR del condominio:
   - Crear `B-1` → 201. Desactivarla (`PATCH .../desactivar`) → 200.
   - Crear `B-1` de nuevo (unitario) → **201** (hoy 409).
   - `POST /bodegas/batch` con `["B-1", "B-2"]` → **201** con ambas creadas.
   - Renombrar otra bodega a `B-1` (con la `B-1` desactivada) → **200**.
   - Repetir los mismos casos con estacionamientos.
   - Caso negativo: crear `B-1` **activa** y luego intentar crear otra `B-1` → **409** (el dedupe
     sigue funcionando para activas).
2. `GET /condominios/{id}/capacidad-unidades` refleja los nuevos totales (las desactivadas no
   cuentan).
3. Regresión: batch de unidades, creación unitaria, wizard de onboarding intactos.
4. Suite de tests del backend (mencionar el total al responder para confirmar que no se rompió nada).

---

## 7. Decisiones de negocio ya tomadas (no renegociar en implementación)

1. **Reutilizar nombres tras desactivar es deseable**: el soft-delete no debe bloquear la
   numeración original del condominio.
2. **El dedupe sigue aplicando entre entidades activas** (no se permiten duplicados activos).
3. **Migración V63 obligatoria**: reemplazar los constraints UNIQUE `(condominio_id, nombre)` por
   índices únicos parciales `WHERE activo`. Sin esto, el re-insert falla con 500 por violación de
   constraint de BD.
4. **`desactivar` conserva su bloqueo por vínculos activos** (no se relaja).

