# Plan de migración — botones (UI Lab)

Fuente: `audit/03-decisiones-visuales.json` (116 firmas) + `audit/primevue-inventory-v2.json`.
Regla de contenido: la migración conserva label/icono/title de cada uso; solo cambia estilo (severity/variant/size/rounded).

## 1. Resumen

- Firmas a migrar: **25** de 116
- Usos afectados: **119** de 401
- Desglose por intención destino:
  - Contorno / editar: 9 firmas, 37 usos
  - Primaria: 7 firmas, 20 usos
  - Secundaria: 6 firmas, 58 usos
  - Cancelar / texto secundario: 2 firmas, 3 usos
  - Solo ícono tabla: 1 firmas, 1 usos

## 2. Tabla de migración

| Variante | Usos | Firma actual | Migrar a | Props canónicas destino | Archivos afectados (máx 3) |
| --- | --- | --- | --- | --- | --- |
| V1 | 45 | `severity="secondary" variant="text"` | Secundaria | `label="Buscar" severity="secondary"` | src/components/bitacora/ChecklistDialog.vue, src/components/bitacora/NovedadDialog.vue, src/components/encomiendas/DetalleEncomiendaDialog.vue |
| V7 | 14 | `icon="pi pi-plus" size="small" variant="text"` | Contorno / editar | `label="Editar" severity="secondary" variant="outlined" size="small"` | src/components/planilla/PlanillaDatos.vue, src/components/planilla/PlanillaStagedPreview.vue, src/views/setup/SetupAccesosView.vue |
| V9 | 9 | `severity="secondary" size="small" variant="text"` | Secundaria | `label="Buscar" severity="secondary"` | src/components/NotificationBanner.vue, src/views/setup/SetupAccesosView.vue, src/views/setup/SetupAreasComunesView.vue |
| V11 | 7 | `icon="pi pi-check" size="small" variant="text"` | Primaria | `label="Guardar"` | src/views/notificaciones/NotificacionesView.vue, src/views/setup/SetupAccesosView.vue, src/views/setup/SetupAreasComunesView.vue |
| V12 | 7 | `severity="secondary" size="small" variant="outlined"` | Primaria | `label="Guardar"` | src/views/superadmin/SaasAlmacenamientoView.vue, src/views/superadmin/SaasPlanesView.vue, src/views/superadmin/SaasPlantillasView.vue |
| V13 | 6 | `icon="pi pi-pencil" size="small" variant="text"` | Contorno / editar | `label="Editar" severity="secondary" variant="outlined" size="small"` | src/views/admin/PersonalView.vue, src/views/admin/PlantillasNotificacionView.vue, src/views/setup/SetupAccesosView.vue |
| V21 | 4 | `icon="pi pi-arrow-left" size="small" variant="text"` | Contorno / editar | `label="Editar" severity="secondary" variant="outlined" size="small"` | src/views/setup/SetupEntidadesView.vue, src/views/superadmin/SaasModulosView.vue, src/views/superadmin/SaasSuscripcionView.vue |
| V22 | 4 | `size="small" variant="text"` | Contorno / editar | `label="Editar" severity="secondary" variant="outlined" size="small"` | src/views/superadmin/SaasAuditoriaView.vue, src/views/superadmin/SaasCondominiosView.vue, src/views/superadmin/SaasPlantillasView.vue |
| V24 | 3 | `icon="pi pi-arrow-right" size="small" variant="text"` | Contorno / editar | `label="Editar" severity="secondary" variant="outlined" size="small"` | src/components/encomiendas/TarjetaEncomiendasResidente.vue, src/views/residente/InicioView.vue |
| V27 | 3 | `icon="pi pi-trash" severity="secondary" size="small" variant="text"` | Contorno / editar | `label="Editar" severity="secondary" variant="outlined" size="small"` | src/components/planilla/PlanillaStagedPreview.vue, src/views/setup/SetupPlanillaView.vue |
| V41 | 2 | `icon="pi pi-undo" severity="danger" size="small" variant="text"` | Cancelar / texto secundario | `label="Cancelar" severity="secondary" variant="text"` | src/views/admin/PlantillasNotificacionView.vue, src/views/gestion/ReglasNotificacionView.vue |
| V45 | 2 | `icon="pi pi-save" severity="secondary"` | Primaria | `label="Guardar"` | src/views/superadmin/SaasCondominioSetupView.vue |
| V59 | 1 | `size="small" variant="link"` | Contorno / editar | `label="Editar" severity="secondary" variant="outlined" size="small"` | src/components/layout/NotificacionPopover.vue |
| V62 | 1 | `icon="pi pi-download" size="small" variant="outlined"` | Primaria | `label="Guardar"` | src/components/planilla/PlanillaResultado.vue |
| V67 | 1 | `icon="pi pi-plus" severity="secondary"` | Primaria | `label="Guardar"` | src/components/visitas/BuscadorPatenteCard.vue |
| V68 | 1 | `icon="pi pi-times" severity="secondary" size="small" variant="text"` | Contorno / editar | `label="Editar" severity="secondary" variant="outlined" size="small"` | src/components/visitas/BuscadorPatenteCard.vue |
| V70 | 1 | `icon="pi pi-arrow-up" severity="secondary" size="small" variant="outlined"` | Solo ícono tabla | `icon="pi pi-trash" severity="secondary" variant="text" size="small" rounded title="Quitar"` | src/modules/permisos/views/CargosPermisosView.vue |
| V76 | 1 | `fluid icon="pi pi-arrow-left"` | Secundaria | `label="Buscar" severity="secondary"` | src/views/auth/ForgotPasswordView.vue |
| V80 | 1 | `icon="pi pi-search" severity="secondary" size="small" variant="outlined"` | Secundaria | `label="Buscar" severity="secondary"` | src/views/encomiendas/EncomiendasView.vue |
| V83 | 1 | `icon="pi pi-check" severity="danger"` | Primaria | `label="Guardar"` | src/views/gestion/CasosAdminView.vue |
| V87 | 1 | `icon="pi pi-plus" severity="secondary" size="small" variant="outlined"` | Secundaria | `label="Buscar" severity="secondary"` | src/views/guardia/ChecklistTemplatesView.vue |
| V90 | 1 | `icon="pi pi-sign-out" severity="danger" variant="text"` | Cancelar / texto secundario | `label="Cancelar" severity="secondary" variant="text"` | src/views/menu/MenuView.vue |
| V95 | 1 | `icon-pos="right" icon="pi pi-arrow-right" size="small" variant="text"` | Contorno / editar | `label="Editar" severity="secondary" variant="outlined" size="small"` | src/views/setup/SetupLayout.vue |
| V111 | 1 | `icon="pi pi-bolt" severity="secondary" variant="outlined"` | Secundaria | `label="Buscar" severity="secondary"` | src/views/superadmin/SaasEmailConfigView.vue |
| V115 | 1 | `icon="pi pi-check" severity="secondary"` | Primaria | `label="Guardar"` | src/views/visitas/BusquedaDetalleView.vue |

## 3. Archivos a editar (mayor a menor cambios)

- `src/components/planilla/PlanillaDatos.vue` — **6 usos**: V7
- `src/views/superadmin/SaasPlantillasView.vue` — **5 usos**: V1, V9, V12, V22
- `src/components/planilla/PlanillaStagedPreview.vue` — **5 usos**: V7, V27
- `src/views/setup/SetupAreasComunesView.vue` — **5 usos**: V7, V9, V11, V13
- `src/views/admin/PersonasView.vue` — **4 usos**: V1
- `src/views/setup/SetupAccesosView.vue` — **4 usos**: V7, V9, V11, V13
- `src/views/setup/SetupEntidadesView.vue` — **4 usos**: V7, V11, V21
- `src/views/setup/SetupPisosView.vue` — **4 usos**: V7, V9, V11, V13
- `src/views/setup/SetupSectoresView.vue` — **4 usos**: V7, V9, V11, V13
- `src/views/admin/PlantillasNotificacionView.vue` — **3 usos**: V1, V13, V41
- `src/views/gestion/CasosAdminView.vue` — **3 usos**: V1, V83
- `src/views/superadmin/SaasAlmacenamientoView.vue` — **3 usos**: V1, V12
- `src/views/superadmin/SaasCondominioDetailView.vue` — **3 usos**: V1
- `src/views/superadmin/SaasReglasNotificacionView.vue` — **3 usos**: V1, V12
- `src/views/superadmin/SaasSuscripcionView.vue` — **3 usos**: V1, V21
- `src/views/superadmin/SaasUsuariosView.vue` — **3 usos**: V1, V12, V21
- `src/views/admin/PersonalView.vue` — **2 usos**: V1, V13
- `src/views/admin/UnidadesView.vue` — **2 usos**: V1
- `src/views/finanzas/CargosAdicionalesView.vue` — **2 usos**: V1
- `src/views/finanzas/GastosView.vue` — **2 usos**: V1
- `src/views/guardia/ChecklistTemplatesView.vue` — **2 usos**: V1, V87
- `src/views/superadmin/SaasEmailConfigView.vue` — **2 usos**: V1, V111
- `src/views/superadmin/SaasPlanesView.vue` — **2 usos**: V1, V12
- `src/views/superadmin/SaasCondominiosView.vue` — **2 usos**: V22
- `src/views/residente/InicioView.vue` — **2 usos**: V24
- `src/views/superadmin/SaasCondominioSetupView.vue` — **2 usos**: V45
- `src/components/visitas/BuscadorPatenteCard.vue` — **2 usos**: V67, V68
- `src/components/bitacora/ChecklistDialog.vue` — **1 usos**: V1
- `src/components/bitacora/NovedadDialog.vue` — **1 usos**: V1
- `src/components/encomiendas/DetalleEncomiendaDialog.vue` — **1 usos**: V1
- `src/components/encomiendas/EntregarEncomiendaDialog.vue` — **1 usos**: V1
- `src/components/encomiendas/RegistrarEncomiendaDialog.vue` — **1 usos**: V1
- `src/components/visitas/ConfirmarSalidaDialog.vue` — **1 usos**: V1
- `src/views/finanzas/CategoriasView.vue` — **1 usos**: V1
- `src/views/finanzas/CuentasView.vue` — **1 usos**: V1
- `src/views/finanzas/GastosComunesView.vue` — **1 usos**: V1
- `src/views/finanzas/PagosView.vue` — **1 usos**: V1
- `src/views/finanzas/PlantillasGastoView.vue` — **1 usos**: V1
- `src/views/gestion/AnunciosView.vue` — **1 usos**: V1
- `src/views/gestion/MiembrosView.vue` — **1 usos**: V1
- `src/views/residente/CasosView.vue` — **1 usos**: V1
- `src/views/residente/MisAutorizacionesView.vue` — **1 usos**: V1
- `src/views/storage/ArchivosView.vue` — **1 usos**: V1
- `src/views/superadmin/SaasCrearCondominioView.vue` — **1 usos**: V1
- `src/views/visitas/RegistrarVisitaView.vue` — **1 usos**: V1
- `src/components/NotificationBanner.vue` — **1 usos**: V9
- `src/views/setup/SetupUnidadesView.vue` — **1 usos**: V9
- `src/views/visitas/VisitasView.vue` — **1 usos**: V9
- `src/views/notificaciones/NotificacionesView.vue` — **1 usos**: V11
- `src/views/superadmin/SaasModulosView.vue` — **1 usos**: V21
- `src/views/superadmin/SaasAuditoriaView.vue` — **1 usos**: V22
- `src/components/encomiendas/TarjetaEncomiendasResidente.vue` — **1 usos**: V24
- `src/views/setup/SetupPlanillaView.vue` — **1 usos**: V27
- `src/views/gestion/ReglasNotificacionView.vue` — **1 usos**: V41
- `src/components/layout/NotificacionPopover.vue` — **1 usos**: V59
- `src/components/planilla/PlanillaResultado.vue` — **1 usos**: V62
- `src/modules/permisos/views/CargosPermisosView.vue` — **1 usos**: V70
- `src/views/auth/ForgotPasswordView.vue` — **1 usos**: V76
- `src/views/encomiendas/EncomiendasView.vue` — **1 usos**: V80
- `src/views/menu/MenuView.vue` — **1 usos**: V90
- `src/views/setup/SetupLayout.vue` — **1 usos**: V95
- `src/views/visitas/BusquedaDetalleView.vue` — **1 usos**: V115

Total: 62 archivos, 119 usos.

## 4. Casos a revisar manualmente

### V1 → Secundaria (45 usos)

`severity="secondary" variant="text"`

- **MEDIO**: 2 etiquetas distintas (Cancelar, Cerrar): conservar cada label, solo cambia estilo
- **MEDIO**: clases personalizadas que la migración elimina: flex-1 border border-border text-text-muted; flex-1 rounded-lg border border-border/80 shadow-lg
- **BAJO**: `:loading`/`:disabled` se conservan (no son estilo): :disabled=loading; :disabled=subiendo
- **BAJO**: @click estándar (27 distintos): no depende del estilo

### V7 → Contorno / editar (14 usos)

`icon="pi pi-plus" size="small" variant="text"`

- **MEDIO**: 10 etiquetas distintas (Agregar bodega, Agregar espacio, Agregar est., Agregar estacionamiento): conservar cada label, solo cambia estilo
- **BAJO**: @click estándar (8 distintos): no depende del estilo

### V9 → Secundaria (9 usos)

`severity="secondary" size="small" variant="text"`

- **MEDIO**: render condicional: v-if=!u.estado.items.length && !u.hayCambios && !yaCerrado
- **MEDIO**: 5 etiquetas distintas (Ahora no, Cancelar, Cerrar paso sin configurar áreas comunes, Limpiar): conservar cada label, solo cambia estilo
- **MEDIO**: clases personalizadas que la migración elimina: text-surface-400 hover:text-surface-0
- **ALTO**: @click ligado a estado visual: toggleTodos(false)

### V11 → Primaria (7 usos)

`icon="pi pi-check" size="small" variant="text"`

- **MEDIO**: render condicional: v-if=hayNoLeidas
- **MEDIO**: 3 etiquetas distintas (Listo, Marcar todas leídas, Usar declarados): conservar cada label, solo cambia estilo
- **BAJO**: @click estándar (4 distintos): no depende del estilo

### V12 → Primaria (7 usos)

`severity="secondary" size="small" variant="outlined"`

- **MEDIO**: 2 etiquetas distintas (Editar, Rol): conservar cada label, solo cambia estilo
- **MEDIO**: clases personalizadas que la migración elimina: w-full
- **BAJO**: @click estándar (4 distintos): no depende del estilo

### V13 → Contorno / editar (6 usos)

`icon="pi pi-pencil" size="small" variant="text"`

- **MEDIO**: render condicional: v-if=!editando
- **BAJO**: @click estándar (3 distintos): no depende del estilo

### V21 → Contorno / editar (4 usos)

`icon="pi pi-arrow-left" size="small" variant="text"`

- **MEDIO**: render condicional: v-if=u.estado.paso > 1 && !u.modoReedicion
- **MEDIO**: 2 etiquetas distintas (Anterior, ← Volver): conservar cada label, solo cambia estilo
- **MEDIO**: clases personalizadas que la migración elimina: text-text/80
- **BAJO**: @click estándar (2 distintos): no depende del estilo

### V22 → Contorno / editar (4 usos)

`size="small" variant="text"`

- **MEDIO**: 2 etiquetas distintas (Entrar, Limpiar): conservar cada label, solo cambia estilo
- **BAJO**: @click estándar (2 distintos): no depende del estilo

### V24 → Contorno / editar (3 usos)

`icon="pi pi-arrow-right" size="small" variant="text"`

- **MEDIO**: 2 etiquetas distintas (Administrar, Ver todas): conservar cada label, solo cambia estilo
- **BAJO**: @click estándar (2 distintos): no depende del estilo

### V27 → Contorno / editar (3 usos)

`icon="pi pi-trash" severity="secondary" size="small" variant="text"`

- **MEDIO**: render condicional: v-if=planilla.filas.length && !planilla.resultado
- **BAJO**: tooltips/aria a conservar: title=Descarta el borrador local (no toca lo ya guardado)
- **BAJO**: `:loading`/`:disabled` se conservan (no son estilo): :disabled=enviando; :disabled=planilla.enviando
- **BAJO**: @click estándar (2 distintos): no depende del estilo

### V41 → Cancelar / texto secundario (2 usos)

`icon="pi pi-undo" severity="danger" size="small" variant="text"`

- **MEDIO**: render condicional: v-if=p.origen === 'OVERRIDE'; v-if=r.esSobrescritura
- **BAJO**: `:loading`/`:disabled` se conservan (no son estilo): :disabled=guardando === r.tipo
- **BAJO**: @click estándar (2 distintos): no depende del estilo

### V45 → Primaria (2 usos)

`icon="pi pi-save" severity="secondary"`

- **BAJO**: `:loading`/`:disabled` se conservan (no son estilo): :disabled=!adminAsignado() || tareaCompletada('ASIGNAR_ADMIN'); :disabled=!capacidadValida || tareaCompletada('CREAR_UNIDADES')
- **BAJO**: @click estándar (2 distintos): no depende del estilo

### V59 → Contorno / editar (1 usos)

`size="small" variant="link"`

- **MEDIO**: render condicional: v-if=notifCount >= 0
- **MEDIO**: clases personalizadas que la migración elimina: btn-no-bg header-btn text-text-muted
- **BAJO**: @click estándar (1 distintos): no depende del estilo

### V62 → Primaria (1 usos)

`icon="pi pi-download" size="small" variant="outlined"`

- **MEDIO**: clases personalizadas que la migración elimina: bg-surface text-text-muted hover:bg-primary
- **BAJO**: `:loading`/`:disabled` se conservan (no son estilo): :disabled=exportando; :loading=exportando
- **BAJO**: @click estándar (1 distintos): no depende del estilo

### V67 → Primaria (1 usos)

`icon="pi pi-plus" severity="secondary"`

- **MEDIO**: render condicional: v-if=tieneAccion('NUEVA_VISITA', resultados[0])
- **BAJO**: @click estándar (1 distintos): no depende del estilo

### V68 → Contorno / editar (1 usos)

`icon="pi pi-times" severity="secondary" size="small" variant="text"`

- **MEDIO**: clases personalizadas que la migración elimina: btn-no-bg body-btn
- **BAJO**: @click estándar (1 distintos): no depende del estilo

### V70 → Solo ícono tabla (1 usos)

`icon="pi pi-arrow-up" severity="secondary" size="small" variant="outlined"`

- **BAJO**: @click estándar (1 distintos): no depende del estilo

### V76 → Secundaria (1 usos)

`fluid icon="pi pi-arrow-left"`

- **MEDIO**: clases personalizadas que la migración elimina: primary-text
- **BAJO**: @click estándar (1 distintos): no depende del estilo

### V80 → Secundaria (1 usos)

`icon="pi pi-search" severity="secondary" size="small" variant="outlined"`

- **BAJO**: @click estándar (1 distintos): no depende del estilo

### V83 → Primaria (1 usos)

`icon="pi pi-check" severity="danger"`

- **MEDIO**: render condicional: v-if=detalle && detalle.estado !== 'CERRADO'
- **BAJO**: @click estándar (1 distintos): no depende del estilo

### V87 → Secundaria (1 usos)

`icon="pi pi-plus" severity="secondary" size="small" variant="outlined"`

- **MEDIO**: render condicional: v-if=editando
- **BAJO**: @click estándar (1 distintos): no depende del estilo

### V90 → Cancelar / texto secundario (1 usos)

`icon="pi pi-sign-out" severity="danger" variant="text"`

- **MEDIO**: clases personalizadas que la migración elimina: w-full justify-content-start py-2
- **BAJO**: @click estándar (1 distintos): no depende del estilo

### V95 → Contorno / editar (1 usos)

`icon-pos="right" icon="pi pi-arrow-right" size="small" variant="text"`

- **MEDIO**: render condicional: v-if=!configuraciónCompleta
- **BAJO**: @click estándar (1 distintos): no depende del estilo

### V111 → Secundaria (1 usos)

`icon="pi pi-bolt" severity="secondary" variant="outlined"`

- **BAJO**: `:loading`/`:disabled` se conservan (no son estilo): :loading=probando
- **BAJO**: @click estándar (1 distintos): no depende del estilo

### V115 → Primaria (1 usos)

`icon="pi pi-check" severity="secondary"`

- **BAJO**: @click estándar (1 distintos): no depende del estilo

## 5. Ejecución (opción b)

- Aplicadas las 25 firmas del plan (**119 usos**) + conversión legada mínima `text/outlined/link → variant` (**37 usos**) + `severity="primary"` explícito (2 usos, idéntico look).
- Total: **156 tags en 69 archivos**, cada uno re-parseado y verificado (sin duplicados de props, contenido intacto).
- Regla aplicada: conserva label/icon/title/handlers/`flex-1`/`w-full`; elimina clases de color/forma/sombra.
- Firmas votadas "estándar" fuera del catálogo (V3, V4 y familias): **aceptadas sin tocar** — el checker las reconoce por el acta `03-decisiones-visuales.json`.
- Estado final (`pnpm verificar:estandar`): 106 firmas, 42 cubiertas, 45 aceptadas, 18 dinámicas + 1 no-botones (issue #37), **0 desviaciones, 0 legadas**. Build y tests OK.
