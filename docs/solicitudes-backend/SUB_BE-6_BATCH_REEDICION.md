> MIGRADO A ISSUE — JhonayoDev/briku#81 — Project "Gestion Comunidad Briku"

## BE-6: Endpoint batch de reedición (snapshot planilla en 1 llamada)

### Contexto
La reedición de planilla del frontend reconstruye 1 fila por vínculo activo
haciendo **2 GET × N unidades** (`GET /unidades/{id}/vinculos` +
`GET /unidades/{id}`). Medido en vivo contra `vista horizonte` (204 casas):
**~408 requests por apertura** en ráfaga (pares con mismo timestamp en el log,
`RequestLoggingFilter` 04:24:33.352→369). El navegador paraleliza ~6, así que
son decenas de rondas secuenciales. Cada request repite auth JWT + chequeo de
permisos + logging + 1 préstamo del pool + ~10 selects Hibernate.

En producción (capa gratuita, recursos limitados y medidos) esto consume cuota
por abrir una vista, satura logs y degrada latencia percibida. El Guardar
puntual ya es eficiente (3-5 requests); falta solo la carga inicial.

### Decisión (criterio tipo Meta)
Si el cliente siempre pide X+Y juntos por cada item de una lista, es un solo
recurso: 1 endpoint en vez de N+1. Aplica aquí: mismo scope (`UNIDAD_VER`,
mismo condominio), lectura repetible, fan-out 400:1.

### Contrato propuesto (backend define nombre final)

```
GET /api/v1/condominios/{condominioId}/planilla/reedicion
Permiso: UNIDAD_VER (el mismo de las lecturas actuales)
→ 200 [{ vinculoId, persona:{id,nombre,email,rut,telefono},
         unidad:{id,numero,tipo,sectorNombre},
         tipo, esOcupante, recibeNotificaciones, esResponsable, fechaInicio,
         vehiculos:[{id,patente,tipo,marca,modelo,color}],
         estacionamientos:[{id,nombre}], bodegas:[{id,nombre}] }]
→ solo vínculos activos (mismo filtro que hoy)
```

Incluir los **ids de vínculo** (persona-unidad, vehículo, est, bodega) elimina
además el `GET previo` que el frontend hace antes de cada desvincular.

### Restricciones de implementación (obligatorias)
1. **Prohibido N+1 interno**: ~5 queries con `JOIN FETCH`
   (unidades+sector, vínculos+persona, vehículos, ests, bodegas), DTO armado
   en memoria. Un batch con 2000 selects es más rápido en red pero igual de
   pesado en BD — el test debe contar queries.
2. Sin caché (se lee fresco cada vez) → sin problema de invalidación.
3. Endpoints actuales intactos (el frontend los conserva como fallback).
4. Volumen: 204 unidades ≈ 200-500KB JSON, aceptable sin paginar. Si el
   condominio supera ~2000 unidades, paginar por `unidadDesde/unidadHasta`
   o `page/size` (a definir).

### Criterio de aceptación
- [ ] 1 request reemplaza las ~408 de la reconstrucción (verificado en log)
- [ ] Test cuenta queries SQL (máx ~6 por llamada, sin N+1)
- [ ] Incluye ids de vínculo suficientes para editar/desvincular sin GET previo
- [ ] 403 cross-condominio, 403 sin `UNIDAD_VER`
- [ ] Test de integración con condominio de N unidades y recursos mixtos

### Trazabilidad
- Épica frontend #28 · Evidencia: ráfaga medida 04:24:33 (2N requests, pares
  `vinculos`+detalle por unidad) · Frontend adopta en `reconstruirFilas()`
  cuando exista (hoy: `asentarImportadas` post-import + reconstrucción en
  apertura fresca) · Relacionados: briku#76-#80
