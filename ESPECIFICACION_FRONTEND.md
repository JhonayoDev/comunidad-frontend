# Especificación Frontend — Comunidad API

> **Proyecto:** Comunidad — Plataforma SaaS para Administración de Condominios  
> **Backend:** Spring Boot 4.0.5 / Java 17 / PostgreSQL 16 / JWT  
> **Propósito:** Guía completa para el desarrollo del frontend. Cubre casos de uso, datos de prueba, autenticación, endpoints, formatos de respuesta y consideraciones de UI.

---

## Índice

1. [Datos de Prueba](#1-datos-de-prueba)
   - [Usuarios Seed](#11-usuarios-seed)
   - [IDs Fijos del Seed](#12-ids-fijos-del-seed)
2. [Casos de Uso por Rol](#2-casos-de-uso-por-rol)
   - [SUPER_ADMIN](#21-super_admin)
   - [ADMINISTRADOR](#22-administrador)
   - [GUARDIA](#23-guardia)
   - [RESIDENTE](#24-residente)
   - [SOPORTE](#25-soporte)
3. [Guía de Inicio Rápido para Frontend](#3-guía-de-inicio-rápido-para-frontend)
   - [Setup del Entorno](#31-setup-del-entorno)
   - [URLs de Desarrollo](#32-urls-de-desarrollo)
   - [Flujo de Autenticación](#33-flujo-de-autenticación)
   - [Manejo de Tokens](#34-manejo-de-tokens)
   - [Interceptor HTTP](#35-interceptor-http)
4. [Modelo de Seguridad](#4-modelo-de-seguridad)
   - [Roles](#41-roles)
   - [Permisos (62 códigos)](#42-permisos-62-códigos)
   - [Matriz Rol → Permiso](#43-matriz-rol--permiso)
   - [Cargos Organizacionales](#44-cargos-organizacionales)
5. [Sitemap Completo](#5-sitemap-completo)
6. [Módulos Detallados](#6-módulos-detallados)
   - [6.1 Autenticación](#61-autenticación)
   - [6.2 Mi Perfil / Identity](#62-mi-perfil--identity)
   - [6.3 Dashboard](#63-dashboard)
   - [6.4 Unidades](#64-unidades)
   - [6.5 Personas](#65-personas)
   - [6.6 Vínculos](#66-vínculos)
   - [6.7 Vehículos](#67-vehículos)
   - [6.8 Control de Acceso — Autorizaciones](#68-control-de-acceso--autorizaciones)
   - [6.9 Control de Acceso — Registros](#69-control-de-acceso--registros)
   - [6.10 Encomiendas](#610-encomiendas)
   - [6.11 Gastos Comunes](#611-gastos-comunes)
   - [6.12 Finanzas v2 — Cuentas](#612-finanzas-v2--cuentas)
   - [6.13 Finanzas v2 — Categorías](#613-finanzas-v2--categorías)
   - [6.14 Finanzas v2 — Ledger](#614-finanzas-v2--ledger)
   - [6.15 Finanzas v2 — Pagos](#615-finanzas-v2--pagos)
   - [6.16 Finanzas v2 — Cargos Adicionales](#616-finanzas-v2--cargos-adicionales)
   - [6.17 Finanzas v2 — Gastos](#617-finanzas-v2--gastos)
   - [6.18 Finanzas v2 — Plantillas de Gasto](#618-finanzas-v2--plantillas-de-gasto)
   - [6.19 Finanzas v2 — Dashboard Financiero](#619-finanzas-v2--dashboard-financiero)
   - [6.20 Mis Deudas](#620-mis-deudas)
   - [6.21 Casos](#621-casos)
   - [6.22 Anuncios](#622-anuncios)
   - [6.23 Notificaciones](#623-notificaciones)
   - [6.24 Preferencias de Notificación](#624-preferencias-de-notificación)
   - [6.25 Plantillas de Notificación](#625-plantillas-de-notificación)
   - [6.26 Bitácora](#626-bitácora)
   - [6.27 Checklist de Bitácora](#627-checklist-de-bitácora)
   - [6.28 Gestión de Usuarios](#628-gestión-de-usuarios)
   - [6.29 Cargos / Miembros](#629-cargos--miembros)
   - [6.30 Búsqueda en Portería](#630-búsqueda-en-portería)
7. [Enums del Sistema](#7-enums-del-sistema)
8. [Formato de Respuestas de Error](#8-formato-de-respuestas-de-error)
9. [Consideraciones para el Frontend](#9-consideraciones-para-el-frontend)

---

## 1. Datos de Prueba

### 1.1 Usuarios Seed

Todas las contraseñas son `Temp2024`. El condominio de prueba se llama **"Condominio Los Robles"**.

| Email | Rol | Cargo | ¿Qué puede hacer? |
|---|---|---|---|
| `admin@sistema.com` | SUPER_ADMIN | — | Acceso global a todos los condominios. CRUD completo, puede crear ADMINS |
| `soporte@sistema.com` | SOPORTE | — | Lectura global, auditoría. Sin acceso a finanzas |
| `carlos.mendoza@test.com` | ADMINISTRADOR | — | Gestión operativa completa del condominio |
| `francisca.morales@test.com` | RESIDENTE | — | Residente de casa 5. Ve su dashboard, deudas, encomiendas |
| `ana.reyes@test.com` | RESIDENTE | PRESIDENTE | Presidenta del condominio. Dashboard admin + permisos extra |
| `roberto.fuentes@test.com` | RESIDENTE | TESORERO | Tesorero. Dashboard financiero detallado |
| `valentina.castro@test.com` | RESIDENTE | SECRETARIO | Secretaria. Acceso a gestión administrativa |
| `miguel.rojas@test.com` | GUARDIA | — | Portería: accesos, encomiendas, bitácora |
| `jorge.silva@test.com` | GUARDIA | — | Portería: accesos, encomiendas, bitácora |

### 1.2 IDs Fijos del Seed

Usa estos UUIDs para pruebas rápidas sin tener que consultar primero:

| Recurso | UUID |
|---|---|
| Condominio Los Robles | `00000000-0000-0000-0000-000000000001` |
| Sector A | `00000000-0000-0000-0001-000000000001` |
| Sector B | `00000000-0000-0000-0001-000000000002` |
| Carlos Mendoza (persona) | `00000000-0000-0000-0099-000000000001` |
| Francisca Morales (persona) | `00000000-0000-0000-0099-000000000002` |
| Miguel Rojas (persona) | `00000000-0000-0000-0099-000000000003` |
| Ana Reyes (persona) | `00000000-0000-0000-0099-000000000004` |
| Casa 5 (unidad) | `00000000-0000-0000-0088-000000000005` |

---

## 2. Casos de Uso por Rol

### 2.1 SUPER_ADMIN

```
Login → GET /me/condominios → selecciona condominio → dashboard admin
```

**Flujo principal:**
1. Login con `admin@sistema.com` / `Temp2024`
2. Obtiene lista de todos los condominios vía `GET /me/condominios`
3. Selecciona uno → redirige a dashboard admin
4. Puede gestionar **cualquier condominio** sin restricciones
5. Puede crear usuarios con rol `ADMINISTRADOR` o `SOPORTE`
6. Puede asignar/revocar cualquier rol (`ROL_GESTIONAR`)

**Pantallas disponibles:**
- Dashboard Admin (todos los condominios)
- Todos los módulos CRUD de cualquier condominio
- Gestión de usuarios y roles global

### 2.2 ADMINISTRADOR

```
Login → GET /me/condominios → dashboard admin
```

**Flujo principal:**
1. Login con `carlos.mendoza@test.com` / `Temp2024`
2. Ve su condominio asignado
3. Dashboard admin con KPIs del condominio
4. Gestión completa de personas, unidades, vínculos, vehículos
5. Gestión de accesos, autorizaciones, encomiendas
6. Gestión de finanzas (cuentas, categorías, pagos, gastos, gastos comunes)
7. Publicar anuncios, ver bitácora, gestionar casos
8. Crear usuarios con rol `RESIDENTE` o `GUARDIA`
9. Asignar cargos organizacionales

**Pantallas del menú:**
- Dashboard Admin
- Personas (CRUD)
- Unidades (CRUD)
- Vehículos (CRUD)
- Accesos (log)
- Autorizaciones (listar, cancelar)
- Encomiendas (listar, cerrar)
- Gastos Comunes (generar período, pagos)
- Finanzas v2 (dashboard, cuentas, categorías, ledger, pagos, cargos, gastos, plantillas)
- Casos (gestionar)
- Anuncios (publicar)
- Notificaciones (ver)
- Bitácora (ver eventos)
- Usuarios (gestionar)
- Miembros / Cargos (asignar)

### 2.3 GUARDIA

```
Login → GET /me/condominios → dashboard guardia
```

**Flujo principal:**
1. Login con `miguel.rojas@test.com` / `Temp2024`
2. Dashboard guardia: accesos activos ahora, encomiendas pendientes
3. Registra ingresos/egresos de visitantes
4. Registra y entrega encomiendas
5. Control de turno (inicio/fin/colación/novedades)
6. Ve autorizaciones vigentes

**Pantallas del menú:**
- Dashboard Guardia
- Accesos (registrar ingreso, registrar salida, log)
- Autorizaciones (ver lista)
- Encomiendas (registrar, entregar, activas)
- Bitácora (mi turno, registrar evento)

**Lo que NO puede hacer:**
- CRUD de personas, unidades, vehículos
- Finanzas
- Anuncios
- Casos
- Gestión de usuarios

### 2.4 RESIDENTE

```
Login → GET /me/condominios → dashboard residente
```

**Flujo principal:**
1. Login con `francisca.morales@test.com` / `Temp2024`
2. Dashboard residente: sus datos + unidades donde tiene vínculo
3. Cada unidad muestra: personas, vehículos, estado de gasto común
4. Puede crear autorizaciones de acceso para visitas
5. Ve sus encomiendas (mis-encomiendas)
6. Ve sus deudas (mis-deudas)
7. Configura preferencias de notificación
8. Marca notificaciones como leídas

**Pantallas del menú:**
- Dashboard Residente
- Mis Autorizaciones (crear, listar vigentes)
- Mis Encomiendas
- Mis Deudas
- Notificaciones (bandeja, badge)
- Preferencias de Notificación
- Mi Perfil (editar nombre, teléfono, cambiar password, cambiar email)

**Lo que NO puede hacer:**
- CRUD de personas, unidades, vehículos
- Gestión de accesos (solo ver autorizaciones propias)
- Finanzas (solo ver sus deudas)
- Bitácora
- Usuarios

### 2.5 SOPORTE

```
Login → GET /me/condominios → dashboard admin (solo lectura)
```

- Acceso de lectura/auditoría a todos los condominios
- Sin acceso a finanzas (`FINANZA_VER` no asignado)
- Útil para depuración y soporte técnico

---

## 3. Guía de Inicio Rápido para Frontend

### 3.1 Setup del Entorno

```bash
# 1. Clonar
git clone <repo-url> comunidad
cd comunidad

# 2. Configurar .env (usar defaults para dev)
cp env.example .env

# 3. Iniciar PostgreSQL
docker compose up -d postgres

# 4. Compilar y ejecutar backend
./mvnw spring-boot:run

# 5. Backend listo en http://localhost:8080
```

### 3.2 URLs de Desarrollo

| Recurso | URL |
|---|---|
| API Base | `http://localhost:8080/api/v1` |
| Swagger UI | `http://localhost:8080/api/v1/swagger-ui/index.html` |
| OpenAPI Spec | `http://localhost:8080/api/v1/api-docs` |
| Health Check | `http://localhost:8080/actuator/health` |
| Frontend (Vite) | `http://localhost:5173` (configurado en CORS) |

### 3.3 Flujo de Autenticación

```
POST /auth/login  →  200 { accessToken, refreshToken, personaId, nombre, email,
                         condominioId, condominioNombre, roles }
         │
         ▼
GET /me/condominios  →  200 [{ id, nombre, direccion, rolAcceso, cargo }]
         │
         ▼
   ¿1 solo condominio? → Sí → Seleccionar automáticamente
                        → No  → Mostrar selector al usuario
         │
         ▼
   Guardar condominioActual (id, rolAcceso, cargo) en store global
         │
         ▼
   Redirigir según rol al dashboard correspondiente
```

### 3.4 Manejo de Tokens

- **Access token** (24h): Almacenar en **memoria** (variable de estado global). **No en localStorage** por seguridad.
- **Refresh token** (7d): Almacenar en **httpOnly cookie** o en memoria según política de seguridad.
- En desarrollo se puede usar `localStorage` para agilizar.

### 3.5 Interceptor HTTP

```
Request → Interceptor → ¿401? → POST /auth/refresh → ¿200? → Reintentar request original
                                                        → ¿No? → Redirigir a /login
```

El interceptor debe:
1. Agregar header `Authorization: Bearer {accessToken}` a cada request
2. En 401, intentar refresh silencioso con `POST /auth/refresh`
3. Si refresh falla, redirigir a `/login`
4. Manejar renovación concurrente (queue de requests mientras se refresca)

---

## 4. Modelo de Seguridad

### 4.1 Roles

| Rol | Descripción | Dashboard por defecto |
|---|---|---|
| `SUPER_ADMIN` | Acceso global a todos los condominios | Admin |
| `SOPORTE` | Lectura/auditoría global, sin finanzas | Admin (solo lectura) |
| `ADMINISTRADOR` | Gestión operativa completa de un condominio | Admin |
| `GUARDIA` | Portería: accesos, encomiendas, bitácora | Guardia |
| `RESIDENTE` | Propietario o residente de una unidad | Residente |

### 4.2 Permisos (62 códigos)

Evaluados vía `@PreAuthorize("hasPermission(null, 'CODIGO')")`.

| Código | Módulo | Descripción |
|---|---|---|
| `DASHBOARD_ADMIN` | Dashboard | Dashboard administrativo |
| `DASHBOARD_FINANZAS` | Dashboard | Dashboard financiero |
| `DASHBOARD_TESORERO` | Dashboard | Dashboard financiero detallado |
| `DASHBOARD_GUARDIA` | Dashboard | Dashboard operativo de portería |
| `DASHBOARD_RESIDENTE` | Dashboard | Dashboard personal del residente |
| `PERSONA_VER` | Personas | Listar y ver detalle |
| `PERSONA_CREAR` | Personas | Crear nuevas personas |
| `PERSONA_EDITAR` | Personas | Editar personas |
| `PERSONA_ELIMINAR` | Personas | Desactivar personas |
| `UNIDAD_VER` | Unidades | Listar y ver detalle |
| `UNIDAD_CREAR` | Unidades | Crear nuevas unidades |
| `UNIDAD_EDITAR` | Unidades | Editar unidades |
| `UNIDAD_ELIMINAR` | Unidades | Desactivar unidades |
| `VINCULO_VER` | Vínculos | Ver vínculos persona-unidad |
| `VINCULO_CREAR` | Vínculos | Crear vínculos |
| `VINCULO_EDITAR` | Vínculos | Editar vínculos |
| `VINCULO_ELIMINAR` | Vínculos | Desactivar vínculos |
| `VEHICULO_VER` | Vehículos | Listar vehículos |
| `VEHICULO_CREAR` | Vehículos | Crear vehículos |
| `VEHICULO_EDITAR` | Vehículos | Editar y asignar estacionamiento |
| `VEHICULO_ELIMINAR` | Vehículos | Desactivar vehículos |
| `ACCESO_VER` | Accesos | Ver registros de acceso |
| `ACCESO_REGISTRAR_INGRESO` | Accesos | Registrar ingreso |
| `ACCESO_REGISTRAR_SALIDA` | Accesos | Registrar salida |
| `AUTORIZACION_VER` | Autorizaciones | Ver autorizaciones |
| `AUTORIZACION_CREAR` | Autorizaciones | Crear pre-autorizaciones |
| `AUTORIZACION_CANCELAR` | Autorizaciones | Cancelar autorizaciones |
| `ENCOMIENDA_VER` | Encomiendas | Ver encomiendas |
| `ENCOMIENDA_CREAR` | Encomiendas | Registrar encomiendas |
| `ENCOMIENDA_ENTREGAR` | Encomiendas | Entregar y cerrar |
| `RECLAMO_VER` | Casos | Ver casos |
| `RECLAMO_CREAR` | Casos | Crear casos |
| `RECLAMO_GESTIONAR` | Casos | Gestionar casos |
| `RESERVA_VER` | Reservas | Ver reservas |
| `RESERVA_CREAR` | Reservas | Crear reservas |
| `RESERVA_CANCELAR` | Reservas | Cancelar reservas |
| `FINANZA_VER` | Finanzas | Ver gastos comunes |
| `FINANZA_GESTIONAR` | Finanzas | Gestionar períodos y pagos |
| `CUENTA_VER` | Finanzas | Consultar cuentas financieras |
| `CUENTA_GESTIONAR` | Finanzas | Crear y editar cuentas |
| `CATEGORIA_VER` | Finanzas | Consultar categorías |
| `CATEGORIA_GESTIONAR` | Finanzas | Crear y editar categorías |
| `LEDGER_VER` | Finanzas | Consultar ledger |
| `PAGO_RESIDENTE_VER` | Finanzas | Consultar pagos |
| `PAGO_RESIDENTE_CREAR` | Finanzas | Registrar pagos |
| `GASTO_VER` | Finanzas | Consultar gastos |
| `GASTO_CREAR` | Finanzas | Registrar gastos |
| `GASTO_ANULAR` | Finanzas | Anular gastos |
| `PLANTILLA_GASTO_VER` | Finanzas | Consultar plantillas |
| `PLANTILLA_GASTO_GESTIONAR` | Finanzas | Gestionar plantillas |
| `CARGO_ADICIONAL_VER` | Finanzas | Consultar cargos |
| `CARGO_ADICIONAL_GESTIONAR` | Finanzas | Gestionar cargos |
| `MANTENCION_VER` | Finanzas | Consultar mantenciones |
| `MANTENCION_GESTIONAR` | Finanzas | Gestionar mantenciones |
| `MIS_DEUDAS_VER` | Finanzas | Ver deudas propias |
| `NOTIFICACION_VER` | Notificaciones | Ver notificaciones y preferencias |
| `NOTIFICACION_ENVIAR` | Notificaciones | Publicar anuncios |
| `CONDOMINIO_VER` | Condominio | Ver datos del condominio |
| `CONDOMINIO_EDITAR` | Condominio | Editar configuración |
| `USUARIO_GESTIONAR` | Usuarios | Gestionar cuentas y cargos |
| `ROL_GESTIONAR` | Roles | Asignar y revocar roles |
| `BITACORA_REGISTRAR` | Bitácora | Registrar eventos de turno |
| `BITACORA_VER` | Bitácora | Ver eventos de bitácora |
| `BITACORA_GESTIONAR` | Bitácora | Gestionar checklists |

### 4.3 Matriz Rol → Permiso

| Permiso | SUPER_ADMIN | ADMIN | GUARDIA | RESIDENTE | SOPORTE |
|---|---|---|---|---|---|
| `DASHBOARD_ADMIN` | ✓ | ✓ | | | ✓ |
| `DASHBOARD_FINANZAS` | ✓ | ✓ | | | |
| `DASHBOARD_GUARDIA` | ✓ | ✓ | ✓ | | ✓ |
| `DASHBOARD_RESIDENTE` | ✓ | ✓ | | ✓ | ✓ |
| `PERSONA_VER` | ✓ | ✓ | ✓ | | ✓ |
| `PERSONA_CREAR` | ✓ | ✓ | | | |
| `PERSONA_EDITAR` | ✓ | ✓ | | | |
| `PERSONA_ELIMINAR` | ✓ | ✓ | | | |
| `UNIDAD_VER` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `UNIDAD_CREAR` | ✓ | ✓ | | | |
| `UNIDAD_EDITAR` | ✓ | ✓ | | | |
| `UNIDAD_ELIMINAR` | ✓ | ✓ | | | |
| `VINCULO_VER` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `VINCULO_CREAR` | ✓ | ✓ | | | |
| `VINCULO_EDITAR` | ✓ | ✓ | | | |
| `VINCULO_ELIMINAR` | ✓ | ✓ | | | |
| `VEHICULO_VER` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `VEHICULO_CREAR` | ✓ | ✓ | ✓ | | |
| `VEHICULO_EDITAR` | ✓ | ✓ | ✓ | | |
| `VEHICULO_ELIMINAR` | ✓ | ✓ | | | |
| `ACCESO_VER` | ✓ | ✓ | ✓ | | ✓ |
| `ACCESO_REGISTRAR_INGRESO` | ✓ | ✓ | ✓ | | |
| `ACCESO_REGISTRAR_SALIDA` | ✓ | ✓ | ✓ | | |
| `AUTORIZACION_VER` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `AUTORIZACION_CREAR` | ✓ | ✓ | | ✓ | |
| `AUTORIZACION_CANCELAR` | ✓ | ✓ | | ✓ | |
| `ENCOMIENDA_VER` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ENCOMIENDA_CREAR` | ✓ | ✓ | ✓ | | |
| `ENCOMIENDA_ENTREGAR` | ✓ | ✓ | ✓ | | |
| `RECLAMO_VER` | ✓ | ✓ | | ✓ | ✓ |
| `RECLAMO_CREAR` | ✓ | ✓ | | ✓ | |
| `RECLAMO_GESTIONAR` | ✓ | ✓ | | | |
| `RESERVA_VER` | ✓ | ✓ | | ✓ | ✓ |
| `RESERVA_CREAR` | ✓ | ✓ | | ✓ | |
| `RESERVA_CANCELAR` | ✓ | ✓ | | ✓ | |
| `FINANZA_VER` | ✓ | ✓ | | | |
| `FINANZA_GESTIONAR` | ✓ | ✓ | | | |
| `CUENTA_VER` | ✓ | ✓ | | | |
| `CUENTA_GESTIONAR` | ✓ | ✓ | | | |
| `CATEGORIA_VER` | ✓ | ✓ | | | |
| `CATEGORIA_GESTIONAR` | ✓ | ✓ | | | |
| `LEDGER_VER` | ✓ | ✓ | | | |
| `PAGO_RESIDENTE_VER` | ✓ | ✓ | | | |
| `PAGO_RESIDENTE_CREAR` | ✓ | ✓ | | | |
| `GASTO_VER` | ✓ | ✓ | | | |
| `GASTO_CREAR` | ✓ | ✓ | | | |
| `GASTO_ANULAR` | ✓ | ✓ | | | |
| `PLANTILLA_GASTO_VER` | ✓ | ✓ | | | |
| `PLANTILLA_GASTO_GESTIONAR` | ✓ | ✓ | | | |
| `CARGO_ADICIONAL_VER` | ✓ | ✓ | | | |
| `CARGO_ADICIONAL_GESTIONAR` | ✓ | ✓ | | | |
| `MANTENCION_VER` | ✓ | ✓ | | | |
| `MANTENCION_GESTIONAR` | ✓ | ✓ | | | |
| `MIS_DEUDAS_VER` | ✓ | ✓ | | ✓ | |
| `NOTIFICACION_VER` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `NOTIFICACION_ENVIAR` | ✓ | ✓ | | | |
| `CONDOMINIO_VER` | ✓ | ✓ | | | ✓ |
| `CONDOMINIO_EDITAR` | ✓ | ✓ | | | |
| `USUARIO_GESTIONAR` | ✓ | ✓ | | | ✓ |
| `ROL_GESTIONAR` | ✓ | | | | |
| `BITACORA_REGISTRAR` | ✓ | ✓ | ✓ | | |
| `BITACORA_VER` | ✓ | ✓ | ✓ | | |
| `BITACORA_GESTIONAR` | ✓ | ✓ | | | |

### 4.4 Cargos Organizacionales

Se asignan a personas dentro de un condominio vía `miembros_condominio`. Otorgan permisos adicionales que se suman a los del rol base:

| Cargo | Permisos extra que otorga |
|---|---|
| `ADMINISTRADOR` | Full operativo (todos los permisos) |
| `PRESIDENTE` | Full operativo (todos los permisos) |
| `TESORERO` | Dashboard tesorero + finanzas completo |
| `SECRETARIO` | Cuentas/categorías lectura + pagos/gastos/cargos ver + gestionar |
| `DELEGADO` | Lectura administrativa + finanzas (read) |
| `CONSERJE` | Portería + encomiendas |
| `GUARDIA` | Portería + encomiendas |
| `MANTENCION` | Operativo |
| `JARDINERO` | Operativo |

**Reglas:**
- PRESIDENTE, ADMINISTRADOR, TESORERO y SECRETARIO son **singleton** (solo uno activo a la vez, 409 si se intenta asignar otro)
- Al asignar ADMINISTRADOR, GUARDIA o CONSERJE, si la persona ya tiene usuario, se activa su acceso al condominio automáticamente
- Permisos efectivos = permisos(rol) ∪ permisos(cargo activo)

---

## 5. Sitemap Completo

```
/api/v1                         ← Base URL
│
├── [PÚBLICO]
│   ├── POST /auth/login
│   ├── POST /auth/refresh
│   ├── POST /auth/forgot-password
│   ├── POST /auth/reset-password
│   ├── POST /auth/setup-password
│   ├── GET  /actuator/health
│
├── [AUTENTICADO]  /me
│   ├── GET                                    → Perfil
│   ├── PUT                                    → Actualizar nombre/teléfono
│   ├── PUT /password                          → Cambiar contraseña
│   ├── POST /email/solicitar                  → Solicitar cambio email
│   ├── POST /email/verificar                  → Verificar cambio email
│   ├── GET /condominios                       → Listar condominios
│   └── /notificaciones/preferencias
│       ├── GET                                → Listar preferencias
│       └── PUT /{tipo}                        → Actualizar preferencia
│
└── [AUTENTICADO + CONDOMINIO]  /condominios/{condominioId}
    │
    ├── /dashboard
    │   ├── GET /admin
    │   ├── GET /finanzas
    │   ├── GET /guardia
    │   └── GET /residente
    │
    ├── /unidades
    │   ├── GET                                  → Listar
    │   ├── POST                                 → Crear
    │   ├── GET /{id}                            → Detalle
    │   ├── PUT /{id}                            → Editar
    │   ├── PATCH /{id}/desactivar               → Desactivar
    │   └── GET /{id}/vinculos                   → Vínculos de la unidad
    │
    ├── /personas
    │   ├── GET                                  → Listar
    │   ├── GET /buscar?email=                   → Buscar por email
    │   ├── POST                                 → Crear
    │   ├── GET /{id}                            → Detalle
    │   ├── PUT /{id}                            → Editar
    │   ├── PATCH /{id}/desactivar               → Desactivar
    │   └── POST /{id}/usuario                   → Crear cuenta de usuario
    │
    ├── /vinculos
    │   ├── POST                                 → Crear
    │   └── PATCH /{id}/desactivar               → Desactivar
    │
    ├── /vehiculos
    │   ├── GET                                  → Listar
    │   ├── POST                                 → Crear
    │   ├── GET /{id}                            → Detalle
    │   ├── PUT /{id}                            → Editar
    │   ├── PATCH /{id}/desactivar               → Desactivar
    │   ├── POST /{id}/estacionamiento           → Asignar estacionamiento
    │   └── DELETE /{id}/estacionamiento         → Desasignar
    │
    ├── /buscar
    │   └── GET ?patente=                       → Búsqueda en portería
    │
    ├── /accesos
    │   ├── POST /ingresar                       → Registrar ingreso
    │   ├── GET                                  → Listar (?estado=)
    │   ├── GET /{id}                            → Detalle
    │   └── PATCH /{id}/salida                   → Registrar salida
    │
    ├── /autorizaciones
    │   ├── POST                                 → Crear
    │   ├── GET                                  → Listar (?estado=)
    │   ├── GET /{id}                            → Detalle
    │   └── PATCH /{id}/cancelar                 → Cancelar
    │
    ├── /mis-autorizaciones
    │   └── GET                                  → Mis autorizaciones vigentes
    │
    ├── /encomiendas
    │   ├── POST                                 → Registrar
    │   ├── GET /activas                         → Pendientes (guardia)
    │   ├── GET                                  → Con filtros (admin)
    │   ├── GET /{id}                            → Detalle + historial
    │   ├── PATCH /{id}/entregar                 → Entregar
    │   └── PATCH /{id}/cerrar                   → Cerrar
    │
    ├── /mis-encomiendas
    │   └── GET                                  → Mis encomiendas (residente)
    │
    ├── /gastos-comunes
    │   ├── POST                                 → Generar período
    │   ├── GET                                  → Listar períodos
    │   ├── GET /{id}                            → Detalle con cuotas
    │   └── PATCH /cuotas/{cuotaId}/pagar        → Registrar pago
    │
    ├── /mis-deudas
    │   └── GET                                  → Deudas del residente
    │
    ├── /finanzas
    │   ├── GET /dashboard                       → Dashboard financiero
    │   ├── GET /ledger                          → Libro mayor
    │   ├── /cuentas
    │   │   ├── GET                              → Listar
    │   │   ├── POST                             → Crear
    │   │   ├── GET /{id}                        → Detalle con saldo
    │   │   ├── PUT /{id}                        → Editar
    │   │   └── PATCH /{id}/desactivar           → Desactivar
    │   ├── /categorias
    │   │   ├── GET                              → Listar (?tipo=)
    │   │   ├── POST                             → Crear
    │   │   ├── GET /{id}                        → Detalle
    │   │   └── DELETE /{id}                     → Desactivar
    │   ├── /pagos
    │   │   ├── POST                             → Registrar pago
    │   │   ├── GET                              → Listar
    │   │   └── GET /{id}                        → Detalle
    │   ├── /cargos-adicionales
    │   │   ├── POST                             → Crear
    │   │   ├── GET                              → Listar (?estado=)
    │   │   ├── GET /{id}                        → Detalle
    │   │   └── PATCH /{id}/anular               → Anular
    │   ├── /gastos
    │   │   ├── POST                             → Registrar
    │   │   ├── GET                              → Listar
    │   │   ├── GET /{id}                        → Detalle
    │   │   └── PATCH /{id}/anular               → Anular
    │   └── /plantillas-gasto
    │       ├── GET                              → Listar
    │       ├── POST                             → Crear
    │       ├── GET /{id}                        → Detalle
    │       ├── PUT /{id}                        → Editar
    │       └── DELETE /{id}                     → Desactivar
    │
    ├── /casos
    │   ├── POST                                 → Abrir
    │   ├── GET                                  → Listar (?estado=)
    │   ├── GET /{id}                            → Detalle con timeline
    │   ├── POST /{id}/referencias               → Vincular recurso
    │   ├── POST /{id}/seguimientos              → Agregar seguimiento
    │   └── PATCH /{id}/cerrar                   → Cerrar
    │
    ├── /anuncios
    │   ├── POST                                 → Publicar
    │   ├── GET                                  → Vigentes
    │   └── GET /todos                           → Todos (admin)
    │
    ├── /notificaciones
    │   ├── GET                                  → Bandeja
    │   ├── GET /badge                           → Contador no leídas
    │   ├── PATCH /{id}/leida                    → Marcar leída
    │   └── PATCH /todas-leidas                  → Marcar todas leídas
    │
    ├── /notificaciones/plantillas
    │   ├── GET                                  → Listar
    │   ├── PUT /{codigo}                        → Guardar personalización
    │   └── DELETE /{codigo}                     → Restaurar a global
    │
    ├── /bitacora
    │   ├── POST                                 → Registrar evento
    │   ├── GET /mi-turno                        → Estado de turno actual
    │   ├── GET                                  → Listar
    │   └── GET /{id}                            → Detalle evento
    │
    ├── /bitacora/checklist-templates
    │   ├── GET /{tipoEvento}                    → Obtener checklist
    │   ├── PUT /{tipoEvento}                    → Configurar
    │   └── DELETE /{tipoEvento}                 → Desactivar
    │
    ├── /miembros
    │   ├── GET                                  → Listar cargos activos
    │   ├── POST                                 → Asignar cargo
    │   └── PATCH /{id}/desactivar               → Desactivar cargo
    │
    └── /usuarios
        ├── PATCH /{id}/activar                  → Activar usuario
        └── PATCH /{id}/desactivar               → Desactivar usuario
```

---

## 6. Módulos Detallados

### 6.1 Autenticación

**Base:** `POST /api/v1/auth/...` (público)

#### Login

```
POST /auth/login
Content-Type: application/json

{
  "email": "carlos.mendoza@test.com",
  "password": "Temp2024"
}

→ 200
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "personaId": "00000000-0000-0000-0099-000000000001",
  "nombre": "Carlos Mendoza",
  "email": "carlos.mendoza@test.com",
  "condominioId": "00000000-0000-0000-0000-000000000001",
  "condominioNombre": "Condominio Los Robles",
  "roles": ["ADMINISTRADOR"]
}
```

**UI:** Formulario email + password. No distinguir "email incorrecto" vs "password incorrecto" — siempre mostrar "Credenciales incorrectas" en 401.

#### Refresh Token

```
POST /auth/refresh
Content-Type: application/json

{ "refreshToken": "eyJhbGciOiJIUzUxMiJ9..." }

→ 200  (misma estructura que login)
→ 401  (token inválido o expirado)
```

**UI:** Usar en el interceptor HTTP cuando se recibe un 401. Si falla, redirigir a `/login`.

#### Forgot Password

```
POST /auth/forgot-password
Content-Type: application/json

{ "email": "carlos.mendoza@test.com" }

→ 200  (siempre, incluso si el email no existe — seguridad por oscuridad)
```

**UI:** Formulario email + mensaje de éxito genérico. El backend envía email con token (expira 30 min).

#### Reset Password

```
POST /auth/reset-password
Content-Type: application/json

{
  "token": "...",
  "newPassword": "NuevaPass123!",
  "confirmPassword": "NuevaPass123!"
}

→ 200  (invalida todos los JWT activos)
→ 409  (token ya usado o expirado)
```

**UI:** Formulario: nuevo password + confirmar. Token viene en URL del email.

#### Setup Password

```
POST /auth/setup-password
Content-Type: application/json

{
  "token": "...",
  "newPassword": "NuevaPass123!",
  "confirmPassword": "NuevaPass123!"
}

→ 200
→ 409  (token ya usado o expirado)
```

**UI:** Misma interfaz que reset password. Se usa para cuando un admin crea un usuario y este configura su password por primera vez. Token expira en 24h.

#### Logout

```
POST /auth/logout
Authorization: Bearer {accessToken}

→ 204
```

**UI:** Limpiar tokens del store y redirigir a `/login`.

---

### 6.2 Mi Perfil / Identity

**Base:** `/api/v1/me` (autenticado, sin condominioId)

#### Ver Perfil

```
GET /me

→ 200
{
  "personaId": "00000000-0000-0000-0099-000000000001",
  "nombre": "Carlos Mendoza",
  "email": "carlos.mendoza@test.com",
  "roles": ["ADMINISTRADOR"]
}
```

#### Actualizar Perfil

```
PUT /me
Content-Type: application/json

{ "nombre": "Carlos Mendoza G.", "telefono": "+56912345678" }

→ 200  (mismo que GET)
```

**UI:** Formulario con nombre y teléfono editables. Email NO editable desde aquí (hay flujo de 2 pasos).

#### Cambiar Contraseña

```
PUT /me/password
Content-Type: application/json

{
  "passwordActual": "Temp2024",
  "nuevaPassword": "NuevaPass123!",
  "confirmarPassword": "NuevaPass123!"
}

→ 204
```

#### Cambiar Email (2 pasos)

**Paso 1 — Solicitar:**
```
POST /me/email/solicitar
Content-Type: application/json

{ "nuevoEmail": "nuevo.email@test.com" }

→ 204  (envía token al nuevo email)
→ 409  (el email ya está registrado)
```

**Paso 2 — Verificar:**
```
POST /me/email/verificar
Content-Type: application/json

{ "token": "..." }

→ 204  (sesión invalidada, debe volver a login)
```

**UI:** Modal de 2 pasos. Paso 1: ingresar nuevo email. Paso 2: ingresar token recibido. Token expira en 60 min.

#### Listar Condominios

```
GET /me/condominios

→ 200
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "nombre": "Condominio Los Robles",
    "direccion": "Av. Los Robles 1000",
    "rolAcceso": "ADMINISTRADOR",
    "cargo": null
  }
]
```

**UI:** Primer paso después del login. Si hay 1 solo condominio → seleccionar automáticamente. Si hay varios → mostrar dropdown/selector. Guardar `rolAcceso` y `cargo` en store global para UI condicional.

---

### 6.3 Dashboard

**Base:** `/api/v1/condominios/{condominioId}/dashboard`

#### Admin

```
GET /dashboard/admin
→ 200
{
  "condominio": { "id": "uuid", "nombre": "..." },
  "totales": { "unidades": 30, "residentesActivos": 34, "vehiculos": 12 },
  "accesos": { "activosAhora": 2, "ultimosMovimientos": [...] },
  "anunciosVigentes": 3,
  "pendientes": { "encomiendas": 0, "casos": 0 },
  "gastoComunActual": { ... } | null
}
```

**UI:** 4+ tarjetas KPI (unidades, residentes, vehículos, accesos activos), tabla últimos movimientos, indicador de período GC.

#### Finanzas

```
GET /dashboard/finanzas
→ 200
{
  "periodoActual": { "periodo": "2026-07", "totalRecaudado": 1650000, "totalEsperado": 2250000, "porcentajePagado": 73.33 } | null,
  "historial": [...]  // últimos 6 períodos
}
```

**UI:** Gráfico de barras (recaudación últimos 6 meses), tarjeta de período actual.

#### Guardia

```
GET /dashboard/guardia
→ 200
{
  "condominio": { "id": "uuid", "nombre": "..." },
  "totalUnidades": 30,
  "residentesActivos": 34,
  "accesos": { "activosAhora": 2, "ultimosMovimientos": [...] },
  "encomiendas": 5
}
```

**UI:** Contadores grandes, tabla de accesos activos, acceso rápido a registrar ingreso.

#### Residente

```
GET /dashboard/residente
→ 200
{
  "nombre": "Francisca Morales",
  "email": "francisca.morales@test.com",
  "unidades": [
    {
      "id": "uuid",
      "numero": "5",
      "tipo": "CASA",
      "vehiculos": [{ "id": "uuid", "patente": "GG-XX-12", "activo": true }],
      "personas": [{ "id": "uuid", "nombre": "...", "tipo": "PROPIETARIO" }],
      "gastoActual": {
        "periodo": "2026-06",
        "fechaVencimiento": "2026-07-10",
        "monto": 75000,
        "estadoPago": "PENDIENTE",
        "fechaPago": null
      } | null
    }
  ]
}
```

**UI:** Perfil del residente + tarjetas de unidad con badges de estado de pago.

---

### 6.4 Unidades

**Base:** `/api/v1/condominios/{condominioId}/unidades`

| Método | Endpoint | Request | Response | Permiso |
|---|---|---|---|---|
| GET | `/unidades` | — | `UnidadResumenResponse[]` | `UNIDAD_VER` |
| POST | `/unidades` | `{ numero, tipo, piso?, sectorId? }` | 201 `UnidadResumenResponse` | `UNIDAD_CREAR` |
| GET | `/unidades/{id}` | — | `UnidadDetalleResponse` | `UNIDAD_VER` |
| PUT | `/unidades/{id}` | `{ numero, tipo, piso?, sectorId? }` | `UnidadResumenResponse` | `UNIDAD_EDITAR` |
| PATCH | `/unidades/{id}/desactivar` | — | 204 | `UNIDAD_ELIMINAR` |
| GET | `/unidades/{id}/vinculos` | — | `VinculoResponse[]` | `VINCULO_VER` |

**Selectores:** `TipoUnidad` (`CASA`, `DEPARTAMENTO`, `ESTACIONAMIENTO`, `BODEGA`, `OTRO`), sector (opcional, dropdown).

**UnidadResumenResponse:**
```json
{
  "id": "uuid",
  "numero": "5",
  "tipo": "CASA",
  "piso": null,
  "activo": true,
  "sectorId": "uuid",
  "sectorNombre": "Sector A"
}
```

**UnidadDetalleResponse:**
```json
{
  "id": "uuid", "numero": "5", "tipo": "CASA", "piso": null, "activo": true,
  "sectorId": "uuid", "sectorNombre": "Sector A",
  "personas": [
    { "personaId": "uuid", "nombre": "...", "email": "...", "tipoVinculo": "PROPIETARIO", "esOcupante": true }
  ],
  "vehiculos": [
    { "vehiculoId": "uuid", "patente": "GG-XX-12", "tipo": "AUTO", "marca": "Toyota", "modelo": "Corolla" }
  ]
}
```

**Reglas:**
- No se puede eliminar (desactivar) una unidad con vínculos activos → 409
- `numero` es único por condominio (puede tener letras: "16-A")

---

### 6.5 Personas

**Base:** `/api/v1/condominios/{condominioId}/personas`

| Método | Endpoint | Request | Response | Permiso |
|---|---|---|---|---|
| GET | `/personas` | — | `PersonaResumenResponse[]` | `PERSONA_VER` |
| GET | `/personas/buscar?email=x` | query `email` | `PersonaResumenResponse` | `PERSONA_VER` |
| POST | `/personas` | `{ nombre, email, rut?, telefono? }` | 201 `PersonaResumenResponse` | `PERSONA_CREAR` |
| GET | `/personas/{id}` | — | `PersonaDetalleResponse` | `PERSONA_VER` |
| PUT | `/personas/{id}` | `{ nombre, telefono? }` | `PersonaResumenResponse` | `PERSONA_EDITAR` |
| PATCH | `/personas/{id}/desactivar` | — | 204 | `PERSONA_ELIMINAR` |

**PersonaResumenResponse:**
```json
{
  "id": "uuid", "nombre": "Francisca Morales", "email": "francisca.morales@test.com",
  "rut": "12.345.678-9", "telefono": "+56912345678", "activo": true,
  "tieneUsuario": true, "cargo": "PRESIDENTE" | null
}
```

**PersonaDetalleResponse:**
```json
{
  "id": "uuid", "nombre": "Francisca Morales", "email": "francisca.morales@test.com",
  "rut": "12.345.678-9", "telefono": "+56912345678", "activo": true,
  "usuario": { "id": "uuid", "rol": "RESIDENTE", "activo": true } | null,
  "cargo": "PRESIDENTE" | null,
  "vinculos": [
    { "vinculoId": "uuid", "unidadId": "uuid", "unidadNumero": "5",
      "tipo": "PROPIETARIO", "esOcupante": true, "fechaInicio": "2024-01-01" }
  ]
}
```

**Reglas:**
- Si la persona ya existe por email o RUT → 409 con el ID existente (permitir vincular directamente)
- Desactivar persona → desactiva en cascada: vínculos, cargo y usuario activos en el condominio
- `tieneUsuario` es booleano calculado: `true` si existe `UsuarioCondominio` activo para esta persona en este condominio

---

### 6.6 Vínculos

**Base:** `/api/v1/condominios/{condominioId}/vinculos`

| Método | Endpoint | Request | Response | Permiso |
|---|---|---|---|---|
| POST | `/vinculos` | `{ personaId, unidadId, tipo, esOcupante, recibeNotificaciones, fechaInicio }` | 201 `VinculoResponse` | `VINCULO_CREAR` |
| PATCH | `/vinculos/{id}/desactivar` | — | 204 | `VINCULO_ELIMINAR` |
| GET | `/unidades/{unidadId}/vinculos` | — | `VinculoResponse[]` | `VINCULO_VER` |

**VinculoResponse:**
```json
{
  "id": "uuid",
  "personaId": "uuid",
  "personaNombre": "Francisca Morales",
  "personaEmail": "francisca.morales@test.com",
  "unidadId": "uuid",
  "unidadNumero": "5",
  "tipo": "PROPIETARIO",
  "esOcupante": true,
  "recibeNotificaciones": true,
  "fechaInicio": "2024-01-01",
  "fechaFin": null,
  "activo": true
}
```

**Selectores:** `TipoVinculoUnidad` (`PROPIETARIO`, `ARRENDATARIO`, `RESIDENTE_ADICIONAL`), selector de persona, checkbox "es ocupante" y "recibe notificaciones", date picker.

**Reglas:**
- Solo un `PROPIETARIO` activo por unidad
- Solo un `ARRENDATARIO` activo por unidad
- `RESIDENTE_ADICIONAL` sin límite
- Al desactivar: soft delete con `fechaFin = hoy`. Historial conservado.

---

### 6.7 Vehículos

**Base:** `/api/v1/condominios/{condominioId}/vehiculos`

| Método | Endpoint | Request | Response | Permiso |
|---|---|---|---|---|
| GET | `/vehiculos` | — | `VehiculoResponse[]` | `VEHICULO_VER` |
| POST | `/vehiculos` | `{ patente, tipo, marca?, modelo?, color? }` | 201 `VehiculoResponse` | `VEHICULO_CREAR` |
| GET | `/vehiculos/{id}` | — | `VehiculoResponse` | `VEHICULO_VER` |
| PUT | `/vehiculos/{id}` | `{ patente, tipo, marca?, modelo?, color? }` | `VehiculoResponse` | `VEHICULO_EDITAR` |
| PATCH | `/vehiculos/{id}/desactivar` | — | 204 | `VEHICULO_ELIMINAR` |
| POST | `/vehiculos/{id}/estacionamiento` | `{ unidadId, fechaInicio }` | `VehiculoResponse` | `VEHICULO_EDITAR` |
| DELETE | `/vehiculos/{id}/estacionamiento` | — | 204 | `VEHICULO_EDITAR` |

**VehiculoResponse:**
```json
{
  "id": "uuid", "patente": "GG-XX-12", "tipo": "AUTO",
  "marca": "Toyota", "modelo": "Corolla", "color": "Rojo",
  "activo": true,
  "estacionamientoUnidadId": "uuid | null",
  "estacionamientoNumero": "E-5 | null"
}
```

**Selectores:** `TipoVehiculo` (`AUTO`, `CAMIONETA`, `MOTO`, `FURGON`, `OTRO`), unidad tipo `ESTACIONAMIENTO` para asignación.

---

### 6.8 Control de Acceso — Autorizaciones

**Base:** `/api/v1/condominios/{condominioId}/autorizaciones`

| Método | Endpoint | Request | Response | Permiso |
|---|---|---|---|---|
| GET | `/autorizaciones?estado=` | query `estado` opcional | `AutorizacionResponse[]` | `AUTORIZACION_VER` |
| POST | `/autorizaciones` | ver abajo | 201 `AutorizacionResponse` | `AUTORIZACION_CREAR` |
| GET | `/autorizaciones/{id}` | — | `AutorizacionResponse` | `AUTORIZACION_VER` |
| PATCH | `/autorizaciones/{id}/cancelar` | — | `AutorizacionResponse` | `AUTORIZACION_CANCELAR` |
| GET | `/mis-autorizaciones` | — | `AutorizacionResponse[]` | `AUTORIZACION_VER` |

```
POST /autorizaciones
{
  "unidadId": "uuid",
  "tipo": "VISITA",
  "nombre": "Juan Pérez",
  "rut": "12.345.678-9",
  "telefono": "+56987654321",
  "empresa": null,
  "patenteVisitante": "HH-YY-99",
  "cantidadPersonas": 2,
  "fechaInicio": "2026-07-01T10:00:00",
  "fechaFin": "2026-07-01T18:00:00",
  "observacion": "Visita familiar"
}
```

**Regla de fechas:**
- `fechaFin` debe ser posterior o igual a `fechaInicio`. Si es anterior → 400.
- Si `fechaFin == fechaInicio`, el sistema auto-asigna `fechaFin = fechaInicio + 6h`.
- `fechaInicio` es **informativa** — para el ingreso solo se valida `fechaFin >= ahora`. Una visita puede llegar antes de `fechaInicio`.

**AutorizacionResponse:**
```json
{
  "id": "uuid", "unidadId": "uuid", "unidadNumero": "5",
  "tipo": "VISITA", "estado": "PENDIENTE",
  "nombre": "Juan Pérez", "rut": "12.345.678-9",
  "telefono": "+56987654321", "patenteVisitante": "HH-YY-99",
  "cantidadPersonas": 2,
  "fechaInicio": "2026-07-01T10:00:00",
  "fechaFin": "2026-07-01T18:00:00",
  "creadoPorNombre": "Francisca Morales",
  "creadoEn": "2026-07-01T09:00:00"
}
```

**Estados:** `PENDIENTE`, `UTILIZADA`, `EXPIRADA`, `CANCELADA`

**UI Residente:** Formulario de creación con selector de unidad, tipo visita, datos visitante, rango fechas.
**UI Guardia:** Lista filtrada por estado (default PENDIENTE).
**UI "Mis Autorizaciones":** Solo retorna autorizaciones PENDIENTE con `fechaFin >= hoy`.

---

### 6.9 Control de Acceso — Registros

**Base:** `/api/v1/condominios/{condominioId}/accesos`

| Método | Endpoint | Request | Response | Permiso |
|---|---|---|---|---|
| POST | `/accesos/ingresar` | ver abajo | 201 `RegistroAccesoResponse` | `ACCESO_REGISTRAR_INGRESO` |
| GET | `/accesos?estado=` | query `estado` opcional | `RegistroAccesoResponse[]` | `ACCESO_VER` |
| GET | `/accesos/{id}` | — | `RegistroAccesoResponse` | `ACCESO_VER` |
| PATCH | `/accesos/{id}/salida` | `{ observacion? }` | `RegistroAccesoResponse` | `ACCESO_REGISTRAR_SALIDA` |

```
POST /accesos/ingresar
{
  "unidadId": "uuid",
  "autorizacionId": "uuid | null",
  "nombreVisitante": "Pedro López",
  "rutVisitante": "15.678.901-2",
  "telefonoVisitante": "+56987654321",
  "patenteVisitante": "KK-11-AA",
  "tipo": "VISITA",
  "cantidadPersonas": 3,
  "observacion": ""
}
```

**RegistroAccesoResponse:**
```json
{
  "id": "uuid", "unidadId": "uuid", "unidadNumero": "5",
  "estado": "ACTIVO",
  "nombreVisitante": "Pedro López", "rutVisitante": "15.678.901-2",
  "patenteVisitante": "KK-11-AA", "tipo": "VISITA", "cantidadPersonas": 3,
  "autorizacionId": "uuid | null",
  "ingresoEn": "2026-07-01T10:30:00",
  "salidaEn": null,
  "registradoPorNombre": "Miguel Rojas"
}
```

**UI Portería:** Campo de búsqueda de patente (que consulta `GET /buscar?patente=`), selector de unidad, dropdown de tipo autorización.
**UI Log de Accesos:** Tabla con filtro por estado.

---

### 6.10 Encomiendas

**Base:** `/api/v1/condominios/{condominioId}/encomiendas`

| Método | Endpoint | Request | Response | Permiso |
|---|---|---|---|---|
| POST | `/encomiendas` | `{ unidadId, tipo, nombreDestinatario }` | 201/200 `EncomiendaDetalleResponse` | `ENCOMIENDA_CREAR` |
| GET | `/encomiendas/activas` | — | `EncomiendaResumenResponse[]` | `ENCOMIENDA_VER` |
| GET | `/encomiendas?estado=&unidadNumero=` | filtros opcionales | `EncomiendaResumenResponse[]` | `ENCOMIENDA_VER` |
| GET | `/encomiendas/{id}` | — | `EncomiendaDetalleResponse` | `ENCOMIENDA_VER` |
| PATCH | `/encomiendas/{id}/entregar` | `{ nombreRetira, rutRetira }` | `EncomiendaDetalleResponse` | `ENCOMIENDA_ENTREGAR` |
| PATCH | `/encomiendas/{id}/cerrar` | `{ observaciones }` | `EncomiendaDetalleResponse` | `ENCOMIENDA_ENTREGAR` |
| GET | `/mis-encomiendas` | — | `EncomiendaResumenResponse[]` | `ENCOMIENDA_VER` |

**Estados:** `PENDIENTE → ENTREGADA → CERRADA` (irreversible)

**Idempotencia:** Misma solicitud dentro de 60 segundos → 200 con la encomienda existente (en vez de 201).

**EncomiendaDetalleResponse:**
```json
{
  "id": "uuid", "unidadId": "uuid", "unidadNumero": "5",
  "tipo": "ENCOMIENDA", "estado": "PENDIENTE",
  "nombreDestinatario": "Francisca Morales",
  "nombreRetira": null, "rutRetira": null,
  "fechaIngreso": "2026-07-01T10:00:00",
  "fechaEntrega": null,
  "historial": [
    { "tipoEvento": "ENCOMIENDA_REGISTRADA", "realizadoPorNombre": "Miguel Rojas", "realizadoEn": "2026-07-01T10:00:00" }
  ]
}
```

**UI Guardia:** Formulario rápido (unidad + tipo + destinatario) + lista "activas" con botón "Entregar".
**UI Residente:** `mis-encomiendas` lista de encomiendas de sus unidades.

---

### 6.11 Gastos Comunes

**Base:** `/api/v1/condominios/{condominioId}/gastos-comunes`

| Método | Endpoint | Request | Response | Permiso |
|---|---|---|---|---|
| POST | `/gastos-comunes` | `{ periodo, fechaVencimiento, montoBase }` | 201 `GastoComunResumen` | `FINANZA_GESTIONAR` |
| GET | `/gastos-comunes` | — | `GastoComunResumen[]` | `FINANZA_VER` |
| GET | `/gastos-comunes/{id}` | — | `GastoComunDetalleResponse` | `FINANZA_VER` |
| PATCH | `/gastos-comunes/cuotas/{cuotaId}/pagar` | `{ fechaPago, observacion? }` | `CuotaResponse` | `FINANZA_GESTIONAR` |

**GastoComunResumen:**
```json
{
  "id": "uuid", "periodo": "2026-06",
  "fechaVencimiento": "2026-07-10",
  "estado": "ABIERTO",
  "totalUnidades": 30, "unidadesPagadas": 22, "unidadesPendientes": 8,
  "montoEsperado": 2250000, "montoRecaudado": 1650000, "porcentajePagado": 73.33
}
```

**GastoComunDetalleResponse:**
```json
{
  "id": "uuid", "periodo": "2026-06",
  "fechaVencimiento": "2026-07-10", "estado": "ABIERTO",
  "cuotas": [
    { "id": "uuid", "unidadId": "uuid", "unidadNumero": "5",
      "monto": 75000, "estadoPago": "PENDIENTE", "fechaPago": null, "observacion": null }
  ]
}
```

**UI Admin:** Formulario para generar período → tabla de cuotas generadas → botón "Pagar" por cuota individual.

---

### 6.12 Finanzas v2 — Cuentas

**Base:** `/api/v1/condominios/{condominioId}/finanzas/cuentas`

| Método | Endpoint | Request | Response | Permiso |
|---|---|---|---|---|
| GET | `/finanzas/cuentas` | — | `CuentaFinancieraResponse[]` | `CUENTA_VER` |
| POST | `/finanzas/cuentas` | `{ nombre, tipo, banco, numeroCuenta, titular, descripcion? }` | 201 | `CUENTA_GESTIONAR` |
| GET | `/finanzas/cuentas/{id}` | — | `CuentaFinancieraResponse` | `CUENTA_VER` |
| PUT | `/finanzas/cuentas/{id}` | mismo que POST | `CuentaFinancieraResponse` | `CUENTA_GESTIONAR` |
| PATCH | `/finanzas/cuentas/{id}/desactivar` | — | 204 | `CUENTA_GESTIONAR` |

**CuentaFinancieraResponse:**
```json
{
  "id": "uuid", "condominioId": "uuid",
  "nombre": "Cuenta Corriente BancoEstado",
  "tipo": "CUENTA_CORRIENTE",
  "banco": "BancoEstado", "numeroCuenta": "00-123-45678-09",
  "titular": "Condominio Los Robles",
  "descripcion": null, "activa": true,
  "saldoActual": 1250000.0
}
```

**Selectores:** `TipoCuenta` (`CUENTA_CORRIENTE`, `CUENTA_VISTA`, `CUENTA_AHORRO`, `CAJA_CHICA`, `FONDO_RESERVA`)

**Regla:** Una cuenta con transacciones en ledger no se puede desactivar → 409.

---

### 6.13 Finanzas v2 — Categorías

**Base:** `/api/v1/condominios/{condominioId}/finanzas/categorias`

| Método | Endpoint | Request | Response | Permiso |
|---|---|---|---|---|
| GET | `/finanzas/categorias?tipo=` | query `tipo` (INGRESO/EGRESO) | `CategoriaMovimientoResponse[]` | `CATEGORIA_VER` |
| POST | `/finanzas/categorias` | `{ nombre, tipo, descripcion? }` | 201 | `CATEGORIA_GESTIONAR` |
| GET | `/finanzas/categorias/{id}` | — | `CategoriaMovimientoResponse` | `CATEGORIA_VER` |
| DELETE | `/finanzas/categorias/{id}` | — | 204 | `CATEGORIA_GESTIONAR` |

**CategoriaMovimientoResponse:**
```json
{
  "id": "uuid", "condominioId": "uuid",
  "nombre": "Electricidad", "tipo": "EGRESO",
  "descripcion": null, "esSistema": true, "activa": true
}
```

**Seed data (20 categorías):**
- **INGRESO:** Gastos Comunes, Multas, Cuota Extraordinaria, Arriendo Sala, Intereses Morosidad, Otros Ingresos
- **EGRESO:** Sueldos, Cotizaciones Legales, Electricidad, Agua, Gas, Jardineria, Aseo, Mantencion, Reparacion, Honorarios, Compra Materiales, Seguros, Administracion, Otros Egresos

---

### 6.14 Finanzas v2 — Ledger

**Base:** `/api/v1/condominios/{condominioId}/finanzas/ledger`

```
GET /finanzas/ledger?cuentaId=&desde=&hasta=
→ 200
[
  {
    "id": "uuid", "cuentaId": "uuid", "cuentaNombre": "Cuenta Corriente BancoEstado",
    "tipo": "CREDITO", "monto": 75000.0,
    "descripcion": "Pago gasto común - Unidad 5",
    "referenciaTipo": "PAGO_RESIDENTE", "referenciaId": "uuid",
    "fechaTransaccion": "2026-07-05", "registradoPorNombre": "Carlos Mendoza",
    "creadoEn": "2026-07-05T10:30:00"
  }
]
```

**Nota:** El ledger es **append-only e inmutable**. No tiene UPDATE ni DELETE. Los errores se corrigen con transacciones de reverso (`REVERSO`).

---

### 6.15 Finanzas v2 — Pagos

**Base:** `/api/v1/condominios/{condominioId}/finanzas/pagos`

| Método | Endpoint | Request | Response | Permiso |
|---|---|---|---|---|
| POST | `/finanzas/pagos` | ver abajo | 201 `PagoResidenteResponse` | `PAGO_RESIDENTE_CREAR` |
| GET | `/finanzas/pagos?unidadId=&desde=&hasta=` | filtros opcionales | `PagoResidenteResponse[]` | `PAGO_RESIDENTE_VER` |
| GET | `/finanzas/pagos/{id}` | — | `PagoResidenteResponse` | `PAGO_RESIDENTE_VER` |

```
POST /finanzas/pagos
{
  "unidadId": "uuid",
  "cuentaDestinoId": "uuid",
  "monto": 75000,
  "fechaPago": "2026-07-05",
  "numeroOperacion": "TRF-001",
  "bancoOrigen": "BancoEstado",
  "comprobanteUrl": null,
  "observacion": null,
  "cuotasGastoComunIds": ["uuid"],
  "cargosAdicionalesIds": ["uuid"]
}
```

**PagoResidenteResponse:**
```json
{
  "id": "uuid", "condominioId": "uuid",
  "unidadId": "uuid", "unidadNumero": "5",
  "cuentaDestinoId": "uuid", "cuentaDestinoNombre": "Cuenta Corriente BancoEstado",
  "monto": 75000.0, "metodoPago": "TRANSFERENCIA",
  "numeroOperacion": "TRF-001", "bancoOrigen": "BancoEstado",
  "fechaPago": "2026-07-05",
  "comprobanteUrl": null, "observacion": null,
  "ledgerId": "uuid",
  "registradoPorNombre": "Carlos Mendoza",
  "creadoEn": "2026-07-05T10:30:00",
  "detalles": [
    { "cuotaId": "uuid", "cuotaTipo": "GASTO_COMUN", "montoAplicado": 75000.0 }
  ]
}
```

**Efecto:** Crea asiento CREDITO en ledger + actualiza estado cuotas/cargos a PAGADO.

---

### 6.16 Finanzas v2 — Cargos Adicionales

**Base:** `/api/v1/condominios/{condominioId}/finanzas/cargos-adicionales`

| Método | Endpoint | Request | Response | Permiso |
|---|---|---|---|---|
| POST | `/finanzas/cargos-adicionales` | `{ unidadId, categoriaId, descripcion, monto, fechaCargo, fechaVencimiento?, casoId? }` | 201 | `CARGO_ADICIONAL_GESTIONAR` |
| GET | `/finanzas/cargos-adicionales?estado=` | query `estado` | `CargoAdicionalResponse[]` | `CARGO_ADICIONAL_VER` |
| GET | `/finanzas/cargos-adicionales/{id}` | — | `CargoAdicionalResponse` | `CARGO_ADICIONAL_VER` |
| PATCH | `/finanzas/cargos-adicionales/{id}/anular` | `{ motivo }` | `CargoAdicionalResponse` | `CARGO_ADICIONAL_GESTIONAR` |

**Estados:** `PENDIENTE`, `PAGADO`, `ANULADO`

**Regla:** Solo se puede anular si `estado == PENDIENTE`.

---

### 6.17 Finanzas v2 — Gastos

**Base:** `/api/v1/condominios/{condominioId}/finanzas/gastos`

| Método | Endpoint | Request | Response | Permiso |
|---|---|---|---|---|
| POST | `/finanzas/gastos` | ver abajo | 201 `GastoResponse` | `GASTO_CREAR` |
| GET | `/finanzas/gastos?categoriaId=&desde=&hasta=&soloActivos=` | filtros | `GastoResponse[]` | `GASTO_VER` |
| GET | `/finanzas/gastos/{id}` | — | `GastoResponse` | `GASTO_VER` |
| PATCH | `/finanzas/gastos/{id}/anular` | `{ motivo }` | `GastoResponse` | `GASTO_ANULAR` |

```
POST /finanzas/gastos
{
  "categoriaId": "uuid",
  "cuentaOrigenId": "uuid",
  "descripcion": "Cuenta electricidad julio",
  "monto": 250000,
  "fechaGasto": "2026-07-15",
  "proveedorTexto": "CGE Distribucion",
  "numeroDocumento": "FAC-001",
  "documentoUrl": null,
  "casoId": null
}
```

**Anulación:** Crea asiento CREDITO en ledger con `referenciaTipo = REVERSO`. Gasto original queda con estado `ANULADO`.

---

### 6.18 Finanzas v2 — Plantillas de Gasto

**Base:** `/api/v1/condominios/{condominioId}/finanzas/plantillas-gasto`

| Método | Endpoint | Request | Permiso |
|---|---|---|---|
| GET | `/finanzas/plantillas-gasto` | — | `PLANTILLA_GASTO_VER` |
| POST | `/finanzas/plantillas-gasto` | `{ nombre, categoriaId, cuentaOrigenId, descripcionBase, montoSugerido, proveedorTexto }` | `PLANTILLA_GASTO_GESTIONAR` |
| GET | `/finanzas/plantillas-gasto/{id}` | — | `PLANTILLA_GASTO_VER` |
| PUT | `/finanzas/plantillas-gasto/{id}` | mismo body | `PLANTILLA_GASTO_GESTIONAR` |
| DELETE | `/finanzas/plantillas-gasto/{id}` | — | `PLANTILLA_GASTO_GESTIONAR` |

---

### 6.19 Finanzas v2 — Dashboard Financiero

```
GET /finanzas/dashboard
→ 200
{
  "mesActual": { "periodo": "2026-07", "totalIngresos": 1650000, "totalEgresos": 950000, "resultado": 700000 },
  "mesAnterior": { "periodo": "2026-06", "totalIngresos": 1550000, "totalEgresos": 1100000, "resultado": 450000 },
  "saldosCuentas": [
    { "cuentaId": "uuid", "cuentaNombre": "...", "cuentaTipo": "...", "banco": "...", "numeroCuenta": "...", "saldoActual": 1250000.0 }
  ],
  "morosidad": {
    "totalUnidades": 30, "unidadesPagadas": 22, "unidadesPendientes": 8,
    "unidadesConCargosAdicionales": 2,
    "montoMorosoGastoComun": 600000, "montoMorosoCargosAdicionales": 150000,
    "totalMoroso": 750000
  }
}
```

---

### 6.20 Mis Deudas

```
GET /mis-deudas
→ 200
{
  "unidades": [
    {
      "unidadId": "uuid", "unidadNumero": "5", "unidadTipo": "CASA",
      "gastoComun": { "cuotaId": "uuid", "periodo": "2026-07", "monto": 75000, "fechaVencimiento": "2026-08-10", "estadoPago": "PENDIENTE" },
      "cargosAdicionales": [
        { "cargoId": "uuid", "descripcion": "Multa", "categoria": "Multas", "monto": 50000, "fechaCargo": "2026-07-01", "fechaVencimiento": "2026-08-01" }
      ],
      "totalUnidad": 125000.0
    }
  ],
  "totalPendiente": 125000.0
}
```

---

### 6.21 Casos

**Base:** `/api/v1/condominios/{condominioId}/casos`

| Método | Endpoint | Request | Response | Permiso |
|---|---|---|---|---|
| POST | `/casos` | `{ titulo, descripcion?, prioridad, referenciaInicial? }` | 201 `CasoDetalleResponse` | `RECLAMO_CREAR` |
| GET | `/casos?estado=` | query opcional | `CasoResumenResponse[]` | `RECLAMO_VER` |
| GET | `/casos/{id}` | — | `CasoDetalleResponse` | `RECLAMO_VER` |
| POST | `/casos/{id}/referencias` | `{ tipo, recursoId, descripcionSnapshot? }` | `CasoDetalleResponse` | `RECLAMO_GESTIONAR` |
| POST | `/casos/{id}/seguimientos` | `{ comentario, nuevoEstado? }` | `CasoDetalleResponse` | `RECLAMO_GESTIONAR` |
| PATCH | `/casos/{id}/cerrar` | `{ resumenCierre }` | `CasoDetalleResponse` | `RECLAMO_GESTIONAR` |

**Estados:** `ABIERTO → EN_GESTION → RESUELTO → CERRADO`

**CasoDetalleResponse:**
```json
{
  "id": "uuid", "numero": 1, "titulo": "Fuga de agua sector B",
  "descripcion": "Se detectó fuga...", "prioridad": "URGENTE",
  "estado": "EN_GESTION",
  "referencias": [
    { "tipo": "GASTO_EXTRAORDINARIO", "recursoId": "uuid", "descripcionSnapshot": "Boleta N°123" }
  ],
  "timeline": [
    { "comentario": "Se contactó al gasfíter", "nuevoEstado": "EN_GESTION", "realizadoPorNombre": "Carlos Mendoza", "realizadoEn": "..." }
  ],
  "creadoPorNombre": "Carlos Mendoza",
  "creadoEn": "...",
  "cerradoEn": null, "resumenCierre": null
}
```

---

### 6.22 Anuncios

**Base:** `/api/v1/condominios/{condominioId}/anuncios`

| Método | Endpoint | Request | Permiso |
|---|---|---|---|
| POST | `/anuncios` | `{ titulo, mensaje, audiencia, prioridad, requiereConfirmacion, condominioNombre, fechaExpiracion? }` | `NOTIFICACION_ENVIAR` |
| GET | `/anuncios` | — | `NOTIFICACION_VER` |
| GET | `/anuncios/todos` | — | `NOTIFICACION_VER` |

**Selectores:** `TipoAudiencia` (`TODOS`, `RESIDENTES`, `PROPIETARIOS`, `UNIDAD`, `COMITE`, `GUARDIAS`, `ADMINISTRADORES`, `PERSONA`), `PrioridadAviso` (`NORMAL`, `IMPORTANTE`, `URGENTE`)

---

### 6.23 Notificaciones

**Base:** `/api/v1/condominios/{condominioId}/notificaciones`

| Método | Endpoint | Response | Permiso |
|---|---|---|---|
| GET | `/notificaciones` | `NotificacionResponse[]` | `NOTIFICACION_VER` |
| GET | `/notificaciones/badge` | `{ noLeidas: 5 }` | `NOTIFICACION_VER` |
| PATCH | `/notificaciones/{id}/leida` | 204 | `NOTIFICACION_VER` |
| PATCH | `/notificaciones/todas-leidas` | `{ noLeidas: 0 }` | `NOTIFICACION_VER` |

**Nota técnica:** El procesamiento de notificaciones es asíncrono (`@Async`). La creación de `Notificacion` y `EntregaNotificacion` ocurre en la misma transacción.

---

### 6.24 Preferencias de Notificación

**Base:** `/api/v1/me/notificaciones/preferencias` (sin condominioId)

| Método | Endpoint | Request |
|---|---|---|
| GET | `/me/notificaciones/preferencias` | — |
| PUT | `/me/notificaciones/preferencias/{tipo}` | `{ "enApp": true, "email": false, "push": true }` |

**UI:** Tabla de tipos de notificación con toggles para IN_APP, EMAIL, PUSH.

---

### 6.25 Plantillas de Notificación

**Base:** `/api/v1/condominios/{condominioId}/notificaciones/plantillas`

| Método | Endpoint | Request | Permiso |
|---|---|---|---|
| GET | `/notificaciones/plantillas` | — | `CONDOMINIO_VER` |
| PUT | `/notificaciones/plantillas/{codigo}` | `{ tituloPlantilla, enAppPlantilla, emailPlantilla }` | `CONDOMINIO_EDITAR` |
| DELETE | `/notificaciones/plantillas/{codigo}` | — | `CONDOMINIO_EDITAR` |

---

### 6.26 Bitácora

**Base:** `/api/v1/condominios/{condominioId}/bitacora`

| Método | Endpoint | Request | Permiso |
|---|---|---|---|
| POST | `/bitacora` | `{ tipo, clasificacion, observaciones?, fotoUrl?, checklistRespuestas? }` | `BITACORA_REGISTRAR` |
| GET | `/bitacora/mi-turno` | — | `BITACORA_REGISTRAR` |
| GET | `/bitacora?tipo=&clasificacion=&desde=&hasta=` | filtros | `BITACORA_VER` |
| GET | `/bitacora/{id}` | — | `BITACORA_VER` |

**EstadoTurnoResponse:**
```json
{
  "enTurno": true,
  "enColacion": false,
  "ultimoEvento": "TURNO_INICIO",
  "ultimoEventoEn": "2026-07-01T08:00:00",
  "accionesDisponibles": ["TURNO_FIN", "COLACION_SALIDA", "NOVEDAD"]
}
```

**UI Guardia:** Botones dinámicos según `accionesDisponibles`. No hardcodear botones.

**Estados de turno:**
```
SIN_TURNO → TURNO_INICIO → [TURNO_FIN | COLACION_SALIDA → COLACION_REGRESO | NOVEDAD]
```

---

### 6.27 Checklist de Bitácora

**Base:** `/api/v1/condominios/{condominioId}/bitacora/checklist-templates`

| Método | Endpoint | Request | Permiso |
|---|---|---|---|
| GET | `/bitacora/checklist-templates/{tipoEvento}` | — | `BITACORA_REGISTRAR` |
| PUT | `/bitacora/checklist-templates/{tipoEvento}` | `{ items: [{ pregunta, obligatorio, orden }] }` | `BITACORA_GESTIONAR` |
| DELETE | `/bitacora/checklist-templates/{tipoEvento}` | — | `BITACORA_GESTIONAR` |

---

### 6.28 Gestión de Usuarios

**Base:** `/api/v1/condominios/{condominioId}/...`

| Método | Endpoint | Request | Permiso |
|---|---|---|---|
| POST | `/personas/{personaId}/usuario` | `{ rol? }` | `USUARIO_GESTIONAR` |
| PATCH | `/usuarios/{usuarioId}/activar` | — | `USUARIO_GESTIONAR` |
| PATCH | `/usuarios/{usuarioId}/desactivar` | — | `USUARIO_GESTIONAR` |

**Regla:** ADMIN solo puede crear RESIDENTE o GUARDIA. Solo SUPER_ADMIN puede crear ADMIN o SOPORTE.

---

### 6.29 Cargos / Miembros

**Base:** `/api/v1/condominios/{condominioId}/miembros`

| Método | Endpoint | Request | Response |
|---|---|---|---|
| GET | `/miembros` | — | `MiembroResponse[]` |
| POST | `/miembros` | `{ personaId, cargo, fechaInicio }` | 201 `MiembroResponse` |
| PATCH | `/miembros/{id}/desactivar` | — | 204 |

**MiembroResponse:**
```json
{
  "id": "uuid", "personaId": "uuid", "personaNombre": "Ana Reyes",
  "cargo": "PRESIDENTE", "activo": true,
  "fechaInicio": "2026-01-01", "fechaFin": null
}
```

**Regla:** PRESIDENTE, ADMINISTRADOR, TESORERO, SECRETARIO son singleton → 409 si ya hay uno activo.

---

### 6.30 Búsqueda en Portería

```
GET /buscar?patente=KK-11-AA
→ 200
{
  "resultados": [
    {
      "tipo": "VEHICULO_RESIDENTE",
      "personaNombre": "Francisca Morales",
      "unidadId": "uuid", "unidadNumero": "5",
      "accionesDisponibles": ["REGISTRAR_INGRESO"]
    }
  ]
}
```

**UI:** Input de búsqueda con auto-completar (debounce). Resultados agrupados por tipo.

---

## 7. Enums del Sistema

| Enum | Valores | UI |
|---|---|---|
| `TipoUnidad` | `CASA`, `DEPARTAMENTO`, `ESTACIONAMIENTO`, `BODEGA`, `OTRO` | Selector al crear/editar unidad |
| `TipoVinculoUnidad` | `PROPIETARIO`, `ARRENDATARIO`, `RESIDENTE_ADICIONAL` | Selector al crear vínculo |
| `TipoVehiculo` | `AUTO`, `CAMIONETA`, `MOTO`, `FURGON`, `OTRO` | Selector al crear/editar vehículo |
| `TipoAutorizacion` | `VISITA`, `DELIVERY`, `UBER`, `SERVICIO`, `TECNICO`, `OTRO` | Selector en autorización e ingreso |
| `EstadoAutorizacion` | `PENDIENTE`, `UTILIZADA`, `EXPIRADA`, `CANCELADA` | Filtro de autorizaciones |
| `EstadoAcceso` | `ACTIVO`, `FINALIZADO`, `RECHAZADO` | Filtro de accesos |
| `TipoEncomienda` | `CARTA`, `ENCOMIENDA` | Selector al registrar |
| `EstadoEncomienda` | `PENDIENTE`, `ENTREGADA`, `CERRADA` | Badge de estado |
| `EstadoCaso` | `ABIERTO`, `EN_GESTION`, `RESUELTO`, `CERRADO` | Filtro y cambio de estado |
| `ClasificacionBitacora` | `INFO`, `NORMAL`, `URGENTE`, `EMERGENCIA` | Prioridad con color |
| `TipoEventoBitacora` | `TURNO_INICIO`, `TURNO_FIN`, `COLACION_SALIDA`, `COLACION_REGRESO`, `NOVEDAD` | Acciones dinámicas |
| `TipoAudiencia` | `TODOS`, `RESIDENTES`, `PROPIETARIOS`, `UNIDAD`, `COMITE`, `GUARDIAS`, `ADMINISTRADORES`, `PERSONA` | Selector de audiencia en anuncios |
| `PrioridadAviso` | `NORMAL`, `IMPORTANTE`, `URGENTE` | Badge de prioridad |
| `CanalEntrega` | `IN_APP`, `EMAIL`, `PUSH` | Toggles en preferencias |
| `CargoCondominio` | `ADMINISTRADOR`, `PRESIDENTE`, `TESORERO`, `SECRETARIO`, `DELEGADO`, `CONSERJE`, `GUARDIA`, `MANTENCION`, `JARDINERO` | Selector al asignar cargo |
| `TipoCuenta` | `CUENTA_CORRIENTE`, `CUENTA_VISTA`, `CUENTA_AHORRO`, `CAJA_CHICA`, `FONDO_RESERVA` | Selector al crear cuenta |
| `TipoMovimiento` | `INGRESO`, `EGRESO` | Filtro de categorías |
| `TipoTransaccion` | `CREDITO`, `DEBITO` | Visualización ledger |
| `ReferenciaTipo` | `PAGO_RESIDENTE`, `GASTO`, `CARGO_ADICIONAL`, `REVERSO`, `AJUSTE_MANUAL` | Origen del asiento |
| `EstadoPago` | `PENDIENTE`, `PAGADO`, `VENCIDO` | Badge de cuota |
| `EstadoGastoComun` | `ABIERTO`, `CERRADO` | Estado de período |
| `EstadoCargoAdicional` | `PENDIENTE`, `PAGADO`, `ANULADO` | Filtro y badge |
| `EstadoGasto` | `REGISTRADO`, `ANULADO` | Badge |
| `MetodoPago` | `TRANSFERENCIA`, `EFECTIVO` | Selector al registrar pago |

---

## 8. Formato de Respuestas de Error

### 8.1 Estructura General

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Descripción del error para el usuario",
  "timestamp": "2026-07-01T12:00:00",
  "fields": null
}
```

Para errores de validación:
```json
{
  "status": 400,
  "error": "Validation Error",
  "message": "Uno o más campos tienen errores de validación",
  "timestamp": "2026-07-01T12:00:00",
  "fields": [
    { "field": "email", "message": "must not be blank" },
    { "field": "nombre", "message": "size must be between 0 and 255" }
  ]
}
```

### 8.2 Mapeo de Errores

| Código | Cuándo | Feedback UI |
|---|---|---|
| 400 | Validación de campos | Errores inline por campo |
| 400 | `IllegalArgumentException` | "El parámetro 'id' debe ser de tipo UUID" |
| 401 | Token ausente/inválido | Refresh silencioso, si falla → /login |
| 401 | Credenciales incorrectas | "Credenciales incorrectas" (genérico) |
| 403 | Sin permisos | "No tienes permisos para realizar esta acción" |
| 404 | Entidad no encontrada | Pantalla "No encontrado" |
| 405 | Método HTTP incorrecto | Error genérico |
| 409 | Conflicto de estado | Alerta descriptiva |
| 415 | Content-Type incorrecto | Error genérico |
| 500 | Error inesperado | "Ocurrió un error inesperado" |

### 8.3 Ejemplos por Código

**400 — Bad Request (validación)**
```json
{ "status": 400, "error": "Bad Request", "message": "El parámetro 'id' debe ser de tipo UUID" }
```

**400 — Validation Error**
```json
{ "status": 400, "error": "Validation Error", "message": "Uno o más campos tienen errores", "fields": [{ "field": "email", "message": "must not be blank" }] }
```

**401 — Unauthorized (login)**
```json
{ "status": 401, "error": "Unauthorized", "message": "Credenciales incorrectas" }
```

**401 — Unauthorized (JWT inválido)**
```json
{ "status": 401, "error": "Unauthorized", "message": "Token inválido o malformado" }
```

**403 — Forbidden**
```json
{ "status": 403, "error": "Forbidden", "message": "No tienes permisos para realizar esta acción" }
```

**404 — Not Found**
```json
{ "status": 404, "error": "Not Found", "message": "Persona no encontrada con id: 00000000-0000-0000-0000-000000000099" }
```

**409 — Conflict**
```json
{ "status": 409, "error": "Conflict", "message": "La unidad tiene vínculos activos. Desactívalos primero." }
```

**500 — Internal Server Error**
```json
{ "status": 500, "error": "Internal Server Error", "message": "Ocurrió un error inesperado. Por favor intenta nuevamente." }
```

---

## 9. Consideraciones para el Frontend

### 9.1 Estado Global (Store)

| Pieza de Estado | Tipo | Origen |
|---|---|---|
| `accessToken` | `string` | Login / Refresh |
| `refreshToken` | `string` | Login |
| `usuario` | `MeResponse` | Login o GET /me |
| `condominioActual` | `CondominioResumen` | GET /me/condominios + selección |
| `condominiosAccesibles` | `CondominioResumen[]` | GET /me/condominios |

### 9.2 Reglas Clave

1. **Multi-tenant por URL:** `.../{condominioId}/...` en todos los endpoints. El layout debe inyectar `condominioId` automáticamente desde el store global.
2. **Refresh Silencioso:** Interceptar 401s, intentar refresh con `refreshToken`. Si falla → logout.
3. **UI Condicional por Permisos:** Usar permisos del backend para mostrar/ocultar UI, no nombres de rol hardcodeados. Ej: `if (hasPermission('UNIDAD_CREAR'))` muestra botón "Crear Unidad".
4. **Manejo de Nulos:** Muchos campos pueden ser `null` (`gastoActual`, `cargo`, `fechaSalida`, `estacionamientoNumero`, etc.). La UI no debe romperse.
5. **Idempotencia:** `POST /encomiendas` puede retornar 200 (duplicado) en lugar de 201. El frontend debe manejarlo.
6. **Acciones Dinámicas en Bitácora:** La UI del guardia muestra solo botones válidos según `accionesDisponibles` del endpoint `mi-turno`. No hardcodear botones.
7. **Selector de Condominio:** Primera experiencia post-login. Si 1 solo condominio → saltar directamente al dashboard.
8. **Enum Selectores:** Mapear valores enum a labels legibles (ej: `VISITA` → "Visita", `CUENTA_CORRIENTE` → "Cuenta Corriente").
9. **Fechas:** El backend usa formato ISO-8601. Las fechas pueden ser solo fecha (`2026-07-01`) o datetime (`2026-07-01T10:00:00`). Validar y formatear según el campo.
10. **RUT:** Campo opcional en personas. Formato libre, sin validación de dígito verificador (se guarda como string).

---

_Última actualización: Julio 2026. Documentación generada a partir del código fuente Spring Boot._
