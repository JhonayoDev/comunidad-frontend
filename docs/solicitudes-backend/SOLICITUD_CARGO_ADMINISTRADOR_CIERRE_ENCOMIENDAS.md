# Solicitud Backend — Cargo ADMINISTRADOR puede cerrar encomiendas

**Versión:** 1.0
**Fecha:** 2026-08-03
**Audiencia:** Equipo backend (Spring Boot / `EncomiendaService`)
**Estado:** Pendiente de análisis
**Relacionado:** `SOLICITUD_NOTIFICACIONES_POR_CONTEXTO.md` (contexto dual residente/cargo)

---

## 1. Contexto

El modelo contempla que **ADMINISTRADOR existe tanto como rol como cargo**:

- **Rol** ADMINISTRADOR → persona externa que administra el condominio (no reside).
- **Cargo** ADMINISTRADOR → un residente que ocupa el cargo de administrador (revocable, al igual que PRESIDENTE/TESORERO/SECRETARIO/DELEGADO).

Ambos deben tener el mismo comportamiento operativo. El `cargo_permisos` del cargo ADMINISTRADOR (`V9__cargo_permisos_operativos.sql`) ya incluye `ENCOMIENDA_VER`, `ENCOMIENDA_CREAR` y `ENCOMIENDA_ENTREGAR`.

### Problema concreto

En `EncomiendaService`:

```java
// Roles que pueden cerrar encomiendas por su rol de sistema.
private static final Set<String> ROLES_PUEDE_CERRAR = Set.of("ADMINISTRADOR", "SUPER_ADMIN", "SOPORTE");

// Cargos organizacionales que pueden cerrar encomiendas.
private static final Set<CargoCondominio> CARGOS_PUEDE_CERRAR = Set.of(CargoCondominio.PRESIDENTE,
    CargoCondominio.SECRETARIO);
```

`puedesCerrar(...)` (línea 378) verifica primero si el usuario tiene el **rol** ADMINISTRADOR (pasando) y luego si tiene un **cargo** de `CARGOS_PUEDE_CERRAR`.

**Un residente con cargo ADMINISTRADOR no tiene el rol ADMINISTRADOR** (su rol es RESIDENTE) y el cargo ADMINISTRADOR **no está** en `CARGOS_PUEDE_CERRAR` → **no puede cerrar encomiendas** (solo entregarlas). Es inconsistente con que el cargo ADMINISTRADOR deba ser el equivalente operativo del rol admin.

---

## 2. Solicitud

Agregar `CargoCondominio.ADMINISTRADOR` a `CARGOS_PUEDE_CERRAR`:

```java
private static final Set<CargoCondominio> CARGOS_PUEDE_CERRAR = Set.of(
    CargoCondominio.PRESIDENTE,
    CargoCondominio.SECRETARIO,
    CargoCondominio.ADMINISTRADOR);
```

El mensaje de error de `AccessDeniedException` ("Solo ADMINISTRADOR, PRESIDENTE o SECRETARIO pueden cerrar encomiendas.") queda válido, pues "ADMINISTRADOR" cubre ahora tanto el rol como el cargo.

---

## 3. Impacto en el frontend

- Ninguno directo: el botón de cierre en `EncomiendasView` ya se muestra con el permiso `ENCOMIENDA_ENTREGAR`. Al habilitar el cierre por cargo, el residente con cargo ADMINISTRADOR podrá cerrar sin cambios de UI.

---

## 4. Aceptación (criterios)

- [ ] Un usuario con rol RESIDENTE y cargo ADMINISTRADOR activo puede cerrar una encomienda (`PATCH /encomiendas/{id}/cerrar` → 200).
- [ ] Un guardia (rol o cargo) sigue sin poder cerrar (solo entregar).
- [ ] El historial de auditoría registra el CIERRE con `realizado_por` del usuario.
