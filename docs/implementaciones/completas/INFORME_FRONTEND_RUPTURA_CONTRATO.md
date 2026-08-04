# Informe para Frontend — Ruptura de contrato tras cierre de auditoría SaaS

**Para:** Equipo Frontend
**De:** Backend (`com.space.comunidad`)
**Fecha:** 2026-08-04
**Rama backend:** `refactor/organizacionmultidespluiege` (commits `aa3c5bb` + `5cd855e`)
**Alcance:** notificar los cambios de contrato que afectan vistas ya construidas y los aditivos que NO rompen, para que el equipo ajuste antes de integrar.

---

## 1. Resumen ejecutivo

El backend cerró la auditoría SaaS con dos bloques de correcciones. Cuatro de esos cambios **rompen el contrato** que las vistas del frontend ya construidas esperan:

1. **Gating de módulos en notificaciones** — `/notificaciones/**` ahora puede responder **403** si el condominio no tiene el módulo `COMUNICACION`.
2. **Error 403 en streams SSE ya no es JSON** — responde `text/event-stream` sin body.
3. **Límites de plan** — crear unidades / activar usuarios / asignar personal puede responder **409** al superar el límite del plan.
4. **RESIDENTE solo ve sus propios archivos** — `GET /archivos` filtra por `subidoPor` para usuarios solo-RESIDENTE.

Además hay 3 **aditivos que NO rompen** (impersonación, `iss`/`aud` en JWT, login sin cambios) documentados en §4.

El backend ya está verificado (suite de tests completa en verde).

---

## 2. Tabla de rupturas

| # | Ruptura | Antes | Ahora | Vistas/archivos frontend afectados |
|---|---|---|---|---|
| **1** | `@RequiresModule(COMUNICACION)` en notificaciones | 200 siempre | **403** `{"status":403,"error":"Forbidden","message":"El condominio no tiene suscrito el módulo COMUNICACION"}` si el condominio no tiene el módulo habilitado | `views/notificaciones/NotificacionesView.vue`, `components/layout/NotificacionPopover.vue`, `composables/useNotificaciones.js`, `useNotificacionesTiempoReal.js`, `useNotificationBadge.js`, `services/pushManager.js` (`/badge`), `layouts/MainLayout.vue` (stream), `views/admin/PlantillasNotificacionView.vue`, `views/gestion/ReglasNotificacionView.vue` |
| **2** | 403 en streams SSE ya no es JSON | 403 JSON (rompía la negociación SSE → `HttpMediaTypeNotAcceptableException`/406) | **403 con `Content-Type: text/event-stream` y sin body** | `services/dashboardStreamService.js`, `services/residenteStreamService.js`, `services/notificacionesStreamService.js` |
| **3** | Límites de plan en escrituras | Creación/activación siempre OK | **409** `{"status":409,"error":"Conflict","message":"El plan contratado permite hasta X…"}` | `views/admin/UnidadesView.vue`, `views/admin/ResidentesView.vue`, `views/admin/PersonalView.vue` + `composables/usePersonal.js`, `views/superadmin/SaasUsuariosView.vue`, `views/gestion/UnidadesPersonasView.vue` |
| **4** | RESIDENTE solo ve sus archivos | Veía todos los archivos del condominio | Solo ve los suyos (`subidoPor = su usuario`); staff/admin ven todos | `views/storage/ArchivosView.vue` + `composables/useArchivos.js` |

---

## 3. Detalle por ruptura

### Ruptura 1 — Gating de módulos en notificaciones (403)

`NotificacionController` ahora está anotado con `@RequiresModule(ModuloCodigo.COMUNICACION)` (`NotificacionController.java:33`). Un aspecto AOP resuelve el `condominioId` del path y, si el condominio no tiene habilitado el módulo `COMUNICACION` en `condominio_modulos`, interrumpe con **403** antes de llegar al endpoint.

**Endpoints afectados** (todos bajo `/api/v1/condominios/{condominioId}/notificaciones`):
- `GET /` (listar)
- `GET /sync`
- `GET /badge`
- `GET /stream` (SSE)
- `PATCH /{notificacionId}/leida`
- `PATCH /todas-leidas`
- Plantillas (`GET/PUT/DELETE /plantillas/**`) — **nota:** el `PlantillasNotificacionController` no está gated todavía, solo `NotificacionController`.

**Respuesta 403 real:**
```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "El condominio no tiene suscrito el módulo COMUNICACION",
  "timestamp": "2026-08-04T10:30:00",
  "fields": null
}
```

**Cómo distinguir del 403 por permisos:** ambos son 403 con la misma estructura. Diferenciar por `message`:
- Módulo no suscrito → `message` contiene `"no tiene suscrito el módulo"`.
- Sin permiso → `"No tienes permisos para realizar esta acción"` (`GlobalExceptionHandler.handleAccessDenied`).

**Acción frontend:**
- Hoy no hay manejo global de 403 en `src/services/api.js` (solo 401 y 429). Agregar un manejo de 403: si `message` contiene `"módulo"`, la vista de notificaciones debe mostrar un estado "módulo no contratado" (ocultar/deshabilitar la bandeja, sin spinners eternos).
- Los módulos se administran en el panel SaaS (`condominio_modulos`), no es un error del usuario final — el copy no debe sugerir reintentar.

---

### Ruptura 2 — 403 en streams SSE ya no es JSON

`GlobalExceptionHandler.handleAccessDenied` ahora detecta `Accept: text/event-stream` y responde 403 con `Content-Type: text/event-stream` **y body null**, en vez de JSON (que forzaba una `HttpMediaTypeNotAcceptableException` al no haber converter para SSE).

**Aplicable a los 3 streams:**
- `/dashboard/stream` → `services/dashboardStreamService.js`
- `/dashboard/residente/stream` → `services/residenteStreamService.js`
- `/notificaciones/stream` → `services/notificacionesStreamService.js`

**Impacto real:** los 3 stream services ya hacen `if (!resp.ok) throw new Error('SSE respondió HTTP ' + resp.status)` y reintentan con backoff 1s→30s. **No requiere cambios** — este fix elimina el error secundario 406 y el stream simplemente se reconecta.

**Contrato para no romper:** en el cliente SSE no parsear el body de una respuesta con `status >= 400` (ahora puede estar vacío). La señal de error es solo el código HTTP.

**Inconsistencia menor conocida:** en `notificaciones/stream`, si el condominio no tiene el módulo, el 403 llega como **JSON** (la rama SSE solo aplica a `AccessDeniedException`, no a `ModuleNotSubscribedException`). El stream service lo detecta igual por `!resp.ok` y reconecta.

---

### Ruptura 3 — Límites de plan en escrituras (409)

Los límites numéricos del plan ahora se hacen cumplir al escribir:

| Endpoint | Límite | Ejemplo de `message` |
|---|---|---|
| `POST /api/v1/condominios/{cid}/unidades` | `unidadLimit` | `"El plan contratado permite hasta 100 unidades. Ya hay 100 activas — elige otro plan o elimina unidades existentes."` |
| `PATCH /api/v1/admin/condominios/{cid}/usuarios/{usuarioId}/activar` | `usuarioLimit` | `"El plan contratado permite hasta 50 cuentas de usuario activas. Ya hay 50 — elige otro plan o desactiva usuarios existentes."` |
| `PUT /api/v1/condominios/{cid}/personal/roles` (solo alta NUEVA; actualizar rol no valida) | `usuarioLimit` | igual que arriba |

**Respuesta 409 real:**
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "El plan contratado permite hasta 100 unidades. Ya hay 100 activas — elige otro plan o elimina unidades existentes.",
  "timestamp": "2026-08-04T10:30:00",
  "fields": null
}
```

**Acción frontend:**
- Hoy el interceptor no maneja 409 (solo los flujos de Reset/Setup password lo hacen localmente). Agregar manejo local en las vistas de **Unidades**, **Personas/Residentes**, **Personal** y **SaasUsuarios**: capturar `409` y mostrar `error.message` al usuario como estado informativo (no toast fatal).
- Sugerir upgrade de plan o desactivar registros existentes (el mensaje del backend ya lo indica).

---

### Ruptura 4 — RESIDENTE solo ve sus propios archivos

`StorageApplicationService.listarPorCategoria(condominioId, categoria, usuario)` ahora filtra por `subidoPor == usuario.id` cuando el usuario es **solo-RESIDENTE** (`esSoloResidente`, `StorageApplicationService.java`). Staff (ADMINISTRADOR, GUARDIA) y globales (SUPER_ADMIN, SOPORTE) siguen viendo todos.

**Criterio exacto:** el usuario tiene rol `RESIDENTE` y NO tiene ninguno de `SUPER_ADMIN`, `SOPORTE`, `ADMINISTRADOR`, `GUARDIA`. (Ej: la PRESIDENTA con rol global `RESIDENTE` es tratada como solo-residente en archivos.)

**Impacto:** un RESIDENTE que no ha subido archivos verá una **lista vacía** donde antes veía los archivos del condominio.

**Acción frontend:**
- En `views/storage/ArchivosView.vue` (y `useArchivos.js`), para roles solo-RESIDENTE manejar el estado vacío con copy propio: "Aquí verás los archivos que tú subas" (no "no hay archivos").
- No intentar listar archivos de otros usuarios por `subidoPor` desde el cliente — el backend filtra en el servidor.

---

## 4. Aditivos (NO rompen — informativo)

### 4.1 Impersonación (Nuevo endpoint, solo SUPER_ADMIN/SOPORTE)

`POST /api/v1/admin/usuarios/{usuarioId}/impersonar`

Devuelve un `accessToken` temporal (30 min, `app.jwt.impersonation-expiration-ms`) cuyo sujeto es el usuario objetivo:

```json
{
  "accessToken": "<JWT>",
  "email": "usuario-objetivo@test.com",
  "expiresAt": "2026-08-04T11:00:00",
  "impersonatedByUsuarioId": "00000000-0000-0000-0098-000000000001",
  "impersonatedByEmail": "admin@sistema.com",
  "impersonatedUsuarioId": "00000000-0000-0000-0006-000000000007",
  "impersonatedEmail": "francisca.morales@test.com"
}
```

- El token impersonado lleva claims `is_impersonating: true` y `impersonated_by`. Opera con los permisos del objetivo.
- **Acciones destructivas de plataforma quedan bloqueadas** bajo impersonación.
- Toda acción se audita con la identidad real del admin (`SaasAuditLog.impersonatedBy*`).
- El frontend puede ignorarlo por ahora; si se quiere una UI, el flujo es: admin → llama a impersonar → guarda el `accessToken` en memoria como si fuera un login → al operar el JWT identifica la impersonación.

### 4.2 JWT `iss` / `aud`

El access token ahora se firma con `issuer: com.space.comunidad` y `audience: comunidad-web` (`JwtService`). Son claims internos RFC 7519 — **el frontend no los parsea** (guarda el token opaco en memoria), así que no hay impacto.

### 4.3 Login / refresh sin cambios

El body de `POST /auth/login` y `POST /auth/refresh` no cambió (`LoginResponse`: `accessToken`, `personaId`, `nombre`, `email`, `condominioId`, `condominioNombre`, `roles`). El refreshToken sigue viajando como cookie httpOnly.

---

## 5. Checklist de ajustes frontend

- [ ] **`src/services/api.js`**: agregar manejo global de `403` (distinguir `message` contiene "módulo" → estado "módulo no contratado").
- [ ] **`src/services/api.js` / vistas**: agregar manejo de `409` para las escrituras de unidades, activación de usuarios y alta de personal — mostrar `error.message` como estado informativo.
- [ ] **`views/notificaciones/*` + `NotificacionPopover` + `useNotificationBadge`**: manejar el 403 por módulo sin dejar spinners ni errores en loop.
- [ ] **`views/storage/ArchivosView.vue` + `useArchivos.js`**: estado vacío con copy para solo-RESIDENTE.
- [ ] **`views/admin/UnidadesView.vue`, `ResidentesView.vue`, `PersonalView.vue`, `SaasUsuariosView.vue`, `UnidadesPersonasView.vue`**: capturar 409 del plan y mostrar mensaje.
- [ ] **Stream services (`dashboardStreamService`, `residenteStreamService`, `notificacionesStreamService`)**: NO cambiar; ya reintentan. Verificar que no parseen body en `status >= 400`.
- [ ] Opcional: UI de impersonación en superadmin (usar `ImpersonacionResponse`).

---

## 6. Referencias backend

- `src/main/java/com/space/comunidad/domain/comunicacion/controller/NotificacionController.java:33` — `@RequiresModule(COMUNICACION)`.
- `src/main/java/com/space/comunidad/infrastructure/security/module/ModuloAccessAspect.java` — aspecto de gating.
- `src/main/java/com/space/comunidad/infrastructure/exception/GlobalExceptionHandler.java:149-186` — 403 SSE y 403 módulo.
- `src/main/java/com/space/comunidad/domain/unidad/service/UnidadService.java:75-105` — `validarLimiteUnidades`.
- `src/main/java/com/space/comunidad/domain/admin/service/AdminUsuarioService.java:188-208` — `validarLimiteUsuarios`.
- `src/main/java/com/space/comunidad/domain/usuario/service/PersonalCondominioService.java:140-160` — `validarLimiteUsuarios`.
- `src/main/java/com/space/comunidad/domain/storage/service/StorageApplicationService.java:176-262` — filtro `subidoPor` + `esSoloResidente`.
- `src/main/java/com/space/comunidad/domain/admin/controller/AdminImpersonacionController.java` — impersonación (aditivo).
