> MIGRADO A ISSUE — JhonayoDev/briku#77 — Project "Gestion Comunidad Briku"

## BE-2: Persistir resultado en ejecutar (no borrar borrador)

### Contexto
`ejecutar():217` hace `importacionRepository.delete(importacion)`.
Después de esta tarea, en vez de borrar, debe marcar COMPLETADA
y guardar el resultado serializado.

Depende de: BE-1

### Cambios requeridos

**ImportacionService.java**

1. `previewDesde()` — sin cambio de estado (queda PENDIENTE por default)

2. `ejecutar()` — reemplazar el delete final:
```java
// ANTES (línea ~217):
importacionRepository.delete(importacion);

// DESPUÉS:
importacion.setEstado("COMPLETADA");
importacion.setResultadoJson(serializar(response)); // helper existente con try/catch
importacionRepository.save(importacion);
```

3. `ejecutar():176` — el chequeo de expiración debe excluir COMPLETADAS:
```java
// ANTES:
if (importacion.getExpiraEn().isBefore(LocalDateTime.now()))

// DESPUÉS:
if (!"COMPLETADA".equals(importacion.getEstado())
    && importacion.getExpiraEn().isBefore(LocalDateTime.now()))
```

4. `previewDesde():129` — la purga lazy solo debe borrar PENDIENTE:
```java
// ANTES:
importacionRepository.deleteByCondominioIdAndExpiraEnBefore(...)

// DESPUÉS (nuevo método en repo):
importacionRepository
  .deleteByCondominioIdAndEstadoAndExpiraEnBefore(cid, "PENDIENTE", now)
```

5. Segunda ejecución del mismo `importacionId` — cambiar 404 a 409:
```java
if ("COMPLETADA".equals(importacion.getEstado())) {
    throw new IllegalStateException("La importación ya fue ejecutada: " + importacionId);
    // mapear a 409 (o excepción dedicada a criterio backend)
}
```

> Notas de revisión (pseudocódigo orientativo, backend decide):
> - El servicio usa `LocalDateTime.now()`, no `Instant.now()`.
> - `MAPPER.writeValueAsString` lanza checked exception: reusar el helper `serializar()` privado existente.
> - No existe `ImportacionYaEjecutadaException`: crearla o reusar `IllegalStateException` según el mapeo de errores del proyecto.

**ImportacionRepository.java**
- Agregar `deleteByCondominioIdAndEstadoAndExpiraEnBefore`
- Agregar `findByIdAndCondominioIdAndEstado` (para el GET de resultado)

### TTL de historial
- PENDIENTE: 30 min (sin cambio)
- COMPLETADA: 7 días (agregar `expiraHistorialEn` o reusar `expiraEn`
  seteándolo a `now + 7d` en el save de COMPLETADA)

### Criterio de aceptación
- [ ] Ejecutar marca COMPLETADA, no borra
- [ ] Segunda llamada al mismo id devuelve 409
- [ ] Preview nuevo sigue purgando solo PENDIENTE expiradas
- [ ] COMPLETADA con más de 7 días se purga en el siguiente preview
- [ ] Test: `ejecutar_persisteResultado()`, `ejecutar_segundaLlamada_409()`

### Trazabilidad
- Parent spec: `docs/solicitudes-backend/SOLICITUD_HISTORIAL_IMPORTACION_RESULTADO.md` (BE-2)
- Previo: BE-1 · Siguiente: BE-3 (GET resultado + CSV)
