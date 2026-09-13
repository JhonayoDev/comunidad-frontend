# Solicitud BE: estacionamientos standalone en planilla

> Estado: PENDIENTE BACKEND. Frontend bloqueado hasta el contrato (el JSON/CSV actual no puede expresar est sin vehículo).
> Nota: el número de versión de migración lo define el equipo backend (aquí no se presume versión).

## Problema (evidencia real)
- `VinculoEstacionamiento.java` **no tiene FK a vehículo**: el vínculo es `estacionamiento ↔ unidad` (`estacionamiento_id`, `condominio_id`, `unidad_id`, `tipo`). Igual que `VinculoBodega` (unidad↔bodega).
- Pero la planilla anida `est1..3` **dentro del grupo del vehículo** (`patente1..est1`, `PlanillaParser.java:147` `hayDato(...)` + `ImportacionService.java:477` `ERROR "patente obligatoria"`). Un `est` sin `patente` = fila con error, no se vincula.
- Consecuencia en campo (`plantilla_integrantes.csv`, 477 filas): 25 casas sin auto real (2, 4, 8, 11, 17…) debieron **inventar un vehículo falso** (`EA0002/AUTO/Genérico/Std/Blanco`) solo para declarar su `E-2`. Si se importa así, se contaminan `vehiculos` + `vinculos_vehiculo` con 25 autos fantasmas. **No importar ese archivo hasta V70.**
- Las `bodegas` (`bodega1..3`) ya son standalone: el precedente existe.

## Solicitud
1. Nuevas columnas standalone `estacionamiento1..3` (nombre exacto a definir por BE, p.ej. `estacionamiento1`) en `PlanillaParser.ENCABEZADOS` + plantilla.
2. `FilaImportacion`: nuevo campo `List<String> estacionamientos` (igual que `bodegas`).
3. `ImportacionJsonRequest`: mismo campo para la vía JSON del wizard.
4. `aplicarFila`: vincular `estacionamientos[]` como unidad↔est (reusar `resolverEstacionamiento`), con la misma regla actual (solo titulares `PROPIETARIO/ARRENDATARIO` vinculan recursos; `RESIDENTE_ADICIONAL` no).
5. `FilaPreview`: incluir `vehiculos`/`estacionamientos`/`bodegas` (ya pedido en `SOLICITUD_PREVIEW_FIEL_IMPORTACION`) para preview fiel.
6. Compatibilidad: `est1..3` anidados siguen funcionando cuando hay `patente` (muestran el est junto al vehículo); si la misma fila trae standalone + anidado con distinto nombre, gana el standalone (a definir por BE).

## Criterio aceptación
- `POST preview` con fila `PROPIETARIO` sin vehículos y `estacionamiento1: E-2` → `OK` (hoy `ERROR`).
- `ejecutar` crea `VinculoEstacionamiento(E-2 ↔ unidad)` sin crear ningún `Vehiculo`.
- `POST preview` con `est` sin `patente` en grupo vehículo → mantiene `ERROR patente obligatoria` (o se depreca según decida BE).

## Frontend (cuando exista el contrato)
- `planillaColumnas.js`: columnas `estacionamiento1..3` standalone + `filaAPayload.estacionamientos[]`.
- Tablas (staging/review/manual): columna propia “Estacionamientos” (igual que Bodegas), separada de Vehículos.
- Migración del csv: mover `E-2` de `est1`+falso `EA0002` a `estacionamiento1` y eliminar los 25 vehículos `Genérico`.

## Referencias
- `VinculoEstacionamiento.java` (sin FK vehículo) vs `PlanillaParser.java:138-150`, `ImportacionService.java:312-352,474-487`
- Frontend: `planillaColumnas.js:83` (`if (!patente) continue`), `usePlanillaDatos.js` validación est-sin-patente
