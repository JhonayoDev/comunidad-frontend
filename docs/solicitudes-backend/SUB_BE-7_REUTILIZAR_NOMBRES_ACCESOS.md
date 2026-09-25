> MIGRADO A ISSUE — JhonayoDev/briku#83 — Project "Gestion Comunidad Briku"

## BE-7: Reutilizar nombres de accesos tras desactivar (dedupe solo activos)

### Contexto
`CondominioAccesoService.crear()` usa `existsByCondominioIdAndNombreIgnoreCase`
(sin filtro de activo) mientras `actualizar`/`listar` ya operan solo sobre
activos. Efecto medido en QA: se desactiva "acceso eliminar" y al recrearlo
da 400 "Ya existe..." sin forma de verlo ni reactivarlo (nombres muertos).
Mismo bug que Sectores/Pisos pre-V63/V65 — aplicar el mismo patrón probado.

### Principio (criterio tipo Meta)
Un soft-delete debe liberar la clave única; si no, el borrado es ficticio y
los nombres se fugan. No mostrar soft-deleted para reactivar (ruido): permitir
recrear, la fila vieja queda como auditoría.

### Cambios requeridos
1. `CondominioAccesoRepository`: `existsByCondominioIdAndNombreIgnoreCaseAndActivoTrue`
   (reemplaza el actual en `crear`; `actualizar` ya filtra activos, sin cambio).
2. Migración Flyway: índice único parcial `WHERE activo`
   (precedente `uq_sector_cond_nombre_activo`, V65) para blindar concurrencia:
   dos POST simultáneos con el mismo nombre no deben duplicar.
3. Sin cambio en `PUT`/`DELETE`/`GET` ni en permisos.

### Fuera de alcance (decidido)
Auto-reactivar al crear con nombre de inactivo: se descarta por consistencia
con Sectores/Pisos (recrear deja ambas filas, la vieja como historial).

### Criterio de aceptación
- [ ] Crear → eliminar → recrear mismo nombre → 201
- [ ] Crear con nombre de otro ACTIVO → 400 con mensaje
- [ ] Test de concurrencia o índice parcial que lo impida
- [ ] Frontend sin cambios (ya mapea el 400 a la fila; tras el fix recrear funciona)

### Trazabilidad
- Precedentes: V63 (reutilizar números unidades), V65 (reutilizar nombres
  sectores) · QA frontend: issue #33 · Frontend ya verifica el flujo en
  `useSetupAccesos.test.js` (400 mapeado a fila)
