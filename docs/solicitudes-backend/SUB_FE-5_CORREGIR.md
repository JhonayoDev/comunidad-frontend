> MIGRADO A ISSUE — JhonayoDev/comunidad-frontend#31 (sub-issue de #28) — Project "Gestion Comunidad Briku" — CERRADO (implementado)

## FE-5: Flujo de corrección post-import y reedición

### Entregables
1. Botón "Corregir ahora" en filas con advertencias → reedición con fila destacada.
2. Badge amarillo en reedición para filas con advertencias (sin recordar).
3. Verificar cobertura: nuevo arrendatario y cambio de propietario.

### Implementación (ya en working tree)
- `PlanillaFilaDetalle.vue`: botón con prop `corregible` + emit `corregir`
  (padres aportan `{email, unidad}`).
- `SetupPlanillaView.corregirDesdeAdvertencia()`: cierra preview y destaca;
  no fuerza modo edición (el usuario pulsa Editar — evita acoplar componentes).
- `usePlanillaDatos`: `advertenciasPostImport` (mapa `email|unidad` desde
  `resultadoFilas`), `advertenciasDeFila()`, `destacarFilaPor()`.
- `PlanillaDatos.vue`: Tag "Advertencia" con tooltip + outline ámbar
  (`fila-destacada`, desktop y mobile). Si recargas se pierde (aceptable).
- Reutiliza `reconstruirFilas()`/`aplicarEdicion()` sin duplicar lógica.

### Verificación de cobertura (sin gaps → sin issues nuevos)
- Nuevo arrendatario: fila nueva → import vía `enviar()`. Cubierto.
- Cambio de propietario: editar `tipo_vinculo` → desactiva+recrea vínculo;
  salida → `marcarEliminar` desactiva. Cubierto.

### Criterio de aceptación
- [x] Corregir ahora → badge + resaltado en reedición
- [x] Arrendatario nuevo y cambio de propietario cubiertos, sin gaps
- [x] Tests y build verdes (250/250)
