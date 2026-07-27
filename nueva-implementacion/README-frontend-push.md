# Guía de Integración Web Push — Frontend (Hito 3)

Documento dirigido al desarrollador frontend del proyecto Comunidad.

---

## Archivos entregados

| Archivo | Rol |
|---|---|
| `service-worker.js` | Corre en background — maneja eventos `push` y `notificationclick` |
| `push-manager.js` | Módulo ES — toda la lógica de suscripción, permisos y fallback |
| `notification-banner.js` | Componente UI del banner de invitación |
| `app-shell.js` | Ejemplo de integración — adaptar al framework del proyecto |
| `manifest.json` | Manifest PWA con `display: standalone` |

---

## Integración en 4 pasos

### Paso 1 — Agregar el manifest al HTML raíz

```html
<head>
  <!-- ... otros tags ... -->
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#1e293b" />
  <!-- Para iOS (Safari no lee el manifest aún) -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
</head>
```

### Paso 2 — Registrar la suscripción después del login

```javascript
// En tu store de auth / hook de login
import { onLoginExitoso } from './app-shell.js';

// Después de recibir la respuesta de POST /api/v1/auth/login:
const loginData = await response.json();
guardarTokenEnStore(loginData.accessToken);

await onLoginExitoso(loginData);
// A partir de aquí:
// - Si el usuario ya tenía permiso → push activo, polling detenido
// - Si nunca se preguntó → polling moderado + banner visible
// - Si denegó → polling lento, sin banner
```

### Paso 3 — Limpiar al cerrar sesión

```javascript
import { onLogout } from './app-shell.js';

// En tu función de logout, ANTES de limpiar el token:
await onLogout();
limpiarStore();
redirigirALogin();
```

### Paso 4 — Escuchar la navegación desde el Service Worker

El SW emite un evento `comunidad:navegar` cuando el usuario toca
una notificación nativa. Conectarlo al router de la SPA:

```javascript
// Vue Router
window.addEventListener('comunidad:navegar', (e) => {
  router.push(e.detail.url);
});

// React Router (en un useEffect del componente raíz)
useEffect(() => {
  const handler = (e) => navigate(e.detail.url);
  window.addEventListener('comunidad:navegar', handler);
  return () => window.removeEventListener('comunidad:navegar', handler);
}, []);
```

---

## Íconos necesarios

Crear la carpeta `public/icons/` con los siguientes archivos PNG:

```
icon-72x72.png    icon-96x96.png    icon-128x128.png
icon-144x144.png  icon-152x152.png  icon-192x192.png
icon-384x384.png  icon-512x512.png  badge-72x72.png
```

**Herramienta recomendada:** https://www.pwabuilder.com/imageGenerator
— genera todos los tamaños desde una imagen fuente de 512×512.

El `badge-72x72.png` debe ser monocromático (blanco sobre transparente)
para que el navegador lo use como ícono de conteo de notificaciones.

---

## Ubicación del `service-worker.js`

El SW **debe estar en la raíz del dominio** (`/service-worker.js`), no en
una subcarpeta. Esto le da scope `/` para interceptar todas las peticiones.

Con Vite, colocar el archivo en `public/service-worker.js` — Vite lo copia
a la raíz del build sin procesarlo.

Si usas un bundler que procesa el SW (Webpack, Rollup), usar el plugin
correspondiente (`workbox-webpack-plugin`, `vite-plugin-pwa`).

---

## Estados del sistema push y comportamiento esperado

```
Notification.permission === 'granted'
  → Push activo. Sin polling. Badge se actualiza vía notificación push.
  → El banner NO se muestra.

Notification.permission === 'default' (nunca preguntado)
  → Polling cada 2 minutos.
  → Banner de invitación visible (se puede descartar).
  → Al aceptar: push activo, polling detenido, banner cerrado.
  → Al descartar: polling continúa hasta la próxima sesión.

Notification.permission === 'denied'
  → Polling cada 5 minutos.
  → El banner NO se muestra automáticamente.
  → En página de Configuración > Notificaciones: mostrar instrucciones manuales.
```

---

## Variables de entorno de CORS (backend)

Agregar el dominio del frontend en producción a la variable de entorno
`CORS_ALLOWED_ORIGINS` del backend en Render:

```
# Staging (Coolify)
CORS_ALLOWED_ORIGINS=https://tu-dominio-staging.com,http://localhost:5173

# Producción (Render)
CORS_ALLOWED_ORIGINS=https://tu-dominio.com
```

El registro del Service Worker y las llamadas a `/api/v1/push/*` requieren
que el origen del frontend esté en la lista de orígenes permitidos.

---

## Checklist de verificación (antes de merge)

- [ ] `manifest.json` referenciado en el `<head>` del HTML raíz
- [ ] `service-worker.js` en `public/` (raíz del build)
- [ ] Íconos en `public/icons/` (todos los tamaños listados)
- [ ] `onLoginExitoso()` llamado después del login exitoso
- [ ] `onLogout()` llamado antes de limpiar el token
- [ ] Evento `comunidad:navegar` conectado al router
- [ ] `CORS_ALLOWED_ORIGINS` actualizado en Render/Coolify con el dominio real
- [ ] Probar en Chrome DevTools → Application → Service Workers que el SW esté activo
- [ ] Probar en Chrome DevTools → Application → Push Messaging que llegan mensajes de prueba

---

## Prueba rápida en local

Con el backend corriendo y `PUSH_ENABLED=true`:

```javascript
// En la consola del navegador, tras el login:
const reg = await navigator.serviceWorker.ready;
await reg.showNotification('Prueba Comunidad', {
  body: 'Si ves esto, el Service Worker funciona correctamente.',
  icon: '/icons/icon-192x192.png',
});
```
