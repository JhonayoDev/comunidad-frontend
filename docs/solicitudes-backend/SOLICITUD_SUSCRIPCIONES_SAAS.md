> **MIGRADO A ISSUE** — Project `Gestion Comunidad Briku`
> Backend: `JhonayoDev/briku#89` · Frontend: `JhonayoDev/comunidad-frontend#38`
> Documento conservado como borrador/trazabilidad.

# Ciclo de vida de suscripciones SaaS (gracia configurable, avisos y suspensión)

> **Repo backend:** `JhonayoDev/briku` · **Repo frontend:** `JhonayoDev/comunidad-frontend`
> **Fecha:** 2026-10-17 · **Prioridad:** alta (afecta cobranza y retención)

## 1. Objetivo

Alinear el ciclo de vida de la suscripción con el modelo comercial de SaaS:

- **`PAGADO`**: acceso completo.
- **`ATRASADO` (gracia)**: **acceso completo** (lectura y escritura). El servicio no se degrada.
- **`SUSPENDIDO`**: **bloqueo real** (como hoy), sin borrar datos.

Los avisos de facturación se muestran **solo a los contactos de facturación** del condominio (presidente, administrador, tesorero), **no** a residentes/guardias/conserjes. Sin pasarela de pago por ahora; se dejan los puntos de extensión preparados.

## 2. Decisiones de producto (cerradas)

| Tema | Decisión |
|---|---|
| Gracia (`ATRASADO`) | Acceso completo; solo aviso a contactos de facturación |
| Suspensión (`SUSPENDIDO`) | Bloqueo real (comportamiento actual) |
| Días de gracia | **Por plan**: `BASICO` = 5, `PRO` = 10. Default global = 5 |
| Aviso previo al vencimiento | **5 días** antes |
| Contactos de facturación | rol `ADMINISTRADOR` + cargo `ADMINISTRADOR` + cargo `PRESIDENTE` + cargo `TESORERO` |
| Pasarela de pago | **No** por ahora. CTA = "Contactar soporte". Puntos de extensión documentados |
| Configuración | Variables de entorno (sin tocar código) + override por plan en BD |

## 3. Estado actual (análisis del backend)

### 3.1 Campos

| Tabla | Campo | Valores / uso |
|---|---|---|
| `condominios` | `status_pago` (`StatusPago`) | `PENDIENTE` (default), `PAGADO`, `ATRASADO`, `SUSPENDIDO` |
| `condominios` | `activo` | `true`/`false` (false = bloqueo total, hoy también al suspender) |
| `condominios` | `bloqueado_hasta` | timestamp; fin de la ventana de gracia (solo `ATRASADO`) |
| `condominios` | `fecha_vencimiento` | **no la usa el job ni el filtro** (dato muerto) |
| `suscripciones` | `estado` (`EstadoSuscripcion`) | `ACTIVA`, `ATRASADA`, `CANCELADA`, `EXPIRADA` |
| `suscripciones` | `fecha_fin` | vencimiento **real** que evalúa el job |
| `usuario_condominios` | `activo` | acceso por usuario |
| `usuarios` | `credenciales_version` | `cv` del JWT; `++` invalida todos los tokens |

### 3.2 Transiciones

| Transición | Disparador | Efecto |
|---|---|---|
| → `PENDIENTE` | Crear condominio (`SaasAdminService.crear`, `:198`) | `activo=true`, suscripción `ACTIVA` con `fechaFin=now+30d`, módulos on |
| → `ATRASADO` | Job horario (`SuscripcionExpirationJob:58`, cron `0 0 * * * *`) | Busca suscripciones `ACTIVA` con `fechaFin<now`; si `fechaFin > now-5d`: `statusPago=ATRASADO`, `bloqueadoHasta=fechaFin+5d`, suscripción `ATRASADA` |
| → `SUSPENDIDO` (auto) | Mismo job, rama `!dentroDeGracia` | `SUSPENDIDO`, `activo=false`, `bloqueadoHasta=null`, suscripción `EXPIRADA`, desactiva todos los `usuario_condominios`, `cv++` |
| → `PAGADO` | `POST .../suscripcion/pago` (`SuscripcionService.registrarPago:143`) | suscripción `ACTIVA`, `pagadoEn`, `statusPago=PAGADO`, `fechaVencimiento`, `bloqueadoHasta=null` |
| → `SUSPENDIDO` (manual) | `POST /admin/condominios/{id}/suspender` (`SaasAdminService.suspender:364`) | `activo=false`, `SUSPENDIDO`, desactiva usuarios, `cv++` |
| → `PAGADO` (manual) | `POST /admin/condominios/{id}/reactivar` (`SaasAdminService.reactivar:400`) | `activo=true`, `PAGADO`, reactiva usuarios |
| Renovación | `PUT /admin/condominios/{id}/suscripcion/plan` (`SuscripcionService.cambiarPlan:94`) | Cancela la activa y crea nueva `ACTIVA` con `fechaFin=now+30/365` |

### 3.3 Efectos

| Estado | `SuscripcionBloqueoFilter:95-108` | Acceso / listado |
|---|---|---|
| `PENDIENTE` | pasa | normal |
| `PAGADO` | pasa | normal |
| `ATRASADO` + `bloqueadoHasta>now` | **403 a POST/PUT/PATCH/DELETE** (gracia); GET ok | normal |
| `ATRASADO` + `bloqueadoHasta<=now` | pasa todo | normal |
| `SUSPENDIDO` / `activo=false` | **403 a todo (incluso GET)** | `/me/condominios` lo oculta; usuarios desactivados; JWT inválido (401) |

### 3.4 Problemas detectados (corregir en esta implementación)

1. **`ATRASADO` no escala a `SUSPENDIDO` automáticamente.** El job pasa la suscripción a `ATRASADA` y `findActivasVencidas` (`SuscripcionRepository:34`) solo busca `ACTIVA` → nunca la vuelve a procesar. Evidencia en BD local: los 3 condominios están `ATRASADO` con `bloqueado_hasta` vencido (14–15 oct) y hoy permiten escribir.
2. **`registrarPago` no actualiza `Suscripcion.fecha_fin`** (solo `Condominio.fecha_vencimiento`). El job la ve vencida otra vez y la re-marca `ATRASADO`; si el pago fue tardío, la suspende de inmediato.
3. **`registrarPago` no restaura `activo` ni `usuario_condominios`**: si estaba `SUSPENDIDO`, pagar no devuelve el acceso.
4. **`cambiarPlan` no limpia `statusPago`/`bloqueadoHasta`**: renovar plan no saca de solo-lectura ni de suspendido.
5. **`reactivar` no ajusta la suscripción**: si sigue vencida y `ACTIVA`, el job la vuelve a marcar `ATRASADO`.
6. **`statusPago` no llega a admin/presidente/tesorero**: `CondominioResumen:21` lo deja `null` para no-globales; `CondominioInfo` (dashboard) no lo tiene.
7. **No hay avisos ni emails de dunning** al responsable/contactos (solo auditoría).
8. **`fecha_vencimiento` está duplicada/muerta** frente a `suscripciones.fecha_fin`.
9. **`bloqueo-automatico-habilitado`**: el comentario dice "off en test" pero no está seteado; no está declarado en `application.yaml`.

## 4. Contrato propuesto

### 4.1 Configuración explícita (sin tocar código)

Agregar a `application.yaml` (los defaults actuales del `@Value` se mantienen):

```yaml
app:
  saas:
    periodo-gracia-dias: ${SAAS_PERIODO_GRACIA_DIAS:5}
    dias-aviso-previo: ${SAAS_DIAS_AVISO_PREVIO:5}
    permitir-escritura-en-gracia: ${SAAS_ESCRITURA_EN_GRACIA:true}
    bloqueo-automatico-habilitado: ${SAAS_BLOQUEO_AUTOMATICO_HABILITADO:true}
  jobs:
    suscripcion-expiration: ${SAAS_CRON_EXPIRACION:0 0 * * * *}
```

Documentar las variables en `env.example` / `env.md`. Nota: `@Value("${app.saas.periodo-gracia-dias:5}")` ya acepta `APP_SAAS_PERIODO_GRACIA_DIAS` por *relaxed binding*; declararlo lo hace explícito.

### 4.2 Gracia por plan (migración)

```sql
-- V79__plan_periodo_gracia_dias.sql
ALTER TABLE planes ADD COLUMN IF NOT EXISTS periodo_gracia_dias INT;

UPDATE planes SET periodo_gracia_dias = 5  WHERE codigo = 'BASICO';
UPDATE planes SET periodo_gracia_dias = 10 WHERE codigo = 'PRO';
```

Regla efectiva (backend):

```
gracia = COALESCE(plan.periodo_gracia_dias, app.saas.periodo-gracia-dias)
```

`Plan.periodoGraciaDias` (nullable) + fallback global.

### 4.3 Máquina de estados (correcciones)

- **Job**: evaluar por `condominio.statusPago` + fechas, no solo por `Suscripcion.estado='ACTIVA'`. Consulta recomendada: suscripciones `estado IN ('ACTIVA','ATRASADA')` con `fechaFin < now`, o bien condominios `statusPago IN ('PENDIENTE','ATRASADO')`.
  - Gracia: `bloqueadoHasta = fechaFin + gracia(plan)`. Si cambian los días de gracia, recalcular.
  - Escalar a `SUSPENDIDO` cuando `now >= bloqueadoHasta` (idempotente).
  - Incluir `Suscripcion.estado='ATRASADA'` en la consulta para no quedar atascado.
- **`registrarPago`**:
  - Actualizar `Suscripcion.fechaFin = nuevaFechaVencimiento` (fin de día, TZ Chile), `estado=ACTIVA`, `pagadoEn`, `montoPagado`.
  - `Condominio.statusPago=PAGADO`, `bloqueadoHasta=null`.
  - Si el condominio estaba `SUSPENDIDO`/`activo=false`: **reactivar acceso automáticamente** (misma lógica de `reactivar`: `activo=true`, reactivar `usuario_condominios`, invalidar cache).
- **`reactivar`**: además de acceso, dejar la suscripción en un estado vigente (`ACTIVA` + `fechaFin` futura, p. ej. `now+30d` o parámetro `nuevaFechaVencimiento`) para que el job no la re-suspenda.
- **`cambiarPlan`**: al crear la nueva suscripción activa, limpiar `bloqueadoHasta`; definir explícitamente si también marca `PAGADO` (recomendado: **no** asumir pago; si estaba `SUSPENDIDO`, requerir `reactivar`).
- **Gracia = acceso completo**: en `SuscripcionBloqueoFilter`, **no** bloquear métodos mutantes por `ATRASADO` cuando `app.saas.permitir-escritura-en-gracia=true` (default). Mantener el bloqueo de `SUSPENDIDO`.
- **Fuente única**: unificar `fecha_vencimiento` con `suscripciones.fecha_fin` (o deprecar la primera).

### 4.4 Endpoint de estado (para el frontend)

```http
GET /api/v1/condominios/{condominioId}/suscripcion/estado
```

- **Autorización**: solo contactos de facturación (`ADMINISTRADOR` rol/cargo, `PRESIDENTE`, `TESORERO`). `SUPER_ADMIN`/`SOPORTE` cross-tenant con auditoría. Otros roles → 403.
- **Response**:

```json
{
  "condominioId": "uuid",
  "estado": "ATRASADO",
  "statusPago": "ATRASADO",
  "periodoActualFin": "2026-10-31",
  "graciaHasta": "2026-11-05",
  "diasRestantes": 0,
  "diasGraciaRestantes": 2,
  "montoAdeudado": null,
  "puedeLeer": true,
  "puedeEscribir": true,
  "avisos": [
    {
      "tipo": "EN_GRACIA",
      "severidad": "warn",
      "mensaje": "La suscripción del condominio está vencida. Mantendremos el servicio activo durante 2 días de gracia.",
      "cta": "Contactar soporte"
    }
  ]
}
```

- `avisos[]` es la fuente de verdad para el banner; el frontend no recalcula reglas.
- `montoAdeudado` queda `null` hasta integrar pasarela.

### 4.5 Mensajes (copy profesional)

| Tipo | Cuándo | Mensaje |
|---|---|---|
| `POR_VENCER` | 5 días antes de `periodoActualFin` | "Tu suscripción vence el {fecha} (en 5 días). Regulariza el pago para evitar la suspensión del servicio." |
| `EN_GRACIA` | vencida, dentro de gracia | "La suscripción del condominio está vencida. El servicio seguirá activo durante {diasGracia} días de gracia. Regulariza el pago para evitar la suspensión." |
| `SUSPENDIDO` | al suspender | "El servicio del condominio está suspendido por pago pendiente. Contacta a soporte para reactivarlo." |
| `REACTIVADO` | al reactivar | "El servicio del condominio fue reactivado. Gracias por regularizar tu pago." |

CTA única por ahora: **"Contactar soporte"**.

### 4.6 Notificaciones (dunning)

- Nuevos `TipoNotificacion`: `SUSCRIPCION_POR_VENCER`, `SUSCRIPCION_VENCIDA`, `SUSCRIPCION_SUSPENDIDA`, `SUSCRIPCION_REACTIVADA`.
- Nueva audiencia `TipoAudiencia.CONTACTOS_FACTURACION` (o reutilizar `ADMINISTRADORES` + cargos; recomendado: audiencia dedicada).
- Canales: in-app + email. **Nunca** a residentes/guardias/conserjes.
- Momentos: T-5 días, día 0 (vencida/gracia), día de suspensión, reactivación.
- Plantillas seed (estilo V75) con el copy de §4.5.

### 4.7 Contactos de facturación

Helper reutilizable (autorización + notificaciones):

```
esContactoFacturacion(usuario, condominioId) =
     rol global ADMINISTRADOR
  || cargo activo en {ADMINISTRADOR, PRESIDENTE, TESORERO}
```

- Debe considerar `usuario_condominios`, `usuario_roles` y `miembros_condominio`.
- `contactos(cid)` devuelve las personas para email/in-app.
- Regla completa: `tieneAcceso(usuario, cid) && (rolGlobal == ADMINISTRADOR || cargoActivo in {ADMINISTRADOR, PRESIDENTE, TESORERO})`.

### 4.7.1 D1 — Aviso de `SUSPENDIDO` a contactos de facturación (resuelto)

**Opción 1 (acceso in-app focalizado).** No desactivar `usuario_condominios` ni incrementar `credenciales_version` al suspender:

- `suspender()`: solo `activo=false`, `statusPago=SUSPENDIDO`, `bloqueadoHasta=null`, invalidar cache. Quitar `desactivarTodosEnCondominio` + `incrementarCredencialesVersionByIdIn`.
- `reactivar()`: solo `activo=true`, `PAGADO`, `bloqueadoHasta=null`, invalidar cache. Quitar `reactivarTodosEnCondominio`.
- `SuscripcionBloqueoFilter`: con `suspendido`, permitir solo `GET .../suscripcion/estado` (y opcional `GET .../suscripcion`) si `esContactoFacturacion`; el resto 403. `/me/condominios` no pasa por el filtro.
- `listarAccesibles`: incluir suspendidos **solo** para contactos de facturación y poblar `statusPago`; para el resto, excluirlos.
- `registrarPago`: `activo=true` si estaba suspendido + invalidar cache.
- No usar `cv++` selectivo: `credenciales_version` es por usuario y desloguearía de otros condominios.
- FE: si `statusPago=SUSPENDIDO`, no llamar endpoints operativos; solo estado + shell de suspensión. Tratar 403 de suspensión como "sin acceso".

### 4.8 Puntos de extensión para pasarela de pago (NO implementar ahora)

Dejar documentado (y opcionalmente interfaces vacías) para una futura integración:

- Puerto `PasarelaPago` (`crearSuscripcion`, `cobrar`, `mapearWebhook`, `cancelar`) con una implementación no-op por ahora.
- `SuscripcionService.registrarPago` es el **único punto de entrada** interno; la pasarela lo invocará.
- Futuro webhook: `POST /api/v1/webhooks/pagos/{proveedor}` (público, validación de firma, idempotencia por `evento_id`).
- Columnas reservadas (opcionales, si se quieren dejar desde ya): `suscripciones.proveedor_pago`, `suscripciones.external_subscription_id`, `condominios.external_customer_id`.
- Frontend: la CTA cambia de "Contactar soporte" a "Pagar ahora" cuando exista checkout.

### 4.9 Acompañamiento frontend

- `useEstadoSuscripcion` consume `GET .../suscripcion/estado`.
- `AvisoSuscripcion.vue` global en `MainLayout` (no por vista), visible solo a contactos de facturación.
- Copy y severidad salen de `avisos[]`.
- Sin pasarela: botón "Contactar soporte".
- Para no-contactos: sin montos ni estado de pago. En `SUSPENDIDO`, mensaje neutro ("Servicio temporalmente no disponible").

## 5. Migraciones

- **V79** `plan_periodo_gracia_dias.sql`: `planes.periodo_gracia_dias` + `BASICO=5`, `PRO=10`.
- **V80** (si aplica): catálogo/plantillas de las 4 notificaciones + audiencia `CONTACTOS_FACTURACION`.
- Sin cambios de esquema para pasarela (solo documentación) salvo que se decidan las columnas reservadas.

## 6. Criterios de aceptación

1. Cambiar días de gracia globales o por plan **no requiere tocar código** (env / BD).
2. `BASICO` = 5 días, `PRO` = 10 días (override sobre el global).
3. En `ATRASADO` el condominio **puede leer y escribir**; los contactos de facturación ven el aviso en su dashboard.
4. Aviso previo a los 5 días del vencimiento.
5. En `SUSPENDIDO` el bloqueo es real; los contactos ven el aviso de suspensión y los demás un mensaje neutro.
6. Registrar pago actualiza `fecha_fin`, limpia `bloqueadoHasta` y **reactiva** el acceso si estaba suspendido.
7. El job escala correctamente `PENDIENTE → ATRASADO → SUSPENDIDO` de forma idempotente (sin quedarse atascado).
8. Los avisos de facturación **nunca** llegan a residentes/guardias/conserjes.
9. `GET .../suscripcion/estado` devuelve 403 a roles que no son contactos de facturación.
10. Auditoría de cada transición + tests de las transiciones, del override por plan y del scoping por rol.

## 7. Fuera de alcance

- Implementación de pasarela de pago (Webpay/Mercado Pago/Stripe), checkout, webhooks reales.
- Reintentos automáticos de tarjeta, prorrateo, facturas/boletas, impuestos y multi-moneda.
- Portal de autogestión de pago del cliente.

## 8. Referencias

- `SuscripcionExpirationJob.java` (`:58` job, `:88` gracia, `:100` suspensión)
- `SuscripcionRepository.java:34` (`findActivasVencidas`, solo `ACTIVA`)
- `SuscripcionService.java` (`:53` crearInicial, `:94` cambiarPlan, `:143` registrarPago)
- `SaasAdminService.java` (`:198` crear `PENDIENTE`, `:364` suspender, `:400` reactivar)
- `SuscripcionBloqueoFilter.java:95-108` (bloqueo total / solo lectura), `:125` cache 60s
- `CondominioAccessService.java:43` (`listarAccesibles` filtra `activo`), `:164` (`obtenerIdsCondominiosAccesibles`)
- `CondominioResumen.java:21` (`statusPago` solo SUPER_ADMIN/SOPORTE)
- `CondominioInfo.java` (dashboard admin sin `statusPago`)
- Frontend: `src/services/api.js:52-57` (solo `moduleNotSubscribed`), `src/stores/authStore.js:42-48` (`condominioActualRol`/`condominioActualCargo`)
