# Informe de revisión — Vista Personas (ADMINISTRADOR)

> **Fecha:** 2026-10-31
> **Alcance:** `src/views/admin/PersonasView.vue`, `personasService`, `unidadesService`, ruta/permisos de `Personas` y estándares UI del proyecto.
> **Estado:** auditoría de solo lectura; no se modificó código.
> **Verificación:** revisión estática, `pnpm build`, CSS compilado y API local. Sin captura visual en navegador.

---

## 1. Resumen ejecutivo

La vista **funciona contra la API real**, usa componentes PrimeVue permitidos y tiene una base mobile-first. Sin embargo, **no está alineada con el estándar visual de la app** y presenta problemas funcionales relevantes:

1. **No cumple la regla de superficies**: usa `surface-card`, `border-round`, `shadow-1` y `surface-50`, clases que **no existen en el CSS compilado**. Las tarjetas quedan sin fondo, radio ni sombra, y los vínculos sin sub-superficie. Es el mismo antipatrón documentado en `docs/guias/tabla-planilla-responsive.md:17-20`.
2. **No usa el patrón planilla**: en desktop se sigue mostrando la misma lista de cards que en mobile, sin tabla ni paginación. Con los datos locales actuales (**477 personas**) se renderizan 477 cards.
3. **Carga de vínculos con N+1**: un clic en “Vínculos” hace **una petición por cada unidad** (205 en el condominio local). Existe `GET /personas/{id}`, que devuelve los vínculos en **una sola petición**.
4. **Permisos desalineados**: la ruta permite `PRESIDENTE` y `SECRETARIO`, pero la vista muestra “Desactivar persona” (`PERSONA_ELIMINAR`) y “Crear usuario” (`USUARIO_GESTIONAR`), permisos que esos cargos no tienen → 403.
5. **Errores invisibles**: varios fallos de creación/edición no se muestran dentro del diálogo; el error global reemplaza la lista y queda detrás del modal.
6. **Flujo “Nuevo vínculo” roto**: se pierde la persona seleccionada y se pide pegar un **UUID** a mano. Además, tras crear el vínculo no se refresca la lista.
7. **Datos incompletos**: el backend entrega `rut`, `telefono`, `cargo` y `tieneUsuario`; la vista solo muestra nombre y email. La creación manual no permite capturar RUT ni teléfono, y el RUT ya no se puede agregar después porque el PUT solo acepta nombre/teléfono.

**Conclusión:** la vista requiere una corrección de superficie/estándar y una reestructuración del flujo de vínculos y errores antes de considerarla terminada.

---

## 2. Qué renderiza hoy

### 2.1 Estructura

| Bloque | Implementación actual |
|---|---|
| Cabecera | Título “Personas” + botón primario “Nueva persona” |
| Búsqueda | `Card` con `InputText` que filtra localmente por nombre/email |
| Listado | Lista vertical de `div` por persona; cada uno con nombre/email y 4 botones solo-ícono |
| Crear persona | `Dialog` con Nombre y Email |
| Editar persona | `Dialog` con Nombre y Teléfono |
| Vínculos | `Dialog` con listado de vínculos y botón “Nuevo vínculo” |
| Crear vínculo | `Dialog` con “Persona ID” (UUID), Unidad, Tipo y checkbox “Ocupante” |
| Crear usuario | `Dialog` con selector de Rol (`RESIDENTE`/`GUARDIA`) |
| Estados | `Skeleton` de 300 px, `Message` de error global, empty state simple |

### 2.2 Datos que entrega el backend vs. lo que se muestra

`PersonaResumenResponse` entrega:

| Campo | ¿Se muestra? | Observación |
|---|---|---|
| `nombre` | Sí | En la card |
| `email` | Sí | En la card |
| `rut` | No | Dato clave para identificar personas |
| `telefono` | No | Solo aparece en el diálogo de edición |
| `activo` | No | El listado ya filtra activos |
| `tieneUsuario` | No | La acción “Crear usuario” se muestra siempre |
| `cargo` | No | No se ve si la persona ocupa un cargo |

`VinculoResponse` entrega además:

| Campo | ¿Se muestra? |
|---|---|
| `tipo` | Sí, pero como enum crudo (`PROPIETARIO`) |
| `unidadNumero` | Sí |
| `esOcupante` | No |
| `recibeNotificaciones` | No |
| `esResponsable` | No |
| `fechaInicio` / `fechaFin` | No |
| `activo` | No |

`PersonaDetalleResponse` ya incluye `usuario`, `cargo` y `vinculos` con `unidadNumero`, pero la vista no lo consume.

---

## 3. Cumplimiento del estándar

| Criterio | Estado | Evidencia |
|---|---|---|
| Superficies y tokens (`bg-surface`, `bg-inset`, `border-border`) | **No cumple** | `surface-card`, `border-round`, `shadow-1`, `surface-50` en `PersonasView.vue:247` y `:303`; 0 coincidencias en CSS compilado |
| Botones: intención, tamaño, `title`/`aria-label`, cancelar | **Parcial** | Ver §4.10 |
| Listados tabulares: planilla desktop + cards mobile | **No cumple** | No hay tabla `.planilla` ni breakpoint `md:` |
| Responsive mobile-first | **Parcial** | Base vertical, pero la fila de acciones no cabe a 320 px |
| Manejo de errores visible | **No cumple** | Errores globales detrás de modales; un `catch` vacío |
| Permisos por acción | **No cumple** | `PERSONA_ELIMINAR` y `USUARIO_GESTIONAR` no se validan en la UI |
| Accesibilidad | **Parcial** | Botones solo-ícono sin `title`/`aria-label`; labels sin `for`/`id` |
| PrimeVue permitido / sin mocks | **Cumple** | Card, Button, Dialog, InputText, Select, Checkbox, Tag, Skeleton, Message, ConfirmDialog; servicios reales |
| Uso de datos del backend | **Parcial** | Solo nombre/email; ignora RUT, teléfono, cargo, usuario y flags de vínculo |
| Rendimiento | **No cumple** | 477 cards; 205 peticiones por clic en “Vínculos” |

---

## 4. Hallazgos priorizados

### P0 — Bloqueante visual

#### P0.1 Clases de superficie inexistentes

**Archivo:** `src/views/admin/PersonasView.vue:247`, `:303`

```html
class="surface-card p-3 border-round shadow-1"
class="... p-2 surface-50 border-round"
```

**Problema:** `surface-card`, `shadow-1`, `border-round` y `surface-50` no están definidas en el proyecto. El build genera CSS sin esas clases:

```text
surface-card: 0
shadow-1: 0
border-round: 0
surface-50: 0
```

**Impacto:** las tarjetas del listado y las filas de vínculos **no tienen fondo, radio ni sombra**. En modo claro/oscuro el contraste depende del fondo de página; no hay separación visual. Es exactamente el bug que el lineamiento prohíbe (`docs/guias/tabla-planilla-responsive.md:17-20`, `docs/ui/ui-estandar.md:39-50`).

**Corrección:**

```html
class="bg-surface border border-border-soft rounded-lg p-3"
class="bg-inset border border-border-soft rounded-lg p-2"
```

Eliminar `surface-card`, `shadow-1`, `border-round`, `surface-50` de esta vista.

---

### P1 — Alto

#### P1.1 N+1 al abrir vínculos

**Archivo:** `src/views/admin/PersonasView.vue:148-170`

```js
for (const u of unidades.value) {
  const { data } = await personasService.vinculosUnidad(cid, u.id);
  ...
}
```

**Problema:** con 205 unidades, un clic en “Vínculos” dispara **205 peticiones HTTP secuenciales**. No hay spinner, y cada error interno se ignora con `catch { /* skip */ }`. Si una petición falla, el resultado queda incompleto y se muestra como si no hubiera vínculos.

**Impacto:** lentitud, saturación de red/rate limit y resultados silenciosamente incorrectos.

**Corrección:** usar el detalle de persona, que ya retorna los vínculos:

```js
const { data } = await personasService.obtener(cid, p.id);
vinculos.value = data.vinculos || [];
```

`personasService.obtener()` existe en `src/services/personasService.js:8-10`. Si se necesitan `recibeNotificaciones`/`esResponsable`, consultar solo las unidades devueltas por el detalle (normalmente 1-3), no las 205.

Además, agregar `contenido cargando`/`Skeleton` mientras se consulta y registrar `console.error` en todos los `catch` (regla de AGENTS).

#### P1.2 Datos obsoletos al cambiar de condominio

**Archivo:** `src/views/admin/PersonasView.vue:220`

La vista solo hace `onMounted(cargar)`. Al cambiar de condominio desde `AppHeader`, `auth.condominioActualId` cambia, pero el componente sigue montado y **no vuelve a cargar**. El selector invalida consultas de TanStack (`useCondominioSelector.js:17-21`), pero esta vista usa llamadas directas, no `useQuery`.

**Impacto:** el administrador puede ver personas del condominio anterior después de cambiar de condominio. Es un problema de privacidad/confusión, no solo de frescura.

**Corrección:**

```js
import { watch } from "vue";

watch(
  () => auth.condominioActualId,
  (cid) => {
    personas.value = [];
    unidades.value = [];
    vinculos.value = [];
    if (cid) cargar();
  },
  { immediate: true },
);
```

Reemplazar `onMounted(cargar)` por este `watch` inmediato y limpiar el estado antes de recargar.

#### P1.3 Acciones sin gating de permisos

**Archivo:** `src/views/admin/PersonasView.vue:256`, `:258`
**Ruta:** `src/router/index.js:171-177`
**Backend:** `V9__cargo_permisos_operativos.sql` y `V2__seed_roles_permisos.sql`

La ruta permite `PRESIDENTE`, `SECRETARIO` y `ADMINISTRADOR`. Pero:

| Acción | Permiso backend | PRESIDENTE | SECRETARIO |
|---|---|---|---|
| Desactivar persona | `PERSONA_ELIMINAR` | No | No |
| Crear usuario | `USUARIO_GESTIONAR` | No | No |
| Crear/editar persona | `PERSONA_CREAR`/`PERSONA_EDITAR` | Sí | Sí |
| Ver/crear vínculo | `VINCULO_VER`/`VINCULO_CREAR` | Sí | Sí |

**Impacto:** los cargos mencionados ven botones que terminan en 403. Como el error no se muestra, la acción parece simplemente “no hacer nada”.

**Corrección:** condicionar cada acción a `auth.permisos`:

```html
<Button v-if="auth.permisos.includes('PERSONA_ELIMINAR')" ... />
<Button v-if="auth.permisos.includes('USUARIO_GESTIONAR')" ... />
```

Aplicar también a “Nueva persona” (`PERSONA_CREAR`), “Editar” (`PERSONA_EDITAR`) y “Nuevo vínculo” (`VINCULO_CREAR`). Alternativa: sacar a `PRESIDENTE`/`SECRETARIO` de la ruta si no deben administrar esta vista, pero los permisos indican que sí pueden crear/editar.

#### P1.4 Flujo “Nuevo vínculo” incompleto

**Archivo:** `src/views/admin/PersonasView.vue:173-191`, `:299-336`

Problemas concretos:

1. `abrirCrearVinculo()` resetea `personaId: null` **aunque ya hay una persona seleccionada** (`personaSeleccionada`). El usuario debe pegar el UUID a mano (`:316-317`).
2. El campo se llama “Persona ID” y muestra “UUID de la persona”: lenguaje técnico, no de producto.
3. Al guardar, solo se cierra el diálogo hijo; **no se refresca `vinculos`**, así que la lista sigue mostrando los vínculos anteriores.
4. No hay validación de campos requeridos (`personaId`, `unidadId`, `tipo`): se envía `null` y el backend responde 400.
5. El diálogo hijo se abre sobre `showVinculos`, que sigue visible; el apilado de modales puede confundir en mobile.

**Corrección:** usar la persona seleccionada como dato fijo:

```js
function abrirCrearVinculo() {
  if (!personaSeleccionada.value) return;
  formVinculo.value = {
    personaId: personaSeleccionada.value.id,
    unidadId: null,
    tipo: null,
    fechaInicio: fechaLocalISO(),
    esOcupante: false,
    recibeNotificaciones: true,
  };
  showCrearVinculo.value = true;
}
```

Mostrar “Persona: {nombre}” como texto de solo lectura, no un `InputText` de UUID. Tras crear, recargar los vínculos de esa persona y mostrar confirmación. Deshabilitar “Guardar” hasta tener unidad y tipo.

#### P1.5 Errores invisibles o que ocultan el listado

**Archivo:** `src/views/admin/PersonasView.vue:97-101`, `:120-122`, `:143-145`, `:185-188`, `:207-210`

- `crearPersona`, `crearVinculo` y `crearUsuario` asignan `error.value`; ese `error` se renderiza en `:237`, **detrás del modal abierto**, y reemplaza toda la lista por el `Message`.
- `editarPersona` y `desactivarPersona` solo hacen `console.error`, sin ningún mensaje al usuario.
- `verVinculos` tiene `catch { /* skip */ }` en `:164`, que oculta errores y viola la regla de `console.error` de AGENTS.

**Impacto:** el usuario no sabe por qué falló una creación/edición; además, después de un fallo de creación, la vista pierde el listado hasta recargar.

**Corrección:** separar estados:

```js
const errorCarga = ref(null);
const errorForm = ref("");
```

- `errorCarga` solo para el `Promise.all` inicial.
- `errorForm` dentro de cada `Dialog`, como `Message`.
- No tocar el listado ante un error de formulario.
- En `verVinculos`, `catch (e) { console.error(...); errorVinculos.value = ...; }`.
- En `editarPersona`/`desactivarPersona`, mostrar `Message` o un aviso superior.

#### P1.6 Desborde horizontal en mobile

**Archivo:** `src/views/admin/PersonasView.vue:249-259`

La fila usa `flex items-center justify-between` sin `min-w-0`, sin `truncate` y con 4 botones de acción. A 320 px, nombre/email + 4 iconos no caben; el contenido puede empujar el ancho y generar scroll horizontal.

**Corrección:** permitir apilado y truncado:

```html
<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
  <div class="min-w-0">
    <p class="font-medium m-0 truncate">{{ p.nombre }}</p>
    <p class="text-sm text-text-muted m-0 truncate">{{ p.email }}</p>
  </div>
  <div class="flex items-center gap-1 shrink-0">
    ...
  </div>
</div>
```

En mobile, evaluar un menú de acciones (`pi-ellipsis-v`) o botones con label en lugar de 4 iconos.

#### P1.7 Datos incompletos y RUT no recuperable

**Archivo:** `src/views/admin/PersonasView.vue:40`, `:251-252`
**Backend:** `CrearPersonaRequest` acepta `rut` y `telefono`; `ActualizarPersonaRequest` solo acepta `nombre` y `telefono`.

Problemas:

- El formulario de creación solo pide nombre/email. No permite capturar RUT ni teléfono.
- El listado no muestra RUT, teléfono, cargo ni `tieneUsuario`.
- Si la persona se crea sin RUT, **no se puede agregar después** desde esta vista porque el PUT no acepta RUT.

**Corrección:** agregar `rut` y `telefono` al formulario de creación, con `useValidacionChile` (`formatearRutCompleto`, `formatearTelefono`, `normalizarRut`, `normalizarTelefono`). Mostrar RUT/teléfono/cargo/estado de usuario en el listado o en un detalle. En edición, mostrar email/RUT como solo lectura y permitir teléfono formateado.

---

### P2 — Medio

#### P2.1 Listado sin paginación ni patrón planilla

**Archivo:** `src/views/admin/PersonasView.vue:243-262`

- Con 477 personas se renderizan 477 cards; no hay `Paginator`, “cargar más” ni virtualización.
- Desktop y mobile usan exactamente la misma lista; no existe la tabla `.planilla` del lineamiento (`docs/guias/tabla-planilla-responsive.md:8-11`).

**Impacto:** listado largo, difícil de escanear y costoso en mobile. La búsqueda local ayuda, pero el primer render sigue siendo pesado.

**Corrección:** para una vista de administración, implementar:

- Desktop: tabla `.planilla` con columnas Nombre, RUT, Email, Teléfono, Cargo, Usuario, Vínculos y Acciones.
- Mobile: cards con header (nombre + tags) y body desplegable.
- Paginación client-side mientras el backend no pagine (por ejemplo, 25/50 por página), reiniciando la página al buscar o cambiar de condominio.

#### P2.2 Botones fuera del estándar

**Archivo:** `src/views/admin/PersonasView.vue:227`, `:255-258`, `:277`, `:294`, `:301`, `:333`, `:347`

| Hallazgo | Estándar |
|---|---|
| 4 botones solo-ícono sin `rounded` ni `title`/`aria-label` | `docs/ui/ui-estandar.md:78`; `audit/02-estandar-button.md:15,27` |
| `pi-user-plus` con `severity="info"` | `info` es solo “Info de dominio”; usar `secondary` |
| “Cancelar” con `severity="secondary"` sólido | Debe ser `variant="text"` (`ui-estandar.md:76`) |
| “Nueva persona” y “Nuevo vínculo” con `size="small"` fuera de tabla | `size="small"` solo en tablas/filas densas (`02-estandar-button.md:26`) |
| `ConfirmDialog` de desactivación sin `acceptClass` danger | Acción destructiva debe verse peligrosa (`02-estandar-button.md:17`) |

**Nota:** `pnpm verificar:estandar` reporta “OK: sin desviaciones estáticas” (402 usos, 106 firmas), pero **no valida** `title`/`aria-label`, el contexto del cancelar ni el uso semántico de `severity`. El acta acepta varias firmas; la revisión visual/manual sigue siendo necesaria.

**Corrección sugerida:**

```html
<Button
  icon="pi pi-link"
  severity="secondary"
  variant="text"
  size="small"
  rounded
  title="Ver vínculos"
  aria-label="Ver vínculos"
  @click="verVinculos(p)"
/>
...
<Button label="Cancelar" severity="secondary" variant="text" @click="..." />
```

#### P2.3 Gestión de vínculos incompleta

**Archivo:** `src/views/admin/PersonasView.vue:299-311`
**Servicio:** `src/services/personasService.js:36-45`

- `Tag :value="v.tipo"` muestra el enum crudo; usar `tiposVinculo` para el label.
- No se muestran `esOcupante`, `recibeNotificaciones`, `esResponsable`, `fechaInicio`/`fechaFin`.
- No hay acción para desvincular una persona de una unidad; existe `personasService.desactivarVinculo` (`:36-38`) sin usar. La única salida es “Desactivar persona”, que afecta **todos** sus vínculos, cargos y usuario.
- No hay toggle de notificaciones; `actualizarRecibeNotificaciones` existe (`:40-45`), pero el endpoint backend solo admite `SUPER_ADMIN`/`ADMINISTRADOR` (`hasAnyRole`), así que habría que alinearlo antes de exponerlo a `PRESIDENTE`/`SECRETARIO`.

**Corrección:** usar etiquetas legibles y mostrar flags; agregar “Desvincular” con confirmación y `PATCH /vinculos/{id}/desactivar` (gateado por `VINCULO_ELIMINAR`). Evaluar el toggle de notificaciones solo si el backend amplía el rol permitido.

#### P2.4 Estado de “Crear usuario” no considera `tieneUsuario`

**Archivo:** `src/views/admin/PersonasView.vue:256`, `:338-349`

`PersonaResumenResponse.tieneUsuario` existe, pero el botón se muestra siempre. Si la persona ya tiene cuenta, el backend responde 409 (“ya tiene cuenta de usuario”) y el error queda detrás del modal. Tampoco se muestra el estado “Con usuario”.

**Corrección:** mostrar un `Tag` “Con usuario”/“Sin usuario”; ocultar “Crear usuario” cuando `tieneUsuario` sea true; si se quiere reenviar el setup, usar `personasService.reenviarSetup` solo después de verificar el endpoint.

#### P2.5 Validación de formularios y flujo de persona duplicada

**Archivo:** `src/views/admin/PersonasView.vue:89-103`, `:265-280`

- No hay validación local de nombre/email/RUT/teléfono; se puede enviar vacío y el 400 queda detrás del modal.
- Si el email/RUT ya existe, el backend responde 409 indicando “búscala por email y vincúlala”, pero la vista no ofrece búsqueda por email ni vinculación de una persona existente. `personasService.buscarPorEmail` existe (`:12-14`) y no se usa.
- No hay mensaje de éxito tras crear/editar/desactivar.

**Corrección:** validar con `useValidacionChile`, deshabilitar el submit hasta tener datos válidos, mostrar `Message` dentro del diálogo y ofrecer un flujo “Buscar persona existente” cuando el email ya exista. Tras crear/editar/desactivar, mostrar confirmación.

#### P2.6 Confirmación de desactivación demasiado genérica

**Archivo:** `src/views/admin/PersonasView.vue:127-135`

El mensaje solo dice “¿Desactivar a X?”, pero el backend desactiva **vínculos, cargos y usuario** de la persona en el condominio. Es una acción de alto impacto que no se explica.

**Corrección:**

```js
message: `¿Desactivar a ${p.nombre}? También se desactivarán sus vínculos, cargos y usuario en este condominio.`,
acceptLabel: "Desactivar",
acceptClass: "p-button-danger",
```

---

### P3 — Bajo

| Hallazgo | Archivo | Detalle |
|---|---|---|
| `loading` queda true si no hay condominio | `PersonasView.vue:58` | `if (!cid) return;` deja el skeleton infinito |
| Código muerto | `PersonasView.vue:30`, `:215` | `showPersona` y `formatearFecha` no se usan |
| Fecha de inicio en UTC | `PersonasView.vue:174` | `toISOString().split("T")[0]` puede dar el día anterior/siguiente en Chile |
| Empty state genérico | `PersonasView.vue:240-242` | “No hay personas registradas” también aparece cuando el filtro no encuentra resultados; distinguir “sin datos” vs “sin coincidencias” |
| Labels sin asociación | `PersonasView.vue:268-273`, `:285-290`, `:316-325`, `:342-343` | `<label>` sin `for`/`id`; solo el checkbox tiene asociación |
| Sin tests de la vista | — | No hay tests para `PersonasView`; una extracción a composable facilitaría cubrir carga, filtros y errores |

---

## 5. Recomendaciones priorizadas

### Fase 1 — Correcciones bloqueantes/altas

1. Reemplazar `surface-card`, `border-round`, `shadow-1`, `surface-50` por tokens (`bg-surface`, `bg-inset`, `border-border-soft`, `rounded-lg`).
2. Cambiar `verVinculos` a `personasService.obtener(cid, p.id)`; eliminar el loop por unidades y el `catch` vacío.
3. Agregar `watch` sobre `auth.condominioActualId` con limpieza de estado y `immediate: true`.
4. Gatear “Desactivar persona” y “Crear usuario” por `PERSONA_ELIMINAR`/`USUARIO_GESTIONAR`.
5. Arreglar “Nuevo vínculo”: persona fija, sin UUID manual, refresco tras guardar, validación y mensaje de error dentro del diálogo.
6. Separar `errorCarga` de `errorForm`; mostrar errores dentro de cada `Dialog`; registrar `console.error` en todos los `catch`.
7. Corregir la fila mobile: `flex-col sm:flex-row`, `min-w-0`, `truncate`, `shrink-0`; evaluar menú de acciones.
8. Agregar `rut`/`telefono` al alta y mostrarlos en el listado/detalle; usar `useValidacionChile`.

### Fase 2 — Alineación de producto

9. Implementar tabla `.planilla` en desktop + cards desplegables en mobile.
10. Agregar paginación client-side (25/50) mientras el backend no pagine.
11. Mostrar `cargo`, `tieneUsuario`, RUT y teléfono; usar `Tag` para estados y labels de tipo de vínculo.
12. Agregar “Desvincular” por vínculo y, si se alinea el backend, toggle de notificaciones.
13. Completar validaciones, confirmación de desactivación con alcance real y mensajes de éxito.
14. Migrar botones al estándar: `title`/`aria-label` en iconos, `rounded`, cancelar `variant="text"`, `secondary` en vez de `info`, `acceptClass` danger.

### Fase 3 — Calidad

15. Distinguir empty state de “sin resultados”; limpiar código muerto; corregir fecha local.
16. Asociar labels a inputs; revisar foco y lectores de pantalla.
17. Extraer lógica a `usePersonas` y agregar tests de carga, filtros, errores, gating y vínculos.

---

## 6. Criterios de aceptación propuestos

- El CSS compilado incluye las clases usadas; `PersonasView` no contiene `surface-card`, `shadow-1`, `border-round` ni `surface-50`.
- Un clic en “Vínculos” hace **1 petición** (`GET /personas/{id}`), no una por unidad.
- Al cambiar de condominio, la vista limpia y recarga; no muestra datos del condominio anterior.
- `PRESIDENTE`/`SECRETARIO` no ven acciones para las que no tienen permiso; no reciben 403 por botones visibles.
- Los errores de creación/edición aparecen dentro del diálogo y no reemplazan el listado.
- “Nuevo vínculo” usa la persona seleccionada, no un UUID manual, y refresca la lista al guardar.
- La fila de persona no genera scroll horizontal a 320 px.
- RUT/teléfono/cargo/estado de usuario se pueden ver; el alta permite capturar RUT y teléfono.
- `pnpm build` y `pnpm test` pasan; la revisión manual de botones cubre `title`/`aria-label`, cancelar y confirmación destructiva.

---

## 7. Evidencia técnica

| Verificación | Resultado |
|---|---|
| `pnpm build` | OK |
| `surface-card`/`shadow-1`/`border-round`/`surface-50` en `dist/assets/*.css` | 0 coincidencias |
| `pnpm verificar:estandar` | 402 usos, 106 firmas, 0 desviaciones estáticas (no cubre semántica ni accesibilidad) |
| API local `GET /condominios/{cid}/personas` | 477 personas; 1 con cargo; 1 con usuario |
| API local `GET /condominios/{cid}/unidades` | 205 unidades |
| API local `GET /condominios/{cid}/personas/{id}` | Retorna `vinculos` en una sola respuesta |
| Peticiones actuales de “Vínculos” | Hasta 205 por clic |

---

## 8. Referencias

- `src/views/admin/PersonasView.vue`
- `src/services/personasService.js`
- `src/services/unidadesService.js`
- `src/router/index.js:171-177`
- `src/composables/useCondominioSelector.js`
- `src/composables/useValidacionChile.js`
- `docs/guias/tabla-planilla-responsive.md:15-31`
- `docs/ui/ui-estandar.md:37-50, 68-79`
- `audit/02-estandar-button.md:7-30`
- Backend: `PersonaController`, `PersonaResumenResponse`, `PersonaDetalleResponse`, `VinculoResponse`, `CrearPersonaRequest`, `ActualizarPersonaRequest`, `V9__cargo_permisos_operativos.sql`.
