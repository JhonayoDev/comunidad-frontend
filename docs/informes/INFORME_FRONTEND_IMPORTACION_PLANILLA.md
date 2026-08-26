# Informe para Frontend — Importación masiva de la planilla de integrantes (v3)

> Documento de handoff para el equipo de frontend. Resume el contrato de API y las
> reglas de negocio del endpoint de **importación masiva** de la planilla de
> integrantes (etapa 6 del wizard del ADMINISTRADOR): personas por unidad, vehículos y
> vínculos de estacionamientos/bodegas.
> Rama: backend `com.space.comunidad` (Spring Boot 4 / Java 17).
> Solicitud: `docs/solicitudes-recibidas/SOLICITUD_IMPORTACION_PLANILLA_V3.md`.
> Migración: `V67__importacion_planilla.sql`.

---

## 1. Resumen

Se implementan **3 endpoints** bajo `/api/v1/condominios/{cid}/importaciones` con el
diseño de **2 fases (preview + ejecutar)**:

- **`POST /importaciones/preview`** — acepta **archivo** (`.csv`/`.xlsx`) o **JSON**
  (entrada manual del wizard). Parsea y **valida fila a fila sin persistir** datos
  reales; devuelve un borrador (`importacionId`) válido por 30 min.
- **`POST /importaciones/{importacionId}/ejecutar`** — aplica en **una transacción**
  las filas `OK` del preview (con dedupe).
- **`GET /importaciones/plantilla`** — descarga `plantilla_integrantes.csv`.

El **mismo esquema de fila** sirve para archivo y para JSON (una fila = una persona
vinculada a una unidad, con 0..N vehículos y 0..N bodegas).

Reglas clave:

1. **Dedupe (reutiliza, no falla):** unidad por `numero`, persona por `email` (global),
   vehículo por `patente` (por condominio), sector/estacionamiento/bodega por `nombre`.
2. **1 PROPIETARIO + 1 ARRENDATARIO activo** por unidad; vínculo exacto ya existente →
   fila **`OMITIDA`**.
3. **1 `es_responsable=SI` por unidad** (máx); si se repite dentro del archivo o ya
   existe en BD → fila **`ERROR`**.
4. **Vínculos de estacionamiento/bodega** se crean **unidad→estacionamiento/bodega**
   (no vehículo→estacionamiento). En filas `RESIDENTE_ADICIONAL` **se omiten**.
5. **Límite de 1000 filas** por importación → `400` si se supera.

---

## 2. Decisiones de diseño (por qué)

| Decisión                                                   | Detalle                                                                                                                                                                                            |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Borrador en BD, no en memoria**                          | Por la regla de estado del doble backend (activo-pasivo), el `ejecutar` puede caer en el nodo de failover. El preview se persiste (`importaciones`/`importacion_filas`) con `expira_en = +30 min`. |
| **`ejecutar` consume el borrador**                         | Tras ejecutar, el borrador se elimina. Una segunda llamada con el mismo `importacionId` → **404**.                                                                                                 |
| **`es_responsable` es `Boolean` en el vínculo**            | Campo opcional (default `false`) en `POST /vinculos`; si se omite, no rompe. Máx 1 activo por unidad → **409**.                                                                                    |
| **`est1..3`/`bodega1..3` son nombres, no ids**             | Se resuelven por nombre contra la BD y **se crean si no existen** (con envelope del plan).                                                                                                         |
| **`tipo` del vínculo est/bodega deriva de `tipo_vinculo`** | `PROPIETARIO→PROPIETARIO`, `ARRENDATARIO→ARRENDATARIO`; `RESIDENTE_ADICIONAL` → se omite.                                                                                                          |
| **Solo envelope global del plan**                          | El techo por tipo (`capacidad_*`) es informativo en el backend actual; no bloquea.                                                                                                                 |
| **Estados `OK`/`ERROR`/`OMITIDA`**                         | `OMITIDA` = el vínculo persona-unidad ya existe y se salta; `ERROR` = fila inválida (no se importa).                                                                                               |

---

## 3. Contrato de API

Base: `/api/v1/condominios/{cid}/importaciones` — scoped por condominio, permiso
**`IMPORTACION_DATOS`** (rol `ADMINISTRADOR` + cargos `ADMINISTRADOR`, `PRESIDENTE`,
`SECRETARIO`).

### 3.1 Endpoints

| Método | Ruta                                      | Content-Type                            | Respuesta                                                 |
| ------ | ----------------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| POST   | `/importaciones/preview`                  | `multipart/form-data` (campo `archivo`) | `200` `ImportacionPreviewResponse`                        |
| POST   | `/importaciones/preview`                  | `application/json` `{ filas: [...] }`   | `200` `ImportacionPreviewResponse`                        |
| POST   | `/importaciones/{importacionId}/ejecutar` | —                                       | `200` `ImportacionResultadoResponse`                      |
| GET    | `/importaciones/plantilla`                | —                                       | `200` `text/csv` (attachment `plantilla_integrantes.csv`) |

### 3.2 Entrada JSON (wizard) — `ImportacionJsonRequest`

```jsonc
{
  "filas": [
    {
      "unidad": "1",
      "tipoUnidad": "CASA", // CASA | DEPARTAMENTO | OTRO (requerido si la unidad es nueva)
      "sector": "Sector A", // opcional (se crea si no existe)
      "persona": {
        "nombre": "Francisca Morales", // requerido
        "email": "f.morales@test.com", // requerido, dedupe global
        "rut": "18.901.234-5", // opcional
        "telefono": "+56978901234", // opcional
      },
      "vinculo": {
        "tipo": "PROPIETARIO", // PROPIETARIO | ARRENDATARIO | RESIDENTE_ADICIONAL
        "esOcupante": true, // default true
        "recibeNotificaciones": true, // default true
        "esResponsable": true, // default false, máx 1 por unidad
      },
      "vehiculos": [
        {
          "patente": "ABCD01", // requerido si el vehículo está presente
          "tipo": "AUTO", // AUTO | CAMIONETA | MOTO | FURGON | CAMION | OTRO (default AUTO)
          "marca": "Toyota",
          "modelo": "Corolla",
          "color": "Blanco", // opcionales
          "estacionamiento": "E-1", // nombre del estacionamiento (se crea/víncula)
        },
      ],
      "bodegas": ["B-1", "B-2"], // nombres de bodegas (se crean/vínculan)
    },
  ],
}
```

### 3.3 Formato de archivo (CSV/XLSX)

- `.csv` UTF-8, delimitador `;` o `,` (autodetectado), BOM tolerado, primera fila =
  encabezado. `.xlsx` primera hoja, misma estructura.
- Encabezados (32 columnas, orden del contrato):

```
unidad, tipo_unidad, sector, nombre, email, rut, telefono, tipo_vinculo,
es_ocupante, recibe_notificaciones, es_responsable,
patente1, tipo_vehiculo1, marca1, modelo1, color1, est1,
patente2, tipo_vehiculo2, marca2, modelo2, color2, est2,
patente3, tipo_vehiculo3, marca3, modelo3, color3, est3,
bodega1, bodega2, bodega3
```

- Obligatorios: `unidad`, `nombre`, `email`, `tipo_vinculo`.
- Flags `es_ocupante`/`recibe_notificaciones`/`es_responsable`: `SI`/`NO`
  (defaults `SI`/`SI`/`NO`).

### 3.4 Respuesta preview — `ImportacionPreviewResponse`

```jsonc
{
  "importacionId": "uuid",
  "totalFilas": 5,
  "filasOk": 4,
  "filasError": 1,
  "encabezadosValidos": ["unidad", "nombre", "email", "tipo_vinculo", "..."],
  "encabezadosFaltantes": [], // avisar al admin antes de importar si no está vacío
  "filas": [
    {
      "numeroFila": 1, // 1-based (sin header)
      "estado": "OK", // OK | ERROR | OMITIDA
      "unidad": "1",
      "personaNombre": "Francisca Morales",
      "personaEmail": "f.morales@test.com",
      "tipoVinculo": "PROPIETARIO",
      "errores": [], // vacío si OK
    },
  ],
}
```

### 3.5 Respuesta ejecutar — `ImportacionResultadoResponse`

```jsonc
{
  "importacionId": "uuid",
  "filasOk": 4,
  "filasOmitidas": 0,
  "filasError": 1,
  "unidadesCreadas": 4,
  "personasCreadas": 5,
  "personasReutilizadas": 0,
  "vinculosCreados": 5,
  "vehiculosCreados": 3,
  "estacionamientosVinculados": 3,
  "bodegasVinculadas": 1,
  "errores": [{ "numeroFila": 5, "mensaje": "..." }],
}
```

---

## 4. Errores

- **400** → `ErrorResponse.ofValidation` con `{ field: "archivo", message: "Formato no
soportado. Usa un archivo .csv o .xlsx" }`; también `"El archivo supera el máximo de
1000 filas."` y `"Debes enviar el arreglo 'filas'."`.
- **404** → `importacionId` inexistente o de otro condominio, o ya consumido
  (`"Importación"` no encontrada).
- **409** → borrador expirado (`"El borrador de la importación expiró..."`).
- **403** → sin acceso al condominio o sin permiso `IMPORTACION_DATOS`.
- Los errores **por fila** no devuelven 4xx: van dentro de `filas[].errores` (preview) o
  `errores[]` (ejecutar). Una fila en `ERROR` **no se importa**; el resto sí.

---

## 5. Reglas de dedupe / estados por fila (preview)

| Condición                                                                                                                                         | Estado                   | Detalle                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------- |
| Email vacío/malformado, `unidad` vacía, `nombre` vacío, `tipo_vinculo` inválido, `tipo_unidad` inválido, `es_ocupante`/`es_responsable` inválidos | `ERROR`                  | mensaje en `errores`                               |
| `tipo_unidad` faltante y la unidad **no existe**                                                                                                  | `ERROR`                  | `tipo_unidad es obligatorio para una unidad nueva` |
| `patente` duplicada **dentro del archivo**                                                                                                        | `ERROR` (2ª ocurrencia)  |                                                    |
| Más de un `es_responsable=SI` por unidad (archivo o BD)                                                                                           | `ERROR` (2ª en adelante) |                                                    |
| RUT ya registrado con otra persona (persona nueva)                                                                                                | `ERROR`                  |                                                    |
| Vínculo persona-unidad (`persona, unidad, tipo`) ya existe activo                                                                                 | `OMITIDA`                | `El vínculo ya existe y se omitirá`                |
| Unidad/`email`/`patente` ya existen                                                                                                               | `OK` (reutiliza)         | se cuenta en `personasReutilizadas`                |

---

## 6. Flujo del wizard (consumidor)

1. **Armar planilla** (manual o archivo) → `POST /importaciones/preview`.
2. **Renderizar la tabla** con `filas[].estado` (igual a la simulación actual). Mostrar
   aviso si `encabezadosFaltantes` no está vacío.
3. Si hay filas `OK` → botón **"Importar N filas"** → `POST /importaciones/{id}/ejecutar`.
4. Mostrar `ImportacionResultadoResponse` (conteos + `errores`).
5. Botón **"Descargar plantilla"** → `GET /importaciones/plantilla`.

---

## 7. Cambio colateral — `es_responsable` en vínculos

- `POST /vinculos` (`CrearVinculoRequest`) acepta `esResponsable` (opcional, `Boolean`,
  default `false`).
- `VinculoResponse` ahora incluye `esResponsable` (boolean).
- Si se crea un vínculo con `esResponsable=true` y la unidad ya tiene otro activo →
  **409** `"La unidad ya tiene un responsable de casa asignado..."`.

---

## 8. Verificación manual sugerida

1. `GET /importaciones/plantilla` → descarga CSV con encabezado canónico.
2. `POST /importaciones/preview` (multipart con el CSV de §4.2 de la solicitud) → `200`
   con 4 filas, estados `OK`, vehículos/estacionamientos detectados.
3. `POST /importaciones/preview` (JSON con 1 fila PROPIETARIO + 1 vehículo + 1 bodega) →
   `200` con `filasOk=1`.
4. `POST /importaciones/{id}/ejecutar` → `200` con `unidadesCreadas=1`,
   `personasCreadas=1`, `vinculosCreados=1`, `vehiculosCreados=1`,
   `estacionamientosVinculados=1`, `bodegasVinculadas=1`.
5. Repetir `ejecutar` con el mismo id → **404** (borrador consumido).
6. Dos filas con `es_responsable=true` en la misma unidad → 2ª fila `ERROR`.
7. Dos filas con la misma `patente` → 2ª fila `ERROR`.
8. Admin de otro condominio → **403**.

---

## 9. Tests

- **Nuevos (12):** `PlanillaParserTest` (5, unitarios de parsing CSV/plantilla) +
  `ImportacionPlanillaIntegrationTest` (7, preview JSON/CSV, ejecutar, dedupe de
  responsable y patente, plantilla y aislamiento multi-tenant).
- **Regresiones verificadas:** `TenantIsolationIntegrationTest` (19) y
  `CrudGestionIntegrationTest` (32) pasan sin regresiones (se ajustó `CrearVinculoRequest`
  para que `esResponsable` sea opcional y no rompa los payloads existentes).
