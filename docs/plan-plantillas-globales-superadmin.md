# Plan — Plantillas globales de notificación (SUPER_ADMIN/SOPORTE)

## Estado: PLAN — pendiente de implementación backend

Solicitud backend: `docs/solicitudes-backend/SOLICITUD_PLANTILLAS_GLOBALES_SUPERADMIN.md`

## Alcance

Vista SaaS nueva para que SUPER_ADMIN y SOPORTE gestionen las plantillas GLOBALES de notificación
(`plantillas_notificacion`): listar, editar, desactivar, ver inactivas y reactivar. Incluye filtro
por canal (IN_APP/EMAIL/PUSH) y preview simulado del mensaje en dispositivos.

## Dependencias

- **Backend (bloqueante)**: endpoints `GET/PUT/PATCH /api/v1/admin/plantillas-notificacion[/{codigo}]`,
  permisos `PLANTILLA_NOTIF_VER/GESTIONAR`, campo `canales` en el response, auditoría.
- Sin backend, la vista puede degradar: mostrar solo las activas con `GET` (no existe hoy) → **no
  implementar hasta que el endpoint exista** (patrón de degradación suave solo si hay fallback real).

## Pasos frontend

### 1. Servicio — `src/services/adminService.js`
- `listarPlantillasNotificacion(incluirInactivos = false)` → `GET /admin/plantillas-notificacion` con `{ params: { incluirInactivos } }`.
- `actualizarPlantillaNotificacion(codigo, data)` → `PUT /admin/plantillas-notificacion/${codigo}`.
- `desactivarPlantillaNotificacion(codigo)` → `PATCH /admin/plantillas-notificacion/${codigo}/desactivar`.
- `reactivarPlantillaNotificacion(codigo)` → `PATCH /admin/plantillas-notificacion/${codigo}/reactivar`.

### 2. Vista — `src/views/superadmin/SaasPlantillasView.vue`
Patrón combinado de `SaasPlanesView` + `SaasCondominiosView`:
- Header: título "Plantillas de notificación" + contador + **lupa colapsable** (patrón
  `SaasCondominiosView`/`SaasAuditoriaView`) que alterna la Card de filtros.
- Filtros colapsables: Select de **canal** (IN_APP/EMAIL/PUSH, filtro local sobre `canales`),
  toggle "Ver inactivas" (refetch con `incluirInactivos=true`), botones Buscar/Limpiar.
- Lista de cards por plantilla:
  - `codigo` legible (helper `codigoLabel`), Tag "Global", Tag "Inactivo" (opacity-60) si `!activo`.
  - Tags de canales (`IN_APP`/`EMAIL`/`PUSH`) desde `p.canales`.
  - Botones: Editar (lápiz), Desactivar (si activa), Reactivar (si inactiva, con ConfirmDialog).
- Desactivar/reactivar actualizan el estado local sin refetch (patrón `SaasPlanesView`).

### 3. Diálogo de edición
- Dialog (patrón `PlantillasNotificacionView.vue:125`): campos Título / Plantilla App / Plantilla Email.
- Aviso de variables disponibles: `{{nombre}} {{unidad}} {{condominio}} {{fecha}} {{extra}} {{imagen_url}}`.
- Botón **Preview**: abre Dialog/Drawer con vista simulada por canal:
  - **IN_APP**: card estilo bandeja (título + mensaje interpolado).
  - **PUSH**: banner estilo notificación móvil (título + mensaje).
  - **EMAIL**: bloque estilo correo (asunto + cuerpo).
  - Interpolación local con valores de ejemplo (p.ej. nombre "María", unidad "Casa 12",
    condominio "Condominio Los Robles", fecha "12 ago 2026", extra "Encomienda #123").
- Guardar → `actualizarPlantillaNotificacion`; mostrar `Message` con `e.response?.data?.message` (patrón 409 de `SaasPlanesView`).

### 4. Navegación
- `src/router/index.js`: ruta `superadmin/plantillas` → `SaasPlantillasView`, `meta: { roles: ["SUPER_ADMIN", "SOPORTE"] }`.
- `src/composables/useNavigation.js`: `NAV_ITEMS_BY_ROLE.SUPER_ADMIN` += "Plantillas Notif."
  (`pi pi-envelope`, routeName `SaasPlantillas`); `SOPORTE` += ítem.
- `src/config/navegacionAccesoRapido.js`: `NAV_SUPER_ADMIN` += ítem para la bottom nav PWA.

### 5. Auditoría (frontend)
- `SaasAuditoriaView.vue` `ACCIONES`: agregar `PLANTILLA_EDITAR`, `PLANTILLA_DESACTIVAR`,
  `PLANTILLA_REACTIVAR` con severidades (info/danger/success) para que el filtro las muestre.

## Verificación
- `pnpm build` + `pnpm test`.
- Verificar contra API real una vez implementado el backend (listar con/ sin inactivas, editar,
  desactivar/reactivar, filtro por canal, preview).

## Reuso futuro
- El Dialog de edición + preview se diseñará como componente reutilizable
  (`src/components/plantillas/PlantillaEditorDialog.vue`) para replicarlo luego en la vista por
  condominio (overrides) con el endpoint existente `PlantillaNotificacionController`.