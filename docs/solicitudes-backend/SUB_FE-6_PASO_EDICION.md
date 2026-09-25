## FE-6: Paso planilla como pendiente durante edición + banner fresco/histórico

### Contexto
`pasoCompletado("planilla")` se deriva de datos (`residentesActivos > 0`): al
volver a una planilla completada se ve la tabla + el último resultado como si
fuera fresco, y editar no refleja "en curso" en el wizard.

### Cambios
- `useSetupConfiguracion.js`: `pasoEnEdicion` (module scope) + `marcarEnEdicion(key)`;
  `pasoCompletado` retorna false para el paso en edición. No toca el dashboard
  (su banner sigue por datos).
- `PlanillaDatos.vue`: emite `edicion` (entrar/salir/cancelar) y sale de edición
  al guardar con éxito (nuevo `resultado`).
- `SetupPlanillaView.vue`: re-emite `edicion-planilla`.
- `SetupLayout.vue`: aplica el override, limpia al cambiar de ruta. Continuar
  vuelve a apuntar a planilla hasta guardar.
- `usePlanillaDatos.js`: `resultadoFresco` (true solo recién importado).
- `PlanillaResultado.vue` (+ `ImportacionMasivaView`): "Última importación
  (restaurada)" en muted vs "Planilla guardada" en verde + "Paso completado".

### Criterio de aceptación
- [x] Editar quita el check de planilla y Continuar loopea hasta guardar
- [x] Guardar restaura el completado (vía `actualizado` + salida de edición)
- [x] Banner restaurado se distingue del recién importado
- [x] Tests y build verdes
