# QA Checklist — Flujo del Guardia / Conserje

## Preparación Previa

- [ x ] Iniciar sesión con cuenta rol **GUARDIA**
- [ ] Activar vista mobile en DevTools (F12 → iPhone 14 / Pixel 7) o probar en dispositivo real
- [ ] Tener a mano: 1 patente registrada, 1 patente desconocida, 1 RUT ficticio, 1 número de unidad

---

## 1. Dashboard Guardia — `/guardia`

### TurnoCard

- [ ] Muestra "Iniciar turno" cuando no hay turno activo
- [ ] Al hacer clic en "Iniciar turno" → se abre ChecklistDialog si el backend tiene checklist configurado para TURNO_INICIO
- [ ] Si no hay checklist, registra el evento directo
- [ ] Al confirmar, el estado cambia a "Turno desde HH:MM"
- [ ] Aparece botón "Salir a colación"
- [ ] Al hacer clic en "Salir a colación" → estado cambia a "Colación desde HH:MM"
- [ ] Aparece botón "Regresar de colación"
- [ ] Al regresar, estado vuelve a "Turno desde HH:MM"
- [ ] Aparece botón "Finalizar turno"
- [ ] Al hacer clic en "Finalizar turno" → se abre checklist de cierre si existe
- [ ] Al finalizar, el dashboard vuelve a estado inactivo ("Iniciar turno")

### NovedadDialog

- [ ] Botón "Registrar novedad" abre el diálogo
- [ ] Select de clasificación: INFO, NORMAL, URGENTE, EMERGENCIA
- [ ] Textarea para descripción
- [ ] Al confirmar, registra el evento y cierra el diálogo

### ChecklistDialog

- [ ] Muestra items del checklist según tipo de evento
- [ ] Permite marcar/desmarcar items
- [ ] Al confirmar, envía respuestas al backend
- [ ] Al cancelar, limpia el estado

### Métricas del Dashboard

- [ ] **Accesos activos:** muestra número de `dashboard.accesos.activosAhora`
- [ ] **Encomiendas:** muestra contador de encomiendas pendientes
- [ ] **Unidades:** muestra `dashboard.totalUnidades`
- [ ] **Residentes activos:** muestra `dashboard.residentesActivos`

### Navegación desde métricas

- [ ] Al hacer clic en "Accesos activos" → navega a `/visitas`
- [ ] Al hacer clic en "Encomiendas" → navega a `/encomiendas`

### Últimos movimientos

- [ ] Muestra máximo 5 movimientos de `dashboard.accesos.ultimosMovimientos`
- [ ] Cada uno muestra nombre, unidad, hora y tipo
- [ ] Al hacer clic → navega a `/visitas`

### Encomiendas pendientes (sección)

- [ ] Muestra hasta 4 encomiendas con Badge de cantidad total
- [ ] Muestra descripción/receptor, unidad, fecha y Tag "Pendiente"
- [ ] Al hacer clic → navega a `/encomiendas`

### Autorizaciones pendientes (sección)

- [ ] Muestra hasta 4 autorizaciones con Badge
- [ ] Muestra nombre, unidad, tipo y hora de inicio
- [ ] Al hacer clic → navega a `/autorizaciones`

### Acceso rápido (botones)

- [ ] "Registrar visita" → `/visitas/nueva`
- [ ] "Consultar patente" → `/porton`
- [ ] "Accesos activos" → `/visitas`
- [ ] "Encomiendas" → `/encomiendas`
- [ ] "Autorizaciones" → `/autorizaciones`
- [ ] "Bitácora" → `/bitacora`
- [ ] "Solicitudes" → `/solicitudes`

### Estados visuales

- [ ] **Loading:** skeletons visibles mientras cargan datos
- [ ] **Error:** mensaje de error visible
- [ ] **Sin datos:** las cards se muestran con valores en 0

---

## 2. Control de Portón — `/porton`

### Búsqueda

- [ ] Input de patente con uppercase automático
- [ ] Botón "Buscar" se habilita solo con 2+ caracteres
- [ ] Enter ejecuta búsqueda
- [ ] Loading con Skeleton mientras consulta

### Resultado: VEHICULO_RESIDENTE

- [ ] Tag "Residente" (severity success)
- [ ] Muestra `titulo`, `subtitulo` y `detalle`
- [ ] Botón "Registrar ingreso" presente
- [ ] Botón "Nueva visita" presente
- [ ] Al hacer clic en "Registrar ingreso" → confirma con mensaje de éxito
- [ ] El campo patente se limpia después del registro

### Resultado: PREAUTORIZACION

- [ ] Tag "Pre-autorizado" (severity info)

### Resultado: VEHICULO_FRECUENTE

- [ ] Tag "Frecuente" (severity warn)

### Resultado: DESCONOCIDO

- [ ] Tag "Desconocido" (severity danger)
- [ ] Mensaje "Patente no registrada"
- [ ] Botón "Registrar como visita" → navega a `/visitas/nueva?patente=XXXX`

### Resultado: PERSONA_RESIDENTE

- [ ] Tag "Residente" (severity success)

### Resultado: AUTORIZACION_SIN_VEHICULO

- [ ] Tag "Sin vehículo" (severity info)

### Manejo de errores

- [ ] Error de búsqueda: muestra mensaje "Error al consultar"
- [ ] Error de registro de ingreso: muestra mensaje del backend

---

## 3. Visitas — `/visitas`

### Filtros

- [ ] Input "Buscar por patente" con uppercase automático y debounce
- [ ] Input "Buscar por nombre" con debounce
- [ ] Select filtro por estado: Todas / Activas / Con salida
- [ ] Botón "Limpiar" resetea filtros
- [ ] Botón "Nueva" → navega a `/visitas/nueva`

### Lista de visitas

- [ ] Cada visita muestra: nombre, patente, tipo, fecha de ingreso
- [ ] Tag de estado: "Activa" (success) o "Salió" (info)
- [ ] Botón "Registrar salida" solo en visitas activas
- [ ] Al hacer clic en "Registrar salida" → estado cambia a "Salió" sin recargar página

### Estados

- [ ] Loading: Skeleton visible
- [ ] Vacío: icono + "No hay visitas registradas"
- [ ] Error: mensaje "Sin conexión" con datos cacheados si existen

---

## 4. Registrar Visita — `/visitas/nueva`

### Formulario

- [ ] Input "Patente" opcional, uppercase, maxlength 7. Si viene desde Portón, se precarga
- [ ] Input "Nombre visitante" obligatorio
- [ ] InputNumber "Cantidad de personas" mínimo 1
- [ ] Select "Tipo": VISITA, DELIVERY, UBER, SERVICIO, TECNICO, OTRO
- [ ] Select "Casa destino" carga unidades tipo CASA desde el backend
- [ ] Textarea "Observación" opcional

### Validaciones

- [ ] Nombre vacío → error "Campo obligatorio"
- [ ] Cantidad < 1 → error "Mínimo 1 persona"
- [ ] Tipo sin seleccionar → error "Seleccione un tipo"
- [ ] Casa sin seleccionar → error "Seleccione una casa destino"
- [ ] Errores del backend se mapean por campo

### Éxito

- [ ] Al guardar → redirige automáticamente a `/visitas`

---

## 5. Encomiendas — `/encomiendas`

### Filtros

- [ ] Botones de filtro: Pendientes / Entregadas / Todas
- [ ] Al cambiar filtro, la lista se actualiza y paginación se reinicia

### Lista de encomiendas

- [ ] Cada card muestra: unidad, tipo (Tag), destinatario, creado por, fecha
- [ ] Tag de estado: "Pendiente" (warn) o "Entregada" (success)
- [ ] Botón "Entregar" solo en estado PENDIENTE
- [ ] Al hacer clic en la card → abre diálogo de detalle
- [ ] Paginación funcional

### Dialog — Registrar

- [ ] Select "Casa destino" carga unidades tipo CASA
- [ ] Select "Tipo": CARTA / ENCOMIENDA
- [ ] Input "Nombre destinatario" obligatorio
- [ ] Botones "Tomar foto" y "Seleccionar" → input file con capture="environment"
- [ ] Preview de foto se muestra con botón para quitarla
- [ ] Al registrar con foto → se comprime, sube a R2/Drive, confirma y registra
- [ ] Al registrar sin foto → solo envía datos del formulario
- [ ] Mensaje de éxito visible
- [ ] La lista se actualiza automáticamente

### Dialog — Entregar

- [ ] Muestra: "Entregando encomienda de {nombre} — Casa {número}"
- [ ] Input "Nombre de quien retira" obligatorio
- [ ] Input "RUT de quien retira" obligatorio
- [ ] Botón "Confirmar entrega" deshabilitado si faltan datos
- [ ] Al confirmar → estado cambia a Entregada inmediato (optimistic update)
- [ ] Si hay error → el estado vuelve a Pendiente (rollback)
- [ ] La lista se actualiza sin recargar página

### Dialog — Detalle

- [ ] Foto de la encomienda si existe, con click para ampliar
- [ ] Grid: Tipo, Destinatario, Estado, Recibida, Retirada por
- [ ] Historial de eventos (tipo, quién, cuándo)

### Estados

- [ ] Loading: Skeleton
- [ ] Vacío: icono + "No hay encomiendas"
- [ ] Error: mensaje de error

---

## 6. Autorizaciones — `/autorizaciones`

### Filtros

- [ ] Select de estado: Pendientes / Utilizadas / Expiradas / Canceladas / Todas

### Lista

- [ ] Cada card muestra: nombre, tipo (Tag), unidad, patente, cantidad personas
- [ ] Rango de fecha y hora: formato legible (mismo día vs. multi-día)
- [ ] Fecha de creación
- [ ] Tag de estado con color: Pendiente (warn), Utilizada (info), Expirada (contrast), Cancelada (danger)

### Estados

- [ ] Loading: Skeletons
- [ ] Vacío: icono + "No hay autorizaciones {filtro}"
- [ ] Error: mensaje de error

### Nota

- [ ] Vista solo informativa, sin botones de acción

---

## 7. Bitácora — `/bitacora`

### TurnoCard

- [ ] TurnoCard visible solo si el rol es GUARDIA y hay turno activo
- [ ] Botones de acción de turno funcionan desde esta vista

### Filtros

- [ ] Select "Tipo": Novedad, Inicio turno, Fin turno, Colación salida, Colación regreso
- [ ] Select "Clasificación": Normal, Urgente, Emergencia, Informativo
- [ ] Filtro de fechas (rango)
- [ ] Al cambiar cualquier filtro → la lista se actualiza y paginación se reinicia

### Dialog — Registrar Novedad

- [ ] Select "Clasificación"
- [ ] Textarea "Descripción" obligatoria
- [ ] Input "Foto URL" opcional
- [ ] Botón "Registrar" deshabilitado si descripción vacía
- [ ] Al confirmar → se agrega al timeline y se cierra el diálogo

### Timeline

- [ ] Eventos ordenados del más reciente al más antiguo
- [ ] Cada evento muestra: tipo, clasificación, descripción, creado por, fecha/hora
- [ ] Paginación funcional

### Estados

- [ ] Loading: Skeletons
- [ ] Vacío: icono + "No hay eventos registrados"
- [ ] Error: mensaje de error

---

## 8. Solicitudes — `/solicitudes`

- [ ] La vista carga sin errores (backend puede devolver 404 porque no está implementado)
- [ ] No rompe la navegación del resto de la app

---

## 9. Checklist Templates — `/bitacora/checklist`

- [ ] Ruta accesible para GUARDIA, ADMINISTRADOR + cargos PRESIDENTE, SECRETARIO
- [ ] Permite ver templates de checklist por tipo de evento

---

## 10. Sesión y Multi-Tenant

- [ ] Recargar la página mantiene el turno activo (tryRestoreSession)
- [ ] Cambiar de condominio → todos los datos se refrescan con el nuevo condominioId
- [ ] Cerrar sesión → limpia todo el estado y redirige a login
- [ ] Sin condominio seleccionado → mensaje "Selecciona un condominio primero"

---

## 11. Edge Cases

- [ ] Error 401 → interceptor refresca token, requests en cola se re-ejecutan
- [ ] Error 429 → rate limiting manejado
- [ ] Sin turno activo → solo se ve "Iniciar turno", no hay acciones disponibles
- [ ] Sin conexión → mensajes de error apropiados, datos cacheados si existen

---

## 12. Build

- [ ] `pnpm build` pasa sin errores

