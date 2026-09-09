# Módulo Permisos — BFF (feature/p4-permisos-bff)

**Enfoque:** Back-for-Frontend iterativo. Construimos el módulo frontend con `permisosCatalogo.js` real (V2→V39, 70 códigos) y mocks de `cargo_permisos` derivados de las migraciones backend (V12/V20/V39/V62/V72). Una vez afinada la UX (lista por cargo → matriz), elaboramos la solicitud backend con los endpoints exactos que el módulo necesita — sin pedir de más.

**Rama:** `feature/p4-permisos-bff` (desde `develop` con F1-F4).
**Referencia:** `docs/solicitudes-backend/SOLICITUD_ADMIN_PERMISOS_POR_CARGO.md` (pendiente), `docs/informes/ANALISIS_FASES_PENDIENTES_2026-09-08.md`.

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

## Contrato BFF provisional (mock)

- `getCatalogo()` → `PERMISOS` de `permisosCatalogo.js`
- `getCargoPermisos(cargo)` → `Set` derivado de seeds `cargo_permisos` (V12 etc.) — se guarda en `localStorage` `bff:cargo-permisos` para iterar sin backend
- `putCargoPermisos(cargo, codigos[])` → valida contra `PERMISOS`, audita en `console.info`, persiste en `localStorage`

Cuando el backend implemente `GET /admin/permisos/catalogo` y `GET/PUT /admin/cargos/{cargo}/permisos` (`ROL_GESTIONAR`), el service cambia a `api.get/put` sin tocar componentes.

## Cómo iterar

1. Abrir `src/modules/permisos/views/CargosPermisosView.vue` en `superadmin/permisos/cargos` (temporal, `SUPER_ADMIN`).
2. Probar con 2-3 cargos (ADMINISTRADOR, PRESIDENTE, GUARDIA) y ajustar agrupación/búsqueda.
3. Una vez UX afinada, generar `SOLICITUD_P4_V2.md` con los endpoints exactos validados contra el módulo.
