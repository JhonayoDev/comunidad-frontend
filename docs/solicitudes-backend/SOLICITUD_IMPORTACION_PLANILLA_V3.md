# Solicitud Backend — Importación masiva de la planilla de integrantes (v3)

**Versión:** 3.0
**Fecha:** 2026-08-18
**Audiencia:** Equipo backend (Spring Boot / Flyway / JPA)
**Estado:** ⏳ Pendiente de implementación
**Reemplaza:** `SOLICITUD_IMPORTACION_MASIVA_EXCEL_CSV.md` (v2.0, desactualizada al modelo V58/V59)
**Relacionado:** `PersonaController.java`, `VehiculoController.java`, `EstacionamientoController.java`,
`BodegaController.java`, `UnidadController.java`, `VinculoService.java`, `V57__vehiculos_unidad_vinculo.sql`,
`V58__estacionamientos_desvinculados.sql`, `V59__bodegas_desvinculadas.sql`, `V66__pisos.sql` (patrón de permisos)

---

## 1. Resumen ejecutivo

Se solicita el **endpoint de importación masiva** de la planilla de integrantes del condominio
(etapa 6 del wizard de configuración del ADMINISTRADOR): personas vinculadas a unidades
(casas/departamentos), con sus vehículos y los vínculos de estacionamientos y bodegas de la casa.

Hoy solo existen endpoints **unitarios** (`POST /personas`, `POST /vinculos`, `POST /vehiculos`,
`POST /estacionamientos/{id}/vinculos`, `POST /bodegas/{id}/vinculos`). Para un condominio que
parte desde cero (ej: 100 casas, 200 residentes, 120 vehículos) eso son cientos de llamadas. La
importación resuelve el caso real del flujo del nuevo administrador: **arma la planilla → valida
fila a fila → muestra qué quedará → aplica en una transacción**.

El diseño es de **2 fases** (preview + ejecutar) para que el frontend pueda mostrar "cómo quedará
la tabla una vez cargada" antes de persistir nada. **El mismo contrato sirve para archivo
(CSV/XLSX) y para JSON** (entrada manual del wizard): el frontend envía las filas como JSON en el
wizard y como archivo en la importación (flujo Google Form → CSV → cargar).

**Esta solicitud reemplaza la v2.0** porque el modelo cambió (V57-V59): los estacionamientos y
bodegas ya NO son tipos de unidad (son entidades propias con vínculos a la unidad), el vínculo
vehículo→estacionamiento directo ya NO existe, y el vehículo se vincula a la unidad residencial.

---

## 2. Contexto y estado actual (verificado)

### 2.1 Endpoints unitarios existentes

| Recurso | Endpoint | Permiso | DTO request |
|---|---|---|---|
| Persona | `POST /api/v1/condominios/{cid}/personas` | `PERSONA_CREAR` | `CrearPersonaRequest(nombre, email, rut, telefono)` |
| Vínculo persona-unidad | `POST /api/v1/condominios/{cid}/vinculos` | `VINCULO_CREAR` | `CrearVinculoRequest(personaId, unidadId, tipo, esOcupante, recibeNotificaciones, fechaInicio)` |
| Vehículo | `POST /api/v1/condominios/{cid}/vehiculos` | `VEHICULO_CREAR` | `CrearVehiculoRequest(patente, tipo, unidadId, marca, modelo, color)` |
| Estacionamiento vínculo | `POST /api/v1/condominios/{cid}/estacionamientos/{id}/vinculos` | `UNIDAD_EDITAR` | `VincularEstacionamientoRequest(tipo, unidadId, fechaInicio, fechaFin)` |
| Bodega vínculo | `POST /api/v1/condominios/{cid}/bodegas/{id}/vinculos` | `UNIDAD_EDITAR` | `VincularBodegaRequest(tipo, unidadId, fechaInicio, fechaFin)` |

### 2.2 Reglas de negocio que la importación DEBE respetar (verificadas)

1. **Unidad**: `numero` UNIQUE por condominio (`uq_unidad_numero`, V1:175). Si ya existe →
   reutilizar. Límites: `plan.unidadLimit` global (`UnidadService.validarLimiteUnidades`) y techo
   por tipo `condominio.capacidadPara(tipo)` (V51). `TipoUnidad`: `CASA, DEPARTAMENTO, CONDOMINIO, OTRO`
   (V58/V59 extrajeron `ESTACIONAMIENTO`/`BODEGA` a tablas propias).
2. **Sector**: `nombre` se dedupe por `(condominio_id, nombre)` (índice parcial V65). Opcional.
3. **Persona**: `email` y `rut` son **UNIQUE globales** (V1:20-21). Dedupe por `email`: si existe →
   reutilizar; si no → crear. `PersonaCondominioService.crear` hoy **lanza error** si el email ya
   existe (L84-106) — el importador NO debe fallar por eso, debe reutilizar el id.
4. **Vínculo persona-unidad**: máx **1 PROPIETARIO + 1 ARRENDATARIO activo** por unidad
   (`VinculoService` L43-50). Dedupe por `(persona, unidad, tipo)` activo → omitir.
5. **Vehículo**: `patente` UNIQUE por condominio (`uq_vehiculo_cond_patente`, V1:253), se
   normaliza a mayúsculas. Requiere `unidadId` (la casa/departamento de la fila). El vehículo es
   **global** (V57): la pertenencia al condominio/unidad vive en `vinculos_vehiculo`.
6. **Estacionamiento/Bodega**: vínculo **unidad→estacionamiento/bodega** (`VinculoEstacionamiento`/
   `VinculoBodega`, V58/V59) con `tipo` `PROPIETARIO|ARRENDATARIO`. Un estacionamiento puede tener
   **varios vehículos** y varias unidades vinculadas (el demo tiene E-6 con 2, V3:316-320). No hay
   UNIQUE. **NO existe vínculo vehículo→estacionamiento** (el modelo V57 lo eliminó).

### 2.3 Orden de creación (por FKs)

`Sectores → Unidades → Personas → Vínculos persona-unidad → Vehículos → Vínculos unidad-estacionamiento → Vínculos unidad-bodega`

### 2.4 Estado actual

- **No existe** ningún endpoint de importación/bulk/CSV/Excel (búsqueda exhaustiva: `rg importacion`
  en `src/` → 0 matches).
- `pom.xml` **no incluye** librerías de parsing (sin Apache POI, commons-csv, opencsv).
- **No existe** el permiso `IMPORTACION_DATOS` en ningún catálogo (V2, V9, V25, V38, V50, V53,
  V56, V62, V66 ni otros).
- **No existe** la columna `esResponsable` en `vinculos_persona_unidad` (ni en DTOs ni validación;
  `rg esResponsable` → 0 matches). La tabla tiene `es_ocupante` y `recibe_notificaciones` (V1:219-220).
- **No existen** tablas `importacion` / `importacion_fila`.

---

## 3. Problema que resuelve

1. El ADMINISTRADOR no tiene forma de **cargar la data inicial del condominio** (personas por casa,
   vehículos, estacionamientos/bodegas vinculados) en una sola operación: hoy serían cientos de
   llamadas unitarias.
2. El flujo real del condominio es **Google Form → planilla CSV → carga masiva**: los residentes
   completan sus datos en un formulario, el admin descarga el CSV y lo sube. Sin el endpoint de
   importación ese flujo es imposible.
3. La planilla del wizard (etapa 6) necesita **guardar de verdad** (hoy el botón "Guardar planilla"
   es simulado) y mostrar **preview fila a fila** antes de persistir.
4. El campo **"Responsable de la casa"** (`esResponsable`, 1 por unidad) existe en la planilla del
   frontend pero no tiene soporte en el backend.

---

## 4. Formato de la planilla (contrato)

**Una fila = una persona vinculada a una unidad**, con **0..N vehículos** en columnas fijas
(`patente1..3`, `est1..3`) y **0..N bodegas** (`bodega1..3`). Cada persona ocupa una sola fila y
sus vehículos van en columnas numeradas.

Se acepta **`.csv`** (UTF-8, delimitador `;` o `,` autodetectado), **`.xlsx`** y **JSON** (mismo
esquema, para la entrada manual del wizard).

### 4.1 Columnas (encabezado, primera fila)

| # | Columna | Oblig. | Valores / formato | Se crea/vincula |
|---|---|---|---|---|
| 1 | `unidad` | ✅ | Número de la unidad (ej `1`, `101-A`) | `Unidad.numero` |
| 2 | `tipo_unidad` | ✅ si unidad nueva | `CASA/DEPARTAMENTO/OTRO` | `Unidad.tipo` |
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
| 17 | `est1` | 🟡 | Nombre del estacionamiento (ej `E-6`) | `VinculoEstacionamiento` (unidad→estacionamiento) |
| 18-22 | `patente2..est2` | 🟡 | 2º vehículo (mismo esquema) | idem |
| 23-27 | `patente3..est3` | 🟡 | 3º vehículo (mismo esquema) | idem |
| 28 | `bodega1` | 🟡 | Nombre de la bodega (ej `B-1`) | `VinculoBodega` (unidad→bodega) |
| 29 | `bodega2` | 🟡 | | idem |
| 30 | `bodega3` | 🟡 | | idem |

`🟡` = opcional. Las columnas `bodega1..3` solo se muestran si el condominio tiene
`capacidadBodegas > 0` (configuración del SUPER_ADMIN).

**Nota de mapeo (modelo V58/V59)**: `est1..3`/`bodega1..3` son **nombres** de estacionamientos/
bodegas declarados (etapas 4-5 del wizard). El importador los resuelve por nombre contra
`GET /estacionamientos`/`GET /bodegas` (o los crea si no existen, con `tipo_unidad` implícito) y
crea el vínculo **unidad→estacionamiento/bodega** con `tipo` derivado del `tipo_vinculo` de la fila
(solo `PROPIETARIO`/`ARRENDATARIO`; si la fila es `RESIDENTE_ADICIONAL`, el vínculo de
estacionamiento/bodega se omite o se usa `ARRENDATARIO` — ver §6.6). **NO se crea vínculo
vehículo→estacionamiento.**

### 4.2 Plantilla de ejemplo (a publicar en `GET .../plantilla`)

```csv
unidad;tipo_unidad;sector;nombre;email;rut;telefono;tipo_vinculo;es_ocupante;recibe_notificaciones;es_responsable;patente1;tipo_vehiculo1;marca1;modelo1;color1;est1;patente2;tipo_vehiculo2;marca2;modelo2;color2;est2;patente3;tipo_vehiculo3;marca3;modelo3;color3;est3;bodega1;bodega2;bodega3
1;CASA;Sector A;Francisca Morales Díaz;francisca.morales@test.com;18.901.234-5;+56978901234;PROPIETARIO;SI;SI;SI;ABCD01;AUTO;Toyota;Corolla;Blanco;E-1;;;;;;;;
1;CASA;Sector A;Camila Reyes Vidal;camila.reyes@test.com;30.123.456-7;+56990123457;RESIDENTE_ADICIONAL;SI;SI;NO;;;;;;;;;;;;
3;CASA;Sector B;Hernán Vargas Soto;hernan.vargas@test.com;19.012.345-6;+56989012345;PROPIETARIO;SI;SI;SI;ABCD02;AUTO;Hyundai;Tucson;Gris;E-3;ABCD03;CAMIONETA;Chevrolet;Colorado;Plateado;E-2;;
6;CASA;Sector B;Roberto Fuentes Mora;roberto.fuentes@test.com;14.567.890-1;+56934567890;PROPIETARIO;SI;SI;SI;ABCD04;AUTO;Mazda;3;Azul;E-6;ABCD05;AUTO;Kia;Cerato;Rojo;E-6;;
```

### 4.3 Formato JSON (entrada manual / wizard)

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

## 5. Endpoints propuestos

### 5.1 `POST /api/v1/condominios/{condominioId}/importaciones/preview`

- **Body:** `multipart/form-data` campo `archivo` (`.csv`/`.xlsx`) **O** `application/json` con
  `{ "filas": [ ... ] }` (mismo esquema de la sección 4.3). Se distingue por `Content-Type`.
- **Permiso:** `IMPORTACION_DATOS`.
- **Comportamiento:** parsea y **valida fila a fila SIN persistir**. Detecta:
  - Columnas del encabezado válidas / faltantes.
  - Errores por fila: email vacío/malformado, unidad vacía, tipo inválido, `tipo_vinculo` inválido,
    `patente` duplicada **dentro del archivo**, `es_ocupante` inválido, **más de un
    `es_responsable=SI` por casa**, etc.
  - Coincidencias con la BD (sin persistir): unidad ya existe, persona ya existe por email,
    vínculo ya existe, patente ya existe, estacionamiento/bodega no encontrado por nombre.
- **Respuesta `200`:** `ImportacionPreviewResponse` (abajo) con `importacionId` (UUID del borrador,
  válido por 30 min) + filas con estado `OK|ERROR|OMITIDA` + errores por fila.
- **No persiste ningún dato real** — solo guarda el borrador del preview.

### 5.2 `POST /api/v1/condominios/{condominioId}/importaciones/{importacionId}/ejecutar`

- **Permiso:** `IMPORTACION_DATOS`.
- **Comportamiento:** aplica en **una transacción** las filas `OK` del preview. Para cada fila:
  1. Dedupe/crear **Sector** (por `(condominio_id, nombre)`).
  2. Dedupe/crear **Unidad** (por `(condominio_id, numero)`; valida `plan.unidadLimit` y
     `capacidadPara(tipo)`).
  3. Dedupe/crear **Persona** (por `email` global; si existe → reutiliza id, no falla).
  4. Crear **Vínculo** persona-unidad (valida 1 PROPIETARIO/ARRENDATARIO activo por unidad;
     si ya existe → marca la fila `OMITIDA`). Guarda `esResponsable` (valida máx 1 por unidad).
  5. Por cada `vehiculos[]`: dedupe/crear **Vehículo** (por `(condominio_id, patente)` mayúscula,
     `unidadId` = la unidad de la fila). Si ya existe → `OMITIDA`.
  6. Por cada `vehiculos[].estacionamiento`: resolver el estacionamiento por nombre (crear si no
     existe) y crear **VinculoEstacionamiento** (unidad→estacionamiento, `tipo` desde `tipo_vinculo`).
  7. Por cada `bodegas[]`: resolver la bodega por nombre (crear si no existe) y crear
     **VinculoBodega** (unidad→bodega, `tipo` desde `tipo_vinculo`).
- **Respuesta `200`:** `ImportacionResultadoResponse` con conteos (abajo).
- Si una fila falla en medio de la transacción, se **marca como ERROR** y la transacción
  **continúa con las demás** (por-fila con try/catch interno, rollback solo de esa fila vía
  `REQUIRES_NEW` o validación completa previa en el preview).

### 5.3 `GET /api/v1/condominios/{condominioId}/importaciones/plantilla`

- Descarga `plantilla.csv` (contenido de la sección 4.2) para que el admin la use de base.
- **Permiso:** `IMPORTACION_DATOS`.

---

## 6. Cambios requeridos en el backend

### 6.1 Dependencias (`pom.xml`)

- `org.apache.commons:commons-csv` (CSV) y `org.apache.poi:poi-ooxml` (XLSX).

### 6.2 Migración `V67__importacion_planilla.sql`

1. **Columna `esResponsable`** en `vinculos_persona_unidad`:
   ```sql
   ALTER TABLE vinculos_persona_unidad ADD COLUMN es_responsable BOOLEAN NOT NULL DEFAULT FALSE;
   ```
2. **Permiso nuevo `IMPORTACION_DATOS`**:
   ```sql
   INSERT INTO permisos (codigo, nombre, descripcion) VALUES
       ('IMPORTACION_DATOS', 'Importar datos', 'Cargar la planilla de integrantes del condominio (preview/ejecutar/plantilla).')
   ON CONFLICT (codigo) DO NOTHING;
   ```
3. **Asignación del permiso** (patrón V66):
   - **Rol `ADMINISTRADOR`** (vía `rol_permisos`).
   - **Cargos `ADMINISTRADOR`, `PRESIDENTE`, `SECRETARIO`** (vía `cargo_permisos`).
   ```sql
   INSERT INTO rol_permisos (rol_id, permiso_id)
   SELECT r.id, p.id FROM roles r
   JOIN permisos p ON p.codigo = 'IMPORTACION_DATOS'
   WHERE r.codigo = 'ADMINISTRADOR'
   ON CONFLICT DO NOTHING;

   INSERT INTO cargo_permisos (cargo, permiso_id)
   SELECT c, id FROM permisos
   CROSS JOIN (VALUES ('ADMINISTRADOR'), ('PRESIDENTE'), ('SECRETARIO')) AS c(cargo)
   WHERE codigo = 'IMPORTACION_DATOS'
   ON CONFLICT DO NOTHING;
   ```
   > **Requisito explícito del frontend**: el permiso debe quedar en el **rol ADMINISTRADOR** y en
   > los **cargos ADMINISTRADOR, PRESIDENTE y SECRETARIO** (los tres cargos que gestionan la
   > planilla). CONSERJE/GUARDIA/RESIDENTE **no** lo reciben.

### 6.3 Entidad borrador

`Importacion` + `ImportacionFila` (o tabla temporal en memoria/Redis) para conservar el preview
entre llamadas (id + contenido parseado + vencimiento 30 min).

### 6.4 `esResponsable` en el modelo de vínculos

- `VinculoPersonaUnidad` += `esResponsable` (Boolean, default false).
- `CrearVinculoRequest` += `esResponsable` (opcional, default false).
- `VinculoResponse` += `esResponsable`.
- **Validación en `VinculoService`**: máx **1 `esResponsable=true` por unidad** (si se crea/actualiza
  un vínculo con `esResponsable=true` y la unidad ya tiene otro activo con ese flag → 409).

### 6.5 `ImportacionService`

- `preview(MultipartFile | List<FilaJson>)` → parsea (CSV/XLSX por extensión o JSON), valida
  encabezados, valida filas (reglas §2.2 + dedupe contra BD sin persistir).
- `ejecutar(UUID importacionId)` → orquesta el orden por FK con dedupe (métodos reutilizados de
  `SectorService`/`UnidadService`/`PersonaCondominioService`/`VinculoService`/`VehiculoService`/
  `EstacionamientoService`/`BodegaService`).
- Expone `obtenerPlantilla()`.

### 6.6 `ImportacionController`

3 rutas (§5). **Límite de filas**: máx `1000` filas por archivo (evita abusos); `400` si supera.

---

## 7. DTOs de respuesta

### 7.1 `ImportacionPreviewResponse`

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
      String estado,            // OK | ERROR | OMITIDA
      String unidad,
      String personaNombre,
      String personaEmail,
      String tipoVinculo,
      List<String> errores) {} // vacío si OK
}
```

### 7.2 `ImportacionResultadoResponse`

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
    int bodegasVinculadas,
    List<ErrorFila> errores) {

  public record ErrorFila(int numeroFila, String mensaje) {}
}
```

### 7.3 Errores de formato

`400` con `ErrorResponse.ofValidation([{field: "archivo", message: "Formato no soportado. Usa .csv o .xlsx"}])`.

---

## 8. Notas para el frontend (consumidor)

- El flujo será: armar planilla (manual o archivo) → `POST preview` → renderizar la tabla con
  estados por fila (igual a la simulación en `ImportacionMasivaView`/`SetupPlanillaView`) → si hay
  filas OK → botón "Importar N filas" → `POST ejecutar` → mostrar resultado.
- **El wizard envía TODAS las filas en una sola petición** (JSON), no una por fila.
- Si `encabezadosFaltantes` no está vacío, mostrar aviso antes de importar.
- Las filas `ERROR` se listan con su número de fila y motivo; no se importan.
- Endpoint de plantilla para el botón "Descargar plantilla".
- El frontend ya implementa el formato persona-por-fila (columnas `patente1..3`/`est1..3`/
  `bodega1..3`, `es_responsable`) en `src/data/planillaColumnas.js`, `usePlanillaDatos.js` y el
  componente `PlanillaDatos.vue`; el botón "Guardar planilla"/"Importar datos" es simulado hasta
  que exista el endpoint.
- El frontend consumirá `preview`/`ejecutar`/`plantilla` vía un nuevo `importacionService.js`
  (`POST /importaciones/preview`, `POST /importaciones/{id}/ejecutar`, `GET /importaciones/plantilla`).