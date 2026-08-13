# Solicitud Backend — Ordenamiento por fecha en el log de auditoría SaaS

**Versión:** 1.0
**Fecha:** 2026-08-12
**Audiencia:** Equipo backend (Spring Boot)
**Estado:** **Implementado** — `AdminAuditoriaController.listar` agrega `sort` (default `createdAt,desc`, whitelist `createdAt`, direcciones asc/desc sin error); `AuditoriaService.listar` recibe `Sort` y construye el `Pageable` respetando `PageableDefaults.MAX_SIZE`; `listarPorCondominio` delega con `Sort.by(DESC, "createdAt")` preservando su comportamiento; `SaasAuditLogRepository` sin cambios (Spring Data aplica el ORDER BY). El índice `idx_saas_audit_created` (created_at DESC) de V23 soporta el default. Frontend integrado: `SaasAuditoriaView.vue` envía `sort=createdAt,{asc|desc}` (default desc) con Select de orden y header "Fecha" clicable.
**Relacionado:** `AdminAuditoriaController` · `AuditoriaService` · `SaasAuditLogRepository`

---

## 1. Contexto

`GET /api/v1/admin/auditoria` (permiso `AUDITORIA_VER`, roles SUPER_ADMIN/SOPORTE) devuelve el
log de auditoría SaaS paginado. Hoy la consulta **no tiene orden definido**:

- `AuditoriaService.listar(...)` construye el `Pageable` con `PageableDefaults.of(page, size)`
  (sin campo de orden → `PageRequest.of(page, size)` sin `Sort`).
- `SaasAuditLogRepository.listarFiltrado(...)` no declara `ORDER BY`.

El frontend (`SaasAuditoriaView.vue`) renderiza este log en una tabla tipo planilla (desktop)
con paginación. El **SUPER_ADMIN** entra a la vista esperando ver **primero lo más reciente**,
y necesita poder alternar entre "más recientes primero" y "más antiguas primero".

Con paginación, el orden **debe venir del servidor**: ordenar solo la página visible en el
cliente es inconsistente (cada página mantendría su propio orden al navegar).

## 2. Solicitud

Agregar el parámetro `sort` al endpoint, con **default `createdAt,desc`**:

```
GET /api/v1/admin/auditoria?sort=createdAt,asc
GET /api/v1/admin/auditoria?sort=createdAt,desc   (default)
GET /api/v1/admin/auditoria                        (sin sort → createdAt,desc)
```

Formato: `{campo},{asc|desc}`. **Whitelist de campos**: solo `createdAt` (hoy no se necesita
otro; extensible en el futuro).

Cambios sugeridos (mínimos y aislados):

**1. `AdminAuditoriaController.listar`** — aceptar `sort`, parsear y validar contra whitelist:

```java
@GetMapping
@PreAuthorize("hasPermission(null, 'AUDITORIA_VER')")
public PageResponse<AuditoriaLogResponse> listar(
    @RequestParam(required = false) UUID condominioId,
    @RequestParam(required = false) String accion,
    @RequestParam(required = false) String email,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta,
    @RequestParam(defaultValue = "createdAt,desc") String sort,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "50") int size) {

  String[] parts = sort.split(",");
  String field = parts[0];
  if (!"createdAt".equals(field)) field = "createdAt";
  Sort.Direction dir = (parts.length > 1 && "asc".equalsIgnoreCase(parts[1]))
      ? Sort.Direction.ASC : Sort.Direction.DESC;

  return auditoriaService.listar(condominioId, accion, desde, hasta, email,
      page, size, Sort.by(dir, field));
}
```

**2. `AuditoriaService.listar`** — recibir `Sort` y construir el `Pageable` respetando
`PageableDefaults.MAX_SIZE`:

```java
public PageResponse<AuditoriaLogResponse> listar(
    UUID condominioId, String accion, LocalDateTime desde, LocalDateTime hasta,
    String email, int page, int size, Sort sort) {

  String emailPattern = (email != null && !email.isBlank())
      ? "%" + email.toLowerCase() + "%" : null;

  Pageable pageable = PageRequest.of(
      Math.max(page, 0),
      Math.min(Math.max(size, 1), PageableDefaults.MAX_SIZE),
      sort);

  Page<SaasAuditLog> pageResult = repo.listarFiltrado(condominioId, accion, desde,
      hasta, emailPattern, pageable);

  List<AuditoriaLogResponse> content = pageResult.getContent().stream()
      .map(this::toResponse).toList();

  return new PageResponse<>(content,
      pageResult.getNumber(), pageResult.getSize(),
      pageResult.getTotalElements(), pageResult.getTotalPages(),
      pageResult.isFirst(), pageResult.isLast());
}
```

**3. `SaasAuditLogRepository.listarFiltrado`** — **sin cambios**: Spring Data JPA aplica el
`ORDER BY` automáticamente a partir del `Sort` del `Pageable`. `listarPorCondominio` puede
delegar con `Sort.by(Sort.Direction.DESC, "createdAt")` para mantener su comportamiento.

## 3. Verificación sugerida

1. `GET /admin/auditoria` (sin `sort`) → primera página con `createdAt` **descendente**.
2. `GET /admin/auditoria?sort=createdAt,asc` → `createdAt` ascendente.
3. `GET /admin/auditoria?sort=createdAt,desc` → descendente.
4. `GET /admin/auditoria?sort=maligno,x` → cae a whitelist `createdAt` (nunca error).
5. Regresión: filtros (`condominioId`, `accion`, `email`, `desde`/`hasta`) intactos.

## 4. Notas

- El frontend **no necesita cambios para obtener el default** (nuevo primero): basta el
  default del backend. **Integrado**: `SaasAuditoriaView.vue` envía `sort=createdAt,{asc|desc}`
  (default `desc`) mediante un Select "Orden" en los filtros ("Más recientes primero" /
  "Más antiguas primero") y el header "Fecha" de la tabla desktop también alterna el orden
  con un clic (ícono `pi-sort-amount-*`). Al cambiar el orden se reinicia la página a 0.
