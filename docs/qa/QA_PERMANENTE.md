# QA permanente — Comunidad Frontend

> **Issue canónico:** [#46 — QA permanente: matriz de regresión por vista + rondas de verificación](https://github.com/JhonayoDev/comunidad-frontend/issues/46)
> **Este documento es la versión versionada de la matriz.** El issue es el índice vivo y el registro de rondas (un comentario por ronda).
> **No se cierra.** Las features y épicas se cierran cuando su bloque de QA pasa; este issue queda abierto para la siguiente entrega.

---

## 0. Cómo se usa

1. **Cada entrega abre una ronda** (`R1`, `R2`, …) en la sección 2 con los flujos específicos de esa entrega.
2. La **matriz de la sección 3** es la red de seguridad: todas las vistas, con lo mínimo que hay que mirar. Las vistas marcadas **●** fueron tocadas directa o indirectamente por la entrega en curso y por eso su revisión es obligatoria en la ronda.
3. **Una ronda se registra como comentario en el issue** con: fecha, commit/PR, qué se revisó, resultado (✅ / ❌ + issue de bug), y qué quedó pendiente.
4. **Cada hallazgo se convierte en un issue `bug`** (nunca se arregla dentro de la ronda). Al cerrar la ronda se actualiza la columna **Última** de la matriz con el número de ronda.
5. Si una vista cambia de comportamiento esperado, se actualiza **este doc en el mismo PR** que el cambio.

### Estados

| Símbolo | Significado |
|---|---|
| ✅ | Verificado en la ronda indicada |
| ⚠️ | Verificado con observaciones (ver issue de bug) |
| ⬜ | Pendiente |
| — | No aplica para el perfil / no implementado |

---

## 1. Entorno y cuentas necesarias

Un solo condominio de prueba con: ≥ 2 unidades (una con propietario + arrendatario + adicional), 1 estacionamiento, 1 bodega, 1 sector, 1 piso, planilla importada, 1 solicitud abierta, 1 caso, 1 encomienda pendiente y 1 visita activa.

| ID | Cuenta | Rol global | Rol/cargo en condominio | Para verificar |
|---|---|---|---|---|
| `U-SUPER` | super admin | `SUPER_ADMIN` | — | Panel SaaS completo |
| `U-SOPORTE` | soporte | `SOPORTE` | — | Auditoría y plantillas (sin gestión de condominios) |
| `U-ADM-EXT` | administrador externo | `ADMINISTRADOR` | — | Portal administración sin unidad |
| `U-ADM-INT` | administrador interno | `RESIDENTE` | cargo `ADMINISTRADOR` + unidad | Contexto residente ↔ administrador |
| `U-PRES` | presidente | `RESIDENTE` | cargo `PRESIDENTE` + unidad | Comité + finanzas (ver/crear) |
| `U-TES` | tesorero | `RESIDENTE` | cargo `TESORERO` + unidad | Finanzas + pagos |
| `U-SEC` | secretario | `RESIDENTE` | cargo `SECRETARIO` + unidad | Personas, miembros, casos |
| `U-DEL` | delegado | `RESIDENTE` | cargo `DELEGADO` + unidad | Bitácora, dashboard |
| `U-RES` | residente sin cargo | `RESIDENTE` | — | Portal residente puro |
| `U-GUA` | guardia | `GUARDIA` | — | Portería, visitas, encomiendas |
| `U-TRA` | trabajador | `TRABAJADOR` | cargo `JARDINERO` o `MANTENCION` | Portal staff sin `UNIDAD_VER` |
| `U-PRO` | proveedor | `PROVEEDOR` | — | Portal proveedor (solo perfil) |
| `U-NUEVO` | sin contraseña | — | cargo asignado | `setup-password` desde email |

**Datos mínimos para contextos:** una persona con **dos** contextos a la vez (p. ej. `U-ADM-INT`: residente + administrador) y otra con **tres** si es posible (residente + secretario + trabajador).

**Entorno:** backend remoto (`apicomunidad.ideaspace.dpdns.org`). Ojo con el **cold start**: la instancia axios tiene `timeout: 10000`; un primer request tras inactividad puede fallar (ver P-end en `ACCIONES_PENDIENTES.md`). Reintentar antes de reportar.

---

## 2. Ronda en curso — R1: épica #44 / PR #45

> Alcance: membresía por condominio, alta atómica de personas, reutilización, baja/reactivación, listado `TODOS` + "Sin vínculo", espacios de trabajo por contexto, portales staff, catálogo de permisos y su impacto en la carga masiva.

### A1. Alta atómica de personas (`PersonasView`)

- [ ] Alta **a una unidad**: propietario, arrendatario y residente adicional; `fechaInicio` obligatoria.
- [ ] `esOcupante`, `recibeNotificaciones` y `esResponsable` se reflejan en el vínculo creado.
- [ ] Segundo `esResponsable` en la misma unidad → `409` con mensaje claro (no rompe el formulario).
- [ ] Alta **a un cargo**: trabajador (jardinero/aseo/conserje/guardia) sin unidad y sin cuenta.
- [ ] Alta **a un cargo** de comité (`PRESIDENTE`/`SECRETARIO`/`ADMINISTRADOR`) → permisos efectivos = rol + cargo.
- [ ] Alta **a proveedor**: `empresa`/`rubro`/`contacto`; la UI avisa que el backend solo persiste `tipoAlta = PROVEEDOR`.
- [ ] Validaciones locales: unidad obligatoria, cargo obligatorio, `fechaInicio` requerida en unidad/cargo y **no** en proveedor.
- [ ] El alta crea **una sola** persona + membresía + asociación (no quedan registros huérfanos).
- [ ] Después de crear, la persona aparece en el listado con el filtro por defecto (`TODOS`).

### A2. Reutilización y conflicto

- [ ] Email existente **en otro condominio** → muestra sus membresías y solo agrega la asociación aquí.
- [ ] RUT existente con **email distinto** → mismo comportamiento (antes era imposible).
- [ ] `409` por email o RUT → aparece **"Reintentar reutilizando la persona"** y no se duplica.
- [ ] `GET /personas/buscar` sin `PERSONA_VER` → `403` limpio (sin romper la vista).
- [ ] Buscar por email/RUT inexistente → estado `noEncontrada` y ofrece crear.
- [ ] Anti-race: escribir rápido y salir del campo no deja resultados de una búsqueda vieja.

### A3. Membresía, baja y reactivación

- [ ] Filtros `ACTIVO` / `PENDIENTE` / `INACTIVO` / `TODOS` + `tipoParticipacion` + `q` local.
- [ ] Persona `PENDIENTE` (creada por importación o contrato legado) aparece en su filtro y **"Asociar"** la activa.
- [ ] Baja local con motivo → desaparece de `ACTIVO`, se desactivan vínculos/cargo y **no** afecta el login ni el acceso en otro condominio.
- [ ] Reactivar → vuelve a `ACTIVO`; verificar si recupera vínculo/cargo o exige reasociar.
- [ ] Auditoría de baja/reactivación con motivo y autor.
- [ ] Un condominio ya poblado (post-migración V85/V86) conserva todas las personas y accesos.

### A4. Listado sin personas ocultas

- [ ] Filtro por defecto **`TODOS`** (no `ACTIVO`).
- [ ] Tag **"Sin vínculo"** solo cuando no hay unidad, cargo ni `tiposParticipacion`.
- [ ] Los cruces muestran nombres completos: `SolicitudesAdminView` (responsable asignado), `MiembrosView` (selector de persona), `usePlanillaDatos` (re-entrada).
- [ ] Una persona dada de baja **no desaparece** del selector de responsable de solicitudes (nombre resuelto, no "—").

### A5. Espacios de trabajo por contexto

- [ ] Con residente + administrador: el menú muestra **solo** el espacio activo; nunca ambos.
- [ ] Cambiar contexto en el header cambia menú, vistas y **Home** (residente → `Inicio`, administrador → `Dashboard`, tesorero → `FinanzasDashboard`).
- [ ] `Menu`, `Perfil`, `Notificaciones` y `MisPermisos` siguen accesibles en cualquier contexto.
- [ ] URL directa a una ruta de otro contexto → redirige al dashboard del contexto activo (sin bucle).
- [ ] El contexto sobrevive recarga y cambio de condominio; al volver a un condominio se elige el contexto inicial correcto.
- [ ] Residente con cargo **sin unidad** entra directo al contexto del cargo (no al residente vacío).
- [ ] Píldoras visibles solo con más de un contexto.
- [ ] Residente con cargo operativo (guardia) conserva su espacio operativo.

### A6. Portales staff

- [ ] `U-TRA` cae en `TrabajadorDashboard`, `U-PRO` en `ProveedorDashboard` (login y `goHome`).
- [ ] `UNIDAD_VER` no está: no aparecen unidades, residentes ni finanzas; no hay `403` en cascada.
- [ ] Notificaciones y perfil funcionan o degradan con aviso honesto.
- [ ] Comunicados: hoy el card puede verse vacío aunque existan (F5 en `ACCIONES_PENDIENTES.md`) — registrar el comportamiento real.
- [ ] Bottom nav PWA no muestra la barra de residente al staff.
- [ ] Crear usuario con rol `TRABAJADOR`/`PROVEEDOR` envía setup-password y el portal funciona.

### A7. Permisos

- [ ] `MisPermisos` no muestra "Permisos sin catalogar" para `MI_PERFIL_VER`, `MI_PERFIL_EDITAR`, `COMUNICADO_VER`.
- [ ] `GET /me/permisos` devuelve lo esperado por rol/cargo (residente, guardia, admin, trabajador).
- [ ] Nav oculto por permisos: una ruta visible en menú nunca debe dar `403` al abrir (reportar cada caso).

### A8. Carga masiva (regresión)

- [ ] Wizard `setup/planilla`: preview JSON y ejecutar; los importados quedan `ACTIVO` y visibles en `Personas`.
- [ ] Importación CSV/XLSX: preview con conteos, ejecutar, resultado con `errores[]`.
- [ ] **Re-entrada del wizard** con integrantes ya registrados: las filas muestran nombre (no vacío).
- [ ] Editar fila existente: PUT persona, `recibe-notificaciones`, recrear vínculo si cambia tipo/ocupante/responsable.
- [ ] Importar email de alguien `PENDIENTE`/`INACTIVO` → se reutiliza y activa (conteos coherentes).
- [ ] Baja local + re-importación → no duplica persona y reactiva la membresía.
- [ ] `409` de responsable por casa se mapea a la fila, no aborta el resto.

### A9. Regresiones en módulos "completados"

- [ ] `SolicitudesAdminView`: filtros, detalle, seguimiento interno/público, resolver RUT, vincular caso.
- [ ] `MiembrosView`: alta de trabajador navega a `Personas?nueva=CARGO`; selector de personas completo.
- [ ] `UnidadesView`, `SetupUnidades/Sectores/Pisos/Entidades`: sin cambios de contrato (solo verificar que cargan).
- [ ] `PerfilView`: RUT solo-lectura, teléfono formateado, `?seccion=datos`.
- [ ] `MisSolicitudesView`: alta con `?nueva=`, estado "Enviada", evidencia por archivo.
- [ ] `NotificacionesView` / campana: badge y listado tras cambiar de contexto.

---

## 3. Matriz de regresión por módulo

**●** = tocada por la entrega en curso (R1 / PR #45) → revisión obligatoria.
**Prioridad:** P1 = bloquea operación o corrompe datos · P2 = funcionalidad importante · P3 = cosmético.

### 3.1 Autenticación (público)

| ID | Vista / ruta | Perfil | Qué verificar | ● | P | Última |
|---|---|---|---|---|---|---|
| AUTH-01 | `Login` `/login` | — | Credenciales válidas/ inválidas, error visible, redirección por rol y contexto | ● | P1 | ⬜ |
| AUTH-02 | `ForgotPassword` | — | Envío de email, mensaje neutro (no revela si existe) | | P2 | ⬜ |
| AUTH-03 | `ResetPassword` | — | Token válido/expirado, `passwordNueva` + confirmación, login posterior | | P1 | ⬜ |
| AUTH-04 | `SetupPassword` | — | Primer acceso desde email, token de un solo uso, 500 de `LazyInitialization` (P-end) | | P1 | ⬜ |
| AUTH-05 | `ConfirmarCambioEmail` | — | Confirmación de cambio de email, mensaje de éxito/error | | P2 | ⬜ |
| AUTH-06 | `VerificarCambioEmail` | — | Verificación desde email, estado del perfil actualizado | | P2 | ⬜ |

### 3.2 Compartidas (todos los autenticados)

| ID | Vista / ruta | Perfil | Qué verificar | ● | P | Última |
|---|---|---|---|---|---|---|
| COM-01 | `Menu` `/menu` | Todos | Solo el contexto activo; ítems sin `403`; badge de notificaciones | ● | P1 | ⬜ |
| COM-02 | `Perfil` `/perfil` | Todos | Datos, RUT solo-lectura, teléfono, preferencias, cambio de password/email | ● | P1 | ⬜ |
| COM-03 | `Notificaciones` `/notificaciones` | Todos | Listado, marcar leída/todas, expandir RUT, SSE en vivo | ● | P1 | ⬜ |
| COM-04 | `MisPermisos` `/permisos` | Todos | Catálogo sin "sin catalogar", permisos reales por rol/cargo | ● | P2 | ⬜ |
| COM-05 | `AppHeader` (global) | Todos | Píldoras de contexto, campana, tema claro/oscuro, `goHome` | ● | P1 | ⬜ |
| COM-06 | `BottomNavigation` (PWA) | Todos | Solo standalone + touch; FAB Home al dashboard del contexto | ● | P2 | ⬜ |

### 3.3 Administración del condominio

| ID | Vista / ruta | Perfil | Qué verificar | ● | P | Última |
|---|---|---|---|---|---|---|
| ADM-01 | `Dashboard` `/dashboard` | Admin + cargos | Totales, banner "Configuración pendiente", accesos activos, accesos rápidos | ● | P1 | ⬜ |
| ADM-02 | `Personas` `/personas` | Admin + cargos | Alta atómica, reutilización, `409`, filtros `TODOS`, "Sin vínculo", baja/reactivación, corrección de RUT | ● | P1 | ⬜ |
| ADM-03 | `Unidades` `/unidades` | Admin + cargos | CRUD, cupo por tipo, capacidad, sectores/pisos | ● | P2 | ⬜ |
| ADM-04 | `SolicitudesAdmin` `/solicitudes-admin` | Admin + cargos | Filtros server-side, gestión, seguimiento, resolver RUT, casos | ● | P1 | ⬜ |
| ADM-05 | `Personal` `/personal` | Admin + cargos | Listado de personal, turnos, checklist | | P2 | ⬜ |
| ADM-06 | `PlantillasNotificacion` | Admin | Editar/restaurar plantilla, variables | | P2 | ⬜ |
| ADM-07 | `ReglasNotificacion` | Admin | Audiencia, canales múltiples, obligatoriedad por canal, PUT completo | | P2 | ⬜ |
| ADM-08 | `Anuncios` `/anuncios` | Admin + cargos | Crear/publicar/cerrar comunicado | | P2 | ⬜ |
| ADM-09 | `ConfiguracionAlmacenamiento` | Admin | R2/Drive, prueba de conexión, guardado | | P2 | ⬜ |
| ADM-10 | `Archivos` `/archivos` | Admin + cargos | Subida, listado, descarga, visibilidad por rol | | P2 | ⬜ |
| ADM-11 | `Encomiendas` `/encomiendas` | Guardia + Admin | Registrar, entregar (nombre/RUT), cerrar, accesos | | P1 | ⬜ |
| ADM-12 | `CasosAdmin` `/casos-admin` | Admin + cargos | Lista/detalle, seguimientos, solicitudes vinculadas, finanzas solo-lectura | ● | P2 | ⬜ |
| ADM-13 | `Miembros` `/miembros` | Presidente/Secretario | Alta de trabajador → `Personas?nueva=CARGO`, selector completo | ● | P1 | ⬜ |

### 3.4 Wizard de configuración (admin)

| ID | Vista / ruta | Perfil | Qué verificar | ● | P | Última |
|---|---|---|---|---|---|---|
| SET-01 | `SetupLayout` | Admin + cargos | Progreso por datos, pasos ocultos, navegación | | P2 | ⬜ |
| SET-02 | `SetupUnidades` | Admin + cargos | 5 fases, batch, reedición, 409 por fila, degradación sin `SECTOR_*` | ● | P2 | ⬜ |
| SET-03 | `SetupSectores` | Admin + cargos | CRUD, 409 "en uso" revierte la fila, nombres reutilizables | | P2 | ⬜ |
| SET-04 | `SetupPisos` | Admin + cargos | Pisos negativos, 409 "en uso", orden | | P2 | ⬜ |
| SET-05 | `SetupEstacionamientos` | Admin + cargos | Multigrupo E-/EV-, batch, reedición, prefijo fijo | ● | P2 | ⬜ |
| SET-06 | `SetupBodegas` | Admin + cargos | Bloque único, batch, reedición | ● | P2 | ⬜ |
| SET-07 | `SetupPlanilla` | Admin + cargos | Planilla persona-por-fila, preview→ejecutar, re-entrada | ● | P1 | ⬜ |
| SET-08 | `SetupAccesos` | Admin + cargos | Puntos de acceso, QR/PIN, guardado | | P2 | ⬜ |
| SET-09 | `SetupAreasComunes` | Admin + cargos | Espacios comunes, reservas, reglas | | P3 | ⬜ |

### 3.5 Finanzas (cargos)

| ID | Vista / ruta | Perfil | Qué verificar | ● | P | Última |
|---|---|---|---|---|---|---|
| FIN-01 | `FinanzasDashboard` `/finanzas` | Presidente/Tesorero | KPIs, morosidad, período activo | | P1 | ⬜ |
| FIN-02 | `Gastos` | Presidente/Tesorero | CRUD, anular, comprobantes, filtros | | P1 | ⬜ |
| FIN-03 | `Cuentas` | Presidente | Cuentas bancarias, saldos | | P2 | ⬜ |
| FIN-04 | `GastosComunes` | Presidente/Tesorero | Emisión por período, prorrateo, estados | | P1 | ⬜ |
| FIN-05 | `CargosAdicionales` | Presidente/Tesorero/Secretario | Crear cargo, asignar unidad/persona | | P1 | ⬜ |
| FIN-06 | `Ledger` | Presidente/Tesorero | Movimientos, saldos, filtros | | P2 | ⬜ |
| FIN-07 | `Pagos` | Presidente/Tesorero | Registrar pago, conciliar, comprobante | | P1 | ⬜ |
| FIN-08 | `PlantillasGasto` | Presidente/Tesorero | Plantilla → gasto, ítems | | P2 | ⬜ |
| FIN-09 | `Categorias` | Presidente/Tesorero | CRUD, uso en gastos | | P3 | ⬜ |

### 3.6 Guardia / operaciones

| ID | Vista / ruta | Perfil | Qué verificar | ● | P | Última |
|---|---|---|---|---|---|---|
| GUA-01 | `GuardiaDashboard` `/guardia` | Guardia | Tarjetas polling 30 s, movimientos, autorizaciones, turno | | P1 | ⬜ |
| GUA-02 | `Porton` `/porton` | Guardia/Admin | Búsqueda por patente, salida rápida | | P1 | ⬜ |
| GUA-03 | `Visitas` `/visitas` | Guardia/Admin | Listado, filtros, estados, salida | | P1 | ⬜ |
| GUA-04 | `BusquedaDetalle` | Guardia/Admin | Resultado de patente, prefill de ingreso | | P2 | ⬜ |
| GUA-05 | `RegistrarVisita` | Guardia/Admin | AutoComplete de casa, prefill, autorización | | P1 | ⬜ |
| GUA-06 | `Bitacora` | Guardia/Admin + cargos | Registrar novedad, filtros colapsables, fechas | | P2 | ⬜ |
| GUA-07 | `ChecklistTemplates` | Guardia/Admin + cargos | Plantillas, toggle Sí/No legible (claro/oscuro) | | P3 | ⬜ |
| GUA-08 | `Autorizaciones` | Guardia/Admin + cargos | Aprobar/rechazar, tipos, vencimiento | | P1 | ⬜ |
| GUA-09 | `Solicitudes` / `Escanear` | Guardia | Placeholder "en construcción" (sin `404`) | | P3 | ⬜ |

### 3.7 Residente

| ID | Vista / ruta | Perfil | Qué verificar | ● | P | Última |
|---|---|---|---|---|---|---|
| RES-01 | `Inicio` `/inicio` | Residente | Resumen, encomiendas, autorizaciones, polling 60 s | | P1 | ⬜ |
| RES-02 | `MiUnidad` `/mi-unidad` | Residente | Unidades, vehículos, personas, gasto actual | | P1 | ⬜ |
| RES-03 | `Gestiones` `/gestiones` | Residente | Acceso a solicitudes propias (sin casos internos) | ● | P2 | ⬜ |
| RES-04 | `MisEncomiendas` | Residente | Listado, estados, sin datos de otras unidades | | P1 | ⬜ |
| RES-05 | `MisAutorizaciones` | Residente | Crear autorización, vigencia, QR | | P1 | ⬜ |
| RES-06 | `MisDeudas` | Residente | Cuotas, estados, detalle | | P1 | ⬜ |
| RES-07 | `MisSolicitudes` | Residente | Alta por tipo, "Enviada", evidencia, respuesta, cancelar | ● | P1 | ⬜ |
| RES-08 | `Configuracion` | Residente/Admin/Guardia | Preferencias, notificaciones | | P3 | ⬜ |

### 3.8 Portales staff

| ID | Vista / ruta | Perfil | Qué verificar | ● | P | Última |
|---|---|---|---|---|---|---|
| STA-01 | `TrabajadorDashboard` `/trabajador` | TRABAJADOR | Perfil, notificaciones, comunicados con degradación | ● | P1 | ⬜ |
| STA-02 | `ProveedorDashboard` `/proveedor` | PROVEEDOR | Solo perfil; sin módulos de residentes | ● | P1 | ⬜ |

### 3.9 SaaS (SUPER_ADMIN / SOPORTE)

| ID | Vista / ruta | Perfil | Qué verificar | ● | P | Última |
|---|---|---|---|---|---|---|
| SAA-01 | `SuperAdminDashboard` | Super admin | Totales, accesos a módulos | | P1 | ⬜ |
| SAA-02 | `SaasCondominios` | Super admin | Filtros server-side, paginación, "Entrar" | | P1 | ⬜ |
| SAA-03 | `SaasCrearCondominio` | Super admin | Validación Chile, responsable, plan | | P1 | ⬜ |
| SAA-04 | `SaasCondominioDetail` | Super admin | Capacidad, secciones, enlaces | | P1 | ⬜ |
| SAA-05 | `SaasCondominioSetup` | Super admin | Storage, capacidad, admin, activación (poll) | | P1 | ⬜ |
| SAA-06 | `SaasUsuarios` | Super admin | Listado, roles, estado de activación | | P2 | ⬜ |
| SAA-07 | `SaasPlanes` | Super admin | Crear/editar/desactivar/reactivar, 409 de código | | P1 | ⬜ |
| SAA-08 | `SaasSuscripcion` | Super admin | Estado de suscripción, período | | P2 | ⬜ |
| SAA-09 | `SaasModulos` | Super admin | Activar/desactivar módulos por condominio | | P2 | ⬜ |
| SAA-10 | `SaasAuditoria` | Super admin/Soporte | Filtros, orden, paginación, planilla responsive | | P2 | ⬜ |
| SAA-11 | `SaasPlantillas` | Super admin/Soporte | Plantillas globales, restauración | | P2 | ⬜ |
| SAA-12 | `SaasReglasNotificacion` | Super admin | Catálogo global, canales, obligatoriedad por canal | | P2 | ⬜ |
| SAA-13 | `SaasEmailConfig` | Super admin | Routing de emails por tipo | | P2 | ⬜ |
| SAA-14 | `SaasAlmacenamiento` | Super admin | Config global de storage | | P3 | ⬜ |
| SAA-15 | `CargosPermisos` | Super admin | Placeholder (sin backend) | | P3 | ⬜ |

---

## 4. Transversales (aplican a toda vista tocada)

- [ ] **Responsive**: 375 px, 768 px, 1280 px. Tablas `.planilla` → cards en mobile; sin scroll horizontal accidental.
- [ ] **Tema**: claro y oscuro; diálogos, `Select`/`AutoComplete`/`MultiSelect`/`ConfirmDialog` legibles (tokens `overlay.modal`).
- [ ] **PWA**: instalada en standalone, bottom nav solo ahí, `safe-area` inferior respetada.
- [ ] **Permisos**: cada acción visible corresponde a un permiso real; sin `403` en cascada ni botones que fallan en silencio.
- [ ] **Consola limpia**: sin `console.error` inesperados; los `catch` registran el error real.
- [ ] **Fechas nulas/ inválidas**: no lanzan `RangeError` (`src/utils/fechas.js`).
- [ ] **Formato chileno**: RUT (`12.345.678-9`), teléfono (`+56 9 1234 5678`), normalización antes de enviar.
- [ ] **Cold start / timeout 10 s**: reintentar y registrar si falla el primer request.
- [ ] **Auditoría**: las acciones sensibles (baja, RUT, planes, permisos) dejan registro en `SaasAuditoria`.
- [ ] **Estado vacío**: listas sin datos muestran mensaje útil (no spinner infinito ni tabla en blanco).
- [ ] **Navegación**: recargar en una ruta profunda no rompe; `atrás` del navegador respeta el contexto.

---

## 5. Protocolo de hallazgos

1. Reproducir 2 veces (y una tras recargar) antes de reportar.
2. Crear issue `bug` en `comunidad-frontend` con: pasos, perfil usado, resultado esperado vs real, captura y request/response relevante.
3. Añadirlo al Project `Gestion Comunidad Briku`.
4. Enlazarlo en el comentario de la ronda y en la fila de la matriz (`⚠️ #nn`).
5. Si el problema es del backend → issue `BE:` en `JhonayoDev/briku` con trazabilidad al de frontend.

---

## 6. Registro de rondas

| Ronda | Fecha | Alcance | Commit / PR | Resultado | Hallazgos | Pendiente |
|---|---|---|---|---|---|---|
| R1 | — | Épica #44 / PR #45 | `fix/personas-crear-vincular-42` | ⬜ | — | — |

---

## 7. Mantenimiento de este documento

- Al **cerrar una ronda**: actualizar la columna `Última` de la matriz y agregar la fila en la sección 6.
- Al **cambiar una vista**: ajustar su fila (qué verificar) en el mismo PR.
- Al **agregar una vista nueva**: agregar su fila con prioridad y sin marcar.
- Si una fila deja de aplicar (vista eliminada), marcarla `—` y anotar el motivo; no borrar el historial.
