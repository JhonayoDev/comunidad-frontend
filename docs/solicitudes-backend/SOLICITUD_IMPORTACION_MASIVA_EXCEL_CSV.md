# Solicitud Backend — Importación masiva de datos desde Excel/CSV

**Versión:** 2.0
**Fecha:** 2026-08-14
**Audiencia:** Equipo backend (Spring Boot / Flyway / JPA)
**Estado:** Pendiente de implementación
**Relacionado:** `UnidadController.java`, `PersonaController.java`, `VinculoService.java`, `VehiculoService.java`, `V1__initial_schema.sql`, `V3__seed_demo_condominio.sql`

---

## 1. Resumen ejecutivo

Se solicita un **endpoint de importación masiva** que permita al rol **ADMINISTRADOR** (y cargos
PRESIDENTE/SECRETARIO) cargar la data inicial de un condominio desde un archivo **CSV o XLSX** o
desde **JSON** (entrada manual del wizard): unidades, sectores, personas, vínculos persona-unidad,
vehículos y estacionamientos.

Hoy solo existen endpoints unitarios (`POST /unidades`, `POST /personas`, `POST /vinculos`,
`POST /vehiculos`). Para un condominio que parte desde cero (ej: 100 casas, 200 residentes,
120 vehículos) eso son cientos de llamadas. La importación resuelve el caso real del flujo del
nuevo administrador: **arma la planilla → valida fila a fila → muestra qué quedará → aplica en una
transacción**.

El diseño es de **2 fases** (preview + ejecutar) para que el frontend pueda mostrar "cómo quedará
la tabla una vez cargada" antes de persistir nada, igual que el flujo wizard del admin. **El mismo
contrato sirve para archivo (CSV/XLSX) y para JSON** (entrada manual): el frontend envía las filas
como JSON en el wizard y como archivo en la importación.

---

## 2. Contexto y estado actual (verificado)

### 2.1 Endpoints unitarios existentes

| Recurso | Endpoint | Permiso | DTO request |
|---|---|---|---|
| Unidad | `POST /api/v1/condominios/{cid}/unidades` | `UNIDAD_CREAR` | `CrearUnidadRequest(numero, tipo, piso, sectorId)` |
| Persona | `POST /api/v1/condominios/{cid}/personas` | `PERSONA_CREAR` | `CrearPersonaRequest(nombre, email, rut, telefono)` |
| Vínculo | `POST /api/v1/condominios/{cid}/vinculos` | `VINCULO_CREAR` | `CrearVinculoRequest(personaId, unidadId, tipo, esOcupante, recibeNotificaciones, fechaInicio)` |
| Vehículo | `POST /api/v1/condominios/{cid}/vehiculos` | `VEHICULO_CREAR` | `CrearVehiculoRequest(patente, tipo, personaId, marca, modelo, color)` |
| Estacionamiento vehículo | `POST /api/v1/condominios/{cid}/vehiculos/{id}/estacionamiento` | `VEHICULO_EDITAR` | `VincularEstacionamientoRequest(unidadId, fechaInicio)` |

### 2.2 Reglas de negocio que la importación DEBE respetar (verificadas)

1. **Unidad**: `numero` UNIQUE por condominio (`uq_unidad_numero`, V1:175). Si ya existe → reutilizar.
   Límites: `plan.unidadLimit` global (`UnidadService.validarLimiteUnidades`) y techo por tipo
   `condominio.capacidadPara(tipo)` (V51). `TipoUnidad`: `CASA, DEPARTAMENTO, ESTACIONAMIENTO, BODEGA, OTRO`.
2. **Sector**: `nombre` no tiene UNIQUE a nivel DB — se dedupe por `(condominio_id, nombre)` en el importador. Opcional.
3. **Persona**: `email` y `rut` son **UNIQUE globales** (V1:20-21). Dedupe por `email`: si existe →
   reutilizar; si no → crear. `PersonaCondominioService.crear` hoy **lanza error** si el email ya
   existe (L86-90) — el importador NO debe fallar por eso, debe reutilizar el id.
4. **Vínculo persona-unidad**: máx **1 PROPIETARIO + 1 ARRENDATARIO activo** por unidad
   (`VinculoService` L43-50). Dedupe por `(persona, unidad, tipo)` activo → omitir.
5. **Vehículo**: `patente` UNIQUE por condominio (`uq_vehiculo_cond_patente`, V1:253), se
   normaliza a mayúsculas. Requiere `personaId` (dueño = persona de la fila).
6. **Estacionamiento**: vínculo vehículo→unidad `ESTACIONAMIENTO`. Un estacionamiento puede tener
   **varios vehículos** (el demo tiene E-6 con 2, V3:316-320). No hay UNIQUE.

### 2.3 Orden de creación (por FKs)

`Sectores → Unidades → Personas → Vínculos persona-unidad → Vehículos → Vínculos vehículo-estacionamiento`

### 2.4 Estado actual

- **No existe** ningún endpoint de importación/bulk/CSV/Excel (búsqueda exhaustiva).
- `pom.xml` **no incluye** librerías de parsing (sin Apache POI, commons-csv, opencsv).
- Solo hay manejo de `MultipartFile` para imágenes en `FileUploadController`.

### 2.5 Condominio demo (V3) — datos reales para validar

Los Robles: 3 sectores, 15 casas + 18 estacionamientos, 34 personas, 34 vínculos, 12 vehículos,
12 vínculos vehículo-estacionamiento. Formato de planilla a replicar.

---

## 3. Formato de la planilla (contrato)

**Una fila = una persona vinculada a una unidad**, con **0..N vehículos** en columnas fijas
(`patente1..3`, `est1..3`) y **0..N bodegas** (`bodega1..3`). Ya NO se repite la persona por
vehículo (formato v1): cada persona ocupa una sola fila y sus vehículos van en columnas numeradas.

Se acepta **`.csv`** (UTF-8, delimitador `;` o `,` autodetectado), **`.xlsx`** y **JSON** (mismo
esquema, para la entrada manual del wizard).

### 3.1 Columnas (encabezado, primera fila)

| # | Columna | Oblig. | Valores / formato | Se crea/vincula |
|---|---|---|---|---|
| 1 | `unidad` | ✅ | Número de la unidad (ej `1`, `101-A`) | `Unidad.numero` |
| 2 | `tipo_unidad` | ✅ si unidad nueva | `CASA/DEPARTAMENTO/ESTACIONAMIENTO/BODEGA/OTRO` | `Unidad.tipo` |
| 3 | `sector` | 🟡 | Nombre del sector (ej `Sector A`) | `Sector.nombre` (dedupe) |
| 4 | `nombre` | ✅ | Nombre completo | `Persona.nombre` |
| 5 | `email` | ✅ | Email (dedupe global) | `Persona.email` |
| 6 | `rut` | 🟡 | `12.345.678-9` | `Persona.rut` |
| 7 | `telefono` | 🟡 | `+56912345678` | `Persona.telefono` |
| 8 | `tipo_vinculo` | ✅ | `PROPIETARIO/ARRENDATARIO/RESIDENTE_ADICIONAL` | `VinculoPersonaUnidad.tipo` |
| 9 | `es_ocupante` | 🟡 default `SI` | `SI/NO` | `VinculoPersonaUnidad.esOcupante` |
| 10 | `recibe_notificaciones` | 🟡 default `SI` | `SI/NO` | `VinculoPersonaUnidad.recibeNotificaciones` |
| 11 | `es_responsable` | 🟡 default `NO` | `SI/NO` — **1 por casa** | `VinculoPersonaUnidad.esResponsable` (nuevo) |
| 12 | `patente1` | 🟡 | `ABCD01` (mayúsculas) | `Vehiculo.patente` |
| 13 | `tipo_vehiculo1` | 🟡 default `AUTO` | `AUTO/CAMIONETA/MOTO/FURGON/CAMION/OTRO` | `Vehiculo.tipo` |
| 14 | `marca1` | 🟡 | | `Vehiculo.marca` |
| 15 | `modelo1` | 🟡 | | `Vehiculo.modelo` |
| 16 | `color1` | 🟡 | | `Vehiculo.color` |
| 17 | `est1` | 🟡 | Número de unidad `ESTACIONAMIENTO` (ej `E-6`) | `VinculoVehiculo` |
| 18-22 | `patente2..est2` | 🟡 | 2º vehículo (mismo esquema) | idem |
| 23-27 | `patente3..est3` | 🟡 | 3º vehículo (mismo esquema) | idem |
| 28 | `bodega1` | 🟡 | Número de unidad `BODEGA` (ej `B-1`) | `VinculoPersonaUnidad` a unidad BODEGA |
| 29 | `bodega2` | 🟡 | | idem |
| 30 | `bodega3` | 🟡 | | idem |

`🟡` = opcional. Si el vehículo viene con `est`, se crea el vínculo vehículo→estacionamiento (el
estacionamiento debe existir o crearse con `tipo_unidad=ESTACIONAMIENTO`). Las columnas `bodega1..3`
solo se muestran si el condominio tiene `capacidadBodegas > 0` (configuración del SUPER_ADMIN).

### 3.2 Plantilla de ejemplo (a publicar en `GET .../plantilla`)

```csv
unidad;tipo_unidad;sector;nombre;email;rut;telefono;tipo_vinculo;es_ocupante;recibe_notificaciones;es_responsable;patente1;tipo_vehiculo1;marca1;modelo1;color1;est1;patente2;tipo_vehiculo2;marca2;modelo2;color2;est2;patente3;tipo_vehiculo3;marca3;modelo3;color3;est3;bodega1;bodega2;bodega3
1;CASA;Sector A;Francisca Morales Díaz;francisca.morales@test.com;18.901.234-5;+56978901234;PROPIETARIO;SI;SI;SI;ABCD01;AUTO;Toyota;Corolla;Blanco;E-1;;;;;;;;
1;CASA;Sector A;Camila Reyes Vidal;camila.reyes@test.com;30.123.456-7;+56990123457;RESIDENTE_ADICIONAL;SI;SI;NO;;;;;;;;;;;;
3;CASA;Sector B;Hernán Vargas Soto;hernan.vargas@test.com;19.012.345-6;+56989012345;PROPIETARIO;SI;SI;SI;ABCD02;AUTO;Hyundai;Tucson;Gris;E-3;ABCD03;CAMIONETA;Chevrolet;Colorado;Plateado;E-2;;
6;CASA;Sector B;Roberto Fuentes Mora;roberto.fuentes@test.com;14.567.890-1;+56934567890;PROPIETARIO;SI;SI;SI;ABCD04;AUTO;Mazda;3;Azul;E-6;ABCD05;AUTO;Kia;Cerato;Rojo;E-6;;
```

### 3.3 Formato JSON (entrada manual / wizard)

El frontend envía las mismas filas como JSON. Cada fila:

```json
{
  "unidad": "1",
  "tipoUnidad": "CASA",
  "sector": "Sector A",
  "persona": { "nombre": "Francisca Morales Díaz", "email": "francisca.morales@test.com", "rut": "18.901.234-5", "telefono": "+56978901234" },
  "vinculo": { "tipo": "PROPIETARIO", "esOcupante": true, "recibeNotificaciones": true, "esResponsable": true },
  "vehiculos": [
    { "patente": "ABCD01", "tipo": "AUTO", "marca": "Toyota", "modelo": "Corolla", "color": "Blanco", "estacionamiento": "E-1" }
  ],
  "bodegas": []
}
```

---

## 4. Endpoints propuestos

### 4.1 `POST /api/v1/condominios/{condominioId}/importaciones/preview`

- **Body:** `multipart/form-data` campo `archivo` (`.csv`/`.xlsx`) **O** `application/json` con
  `{ "filas": [ ... ] }` (mismo esquema de la sección 3.3). Se distingue por `Content-Type`.
- **Permiso:** nuevo `IMPORTACION_DATOS` (o `hasAnyRole('ADMINISTRADOR')` + cargos).
- **Comportamiento:** parsea y **valida fila a fila SIN persistir**. Detecta:
  - Columnas del encabezado válidas / faltantes.
  - Errores por fila: email vacío/malformado, unidad vacía, tipo inválido, `tipo_vinculo` inválido,
    `patente` duplicada **dentro del archivo**, `es_ocupante` inválido, **más de un
    `es_responsable=SI` por casa**, etc.
  - Coincidencias con la BD (sin persistir): unidad ya existe, persona ya existe por email,
    vínculo ya existe, patente ya existe.
- **Respuesta `200`:** `ImportacionPreviewResponse` (abajo) con `importacionId` (UUID del borrador,
  válido por 30 min) + filas con estado `OK|ERROR|OMITIDA` + errores por fila.
- **No persiste ningún dato real** — solo guarda el borrador del preview.

### 4.2 `POST /api/v1/condominios/{condominioId}/importaciones/{importacionId}/ejecutar`

- **Permiso:** `IMPORTACION_DATOS`.
- **Comportamiento:** aplica en **una transacción** las filas `OK` del preview. Para cada fila:
  1. Dedupe/crear **Sector** (por `(condominio_id, nombre)`).
  2. Dedupe/crear **Unidad** (por `(condominio_id, numero)`; valida `plan.unidadLimit` y
     `capacidadPara(tipo)`).
  3. Dedupe/crear **Persona** (por `email` global; si existe → reutiliza id, no falla).
  4. Crear **Vínculo** persona-unidad (valida 1 PROPIETARIO/ARRENDATARIO activo por unidad;
     si ya existe → marca la fila `OMITIDA`). Guarda `esResponsable`.
  5. Por cada `vehiculos[]`: dedupe/crear **Vehículo** (por `(condominio_id, patente)` mayúscula,
     dueño = persona). Si ya existe → `OMITIDA`.
  6. Si viene `estacionamiento`: dedupe/crear **VinculoVehiculo** (vehículo→unidad ESTACIONAMIENTO).
  7. Por cada `bodegas[]`: dedupe/crear **VinculoPersonaUnidad** a la unidad BODEGA (si no existe
     el vínculo activo).
- **Respuesta `200`:** `ImportacionResultadoResponse` con conteos: `unidadesCreadas`,
  `personasCreadas`, `personasReutilizadas`, `vinculosCreados`, `vehiculosCreados`,
  `estacionamientosVinculados`, `filasOk`, `filasOmitidas`, `filasError`.
- Si una fila falla en medio de la transacción, se **marca como ERROR** y la transacción
  **continúa con las demás** (por-fila con try/catch interno, rollback solo de esa fila vía
  `REQUIRES_NEW` o validación completa previa en el preview).

### 4.3 `GET /api/v1/condominios/{condominioId}/importaciones/plantilla`

- Descarga `plantilla.csv` (contenido de la sección 3.2) para que el admin la use de base.
- **Permiso:** `IMPORTACION_DATOS`.

---

## 5. DTOs de respuesta

### 5.1 `ImportacionPreviewResponse`

```java
public record ImportacionPreviewResponse(
    UUID importacionId,
    int totalFilas,
    int filasOk,
    int filasError,
    List<String> encabezadosValidos,
    List<String> encabezadosFaltantes,
    List<FilaPreview> filas) {

  public record FilaPreview(
      int numeroFila,           // 1-based (fila del archivo, sin header)
      String estado,            // OK | ERROR
      String unidad,
      String personaNombre,
      String personaEmail,
      String tipoVinculo,
      List<String> errores) {} // vacío si OK
}
```

### 5.2 `ImportacionResultadoResponse`

```java
public record ImportacionResultadoResponse(
    UUID importacionId,
    int filasOk,
    int filasOmitidas,
    int filasError,
    int unidadesCreadas,
    int personasCreadas,
    int personasReutilizadas,
    int vinculosCreados,
    int vehiculosCreados,
    int estacionamientosVinculados,
    List<ErrorFila> errores) {

  public record ErrorFila(int numeroFila, String mensaje) {}
}
```

### 5.3 Errores de formato

`400` con `ErrorResponse.ofValidation([{field: "archivo", message: "Formato no soportado. Usa .csv o .xlsx"}])`.

---

## 6. Cambios requeridos en el backend

1. **Dependencias** (`pom.xml`): `org.apache.commons:commons-csv` (CSV) y
   `org.apache.poi:poi-ooxml` (XLSX).
2. **Entidad borrador**: `Importacion` + `ImportacionFila` (o tabla temporal en memoria/Redis)
   para conservar el preview entre llamadas (id + contenido parseado + vencimiento).
3. **Permiso nuevo** `IMPORTACION_DATOS` (migración V57) + auditoría `IMPORTACION_DATOS` y
   `IMPORTACION_DATOS_EJECUTADA`.
4. **Campo nuevo `esResponsable`** en `VinculoPersonaUnidad` (migración V57, default `false`) +
   en `CrearVinculoRequest` y `VinculoResponse`. Regla: **máx 1 `esResponsable=true` por unidad**
   (validación en `VinculoService`).
5. **`ImportacionService`**:
   - `preview(MultipartFile | List<FilaJson>)` → parsea (CSV/XLSX por extensión o JSON), valida
     encabezados, valida filas.
   - `ejecutar(UUID importacionId)` → orquesta el orden por FK con dedupe (métodos reutilizados de
     `SectorService`/`UnidadService`/`PersonaCondominioService`/`VinculoService`/`VehiculoService`).
   - Expone `obtenerPlantilla()`.
6. **`ImportacionController`** con las 3 rutas.
7. **Límite de filas**: máx `1000` filas por archivo (evita abusos); `413`/`400` si supera.

---

## 7. Notas para el frontend (consumidor)

- El flujo será: armar planilla (manual o archivo) → `POST preview` → renderizar la tabla con
  estados por fila (igual a la simulación en `ImportacionMasivaView`/`SetupPlanillaView`) → si hay
  filas OK → botón "Importar N filas" → `POST ejecutar` → mostrar resultado.
- **El wizard envía TODAS las filas en una sola petición** (JSON), no una por fila.
- Si `encabezadosFaltantes` no está vacío, mostrar aviso antes de importar.
- Las filas `ERROR` se listan con su número de fila y motivo; no se importan.
- Endpoint de plantilla para el botón "Descargar plantilla".
- El frontend ya implementa el nuevo formato persona-por-fila (columnas `patente1..3`/`est1..3`/
  `bodega1..3`, `es_responsable`) en `src/data/planillaColumnas.js`, `usePlanillaDatos.js` y el
  componente `PlanillaDatos.vue`; el botón "Importar datos" es simulado hasta que exista el endpoint.