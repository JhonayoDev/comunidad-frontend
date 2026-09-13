# Planilla wizard: staged editable + view delgado (v2)

> MIGRADO A ISSUE — Project `Gestion Comunidad Briku` `PVT_kwHOBkcviM4Bb6yo`. Continúa `#23` / PR `#24` (`feature/planilla-csv-wizard`).

## Evidencia (verificada 2026-09-13, `vista horizonte` + endpoints en vivo)

- CSV raíz (`plantilla_integrantes.csv`): 477 filas, 204 unidades, 263 patentes/est, 0 est-sin-patente, sin duplicados. Limpio.
- BD: 477 vínculos, 263 veh+vínc, **263 vínc-est** (diff patentes csv↔BD = 0). `E-1/E-5-2/E-104-3` con vínculo real. **Bug 1 = visualización**: `reconstruirFilas` deja `est:""`, la UI muestra vehículos sin est aunque el vínculo existe. Los 35 `E-*/EV-*` sin vínculo son catálogo sin asignar (correcto).
- `importaciones`: re-subidas del mismo archivo → `0 OK / 204 ERROR` (`responsable duplicado`, `vínculo ya existe`). **Bug 2 = flujo**: `POST preview` al seleccionar (borrador TTL 30m) + tabla fiel read-only + `modoReedicion` que bloquea re-subida.
- Endpoints vivos OK: `GET plantilla 200`, `GET unidades 205`, `GET capacidad (limit 9999, uso 503)`, `POST preview` 2 filas → `2 OK`, `POST preview` est-sin-patente → `ERROR patente obligatoria`.
- Cupo: **referencial en esta fase** (`9999` vs `503`). Sin acción de código, solo documentado.

## Principios (Meta)

1. Nada se `POSTea` al seleccionar archivo. Orden: seleccionar → parse local → **editar** → `[Validar]` → preview server → `[Importar]`/`[Descartar]`.
2. `SetupPlanillaView` = orquestador delgado (guardar/validar/importar/descartar/limpiar + matriz de estados). Componentes tontos (`props/emits`, sin `api` directa).
3. `usePlanillaDatos` = único store. Una sola fuente por etapa (`staging` editable, `previewData` server, `filas` manual).

## Fases

### F1 — Staged editable + validación local
- `previewFilasRaw` pasa a `staging` editable con `PlanillaDatos` (modo `staging`, misma tabla fase 5). `previewArchivo` solo se llama al pulsar `[Validar]`.
- `validarFila`: `est` sin `patente` → error local visible antes del server (paridad con `PlanillaParser hayDato` + `validar patente obligatoria`).
- Preview fiel muestra `est` huérfano como warn inline.
- Criterio: subir csv con `est` sin `patente` avisa en local sin ningún `POST`.

### F2 — Split del view
- Extraer: `PlanillaUploader.vue` (dropzone+plantilla+`(i)`), `PlanillaStagedPreview.vue` (resumen+tabla fiel+paginación), `PlanillaPermisoAviso.vue`, `PlanillaResultado.vue`.
- `PlanillaDatos.vue` solo manual/reedición. Lógica de guardado solo en view + composable.
- `ImportacionMasivaView` se alinea al mismo flujo o se declara divergente (no compartir `sessionStorage`).
- Criterio: `SetupPlanillaView.vue` < 250 líneas, cada botón con regla única.

### F3 — Mostrar vínculos reales
- `reconstruirFilas`: resolver `vinculos_estacionamiento` por unidad (`estacionamientosService.vinculos`) y poblar `estacionamiento` en vez de `""`. Catálogo sin uso se etiqueta “sin asignar”.
- Criterio: tras `ejecutar`, la planilla muestra `E-1` en casa 1 sin consultar BD manual.

### F4 — Re-subida + máquina de estados
- Estados: `VACIO → STAGED → VALIDANDO → REVIEW → EJECUTANDO → DONE / REEDICION`. Tabla única de qué botón activo por estado (`Importar` solo en `REVIEW con filasOk>0`, `Re-subir` reemplaza `staging+preview`, `Limpiar todo` resetea las 3 fuentes).
- Re-subir el corregido permitido aunque haya vínculos (`OMITIDA` lo ya creado, ya soportado por backend).
- `ejecutar`+`reconstruir` con progreso (no solo preview); `reconstruirFilas` paginada/lazy (hoy ~408 requests de golpe con 204 unid).
- Criterio: re-subir el mismo csv tras importar muestra `OMITIDA`, no bloqueo.

## No alcance
- Parser `xlsx` en frontend (sigue server; `V69` backend para preview fiel `.xlsx`).
- Enforcement de cupo (referencial).
- Carga global post-setup con auditoría (futuro).

## Referencias
- `src/views/setup/SetupPlanillaView.vue`, `src/components/planilla/PlanillaDatos.vue`, `src/composables/usePlanillaDatos.js`, `src/services/importacionService.js`, `src/data/planillaColumnas.js`, `src/utils/csvParser.js`
- Backend: `ImportacionController.java:41`, `ImportacionService.java:313,335,477`, `PlanillaParser.java:147`, `EstacionamientoController.java:96`
