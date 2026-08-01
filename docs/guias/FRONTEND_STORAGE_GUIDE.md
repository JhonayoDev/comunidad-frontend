# Guía de integración — Módulo File Storage
**Para:** Equipo Frontend  
**Versión:** feature/file-storage (fix: URL Drive + verificación interceptor)  
**Base URL:** `https://api.comunidad.app` (prod) / `http://localhost:8080` (dev)

---

## Índice

1. [Conceptos clave](#1-conceptos-clave)
2. [Autenticación](#2-autenticación)
3. [Flujo R2 — producción](#3-flujo-r2--producción-el-binario-nunca-toca-el-servidor)
4. [Flujo Drive — dev/demo](#4-flujo-drive--devdemo)
5. [Cómo saber qué flujo usar](#5-cómo-saber-qué-flujo-usar)
6. [Idempotencia — reintentos seguros](#6-idempotencia--reintentos-seguros)
7. [Listar archivos](#7-listar-archivos)
8. [Eliminar archivos](#8-eliminar-archivos)
9. [Categorías disponibles](#9-categorías-disponibles)
10. [Errores y cómo manejarlos](#10-errores-y-cómo-manejarlos)
11. [Código de ejemplo completo](#11-código-de-ejemplo-completo)
12. [Configuración del condominio en el backend](#12-configuración-del-condominio-en-el-backend)

---

## 1. Conceptos clave

### ¿Por qué dos pasos?

El servidor Java tiene **512MB de RAM** en producción. Si el frontend subiera la imagen directamente al backend y este la retransmitiera al storage, consumiría toda la RAM con pocos usuarios simultáneos.

La solución: el backend **solo firma credenciales** y el frontend sube directo al proveedor.

```
┌─────────┐   Paso 1: dame permiso    ┌─────────┐
│Frontend │ ─────────────────────────►│ Backend │
│         │ ◄─────────────────────────│  Java   │
│         │   URL firmada + fileId    └─────────┘
│         │
│         │   Paso 2: sube el archivo          ┌──────────┐
│         │ ──────────────────────────────────►│ R2/Drive │
│         │                                    └──────────┘
│         │
│         │   Paso 3: confirma al backend      ┌─────────┐
│         │ ─────────────────────────────────► │ Backend │
│         │ ◄───────────────────────────────── │  Java   │
└─────────┘   ArchivoResponse (metadatos)      └─────────┘
```

### El campo `proveedor` en la respuesta te dice qué flujo usar

- `"proveedor": "CLOUDFLARE_R2"` → flujo R2 (PUT directo)
- `"proveedor": "GOOGLE_DRIVE"` → flujo Drive (POST multipart al servidor)

---

## 2. Autenticación

Todos los endpoints requieren JWT en la cabecera `Authorization`.

```http
Authorization: Bearer {accessToken}
```

### Permisos necesarios por operación

| Operación | Permiso requerido |
|-----------|------------------|
| Solicitar URL / subir | `ARCHIVO_SUBIR` |
| Listar archivos | `ARCHIVO_VER` |
| Eliminar archivo | `ARCHIVO_ELIMINAR` |

Los permisos vienen en el JWT bajo el claim `permisos`. Si el usuario no tiene el permiso, el backend responde `403 Forbidden`.

---

## 3. Flujo R2 — producción (el binario nunca toca el servidor)

### Paso 1 — Solicitar URL pre-firmada

**`POST /api/v1/condominios/{condominioId}/archivos/solicitar-url`**

**Headers:**
```http
Authorization: Bearer {accessToken}
Content-Type: application/json
Idempotency-Key: {uuidv4}          ← genera uno nuevo por cada intento de subida
```

**Body:**
```json
{
  "categoria": "FINANZAS",
  "nombreArchivo": "comprobante-enero-2025.pdf",
  "contentType": "application/pdf",
  "recursoTipo": "GASTO",
  "recursoId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `categoria` | string enum | ✅ | Ver [sección 9](#9-categorías-disponibles) |
| `nombreArchivo` | string (max 255) | ✅ | Nombre original del archivo con extensión |
| `contentType` | string (max 100) | ✅ | MIME type del archivo |
| `recursoTipo` | string | ❌ | Tipo del recurso dueño: `GASTO`, `ENCOMIENDA`, `BITACORA_ENTRY`, etc. |
| `recursoId` | UUID | ❌ | ID del recurso dueño. Enviar solo si `recursoTipo` también se envía. |

**Respuesta `200 OK`:**
```json
{
  "fileId": "550e8400-e29b-41d4-a716-446655440000",
  "uploadUrl": "https://condominios.r2.cloudflarestorage.com/bucket/condominios/abc.../finanzas/uuid.pdf?X-Amz-Signature=...",
  "method": "PUT",
  "expiresInSeconds": 900,
  "proveedor": "CLOUDFLARE_R2"
}
```

⚠️ **La URL expira en 15 minutos.** Si el usuario demora más, deberás solicitar una nueva URL (usa un `Idempotency-Key` distinto).

---

### Paso 2 — Subir el archivo directamente a R2

Usa la `uploadUrl` recibida. **No agregues el JWT aquí** — la autenticación está embebida en la firma de la URL.

```http
PUT {uploadUrl}
Content-Type: application/pdf       ← debe coincidir exactamente con el enviado en el paso 1

{bytes del archivo}
```

R2 responde `200 OK` si la subida fue exitosa. Si responde `4xx`, la URL expiró o el `Content-Type` no coincide.

---

### Paso 3 — Confirmar la subida al backend

**`POST /api/v1/condominios/{condominioId}/archivos/confirmar`**

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

```json
{
  "fileId": "550e8400-e29b-41d4-a716-446655440000",
  "tamanoBytes": 204800
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `fileId` | UUID | ✅ | El `fileId` recibido en el paso 1 |
| `tamanoBytes` | long | ❌ | Tamaño real del archivo. Se persiste en metadatos. |

**Respuesta `200 OK`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "categoria": "FINANZAS",
  "recursoTipo": "GASTO",
  "recursoId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombreOriginal": "comprobante-enero-2025.pdf",
  "contentType": "application/pdf",
  "tamanoBytes": 204800,
  "proveedor": "CLOUDFLARE_R2",
  "estado": "CONFIRMADO",
  "urlDescarga": "https://condominios.r2.cloudflarestorage.com/bucket/...?X-Amz-Signature=...",
  "createdAt": "2025-01-15T10:30:00",
  "confirmadoEn": "2025-01-15T10:30:45"
}
```

> `urlDescarga` es una URL pre-firmada de lectura válida por **1 hora**. No la guardes en base de datos local — siempre pídela al listar archivos.

---

## 4. Flujo Drive — dev/demo

En desarrollo/demo el proveedor es Google Drive. El flujo tiene los mismos pasos pero el paso 2 va al servidor, no a Drive directamente.

### Paso 1 — igual que R2

Misma petición. La respuesta diferirá en `method` y `uploadUrl`:

```json
{
  "fileId": "550e8400-e29b-41d4-a716-446655440000",
  "uploadUrl": "http://localhost:8080/api/v1/condominios/abc12345-.../archivos/550e8400-.../drive-upload",
  "method": "POST",
  "expiresInSeconds": 900,
  "proveedor": "GOOGLE_DRIVE"
}
```

### Paso 2 — subir al servidor como multipart

**`POST /api/v1/condominios/{condominioId}/archivos/{fileId}/drive-upload`**

> El `condominioId` y `fileId` ya vienen embebidos en el campo `uploadUrl` de la respuesta del Paso 1 — úsalo directamente sin construir la URL manualmente.

```http
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

El campo del formulario debe llamarse exactamente **`file`**:

```
form-data:
  file: [binario del archivo]
```

Límite: **10MB en dev**. Si excede, el servidor responde `400`.

**Respuesta `200 OK`:** igual que la confirmación de R2 — `ArchivoResponse` con estado `CONFIRMADO`.

> En Drive el Paso 3 (confirmar) **no es necesario** — el servidor confirma automáticamente al subir.

---

## 5. Cómo saber qué flujo usar

El campo `proveedor` y `method` de la respuesta del Paso 1 determinan todo:

```javascript
async function subirArchivo(condominioId, file, categoria, recursoTipo, recursoId) {

  // Paso 1 — solicitar URL
  const urlResp = await api.post(
    `/api/v1/condominios/${condominioId}/archivos/solicitar-url`,
    {
      categoria,
      nombreArchivo: file.name,
      contentType: file.type,
      recursoTipo,   // opcional
      recursoId,     // opcional
    },
    { headers: { 'Idempotency-Key': crypto.randomUUID() } }
  )

  const { fileId, uploadUrl, method, proveedor } = urlResp.data

  // Paso 2 — subir según proveedor
  if (proveedor === 'CLOUDFLARE_R2') {
    // PUT directo a R2 — sin Authorization
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })

    // Paso 3 — confirmar al backend
    const confirmResp = await api.post(
      `/api/v1/condominios/${condominioId}/archivos/confirmar`,
      { fileId, tamanoBytes: file.size }
    )
    return confirmResp.data

  } else if (proveedor === 'GOOGLE_DRIVE') {
    // POST multipart al servidor
    const formData = new FormData()
    formData.append('file', file)

    const driveResp = await api.post(
      `/api/v1/condominios/${condominioId}/archivos/${fileId}/drive-upload`,
      formData
    )
    return driveResp.data
    // No necesita paso 3 — ya viene CONFIRMADO
  }
}
```

---

## 6. Idempotencia — reintentos seguros

### ¿Para qué sirve?

Si el usuario tiene red inestable y reintenta la subida, sin idempotencia crearías dos archivos duplicados en storage. Con idempotencia, el servidor detecta que ya procesó esa petición y retorna la respuesta original.

> **Estado:** el `IdempotencyInterceptor` está registrado y activo en todos los endpoints `/api/v1/condominios/*/archivos/**` mediante `StorageWebConfig`. No requiere configuración adicional en el frontend más allá de enviar la cabecera.

### Cómo funciona

1. Antes de llamar al Paso 1, **genera un UUID v4** y guárdalo para ese intento de subida.
2. Envíalo en la cabecera `Idempotency-Key`.
3. Si hay un error de red y necesitas reintentar el Paso 1, **usa el mismo UUID**.
4. Para una **nueva subida diferente**, genera un nuevo UUID.

```javascript
// ✅ CORRECTO — mismo UUID para reintentos del mismo archivo
const idempotencyKey = crypto.randomUUID() // genera una vez

// Intento 1 — falla por red
await api.post('/solicitar-url', body, { headers: { 'Idempotency-Key': idempotencyKey } })
// Intento 2 — reintento con el mismo UUID
await api.post('/solicitar-url', body, { headers: { 'Idempotency-Key': idempotencyKey } })

// ✅ CORRECTO — nuevo UUID para una subida diferente
const otroKey = crypto.randomUUID()
await api.post('/solicitar-url', otroBody, { headers: { 'Idempotency-Key': otroKey } })
```

### Respuesta al reenviar la misma clave

El servidor responde con el **mismo status y body** del procesamiento original, más las cabeceras:

```http
HTTP/1.1 200 OK
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
X-Idempotency-Replayed: true

{ ... respuesta original ... }
```

Detectar `X-Idempotency-Replayed: true` es útil para logging, pero **no cambia lo que debes hacer** — trátalo igual que una respuesta exitosa normal.

### TTL de la clave

Las claves de idempotencia expiran en **24 horas**. Después de ese plazo, el mismo UUID se trata como una petición nueva.

---

## 7. Listar archivos

**`GET /api/v1/condominios/{condominioId}/archivos?categoria={CATEGORIA}`**

```http
Authorization: Bearer {accessToken}
```

Solo retorna archivos en estado `CONFIRMADO`. Los archivos `PENDIENTE` o `ELIMINADO` no aparecen.

**Respuesta `200 OK`:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "categoria": "FINANZAS",
    "recursoTipo": "GASTO",
    "recursoId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nombreOriginal": "comprobante-enero-2025.pdf",
    "contentType": "application/pdf",
    "tamanoBytes": 204800,
    "proveedor": "CLOUDFLARE_R2",
    "estado": "CONFIRMADO",
    "urlDescarga": "https://...presigned-url...",
    "createdAt": "2025-01-15T10:30:00",
    "confirmadoEn": "2025-01-15T10:30:45"
  }
]
```

⚠️ **`urlDescarga` expira en 1 hora.** No la cachees en Redux/Zustand indefinidamente. Vuelve a llamar a este endpoint cuando necesites mostrar el archivo.

### Filtrar archivos de un recurso específico

Por ahora no hay endpoint de filtro por `recursoId` en la lista pública. La forma recomendada es filtrar en el frontend sobre la lista de la categoría, o usar el `recursoId` que ya viene en cada item:

```javascript
const archivosDelGasto = archivos.filter(a => a.recursoId === gastoId)
```

---

## 8. Eliminar archivos

**`DELETE /api/v1/condominios/{condominioId}/archivos/{fileId}`**

```http
Authorization: Bearer {accessToken}
```

**Respuesta `204 No Content`** — sin body.

El archivo se marca como `ELIMINADO` en la base de datos y se borra del proveedor. Si el borrado del proveedor falla, igual queda marcado como eliminado y no aparecerá en listados (el backend lo reintentará internamente).

---

## 9. Categorías disponibles

| Valor | Uso recomendado |
|-------|----------------|
| `FINANZAS` | Comprobantes de pago, facturas, cotizaciones |
| `ENCOMIENDA` | Fotos de paquetes recibidos |
| `BITACORA` | Fotos de novedades en turno del guardia |
| `DOCUMENTO` | Actas de asamblea, reglamento interno, contratos |
| `AVATAR` | Foto de perfil de persona |
| `OTRO` | Cualquier otro archivo que no encaje en las anteriores |

---

## 10. Errores y cómo manejarlos

### Estructura de error estándar

```json
{
  "status": 400,
  "codigo": "ARCHIVO_INVALIDO",
  "mensaje": "El archivo excede el límite de 20MB.",
  "timestamp": "2025-01-15T10:30:00"
}
```

### Tabla de errores

| HTTP | `codigo` | Causa | Qué hacer en el frontend |
|------|----------|-------|--------------------------|
| `400` | `ARCHIVO_INVALIDO` | Formato no soportado, archivo vacío, o supera el límite de tamaño | Mostrar `mensaje` al usuario |
| `400` | (Bean Validation) | Campo faltante o inválido en el body | Mostrar errores de campo |
| `401` | — | JWT expirado o inválido | Refrescar token y reintentar |
| `403` | — | Usuario sin permiso `ARCHIVO_SUBIR` | Mostrar "sin permisos" al usuario |
| `404` | — | Condominio sin config de storage, o `fileId` inexistente | Error de configuración — notificar al admin |
| `409` | `IDEMPOTENCY_CONFLICT` | `Idempotency-Key` ya fue procesada | Ver cabecera `X-Idempotency-Replayed` — tratar como éxito |
| `502` | `STORAGE_PROVIDER_ERROR` | R2 o Drive no disponible | Mostrar "servicio temporalmente no disponible, intente más tarde" |

### Manejo del 409 de idempotencia

```javascript
try {
  const resp = await api.post('/solicitar-url', body, {
    headers: { 'Idempotency-Key': key }
  })
  return resp.data

} catch (error) {
  if (error.response?.status === 409) {
    const replayed = error.response.headers['x-idempotency-replayed']
    if (replayed === 'true') {
      // Ya fue procesado antes — el body tiene la respuesta original
      return error.response.data
    }
    // Otro tipo de conflicto
    throw error
  }
  throw error
}
```

---

## 11. Código de ejemplo completo

### Hook React con manejo de reintentos

```typescript
import { useState, useRef } from 'react'

interface SubidaConfig {
  condominioId: string
  categoria: 'FINANZAS' | 'ENCOMIENDA' | 'BITACORA' | 'DOCUMENTO' | 'AVATAR' | 'OTRO'
  recursoTipo?: string
  recursoId?: string
}

export function useFileUpload() {
  const [progreso, setProgreso] = useState<number>(0)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Conservar la key entre reintentos del mismo archivo
  const idempotencyKeyRef = useRef<string | null>(null)

  async function subirArchivo(file: File, config: SubidaConfig) {
    setSubiendo(true)
    setError(null)
    setProgreso(0)

    // Generar key solo si es un intento nuevo (no un reintento)
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID()
    }

    try {
      // ── Paso 1: solicitar URL ──────────────────────────────────────────────
      const urlResp = await fetch(
        `/api/v1/condominios/${config.condominioId}/archivos/solicitar-url`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKeyRef.current,
          },
          body: JSON.stringify({
            categoria: config.categoria,
            nombreArchivo: file.name,
            contentType: file.type || 'application/octet-stream',
            recursoTipo: config.recursoTipo,
            recursoId: config.recursoId,
          }),
        }
      )

      if (!urlResp.ok) {
        // Si es 409 con replay, tratar como éxito
        if (urlResp.status === 409 &&
            urlResp.headers.get('X-Idempotency-Replayed') === 'true') {
          return await urlResp.json()
        }
        const err = await urlResp.json()
        throw new Error(err.mensaje || 'Error solicitando URL de subida')
      }

      const { fileId, uploadUrl, method, proveedor } = await urlResp.json()
      setProgreso(20)

      // ── Paso 2: subir según proveedor ─────────────────────────────────────
      if (proveedor === 'CLOUDFLARE_R2') {

        // PUT directo a R2 con XMLHttpRequest para seguimiento de progreso
        await subirAR2(uploadUrl, file, (p) => setProgreso(20 + p * 0.7))
        setProgreso(90)

        // ── Paso 3: confirmar ────────────────────────────────────────────────
        const confirmResp = await fetch(
          `/api/v1/condominios/${config.condominioId}/archivos/confirmar`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getAccessToken()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileId, tamanoBytes: file.size }),
          }
        )

        if (!confirmResp.ok) throw new Error('Error confirmando la subida')
        setProgreso(100)
        // Reset key para la próxima subida diferente
        idempotencyKeyRef.current = null
        return await confirmResp.json()

      } else if (proveedor === 'GOOGLE_DRIVE') {

        const formData = new FormData()
        formData.append('file', file)

        const driveResp = await fetch(
          `/api/v1/condominios/${config.condominioId}/archivos/${fileId}/drive-upload`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getAccessToken()}` },
            body: formData,
          }
        )

        if (!driveResp.ok) {
          const err = await driveResp.json()
          throw new Error(err.mensaje || 'Error subiendo a Drive')
        }
        setProgreso(100)
        idempotencyKeyRef.current = null
        return await driveResp.json()
      }

    } catch (e: any) {
      setError(e.message)
      // NO resetear idempotencyKeyRef — conservar para reintento
      throw e
    } finally {
      setSubiendo(false)
    }
  }

  function reintentar(file: File, config: SubidaConfig) {
    // Usa la misma idempotencyKey del intento fallido
    return subirArchivo(file, config)
  }

  function nuevaSubida(file: File, config: SubidaConfig) {
    // Forzar nueva key para un archivo diferente
    idempotencyKeyRef.current = null
    return subirArchivo(file, config)
  }

  return { subirArchivo, reintentar, nuevaSubida, progreso, subiendo, error }
}

// Subida a R2 con seguimiento de progreso usando XMLHttpRequest
function subirAR2(
  uploadUrl: string,
  file: File,
  onProgreso: (fraccion: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgreso(e.loaded / e.total)
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`R2 respondió ${xhr.status}: ${xhr.responseText}`))
    })

    xhr.addEventListener('error', () => reject(new Error('Error de red subiendo a R2')))
    xhr.addEventListener('abort', () => reject(new Error('Subida cancelada')))

    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

function getAccessToken(): string {
  // Implementar según tu store de auth (Redux, Zustand, cookie, etc.)
  return localStorage.getItem('accessToken') ?? ''
}
```

---

## 12. Configuración del condominio en el backend

Antes de que cualquier condominio pueda subir archivos, un `SUPER_ADMIN` o `SOPORTE` debe crear su configuración de storage en la tabla `condominio_storage_config`. Por ahora no hay endpoint REST para esto — se hace directamente en la base de datos o mediante un script de seed.

### Config para dev/demo (Google Drive)

```sql
INSERT INTO condominio_storage_config (
  condominio_id, proveedor,
  drive_folder_id, drive_credentials,
  activa
) VALUES (
  '{uuid-del-condominio}',
  'GOOGLE_DRIVE',
  '1BxiMVs0XRA5nFMdKvBd...',   -- ID de carpeta raíz en Drive
  '{json cifrado con AES-256}', -- generado por CredentialCipherService.encrypt()
  true
);
```

### Config para producción (Cloudflare R2)

```sql
INSERT INTO condominio_storage_config (
  condominio_id, proveedor,
  r2_bucket, r2_account_id, r2_access_key_id, r2_secret_key, r2_public_url,
  activa
) VALUES (
  '{uuid-del-condominio}',
  'CLOUDFLARE_R2',
  'comunidad-prod',
  '{account-id-de-cloudflare}',
  '{access-key-id}',
  '{secret-key-cifrada-con-AES-256}',
  null,   -- null = acceso privado con pre-firma; o URL pública si el bucket es público
  true
);
```

### Variables de entorno requeridas en el servidor

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `APP_STORAGE_CIPHER_KEY` | Clave AES-256 (exactamente 32 caracteres) | `mi-clave-segura-de-32-caracteres!` |
| `APP_BASE_URL` | URL base del servidor (usado en Drive) | `https://api.comunidad.app` |

---

## Resumen rápido del flujo completo

```
1. crypto.randomUUID()                    → genera Idempotency-Key
2. POST /archivos/solicitar-url           → obtienes fileId + uploadUrl + proveedor
   - Si proveedor == CLOUDFLARE_R2:
3a. PUT {uploadUrl} (directo, sin JWT)    → subes el binario a R2
4a. POST /archivos/confirmar { fileId }   → confirmas al backend
   - Si proveedor == GOOGLE_DRIVE:
3b. POST /archivos/{fileId}/drive-upload  → subes como multipart al servidor
    (el servidor confirma automáticamente)
5.  ArchivoResponse                       → tienes el id, urlDescarga, metadatos
```

