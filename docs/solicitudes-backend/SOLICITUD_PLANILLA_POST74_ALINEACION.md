# Solicitud BE: planilla post-74 — es_residente, plantilla nuevo orden, sin anidados

> Para aplicar sobre la rama `feature/BE-74-estacionamientos-standalone` antes del merge (el backend en ejecución aún sirve el contrato de 32 cols).
> Nota: el número de versión de migración lo define el equipo backend (aquí no se presume versión).

## Contexto
El condominio real trabaja con un CSV de 477 filas ya migrado al nuevo patrón: cada casa declara 0..3 estacionamientos standalone (`estacionamiento1..3`), algunas casas tienen 2 comprados y otras ninguno. El header del archivo del usuario es:

`unidad,tipo_unidad,sector,nombre,email,rut,telefono,tipo_vinculo,es_residente,recibe_notificaciones,es_responsable,estacionamiento1,estacionamiento2,estacionamiento3,patente1,tipo_vehiculo1,marca1,modelo1,color1,patente2,...,est2,patente3,...,est3,bodega1,bodega2,bodega3`

(detección `;`/`,` ya existe en ambos parsers; no se pide cambio ahí).

## Solicitud
1. **Header `es_residente`**: aceptarlo como canónico (hoy solo `es_ocupante`). Aceptar **ambos** durante la transición (preferir `es_residente`, fallback `es_ocupante`) para no romper archivos viejos. El campo interno `esOcupante` no cambia (sin migración). Ajustar mensajes de validación (`es_ocupante inválido` → `es_residente inválido`).
2. **Plantilla regenerada con el nuevo patrón**: mismo orden del archivo del usuario (standalone tras `es_responsable`, grupos de vehículo sin `est` anidado), **delimitador `;` + BOM UTF-8** (lo más compatible con Windows + Office en español: con `,` el Excel-ES abre todo en una columna). Filas de ejemplo: una con vehículo+est standalone y una sin vehículo con `estacionamiento1`.
3. **Sacar `est1..3` de la plantilla** (ya van vacíos en las 477 filas reales). El parser los **sigue aceptando** por compatibilidad con archivos viejos + `ERROR patente obligatoria` intacto.
4. Nada más: `estacionamiento1..3` al final de `ENCABEZADOS` (BE-74) se mantiene — el orden del header no afecta al parseo (mapa por nombre), solo a la plantilla.

## Criterio aceptación
- `POST preview` con header `es_residente` (sin `es_ocupante`) respeta los valores SI/NO por fila.
- `POST preview` con header viejo `es_ocupante` sigue funcionando igual.
- `GET plantilla` devuelve 32 cols en el nuevo orden, con `;` y BOM, sin `est1..3`.
- Suite importación en verde.

## Frontend (en este mismo pase)
- `es_ocupante` → `es_residente` como clave canónica (CSV + UI); orden de columnas = patrón del usuario; `Estacionamientos` tras `Resp.` en las 3 tablas.
