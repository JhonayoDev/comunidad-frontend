# Solicitud Backend — Reenviar email de configuración de contraseña (setup-password)

**Versión:** 1.0
**Fecha:** 2026-08-12
**Audiencia:** Equipo backend (Spring Boot)
**Estado:** Pendiente de implementación
**Relacionado:** Flujo del wizard `SaasCondominioSetupView` y `UsuarioGestionController`

---

## 1. Contexto / Motivo

Cuando un administrador crea la cuenta de un usuario (`POST /personas/{id}/usuario`),
el backend genera un token `SETUP_PASSWORD` y envía **una sola vez** el email con el
link para configurar la contraseña (válido 24h, de un solo uso).

Casos reales que hoy quedan **sin solución**:

1. El usuario **nunca recibe / pierde el email** inicial de setup.
2. El token **expiró (24h)** o **ya fue consumido** (por ejemplo, un intento fallido
   que lo marcó como usado) y el usuario no puede configurar su contraseña.
3. Soporte recibe el caso "el usuario X no pudo entrar". Hoy la única salida es
   **crear un condominio nuevo** (el wizard recién creado reenvía el email) o
   **insertar un token a mano en BD**. Ninguna es operativa.

**Flujo deseado para soporte:** si el usuario X no pudo entrar → o bien se le indica
que use **"Restablecer contraseña"** (`/auth/forgot-password`, cuando ya configuró y
olvidó), o bien **se le reenvía el email de configuración de contraseña** (cuando su
cuenta aún no tiene contraseña configurada o perdió/expiró el link). Para esto último
se necesita un endpoint que genere un token `SETUP_PASSWORD` nuevo y reenvíe el email.

## 2. Problema adicional detectado (fix necesario para que el flujo funcione)

`configurarPassword` (setup-password) actualmente devuelve **HTTP 500** con
`LazyInitializationException` para cualquier token válido:

- `PasswordResetService.configurarPassword` (`src/main/java/.../auth/service/PasswordResetService.java`)
  **no tiene `@Transactional`** (a diferencia de `aplicarReset`).
- `TokenVerificacion.usuario` es `@ManyToOne(fetch = FetchType.LAZY)` y se accede con
  `token.getUsuario()` **fuera de transacción** → falla al cargar la relación lazy.

Solicitamos agregar `@Transactional` a `configurarPassword` (mismo patrón que
`aplicarReset`, línea 62). Sin este fix, el endpoint de reenvío sería inútil (el token
nuevo también fallaría con 500 al configurar la contraseña).

## 3. Solicitud — Endpoint de reenvío de email de setup

Nuevo endpoint **POST** en `UsuarioGestionController` (base
`/api/v1/condominios/{condominioId}`), permiso **`USUARIO_GESTIONAR`** (el mismo que ya
usa `POST /personas/{personaId}/usuario`), que **no crea cuenta** sino que genera un
**token `SETUP_PASSWORD` nuevo** y **reenvía el email** de configuración:

```
POST /api/v1/condominios/{condominioId}/personas/{personaId}/usuario/reconfigurar
```

- **Request:** sin body (o vacío).
- **Response:** `200` con `UsuarioGestionResponse` (`usuarioId`, `personaId`, `nombre`,
  `email`, `rol`, `activo`, `mensaje` = "Se reenvió un email a {email} para configurar
  la contraseña.").
- **Errores:**
  - `404` si la persona no existe o **no tiene cuenta de usuario** (no se puede
    "configurar contraseña" de quien no tiene cuenta — debe creársela antes).
  - `409` si se reenvía en ráfaga (opcional: validar no reenviar mientras el token
    anterior siga vigente).
- **Comportamiento:** `validarAcceso(usuario, condominioId)` → buscar persona →
  `usuarioRepository.findByPersonaId(personaId)` (404 si no existe) →
  `tokenService.crearToken(usuario, PropositoToken.SETUP_PASSWORD, null)` →
  `enviarEmailSetup(persona, token.getTokenOriginalTransient())` (reutilizar el método
  privado de `UsuarioGestionService`).

### Implementación sugerida

En `UsuarioGestionController`:

```java
@PostMapping("/personas/{personaId}/usuario/reconfigurar")
@PreAuthorize("hasPermission(null, 'USUARIO_GESTIONAR')")
@Operation(summary = "Reenviar email de configuración de contraseña", description = """
    Genera un token SETUP_PASSWORD nuevo y reenvía el email con el link de
    configuración (válido 24h, un solo uso). No crea la cuenta.
    """)
public ResponseEntity<UsuarioGestionResponse> reenviarSetup(
    @PathVariable UUID condominioId,
    @PathVariable UUID personaId,
    @AuthenticationPrincipal Usuario usuario) {
  condominioAccessService.validarAcceso(usuario, condominioId);
  return ResponseEntity.ok(usuarioGestionService.reenviarEmailSetup(personaId));
}
```

En `UsuarioGestionService`:

```java
@Transactional
public UsuarioGestionResponse reenviarEmailSetup(UUID personaId) {
  Persona persona = personaRepository.findById(personaId)
      .orElseThrow(() -> new NotFoundException("Persona", personaId));
  Usuario usuario = usuarioRepository.findByPersonaId(personaId)
      .orElseThrow(() -> new IllegalStateException(
          "La persona no tiene cuenta de usuario. Crea la cuenta primero."));

  var token = tokenService.crearToken(usuario, PropositoToken.SETUP_PASSWORD, null);
  enviarEmailSetup(persona, token.getTokenOriginalTransient());

  return new UsuarioGestionResponse(
      usuario.getId(), persona.getId(), persona.getNombre(), persona.getEmail(),
      usuario.getRoles().stream().findFirst().map(Rol::getCodigo).orElse("SIN_ROL"),
      usuario.isActivo(),
      "Se reenvió un email a " + persona.getEmail() + " para configurar la contraseña.");
}
```

## 4. Verificación sugerida

1. **Fix del 500:** con un token `SETUP_PASSWORD` vigente,
   `POST /api/v1/auth/setup-password` con `passwordNueva`/`passwordNuevaConfirmacion`
   válidas → **200** (antes 500). Repetir con el mismo token → **409** (ya usado).
2. `POST /condominios/{cid}/personas/{personaId}/usuario/reconfigurar` con persona que
   tiene cuenta → **200** y llega el email con un **token distinto** al anterior.
3. Usar el link del nuevo email → `setup-password` responde **200** y el usuario ya
   puede iniciar sesión con su nueva contraseña.
4. Persona sin cuenta de usuario → **404/409** claro, sin enviar email.
5. Regresión: `POST /personas/{id}/usuario` sigue creando cuenta + enviando email.

## 5. Notas

- El endpoint **no crea la cuenta** — solo reenvía el email para cuentas ya existentes.
  Quien no tenga cuenta pasa por el flujo normal de creación.
- El frontend lo consumirá para agregar la acción **"Reenviar email de configuración"**
  en el listado de usuarios del panel SaaS (`SaasUsuariosView`) y, si aplica, como
  acción de respaldo en el wizard de puesta en marcha. Queda pendiente su integración
  visual una vez implementado el endpoint.
- El email reutiliza el mismo template de `enviarEmailSetup`
  (`frontendUrl + "/auth/setup-password?token=" + token`).
