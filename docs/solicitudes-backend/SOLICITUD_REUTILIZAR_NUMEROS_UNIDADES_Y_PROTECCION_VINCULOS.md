# Solicitud Backend — Reutilizar números de unidades desactivadas y proteger la integridad de los vínculos al renombrar/cambiar tipo (unidades, estacionamientos y bodegas)

**Versión:** 1.0
**Fecha:** 2026-08-17
**Audiencia:** Equipo backend (Spring Boot / JPA)
**Estado:** ⏳ Pendiente de implementación
**Relacionado:** `UnidadRepository.java`, `UnidadService.java`, `EstacionamientoService.java`,
`BodegaService.java`, `V1__initial_schema.sql`, `V58__*.sql`, `V59__*.sql`,
`V63__reutilizar_nombres_tras_desactivar.sql` (implementada),
`SOLICITUD_REUTILIZAR_NOMBRES_TRAS_DESACTIVAR.md` (implementada, P11)

---

## 1. Resumen ejecutivo

Dos cambios relacionados en la gestión de **unidades**, **estacionamientos** y **bodegas**:

1. **Reutilizar números de unidades desactivadas (Parte A, patrón P11/V63):** hoy el dedupe de
   unidades (`existsByCondominioIdAndNumero`) **no excluye las filas inactivas**, y el constraint
   `uq_unidad_numero` es UNIQUE sobre **todas** las filas. Un número desactivado queda ocupado para
   siempre → el wizard de configuración no puede "eliminar todas las unidades y recrear la misma
   numeración" (el batch responde 409 por fila). Se pide migrar el constraint a un **índice único
   parcial `WHERE activo`** y ajustar el dedupe a solo activas, igual que ya se hizo para
   estacionamientos/bodegas (V63).

2. **Proteger la integridad de los vínculos al renombrar / cambiar el tipo (Parte B):** si una
   entidad tiene **vínculos activos** (personas y/o vehículos en unidades; vínculos de estacionamiento
   o bodega), su nombre/número es la **identidad visual** que el usuario ya asoció (los vínculos
   apuntan por UUID, pero la referencia humana es el nombre). Por eso:
   - ❌ **No se permite renombrar** (cambiar `numero`/`nombre`).
   - ❌ **No se permite cambiar el `tipo`** (solo existe en unidades: CASA/DEPARTAMENTO/OTRO).
   - ❌ **No se permite desactivar** (ya bloqueado por backend).
   - ✅ **Sí se permite modificar `sector` y `piso`** (son "tags", no vinculantes ni destructivos).

   Esta regla aplica a **unidades, estacionamientos y bodegas** por igual.

---

## 2. Contexto y estado actual (verificado)

### 2.1 Soft-delete y bloqueo por vínculos

- `UnidadService.desactivar` (`UnidadService.java:272-292`): marca `activo=false` y bloquea si la
  unidad tiene vínculos **de persona** activos (`UnidadService.java:281-288`). **No cuenta
  vehículos** (bug a corregir, ver §4.4). Bloquea la unidad CONDOMINIO (`:276-279`).
- `EstacionamientoService.desactivar` / `BodegaService.desactivar`: bloquean con vínculos activos
  (correcto, no se toca).
- Los listados (`UnidadService.listar` → `findActivasConSectorByCondominioId`, `:50-53`), los
  conteos y el envelope del plan ya filtran por `activo=true` y excluyen CONDOMINIO.

### 2.2 El problema de reutilizar números de unidades (Parte A)

- `V1:175` → `CONSTRAINT uq_unidad_numero UNIQUE (condominio_id, numero)` — aplica a **todas** las
  filas (activas e inactivas).
- `UnidadRepository.java:38-39` → `boolean existsByCondominioIdAndNumero(UUID condominioId, String numero);`
- Llamadas (3): `UnidadService.crear:137`, `UnidadService.crearBatch:202`, `UnidadService.actualizar:253`.

Como la fila desactivada sigue existiendo, su número queda ocupado para siempre: recrearlo devuelve
409. Si solo se cambiara la derived query, el `INSERT` violaría el constraint de BD →
`DataIntegrityViolationException` → 500. Por eso se requiere la migración V64 (§4.1).

### 2.3 El problema de renombrar/cambiar tipo con vínculos (Parte B)

Hoy `actualizar` permite cambiar libremente `numero`, `tipo`, `sector` y `piso` sin consultar si la
entidad tiene vínculos activos:

- `UnidadService.actualizar` (`:243-269`): cambia `numero`, `tipo`, `piso` y `sector` sin restricción.
- `EstacionamientoService.actualizar` (`:168-191`) y `BodegaService.actualizar` (`:168-191`): cambian
  `nombre`, `piso` y `sector` sin restricción.

Los vínculos apuntan por **UUID** (`unidadId`/`estacionamientoId`/`bodegaId`), por lo que renombrar
no rompe la FK, pero sí rompe la **integridad semántica**: el usuario conoce la entidad por su
nombre ("Casa 5", "E-2") y ese nombre ya fue vinculado (persona vive en "Casa 5", vehículo usa
"E-2"). Si se permite renombrar/recambiar el tipo de una entidad con vínculos, el vínculo queda
"diciendo" una referencia visual que ya no existe.

---

## 3. Problema que resuelve

En el wizard de configuración:

1. **Unidades (paso 1):** el ADMINISTRADOR elimina todas las unidades (fase 5 → papelera → Guardar)
   y luego regresa al wizard de creación para regenerar la numeración original en lote. Sin la
   Parte A, el batch falla completo con 409 por fila ("Ya existe una unidad con el número: 1").
2. **Modo edición (fase 5, unidades y entidades):** el ADMINISTRADOR puede renombrar/re-clasificar
   (p.ej. cambiar el tipo de "Casa 2" a "Departamento 2") o renombrar un estacionamiento/bodega que
   **ya tiene vínculos activos** (personas vinculadas, vehículos asignados, PROPIETARIO de estacionamiento).
   Sin la Parte B, el PUT cambia el nombre visual y los vínculos existentes quedan apuntando a una
   referencia que ya no existe — rompe la integridad percibida de la aplicación.

---

## 4. Requerimientos de implementación

### 4.1 Migración de base de datos OBLIGATORIA (V64) — Parte A

Reemplazar el constraint UNIQUE de unidades por un **índice único parcial** que solo aplica a filas
activas (mismo patrón que `V63__reutilizar_nombres_tras_desactivar.sql` para estacionamientos/bodegas):

```sql
ALTER TABLE unidades DROP CONSTRAINT uq_unidad_numero;
CREATE UNIQUE INDEX uq_unidad_numero_activo
    ON unidades (condominio_id, numero) WHERE activo;
```

El índice único parcial es la garantía de integridad a nivel BD (defensa en profundidad): permite
coexistir una fila activa y una inactiva con el mismo número, pero impide dos activas.

### 4.2 Cambiar el dedupe de unidades a solo activas (Parte A)

`UnidadRepository.java`:

```java
boolean existsByCondominioIdAndNumeroAndActivoTrue(UUID condominioId, String numero);
```

Actualizar las **3 llamadas** en `UnidadService` (`crear:137`, `crearBatch:202`, `actualizar:253`).
El mensaje de error se mantiene ("Ya existe una unidad con el número: X") — solo cambia el criterio.

### 4.3 Proteger la integridad al renombrar/cambiar tipo con vínculos (Parte B) — unidades

`UnidadService.actualizar` (`:243-269`): si cambia `numero` **o** `tipo` y la unidad tiene **vínculos
activos** (personas + vehículos), lanzar error **sin persistir ningún cambio**. Si solo cambian
`sector`/`piso`, continuar normal (sin restricción).

Conteo de vínculos activos de la unidad:

```java
long personas = vinculoPersonaRepository.findByUnidadIdAndActivoTrue(unidadId).size();
long vehiculos = vinculoVehiculoRepository.findByUnidadIdAndActivoTrue(unidadId).size();
```

Mensaje sugerido:

```
La unidad tiene N vínculo(s) activo(s) y no se puede cambiar el número ni el tipo.
Solo se puede asignar sector o piso.
```

(El conteo puede unificarse en un único helper privado `contarVinculosActivos(unidadId)` para
reusarlo en `actualizar` y `desactivar`.)

### 4.4 Ampliar el conteo de `desactivar` de unidades a vehículos (Parte B)

`UnidadService.desactivar` (`:281-288`) hoy solo cuenta vínculos de persona. Ampliarlo a
**personas + vehículos** para que una unidad con vehículo activo (y sin persona activa) tampoco
pueda desactivarse. El mensaje ya bloquea y solo cambia el conteo.

### 4.5 Proteger la integridad al renombrar con vínculos (Parte B) — estacionamientos y bodegas

- `EstacionamientoService.actualizar` (`:168-191`): si cambia `nombre` y hay vínculos activos
  (`VinculoEstacionamientoRepository.findByEstacionamientoIdAndActivoTrue`) → error.
- `BodegaService.actualizar` (`:168-191`): si cambia `nombre` y hay vínculos activos
  (`VinculoBodegaRepository.findByBodegaIdAndActivoTrue`) → error.

`sector` y `piso` quedan editables sin restricción en las tres entidades. `desactivar` ya bloquea
con vínculos activos y no se toca (solo el de unidades se amplía, §4.4).

### 4.6 Sin cambios en crear / batch de creación

`crear` y `crearBatch` crean entidades **sin vínculos** → la Parte B no aplica. Solo se toca el
dedupe de la Parte A (`crearBatch` de unidades). No se requieren permisos nuevos.

---

## 5. Contrato esperado por el frontend (para validar el request/response)

Flujo de reedición del wizard (fase 5, modo edición):

1. **Renombrar/cambiar tipo con vínculos activos:** `PUT /condominios/{cid}/unidades/{id}` con un
   `numero`/`tipo` distinto → **debe responder 409** (hoy responde 200). Ídem
   `PUT .../estacionamientos/{id}` y `PUT .../bodegas/{id}` con `nombre` distinto.
2. **Cambiar solo sector/piso con vínculos activos:** `PUT .../unidades/{id}` con `sectorId`/`piso`
   distinto (mismo `numero` y `tipo`) → **200**.
3. **Eliminar todo + recrear numeración (unidades):**
   - `PATCH /condominios/{cid}/unidades/{id}/desactivar` por cada fila eliminada.
   - El frontend vuelve al wizard de creación (fase 1) si no quedan unidades activas.
   - `POST /condominios/{cid}/unidades/batch` con la numeración original → **debe responder 201**
     (hoy responde 409 por fila).
4. Los errores 409 deben llegar como `ErrorResponse` con mensaje legible (el frontend mapea el error
   a la fila sin perder el resto del batch/PUTs).

---

## 6. Verificación sugerida

1. Con token ADMINISTRADOR del condominio:
   - **Unidades — reutilización:** crear `1` → 201. Desactivarla (`PATCH .../desactivar`) → 200.
     Crear `1` de nuevo (unitario) → **201** (hoy 409). `POST /unidades/batch` con `["1", "2"]` →
     **201** con ambas creadas. Renombrar otra unidad a `1` (con la `1` desactivada) → **200**.
   - **Unidades — integridad:** con una unidad con vínculo de persona activo: renombrarla (cambiar
     `numero`) → **409**; cambiarle `tipo` → **409**; cambiarle solo `sector`/`piso` → **200**.
     Con una unidad con vehículo activo (y sin persona): `desactivar` → **409** (hoy 200).
   - **Estacionamientos/bodegas — integridad:** con un estacionamiento/bodega con vínculo activo:
     renombrarlo (`nombre`) → **409**; cambiar solo `sector`/`piso` → **200**.
   - Caso negativo de dedupe: crear `1` **activa** y luego intentar crear otra `1` → **409**.
2. `GET /condominios/{id}/capacidad-unidades` refleja los nuevos totales (las desactivadas no cuentan).
3. Regresión: batch de unidades, creación unitaria, wizard de onboarding y wizard de
   estacionamientos/bodegas intactos.
4. Suite de tests del backend (mencionar el total al responder para confirmar que no se rompió nada).

---

## 7. Decisiones de negocio ya tomadas (no renegociar en implementación)

1. **Reutilizar números tras desactivar es deseable** en las tres entidades (el soft-delete no debe
   bloquear la numeración original del condominio). Para unidades: **migración V64 obligatoria**
   (constraint UNIQUE → índice único parcial `WHERE activo`).
2. **El dedupe sigue aplicando entre entidades activas** (no se permiten duplicados activos).
3. **Si la entidad tiene vínculos activos, su nombre/número y su tipo son inmutables**: no se puede
   renombrar ni cambiar el tipo (la referencia visual ya fue asociada por el usuario; los vínculos
   apuntan por UUID pero la identidad percibida es el nombre). Esto aplica a **unidades,
   estacionamientos y bodegas**.
4. **`sector` y `piso` son editables siempre** (actúan como tags; no son vinculantes ni destructivos).
5. **`desactivar` conserva su bloqueo por vínculos activos**, y en unidades se **amplía el conteo a
   vehículos** (hoy solo personas).
6. **Los cambios de `sector`/`piso` son la única vía de modificación** de una entidad con vínculos;
   si el frontend necesita renombrar, primero debe desactivar los vínculos.
