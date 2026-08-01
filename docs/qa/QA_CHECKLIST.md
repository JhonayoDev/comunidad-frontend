# QA Audit Checklist — Comunidad Frontend

> **Proyecto:** Comunidad Frontend (Vue 3 + PrimeVue + Tailwind)
> **Versión Objetivo:** Prueba (pre-release)
> **Fecha Auditoría:** 2026-07-27
> **Auditor:** QA Lead / Arquitecto de Software

---

## 1. Resumen Ejecutivo

### Métricas Generales

| Métrica | Valor |
|---|---|
| Total Rutas Registradas | **56** (4 públicas + 52 privadas) |
| Total Vistas Implementadas | **47** (archivos `.vue` en `src/views/`) |
| Total Componentes | **10** (en `src/components/`) |
| Total Servicios (API) | **25** (en `src/services/`) |
| Total Composables | **17** (en `src/composables/`) |
| Total Stores Pinia | **1** (`authStore.js`) |
| Total Endpoints Backend | **~150+** mapeados en servicios |
| Query Keys TanStack | **11** en **10** composables |

### Perfiles / Roles / Permisos Soportados

| Perfil UX | Roles Globales | Roles por Condominio | Cargos por Condominio |
|---|---|---|---|
| **Público / Auth** | — | — | — |
| **Residente** | — | `RESIDENTE` | — |
| **Conserje / Guardia** | — | `GUARDIA` | — |
| **Administrador de Condominio** | — | `ADMINISTRADOR` | `PRESIDENTE`, `TESORERO`, `SECRETARIO`, `DELEGADO` |
| **SuperAdmin SaaS** | `SUPER_ADMIN`, `SOPORTE` | — | — |

**Nota:** Los cargos (`PRESIDENTE`, `TESORERO`, `SECRETARIO`, `DELEGADO`) se asignan a nivel condominio y **prevalecen sobre el rol** cuando una ruta especifica `meta.cargos`. Un `RESIDENTE` con cargo `PRESIDENTE` puede acceder a rutas de administración.

### Convención de Navegación por Perfil

| Perfil | Ruta Inicial |
|---|---|
| SUPER_ADMIN | `SuperAdminDashboard` |
| SOPORTE | `SaasAuditoria` |
| ADMINISTRADOR | `Dashboard` |
| GUARDIA | `GuardiaDashboard` |
| RESIDENTE (contexto residente) | `Inicio` |
| RESIDENTE (contexto cargo) | Según cargo: `Dashboard` / `FinanzasDashboard` |

### Convención de Query Keys (TanStack Query)

Todas las queries scoped a condominio siguen el patrón:
```
["recurso", auth.condominioActualId, ...params]
```

| Composable | Query Keys |
|---|---|
| `useSuperAdminDashboard` | `["superAdminCondominios"]` |
| `useNotificaciones` | `["notificaciones", cid]`, `["notificaciones-sync", cid]` |
| `usePersonal` | `["personal", cid]` |
| `useTurno` | `["turno", cid]`, `["eventos", cid, filters]` |
| `useReglasNotificacion` | `["reglas-notificacion", cid]` |
| `useUnidades` | `["unidades", cid]` |
| `useDashboardGuardia` | `["dashboardGuardia", cid]`, `["encomiendasPendientes", cid]`, `["autorizacionesPendientes", cid]` |
| `useConfiguracionAlmacenamiento` | `["configuracion-almacenamiento", cid]` |
| `useArchivos` | `["archivos", cid, categoria]` |
| `useEncomiendas` | `["encomiendas", cid, pag, filtros]` |

---

## 2. Listado de Auditoría por Perfil / Rol

### 2.1 Perfil: Público / Auth

Vistas accesibles sin autenticación (meta `public: true`). Layout: `AuthLayout.vue`.

---
### Vista: LoginView.vue (Ruta: `/login`)
* **Permiso/Rol Requerido:** `public` (sin autenticación)
* **Componentes Hijos Usados:** `AuthLayout`, `AppHeaderLogin`
* **Endpoints Backend Asociados:** `POST /auth/login`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Si ya está autenticado, redirige a rutaInicial() correctamente.
- [ ] **Funcionalidad & CRUD:** Formulario de email + password válido; botón de login ejecuta autenticación; manejo de error 401 con mensaje claro.
- [ ] **Integración Backend / BD:** Login real contra backend; obtiene accessToken + perfil; fetch de condominios posterior.
- [ ] **Estados de Carga y Errores:** Spinner en botón durante la llamada; Toast/Message en error de credenciales; manejo de red caída.
- [ ] **Empty States:** N/A (formulario único).
- [ ] **Responsividad & UX:** Inputs full-width con prop `fluid`; diseño mobile-first centrado; teclado virtual en móvil no obstruye inputs.
- [ ] **Tema & Consistencia UI:** Usa `bg-surface/75`, inputs con pt local, botón PrimeVue `raised`/`fluid`.
- [ ] **Enlace a "Olvidé mi contraseña":** Link funcional a `/recuperar-password`.

---
### Vista: ForgotPasswordView.vue (Ruta: `/recuperar-password`)
* **Permiso/Rol Requerido:** `public`
* **Componentes Hijos Usados:** `AuthLayout`, `AppHeaderLogin`
* **Endpoints Backend Asociados:** `POST /auth/forgot-password`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo accesible sin sesión.
- [ ] **Funcionalidad & CRUD:** Input de email válido; botón "Recuperar" envía solicitud; mensaje de confirmación en éxito.
- [ ] **Integración Backend / BD:** Llama a backend real; maneja errores de email no registrado.
- [ ] **Estados de Carga y Errores:** Spinner en envío; Toast de éxito/error.
- [ ] **Empty States:** N/A.
- [ ] **Responsividad & UX:** Mobile-first; link de retorno a login.
- [ ] **Tema & Consistencia UI:** Mismo estilo que LoginView.

---
### Vista: ResetPasswordView.vue (Ruta: `/reset-password`)
* **Permiso/Rol Requerido:** `public`
* **Componentes Hijos Usados:** `AuthLayout`, `AppHeaderLogin`
* **Endpoints Backend Asociados:** `POST /auth/reset-password`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo accesible sin sesión; valida token en URL.
- [ ] **Funcionalidad & CRUD:** Formulario con nueva password + confirmación; validación de fortaleza y coincidencia; botón de reset.
- [ ] **Integración Backend / BD:** Envía token + nueva password; manejo de token expirado/inválido.
- [ ] **Estados de Carga y Errores:** Spinner; Toast de éxito con redirect a login; Toast de error en fallo.
- [ ] **Empty States:** N/A.
- [ ] **Responsividad & UX:** Mobile-first; password visibility toggle.
- [ ] **Tema & Consistencia UI:** Mismo estilo que LoginView.

---
### Vista: SetupPasswordView.vue (Ruta: `/setup-password`)
* **Permiso/Rol Requerido:** `public`
* **Componentes Hijos Usados:** `AuthLayout`, `AppHeaderLogin`
* **Endpoints Backend Asociados:** `POST /auth/setup-password`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo accesible sin sesión; valida token de invitación.
- [ ] **Funcionalidad & CRUD:** Formulario de creación de password; validación de fortaleza y coincidencia.
- [ ] **Integración Backend / BD:** Envía token + password; crea usuario y redirige a login.
- [ ] **Estados de Carga y Errores:** Spinner; Toast de éxito/error.
- [ ] **Empty States:** N/A.
- [ ] **Responsividad & UX:** Mobile-first; mensaje instructivo claro.
- [ ] **Tema & Consistencia UI:** Mismo estilo que LoginView.

---

### 2.2 Perfil: Residente

Vistas accesibles con rol `RESIDENTE` en condominio. Opcionalmente con cargos directivos (accede también a vistas de su cargo vía `switchContext`).

---
### Vista: InicioView.vue (Ruta: `/inicio`)
* **Permiso/Rol Requerido:** `RESIDENTE`
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/dashboard/residente`, `GET /condominios/{cid}/mis-encomiendas`, `GET /condominios/{cid}/mis-autorizaciones`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo RESIDENTE; redirige si no tiene el rol.
- [ ] **Funcionalidad & CRUD:** Dashboard con resumen de datos del residente; cards con métricas (encomiendas, autorizaciones, deudas); accesos directos funcionales.
- [ ] **Integración Backend / BD:** Carga datos reales; usa TanStack Query directa (sin composable).
- [ ] **Estados de Carga y Errores:** Skeleton cards al cargar; Message de error si falla API.
- [ ] **Empty States:** Mensaje "Bienvenido" sin datos; no hay listas vacías.
- [ ] **Responsividad & UX:** Grid responsivo; cards apilables en mobile.
- [ ] **Tema & Consistencia UI:** Cards con `bg-surface/75`; iconos PrimeIcons consistentes.

---
### Vista: DashboardView.vue (Ruta: `/mi-unidad`)
* **Permiso/Rol Requerido:** `RESIDENTE`
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/dashboard/residente`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo RESIDENTE.
- [ ] **Funcionalidad & CRUD:** Muestra detalle de unidad del residente (info, vehículos, personas, gasto actual).
- [ ] **Integración Backend / BD:** Carga datos reales; usa `perfilService`.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast de error.
- [ ] **Empty States:** N/A (muestra datos de unidad existente).
- [ ] **Responsividad & UX:** Layout responsivo; info jerarquizada.
- [ ] **Tema & Consistencia UI:** Cards PrimeVue; tipografía consistente.

---
### Vista: MisEncomiendasView.vue (Ruta: `/mis-encomiendas`)
* **Permiso/Rol Requerido:** `RESIDENTE`
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/mis-encomiendas`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo RESIDENTE.
- [ ] **Funcionalidad & CRUD:** Lista de encomiendas del residente; puede ver detalle; estados visibles (pendiente, entregada, cerrada).
- [ ] **Integración Backend / BD:** Carga datos reales; usa `encomiendasService` directamente.
- [ ] **Estados de Carga y Errores:** Skeleton list; Toast en error.
- [ ] **Empty States:** Mensaje "No tienes encomiendas registradas" con icono `pi-box`.
- [ ] **Responsividad & UX:** Lista vertical con cards; fácil de scrollear.
- [ ] **Tema & Consistencia UI:** Badge de estado con colores semánticos.

---
### Vista: MisAutorizacionesView.vue (Ruta: `/mis-autorizaciones`)
* **Permiso/Rol Requerido:** `RESIDENTE`
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/mis-autorizaciones`, `PATCH /condominios/{cid}/autorizaciones/{id}/cancelar`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo RESIDENTE.
- [ ] **Funcionalidad & CRUD:** Lista de autorizaciones de acceso; botón para cancelar.
- [ ] **Integración Backend / BD:** Carga real; cancelación persiste en backend.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast de error/éxito.
- [ ] **Empty States:** Mensaje "No tienes autorizaciones activas".
- [ ] **Responsividad & UX:** Cards con acciones; confirmación dialog para cancelar.
- [ ] **Tema & Consistencia UI:** Badge de estado (`ACTIVO`, `FINALIZADO`, `RECHAZADO`).

---
### Vista: MisDeudasView.vue (Ruta: `/mis-deudas`)
* **Permiso/Rol Requerido:** `RESIDENTE`
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/mis-deudas`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo RESIDENTE.
- [ ] **Funcionalidad & CRUD:** Tabla/listado de deudas pendientes y pagadas; montos visibles.
- [ ] **Integración Backend / BD:** Carga real; usa `perfilService`.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast de error.
- [ ] **Empty States:** Mensaje "No tienes deudas pendientes" con icono verde.
- [ ] **Responsividad & UX:** Tabla responsiva o cards; montos con formato moneda.
- [ ] **Tema & Consistencia UI:** Colores semánticos en montos (rojo = deuda, verde = pagado).

---
### Vista: CasosView.vue (Ruta: `/mis-casos`)
* **Permiso/Rol Requerido:** `RESIDENTE`
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/casos`, `POST /condominios/{cid}/casos`, `POST /condominios/{cid}/casos/{id}/seguimientos`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo RESIDENTE.
- [ ] **Funcionalidad & CRUD:** Lista de casos propios; crear caso nuevo; agregar seguimientos.
- [ ] **Integración Backend / BD:** CRUD real; casos scoped al residente.
- [ ] **Estados de Carga y Errores:** Skeleton lista; Toast en creación/seguimiento.
- [ ] **Empty States:** "No has registrado casos" con botón "Crear caso".
- [ ] **Responsividad & UX:** Timeline de seguimientos; diálogo de creación.
- [ ] **Tema & Consistencia UI:** Badge de estado de caso.

---
### Vista: GestionesView.vue (Ruta: `/gestiones`)
* **Permiso/Rol Requerido:** `RESIDENTE`
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/casos`, `POST /condominios/{cid}/casos`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo RESIDENTE.
- [ ] **Funcionalidad & CRUD:** Lista de gestiones / solicitudes del residente.
- [ ] **Integración Backend / BD:** Carga real; CRUD contra `casosService`.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** Mensaje vacío con acción.
- [ ] **Responsividad & UX:** Mobile-first; formularios modales.
- [ ] **Tema & Consistencia UI:** Cards; mismos patrones que CasosView.

---
### Vista: PerfilView.vue (Ruta: `/perfil`)
* **Permiso/Rol Requerido:** `RESIDENTE` / `ADMINISTRADOR` / `GUARDIA`
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /me`, `PUT /me`, `PUT /me/password`, `POST /me/email/solicitar`, `POST /me/email/verificar`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Roles compartidos; cualquiera autenticado accede.
- [ ] **Funcionalidad & CRUD:** Ver/editar perfil; cambiar password; cambiar email con verificación.
- [ ] **Integración Backend / BD:** Carga y persiste cambios en backend real.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast de éxito/error.
- [ ] **Empty States:** N/A (perfil siempre existe).
- [ ] **Responsividad & UX:** Formularios sectionados; password con toggle.
- [ ] **Tema & Consistencia UI:** Avatar, inputs fluid.

---
### Vista: ConfiguracionView.vue (Ruta: `/configuracion`)
* **Permiso/Rol Requerido:** `RESIDENTE` / `ADMINISTRADOR` / `GUARDIA`
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** Push notification subscription (indirecto vía `usePushNotifications`)

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Roles compartidos.
- [ ] **Funcionalidad & CRUD:** Preferencias de notificación; toggle push; selector de condominio (si multi).
- [ ] **Integración Backend / BD:** Push registration via PushManager; preferencias via personasService.
- [ ] **Estados de Carga y Errores:** Loading en preferencias; Toast.
- [ ] **Empty States:** N/A.
- [ ] **Responsividad & UX:** Toggles switches; diseño de settings.
- [ ] **Tema & Consistencia UI:** InputSwitch de PrimeVue; secciones con divider.

---
### Vista: NotificacionesView.vue (Ruta: `/notificaciones`)
* **Permiso/Rol Requerido:** Todos los roles
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/notificaciones`, `PATCH /condominios/{cid}/notificaciones/{id}/leida`, `PATCH /condominios/{cid}/notificaciones/todas-leidas`, `GET /condominios/{cid}/notificaciones/sync`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Ruta sin meta (accesible para todos los autenticados).
- [ ] **Funcionalidad & CRUD:** Lista de notificaciones; marcar como leída; marcar todas leídas.
- [ ] **Integración Backend / BD:** Carga real vía `useNotificaciones` con TanStack Query; sincronización push.
- [ ] **Estados de Carga y Errores:** Skeleton list; Toast en error.
- [ ] **Empty States:** "No tienes notificaciones" con icono `pi-bell`.
- [ ] **Responsividad & UX:** Lista con scroll infinito o paginación; badge de no leídas.
- [ ] **Tema & Consistencia UI:** Diferenciación visual leído/no leído con fondo y fontWeight.

---
### Vista: MenuView.vue (Ruta: `/menu`)
* **Permiso/Rol Requerido:** Todos los roles
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** _Ninguno_ (solo navegación local)

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Ruta sin meta — accesible para todos; items filtrados por `useNavigation().filtrar()`.
- [ ] **Funcionalidad & CRUD:** Menú de navegación con items agrupados por perfil/contexto.
- [ ] **Integración Backend / BD:** N/A.
- [ ] **Estados de Carga y Errores:** N/A (menú estático renderizado al instante).
- [ ] **Empty States:** N/A.
- [ ] **Responsividad & UX:** Grid de iconos grande; táctil amigable; bottom navigation en mobile.
- [ ] **Tema & Consistencia UI:** Iconos PrimeIcons grandes; labels claros.

---
### Vista: MisPermisosView.vue (Ruta: `/permisos`)
* **Permiso/Rol Requerido:** Todos los roles
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** _Ninguno_ (visualización local de permisos desde authStore)

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Ruta sin meta — accesible para todos; muestra solo permisos del usuario.
- [ ] **Funcionalidad & CRUD:** Tabla/lista de permisos asignados al usuario en el condominio actual.
- [ ] **Integración Backend / BD:** Lee desde `authStore.permisos` (cargado vía `GET /me/permisos?condominioId=...`).
- [ ] **Estados de Carga y Errores:** Esperar a que `fetchPermisos` resuelva; mostrar spinner.
- [ ] **Empty States:** "No tienes permisos especiales asignados".
- [ ] **Responsividad & UX:** Lista simple y clara.
- [ ] **Tema & Consistencia UI:** Badge por permiso; chips de colores.

---

### 2.3 Perfil: Conserje / Guardia

Vistas accesibles con rol `GUARDIA` en condominio.

---
### Vista: GuardiaDashboardView.vue (Ruta: `/guardia`)
* **Permiso/Rol Requerido:** `GUARDIA`
* **Componentes Hijos Usados:** `TurnoCard`, `ChecklistDialog`, `NovedadDialog`
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/dashboard/guardia`, `GET /condominios/{cid}/encomiendas` (pendientes), `GET /condominios/{cid}/autorizaciones` (pendientes), `GET /condominios/{cid}/bitacora/mi-turno`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo GUARDIA; redirige si no tiene el rol.
- [ ] **Funcionalidad & CRUD:** Dashboard con tarjetas de resumen (accesos activos, encomiendas pendientes, autorizaciones pendientes); inicio/fin de turno; checklist de turno.
- [ ] **Integración Backend / BD:** Datos reales vía `useDashboardGuardia` (TanStack Query); `useTurno` para bitácora.
- [ ] **Estados de Carga y Errores:** Skeleton cards; Toast en operaciones de turno.
- [ ] **Empty States:** "No hay accesos activos"; "No hay encomiendas pendientes".
- [ ] **Responsividad & UX:** Grid 2 columnas en desktop, 1 en mobile; acciones rápidas.
- [ ] **Tema & Consistencia UI:** Cards con métricas; badges de estado; colores semánticos.

---
### Vista: PortonView.vue (Ruta: `/porton`)
* **Permiso/Rol Requerido:** `GUARDIA` / `ADMINISTRADOR` (cargo PRESIDENTE)
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/busqueda/por-patente`, `POST /condominios/{cid}/accesos/ingresar`, `PATCH /condominios/{cid}/accesos/{id}/salida`, `GET /condominios/{cid}/vehiculos`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** GUARDIA o ADMIN con cargo PRESIDENTE.
- [ ] **Funcionalidad & CRUD:** Búsqueda por patente; registrar ingreso/salida; lista de vehículos autorizados.
- [ ] **Integración Backend / BD:** Búsqueda real por patente; registro de acceso persiste.
- [ ] **Estados de Carga y Errores:** Spinner en búsqueda; Toast en registro de acceso.
- [ ] **Empty States:** "Escribe una patente para buscar" en búsqueda.
- [ ] **Responsividad & UX:** Input grande para patente (lector QR/cámara opcional); botones grandes para acción rápida; optimizado para tablet.
- [ ] **Tema & Consistencia UI:** Input con icono de búsqueda; botones de acción con colores semánticos (verde = ingreso, rojo = salida).

---
### Vista: VisitasView.vue (Ruta: `/visitas`)
* **Permiso/Rol Requerido:** `GUARDIA` / `ADMINISTRADOR` (cargo PRESIDENTE)
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/accesos`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** GUARDIA o ADMIN con cargo PRESIDENTE.
- [ ] **Funcionalidad & CRUD:** Lista de accesos activos (visitas actualmente en el condominio); filtros por estado/tipo.
- [ ] **Integración Backend / BD:** Datos reales vía `useVisitas` (ref-based, NO TanStack Query aún).
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** "No hay visitas activas en este momento".
- [ ] **Responsividad & UX:** Lista con búsqueda y filtros; acciones inline.
- [ ] **Tema & Consistencia UI:** Badge por tipo de acceso (`VISITA`, `DELIVERY`, `SERVICIO`, etc.).

---
### Vista: RegistrarVisitaView.vue (Ruta: `/visitas/nueva`)
* **Permiso/Rol Requerido:** `GUARDIA` / `ADMINISTRADOR` (cargo PRESIDENTE)
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `POST /condominios/{cid}/accesos/ingresar`, `GET /condominios/{cid}/unidades`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** GUARDIA o ADMIN con cargo PRESIDENTE.
- [ ] **Funcionalidad & CRUD:** Formulario completo para registrar visita; selección de unidad, tipo, datos visitante.
- [ ] **Integración Backend / BD:** Registro persiste en backend; carga unidades del condominio.
- [ ] **Estados de Carga y Errores:** Spinner en submit; validación de campos; Toast.
- [ ] **Empty States:** N/A (formulario).
- [ ] **Responsividad & UX:** Formulario vertical; Select de unidades con búsqueda; cámara para foto si aplica.
- [ ] **Tema & Consistencia UI:** Inputs fluid; Select con pt local; botón submit prominent.

---
### Vista: EncomiendasView.vue (Ruta: `/encomiendas`)
* **Permiso/Rol Requerido:** `GUARDIA` / `ADMINISTRADOR`
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/encomiendas`, `POST /condominios/{cid}/encomiendas`, `PATCH /condominios/{cid}/encomiendas/{id}/entregar`, `PATCH /condominios/{cid}/encomiendas/{id}/cerrar`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** GUARDIA o ADMINISTRADOR.
- [ ] **Funcionalidad & CRUD:** Lista de encomiendas; registrar nueva; entregar (con nombre/rut de quien retira); cerrar.
- [ ] **Integración Backend / BD:** CRUD real vía `useEncomiendas` (TanStack Query con invalidación).
- [ ] **Estados de Carga y Errores:** Skeleton con paginación; Toast en operaciones; optimistc update con rollback.
- [ ] **Empty States:** "No hay encomiendas registradas".
- [ ] **Responsividad & UX:** Tabla responsiva con filtros (tipo, estado); diálogo de registro/entrega.
- [ ] **Tema & Consistencia UI:** Badge tipo (`CARTA`/`ENCOMIENDA`); badge estado con colores.

---
### Vista: BitacoraView.vue (Ruta: `/bitacora`)
* **Permiso/Rol Requerido:** `GUARDIA` / `ADMINISTRADOR` (cargos PRESIDENTE, SECRETARIO, DELEGADO)
* **Componentes Hijos Usados:** `TurnoCard`, `EventoCard`, `FiltroFechas`
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/bitacora`, `GET /condominios/{cid}/bitacora/mi-turno`, `GET /condominios/{cid}/bitacora/por-dia`, `POST /condominios/{cid}/bitacora`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** GUARDIA o ADMIN con cargos específicos.
- [ ] **Funcionalidad & CRUD:** Línea de tiempo de eventos de bitácora; filtro por fechas; registro de novedades; inicio/fin de turno.
- [ ] **Integración Backend / BD:** Datos reales vía `useTurno` (TanStack Query); eventos paginados con `usePaginacion`.
- [ ] **Estados de Carga y Errores:** Skeleton timeline; Toast en novedades.
- [ ] **Empty States:** "No hay eventos registrados en este período".
- [ ] **Responsividad & UX:** Timeline vertical; filtro de fechas colapsable en mobile.
- [ ] **Tema & Consistencia UI:** Cards de evento con icono por clasificación (`INFO`, `NORMAL`, `URGENTE`, `EMERGENCIA`).

---
### Vista: ChecklistTemplatesView.vue (Ruta: `/bitacora/checklist`)
* **Permiso/Rol Requerido:** `GUARDIA` / `ADMINISTRADOR` (cargos PRESIDENTE, SECRETARIO)
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/bitacora/checklist-templates/{tipo}`, `PUT /condominios/{cid}/bitacora/checklist-templates/{tipo}`, `DELETE /condominios/{cid}/bitacora/checklist-templates/{tipo}`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** GUARDIA o ADMIN con cargos.
- [ ] **Funcionalidad & CRUD:** CRUD de plantillas de checklist por tipo de evento.
- [ ] **Integración Backend / BD:** Opera sobre templates reales en backend.
- [ ] **Estados de Carga y Errores:** Spinner; Toast en operaciones.
- [ ] **Empty States:** "No hay plantillas para este tipo de evento".
- [ ] **Responsividad & UX:** Lista de items checklist; drag to reorder? (verificar).
- [ ] **Tema & Consistencia UI:** Checkbox + input por item.

---
### Vista: AutorizacionesView.vue (Ruta: `/autorizaciones`)
* **Permiso/Rol Requerido:** `GUARDIA` / `ADMINISTRADOR` (cargos PRESIDENTE, SECRETARIO)
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/autorizaciones`, `GET /condominios/{cid}/autorizaciones/{id}`, `PATCH /condominios/{cid}/autorizaciones/{id}/cancelar`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** GUARDIA o ADMIN con cargos.
- [ ] **Funcionalidad & CRUD:** Lista de autorizaciones de acceso; ver detalle; cancelar.
- [ ] **Integración Backend / BD:** Datos reales; acciones persisten.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** "No hay autorizaciones registradas".
- [ ] **Responsividad & UX:** Cards/tabla con filtros.
- [ ] **Tema & Consistencia UI:** Badge estado.

---
### Vista: SolicitudesView.vue (Ruta: `/solicitudes`)
* **Permiso/Rol Requerido:** `GUARDIA`
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/solicitudes-registro` **(BLOQUEADO — backend 404)**

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo GUARDIA.
- [ ] **Funcionalidad & CRUD:** Lista de solicitudes de registro pendientes; aprobar/rechazar.
- [ ] **Integración Backend / BD:** ⚠️ **BLOQUEADO**: El endpoint `solicitudes-registro` devuelve 404 (no existe `SolicitudesController` en backend).
- [ ] **Estados de Carga y Errores:** Muestra error 404 o lista vacía.

---

### 2.4 Perfil: Administrador de Condominio

Vistas accesibles con rol `ADMINISTRADOR` en condominio. Algunas rutas requieren cargos específicos.

---
### Vista: AdminDashboardView.vue (Ruta: `/dashboard`)
* **Permiso/Rol Requerido:** `ADMINISTRADOR` (cargos PRESIDENTE, SECRETARIO, DELEGADO)
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/dashboard/admin`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** ADMIN con cargos; sin cargo no accede.
- [ ] **Funcionalidad & CRUD:** Dashboard administrativo con métricas del condominio.
- [ ] **Integración Backend / BD:** Datos reales vía `dashboardService`.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** N/A.
- [ ] **Responsividad & UX:** Grid de tarjetas métricas.
- [ ] **Tema & Consistencia UI:** Cards con indicadores numéricos.

---
### Vista: ResidentesView.vue (Ruta: `/residentes`)
* **Permiso/Rol Requerido:** `ADMINISTRADOR` (cargos PRESIDENTE, SECRETARIO)
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/personas`, `POST /condominios/{cid}/personas`, `PUT /condominios/{cid}/personas/{id}`, `PATCH /condominios/{cid}/personas/{id}/desactivar`, `POST /condominios/{cid}/personas/{pid}/usuario`, `GET /condominios/{cid}/vinculos`, `POST /condominios/{cid}/vinculos`, `PATCH /condominios/{cid}/vinculos/{id}/desactivar`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** ADMIN con cargos PRESIDENTE/SECRETARIO.
- [ ] **Funcionalidad & CRUD:** CRUD completo de residentes; vinculación a unidades; creación de usuario.
- [ ] **Integración Backend / BD:** CRUD real; vinculación persiste.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast; confirmación en desactivar.
- [ ] **Empty States:** "No hay residentes registrados".
- [ ] **Responsividad & UX:** DataTable con búsqueda; diálogos de creación/edición.
- [ ] **Tema & Consistencia UI:** Avatar + nombre; badges de estado activo/inactivo.

---
### Vista: UnidadesView.vue (Ruta: `/unidades`)
* **Permiso/Rol Requerido:** `ADMINISTRADOR` (cargos PRESIDENTE, SECRETARIO)
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/unidades`, `POST /condominios/{cid}/unidades`, `PUT /condominios/{cid}/unidades/{id}`, `PATCH /condominios/{cid}/unidades/{id}/desactivar`, `GET /condominios/{cid}/sectores`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** ADMIN con cargos.
- [ ] **Funcionalidad & CRUD:** CRUD de unidades (departamentos/casas); sectores.
- [ ] **Integración Backend / BD:** CRUD real.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** "No hay unidades registradas".
- [ ] **Responsividad & UX:** DataTable; formulario de creación.
- [ ] **Tema & Consistencia UI:** Número de unidad + tipo.

---
### Vista: VehiculosView.vue (Ruta: `/vehiculos`)
* **Permiso/Rol Requerido:** `ADMINISTRADOR` (cargo PRESIDENTE)
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/vehiculos`, `POST /condominios/{cid}/vehiculos`, `PUT /condominios/{cid}/vehiculos/{id}`, `PATCH /condominios/{cid}/vehiculos/{id}/desactivar`, `POST /condominios/{cid}/vehiculos/{id}/estacionamiento`, `DELETE /condominios/{cid}/vehiculos/{id}/estacionamiento`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo ADMIN con cargo PRESIDENTE.
- [ ] **Funcionalidad & CRUD:** CRUD vehículos; asignación de estacionamiento.
- [ ] **Integración Backend / BD:** CRUD real.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** "No hay vehículos registrados".
- [ ] **Responsividad & UX:** DataTable con búsqueda por patente; edición inline o diálogo.
- [ ] **Tema & Consistencia UI:** Badge de patente; colores por tipo de vehículo.

---
### Vista: PersonalView.vue (Ruta: `/personal`)
* **Permiso/Rol Requerido:** `ADMINISTRADOR` (cargos PRESIDENTE, SECRETARIO)
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/personal`, `PUT /condominios/{cid}/personal/roles`, `DELETE /condominios/{cid}/personal/{uid}`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** ADMIN con cargos.
- [ ] **Funcionalidad & CRUD:** Lista de personal; asignar/remover roles.
- [ ] **Integración Backend / BD:** CRUD real vía `usePersonal` (TanStack Query).
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** "No hay personal registrado".
- [ ] **Responsividad & UX:** DataTable con Select de roles.
- [ ] **Tema & Consistencia UI:** Chips de rol; colores por tipo.

---
### Vista: SolicitudesAdminView.vue (Ruta: `/solicitudes-admin`)
* **Permiso/Rol Requerido:** `ADMINISTRADOR` (cargos PRESIDENTE, SECRETARIO)
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/solicitudes-registro` **(BLOQUEADO — backend 404)**

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** ADMIN con cargos.
- [ ] **Funcionalidad & CRUD:** Aprobación/rechazo de solicitudes de registro.
- [ ] **Integración Backend / BD:** ⚠️ **BLOQUEADO**: Mismo endpoint 404 que `SolicitudesView`.
- [ ] **Estados de Carga y Errores:** Muestra error o lista vacía.

---
### Vista: ArchivosView.vue (Ruta: `/archivos`)
* **Permiso/Rol Requerido:** `ADMINISTRADOR` (cargos PRESIDENTE, SECRETARIO, TESORERO)
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/archivos?categoria=...`, `POST /condominios/{cid}/archivos/solicitar-url`, `POST /condominios/{cid}/archivos/confirmar`, `DELETE /condominios/{cid}/archivos/{id}`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** ADMIN con cargos.
- [ ] **Funcionalidad & CRUD:** Lista archivos por categoría; subir archivos (R2/Google Drive); eliminar.
- [ ] **Integración Backend / BD:** Operación real de 2 fases (solicitar URL → subir → confirmar); invalidación de caché.
- [ ] **Estados de Carga y Errores:** Skeleton; barra de progreso en subida; Toast.
- [ ] **Empty States:** "No hay archivos en esta categoría".
- [ ] **Responsividad & UX:** Grid de archivos con vista previa; subida drag & drop.
- [ ] **Tema & Consistencia UI:** Iconos por tipo de archivo; categorías con tabs.

---
### Vista: ConfiguracionAlmacenamientoView.vue (Ruta: `/configuracion-almacenamiento`)
* **Permiso/Rol Requerido:** `ADMINISTRADOR` / `SUPER_ADMIN` (permiso `ALMACENAMIENTO_CONFIGURAR`)
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/configuracion-almacenamiento`, `PUT /condominios/{cid}/configuracion-almacenamiento`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** ADMIN o SUPER_ADMIN con permiso específico.
- [ ] **Funcionalidad & CRUD:** Configuración de proveedor almacenamiento (R2/Google Drive); credenciales.
- [ ] **Integración Backend / BD:** CRUD real vía `useConfiguracionAlmacenamiento`.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** N/A.
- [ ] **Responsividad & UX:** Formulario de configuración; inputs sensibles enmascarados.
- [ ] **Tema & Consistencia UI:** Select de proveedor; inputs fluid.

---
### Vista: PlantillasNotificacionView.vue (Ruta: `/notificaciones/plantillas`)
* **Permiso/Rol Requerido:** `ADMINISTRADOR`
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/notificaciones/plantillas`, `PUT /condominios/{cid}/notificaciones/plantillas/{codigo}`, `DELETE /condominios/{cid}/notificaciones/plantillas/{codigo}`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo ADMINISTRADOR.
- [ ] **Funcionalidad & CRUD:** CRUD de plantillas de notificación.
- [ ] **Integración Backend / BD:** CRUD real.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** "No hay plantillas definidas".
- [ ] **Responsividad & UX:** Lista con editor de plantilla.
- [ ] **Tema & Consistencia UI:** Editor de texto; vista previa.

---
### Vista: ReglasNotificacionView.vue (Ruta: `/notificaciones/reglas`)
* **Permiso/Rol Requerido:** `ADMINISTRADOR` / `SUPER_ADMIN`
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/personal/reglas-notificacion`, `PUT /condominios/{cid}/personal/reglas-notificacion/{tipo}`, `DELETE /condominios/{cid}/personal/reglas-notificacion/{tipo}`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** ADMIN o SUPER_ADMIN.
- [ ] **Funcionalidad & CRUD:** Configuración de reglas de notificación por tipo de evento.
- [ ] **Integración Backend / BD:** CRUD real vía `useReglasNotificacion`.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** "No hay reglas configuradas".
- [ ] **Responsividad & UX:** Tabla de reglas; toggle por tipo.
- [ ] **Tema & Consistencia UI:** Switches; badges de tipo.

---
### Vista: AnunciosView.vue (Ruta: `/anuncios`)
* **Permiso/Rol Requerido:** `ADMINISTRADOR` (cargos PRESIDENTE, SECRETARIO)
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/anuncios`, `POST /condominios/{cid}/anuncios`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** ADMIN con cargos.
- [ ] **Funcionalidad & CRUD:** Crear y listar anuncios del condominio.
- [ ] **Integración Backend / BD:** CRUD real.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** "No hay anuncios publicados".
- [ ] **Responsividad & UX:** Timeline de anuncios; editor de creación.
- [ ] **Tema & Consistencia UI:** Cards de anuncio con fecha.

---
### Vista: MiembrosView.vue (Ruta: `/miembros`)
* **Permiso/Rol Requerido:** Cargos PRESIDENTE, SECRETARIO
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/miembros`, `POST /condominios/{cid}/miembros`, `PATCH /condominios/{cid}/miembros/{id}/desactivar`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo cargos (sin rol específico en meta).
- [ ] **Funcionalidad & CRUD:** CRUD de miembros del comité/administración.
- [ ] **Integración Backend / BD:** CRUD real.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** "No hay miembros registrados".
- [ ] **Responsividad & UX:** DataTable; asignación de cargos.
- [ ] **Tema & Consistencia UI:** Badge de cargo.

---
### Vista: CasosAdminView.vue (Ruta: `/casos-admin`)
* **Permiso/Rol Requerido:** Cargos PRESIDENTE, SECRETARIO
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/casos`, `POST /condominios/{cid}/casos/{id}/seguimientos`, `PATCH /condominios/{cid}/casos/{id}/cerrar`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo cargos.
- [ ] **Funcionalidad & CRUD:** Gestión de casos del condominio; seguimientos; cierre.
- [ ] **Integración Backend / BD:** CRUD real.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** "No hay casos registrados".
- [ ] **Responsividad & UX:** Lista de casos con timeline.
- [ ] **Tema & Consistencia UI:** Prioridad con colores.

---
### Vistas de Finanzas (Cargos PRESIDENTE, TESORERO)

---
### Vista: FinanzasDashboardView.vue (Ruta: `/finanzas`)
* **Permiso/Rol Requerido:** Cargos PRESIDENTE, TESORERO
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/finanzas/dashboard`, `GET /condominios/{cid}/dashboard/finanzas`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo cargos financieros.
- [ ] **Funcionalidad & CRUD:** Dashboard financiero con métricas, gráficos, resumen.
- [ ] **Integración Backend / BD:** Datos reales.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** N/A.
- [ ] **Responsividad & UX:** Gráficos responsivos.

---
### Vista: GastosView.vue (Ruta: `/finanzas/gastos`)
* **Permiso/Rol Requerido:** Cargos PRESIDENTE, TESORERO
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/finanzas/gastos`, `POST /condominios/{cid}/finanzas/gastos`, `PATCH /condominios/{cid}/finanzas/gastos/{id}/anular`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo cargos.
- [ ] **Funcionalidad & CRUD:** Lista de gastos; registrar gasto; anular.
- [ ] **Integración Backend / BD:** CRUD real vía `usePaginacion`.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** "No hay gastos registrados".
- [ ] **Responsividad & UX:** DataTable paginada.
- [ ] **Tema & Consistencia UI:** Montos con formato CLP.

---
### Vista: CuentasView.vue (Ruta: `/finanzas/cuentas`)
* **Permiso/Rol Requerido:** Cargo PRESIDENTE
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/finanzas/cuentas`, `POST /condominios/{cid}/finanzas/cuentas`, `PUT /condominios/{cid}/finanzas/cuentas/{id}`, `PATCH /condominios/{cid}/finanzas/cuentas/{id}/desactivar`

---
### Vista: PagosView.vue (Ruta: `/finanzas/pagos`)
* **Permiso/Rol Requerido:** Cargos PRESIDENTE, TESORERO
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/finanzas/pagos`, `POST /condominios/{cid}/finanzas/pagos`
* **Composables:** `useUnidades`, `usePaginacion`

---
### Vista: GastosComunesView.vue (Ruta: `/gastos-comunes`)
* **Permiso/Rol Requerido:** Cargos PRESIDENTE, TESORERO
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/gastos-comunes`, `POST /condominios/{cid}/gastos-comunes`

---
### Vista: CargosAdicionalesView.vue (Ruta: `/finanzas/cargos`)
* **Permiso/Rol Requerido:** Cargos PRESIDENTE, TESORERO, SECRETARIO
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/finanzas/cargos-adicionales`, `POST /condominios/{cid}/finanzas/cargos-adicionales`, `PATCH /condominios/{cid}/finanzas/cargos-adicionales/{id}/anular`
* **Composables:** `useUnidades`

---
### Vista: LedgerView.vue (Ruta: `/finanzas/ledger`)
* **Permiso/Rol Requerido:** Cargos PRESIDENTE, TESORERO
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/finanzas/ledger`
* **Composables:** `usePaginacion`

---
### Vista: PlantillasGastoView.vue (Ruta: `/finanzas/plantillas`)
* **Permiso/Rol Requerido:** Cargos PRESIDENTE, TESORERO
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/finanzas/plantillas`, `POST /condominios/{cid}/finanzas/plantillas`, `PUT /condominios/{cid}/finanzas/plantillas/{id}`, `DELETE /condominios/{cid}/finanzas/plantillas/{id}`

---
### Vista: CategoriasView.vue (Ruta: `/finanzas/categorias`)
* **Permiso/Rol Requerido:** Cargos PRESIDENTE, TESORERO
* **Endpoints Backend Asociados:** `GET /condominios/{cid}/finanzas/categorias`, `POST /condominios/{cid}/finanzas/categorias`, `DELETE /condominios/{cid}/finanzas/categorias/{id}`

**Matriz de Verificación QA (aplicable a todas las vistas de finanzas):**
- [ ] **RBAC & Control de Acceso:** Solo cargos específicos por ruta; sin cargo, redirige.
- [ ] **Funcionalidad & CRUD:** CRUD completo; montos con formato moneda; validaciones de negocio.
- [ ] **Integración Backend / BD:** Datos reales; operaciones persisten; invalidación de queries tras cambios.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast; errores de negocio mostrados.
- [ ] **Empty States:** Mensaje amigable según recurso.
- [ ] **Responsividad & UX:** DataTable responsiva; formularios modales; filtros por período.
- [ ] **Tema & Consistencia UI:** Montos con `text-success`/`text-danger`; iconos financieros PrimeIcons.

---

### 2.5 Perfil: SuperAdmin SaaS

Vistas accesibles con roles globales `SUPER_ADMIN` y `SOPORTE`. No requieren selección de condominio.

---
### Vista: SuperAdminDashboardView.vue (Ruta: `/superadmin`)
* **Permiso/Rol Requerido:** `SUPER_ADMIN`
* **Componentes Hijos Usados:** _Ninguno_
* **Endpoints Backend Asociados:** `GET /admin/metrics`, `GET /admin/condominios`

**Matriz de Verificación QA:**
- [ ] **RBAC & Control de Acceso:** Solo SUPER_ADMIN; redirige si no tiene el rol.
- [ ] **Funcionalidad & CRUD:** Dashboard con métricas globales (condominios activos, usuarios, ingresos).
- [ ] **Integración Backend / BD:** Datos reales vía `adminService`.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast.
- [ ] **Empty States:** N/A.
- [ ] **Responsividad & UX:** Grid de tarjetas; gráficos.
- [ ] **Tema & Consistencia UI:** Dashboard-style con números grandes.

---
### Vista: SaasPlanesView.vue (Ruta: `/superadmin/planes`)
* **Permiso/Rol Requerido:** `SUPER_ADMIN`
* **Endpoints Backend Asociados:** `GET /admin/planes`, `POST /admin/planes`, `PUT /admin/planes/{id}`, `PATCH /admin/planes/{id}/desactivar`

---
### Vista: SaasCondominioDetailView.vue (Ruta: `/superadmin/condominios/:id`)
* **Permiso/Rol Requerido:** `SUPER_ADMIN`
* **Endpoints Backend Asociados:** `GET /admin/condominios/{id}`, `PATCH /admin/condominios/{id}`, `POST /admin/condominios/{id}/suspender`, `POST /admin/condominios/{id}/reactivar`

---
### Vista: SaasUsuariosView.vue (Ruta: `/superadmin/condominios/:id/usuarios`)
* **Permiso/Rol Requerido:** `SUPER_ADMIN`
* **Endpoints Backend Asociados:** `GET /admin/condominios/{id}/usuarios`, `PATCH /admin/condominios/{id}/usuarios/{uid}/activar`, `PATCH /admin/condominios/{id}/usuarios/{uid}/desactivar`, `POST /admin/condominios/{id}/usuarios/{uid}/roles/{rol}`, `DELETE /admin/condominios/{id}/usuarios/{uid}/roles/{rol}`

---
### Vista: SaasSuscripcionView.vue (Ruta: `/superadmin/condominios/:id/suscripcion`)
* **Permiso/Rol Requerido:** `SUPER_ADMIN`
* **Endpoints Backend Asociados:** `GET /admin/condominios/{id}/suscripcion`, `PUT /admin/condominios/{id}/suscripcion/plan`, `POST /admin/condominios/{id}/suscripcion/pago`

---
### Vista: SaasOnboardingView.vue (Ruta: `/superadmin/condominios/:id/onboarding`)
* **Permiso/Rol Requerido:** `SUPER_ADMIN`
* **Endpoints Backend Asociados:** `GET /admin/condominios/{id}/onboarding`, `POST /admin/condominios/{id}/onboarding/tareas/{codigo}/completar`

---
### Vista: SaasModulosView.vue (Ruta: `/superadmin/condominios/:id/modulos`)
* **Permiso/Rol Requerido:** `SUPER_ADMIN`
* **Endpoints Backend Asociados:** `GET /admin/condominios/{id}/modulos`, `PUT /admin/condominios/{id}/modulos`

---
### Vista: SaasAuditoriaView.vue (Ruta: `/superadmin/auditoria`)
* **Permiso/Rol Requerido:** `SUPER_ADMIN` / `SOPORTE`
* **Endpoints Backend Asociados:** `GET /admin/auditoria`, `GET /admin/condominios/{id}/auditoria`

---
### Vista: PermisosMatrixView.vue (Ruta: `/superadmin/permisos`)
* **Permiso/Rol Requerido:** `SUPER_ADMIN`
* **Endpoints Backend Asociados:** _Ninguno (no hay imports de servicios en la vista)_

---
### Vista: CargosPermisosView.vue (Ruta: `/superadmin/permisos/cargos`)
* **Permiso/Rol Requerido:** `SUPER_ADMIN`
* **Endpoints Backend Asociados:** _Ninguno (no hay imports de servicios en la vista)_

**Matriz de Verificación QA (aplicable a todas las vistas de SuperAdmin):**
- [ ] **RBAC & Control de Acceso:** Solo SUPER_ADMIN/SOPORTE según meta; rutas sin condominio segment.
- [ ] **Funcionalidad & CRUD:** CRUD completo según recurso; gestión global de condominios.
- [ ] **Integración Backend / DB:** Datos reales; endpoints scoped a `/admin/...`.
- [ ] **Estados de Carga y Errores:** Skeleton; Toast; manejo de errores 403/404.
- [ ] **Empty States:** Mensajes según contexto.
- [ ] **Responsividad & UX:** DataTables; navegación con tabs; parámetros de ruta para `:id`.
- [ ] **Tema & Consistencia UI:** Mismo diseño que app principal; diferenciación visual de contexto SaaS.

---

## 3. Bugs y Pendientes Descubiertos

### 3.1 Tabla de Hallazgos

| ID | Vista | Descripción del Bug / Pendiente | Prioridad | Estado |
|---|---|---|---|---|
| BUG-001 | `SolicitudesView.vue` | Endpoint `GET /condominios/{cid}/solicitudes-registro` devuelve 404. No existe `SolicitudesController` en el backend. Vista sin datos funcionales. | 🔴 Alta | Abierto |
| BUG-002 | `admin/SolicitudesAdminView.vue` | Mismo bug que BUG-001. Ruta duplicada para admin con el mismo endpoint bloqueado. | 🔴 Alta | Abierto |
| BUG-003 | `PortonView.vue` | No existe endpoint de búsqueda por patente dedicado en `VehiculoController`. Usa `GET /vehiculos` + filtro local (workaround ineficiente). | 🟡 Media | Abierto |
| BUG-004 | `useVisitas.js` | No migrado a TanStack Query. Usa `ref` + `CACHE_KEY = "cache_visitas"` manual. Incumple estándar de AGENTS.md. | 🟡 Media | Abierto |
| BUG-005 | `PermisosMatrixView.vue` | No importa ningún servicio. Posiblemente sin implementación funcional de backend. | 🟡 Media | Abierto |
| BUG-006 | `CargosPermisosView.vue` | No importa ningún servicio. Posiblemente sin implementación funcional de backend. | 🟡 Media | Abierto |
| BUG-007 | `MisPermisosView.vue` | No importa servicios. Lee de `authStore.permisos`; verificar que los permisos se hidraten correctamente tras `tryRestoreSession()`. | 🟢 Baja | Pendiente |
| BUG-008 | Multi-tenant | `useReglasNotificacion` importa `personalService` y `personalService.js` usa `cid`, pero el composable se usa desde rutas SUPER_ADMIN. Verificar scoping. | 🟢 Baja | Pendiente |
| BUG-009 | `SolicitudesView.vue` | Es un placeholder — no importa ningún servicio. Posiblemente inacabada. | 🟡 Media | Abierto |
| BUG-010 | `SolicitudesAdminView.vue` | Es un placeholder — no importa ningún servicio. Posiblemente inacabada. | 🟡 Media | Abierto |
| BUG-011 | `RegistrarVisitaView.vue` | Eliminado `buscarFrecuente()` porque `GET /accesos/frecuentes` no está expuesto. Verificar que no haya llamado huérfano. | 🟢 Baja | Pendiente |
| BUG-012 | Enums | Verificar que `TipoAutorizacion`, `EstadoAcceso`, `TipoEncomienda` en vistas coinciden exactamente con enums del backend (sin hardcode de labels). | 🟢 Baja | Pendiente |

### 3.2 Checklist Arquitectónico Global

- [ ] **Sin datos mock** — ninguna vista/composable importa datos falsos.
- [ ] **Servicios sin estado** — ningún service importa stores ni tiene reactividad.
- [ ] **Composables con TanStack Query** — excepto `useVisitas` (ver BUG-004) y `usePermisos`.
- [ ] **Query keys incluyen `condominioActualId`** — verificado en 10/11 composables.
- [ ] **Optimistic updates** — `useEncomiendas` implementa rollback en `onError`; verificar otros.
- [ ] **`console.error` en catch blocks** — verificar que todos los composables lo implementan.
- [ ] **Auth store no contiene datos de catálogo** — solo sesión y contexto multi-tenant.
- [ ] **Proactive refresh a los 14 min** — implementado en `refreshScheduler`.
- [ ] **Interceptor 401 con cola** — implementado en `api.js`.
- [ ] **Push lifecycle** — `inicializar()` en login/restore, `destruir()` en logout.
- [ ] **Subida R2 con fetch (no Axios)** — implementado en `archivosService` (verificar).
- [ ] **`pnpm build` pasa sin errores** — verificar antes de release.
- [ ] **No colores Tailwind genéricos** — no usar `text-gray-*`, `text-black`, `text-white`.
- [ ] **Colores semánticos** — usar `text-surface-*` o `text-info/success/warning/danger`.

---

## 4. Anexos

### A. Mapa de Navegación por Perfil

```
SUPER_ADMIN ─── SuperAdminDashboard
                ├── SaasPlanes
                ├── SaasAuditoria
                ├── SaasCondominioDetail
                │   ├── SaasUsuarios
                │   ├── SaasSuscripcion
                │   ├── SaasOnboarding
                │   └── SaasModulos
                ├── PermisosMatrix
                ├── CargosPermisos
                ├── ReglasNotificacion
                ├── ConfiguracionAlmacenamiento
                ├── Notificaciones
                ├── Menu
                ├── Perfil
                └── MisPermisos

SOPORTE ─────── SaasAuditoria
                ├── Notificaciones
                ├── Menu
                ├── Perfil
                └── MisPermisos

ADMINISTRADOR ── Dashboard
                ├── Residentes
                ├── Unidades
                ├── Vehiculos (solo PRESIDENTE)
                ├── SolicitudesAdmin
                ├── Personal
                ├── Archivos
                ├── ConfiguracionAlmacenamiento
                ├── PlantillasNotificacion
                ├── ReglasNotificacion
                ├── Anuncios
                ├── Miembros (cargos)
                ├── CasosAdmin (cargos)
                │
                ├── Porton (PRESIDENTE)
                ├── Visitas (PRESIDENTE)
                ├── RegistrarVisita (PRESIDENTE)
                ├── Encomiendas
                ├── Bitacora (cargos)
                ├── ChecklistTemplates (cargos)
                ├── Autorizaciones (cargos)
                │
                ├── [Finanzas] (PRESIDENTE/TESORERO)
                │   ├── FinanzasDashboard
                │   ├── Gastos
                │   ├── Cuentas (solo PRESIDENTE)
                │   ├── Pagos
                │   ├── GastosComunes
                │   ├── CargosAdicionales (+ SECRETARIO)
                │   ├── Ledger
                │   ├── PlantillasGasto
                │   └── Categorias
                │
                ├── Notificaciones
                ├── Menu
                ├── Perfil
                └── MisPermisos

GUARDIA ──────── GuardiaDashboard
                ├── Porton
                ├── Encomiendas
                ├── Bitacora
                ├── Autorizaciones
                ├── Solicitudes
                ├── ChecklistTemplates
                ├── Notificaciones
                ├── Menu
                ├── Perfil
                └── MisPermisos

RESIDENTE ────── Inicio
                ├── MiUnidad
                ├── MisEncomiendas
                ├── MisAutorizaciones
                ├── MisDeudas
                ├── MisCasos
                ├── Gestiones
                ├── Notificaciones
                ├── Menu
                ├── Perfil
                ├── MisPermisos
                └── Configuracion
                │
                └── [Contexto Cargo] (si aplica)
                    ├── Dashboard
                    ├── FinanzasDashboard (TESORERO)
                    └── (según cargo)
```

### B. Árbol de Componentes Compartidos

```
src/components/
├── NotificationBanner.vue
├── FiltroFechas.vue
├── bitacora/
│   ├── TurnoCard.vue
│   ├── ChecklistDialog.vue
│   ├── EventoCard.vue
│   └── NovedadDialog.vue
└── layout/
    ├── BottomNavigation.vue
    ├── NotificacionPopover.vue
    ├── AppHeader.vue
    ├── AppFooter.vue
    └── AppHeaderLogin.vue
```

### C. Servicios vs. Endpoints (Agrupado)

| Servicio | Base Path | # Endpoints |
|---|---|---|
| `authService.js` | `/auth/...` | 6 |
| `adminService.js` | `/admin/...` | 25+ |
| `perfilService.js` | `/me`, `/condominios/{cid}/...` | 10+ |
| `condominiosService.js` | `/me/condominios` | 1 |
| `permisosService.js` | `/me/permisos` | 1 |
| `almacenamientoService.js` | `/condominios/{cid}/configuracion-almacenamiento` | 2 |
| `visitasService.js` | `/condominios/{cid}/accesos/...` | 6 |
| `autorizacionesService.js` | `/condominios/{cid}/autorizaciones/...` | 5 |
| `encomiendasService.js` | `/condominios/{cid}/encomiendas/...` | 6 |
| `archivosService.js` | `/condominios/{cid}/archivos/...` | 5 |
| `casosService.js` | `/condominios/{cid}/casos/...` | 6 |
| `bitacoraService.js` | `/condominios/{cid}/bitacora/...` | 10 |
| `personalService.js` | `/condominios/{cid}/personal/...` | 6 |
| `personasService.js` | `/condominios/{cid}/personas/...` | 12+ |
| `unidadesService.js` | `/condominios/{cid}/unidades/...` | 6 |
| `vehiculosService.js` | `/condominios/{cid}/vehiculos/...` | 8 |
| `busquedaService.js` | `/condominios/{cid}/busqueda/...` | 3 |
| `notificacionesService.js` | `/condominios/{cid}/notificaciones/...` | 8 |
| `finanzasService.js` | `/condominios/{cid}/finanzas/...`, `/condominios/{cid}/gastos-comunes/...` | 20+ |
| `anunciosService.js` | `/condominios/{cid}/anuncios/...` | 3 |
| `miembrosService.js` | `/condominios/{cid}/miembros/...` | 3 |
| `solicitudesService.js` | `/condominios/{cid}/solicitudes-registro/...` | 5 |
| `dashboardService.js` | `/condominios/{cid}/dashboard/...` | 3 |
| `pushManager.js` | `/push/...`, `/condominios/{cid}/notificaciones/badge` | 4 |

---

*Fin del QA Checklist — generado automáticamente mediante escaneo de código fuente.*
