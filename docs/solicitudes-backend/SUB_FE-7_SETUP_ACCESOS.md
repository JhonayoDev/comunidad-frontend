> MIGRADO A ISSUE — JhonayoDev/comunidad-frontend#33 — Project "Gestion Comunidad Briku"

## Wizard paso Accesos: puntos de recepción de encomiendas (espejo Sectores/Pisos)

### Contexto
`condominio_accesos` = puntos de recepción de encomiendas (`nombre` máx 25 +
`activo`), no portones. Backend CRUD completo SIN batch:
`GET|POST /condominios/{cid}/encomiendas/accesos`, `PUT|DELETE /{id}`
(DELETE = soft). Frontend solo lee (`getAccesosEncomiendas` en 2 formularios);
ruta `setup/accesos` es placeholder. Paso `accesos` en `SETUP_PASOS`
(siempre visible, entre planilla y áreas-comunes).

### Etapa 0 verificada (sin código)
- Permisos: `ENCOMIENDA_VER` (lista) + `ENCOMIENDA_CONFIGURAR` (crear/editar/
  eliminar) — rol ADMINISTRADOR y cargos PRESIDENTE/SECRETARIO (V36). Cargo
  ADMINISTRADOR residente NO lo tiene → degradación 403 como Sectores, sin
  issue BE (por diseño).
- Dup de nombre → `IllegalArgumentException` → **400** (no 409): mapear mensaje
  a la fila igual que Sectores.
- `pasoCompletado`: catálogo opcional → espejo Pisos (`unidades > 0`).
  Pendiente diferido: si registrar encomienda exige `accesoId` (revisión
  módulo encomiendas).

### Cambios (FE espejo Sectores/Pisos)
- **FE-1**: `encomiendasService.js` += `crearAcceso`/`actualizarAcceso`/
  `eliminarAcceso` (junto a `getAccesosEncomiendas` existente).
- **FE-2**: `useSetupAccesos.js` (nuevo): lista orden backend, CRUD modo
  edición (Editar/Listo/Cancelar + snapshot, +Agregar fila, papelera con
  "Eliminado"), `guardar()` = POST nuevas + PUT editadas + DELETE
  eliminadas (una falla no aborta, 400 mapeado a la fila), borrador
  sessionStorage, degradación 403 con aviso. + `useSetupAccesos.test.js`.
- **FE-3**: `SetupAccesosView.vue` (nueva, ruta `setup/accesos`): tabla
  `.planilla` desktop + cards mobile, nombre max 25, `ConfirmDialog` antes
  de marcar, Tag "No eliminado" + reversión si falla.
- **FE-4**: `useSetupConfiguracion.js`: `pasoCompletado("accesos")` =
  `unidades > 0`; `cargar()` cuenta vía `getAccesosEncomiendas` (degradación
  403 → aviso, vista vacía).

### Criterio de aceptación
- [ ] CRUD completo en la vista con 400 de duplicado mapeado a la fila
- [ ] Sin `ENCOMIENDA_CONFIGURAR` (403): aviso + vista vacía, sin romper
- [ ] Paso marca completado con unidades; progreso del wizard avanza
- [ ] Tests espejo (8/8 estilo Sectores) + suite verde + build OK

### Trazabilidad
- Backend: `AccesoCondominioController` + `CondominioAccesoService`
  (`condominio_accesos`, V36) · Patrón: `SetupSectoresView`/`useSetupSectores`
- Rama: `feature/setup-accesos`
