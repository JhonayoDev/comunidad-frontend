# Solicitud Backend — Capacidad de unidades por tipo en el condominio

**Versión:** 1.0
**Fecha:** 2026-08-12
**Audiencia:** Equipo backend (Spring Boot / Flyway / JPA)
**Estado:** Pendiente de implementación
**Relacionado:** `V50__permiso_almacenamiento_superadmin.sql`, `V24__seed_planes_modulos.sql`, `UnidadService.java`

---

## 1. Resumen ejecutivo

Se solicita agregar **capacidad de unidades declarada por tipo de unidad** a nivel de condominio
(`CASA`, `DEPARTAMENTO`, `ESTACIONAMIENTO`, `BODEGA`, `OTRO`). El **SUPER_ADMIN** declara en el
onboarding / configuración del condominio cuántas unidades de cada tipo tiene el condominio
según el contrato (ej: 100 casas, 120 estacionamientos, 3 bodegas). A partir de ahí, el rol
**ADMINISTRADOR** (y cargos) solo puede **crear unidades de cada tipo hasta alcanzar esa
capacidad**. Las unidades que superen el límite declarado se rechazan con un error claro.

Esta capacidad es el "techo de contrato" del condominio y **se apoya sobre el límite global del
plan** (`plan.unidad_limit`), que se mantiene como sobre superior (envelope).

---

## 2. Contexto y estado actual (verificado)

### 2.1 Cómo se crean las unidades hoy

- Endpoint único de creación: `POST /api/v1/condominios/{condominioId}/unidades`
  (`UnidadController.java:52-61`, permiso `UNIDAD_CREAR`).
- DTO de creación `CrearUnidadRequest.java`:
  ```java
  public record CrearUnidadRequest(
      @NotBlank @Size(max = 20) String numero,
      @NotNull TipoUnidad tipo,
      Integer piso,
      UUID sectorId) {}
  ```
- `UnidadService.crear` (`UnidadService.java:66-92`):
  1. Rechaza número duplicado (`existsByCondominioIdAndNumero`, líneas 67-69).
  2. Resuelve el `Condominio` (líneas 71-72).
  3. **`validarLimiteUnidades`** (línea 75) → valida el límite **global** del plan.
  4. Persiste la unidad.
- `UnidadService.actualizar` (`UnidadService.java:107-129`): permite cambiar `tipo`/`numero`/`piso`/`sector`.
- `desactivar`: `PATCH /unidades/{id}/desactivar` (marca `activo=false`; 409 si tiene vínculos activos).

### 2.2 Límites existentes

- `Plan.unidadLimit` (global, **no por tipo**): `Plan.java:55-58`.
  Seed `V24__seed_planes_modulos.sql`: **BASICO = 100**, **PRO = 9999**.
- Validación actual (`UnidadService.validarLimiteUnidades`, líneas 94-105):
  ```java
  long actuales = unidadRepository.countByCondominioIdAndActivoTrue(condominioId);
  int limite = plan.getUnidadLimit();
  if (actuales >= limite) { throw new IllegalStateException(...); }
  ```
  Nota: `countByCondominioIdAndActivoTrue` cuenta **todas las unidades activas sin distinguir
  tipo** → **estacionamientos y bodegas consumen cupo del plan** hoy.

### 2.3 Entidad `Condominio`

`Condominio.java` (tabla `condominios`) **no tiene campos de capacidad** por tipo. Solo existe
`plan_id`, `storage_limit_mb`, `storage_used_mb`, `status_pago`, `onboarding_status`, contacto y
trazabilidad. El `totalUnidades` del detalle admin se **computa en vivo** con
`countByCondominioIdAndActivoTrue` (`SaasAdminService.detalle`).

### 2.4 Entidad `Unidad` y enum

- `Unidad.java:38-48`: `numero` es **String** (`@Column(nullable=false)`), `tipo` enum
  `TipoUnidad`, `piso` Integer nullable, `activo` boolean.
- `TipoUnidad.java`: `CASA, DEPARTAMENTO, ESTACIONAMIENTO, BODEGA, OTRO`.
- Constraint de unicidad: `CONSTRAINT uq_unidad_numero UNIQUE (condominio_id, numero)`
  (`V1__initial_schema.sql:175`).

### 2.5 Repositorio

`UnidadRepository.java` tiene `countByCondominioIdAndActivoTrue` (línea 34) y
`findByCondominioIdAndTipoAndActivoTrue` (líneas 21-22). **No existe** conteo por tipo.

### 2.6 DTOs de administración (panel SaaS / SUPER_ADMIN)

- `CrearCondominioRequest.java` (`domain/admin/dto`): `nombre, rut, direccion, responsableNombre,
  responsableEmail, responsableTelefono, planId`. Sin capacidad.
- `ActualizarCondominioRequest.java` (`domain/admin/dto`):
  ```java
  public record ActualizarCondominioRequest(
      String nombre, String rut, String direccion,
      String responsableNombre, @Email String responsableEmail, String responsableTelefono) {}
  ```
- `CondominioDetalleAdminResponse.java` (`domain/admin/dto`): incluye `planId/planCodigo/planNombre`,
  `storageUsadoMb/storageLimitMb`, `onboardingStatus`, `totalUnidades`, `totalUsuariosActivos`, etc.
- Endpoint de actualización: `AdminCondominioController.java:106-115` → `PATCH /api/v1/admin/condominios/{id}`.
  `SaasAdminService.actualizar` (líneas 196-232) actualiza **solo campos no nulos** del request.
  **Este PATCH es el punto de entrada para declarar la capacidad** — solo falta agregar los campos al DTO.

### 2.7 Onboarding

`OnboardingService.completar` (líneas 55-83) marca la tarea y, si no quedan pendientes, pasa el
condominio a `COMPLETADO`. **No valida** que existan unidades. La tarea `CREAR_UNIDADES` hoy se
completa manualmente desde el wizard (`POST /admin/condominios/{id}/onboarding/tareas/CREAR_UNIDADES/completar`).
Con esta capacidad, el wizard completará `CREAR_UNIDADES` al **declarar la capacidad** (no al crear unidades).

---

## 3. Problema que resuelve

Sin esta capacidad, un ADMINISTRADOR puede crear **unidades ilimitadas dentro del tope global del
plan**, sin relación con lo contratado. Ejemplo: un condominio que contrató "100 casas" en el plan
BASICO (tope global 100) puede crear 100 estacionamientos y dejar sin cupo a las casas, o inflar el
conteo con unidades que no existen en el contrato. El SUPER_ADMIN necesita:

1. **Declarar el techo por tipo** (casas, departamentos, estacionamientos, bodegas, otro) al
   configurar el condominio.
2. Que el backend **rechace la creación** de una unidad de un tipo cuando ya se alcanzó su techo.
3. Que el techo declarado **quede sujeto al sobre del plan** (`suma de capacidades ≤ plan.unidad_limit`),
   manteniendo estacionamientos/bodegas/OTRO como consumidores de cupo del plan (decisión de negocio).
4. Poder **ajustar la capacidad condominio por condominio** (mismo endpoint PATCH del panel SaaS).

---

## 4. Requerimientos de implementación

### 4.1 Migración Flyway `V51__capacidad_unidades_por_tipo.sql`

> El número es el siguiente disponible (V50 ya está usado por el fix del permiso
> `ALMACENAMIENTO_CONFIGURAR`). Ajustar si el equipo ya creó otra migración.

```sql
-- =============================================================
-- V51__capacidad_unidades_por_tipo.sql
-- Capacidad declarada por tipo de unidad a nivel de condominio
-- (techo de contrato). NULL = sin tope declarado → se conserva
-- el comportamiento actual (solo límite global del plan).
-- =============================================================

ALTER TABLE condominios
  ADD COLUMN capacidad_casas INTEGER NULL,
  ADD COLUMN capacidad_departamentos INTEGER NULL,
  ADD COLUMN capacidad_estacionamientos INTEGER NULL,
  ADD COLUMN capacidad_bodegas INTEGER NULL,
  ADD COLUMN capacidad_otro INTEGER NULL;
```

**Condominios existentes:** quedan en `NULL` (sin tope por tipo). El SUPER_ADMIN los configurará
uno a uno desde el panel (mismo PATCH de la sección 4.5). **No** se siembran valores.

### 4.2 Entidad `Condominio` (`Condominio.java`)

Agregar 5 campos (siguiendo el estilo `@Column(name = "...")` del archivo):

```java
// Capacidad declarada por tipo de unidad (null = sin tope por tipo)
@Column(name = "capacidad_casas")
private Integer capacidadCasas;

@Column(name = "capacidad_departamentos")
private Integer capacidadDepartamentos;

@Column(name = "capacidad_estacionamientos")
private Integer capacidadEstacionamientos;

@Column(name = "capacidad_bodegas")
private Integer capacidadBodegas;

@Column(name = "capacidad_otro")
private Integer capacidadOtro;
```

Helper para mapear enum → columna (importar `TipoUnidad`):

```java
public Integer capacidadPara(TipoUnidad tipo) {
  return switch (tipo) {
    case CASA -> capacidadCasas;
    case DEPARTAMENTO -> capacidadDepartamentos;
    case ESTACIONAMIENTO -> capacidadEstacionamientos;
    case BODEGA -> capacidadBodegas;
    case OTRO -> capacidadOtro;
  };
}
```

### 4.3 Repositorio (`UnidadRepository.java`)

Agregar el conteo por tipo (Spring Data derivado; el patrón ya existe en la línea 34):

```java
long countByCondominioIdAndTipoAndActivoTrue(UUID condominioId, TipoUnidad tipo);
```

### 4.4 `UnidadService` — enforcement del techo por tipo

Agregar el método privado (el condominio ya se resuelve en `crear` en las líneas 71-72):

```java
private void validarCapacidadTipo(Condominio condominio, TipoUnidad tipo) {
  Integer capacidad = condominio.capacidadPara(tipo);
  if (capacidad == null) {
    return; // sin tope declarado → solo aplica el límite global del plan
  }
  long actuales = unidadRepository.countByCondominioIdAndTipoAndActivoTrue(
      condominio.getId(), tipo);
  if (actuales >= capacidad) {
    throw new IllegalStateException(
        "El condominio permite hasta " + capacidad + " unidades de tipo " + tipo +
            ". Ya hay " + actuales + " activas.");
  }
}
```

**En `crear`** (después de `validarLimiteUnidades`, línea 75):

```java
validarCapacidadTipo(condominio, request.tipo());
```

**En `actualizar`** (antes de `unidadRepository.save`, línea 128): validar **solo si cambia el
tipo** hacia otro con techo. Al cambiar de tipo, la unidad aun no cuenta en el conteo del tipo
nuevo (su tipo actual es otro), por lo que el conteo es correcto sin ajustes:

```java
if (request.tipo() != unidad.getTipo()) {
  var condominio = condominioRepository.findById(condominioId)
      .orElseThrow(() -> new NotFoundException("Condominio", condominioId));
  validarCapacidadTipo(condominio, request.tipo());
}
```

**Reglas de negocio del enforcement:**

- `desactivar` (marca `activo=false`) **libera cupo**: el conteo es solo `activo=true`,
  coherente con `validarLimiteUnidades`.
- Reducir la capacidad por debajo del uso actual **no elimina unidades existentes**: solo
  bloquea **nuevas** creaciones del tipo. Es el comportamiento deseado.
- `OTRO` también tiene techo (`capacidad_otro`). **No** se declara techo para tipos inexistentes.

### 4.5 DTOs y servicio del panel SaaS (SUPER_ADMIN)

**`ActualizarCondominioRequest.java`** — agregar los 5 campos **nullable** (solo no-nulos se
actualizan, patrón ya existente en `SaasAdminService.actualizar`):

```java
public record ActualizarCondominioRequest(
    String nombre,
    String rut,
    String direccion,
    String responsableNombre,
    @Email String responsableEmail,
    String responsableTelefono,
    Integer capacidadCasas,
    Integer capacidadDepartamentos,
    Integer capacidadEstacionamientos,
    Integer capacidadBodegas,
    Integer capacidadOtro) {}
```

**`CondominioDetalleAdminResponse.java`** — agregar las 5 capacidades + los 5 conteos actuales
por tipo (para que el frontend muestre "X de 100 casas" y el cupo restante):

```java
Integer capacidadCasas,
Integer capacidadDepartamentos,
Integer capacidadEstacionamientos,
Integer capacidadBodegas,
Integer capacidadOtro,
long totalCasas,
long totalDepartamentos,
long totalEstacionamientos,
long totalBodegas,
long totalOtro
```

**`SaasAdminService.detalle`** — poblar capacidades desde la entidad y los conteos con el nuevo
método del repositorio (5 queries, o una query `GROUP BY tipo` si se prefiere).

**`SaasAdminService.actualizar`** — aplicar los campos no nulos y **validar**:

```java
// Validación de la suma contra el sobre del plan (solo si se declara al menos una capacidad)
Plan plan = c.getPlan();
boolean declaradas = Stream.of(request.capacidadCasas(), request.capacidadDepartamentos(),
    request.capacidadEstacionamientos(), request.capacidadBodegas(), request.capacidadOtro())
    .anyMatch(Objects::nonNull);

if (declaradas && plan != null) {
  long suma = Stream.of(request.capacidadCasas(), request.capacidadDepartamentos(),
      request.capacidadEstacionamientos(), request.capacidadBodegas(), request.capacidadOtro())
      .mapToLong(v -> v == null ? 0L : v)
      .sum();
  if (suma > plan.getUnidadLimit()) {
    throw new IllegalArgumentException(
        "La suma de capacidades (" + suma + ") supera el límite del plan " +
            plan.getCodigo() + " (" + plan.getUnidadLimit() + " unidades). " +
            "Baja la capacidad declarada o sube de plan.");
  }
}
// Aplicar solo no-nulos
if (request.capacidadCasas() != null) c.setCapacidadCasas(request.capacidadCasas());
// ... repetir para los 5
```

Reglas de validación adicionales:
- Cada capacidad declarada debe ser `>= 0` (validar y lanzar error claro si es negativa).
- **No** se valida que cada capacidad individual sea ≤ `plan.unidadLimit` (basta con la suma ≤ límite,
  dado que el límite global es total). Las capacidades individuales pueden superar el límite global
  solo si la suma total no lo supera.
- `plan == null` (sin plan asignado): se omite la validación de suma.

**`AdminCondominioController.java`** — **sin cambios**: el `PATCH /{id}` (líneas 106-115) ya
recibe `ActualizarCondominioRequest` y delegará en `SaasAdminService.actualizar`.

### 4.6 (Opcional) Capacidad en la creación del condominio

Si se quiere declarar la capacidad ya al crear el condominio (hoy el flujo principal la declara en
el onboarding vía PATCH), agregar los mismos 5 campos nullable a `CrearCondominioRequest.java` y
aplicarlos en `SaasAdminService.crear` (después del `builder`, líneas 146-190), con la misma
validación de suma. No es bloqueante: el wizard usa el PATCH.

### 4.7 (Opcional) Auditoría

Registrar un evento de auditoría al cambiar la capacidad (p. ej. `CONDOMINIO_CAPACIDAD_ACTUALIZAR`)
usando el patrón existente de `AuditoriaService` (ver `ONBOARDING_COMPLETAR` en
`AuditoriaService.java:162-165`). Útil para trazabilidad de "quién bajó el techo de casas".

---

## 5. Contrato esperado por el frontend (para validar el request/response)

### 5.1 `GET /api/v1/admin/condominios/{id}` — response (adición)

```json
{
  "id": "uuid",
  "nombre": "Condominio Los Pinos",
  "planCodigo": "PRO",
  "planNombre": "Pro",
  "totalUnidades": 196,
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

### 5.2 `PATCH /api/v1/admin/condominios/{id}` — body de declaración de capacidad

```json
{
  "capacidadCasas": 100,
  "capacidadDepartamentos": 0,
  "capacidadEstacionamientos": 120,
  "capacidadBodegas": 3,
  "capacidadOtro": 0
}
```

Campos omitidos en el body **no se modifican** (semántica del PATCH actual). Los campos pueden
enviarse como `0` (techo 0 = el tipo queda bloqueado para nuevas creaciones).

### 5.3 Errores esperados (formato estándar `ErrorResponse`)

| Caso | HTTP | Mensaje de ejemplo |
|---|---|---|
| Crear unidad de tipo con techo alcanzado | 400/409 | `El condominio permite hasta 100 unidades de tipo CASA. Ya hay 100 activas.` |
| Declarar suma > límite del plan | 400 | `La suma de capacidades (223) supera el límite del plan PRO (100 unidades). Baja la capacidad declarada o sube de plan.` |
| Capacidad negativa | 400 | `La capacidad de CASA no puede ser negativa.` |

El frontend usa `console.error` en todos los catch y muestra el `message` de `ErrorResponse`
(patrón existente en todo el proyecto).

---

## 6. Verificación sugerida

1. Correr `flyway migrate` → columnas `capacidad_*` en `condominios` (NULL para condominios existentes).
2. Con token SUPER_ADMIN: `PATCH /admin/condominios/{id}` con capacidades `{100, 0, 120, 3, 0}`
   → 200; `GET` devuelve capacidades + conteos.
3. `PATCH` con suma > `unidad_limit` del plan → 400 con el mensaje de la sección 5.3.
4. Con token ADMINISTRADOR del condominio:
   - Crear 100 unidades tipo CASA → OK las 100.
   - Crear la 101.ª CASA → error "permite hasta 100".
   - Crear 120 estacionamientos → OK; la 121.º → error.
   - Crear una unidad OTRO hasta `capacidad_otro` → error al superarla.
   - `PATCH /unidades/{id}/desactivar` de una CASA → vuelve a quedar cupo (crear otra OK).
   - Cambiar el `tipo` de una unidad a un tipo con techo lleno → error.
5. Condominio sin capacidades (`NULL`): crear unidades funciona como hoy (solo aplica el plan global).
6. Regresión: wizard de onboarding, detalle del condominio y `totalUnidades` del dashboard intactos.
7. Suite de tests del backend (mencionar el total al responder para confirmar que no se rompió nada).

---

## 7. Decisiones de negocio ya tomadas (no renegociar en implementación)

1. **Estacionamientos, bodegas y OTRO consumen cupo del plan** (`plan.unidad_limit`), igual que hoy.
   Por eso la suma de capacidades se valida contra el límite global. Un condominio con
   100 casas + 120 estacionamientos + 3 bodegas = 223 unidades **requiere plan PRO**.
2. **Condominios existentes:** capacidad `NULL` (sin tope por tipo). El SUPER_ADMIN los configura
   uno a uno desde el panel.
3. **OTRO también está limitado** (columna `capacidad_otro`).
4. **La tarea de onboarding `CREAR_UNIDADES` se completará en el frontend al declarar la capacidad**
   (no al crear unidades). El backend no necesita cambiar esto (ya no valida unidades al completar).
5. La numeración/nombre de las unidades es responsabilidad del ADMINISTRADOR; la capacidad solo
   acota **cuántas** puede crear por tipo.

---

## 8. Notas para fases futuras

- **Límites por tipo como parámetro de planes:** el diseño queda encadenado
  (`efectivo = min(capacidad del condominio, límite del plan)`). Cuando se quiera, `Plan` podrá
  agregar columnas `max_casas/max_departamentos/...` y `validarCapacidadTipo` las consumirá sin
  rediseñar, leyendo la capacidad desde el plan en vez del condominio.
- **Carga masiva (CSV/XLSX) de unidades y de residentes→unidades:** fase futura del frontend, se
  apoya sobre este techo por tipo. El backend puede exponer más adelante un endpoint batch
  `POST /unidades/batch` transaccional con reporte por fila; hoy el frontend hace POSTs individuales
  y el enforcement de este techo ya aplica fila a fila.
