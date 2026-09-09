# Módulo Permisos (feature/p4-permisos-bff)

**Estado:** Integrado con backend real `AdminCargoPermisoController` (V2.1 `a46ada6`, `GET /admin/permisos/catalogo` + `GET/PUT /admin/cargos/{cargo}/permisos`, `ROL_GESTIONAR`). Mock `localStorage` retirado en `2bd8fb9`.

**Rama:** `feature/p4-permisos-bff` (desde `develop` con F1-F4).
**Referencia:** `docs/solicitudes-backend/SOLICITUD_P4_PERMISOS_CARGO_V2.md` (BFF validado), `docs/informes/INFORME_FRONTEND_P4_PERMISOS_CARGO.md` (handoff backend), `docs/informes/ANALISIS_FASES_PENDIENTES_2026-09-08.md`.

## Estructura

```
src/modules/permisos/
├── data/
│   └── catalogo.js          # re-export de src/data/permisosCatalogo.js (single source)
├── services/
│   └── cargoPermisos.service.js  # BFF: mock ahora (lee migraciones), real luego (GET/PUT /admin/cargos/{cargo}/permisos + /admin/permisos/catalogo)
├── composables/
│   └── useCargoPermisos.js  # estado por cargo, validación, diff, guardado
├── components/
│   ├── SelectorCargo.vue    # Select 9 cargos (CargoCondominio enum)
│   └── ListaPermisosPorModulo.vue  # lista agrupada por MODULOS con Checkbox + search
│   └── MatrizPermisos.vue   # (fase 2) tabla 9×70 sticky, para comparación rápida
└── views/
    └── CargosPermisosView.vue  # orquesta el módulo (lista primero, matriz después)
```

## Fases híbridas (acordado)

1. **Lista por cargo** (mobile-first): `Select` cargo arriba → lista agrupada por `MODULOS` (`GESTION`, `ACCESOS`…) con `Checkbox` + `InputText` búsqueda + `Tag` conteo. `Guardar` hace PUT reemplazo total. `MisPermisosView.vue` queda como referencia solo-lectura.
2. **Matriz** (segunda vista, tras afinar): tabla `.planilla` con cargos como columnas, permisos como filas, `Checkbox` por celda + `ConfirmDialog` al guardar.

## Contrato (real)

- `getCatalogo()` → `GET /admin/permisos/catalogo` (~98, sin `modulo`, enriquecido con `permisosCatalogo.js`)
- `getCargoPermisos(cargo)` → `GET /admin/cargos/{cargo}/permisos` (`codigosPermiso` + `permisosDetalle`)
- `putCargoPermisos(cargo, codigos[])` → `PUT /admin/cargos/{cargo}/permisos` `{codigosPermiso}` (reemplazo total, `400 fields`, `cargoPermisoEditado` audit)

## Uso

- `superadmin/permisos/cargos` (`SUPER_ADMIN`, `ROL_GESTIONAR`) — lista por cargo colapsable + búsqueda + `Guardar` (reemplazo total auditado).
- `superadmin/permisos` (matriz) sigue en `EnConstruccionView` hasta V3.
