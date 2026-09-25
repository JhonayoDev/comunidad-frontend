> MIGRADO A ISSUE — JhonayoDev/briku#79 — Project "Gestion Comunidad Briku"

## BE-4: Advertencias en validar() — persona reutilizada con datos distintos

### Contexto
Hoy `aplicarFila():278` hace `personasReutilizadas++` sin comparar datos.
El administrador no sabe que nombre/teléfono del archivo fue ignorado.
Las advertencias deben aparecer en el preview (antes de ejecutar),
no en el resultado final, para que el usuario pueda corregir el archivo.

Depende de: ninguna (independiente, pero coordinada con FE-1)

### Cambios requeridos

**FilaImportacion.java (record)** — agregar campo nullable:
```java
List<String> advertencias; // null = sin advertencias
```

> Notas de revisión (verificado contra el código, backend decide forma final):
> 1. `FilaImportacion` es un `record` **inmutable**: no existe `setAdvertencias`.
>    Opciones: (a) reconstruir el record con advertencias en `validar()`,
>    o (b) llevar `warnings` en el record interno `FilaValidada` y serializarlo
>    junto a `datos`/`errores` en `ImportacionFila`.
> 2. `ImportacionPreviewResponse.FilaPreview` hoy **NO** tiene `advertencias[]`
>    (campos actuales: `numeroFila, estado, unidad, personaNombre, personaEmail,
>    tipoVinculo, errores, vehiculos, estacionamientos, bodegas`) — hay que
>    agregarlo como campo nullable (no breaking: el frontend ignora extras).
> 3. El mapa del contexto se llama **`ctx.personas`** (`Map<String, Persona>`,
>    `construirContexto:630-638` vía `findByEmailIn`), no `ctx.personasBD`.
>    La entidad completa (`nombre/rut/telefono`) ya está disponible, sin cambio.
> 4. Deserialización de borradores viejos: `MAPPER` es `JsonMapper` con defaults
>    (falla ante propiedad desconocida) — agregar
>    `@JsonIgnoreProperties(ignoreUnknown=true)` al record o guards null
>    (precedente BE-74 en `estacionamientosDe/vehiculosDe/bodegasDe`).
> 5. Las warnings viajan dentro del JSON de `ImportacionFila.datos`, por lo que
>    quedan incluidas en el `resultado_json`/CSV cuando existan (BE-2/BE-3).

**ImportacionService.java — validar()**

En la rama donde la persona ya existe:
```java
Persona bd = ctx.personas.get(email); // ya disponible, sin cambio en contexto
List<String> adv = new ArrayList<>();
if (bd != null) {
    if (!Objects.equals(normalizar(fila.nombre()), normalizar(bd.getNombre())))
        adv.add("nombre ignorado (BD: \"" + bd.getNombre() + "\")");
    if (!Objects.equals(normalizar(fila.telefono()), normalizar(bd.getTelefono())))
        adv.add("teléfono ignorado (BD: " + bd.getTelefono() + ")");
}
// Estado sigue siendo OK — la advertencia no bloquea
```

Función `normalizar()`: trim + lowercase + null-safe.
No comparar RUT — ya se valida solo para personas nuevas y es inmutable.

### Criterio de aceptación
- [ ] Preview incluye `advertencias[]` en filas con divergencia
- [ ] Estado de fila sigue siendo OK (no ERROR ni ADVERTENCIA como estado)
- [ ] Borradores viejos (sin campo advertencias) no rompen deserialización
- [ ] Test: fila con email existente + nombre distinto → OK + advertencia
- [ ] Test: fila con email existente + datos iguales → OK sin advertencia

### Trazabilidad
- Parent spec: `docs/solicitudes-backend/SOLICITUD_HISTORIAL_IMPORTACION_RESULTADO.md` (BE-4)
- Coordina con: FE-1 (chip ADVERTENCIA en frontend)
