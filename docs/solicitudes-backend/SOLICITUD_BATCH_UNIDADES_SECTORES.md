# Solicitud Backend — Creación masiva (batch) de unidades y sectores

**Versión:** 1.0
**Fecha:** 2026-08-15
**Audiencia:** Equipo backend (Spring Boot / Flyway / JPA)
**Estado:** Pendiente de implementación
**Relacionado:** `UnidadController.java`, `UnidadService.java`, `SectorController.java`,
`SectorService.java`, `V60__capacidad_unidades_endpoint.sql`, `V62__permisos_sectores.sql`

---

## 1. Resumen ejecutivo

Se solicita un endpoint **batch de creación de unidades** para el paso 1 del wizard de
configuración del condominio (creación guiada de unidades: cantidad, tipo, numeración y
sectores). Hoy el ADMINISTRADOR debe crear cada unidad con un `POST /unidades` individual
(50 casas = 50 peticiones). Un único `POST /unidades/batch` permite crear todas las unidades
en **una transacción**, validando el envelope del plan y reportando errores fila a fila sin
crear nada si alguna falla.

Además, se solicita (opcional pero recomendado) un batch de sectores para crear torres/bloques
de una sola petición, preservando el orden de integridad: **sectores → unidades** (las unidades
referencian `sectorId`).

No requiere cambios de base de datos ni permisos nuevos (reutiliza `UNIDAD_CREAR` y `SECTOR_CREAR`).

---

## 2. Contexto y estado actual (verificado)

### 2.1 Creación unitaria de unidades

- `POST /api/v1/condominios/{condominioId}/unidades` (`UnidadController.java:44-51`,
  permiso `UNIDAD_CREAR`).
- DTO `CrearUnidadRequest.java`:
  ```java
  public record CrearUnidadRequest(
      @NotBlank @Size(max = 20) String numero,
      @NotNull TipoUnidad tipo,
      Integer piso,
      UUID sectorId) {}
  ```
- `UnidadService.crear` (`UnidadService.java:127-158`):
  1. Rechaza `tipo == CONDOMINIO` ("se crea automáticamente", línea 129).
  2. Rechaza número duplicado en el condominio (`existsByCondominioIdAndNumero`, línea 133).
  3. Resuelve el `Condominio` (línea 137).
  4. **`capacidadPlanService.validarEnvelope`** (línea 141): total
     (unidades sin `CONDOMINIO` + estacionamientos + bodegas activos) < `plan.unidadLimit`.
  5. Resuelve el `Sector` si viene `sectorId` (línea 144).
  6. Persiste la unidad.

### 2.2 CRUD de sectores (nuevo, ya implementado)

- `SectorController.java` (`/api/v1/condominios/{condominioId}/sectores`): `GET`, `GET /{id}`,
  `POST` (`SECTOR_CREAR`), `PUT /{id}`, `PATCH /{id}/desactivar` (409 si tiene unidades,
  bodegas, estacionamientos o espacios comunes activos).
- `CrearSectorRequest.java`:
  ```java
  public record CrearSectorRequest(
      @NotBlank @Size(max = 100) String nombre,
      String descripcion) {}
  ```
- `SectorResponse.java`: `{id, nombre, descripcion, activo, createdAt, updatedAt}`.
- Permisos en V62: rol `ADMINISTRADOR` tiene `SECTOR_VER/CREAR/EDITAR/ELIMINAR`.

### 2.3 Capacidad y envelope

- `GET /condominios/{condominioId}/capacidad-unidades` (`CapacidadUnidadesController`, V60)
  expone capacidades declaradas por tipo + `totalCasas/Departamentos/Estacionamientos/Bodegas/Otro`
  + `totalActual` + `planUnidadLimit`. **Informativo** (no bloquea).
- El tope duro real es el envelope del plan: `unidades(no CONDOMINIO) + estacionamientos +
  bodegas activos ≤ plan.unidadLimit` (`CapacidadPlanService.validarEnvelope`).
- No existe **ningún** endpoint batch de unidades ni de sectores.

---

## 3. Problema que resuelve

El wizard de configuración del condominio (paso "Unidades") genera la lista completa de unidades
(cantidad, tipo, numeración correlativa/por piso/personalizada y asignación de sectores) y
necesita guardarla de una vez. Con el endpoint actual:

1. **50-200 peticiones HTTP** por guardado (una por unidad), lento y ruidoso.
2. Sin **atomicidad**: si una unidad falla a mitad de lote (p. ej. envelope alcanzado), quedan
   unidades creadas parcialmente y el wizard debe conciliar cuáles entraron.
3. El order **sectores → unidades** obliga a dos rondas de peticiones con estado intermedio.

El batch resuelve: 1 petición, **transacción atómica** (o falla todo y no crea nada, o crea
todo), validación del envelope sobre el lote completo, y reporte **fila a fila** de errores
para que el frontend los muestre en la tabla de previsualización.

---

## 4. Requerimientos de implementación

### 4.1 `POST /api/v1/condominios/{condominioId}/unidades/batch`

**Permiso:** `UNIDAD_CREAR` (mismo que la creación unitaria).

**Request — `CrearUnidadesBatchRequest`:**
```java
public record CrearUnidadesBatchRequest(
    @NotEmpty List<Item> unidades) {

  public record Item(
      @NotBlank @Size(max = 20) String numero,
      @NotNull TipoUnidad tipo,
      Integer piso,
      UUID sectorId) {}
}
```

Ejemplo:
```json
{
  "unidades": [
    { "numero": "101", "tipo": "DEPARTAMENTO", "piso": 1, "sectorId": "uuid-torre-a" },
    { "numero": "102", "tipo": "DEPARTAMENTO", "piso": 1, "sectorId": "uuid-torre-a" },
    { "numero": "201", "tipo": "DEPARTAMENTO", "piso": 2, "sectorId": "uuid-torre-a" }
  ]
}
```

**Response 201 — `CrearUnidadesBatchResponse`:**
```java
public record CrearUnidadesBatchResponse(
    List<UnidadCreada> creadas) {

  public record UnidadCreada(
      UUID id,
      String numero,
      String tipo,
      Integer piso,
      UUID sectorId,
      String sectorNombre,
      boolean activo) {}
}
```

**Semántica (atómica — recomendada):**
- **Una sola transacción.** Todas las validaciones se ejecutan **antes** de persistir.
- **Si alguna unidad del lote falla, NO se crea ninguna** y se responde **409** con el
  reporte de errores por fila (formato `ErrorResponse`, sección 4.4). El frontend corrige y
  reintenta el lote completo.
- Si todo es válido, se crean todas y se responde 201 con la lista completa de creadas
  (misma estructura que `UnidadResumenResponse`, más `sectorId`).

**Validaciones por ítem (mismas reglas que `UnidadService.crear`):**
1. `tipo != CONDOMINIO` (se crea automáticamente) → error por ítem.
2. `numero` único **dentro del lote** (sin duplicados entre sí).
3. `numero` único **en el condominio** (`existsByCondominioIdAndNumero`) → error por ítem.
4. `sectorId` existe y pertenece al condominio → error por ítem.
5. **Envelope del plan sobre el lote completo**: `totalActual + nuevos(no CONDOMINIO) >
   plan.unidadLimit` → error global (la validación de ítems y la de envelope se reportan juntas).
   Recomendación: validar ítem por ítem acumulando el conteo, y si el envelope se alcanza en el
   ítem N, ese ítem y los siguientes entran al reporte con el error de envelope.

**Código de servicio sugerido (pseudocódigo):**
```java
@Transactional
public CrearUnidadesBatchResponse crearBatch(UUID condominioId, CrearUnidadesBatchRequest request) {
  var condominio = condominioRepository.findById(condominioId)
      .orElseThrow(() -> new NotFoundException("Condominio", condominioId));

  List<UnidadCreada> creadas = new ArrayList<>();
  List<ErrorItem> errores = new ArrayList<>();
  Set<String> numerosLote = new HashSet<>();

  long totalActual = capacidadPlanService.totalActual(condominio);
  int limite = condominio.getPlan() != null ? condominio.getPlan().getUnidadLimit()
                                            : Integer.MAX_VALUE;

  for (Item item : request.unidades()) {
    // 1. dedupe dentro del lote
    if (!numerosLote.add(item.numero())) {
      errores.add(ErrorItem.de(item, "Número duplicado en el lote: " + item.numero()));
      continue;
    }
    // 2. tipo reservado
    if (item.tipo() == TipoUnidad.CONDOMINIO) {
      errores.add(ErrorItem.de(item, "La unidad del condominio se crea automáticamente."));
      continue;
    }
    // 3. dedupe contra la base
    if (unidadRepository.existsByCondominioIdAndNumero(condominioId, item.numero())) {
      errores.add(ErrorItem.de(item, "Ya existe una unidad con el número: " + item.numero()));
      continue;
    }
    // 4. sector
    Sector sector = null;
    if (item.sectorId() != null) {
      sector = sectorRepository.findById(item.sectorId())
          .filter(s -> s.getCondominio().getId().equals(condominioId))
          .orElse(null);
      if (sector == null) {
        errores.add(ErrorItem.de(item, "El sector no existe: " + item.sectorId()));
        continue;
      }
    }
    // 5. envelope acumulado
    if (totalActual >= limite) {
      errores.add(ErrorItem.de(item,
          "El plan contratado permite hasta " + limite + " entidades en total "
          + "(unidades, estacionamientos y bodegas). Ya hay " + totalActual + "."));
      continue;
    }
    totalActual++;
    Unidad u = unidadRepository.save(Unidad.builder()
        .condominio(condominio).sector(sector).numero(item.numero())
        .tipo(item.tipo()).piso(item.piso()).build());
    creadas.add(UnidadCreada.de(u));
  }

  if (!errores.isEmpty()) {
    throw new BatchValidationException(errores); // → 409 con ErrorResponse (sección 4.4)
  }
  return new CrearUnidadesBatchResponse(creadas);
}
```

Nota: el pseudocódigo acumula el envelope ítem a ítem (los errores de envelope quedan
reportados por fila). Si se prefiere un `totalActual + request.unidades().size() > limite`
global antes del bucle, también es válido — pero se pierde el detalle por fila.

### 4.2 `POST /api/v1/condominios/{condominioId}/sectores/batch` (opcional pero recomendado)

**Permiso:** `SECTOR_CREAR`.

**Request:**
```json
{ "sectores": [ { "nombre": "Torre A", "descripcion": "Torre norte" }, ... ] }
```
**DTO — `CrearSectoresBatchRequest`:**
```java
public record CrearSectoresBatchRequest(
    @NotEmpty List<@Valid CrearSectorRequest> sectores) {}
```

**Response 201:**
```json
{ "creados": [ { "id": "uuid", "nombre": "Torre A", "descripcion": "Torre norte",
                 "activo": true, "createdAt": "...", "updatedAt": "..." } ] }
```
(`List<SectorResponse>` o wrapper `{creados: [...]}`.)

**Semántica:** transacción única; no hay unicidad natural de nombre (solo `@NotBlank`), por lo
que el caso de error es poco frecuente. Se incluye para guardar torres/bloques en 1 petición y
devolver los `id` para el batch de unidades.

### 4.3 Controller

```java
@PostMapping("/batch")
@PreAuthorize("hasPermission(null, 'UNIDAD_CREAR')")
public ResponseEntity<CrearUnidadesBatchResponse> crearBatch(
    @PathVariable UUID condominioId,
    @Valid @RequestBody CrearUnidadesBatchRequest request,
    @AuthenticationPrincipal Usuario usuario) {
  condominioAccessService.validarAcceso(usuario, condominioId);
  return ResponseEntity.status(201).body(unidadService.crearBatch(condominioId, request));
}
```
> Cuidado con el orden de mapeo: `POST /unidades/batch` no debe colisionar con
> `GET /unidades/{unidadId}` (Spring prioriza el mapeo literal sobre la variable de path).

### 4.4 Errores esperados (formato estándar `ErrorResponse`)

| Caso | HTTP | Mensaje de ejemplo |
|---|---|---|
| Una o más unidades inválidas (nada se crea) | 409 | `{ "message": "4 unidades no pudieron crearse", "fields": [ { "field": "unidades[2].numero", "message": "Ya existe una unidad con el número: 201" } ] }` |
| Lote vacío | 400 | `{ "message": "Debe incluir al menos una unidad" }` (bean validation) |
| Sin permiso | 403 | (manejo estándar de seguridad) |

El frontend usa `console.error` en todos los catch y muestra el `message` + `fields[]` de
`ErrorResponse` (patrón existente en todo el proyecto; ver `mensajeError` en el frontend).

---

## 5. Contrato esperado por el frontend (para validar el request/response)

### 5.1 Flujo de guardado del wizard (orden de integridad)

1. `POST /sectores/batch` (o `POST /sectores` por cada sector) → se obtienen los `id`.
2. `POST /unidades/batch` con `sectorId` resuelto de los sectores creados/existentes.
3. Si el batch de unidades responde 409, el wizard muestra los errores por fila en la tabla de
   previsualización (número en rojo + mensaje) y permite corregir/reintentar.

### 5.2 Ejemplo completo (2 sectores, 6 departamentos por piso)

```json
// 1) POST /sectores/batch
{ "sectores": [ { "nombre": "Torre A", "descripcion": "Torre norte" },
                { "nombre": "Torre B", "descripcion": "Torre sur" } ] }

// 2) POST /unidades/batch
{ "unidades": [
    { "numero": "101", "tipo": "DEPARTAMENTO", "piso": 1, "sectorId": "uuid-a" },
    { "numero": "102", "tipo": "DEPARTAMENTO", "piso": 1, "sectorId": "uuid-a" },
    { "numero": "103", "tipo": "DEPARTAMENTO", "piso": 1, "sectorId": "uuid-a" },
    { "numero": "201", "tipo": "DEPARTAMENTO", "piso": 2, "sectorId": "uuid-b" },
    { "numero": "202", "tipo": "DEPARTAMENTO", "piso": 2, "sectorId": "uuid-b" },
    { "numero": "203", "tipo": "DEPARTAMENTO", "piso": 2, "sectorId": "uuid-b" }
  ] }
```

---

## 6. Verificación sugerida

1. Con token ADMINISTRADOR del condominio:
   - Crear 2 sectores con `POST /sectores/batch` → 201 con 2 `id`.
   - Crear 6 unidades con `POST /unidades/batch` con `sectorId` → 201 con las 6 creadas
     (id + sectorNombre poblado).
   - Repetir el mismo batch → **409** con errores por fila "Ya existe una unidad con el número"
     y **ninguna** nueva creada (verificar conteo con `GET /unidades`).
   - Lote con número duplicado dentro del mismo request → 409 reportando el duplicado.
   - Lote con `tipo: "CONDOMINIO"` → 409 por ítem.
   - Lote con `sectorId` inexistente → 409 por ítem.
   - Lote que supera `plan.unidadLimit - totalActual` → 409 con error de envelope.
   - Caso mixto (2 válidas + 1 duplicada) → **409 global** y `GET /unidades` muestra que **no**
     se creó ninguna (atomicidad).
2. `GET /condominios/{id}/capacidad-unidades` refleja el nuevo `totalActual` tras el batch.
3. Regresión: creación unitaria (`POST /unidades`) intacta; wizard de onboarding intacto.
4. Suite de tests del backend (mencionar el total al responder para confirmar que no se rompió nada).

---

## 7. Decisiones de negocio ya tomadas (no renegociar en implementación)

1. **Atomicidad del batch de unidades**: o se crea el lote completo o no se crea nada (409 con
   reporte por fila). El wizard filtra previamente los números existentes, por lo que el dedupe
   contra BD es solo una red de seguridad.
2. **Envelope del plan**: `totalActual + nuevos ≤ plan.unidadLimit`, con `totalActual` definido
   como en `CapacidadPlanService` (unidades sin `CONDOMINIO` + estacionamientos + bodegas).
3. **Orden de integridad**: sectores primero, unidades después (con `sectorId`). El batch de
   unidades **valida** que el `sectorId` exista y pertenezca al condominio.
4. **Sin migración de base de datos**: solo DTOs + servicio + controller + tests.
5. **`CONDOMINIO` nunca se crea manualmente** (sigue rechazado, igual que la creación unitaria).
