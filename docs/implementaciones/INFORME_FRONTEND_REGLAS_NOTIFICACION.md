# Informe para Frontend — Cambios en `refactor/reglas-notificacion-catalogo-bd`

> Documento de handoff para el equipo de frontend. Resume los cambios de contrato
> de API, las decisiones de diseño y cómo implementar la UI resultante.
> Rama: `refactor/reglas-notificacion-catalogo-bd` (backend `com.space.comunidad`).

---

## 1. Resumen

El sistema de reglas de notificación pasó de un **catálogo global hardcodeado en
código** a un **catálogo global en BD** (gestionable por SUPER_ADMIN/SOPORTE), y las
**preferencias del usuario** ahora se resuelven **por condominio** (regla efectiva =
catálogo global + sobrescritura del condominio).

Cambios que afectan al frontend:

1. **`GET/PUT /api/v1/me/notificaciones/preferencias`** ahora exigen `condominioId`
   como query param obligatorio y devuelven una estructura **por canal**.
2. **`GET/PUT /api/v1/condominios/{id}/personal/reglas-notificacion`** cambian el
   formato de `canales` (CSV → array JSON) y usan enums.
3. **Nuevos endpoints admin** para gestionar el catálogo global.
4. **Nuevos permisos** `REGLA_NOTIF_VER` / `REGLA_NOTIF_GESTIONAR`.

---

## 2. Decisiones de diseño (por qué)

| Decisión                              | Detalle                                                                                                                                                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Preferencias globales por persona** | `preferencias_notificacion` sigue siendo `UNIQUE (persona_id, tipo)`. **NO** se agrega `condominio_id`. Una persona que vive en A y B tiene UNA sola configuración.                                   |
| **Tenant por contexto de request**    | No existe "condominio activo" en sesión ni en el JWT. El backend resuelve el tenant desde el path/query param de cada request. El frontend ya conoce el condominio activo (URL/store) y debe pasarlo. |
| **Obligatoriedad POR CANAL**          | Ya no es "el tipo es obligatorio o no": cada canal (`IN_APP`, `EMAIL`, `PUSH`) tiene su propia obligatoriedad.                                                                                        |
| **`visible_usuario`**                 | Controla si el tipo aparece en el panel de preferencias del usuario. Se evalúa sobre la **regla efectiva del condominio**, no sobre el catálogo global.                                               |
| **Regla efectiva**                    | `reglaEfectiva = catálogo global + sobrescritura del condominio`. La sobrescritura solo persiste los campos que difieren (`null` = heredar del global).                                               |
| **Seguridad**                         | Ambos endpoints de preferencias validan `condominioAccessService.validarAcceso(usuario, condominioId)` → 403 si el usuario no pertenece al condominio.                                                |

---

## 3. Cambios de contrato API

### 3.1 `GET /api/v1/me/notificaciones/preferencias` — **BREAKING**

**Antes:** sin parámetros.
**Ahora:** `condominioId` **obligatorio**.

```
GET /api/v1/me/notificaciones/preferencias?condominioId={uuid}
```

- Sin `condominioId` → **400**.
- `condominioId` de un condominio al que el usuario no pertenece → **403**.
- Devuelve solo los tipos con `visible_usuario = true` en la **regla efectiva** del
  condominio (no en el catálogo global).
- Solo incluye los canales que el tipo **soporta** en la regla efectiva (un tipo sin
  PUSH no devuelve la clave `PUSH`).

**Respuesta (200):**

```json
[
  {
    "tipo": "ENCOMIENDA_RECIBIDA",
    "canales": {
      "IN_APP": { "disponible": true, "obligatorio": true, "activado": true },
      "EMAIL": { "disponible": true, "obligatorio": true, "activado": true },
      "PUSH": { "disponible": true, "obligatorio": false, "activado": false }
    }
  },
  {
    "tipo": "VISITA_INGRESADA",
    "canales": {
      "IN_APP": { "disponible": true, "obligatorio": false, "activado": true },
      "PUSH": { "disponible": true, "obligatorio": false, "activado": true }
    }
  }
]
```

Semántica por canal:

- `disponible`: el canal está en la regla efectiva del condominio.
- `obligatorio`: `reglaEfectiva.esObligatorio(canal)` — no se puede desactivar.
- `activado`: valor actual de la preferencia del usuario (default `true` si no existe).

### 3.2 `PUT /api/v1/me/notificaciones/preferencias/{tipo}` — **BREAKING**

**Antes:** `condominioId` opcional.
**Ahora:** `condominioId` **obligatorio**.

```
PUT /api/v1/me/notificaciones/preferencias/ENCOMIENDA_RECIBIDA?condominioId={uuid}
Content-Type: application/json

{ "enApp": true, "email": true, "push": false, "motivo": "opcional" }
```

Respuestas:

- Sin `condominioId` → **400**.
- Condominio ajeno → **403**.
- Tipo con `visible_usuario = false` en la regla efectiva del condominio → **403**.
- Intentar desactivar un canal **obligatorio** en la regla efectiva → **400** con mensaje:

  ```
  "El canal EMAIL para ENCOMIENDA_RECIBIDA es obligatorio en este condominio y no puede desactivarse."
  ```

- Éxito → **200** con la misma estructura de `GET` (una sola entrada).

> La validación de obligatoriedad **siempre** usa la regla efectiva del condominio.
> No existe fallback al catálogo global.

### 3.3 `GET /api/v1/condominios/{id}/personal/reglas-notificacion` — **BREAKING (formato)**

`canales` cambia de **CSV string** a **array JSON**. `audiencia` y `prioridad` ahora
son enums (strings). Se agregan `esObligatoriaInapp/Email/Push` y `visibleUsuario`.

**Antes:**

```json
{
  "tipoNotificacion": "ENCOMIENDA_RECIBIDA",
  "canales": "IN_APP,EMAIL,PUSH",
  "audiencia": "UNIDAD_OCUPANTES"
}
```

**Ahora:**

```json
{
  "id": "…",
  "condominioId": "00000000-0000-0000-0000-000000000001",
  "tipoNotificacion": "ENCOMIENDA_RECIBIDA",
  "audiencia": "UNIDAD_OCUPANTES",
  "canales": ["IN_APP", "EMAIL", "PUSH"],
  "prioridad": "NORMAL",
  "habilitada": null,
  "esObligatoriaInapp": null,
  "esObligatoriaEmail": null,
  "esObligatoriaPush": null,
  "visibleUsuario": null,
  "creadoEn": "…",
  "actualizadoEn": "…"
}
```

> `null` = heredar del catálogo global. `habilitada=false` deshabilita el tipo
> completamente para ese condominio.

### 3.4 `PUT /api/v1/condominios/{id}/personal/reglas-notificacion/{tipo}` — **BREAKING (request)**

El body ahora usa enums y campos por canal. Todos los campos son **opcionales**
(`null` = no sobrescribir / heredar del global):

```json
{
  "audiencia": "UNIDAD_OCUPANTES",
  "canales": ["IN_APP", "EMAIL"],
  "prioridad": "NORMAL",
  "esObligatoriaInapp": true,
  "esObligatoriaEmail": true,
  "esObligatoriaPush": false,
  "habilitada": true,
  "visibleUsuario": true
}
```

- Enum inválido (ej. `"canales": ["SMS"]`) → **400** (Jackson valida).
- `DELETE /api/v1/condominios/{id}/personal/reglas-notificacion/{tipo}` elimina la
  sobrescritura (vuelve a la regla global).

### 3.5 NUEVO — Admin: catálogo global de reglas

Solo `SUPER_ADMIN` / `SOPORTE`. Permisos `REGLA_NOTIF_VER` (lectura) y
`REGLA_NOTIF_GESTIONAR` (edición).

```
GET  /api/v1/admin/notificaciones/catalogo            → lista las 16 reglas
GET  /api/v1/admin/notificaciones/catalogo/{tipo}     → una regla (404 si no existe)
PUT  /api/v1/admin/notificaciones/catalogo/{tipo}     → edita (404 si no existe)
```

**Respuesta (GET):**

```json
{
  "tipoNotificacion": "ENCOMIENDA_RECIBIDA",
  "audiencia": "UNIDAD_OCUPANTES",
  "canales": ["IN_APP", "EMAIL", "PUSH"],
  "prioridad": "NORMAL",
  "esObligatoriaInapp": true,
  "esObligatoriaEmail": true,
  "esObligatoriaPush": false,
  "visibleUsuario": true
}
```

**Request (PUT):** actualización **completa** — todos los campos obligatorios:

```json
{
  "audiencia": "UNIDAD_OCUPANTES",
  "canales": ["IN_APP", "EMAIL", "PUSH"],
  "prioridad": "NORMAL",
  "esObligatoriaInapp": true,
  "esObligatoriaEmail": true,
  "esObligatoriaPush": false,
  "visibleUsuario": true
}
```

Al editar se invalida el caché del catálogo → el cambio se propaga de inmediato a
todos los condominios.

---

## 4. Guía de implementación frontend

### 4.1 Panel de preferencias del usuario (`/me/notificaciones/preferencias`)

- **Siempre** enviar `?condominioId=` con el ID del condominio activo (ya disponible
  en el store/URL del frontend).
- Renderizar por tipo y por canal. Lógica de toggle:
  - `!disponible` → **no mostrar** el toggle del canal (el tipo no lo soporta).
  - `obligatorio` → toggle **bloqueado/disabled** con tooltip explicativo
    ("Este canal es obligatorio en tu condominio").
  - `!obligatorio && disponible` → toggle libre.
- Al guardar, enviar el estado de los 3 canales (`enApp`, `email`, `push`) aunque
  algunos no estén disponibles (el backend ignora los que no aplican).
- Manejar errores:
  - **400** con `message` → canal obligatorio (mostrar el mensaje del backend).
  - **403** → tipo no visible en este condominio (ocultar el tipo del panel).

### 4.2 Panel admin del condominio (`/condominios/{id}/personal/reglas-notificacion`)

- `canales` ahora es un **array** (`["IN_APP","EMAIL"]`), no un string CSV.
- Los campos `null` significan "heredar del catálogo global". Para mostrar el valor
  efectivo, el frontend debe conocer el catálogo global (endpoint admin 3.5) y
  aplicar el patch, o mostrar "Default" cuando el campo es `null`.
- `habilitada=false` → el tipo está deshabilitado en ese condominio.

### 4.3 Panel SaaS del catálogo global (`/admin/notificaciones/catalogo`)

- Solo visible para SUPER_ADMIN/SOPORTE.
- Edición completa por tipo (todos los campos obligatorios en el PUT).
- Los cambios afectan a todos los condominios que no tengan sobrescritura.

---

## 5. Enums

| Enum                    | Valores                                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CanalEntrega`          | `IN_APP`, `EMAIL`, `PUSH`                                                                                                                                                                                                                                                                                                                           |
| `PrioridadNotificacion` | `BAJA`, `NORMAL`, `ALTA`, `CRITICA`                                                                                                                                                                                                                                                                                                                 |
| `TipoAudiencia`         | `PERSONA`, `UNIDAD`, `UNIDAD_OCUPANTES`, `UNIDAD_TITULAR`, `COMITE`, `GUARDIAS`, `GUARDIAS_EN_TURNO`, `ADMINISTRADORES`, `PROPIETARIOS`, `RESIDENTES`, `TODOS`                                                                                                                                                                                      |
| `TipoNotificacion` (16) | `VISITA_PREAUTORIZADA`, `VISITA_INGRESADA`, `VISITA_RECHAZADA`, `ENCOMIENDA_RECIBIDA`, `ENCOMIENDA_ENTREGADA`, `RECLAMO_CREADO`, `RECLAMO_RESPONDIDO`, `RECLAMO_CERRADO`, `RESERVA_CREADA`, `RESERVA_APROBADA`, `RESERVA_RECHAZADA`, `GASTO_COMUN_GENERADO`, `PAGO_REGISTRADO`, `DEUDA_VENCIDA`, `ANUNCIO_GENERAL_PUBLICADO`, `DOCUMENTO_PUBLICADO` |

---

## 6. Seed del catálogo global (defaults)

Valores por defecto de los 16 tipos (migración `V54`). El panel de preferencias del
usuario muestra solo los tipos con `visible_usuario = true`:

| Tipo                      | Canales             | Obligatorio IN_APP | Obligatorio EMAIL | Obligatorio PUSH | visible_usuario |
| ------------------------- | ------------------- | ------------------ | ----------------- | ---------------- | --------------- |
| VISITA_PREAUTORIZADA      | IN_APP              | ✅                 | ❌                | ❌               | ❌              |
| VISITA_INGRESADA          | IN_APP, PUSH        | ❌                 | ❌                | ❌               | ✅              |
| VISITA_RECHAZADA          | IN_APP              | ❌                 | ❌                | ❌               | ✅              |
| ENCOMIENDA_RECIBIDA       | IN_APP, EMAIL, PUSH | ✅                 | ✅                | ❌               | ✅              |
| ENCOMIENDA_ENTREGADA      | IN_APP              | ❌                 | ❌                | ❌               | ✅              |
| RECLAMO_CREADO            | IN_APP, EMAIL, PUSH | ✅                 | ✅                | ❌               | ❌              |
| RECLAMO_RESPONDIDO        | IN_APP, EMAIL       | ❌                 | ❌                | ❌               | ✅              |
| RECLAMO_CERRADO           | IN_APP, EMAIL       | ❌                 | ❌                | ❌               | ✅              |
| RESERVA_CREADA            | IN_APP, EMAIL       | ❌                 | ❌                | ❌               | ❌              |
| RESERVA_APROBADA          | IN_APP, EMAIL, PUSH | ✅                 | ✅                | ❌               | ✅              |
| RESERVA_RECHAZADA         | IN_APP, EMAIL, PUSH | ✅                 | ✅                | ❌               | ✅              |
| GASTO_COMUN_GENERADO      | IN_APP, EMAIL, PUSH | ✅                 | ✅                | ❌               | ✅              |
| PAGO_REGISTRADO           | IN_APP, PUSH        | ❌                 | ❌                | ❌               | ✅              |
| DEUDA_VENCIDA             | IN_APP, EMAIL, PUSH | ✅                 | ✅                | ✅               | ✅              |
| ANUNCIO_GENERAL_PUBLICADO | IN_APP, EMAIL, PUSH | ❌                 | ❌                | ❌               | ✅              |
| DOCUMENTO_PUBLICADO       | IN_APP              | ❌                 | ❌                | ❌               | ✅              |

> Solo `DEUDA_VENCIDA` tiene PUSH obligatorio. Los tipos con `visible_usuario = false`
> (`VISITA_PREAUTORIZADA`, `RECLAMO_CREADO`, `RESERVA_CREADA`) **no** aparecen en el
> panel de preferencias del usuario.

---

## 7. Notas de seguridad y operación

- **`validarAcceso`** en GET y PUT de preferencias: un usuario no puede consultar ni
  modificar preferencias con el `condominioId` de un condominio al que no pertenece
  (evita fuga de configuración y saltarse validaciones de obligatoriedad).
- **Bypass de roles globales** (SUPER_ADMIN/SOPORTE) en `validarAcceso` es intencional
  por diseño (AGENTS.md §2) y consistente con `SuscripcionBloqueoFilter`.
- **Caché del catálogo:** Caffeine TTL 5 min; se invalida al editar vía admin. Un
  cambio global puede tardar hasta 5 min en reflejarse si no se edita por el endpoint.
- **Migraciones nuevas:** `V54` (tabla + seed catálogo), `V55` (columnas por canal en
  sobrescrituras), `V56` (permisos `REGLA_NOTIF_VER`/`REGLA_NOTIF_GESTIONAR`).

---

## 8. Checklist de migración frontend

- [ ] Agregar `?condominioId=` a `GET` y `PUT` de `/me/notificaciones/preferencias`.
- [ ] Adaptar el render del panel de preferencias a la estructura `canales` por canal
      (`disponible` / `obligatorio` / `activado`).
- [ ] Manejar 400 (canal obligatorio) y 403 (tipo no visible) en el PUT.
- [ ] Adaptar `GET/PUT /condominios/{id}/personal/reglas-notificacion` a `canales`
      como array y a los campos por canal.
- [ ] Implementar el panel SaaS del catálogo global (nuevos endpoints admin).
- [ ] Mostrar "Default" cuando los campos de sobrescritura vienen `null`.
