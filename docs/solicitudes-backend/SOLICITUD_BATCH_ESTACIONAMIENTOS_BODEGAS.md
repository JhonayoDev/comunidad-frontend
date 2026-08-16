# Solicitud Backend — Creación masiva (batch) de estacionamientos y bodegas

**Versión:** 1.0
**Fecha:** 2026-08-15
**Audiencia:** Equipo backend (Spring Boot / Flyway / JPA)
**Estado:** Pendiente de implementación
**Relacionado:** `EstacionamientoController.java`, `EstacionamientoService.java`,
`BodegaController.java`, `BodegaService.java`, `SectorController.java`,
`CapacidadPlanService.java`, `SOLICITUD_BATCH_UNIDADES_SECTORES.md` (implementada)

---

## 1. Resumen ejecutivo

Se solicitan endpoints **batch de creación de estacionamientos y bodegas** para el paso
"Estacionamientos y bodegas" del wizard de configuración del condominio (misma mecánica que el
batch de unidades ya implementado). Hoy el ADMINISTRADOR debe crear cada estacionamiento/bodega
con un `POST` individual (50 estacionamientos = 50 peticiones). Un único `POST .../batch` crea
todos en **una transacción**, validando el envelope del plan y reportando errores fila a fila
sin crear nada si alguna falla.

Además, se corrige un **bug cross-tenant de sector** en la creación unitaria (ver sección 2.3):
`EstacionamientoService.crear/actualizar` y `BodegaService.crear/actualizar` resuelven el sector
con `sectorRepository.findById` **sin filtrar por condominio**, permitiendo vincular un sector de
otro condominio. El batch debe usar `findByIdAndCondominioId` (scoped, como `UnidadService.crearBatch`).

No requiere cambios de base de datos ni permisos nuevos (reutiliza `UNIDAD_CREAR`). Los sectores
nuevos para estacionamientos/bodegas se crean con el batch de sectores ya existente
(`POST /sectores/batch`, `SECTOR_CREAR`).

---

## 2. Contexto y estado actual (verificado)

### 2.1 CRUD unitario de estacionamientos

- `EstacionamientoController.java` (`/api/v1/condominios/{condominioId}/estacionamientos`):
  `GET`, `POST` (`UNIDAD_CREAR`), `GET /{id}`, `PUT /{id}`, `PATCH /{id}/desactivar` (409 si hay
  vínculos activos), vínculos `GET/POST /{id}/vinculos` + `PATCH /{id}/vinculos/{v}/desactivar`.
- `CrearEstacionamientoRequest.java`:
  ```java
  public record CrearEstacionamientoRequest(
      @NotBlank @Size(max = 30) String nombre,
      Integer piso,
      UUID sectorId) {}
  ```
- `EstacionamientoResponse.java`: `{id, nombre, piso, sectorId, sectorNombre, activo,
  propietario, arrendatarioEfectivo, arrendatariosFuturos}`.
- `EstacionamientoService.crear` (`EstacionamientoService.java:63-91`):
  1. Rechaza nombre duplicado en el condominio (`existsByCondominioIdAndNombre`, línea 67).
  2. **`capacidadPlanService.validarEnvelope`** (línea 75): total
     (unidades sin `CONDOMINIO` + estacionamientos + bodegas activos) < `plan.unidadLimit`.
  3. Resuelve el `Sector` con `sectorRepository.findById` (línea 79) — **sin scope de condominio**.

### 2.2 CRUD unitario de bodegas (espejo exacto)

- `BodegaController.java` (`/api/v1/condominios/{condominioId}/bodegas`): mismos endpoints y
  permisos que estacionamientos.
- `CrearBodegaRequest.java`: `{@NotBlank @Size(max = 30) String nombre, Integer piso, UUID sectorId}`.
- `BodegaResponse.java`: misma forma que `EstacionamientoResponse`.
- `BodegaService.crear` (`BodegaService.java:64-...`): dedupe por nombre (línea 67),
  `validarEnvelope` (línea 75), sector con `sectorRepository.findById` (línea 79) — **sin scope**.

### 2.3 Bug cross-tenant de sector (G2)

`EstacionamientoService.crear` (línea 79), `EstacionamientoService.actualizar` (línea 106),
`BodegaService.crear` (línea 79) y `BodegaService.actualizar` (línea 106) usan
`sectorRepository.findById(request.sectorId())` sin verificar que el sector pertenezca al
condominio. Un cliente autenticado podría vincular un sector de otro condominio (fuga de datos
multi-tenant). El batch de unidades ya usa el método scoped
`SectorRepository.findByIdAndCondominioId(id, condominioId)`.

### 2.4 Capacidad y envelope

- `GET /condominios/{condominioId}/capacidad-unidades` (V60) expone
  `capacidadEstacionamientos`/`capacidadBodegas` (declaradas por el SUPER_ADMIN, **informativas**)
  y `totalEstacionamientos`/`totalBodegas` (conteos actuales).
- El tope duro real es el envelope del plan: `unidades(no CONDOMINIO) + estacionamientos +
  bodegas activos ≤ plan.unidadLimit` (`CapacidadPlanService.validarEnvelope`).
- No existe **ningún** endpoint batch de estacionamientos ni de bodegas.

---

## 3. Problema que resuelve

El wizard de configuración (paso "Estacionamientos y bodegas") genera la lista completa de
estacionamientos/bodegas (cantidad, prefijo de nombre, numeración correlativa/por piso/
personalizada, sectores nuevos o existentes) y necesita guardarla de una vez. Con el endpoint
actual: 50-200 peticiones HTTP, sin atomicidad (una falla a mitad de lote deja estado parcial) y
dos rondas de peticiones (sectores → entidades). El batch resuelve: 1 petición, transacción
atómica, validación del envelope sobre el lote completo y reporte fila a fila.

---

## 4. Requerimientos de implementación

### 4.1 `POST /api/v1/condominios/{condominioId}/estacionamientos/batch`

**Permiso:** `UNIDAD_CREAR` (mismo que la creación unitaria).

**Request — `CrearEstacionamientosBatchRequest`:**
```java
public record CrearEstacionamientosBatchRequest(
    @NotEmpty List<@Valid Item> estacionamientos) {

  public record Item(
      @NotBlank @Size(max = 30) String nombre,
      Integer piso,
      UUID sectorId) {}
}
```

Ejemplo:
```json
{
  "estacionamientos": [
    { "nombre": "E-1", "piso": 1, "sectorId": "uuid-torre-a" },
    { "nombre": "E-2", "piso": 1, "sectorId": "uuid-torre-a" },
    { "nombre": "E-3", "piso": -1, "sectorId": "uuid-torre-a" }
  ]
}
```

**Response 201 — `CrearEstacionamientosBatchResponse`:**
```java
public record CrearEstacionamientosBatchResponse(
    List<EstacionamientoCreado> creados) {

  public record EstacionamientoCreado(
      UUID id,
      String nombre,
      Integer piso,
      UUID sectorId,
      String sectorNombre,
      boolean activo) {}
}
```

**Semántica (atómica — misma que el batch de unidades):**
- **Una sola transacción.** Todas las validaciones se ejecutan **antes** de persistir.
- **Si alguna fila del lote falla, NO se crea ninguna** y se responde **409** con el reporte de
  errores por fila (formato `ErrorResponse`, sección 4.4). El frontend corrige y reintenta.
- Si todo es válido, se crean todas y se responde 201 con la lista de creadas.

**Validaciones por ítem (mismas reglas que `EstacionamientoService.crear`):**
1. `nombre` único **dentro del lote** (sin duplicados entre sí).
2. `nombre` único **en el condominio** (`existsByCondominioIdAndNombre`) → error por ítem.
3. `sectorId` existe **y pertenece al condominio** (`findByIdAndCondominioId`) → error por ítem
   (corrige G2).
4. **Envelope del plan sobre el lote completo**: `totalActual + nuevos > plan.unidadLimit` →
   error por ítem acumulado (igual que el batch de unidades).

**Código de servicio sugerido (pseudocódigo, espejo de `UnidadService.crearBatch`):**
```java
@Transactional
public CrearEstacionamientosBatchResponse crearBatch(UUID condominioId,
    CrearEstacionamientosBatchRequest request) {
  var condominio = condominioRepository.findById(condominioId)
      .orElseThrow(() -> new NotFoundException("Condominio", condominioId));

  List<EstacionamientoCreado> creados = new ArrayList<>();
  List<BatchValidationException.ErrorItem> errores = new ArrayList<>();
  Set<String> nombresLote = new HashSet<>();

  long totalActual = capacidadPlanService.totalActual(condominio);
  int limite = condominio.getPlan() != null ? condominio.getPlan().getUnidadLimit()
                                            : Integer.MAX_VALUE;

  var items = request.estacionamientos();
  for (int i = 0; i < items.size(); i++) {
    Item item = items.get(i);
    String campo = "estacionamientos[" + i + "].nombre";

    if (!nombresLote.add(item.nombre())) {
      errores.add(new BatchValidationException.ErrorItem(campo,
          "Nombre duplicado en el lote: " + item.nombre()));
      continue;
    }
    if (estacionamientoRepository.existsByCondominioIdAndNombre(condominioId, item.nombre())) {
      errores.add(new BatchValidationException.ErrorItem(campo,
          "Ya existe un estacionamiento con el nombre: " + item.nombre()));
      continue;
    }
    Sector sector = null;
    if (item.sectorId() != null) {
      sector = sectorRepository.findByIdAndCondominioId(item.sectorId(), condominioId)
          .orElse(null);
      if (sector == null) {
        errores.add(new BatchValidationException.ErrorItem(campo,
            "El sector no existe o no pertenece al condominio: " + item.sectorId()));
        continue;
      }
    }
    if (totalActual >= limite) {
      errores.add(new BatchValidationException.ErrorItem(campo,
          "El plan contratado permite hasta " + limite + " entidades en total "
              + "(unidades, estacionamientos y bodegas). Ya hay " + totalActual + "."));
      continue;
    }
    totalActual++;
    Estacionamiento e = estacionamientoRepository.save(Estacionamiento.builder()
        .condominio(condominio).sector(sector).nombre(item.nombre())
        .piso(item.piso()).build());
    creados.add(EstacionamientoCreado.de(e));
  }

  if (!errores.isEmpty()) {
    throw new BatchValidationException(errores.size() + " estacionamientos no pudieron crearse", errores);
  }
  return new CrearEstacionamientosBatchResponse(creados);
}
```

### 4.2 `POST /api/v1/condominios/{condominioId}/bodegas/batch`

Espejo exacto de 4.1 con `bodegas`/`Bodega`/`BodegaRepository`/`BodegaService` y campo
`bodegas[i].nombre` en los errores.

### 4.3 Fix cross-tenant de sector en la creación unitaria (G2, recomendado)

En `EstacionamientoService.crear` (línea 79), `EstacionamientoService.actualizar` (línea 106),
`BodegaService.crear` (línea 79) y `BodegaService.actualizar` (línea 106), reemplazar
`sectorRepository.findById(request.sectorId())` por
`sectorRepository.findByIdAndCondominioId(request.sectorId(), condominioId)` y lanzar
`NotFoundException("Sector", ...)` si no existe. Mismo patrón que `UnidadService.crearBatch`.

### 4.4 Errores esperados (formato estándar `ErrorResponse`)

| Caso | HTTP | Mensaje de ejemplo |
|---|---|---|
| Una o más filas inválidas (nada se crea) | 409 | `{ "message": "2 estacionamientos no pudieron crearse", "fields": [ { "field": "estacionamientos[1].nombre", "message": "Ya existe un estacionamiento con el nombre: E-2" } ] }` |
| Lote vacío | 400 | `{ "message": "Debe incluir al menos un estacionamiento" }` (bean validation) |
| Sin permiso | 403 | (manejo estándar de seguridad) |

---

## 5. Contrato esperado por el frontend (para validar el request/response)

### 5.1 Flujo de guardado del wizard (orden de integridad)

1. `POST /sectores/batch` (o `POST /sectores` por cada sector) → se obtienen los `id`.
   **Los estacionamientos/bodegas pueden tener sectores propios** (p. ej. "Estacionamiento Torre A",
   "Bodegas Bloque B"), por lo que el wizard crea sectores nuevos en esta etapa si el admin lo
   elige (misma lógica que el paso de unidades).
2. `POST /estacionamientos/batch` (y/o `POST /bodegas/batch`) con `sectorId` resuelto.
3. Si el batch responde 409, el wizard muestra los errores por fila en la tabla de
   previsualización y permite corregir/reintentar.

### 5.2 Ejemplo completo (1 sector nuevo, 3 estacionamientos)

```json
// 1) POST /sectores/batch
{ "sectores": [ { "nombre": "Estacionamiento Torre A", "descripcion": "Subterráneo torre A" } ] }

// 2) POST /estacionamientos/batch
{ "estacionamientos": [
    { "nombre": "E-1", "piso": -1, "sectorId": "uuid-sector-nuevo" },
    { "nombre": "E-2", "piso": -1, "sectorId": "uuid-sector-nuevo" },
    { "nombre": "E-3", "piso": -1, "sectorId": "uuid-sector-nuevo" }
  ] }
```

---

## 6. Verificación sugerida

1. Con token ADMINISTRADOR del condominio:
   - Crear un sector con `POST /sectores/batch` → 201 con `id`.
   - Crear 3 estacionamientos con `POST /estacionamientos/batch` con `sectorId` → 201 con las 3
     creadas (id + sectorNombre poblado).
   - Repetir el mismo batch → **409** con errores por fila "Ya existe un estacionamiento con el
     nombre" y **ninguna** nueva creada (verificar conteo con `GET /estacionamientos`).
   - Lote con nombre duplicado dentro del mismo request → 409 reportando el duplicado.
   - Lote con `sectorId` de **otro condominio** → 409 por ítem (G2 corregido).
   - Lote que supera `plan.unidadLimit - totalActual` → 409 con error de envelope.
   - Caso mixto (2 válidas + 1 duplicada) → **409 global** y `GET /estacionamientos` muestra que
     **no** se creó ninguna (atomicidad).
   - Repetir los mismos casos con `POST /bodegas/batch`.
2. `GET /condominios/{id}/capacidad-unidades` refleja el nuevo `totalEstacionamientos`/`totalBodegas`.
3. Regresión: creación unitaria (`POST /estacionamientos`, `POST /bodegas`) intacta; batch de
   unidades intacto; wizard de onboarding intacto.
4. Suite de tests del backend (mencionar el total al responder para confirmar que no se rompió nada).

---

## 7. Decisiones de negocio ya tomadas (no renegociar en implementación)

1. **Atomicidad del batch**: o se crea el lote completo o no se crea nada (409 con reporte por
   fila). El wizard filtra previamente los nombres existentes; el dedupe contra BD es una red de
   seguridad.
2. **Envelope del plan**: `totalActual + nuevos ≤ plan.unidadLimit`, con `totalActual` definido
   como en `CapacidadPlanService` (unidades sin `CONDOMINIO` + estacionamientos + bodegas).
3. **Orden de integridad**: sectores primero (batch de sectores ya existente), estacionamientos/
   bodegas después (con `sectorId`). El batch **valida** que el `sectorId` exista y pertenezca al
   condominio.
4. **Sin migración de base de datos**: solo DTOs + servicio + controller + tests.
5. **Capacidad declarada por tipo es informativa** (no bloquea), igual que en unidades.
6. **Fix G2** (sector scoped) aplica al batch y se recomienda también en la creación unitaria.