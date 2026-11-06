> MIGRADO A ISSUE — JhonayoDev/briku#97 — Project "Gestion Comunidad Briku"

# Solicitud Backend — Acoplar el catálogo de tipos de solicitud al contrato BFF del frontend

**Versión:** 1.1
**Fecha:** 2026-11-05 (actualizado 2026-11-06)
**Audiencia:** Equipo backend (Spring Boot)
**Estado:** Implementado — QA en vivo pendiente (JhonayoDev/briku#97)
**Relacionado:** frontend JhonayoDev/comunidad-frontend#41, backend JhonayoDev/briku#95, `V82__solicitudes_reclamos_y_rut_normalizado.sql`, `TipoSolicitud`, `SolicitudService.validarDatos`, `src/data/solicitudTipos.js`

> **Nota (2026-11-06):** este documento queda como contexto histórico de la solicitud. El catálogo final (sin `INSTALACION_FOCO`) y el estado de implementación/pendientes viven en **JhonayoDev/briku#97**.

---

## 1. Contexto

El frontend de solicitudes (issue #41) define el catálogo de tipos que ve el usuario en
`src/data/solicitudTipos.js`. Para no romper el enum actual del backend, hoy el frontend
traduce sus códigos con un alias `apiTipo` antes de enviar:

| Código de UI | Código enviado al backend | Categoría |
| --- | --- | --- |
| `SOLICITUD` | `OTRO` | `SOLICITUD` |
| `RECLAMO` | `OTRO` | `RECLAMO` |
| `SOLICITUD_MANTENCION` | `RECLAMO_MANTENCION` | `SOLICITUD` |
| `CORRECCION_RUT` | `CORRECCION_RUT` | `SOLICITUD` |
| `RECLAMO_RUIDOS` | `RECLAMO_RUIDOS` | `RECLAMO` |

Ese alias es deuda BFF:

- `OTRO` no describe el producto: la UI habla de "Solicitud" y "Reclamo" (la categoría las
  distingue), pero un `OTRO` guardado obliga al frontend a adivinar la etiqueta por categoría.
- `RECLAMO_MANTENCION` es semánticamente incorrecto: una mantención es una **solicitud**, no un
  reclamo. El frontend ya la presenta como "Solicitud de mantención".
- El filtro `?tipo=` y la respuesta de `GET /solicitudes` / `GET /mis-solicitudes` exponen
  `OTRO` / `RECLAMO_MANTENCION`, por lo que toda vista necesita el mapeo inverso.

Se pide que el backend adopte el catálogo del frontend como contrato canónico y que el frontend
pueda eliminar la capa de alias.

## 2. Catálogo solicitado

| `tipo` | Etiqueta | `categoria` | Alta | Notas |
| --- | --- | --- | --- | --- |
| `SOLICITUD` | Solicitud | `SOLICITUD` | Sí | Genérico; reemplaza a `OTRO` para solicitudes |
| `RECLAMO` | Reclamo | `RECLAMO` | Sí | Genérico; reemplaza a `OTRO` para reclamos |
| `CORRECCION_RUT` | Corrección de RUT | `SOLICITUD` | Sí | Sin cambios de comportamiento |
| `SOLICITUD_MANTENCION` | Solicitud de mantención | `SOLICITUD` | Sí | Renombra `RECLAMO_MANTENCION` |
| `RECLAMO_RUIDOS` | Reclamo por ruidos molestos | `RECLAMO` | Sí | Sin cambios |
| `INSTALACION_FOCO` | Instalación de foco / iluminación | `SOLICITUD` | **No** | Legado: se conserva solo para leer registros históricos; el frontend ya no lo ofrece |
| `OTRO` | — | — | **No** | Legado: se migra a `SOLICITUD`/`RECLAMO` según `categoria` |

## 3. Contrato de API

### 3.1 Alta — `POST /api/v1/condominios/{cid}/solicitudes`

`tipo` acepta los 5 códigos canónicos. La `categoria` se **deriva del tipo** en el servidor
(fuente única de verdad); si el request envía `categoria` y no coincide, responder `400`.

Reglas de coherencia:

| `tipo` | `categoria` derivada |
| --- | --- |
| `SOLICITUD`, `CORRECCION_RUT`, `SOLICITUD_MANTENCION` | `SOLICITUD` |
| `RECLAMO`, `RECLAMO_RUIDOS` | `RECLAMO` |

Ejemplo genérico:

```json
{
  "tipo": "SOLICITUD",
  "titulo": "Consulta por estacionamiento",
  "descripcion": "Necesito saber si queda un estacionamiento disponible.",
  "unidadId": null,
  "prioridad": "NORMAL",
  "datos": {
    "titulo": "Consulta por estacionamiento",
    "descripcion": "Necesito saber si queda un estacionamiento disponible."
  }
}
```

### 3.2 Validación de `datos` por tipo

El frontend ya valida en cliente; el backend debe reforzar las mismas reglas y devolver
`400` con `fields[]` (mismo formato que el resto de la API).

| `tipo` | Obligatorios en `datos` | Opcionales | Reglas |
| --- | --- | --- | --- |
| `SOLICITUD` / `RECLAMO` | `titulo`, `descripcion` (no vacíos, `trim`) | — | `titulo` ≤ 255; `descripcion` ≤ 8000 |
| `SOLICITUD_MANTENCION` | `ubicacion`, `tipoFalla`, `descripcion` | `afectaSeguridad` (boolean) | `tipoFalla` ∈ `FUGA_AGUA`, `ELECTRICO`, `ASCENSOR`, `PORTERIA`, `JARDIN`, `OTRO` |
| `RECLAMO_RUIDOS` | `origen`, `descripcion` | `unidadOrigen`, `horario` | `origen` ∈ `UNIDAD_VECINA`, `AREA_COMUN`, `OBRAS`, `EXTERNO`, `NO_IDENTIFICADO`; `unidadOrigen` obligatorio si `origen = UNIDAD_VECINA` |
| `CORRECCION_RUT` | `rutNuevo`, `motivo` | `motivoOtro`, `evidenciaUrl` | Sin cambios respecto de la implementación actual |

### 3.3 Lectura y filtros

- `GET /solicitudes` y `GET /mis-solicitudes` devuelven `tipo` con el código canónico y
  `categoria` derivada (sin mapeos).
- El filtro `?tipo=` acepta los códigos canónicos. Los códigos legados (`OTRO`,
  `RECLAMO_MANTENCION`, `INSTALACION_FOCO`) se aceptan solo como filtro para consultar
  registros históricos.
- El resto del contrato no cambia: estados, prioridades, seguimientos con
  `visibleResidente`, `POST .../resolver`, `vincular-caso`/`desvincular-caso`.
- `CORRECCION_RUT` sigue siendo el único tipo con efecto lateral
  (`RutCorreccionService`, aprobación explícita, `PERSONA_RUT_CORREGIR`).

## 4. Migración de datos (nueva migración, p. ej. `V83__tipos_solicitud_bff.sql`)

1. `UPDATE solicitudes SET tipo = 'SOLICITUD_MANTENCION' WHERE tipo = 'RECLAMO_MANTENCION';`
2. `UPDATE solicitudes SET tipo = 'SOLICITUD' WHERE tipo = 'OTRO' AND categoria = 'SOLICITUD';`
3. `UPDATE solicitudes SET tipo = 'RECLAMO' WHERE tipo = 'OTRO' AND categoria = 'RECLAMO';`
4. Actualizar `chk_solicitud_tipo` al nuevo conjunto:
   `SOLICITUD`, `RECLAMO`, `CORRECCION_RUT`, `SOLICITUD_MANTENCION`, `RECLAMO_RUIDOS`,
   `INSTALACION_FOCO`.
5. Dejar `INSTALACION_FOCO` en el enum como **deprecado** (solo lectura) para no romper
   registros históricos; el alta lo rechaza con `400`.
6. `OTRO` y `RECLAMO_MANTENCION` salen del enum tras la migración. Si se quiere una ventana de
   compatibilidad, mapearlos en el alta durante una release y retirarlos después (decisión del
   equipo backend; no es requisito del frontend).

## 5. Impacto y tareas

### Backend

- [ ] `TipoSolicitud`: agregar `SOLICITUD`, `RECLAMO`, `SOLICITUD_MANTENCION`; retirar `OTRO` y
      `RECLAMO_MANTENCION`; marcar `INSTALACION_FOCO` como legado.
- [ ] `SolicitudService.validarDatos`: validaciones de la tabla §3.2 y derivación/validación de
      `categoria` según `tipo`.
- [ ] Migración `V83` con los `UPDATE` y el nuevo `CHECK`.
- [ ] Actualizar `SolicitudIntegrationTest` (hoy usa `INSTALACION_FOCO` en las líneas 116/118 y
      `RECLAMO_MANTENCION` en 379/438) y agregar cobertura de:
      - alta con cada código canónico,
      - `400` por `categoria` inconsistente,
      - `400` por `datos` incompletos en `SOLICITUD`, `RECLAMO`, `SOLICITUD_MANTENCION` y
        `RECLAMO_RUIDOS`,
      - filtro `?tipo=SOLICITUD_MANTENCION`,
      - rechazo de alta con `INSTALACION_FOCO`.
- [ ] Verificar que notificaciones (`SolicitudEventHandler` concatena `tipoSolicitud`) y
      auditoría no dependan de los códigos retirados.

### Frontend (posterior, en el mismo release)

- [ ] Quitar `apiTipo` de `src/data/solicitudTipos.js`; `construirPayload` envía `tipo.value`.
- [ ] Simplificar `TIPOS_SOLICITUD_API` (sin `reduce`) y `getTipoSolicitud(value, categoria)`
      (sin resolución de alias).
- [ ] Mantener `INSTALACION_FOCO` con `enAlta: false` para mostrar registros históricos.
- [ ] Actualizar `src/data/__tests__/solicitudTipos.test.js`.

## 6. Criterios de aceptación

1. `POST /solicitudes` con `SOLICITUD`, `RECLAMO`, `SOLICITUD_MANTENCION`, `RECLAMO_RUIDOS` y
   `CORRECCION_RUT` responde `201` y `GET` devuelve el mismo `tipo` y la `categoria` derivada.
2. `POST` con `categoria` inconsistente o `datos` incompletos responde `400` con `fields[]`.
3. `?tipo=SOLICITUD_MANTENCION` y `?tipo=RECLAMO` filtran correctamente en administración y en
   `mis-solicitudes`.
4. La migración remapea `RECLAMO_MANTENCION` → `SOLICITUD_MANTENCION` y `OTRO` →
   `SOLICITUD`/`RECLAMO` sin pérdida de filas (verificar conteos antes/después).
5. `INSTALACION_FOCO` sigue leyéndose, pero el alta lo rechaza.
6. Sin cambios en permisos, estados, seguimientos, resolución de RUT, vínculo con casos ni
   notificaciones.
7. Suite backend en verde.

## 7. Referencias

**Backend**

- `src/main/java/com/space/briku/domain/solicitud/entity/TipoSolicitud.java`
- `src/main/java/com/space/briku/domain/solicitud/entity/CategoriaSolicitud.java`
- `src/main/java/com/space/briku/domain/solicitud/dto/CrearSolicitudRequest.java`
- `src/main/java/com/space/briku/domain/solicitud/service/SolicitudService.java` (`crear`, `validarDatos`)
- `src/main/resources/db/migration/V82__solicitudes_reclamos_y_rut_normalizado.sql`
- `src/test/java/com/space/briku/domain/solicitud/SolicitudIntegrationTest.java`

**Frontend**

- `src/data/solicitudTipos.js` (`apiTipo`, `TIPOS_SOLICITUD_ALTA`, `TIPOS_SOLICITUD_API`,
  `getTipoSolicitud`, `construirPayload`)
- `src/data/__tests__/solicitudTipos.test.js`
- `src/views/residente/MisSolicitudesView.vue`
- `src/views/admin/SolicitudesAdminView.vue`
- `src/views/gestion/CasosAdminView.vue`
