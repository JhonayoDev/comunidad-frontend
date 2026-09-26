> MIGRADO A ISSUE — JhonayoDev/briku#85 — Project "Gestion Comunidad Briku"

## BE-8: Reutilizar nombres de espacios tras desactivar (dedupe solo activos)

### Contexto
`EspacioComunService.crear()` usa `existsByCondominioIdAndNombre` (sin filtro
de activo ni ignore-case) mientras `listar` solo muestra activos
(`findActivasConSectorByCondominioId`). Efecto medido en QA frontend: se
desactiva un espacio y al recrearlo da 400 sin forma de verlo ni reactivarlo
(nombres muertos). Mismo bug que accesos pre-BE-7 (briku#83) — mismo patrón.

### Principio
Un soft-delete debe liberar la clave única (ver briku#83). No mostrar
eliminados para reactivar: permitir recrear, la fila vieja queda como historial.

### Cambios requeridos
1. `EspacioComunRepository`: `existsByCondominioIdAndNombreIgnoreCaseAndActivoTrue`
   (reemplaza en `crear`; case-insensitive como el resto de catálogos).
2. Migración Flyway: índice único parcial `WHERE activo` sobre
   `(condominio_id, LOWER(nombre))` (precedentes V63/V65/BE-7 V77) contra carreras.
3. Sin cambio en `PUT`/`DELETE`/`GET` ni en permisos. Sin saneamiento previo
   si el índice global actual ya impide duplicados (verificar en la migración).

### Criterio de aceptación
- [ ] Crear → eliminar → recrear mismo nombre (incluso distinto case) → 201
- [ ] Crear con nombre de otro ACTIVO (ignore-case) → 400 con mensaje
- [ ] Test de índice parcial a nivel repositorio (activo+inactivo coexisten,
      segundo activo lanza DataIntegrityViolationException)
- [ ] Frontend sin cambios (ya mapea el 400 a la fila)

### Trazabilidad
- Precedentes: briku#83/V77 (accesos), V63 (unidades), V65 (sectores) ·
  QA frontend: issue #34 · Nota: `listar` ya expone vínculos activos por
  espacio (`findActivosByCondominioId`), útil si a futuro se muestra el estado
