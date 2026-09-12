# Solicitud BE: Preview fiel con datos completos (V69)

> Para que el preview de planilla sea 100% fiel (tipo unidades fase 5 / meta) también para .xlsx

## Contexto
Frontend en `feature/planilla-csv-wizard` ya hace preview fiel para **.csv** parseando localmente 31 cols (`usePlanillaDatos.previewFilasRaw` via `csvParser`) y cruzando con `ImportacionPreviewResponse.filas[].estado/errores` para renderizar tabla `.planilla` de 15 cols (Casa/Tipo/Sector/Nombre/Email/RUT/Tel/Vínculo/Ocup/Notif/Resp/Vehículos/Bodegas/Estado) — mismo patrón que `SetupUnidadesView fase 5` y `PlanillaDatos.vue:338` (desktop Excel).

Para **.xlsx** el frontend no tiene parser (no se añadió `xlsx` lib para no inflar bundle) y el backend `ImportacionPreviewResponse.FilaPreview` actual solo devuelve 6 campos (`numeroFila,estado,unidad,personaNombre,personaEmail,tipoVinculo` + `errores`). El preview queda acotado (fallback 6 cols) hasta que el backend devuelva el detalle completo.

## Solicitud
Extender `ImportacionPreviewResponse.java:15` `FilaPreview` para incluir todos los campos de `FilaImportacion` necesarios para preview fiel:

```java
public record FilaPreview(
  int numeroFila,
  String estado,
  String unidad, String tipoUnidad, String sector,
  String personaNombre, String personaEmail, String rut, String telefono,
  String tipoVinculo, String esOcupante, String recibeNotificaciones, String esResponsable,
  List<VehiculoFila> vehiculos, // patente,tipo,marca,modelo,color,estacionamiento
  List<String> bodegas,
  List<String> errores) {}
```

Y mapear en `ImportacionService.java:151` `preview` desde `v.fila().*` (ya serializado en `ImportacionFila.datos`).

Mantener compatibilidad: frontend ya soporta tanto formato acotado (fallback) como fiel (cuando `FilaPreview` traiga campos extra, `hasPreviewFiel` pasará a usar directo backend sin parse local).

## Criterio aceptación
* `POST /condominios/{cid}/importaciones/preview` con .xlsx → response `filas[].vehiculos/bodegas/rut/telefono/...` presentes, preview fiel 15 cols sin parse local.
* .csv sigue igual (frontend ya fiel via parse local; con backend fiel ambos coinciden).

## Frontend
* `src/composables/usePlanillaDatos.js:previewFilasRaw` + `src/views/setup/SetupPlanillaView.vue:hasPreviewFiel` ya muestran tabla fiel cuando hay datos completos; con backend V69 se podrá eliminar el parse local y usar solo backend.
* `src/theme/app.css:164` `.preview-*` reutilizable sutil sobre `surface`.

## Referencias
* `src/views/setup/SetupUnidadesView.vue:789` preview fase 5 (tabla fiel)
* `docs/guias/tabla-planilla-responsive.md`
