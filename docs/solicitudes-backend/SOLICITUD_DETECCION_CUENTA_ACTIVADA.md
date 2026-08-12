# Solicitud Backend — Señal de cuenta activada (password configurado) para el onboarding

**Versión:** 1.0
**Fecha:** 2026-08-12
**Audiencia:** Equipo backend (Spring Boot)
**Estado:** ✅ Implementada (V52 — `password_set_at` en `usuarios`, `passwordSetAt` expuesto en `AdminUsuarioResponse`)
**Relacionado:** Wizard `SaasCondominioSetupView`, `PasswordResetService.configurarPassword`, `AdminUsuarioResponse` / `AdminUsuarioService`

---

## 1. Contexto / Motivo

En el wizard de "Puesta en marcha" (`SaasCondominioSetupView.vue`), el paso 3 crea el
administrador/presidente del condominio: `POST /personas/{id}` → `POST /personas/{id}/usuario`
→ `POST /miembros`. Al crear la cuenta (`UsuarioGestionService.crearCuenta`), el backend
guarda una **contraseña temporal aleatoria** y envía un email con el link de `setup-password`
(válido 24h, de un solo uso).

Hoy el SUPER_ADMIN no tiene ninguna forma de saber si esa persona **ya configuró su
contraseña y activó la cuenta**. El único dato existente es `TokenVerificacion.usadoEn` de los
tokens `SETUP_PASSWORD`, pero **no hay endpoint que lo exponga** y el `Usuario` no guarda nada.

Necesitamos un **flag/fecha en `Usuario`** para que el frontend pueda mostrar "cuenta
activada" y confirmar que el onboarding terminó de verdad (no solo que se envió el email).

## 2. Solicitud

### 2.1 Campo nuevo en la entidad `Usuario`

Agregar a `src/main/java/com/space/comunidad/domain/usuario/entity/Usuario.java`:

```java
@Column(name = "password_set_at")
private LocalDateTime passwordSetAt;
```

- **`null`** = la cuenta se creó con contraseña temporal y el usuario **aún no configuró**
  su clave (no puede iniciar sesión).
- **con valor** = la cuenta está **activada** (el usuario configuró su contraseña).

Valores: `null` en `crearCuenta` (por defecto, sin cambio necesario — es un campo nuevo).

### 2.2 Marcar el campo en `configurarPassword`

En `src/main/java/com/space/comunidad/domain/auth/service/PasswordResetService.java`, método
`configurarPassword` (línea 111), agregar al mismo bloque donde se setea el password:

```java
usuario.setPassword(passwordEncoder.encode(request.passwordNueva()));
usuario.setPasswordSetAt(LocalDateTime.now());
usuario.setCredencialesVersion(usuario.getCredencialesVersion() + 1);
```

> Nota: este método **ya requiere el fix de `@Transactional`** solicitado en
> `SOLICITUD_REENVIO_EMAIL_CONFIGURAR_CONTRASENA.md` para no fallar con
> `LazyInitializationException`.

### 2.3 Exponer el dato en `AdminUsuarioResponse`

El panel SaaS ya lista los usuarios del condominio en
`GET /api/v1/admin/condominios/{condominioId}/usuarios` (permiso `USUARIO_GESTIONAR`),
que responde `PageResponse<AdminUsuarioResponse>`. Agregar el campo al record:

```java
public record AdminUsuarioResponse(
    UUID usuarioId,
    UUID personaId,
    String nombre,
    String email,
    boolean activo,
    boolean activoEnCondominio,
    LocalDateTime passwordSetAt,   // ← nuevo
    List<String> roles) {
}
```

y poblarlo en `AdminUsuarioService.toResponse` (línea 226):

```java
private AdminUsuarioResponse toResponse(Usuario u, boolean activoEnCondominio) {
  List<String> roles = u.getRoles().stream()
      .map(Rol::getCodigo).sorted().toList();
  return new AdminUsuarioResponse(
      u.getId(),
      u.getPersona().getId(),
      u.getPersona().getNombre(),
      u.getPersona().getEmail(),
      u.isActivo(),
      activoEnCondominio,
      u.getPasswordSetAt(),
      roles);
}
```

## 3. Verificación sugerida

1. Crear cuenta de un usuario (`POST /personas/{id}/usuario` con SUPER_ADMIN):
   `GET /admin/condominios/{cid}/usuarios` → el usuario tiene `passwordSetAt: null`.
2. Configurar contraseña con el link del email (`POST /api/v1/auth/setup-password`):
   repetir el GET → `passwordSetAt` con fecha/hora actual.
3. Regresión: `POST /personas/{id}/usuario` sigue creando cuenta + enviando email;
   `crearCuenta`/`reenviarEmailSetup` no requieren cambios.

## 4. Notas

- **Opción alternativa de menor alcance:** en vez de un campo nuevo, exponer el
  `usadoEn` del último token `SETUP_PASSWORD` del usuario (derivado de
  `TokenVerificacionRepository`). Desventaja: no cubre el caso de un reset posterior
  (el campo queda más directo y semánticamente claro).
- **No es "último acceso":** esta señal dice que la persona configuró su contraseña al
  menos una vez, que es justo lo que el wizard necesita. Un `ultimoAcceso` es un cambio
  mayor (tocar el flujo de login/JWT) y no hace falta para este caso.
- El frontend lo consume en el paso 4 del wizard: al crear el administrador, muestra
  estado "Pendiente de activar" y, cuando `passwordSetAt` tenga valor, "Cuenta activada
  el {fecha}". El `progreso` del wizard ahora es de 4 pasos (storage, unidades, admin,
  activación) y el mensaje "Puesta en marcha completa" exige la activación.
