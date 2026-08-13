# Solicitud Backend — Plantillas globales de notificación (SUPER_ADMIN/SOPORTE)

## Estado: PENDIENTE (backend)

## Objetivo

Las plantillas globales (`plantillas_notificacion`) son la base que todos los condominios usan
para sus notificaciones (los condominios pueden sobrescribirlas vía `plantillas_notificacion_condominio`).
Hoy solo se pueden modificar por SQL/migración. Se necesita que **SUPER_ADMIN y SOPORTE** puedan
listarlas, editarlas, desactivarlas, ver las desactivadas y reactivarlas desde el panel SaaS.

## Problema actual

- `PlantillaNotificacionRepository` solo expone `findByActivoTrueOrderByCodigoAsc()` — no hay forma
  de listar inactivas.
- No existe ningún controller admin para `plantillas_notificacion` (solo el per-condominio
  `PlantillaNotificacionController` con `CONDOMINIO_EDITAR`).
- La entidad `PlantillaNotificacion` tiene `actualizarContenido()` y `desactivar()`, pero **no tiene
  `reactivar()`**.
- No existen permisos para plantillas de notificación (solo `PLANTILLA_GASTO_VER/GESTIONAR`).

## Cambios solicitados

### 1. Permisos nuevos (migración Flyway)

- `PLANTILLA_NOTIF_VER` — "Ver plantillas de notificación".
- `PLANTILLA_NOTIF_GESTIONAR` — "Gestionar plantillas de notificación".
- Asignados a **SUPER_ADMIN y SOPORTE** (ambos gestionan igual; no es solo lectura para SOPORTE).

### 2. Endpoints — `AdminPlantillaNotificacionController`

Ruta base: `/api/v1/admin/plantillas-notificacion`
Clase: `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SOPORTE')")`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/api/v1/admin/plantillas-notificacion` | `PLANTILLA_NOTIF_VER` | Lista plantillas. Query param `?incluirInactivos=true` (default `false`). |
| PUT | `/api/v1/admin/plantillas-notificacion/{codigo}` | `PLANTILLA_NOTIF_GESTIONAR` | Edita `tituloPlantilla/enAppPlantilla/emailPlantilla`. Body `GuardarPlantillaRequest` (reusar). 404 si el código no existe. |
| PATCH | `/api/v1/admin/plantillas-notificacion/{codigo}/desactivar` | `PLANTILLA_NOTIF_GESTIONAR` | Setea `activo=false`. |
| PATCH | `/api/v1/admin/plantillas-notificacion/{codigo}/reactivar` | `PLANTILLA_NOTIF_GESTIONAR` | Setea `activo=true`. |

### 3. DTO de respuesta

`PlantillaNotificacionAdminResponse`:
- `codigo` (String)
- `tituloPlantilla` (String)
- `enAppPlantilla` (String)
- `emailPlantilla` (String, nullable)
- `activo` (boolean)
- `canales` (Set<CanalEntrega>) — **derivado** de la regla global del tipo
  (`CatalogoReglasNotificacion.obtener(TipoNotificacion.valueOf(codigo)).canales()`), NO almacenado.
  Permite al frontend filtrar por canal (IN_APP/EMAIL/PUSH) sin duplicar datos.

### 4. Cambios en entidad/repositorio

- `PlantillaNotificacion`: agregar método `reactivar()` (setea `activo=true`).
- `PlantillaNotificacionRepository`: agregar `findAllByOrderByCodigoAsc()` (o `findByActivoTrueOrderByCodigoAsc` + variante con inactivos).

### 5. Auditoría

Registrar en `AuditoriaService` (patrón `planEditado/planReactivado`):
- `PLANTILLA_EDITAR` — al editar contenido.
- `PLANTILLA_DESACTIVAR` — al desactivar.
- `PLANTILLA_REACTIVAR` — al reactivar.
- `recursoTipo: "PlantillaNotificacion"`, `recursoId: codigo`, `condominioId: null` (global).

## Notas

- El preview de cómo se vería el mensaje en los dispositivos de los destinatarios es **100% frontend**
  (interpolación local de `{{nombre}} {{unidad}} {{condominio}} {{fecha}} {{extra}} {{imagen_url}}`
  con valores de ejemplo). No requiere endpoint.
- El filtrado por canal se hace en el frontend usando el campo `canales` del response.
- No se crean plantillas nuevas desde el panel (los códigos son fijos por `TipoNotificacion`).