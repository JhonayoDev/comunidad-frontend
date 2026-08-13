# Solicitud Backend — Endpoint de capacidad de unidades para el rol ADMINISTRADOR

**Versión:** 1.0
**Fecha:** 2026-08-12
**Audiencia:** Equipo backend (Spring Boot)
**Estado:** Pendiente de implementación
**Relacionado:** `SOLICITUD_CAPACIDAD_UNIDADES_POR_TIPO.md` (V51, ya implementado)

---

## 1. Contexto

La capacidad de unidades por tipo (V51) se expone hoy **solo en el panel SaaS**
(`GET /api/v1/admin/condominios/{id}`, permiso de SUPER_ADMIN/SOPORTE). El rol
**ADMINISTRADOR** (y cargos) que crea las unidades **no tiene acceso** a ese endpoint y
**no existe ningún otro** que le devuelva la capacidad declarada.

El frontend de `UnidadesView.vue` (admin) necesita mostrar "X de Y" por tipo y bloquear la
creación cuando se alcanza el techo. El backend ya **refuerza el límite al crear** (error claro),
pero sin este endpoint el admin no ve el cupo restante.

## 2. Solicitud

Nuevo endpoint **GET** en `UnidadController` (base `/api/v1/condominios/{condominioId}/unidades`),
permiso **`UNIDAD_VER`** (el mismo que ya usa `GET /unidades`):

```
GET /api/v1/condominios/{condominioId}/capacidad-unidades
```

Response (record `CapacidadUnidadesResponse`):

```json
{
  "capacidadCasas": 100,
  "capacidadDepartamentos": 0,
  "capacidadEstacionamientos": 120,
  "capacidadBodegas": 3,
  "capacidadOtro": 0,
  "totalCasas": 100,
  "totalDepartamentos": 0,
  "totalEstacionamientos": 93,
  "totalBodegas": 3,
  "totalOtro": 0
}
```

- `capacidad*`: valor declarado en `condominios.capacidad_*` (puede ser `null` = sin tope).
- `total*`: `unidadRepository.countByCondominioIdAndTipoAndActivoTrue(condominioId, TipoUnidad.X)`
  (método ya existente desde V51).

Implementación sugerida en `UnidadService`:

```java
public CapacidadUnidadesResponse capacidadUnidades(UUID condominioId) {
  Condominio c = condominioRepository.findById(condominioId)
      .orElseThrow(() -> new NotFoundException("Condominio", condominioId));
  return new CapacidadUnidadesResponse(
      c.getCapacidadCasas(), c.getCapacidadDepartamentos(),
      c.getCapacidadEstacionamientos(), c.getCapacidadBodegas(), c.getCapacidadOtro(),
      unidadRepository.countByCondominioIdAndTipoAndActivoTrue(condominioId, TipoUnidad.CASA),
      unidadRepository.countByCondominioIdAndTipoAndActivoTrue(condominioId, TipoUnidad.DEPARTAMENTO),
      unidadRepository.countByCondominioIdAndTipoAndActivoTrue(condominioId, TipoUnidad.ESTACIONAMIENTO),
      unidadRepository.countByCondominioIdAndTipoAndActivoTrue(condominioId, TipoUnidad.BODEGA),
      unidadRepository.countByCondominioIdAndTipoAndActivoTrue(condominioId, TipoUnidad.OTRO));
}
```

## 3. Verificación sugerida

1. Con token ADMINISTRADOR del condominio: `GET /condominios/{cid}/capacidad-unidades` → 200 con
   capacidades + conteos.
2. Condominio sin capacidades declaradas (`NULL`): `capacidad*` en `null`, `total*` reales.
3. Regresión: `GET /unidades` intacto.

## 4. Notas

- El frontend ya consume este endpoint (`unidadesService.getCapacidad`) con **degradación suave**:
  si responde 404 (endpoint aún no implementado), la vista muestra solo el uso por tipo y deja que
  el backend refuerce el límite al crear. Al implementarlo, se activa el bloqueo visual y el cupo.