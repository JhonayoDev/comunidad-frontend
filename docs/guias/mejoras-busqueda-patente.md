# Informe: Mejoras al sistema de búsqueda por patente — v2

> **Versión:** 2 — Multi-resultado + unidad residencial  
> **Autor:** Frontend / Producto  
> **Destino:** Backend (Spring Boot 3 / Java 17)  
> **Prioridad:** Alta

---

## 1. Resumen Ejecutivo

El endpoint `GET /condominios/{cid}/busqueda/por-patente?patente=X` es la puerta de entrada del guardia en el portón. Se detectaron dos carencias principales:

1. **Coincidencias parciales retornan solo 1 resultado** — cuando hay múltiples vehículos/pre-autorizaciones/accesos que matchean el LIKE, el guardia no puede ver las alternativas para identificar cuál corresponde.
2. **Falta el número de unidad residencial (casa/departamento)** — el guardia necesita saber a qué casa pertenece o se dirige el vehículo.

---

## 2. Problemas Detectados

### 2.1. Múltiples coincidencias — solo se retorna 1

**Escenario:** Guardia escribe `abc`. Existen 3 vehículos residentes con patentes `ABCD99`, `ABCD12`, `ABC-XY`. El backend retorna solo el primero con `(+2 resultados)` en texto plano dentro del campo `detalle`.

**Impacto:** El guardia no puede ver los otros 2 vehículos. Debe preguntar la patente completa al conductor.

**Mismo problema ocurre con:**
- `PREAUTORIZACION` LIKE (paso 3) — dos casas pueden haber pre-autorizado patentes que empiecen igual
- `VEHICULO_FRECUENTE` LIKE (paso 5) — múltiples visitas previas con patentes similares

### 2.2. Falta unidad residencial

**Escenario:** Guardia busca `ABCD99` (exacto) y ve:
- `titulo`: "Hernán Vargas Soto" ✓
- `subtitulo`: "Estacionamiento E-5" (útil pero no es la casa)
- `detalle`: "Toyota Corolla Blanco"

**Falta:** "Casa 32 — Propietario"

El dato está disponible en el modelo: `Vehiculo.persona → VinculoPersonaUnidad → Unidad.numero`, pero no se incluye en la respuesta.

---

## 3. Propuesta de API

### 3.1. Nuevo envelope de respuesta

**Endpoint:** `GET /condominios/{cid}/busqueda/por-patente?patente=X`

**Response (200 OK):**

```json
{
  "resultados": [
    {
      "tipoResultado": "VEHICULO_RESIDENTE",
      "titulo": "Hernán Vargas Soto",
      "subtitulo": "Casa 32 — Propietario · Estac. E-5",
      "detalle": "Toyota Corolla Blanco · ABCD99",
      "unidadNumero": "32",
      "referenciaId": "uuid-vehiculo",
      "acciones": ["REGISTRAR_INGRESO", "VER_DETALLE"]
    },
    {
      "tipoResultado": "PREAUTORIZACION",
      "titulo": "Juan Pérez",
      "subtitulo": "Casa 32 — Delivery",
      "detalle": "Válida hasta 28/07/2026 · ABCD51",
      "unidadNumero": "32",
      "referenciaId": "uuid-autorizacion",
      "acciones": ["REGISTRAR_INGRESO"]
    }
  ],
  "totalResultados": 2,
  "hayMas": false,
  "consulta": "abcd",
  "mensaje": null
}
```

**Response (sin resultados — DESCONOCIDO):**

```json
{
  "resultados": [
    {
      "tipoResultado": "DESCONOCIDO",
      "titulo": "No se encontraron coincidencias para la patente ABCD",
      "subtitulo": null,
      "detalle": null,
      "unidadNumero": null,
      "referenciaId": null,
      "acciones": ["NUEVA_VISITA"]
    }
  ],
  "totalResultados": 0,
  "hayMas": false,
  "consulta": "abcd",
  "mensaje": null
}
```

### 3.2. DTOs nuevos

**`ResultadoBusquedaEnvelope`:**
```java
public record ResultadoBusquedaEnvelope(
    List<ResultadoBusqueda> resultados,
    int totalResultados,
    boolean hayMas,
    String consulta,
    String mensaje
) {}
```

**`ResultadoBusqueda` — con nuevo campo `unidadNumero`:**
```java
public record ResultadoBusqueda(
    TipoResultadoBusqueda tipoResultado,
    String titulo,
    String subtitulo,
    String detalle,
    String unidadNumero,       // ← NUEVO
    UUID referenciaId,
    List<AccionDisponible> acciones
) {}
```

---

## 4. Algoritmo de búsqueda propuesto

### 4.1. Comportamiento actual (cascade con short-circuit)

```
paso 1: vehiculo exacto   → VEHICULO_RESIDENTE (1 solo) → STOP
paso 2: vehiculo LIKE     → VEHICULO_RESIDENTE (1 solo + "(+N)") → STOP
paso 3: pre-auth LIKE     → PREAUTORIZACION   (1 solo) → STOP
paso 4: pre-auth exacto   → PREAUTORIZACION   (1 solo) → STOP
paso 5: registro LIKE     → VEHICULO_FRECUENTE (1 solo) → STOP
paso 6: registro exacto   → VEHICULO_FRECUENTE (1 solo) → STOP
paso 7: → DESCONOCIDO
```

### 4.2. Comportamiento propuesto

```
--- Bloque 1: Exactos (short-circuit) ---
1. vehiculoRepository.findByPatenteIgnoreCase
   → HIT → single VEHICULO_RESIDENTE + STOP
2. autorizacionRepository.findVigentesByPatenteVisitante
   → HIT → single PREAUTORIZACION + STOP
3. registroRepository.findUltimosByPatenteVisitante(PR.of(0,1))
   → HIT → single VEHICULO_FRECUENTE + STOP

--- Bloque 2: Colectar LIKEs (máximo 5 total) ---
4. vehiculos LIKE → hasta 5 VEHICULO_RESIDENTE
5. pre-auths LIKE → llenar hasta 5 PREAUTORIZACION
6. registros LIKE → llenar hasta 5 VEHICULO_FRECUENTE

--- Bloque 3: Sin resultados ---
7. → DESCONOCIDO
```

**Reglas del Bloque 2:**
- Se consultan las 3 fuentes SIEMPRE que quepan resultados
- `MAX_RESULTADOS = 5` (constante)
- Prioridad de llenado: residentes → pre-auths → frecuentes
- Si `totalResultados > resultados.length()`, setear `hayMas = true` y `mensaje = "Hay más resultados. Ingrese más caracteres para precisar."`
- No incluir `(+N resultados)` en ningún campo de texto

### 4.3. Criterios por fuente

| Fuente | Repo method | Máx | Orden |
|---|---|---|---|
| Vehiculos LIKE | `findByCondominioIdAndPatenteContainingIgnoreCase(cid, patente)` | 5 | El orden del repo (sin orden específico) |
| Pre-auths LIKE | `findVigentesByPatenteContaining(cid, patente, ahora)` | (5 - count_residentes) | `fechaInicio ASC` |
| Registros LIKE | `findUltimosByPatenteContaining(cid, patente, PR.of(0, limit))` | (5 - count_residentes - count_preauths) | `fechaIngreso DESC` |

---

## 5. Formato de campos por tipo de resultado

### 5.1. VEHICULO_RESIDENTE

| Campo | Valor |
|---|---|
| `titulo` | `v.getPersona().getNombre()` |
| `subtitulo` | `"Casa N — TipoVinculo · Estac. E-X"` \| `"Casa N — TipoVinculo"` (si no tiene estacionamiento) |
| `detalle` | `"Marca Modelo Color · PATENTE"` |
| `unidadNumero` | `vpu.getUnidad().getNumero()` desde `VinculoPersonaUnidad` activo (priorizar `esOcupante = true`) |
| `referenciaId` | `v.getId()` |
| `acciones` | `[REGISTRAR_INGRESO, VER_DETALLE]` |

**Ejemplos:**
- `subtitulo`: `"Casa 32 — Propietario · Estac. E-5"`
- `subtitulo`: `"Casa 11 — Arrendatario"`
- `subtitulo`: `"Depto 204 — Propietaria · Estac. E-11"`
- `detalle`: `"Toyota Corolla Blanco · ABCD99"`

### 5.2. PREAUTORIZACION

| Campo | Valor |
|---|---|
| `titulo` | `aa.getNombre()` |
| `subtitulo` | `"Casa N — TipoAutorizacion"` |
| `detalle` | `"Válida hasta FECHA · PATENTE"` |
| `unidadNumero` | `aa.getUnidad().getNumero()` (ya disponible) |
| `referenciaId` | `aa.getId()` |
| `acciones` | `[REGISTRAR_INGRESO]` |

**Ejemplos:**
- `subtitulo`: `"Casa 32 — Delivery"`
- `subtitulo`: `"Casa 45 — Visita"`
- `detalle`: `"Válida hasta 28/07/2026 23:59 · ABCD51"`

### 5.3. VEHICULO_FRECUENTE

| Campo | Valor |
|---|---|
| `titulo` | `registro.getNombreVisitante()` — **NUEVO**: antes era `patente` (input) |
| `subtitulo` | `"Casa N"` |
| `detalle` | `"Último ingreso: FECHA · PATENTE"` |
| `unidadNumero` | `registro.getUnidad().getNumero()` (ya disponible) |
| `referenciaId` | `registro.getId()` |
| `acciones` | `[REGISTRAR_INGRESO, VER_DETALLE]` |

**Ejemplos:**
- `titulo`: `"María González"` (antes: `"XRD8"`)
- `subtitulo`: `"Casa 45"`
- `detalle`: `"Último ingreso: 28/07/2026 15:30 · XRD81"`

### 5.4. DESCONOCIDO

Sin cambios relevantes. Solo incluir en envelope.

---

## 6. UI Flow (Frontend)

```
┌──────────────────────────────────────────┐
│  [abcd]                              🔍  │
├──────────────────────────────────────────┤
│ ┌── Mini-card 1 ───────────────────────┐ │
│ │ Hernán Vargas Soto    [Residente]    │ │
│ │ ABCD99 · Casa 32 — Propietario      │ │ ← click
│ └──── ▼ ──────────────────────────────┘ │
│  ┌── Expanded ───────────────────────┐  │
│  │ Casa 32 — Propietario            │  │
│  │ Estac. E-5                        │  │
│  │ Toyota Corolla Blanco · ABCD99    │  │
│  │ [Registrar ingreso] [Ver detalle] │  │
│  └───────────────────────────────────┘  │
│ ┌── Mini-card 2 ───────────────────────┐ │
│ │ Juan Pérez          [Delivery]      │ │
│ │ ABCD51 · Casa 32                    │ │
│ └──────────────────────────────────────┘ │
│ ┌── Mini-card 3 ───────────────────────┐ │
│ │ María González        [Frecuente]   │ │
│ │ ABCD-XY · Casa 45                   │ │
│ └──────────────────────────────────────┘ │
│       ↕ (scroll if > 3)                  │
└──────────────────────────────────────────┘
```

**Estados visuales:**
- **Mini-card colapsada:** titulo, patente, Tag de tipo. Ocupa ~40px height.
- **Mini-card expandida:** muestra subtitulo completo, detalle, acciones. Ocupa ~120px.
- **Solo 1 resultado:** se muestra expandida directamente (sin mini-card previa).
- **`hayMas = true`:** Tag informativo + mensaje al final de la lista.

---

## 7. Cambios Requeridos

### 7.1. Backend

| Archivo | Cambio |
|---|---|
| **Nuevo:** `ResultadoBusquedaEnvelope.java` | DTO envelope con `List<ResultadoBusqueda>`, `totalResultados`, `hayMas`, `consulta`, `mensaje` |
| **Modificar:** `ResultadoBusqueda.java` | Agregar campo `String unidadNumero` |
| **Modificar:** `SearchServiceImpl.java` | Refactorizar `buscarPorPatente()`: separar exactos (short-circuit) de LIKEs (colectar hasta 5), incluir unidad residencial, cambiar titulo de frecuentes a `nombreVisitante` |
| **Modificar:** `BusquedaController.java` | Envolver response en `ResultadoBusquedaEnvelope` |
| **Modificar:** `SearchService.java` (interfaz) | Actualizar firma del método |
| **Opcional:** `VinculoPersonaUnidadRepository.java` | Agregar método para obtener vínculo activo por personaId |
| **Modificar:** `BusquedaIntegrationTest.java` | Tests multi-resultado + unidad residencial |

### 7.2. Frontend (después del deploy del backend)

| Archivo | Cambio |
|---|---|
| `useBusquedaPatente.js` | Migrar de `resultado` único a `resultados[]` con selección activa; eliminar `_nombreVisitante` fetch; eliminar parseo de `(+N)` |
| `BuscadorPatenteCard.vue` | Lista de mini-cards colapsables con expand al hacer clic |
| `RegistrarVisitaView.vue` | Usar `unidadNumero` directo del response |
| `busquedaService.js` | Según sea necesario |

---

## 8. Consideraciones Técnicas

### 8.1. Unidad residencial para VEHICULO_RESIDENTE

La navegación es: `Vehiculo.persona → VinculoPersonaUnidad (activo) → Unidad.numero`

Una persona puede tener múltiples vínculos activos. Regla de resolución:
1. Filtrar `activo = true`
2. Priorizar `esOcupante = true`
3. Si múltiples, tomar el primero (orden `fechaInicio DESC` o alfabético por número)

Query propuesta para `VinculoPersonaUnidadRepository`:
```java
@Query("""
    SELECT v FROM VinculoPersonaUnidad v
    JOIN FETCH v.unidad
    WHERE v.persona.id = :personaId
      AND v.activo = true
    ORDER BY v.esOcupante DESC, v.fechaInicio DESC
    """)
List<VinculoPersonaUnidad> findActivosByPersonaId(@Param("personaId") UUID personaId);
```

### 8.2. Subtitulo para VEHICULO_RESIDENTE con estacionamiento

```java
StringBuilder subtitulo = new StringBuilder();
subtitulo.append(vpu.getUnidad().getNumero() != null
    ? "Casa " + vpu.getUnidad().getNumero()
    : "Unidad " + referenciaFallback);

subtitulo.append(" — ").append(formatearTipoVinculo(vpu.getTipo()));

if (estacionamiento != null) {
    subtitulo.append(" · Estac. ").append(estacionamiento);
}
```

Helper `formatearTipoVinculo`:
```java
private String formatearTipoVinculo(TipoVinculoUnidad tipo) {
    return switch (tipo) {
        case PROPIETARIO -> "Propietario";
        case ARRENDATARIO -> "Arrendatario";
        case RESIDENTE_ADICIONAL -> "Residente";
    };
}
```

### 8.3. Tipo de unidad

No todas las unidades son "Casa". Usar el `tipo` de `Unidad` (CASA / DEPARTAMENTO / OTRO / LOCAL_COMERCIAL / ESTACIONAMIENTO / BODEGA):

```java
private String formatoUnidad(Unidad u) {
    return switch (u.getTipo()) {
        case CASA -> "Casa " + u.getNumero();
        case DEPARTAMENTO -> "Depto " + u.getNumero();
        case LOCAL_COMERCIAL -> "Local " + u.getNumero();
        default -> u.getTipo() + " " + u.getNumero();
    };
}
```

### 8.4. Compatibilidad

Cambiar el response de objeto único a envelope es **breaking change**. El frontend debe desplegarse simultáneamente con el backend (o agregar versionado al endpoint tipo `/api/v2/...`).

### 8.5. Rendimiento

| Aspecto | Impacto |
|---|---|
| LIKE en vehiculos | Índice existente `idx_v_patente_like` |
| LIKE en autorizaciones | Índice nuevo V35 `idx_aa_patente_visitante_like` |
| LIKE en registros | Índice nuevo V35 `idx_ra_patente_visitante_like` |
| Consulta unidad residencial | 1 query por vehículo (máx 5) — N+1 controlado |
| Límite 5 resultados | Evita sobrecarga |

---

## 9. Criterios de Aceptación

1. Buscar patente exacta de residente → retorna 1 `VEHICULO_RESIDENTE` con unidad y estacionamiento
2. Buscar patente parcial `abc` con 3 vehículos residentes → retorna 3 `VEHICULO_RESIDENTE` en `resultados[]`
3. Buscar patente parcial `bbb` con 2 pre-auths vigentes → retorna 2 `PREAUTORIZACION` en `resultados[]`
4. Buscar patente parcial `xrd` con 1 acceso previo → retorna 1 `VEHICULO_FRECUENTE` con nombre del visitante
5. Buscar patente parcial con 7 resultados → retorna 5 + `hayMas = true` + mensaje
6. Buscar patente sin coincidencias → retorna `DESCONOCIDO`
7. `VEHICULO_FRECUENTE` incluye `titulo = nombreVisitante` (no la patente de búsqueda)
8. Todos los resultados incluyen `unidadNumero` correcto
9. No aparece `(+N resultados)` en ningún campo de texto
