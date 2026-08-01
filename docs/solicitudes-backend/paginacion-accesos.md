# Solicitud: Paginación, filtros y conteo activo en `GET /accesos`

## Contexto

Actualmente `GET /api/v1/condominios/{condominioId}/accesos` retorna
`List<RegistroAccesoResponse>` sin paginación y solo filtra por `estado`.

El frontend necesita:
- Paginación server-side para manejar historiales grandes
- Filtros por rango de fechas (similar a `GET /bitacora`) para consultas como
  "qué vehículos entraron el lunes pasado" o "cuántos ingresos el fin de semana"
- Filtros de texto (`nombreVisitante`, `patenteVisitante`) para búsqueda
  server-side (actualmente se hace client-side, lo que rompe con paginación)
- Un endpoint liviano de **conteo de accesos activos** para polling en dashboards
  (el contador `activosAhora` ya existe en `GET /dashboard/guardia` y
  `/dashboard/admin`, pero requiere refrescar todo el dashboard para obtenerlo)

## Solicitud

### 1. Paginar `GET /accesos` con filtros enriquecidos

Agregar paginación vía `Pageable` al endpoint `GET /accesos`, retornando
`PageResponse<RegistroAccesoResponse>`, y añadir filtros por fecha y texto.

#### Parámetros query

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | int | `0` | Número de página |
| `size` | int | `20` | Elementos por página (max 100) |
| `estado` | enum(EstadoAcceso) | — | Filtro opcional (ACTIVO, FINALIZADO, RECHAZADO) |
| `desde` | LocalDateTime (ISO) | — | Filtro opcional: fecha/hora de ingreso desde (inclusive) |
| `hasta` | LocalDateTime (ISO) | — | Filtro opcional: fecha/hora de ingreso hasta (exclusive) |
| `nombre` | String | — | Búsqueda parcial (contains, ignoreCase) en `nombreVisitante` |
| `patente` | String | — | Búsqueda exacta o LIKE en `patenteVisitante` |

#### Formato de fechas

ISO-8601: `2026-07-29T10:30:00`. Mismo patrón que bitácora:
`@DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde`

#### Respuesta

```json
{
  "content": [
    {
      "id": "uuid",
      "unidadId": "uuid",
      "unidadNumero": "12",
      "autorizacionId": null,
      "nombreVisitante": "Juan Pérez",
      "rutVisitante": null,
      "telefonoVisitante": null,
      "patenteVisitante": "ABC123",
      "tipo": "VISITA",
      "cantidadPersonas": 2,
      "fechaIngreso": "2026-07-29T10:30:00",
      "fechaSalida": null,
      "estado": "ACTIVO",
      "registradoPorNombre": "Carlos (Guardía)",
      "observacion": null
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8,
  "first": true,
  "last": false
}
```

### 2. Nuevo endpoint `GET /accesos/conteo-activos`

Endpoint liviano que retorna únicamente el número de accesos en estado `ACTIVO`.
Sirve para que los dashboards hagan polling sin tener que refrescar todo el
dashboard.

#### Respuesta

```json
{
  "activosAhora": 3
}
```

Sin paginación, sin JOIN FETCH — solo un `countByCondominioIdAndEstado`
(ya existe en el repositorio).

## Endpoints afectados

| Método | Endpoint actual | Cambio |
|--------|----------------|--------|
| `GET` | `/api/v1/condominios/{condominioId}/accesos` | Retornar `PageResponse<RegistroAccesoResponse>` en lugar de `List<RegistroAccesoResponse>`. Agregar filtros `desde`, `hasta`, `nombre`, `patente` |
| `GET` | `/api/v1/condominios/{condominioId}/accesos/conteo-activos` | **Nuevo** — retorna `{ activosAhora: int }` |

## Referencia de implementación

- **`PageResponse<T>`** ya existe en `infrastructure/web/pagination/PageResponse.java`
- **`PageableDefaults`** ya existe en `infrastructure/web/pagination/PageableDefaults.java`
- **Bitácora** es el patrón de referencia: usa `@DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)`, `@RequestParam(required = false)`, y filtros opcionales
- En el repositorio: crear nuevo método paginado con JOIN FETCH + countQuery separada (ver `findHistorialByPatente` como referencia); o reusar el patrón de queries separadas (IDs + fetch por IDs) para evitar el problema de JOIN FETCH con Page
- Para `conteo-activos`: exponer `countByCondominioIdAndEstado(condominioId, EstadoAcceso.ACTIVO)` que ya existe en `RegistroAccesoRepository`
- `nombre` y `patente`: usar `UPPER(r.nombreVisitante) LIKE UPPER(...)` y `UPPER(r.patenteVisitante) LIKE UPPER(...)` para búsqueda case-insensitive

## Notas

- El frontend hará **polling** a `GET /accesos/conteo-activos` cada 15-30 segundos
  en los dashboards para que el contador se actualice sin refrescar toda la vista
- Cuando el backend exponga paginación, el frontend eliminará los filtros
  client-side actuales (líneas 26-34 de `useVisitas.js`) y enviará `nombre` y
  `patente` como query params, además de `page`, `size` y `estado`
- Orden por defecto: `sort = "fechaIngreso,desc"` (más recientes primero)
