# Acceso de Servicios Generales del Condominio

## Problema identificado

Actualmente el backend exige una `unidadId` obligatoria (`@NotNull`) tanto en
`RegistrarIngresoRequest` como en `CrearAutorizacionRequest`, y la entidad
`RegistroAcceso` tiene `unidad_id` con `nullable = false` en BD.

Esto implica que **todo acceso debe estar asociado a una unidad específica**,
lo cual no cubre los siguientes casos de uso reales:

## Casos de uso no soportados

### 1. Servicios generales del condominio

Personal que ingresa a realizar labores que benefician a todo el condominio
y no a una unidad en particular:

| Caso | Tipo | Descripción |
|------|------|-------------|
| Jardinero | SERVICIO | Mantención de áreas verdes comunes |
| Empresa de aseo | SERVICIO | Limpieza de pasillos, ascensores, lobby |
| Lectura de medidores | SERVICIO | Luz, agua, gas — toma de consumo general |
| Empresa de fumigación | SERVICIO | Control de plagas en áreas comunes |
| Inspección municipal | SERVICIO | Revisión de instalaciones generales |
| Técnico de ascensor | TECNICO | Mantención/reparación de ascensor |
| Técnico de portón | TECNICO | Reparación de portón de acceso general |
| Pintor de fachada | SERVICIO | Pintura de exteriores del condominio |
| Instalador de cámaras | TECNICO | Cámaras de seguridad en pasillos/accesos |

### 2. Múltiples unidades en una misma visita

Personal que necesita acceder a varias unidades en una misma visita:

| Caso | Tipo | Descripción |
|------|------|-------------|
| Técnico de internet | TECNICO | Revisa instalación en Depto 101 y 102 |
| Repartidor de merchandising | DELIVERY | Entrega en múltiples casas |
| Encuestador | VISITA | Aplica encuestas puerta a puerta |

### 3. Servicios recurrentes sin unidad fija

| Caso | Tipo | Descripción |
|------|------|-------------|
| Proveedor de agua | DELIVERY | Reparte a distintas casas cada vez |
| Gasfiter del condominio | TECNICO | Asignado según necesidad del día |

## Solución actual (workaround)

Mientras no se modifique el backend, se puede crear en la tabla `unidades`
un registro sintético por condominio con:

```sql
INSERT INTO unidades (condominio_id, numero, tipo, activo)
VALUES (:condominioId, 'ZONA COMUN', 'OTRO', true);
```

El guardia seleccionaría esta unidad "ZONA COMUN" para registrar ingresos
de servicios generales.

### Limitaciones del workaround

- No hay visibilidad global de cuántas personas de servicio están en el
  condominio en un momento dado
- No hay trazabilidad real de qué área común se está interviniendo
- No se pueden asociar autorizaciones previas (pre-autorizaciones) a
  "ZONA COMUN" correctamente
- El residente no recibe notificaciones relevantes (no es su unidad)
- Reportes e históricos mezclan accesos reales con accesos generales

## Solución propuesta para backend

### Alternativa A: Hacer `unidadId` opcional para SERVICIO/TECNICO

Cambiar `RegistrarIngresoRequest.unidadId` de `@NotNull` a `@Nullable`
cuando `tipo` es `SERVICIO`, `TECNICO` u `OTRO`.

```java
public record RegistrarIngresoRequest(
    // Actual: @NotNull UUID unidadId,
    // Propuesto: nullable cuando tipo in (SERVICIO, TECNICO, OTRO)
    UUID unidadId,

    // ... resto de campos
) {}
```

**Ventajas:** Simple, no requiere cambios de esquema.
**Desventajas:** No hay trazabilidad del área específica.

### Alternativa B: Agregar TipoUnidad.COMUN

Agregar un nuevo valor al enum `TipoUnidad`:

```java
public enum TipoUnidad {
  CASA,
  DEPARTAMENTO,
  ESTACIONAMIENTO,
  BODEGA,
  COMUN,     // ← nuevo: representa un área o servicio común
  OTRO
}
```

Y crear seeds para que cada condominio tenga una o más unidades de tipo
`COMUN` (ej: "Áreas verdes", "Piscina", "Sala de eventos", "Condominio").

**Ventajas:** Semántica clara, permite múltiples áreas comunes, se puede
calcular gasto común diferenciado, reportes separables.
**Desventajas:** Requiere migración + seeds + lógica en frontend para
mostrar/ocultar según contexto.

### Alternativa C: Tabla separada para accesos generales

Crear entidad independiente `RegistroAccesoGeneral` (o similar) que no
requiera `unidadId`, con su propio endpoint y permisos.

**Ventajas:** Separación total de concerns, no afecta modelo actual.
**Desventajas:** Duplicación de lógica, más endpoints, más UI.

## Recomendación

Para la mayoría de los casos, la **Alternativa B** (TipoUnidad.COMUN +
unidades pre-seed) es la que mejor equilibra simplicidad, semántica y
flexibilidad futura. Permite:

- Que el frontend filtre unidades `COMUN` por separado
- Que el guardia seleccione "Áreas verdes", "Piscina", etc.
- Que los reportes separen accesos residenciales de los de servicio
- Que en el futuro se puedan asociar autorizaciones recurrentes
  a una unidad COMUN (ej: "jardinero autorizado los martes")
