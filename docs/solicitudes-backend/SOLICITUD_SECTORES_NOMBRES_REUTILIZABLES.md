# Solicitud Backend — Reutilizar nombres de sectores desactivados (dedupe ignora `activo=false`)

**Versión:** 1.0
**Fecha:** 2026-08-17
**Audiencia:** Equipo backend (Spring Boot / JPA)
**Estado:** ⏳ Pendiente de implementación
**Relacionado:** `SectorRepository.java`, `SectorService.java`, `V62__permisos_sectores.sql`,
`V63__reutilizar_nombres_tras_desactivar.sql` (implementada, P11),
`SOLICITUD_REUTILIZAR_NOMBRES_TRAS_DESACTIVAR.md` (implementada, P11)

---

## 1. Resumen ejecutivo

El frontend va a incorporar una **vista de gestión de sectores** (etapa 2 del wizard de
configuración del ADMINISTRADOR, tras "Unidades"): listar sectores activos, crear, editar
(nombre/descripción) y desactivar, con la salvaguarda de que un sector **en uso** (con unidades,
bodegas, estacionamientos o espacios comunes activos) no se puede desactivar (409, ya implementado).

Para mantener la **consistencia con estacionamientos/bodegas/unidades** (patrón P11/V63/V64), se pide
que **desactivar un sector libere su nombre** para poder volver a crearlo. Hoy el dedupe de sectores
(`existsByCondominioIdAndNombre`) **no excluye las filas inactivas**, por lo que un sector desactivado
("Torre A") deja su nombre ocupado para siempre → el ADMINISTRADOR no puede recrearlo.

**No se requiere migración de BD** (la tabla `sectores` no tiene constraint UNIQUE sobre
`(condominio_id, nombre)`); basta cambiar la derived query a solo activas en las 3 llamadas.

---

## 2. Contexto y estado actual (verificado)

- `SectorRepository.java:23` → `boolean existsByCondominioIdAndNombre(UUID condominioId, String nombre);`
  — **no distingue `activo`**.
- Llamadas (3) en `SectorService.java`:
  - `crear:53` → `if (sectorRepository.existsByCondominioIdAndNombre(condominioId, request.nombre()))`
  - `crearBatch:88` → `if (sectorRepository.existsByCondominioIdAndNombre(condominioId, item.nombre()))`
  - `actualizar:115` → `if (!sector.getNombre().equals(request.nombre()) && sectorRepository.existsByCondominioIdAndNombre(condominioId, request.nombre()))`
- La tabla `sectores` (V1) tiene `pk_sectores`, `fk_sectores_cond` e `idx_sectores_cond` — **sin
  constraint UNIQUE sobre `(condominio_id, nombre)`**. El dedupe es 100% a nivel de servicio.
- `GET /condominios/{cid}/sectores` lista solo activos (`findByCondominioIdAndActivoTrueOrderByNombreAsc`).
- `PATCH /sectores/{id}/desactivar` ya bloquea con 409 si el sector tiene elementos activos
  (`SectorService.desactivar:127-148`): unidades, bodegas, estacionamientos y espacios comunes.
- `PUT /sectores/{id}` (`actualizar`) acepta `{nombre, descripcion, activo}` y permite reactivar
  (`activo=true`) sin validar referencias — no se toca.

---

## 3. Problema que resuelve

En la futura vista de gestión de sectores (etapa 2 del wizard):

1. El ADMINISTRADOR desactiva "Torre A" (porque ya no aplica o se equivocó).
2. Luego quiere volver a crearla (misma numeración/estructura del condominio).
3. Sin este cambio, `POST /sectores` responde 409 "Ya existe un sector con el nombre: Torre A" y el
   nombre queda ocupado para siempre.

Con el cambio, desactivar libera el nombre → recrear "Torre A" responde 201. Mismo comportamiento
que estacionamientos/bodegas (V63) y unidades (V64).

---

## 4. Requerimientos de implementación

### 4.1 Cambiar el dedupe de sectores a solo activas

`SectorRepository.java`:

```java
boolean existsByCondominioIdAndNombreAndActivoTrue(UUID condominioId, String nombre);
```

Actualizar las **3 llamadas** en `SectorService` (`crear:53`, `crearBatch:88`, `actualizar:115`).
El mensaje de error se mantiene ("Ya existe un sector con el nombre: X") — solo cambia el criterio.

### 4.2 Sin migración de BD

No hay constraint UNIQUE en `sectores` → no se requiere migración ni índice parcial (a diferencia de
unidades V64). El dedupe a nivel de servicio es suficiente.

### 4.3 Sin cambios en `desactivar` ni `actualizar`

- `desactivar` ya bloquea con 409 si hay elementos activos en el sector — no se toca.
- `actualizar` ya permite renombrar (incluso sectores en uso) y reactivar (`activo=true`) — no se
  toca. La única vía de "recuperar" un sector desactivado es **recrearlo con el mismo nombre**
  (consistente con estacionamientos/bodegas/unidades); no se pide un flujo de reactivación.

---

## 5. Contrato esperado por el frontend (para validar el request/response)

Flujo de la vista de gestión de sectores:

1. **Desactivar y recrear el mismo nombre:**
   - `PATCH /condominios/{cid}/sectores/{id}/desactivar` → 204 (sector sin elementos activos).
   - `POST /condominios/{cid}/sectores` con el mismo `nombre` → **debe responder 201** (hoy 409).
2. **Dedupe entre activos se mantiene:** crear "Torre A" activa y luego intentar crear otra "Torre A"
   activa → **409**.
3. **Desactivar sector en uso:** `PATCH .../desactivar` con unidades/bodegas/estacionamientos/espacios
   comunes activos → **409** con el mensaje detallado actual (sin cambios).
4. Los errores 409 deben llegar como `ErrorResponse` con mensaje legible (el frontend mapea el error
   a la fila).

---

## 6. Verificación sugerida

1. Con token ADMINISTRADOR del condominio:
   - Crear "Torre A" → 201. Desactivarla (`PATCH .../desactivar`) → 204. Crear "Torre A" de nuevo
     (unitario) → **201** (hoy 409). Ídem con `POST /sectores/batch` incluyendo "Torre A".
   - Renombrar otro sector a "Torre A" (con la "Torre A" desactivada) → **200**.
   - Caso negativo: crear "Torre A" **activa** y luego intentar crear otra "Torre A" → **409**.
   - Desactivar un sector con una unidad activa asignada → **409** con el mensaje de conteo.
2. `GET /condominios/{cid}/sectores` sigue devolviendo solo activos (las desactivadas no aparecen).
3. Regresión: batch de sectores del wizard de unidades/estacionamientos/bodegas intacto.
4. Suite de tests del backend (mencionar el total al responder para confirmar que no se rompió nada).

---

## 7. Decisiones de negocio ya tomadas (no renegociar en implementación)

1. **Reutilizar nombres de sectores tras desactivar es deseable** (el soft-delete no debe bloquear la
   estructura de sectores del condominio). Consistente con estacionamientos/bodegas (V63) y unidades
   (V64).
2. **El dedupe sigue aplicando entre sectores activos** (no se permiten duplicados activos).
3. **No se pide un flujo de reactivación** ("recuperar" un sector desactivado): la vía es recrearlo
   con el mismo nombre. Tampoco se pide exponer sectores inactivos en `GET /sectores`.
4. **Renombrar un sector en uso sigue permitido** (es solo etiqueta; las referencias son por ID).
5. **Desactivar un sector en uso sigue bloqueado** (409 con conteo por tipo de elemento).