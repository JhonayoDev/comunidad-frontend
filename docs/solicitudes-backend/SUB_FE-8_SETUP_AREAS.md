> MIGRADO A ISSUE — JhonayoDev/comunidad-frontend#34 — Project "Gestion Comunidad Briku"

## Wizard paso Áreas comunes y visitas (espejo catálogos + EV)

### Contexto
Ruta `setup/areas-comunes` en placeholder. Backend completo SIN batch:
`GET|POST /espacios-comunes`, `PUT|DELETE(soft)/{id}` (nombre≤60, tipo 6
valores, piso Integer, sectorId opcional), `POST /{id}/vinculos`
(PROPIETARIO/ARRENDATARIO, unidadId, fechaInicio) + desactivar. Permisos
`UNIDAD_*` (cargo ADMINISTRADOR los tiene: sin 403 esperado, igual con
degradación). EV- (visitas) ya tienen piso/sector editables; solo hay que
exponerlos. Unidad CONDOMINIO: se usa su id por dentro (vinculación), sin
mostrarla (decisión vigente).

### Decisiones de UX (con el usuario)
- Message acotado y accionable: pendiente asignar representante legal
  (vínculo PROPIETARIO a unidad CONDOMINIO desde Residentes, fuera del paso).
- Completado tras el **primer guardado persistido** (flag por condominio en
  `localStorage` + conteo ≥1 espacio como respaldo). Sin datos y sin guardar:
  pendiente. 403/error: no bloquea (aviso en vista).
- Cierre también vía EV: un solo Guardar cubre ambas cards; tras guardar se
  puede Continuar sin agregar más espacios (reedición sigue disponible).

### Cambios
- **FE-1**: `espaciosService.js` nuevo (listar/crear/actualizar/desactivar/
  vinculos/vincular/desvincular). EV vía `estacionamientosService` existente.
- **FE-2**: `SetupAreasComunesView.vue` (ruta `setup/areas-comunes`) —
  Card 1 Espacios (tabla editable espejo: Nombre/Tipo/Piso/Sector + checkbox
  "Del condominio" default checked, vincula PROPIETARIO→CONDOMINIO con fecha
  de hoy) + Card 2 Visitas (lista EV- con Piso/Sector inline) + un Guardar
  para ambas + `ConfirmDialog` + resultado. `useSetupAreasComunes.js` con
  catálogos sectores/pisos (tolerancia 403), borrador sessionStorage,
  degradación.
- **FE-3**: `useSetupConfiguracion`: `totalEspacios` en `cargar()` (403→null) +
  mecanismo genérico `marcarPasoGuardado(key)` (localStorage, reactivo,
  reutilizable); `pasoCompletado("areas-comunes")` = guardado || conteo>0.
- **FE-4**: tests espejo + QA vivo + build.

### Fuera de alcance
Mantenciones, costos/ingresos, reservas (módulos futuros); representante
legal (Residentes); mostrar unidad CONDOMINIO.

### Criterio de aceptación
- [ ] CRUD espacios + vincular/desvincular condominio con fecha de hoy
- [ ] EV- con piso/sector guardados (PUT individual, sin tocar casas)
- [ ] Primer Guardar persistido → paso completado y Continuar avanza
- [ ] Recarga mantiene completado (flag); reedición disponible
- [ ] Tests + suite verde + build OK

### Trazabilidad
- Backend: `EspacioComunController`/`EspacioComunService`
  (`TipoEspacioComun` 6 valores, `TipoVinculoEspacioComun`
  PROPIETARIO/ARRENDATARIO) · Patrón: Pisos/Accesos + V66 (pisos),
  FE-6 (override edición) · Rama: `feature/setup-areas-comunes`
