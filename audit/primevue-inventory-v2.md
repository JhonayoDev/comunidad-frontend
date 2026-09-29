# Inventario PrimeVue (v2)

Generado: 2026-09-29T07:39:17.848Z

Total de usos: **401**

Firma = props de estilo (sin title, sin class, props heredadas normalizadas a `variant`).

## Button (401 usos, 45 con prop heredada text/outlined/link)

Variantes distintas: **116**

### Button · V1 — 45 usos

```
severity="secondary" variant="text"
```

Clases usadas: `rounded-lg border border-border/80 shadow-lg`, `flex-1 rounded-lg border border-border/80 shadow-lg`, `flex-1 border border-border text-text-muted`

- src/components/bitacora/ChecklistDialog.vue:119
- src/components/bitacora/NovedadDialog.vue:111
- src/components/encomiendas/DetalleEncomiendaDialog.vue:176
- src/components/encomiendas/EntregarEncomiendaDialog.vue:75
- src/components/encomiendas/RegistrarEncomiendaDialog.vue:246
- src/components/visitas/ConfirmarSalidaDialog.vue:99
- src/views/admin/PersonalView.vue:120
- src/views/admin/PersonasView.vue:277
- src/views/admin/PersonasView.vue:294
- src/views/admin/PersonasView.vue:333
- src/views/admin/PersonasView.vue:347
- src/views/admin/PlantillasNotificacionView.vue:132
- src/views/admin/UnidadesView.vue:381
- src/views/admin/UnidadesView.vue:414
- src/views/finanzas/CargosAdicionalesView.vue:254
- … y 30 más

### Button · V2 — 36 usos

```
(default)
```

Clases usadas: `[
            'bottom-nav-item flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors',
            activo(item)
              ? 'text-primary font-semibold'
              : 'text-text-muted hover:text-text',
          ]`, `flex items-center justify-between w-full text-left`, `flex items-center gap-2 w-full text-left text-sm`, `w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-emphasis transition-colors`, `
              u.estado.paso === p.numero
                ? 'bg-primary text-text'
                : u.estado.paso > p.numero
                  ? 'bg-surface border border-border cursor-pointer'
                  : 'bg-surface border border-border opacity-60'
            `, `
                    g.modo === m.value
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border hover:bg-emphasis'
                  `, `
                  u.estado.grupos[0].modo === m.value
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border hover:bg-emphasis'
                `, `[
            pasoActivo(p)
              ? 'bg-primary text-white'
              : p.completado
                ? 'bg-surface border border-primary/40 hover:bg-emphasis cursor-pointer'
                : 'bg-surface border border-border cursor-pointer opacity-70',
          ]`, `
              u.estado.paso === p.numero
                ? 'bg-primary text-white'
                : u.estado.paso > p.numero
                  ? 'bg-surface border border-border cursor-pointer'
                  : 'bg-surface border border-border opacity-60'
            `, `
                u.estado.modo === m.value
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border hover:bg-emphasis'
              `

- src/components/layout/BottomNavigation.vue:28
- src/components/planilla/PlanillaDatos.vue:1079
- src/components/planilla/PlanillaDatos.vue:1137
- src/components/planilla/PlanillaDatos.vue:1211
- src/components/planilla/PlanillaResultado.vue:131
- src/modules/permisos/views/CargosPermisosView.vue:102
- src/views/admin/PersonalView.vue:121
- src/views/admin/PersonasView.vue:278
- src/views/admin/PersonasView.vue:295
- src/views/admin/PersonasView.vue:334
- src/views/admin/PersonasView.vue:348
- src/views/admin/UnidadesView.vue:382
- src/views/admin/UnidadesView.vue:415
- src/views/finanzas/CargosAdicionalesView.vue:255
- src/views/finanzas/CategoriasView.vue:144
- … y 21 más

### Button · V3 — 31 usos

```
icon="pi pi-trash" severity="danger" size="small" variant="text"
```

- src/components/planilla/PlanillaDatos.vue:694
- src/components/planilla/PlanillaDatos.vue:740
- src/components/planilla/PlanillaDatos.vue:785
- src/components/planilla/PlanillaDatos.vue:834
- src/components/planilla/PlanillaDatos.vue:1111
- src/components/planilla/PlanillaDatos.vue:1168
- src/components/planilla/PlanillaDatos.vue:1243
- src/components/planilla/PlanillaStagedPreview.vue:414
- src/components/planilla/PlanillaStagedPreview.vue:455
- src/components/planilla/PlanillaStagedPreview.vue:509
- src/components/planilla/PlanillaStagedPreview.vue:527
- src/views/admin/PersonasView.vue:258
- src/views/admin/UnidadesView.vue:306
- src/views/finanzas/CategoriasView.vue:131
- src/views/finanzas/CuentasView.vue:170
- … y 16 más

### Button · V4 — 24 usos

```
icon="pi pi-plus" size="small"
```

- src/components/planilla/PlanillaDatos.vue:334
- src/views/admin/PersonasView.vue:227
- src/views/admin/PersonasView.vue:301
- src/views/admin/UnidadesView.vue:253
- src/views/encomiendas/EncomiendasView.vue:182
- src/views/finanzas/CargosAdicionalesView.vue:149
- src/views/finanzas/CategoriasView.vue:106
- src/views/finanzas/CuentasView.vue:137
- src/views/finanzas/GastosComunesView.vue:118
- src/views/finanzas/GastosView.vue:183
- src/views/finanzas/PagosView.vue:228
- src/views/finanzas/PlantillasGastoView.vue:140
- src/views/gestion/AnunciosView.vue:133
- src/views/gestion/MiembrosView.vue:155
- src/views/residente/CasosView.vue:118
- … y 9 más

### Button · V5 — 22 usos

```
icon="pi pi-info-circle" rounded severity="secondary" size="small" variant="text"
```

- src/components/planilla/PlanillaUploader.vue:80
- src/views/superadmin/SaasReglasNotificacionView.vue:248
- src/views/superadmin/SaasReglasNotificacionView.vue:257
- src/views/superadmin/SaasReglasNotificacionView.vue:264
- src/views/superadmin/SaasReglasNotificacionView.vue:271
- src/views/superadmin/SaasReglasNotificacionView.vue:281
- src/views/superadmin/SaasReglasNotificacionView.vue:300
- src/views/superadmin/SaasReglasNotificacionView.vue:306
- src/views/superadmin/SaasReglasNotificacionView.vue:312
- src/views/superadmin/SaasReglasNotificacionView.vue:318
- src/views/superadmin/SaasReglasNotificacionView.vue:324
- src/views/superadmin/SaasReglasNotificacionView.vue:338
- src/views/superadmin/SaasReglasNotificacionView.vue:346
- src/views/superadmin/SaasReglasNotificacionView.vue:366
- src/views/superadmin/SaasReglasNotificacionView.vue:372
- … y 7 más

### Button · V6 — 14 usos

```
icon="pi pi-check"
```

Clases usadas: `flex-1 rounded-lg shadow-lg`, `self-start`, `flex-1`

- src/components/bitacora/ChecklistDialog.vue:125
- src/components/encomiendas/EntregarEncomiendaDialog.vue:83
- src/components/encomiendas/RegistrarEncomiendaDialog.vue:254
- src/views/admin/ConfiguracionAlmacenamientoView.vue:87
- src/views/admin/PlantillasNotificacionView.vue:133
- src/views/guardia/ChecklistTemplatesView.vue:148
- src/views/residente/CasosView.vue:217
- src/views/residente/MisAutorizacionesView.vue:407
- src/views/superadmin/SaasAlmacenamientoView.vue:454
- src/views/superadmin/SaasCrearCondominioView.vue:267
- src/views/superadmin/SaasModulosView.vue:91
- src/views/superadmin/SaasPlantillasView.vue:378
- src/views/superadmin/SaasReglasNotificacionView.vue:453
- src/views/visitas/RegistrarVisitaView.vue:259

### Button · V7 — 14 usos

```
icon="pi pi-plus" size="small" variant="text"
```

- src/components/planilla/PlanillaDatos.vue:703
- src/components/planilla/PlanillaDatos.vue:750
- src/components/planilla/PlanillaDatos.vue:794
- src/components/planilla/PlanillaDatos.vue:1120
- src/components/planilla/PlanillaDatos.vue:1187
- src/components/planilla/PlanillaDatos.vue:1252
- src/components/planilla/PlanillaStagedPreview.vue:423
- src/components/planilla/PlanillaStagedPreview.vue:487
- src/components/planilla/PlanillaStagedPreview.vue:517
- src/views/setup/SetupAccesosView.vue:111
- src/views/setup/SetupAreasComunesView.vue:216
- src/views/setup/SetupEntidadesView.vue:634
- src/views/setup/SetupPisosView.vue:111
- src/views/setup/SetupSectoresView.vue:106

### Button · V8 — 11 usos

```
icon="pi pi-save"
```

- src/modules/permisos/views/CargosPermisosView.vue:90
- src/views/residente/PerfilView.vue:277
- src/views/setup/SetupAccesosView.vue:230
- src/views/setup/SetupAreasComunesView.vue:702
- src/views/setup/SetupEntidadesView.vue:1203
- src/views/setup/SetupPisosView.vue:253
- src/views/setup/SetupPlanillaView.vue:228
- src/views/setup/SetupSectoresView.vue:227
- src/views/setup/SetupUnidadesView.vue:1095
- src/views/superadmin/SaasCondominioSetupView.vue:650
- src/views/superadmin/SaasEmailConfigView.vue:351

### Button · V9 — 9 usos

```
severity="secondary" size="small" variant="text"
```

Clases usadas: `text-surface-400 hover:text-surface-0`

- src/components/NotificationBanner.vue:34
- src/views/setup/SetupAccesosView.vue:110
- src/views/setup/SetupAreasComunesView.vue:209
- src/views/setup/SetupAreasComunesView.vue:714
- src/views/setup/SetupPisosView.vue:110
- src/views/setup/SetupSectoresView.vue:105
- src/views/setup/SetupUnidadesView.vue:613
- src/views/superadmin/SaasPlantillasView.vue:337
- src/views/visitas/VisitasView.vue:200

### Button · V10 — 7 usos

```
icon="pi pi-check" size="small"
```

- src/components/planilla/PlanillaDatos.vue:322
- src/components/planilla/PlanillaStagedPreview.vue:1023
- src/views/setup/SetupEntidadesView.vue:666
- src/views/setup/SetupEntidadesView.vue:787
- src/views/setup/SetupUnidadesView.vue:526
- src/views/setup/SetupUnidadesView.vue:606
- src/views/setup/SetupUnidadesView.vue:757

### Button · V11 — 7 usos

```
icon="pi pi-check" size="small" variant="text"
```

- src/views/notificaciones/NotificacionesView.vue:80
- src/views/setup/SetupAccesosView.vue:109
- src/views/setup/SetupAreasComunesView.vue:202
- src/views/setup/SetupEntidadesView.vue:442
- src/views/setup/SetupEntidadesView.vue:547
- src/views/setup/SetupPisosView.vue:109
- src/views/setup/SetupSectoresView.vue:104

### Button · V12 — 7 usos

```
severity="secondary" size="small" variant="outlined"
```

Clases usadas: `w-full`

- src/views/superadmin/SaasAlmacenamientoView.vue:266
- src/views/superadmin/SaasAlmacenamientoView.vue:327
- src/views/superadmin/SaasPlanesView.vue:194
- src/views/superadmin/SaasPlantillasView.vue:336
- src/views/superadmin/SaasReglasNotificacionView.vue:286
- src/views/superadmin/SaasReglasNotificacionView.vue:376
- src/views/superadmin/SaasUsuariosView.vue:145

### Button · V13 — 6 usos

```
icon="pi pi-pencil" size="small" variant="text"
```

- src/views/admin/PersonalView.vue:98
- src/views/admin/PlantillasNotificacionView.vue:117
- src/views/setup/SetupAccesosView.vue:100
- src/views/setup/SetupAreasComunesView.vue:193
- src/views/setup/SetupPisosView.vue:100
- src/views/setup/SetupSectoresView.vue:95

### Button · V14 — 6 usos

```
icon="pi pi-search" severity="secondary" size="small"
```

- src/views/finanzas/GastosView.vue:214
- src/views/finanzas/LedgerView.vue:114
- src/views/finanzas/PagosView.vue:255
- src/views/superadmin/SaasAuditoriaView.vue:288
- src/views/superadmin/SaasCondominiosView.vue:202
- src/views/superadmin/SaasPlantillasView.vue:306

### Button · V15 — 5 usos

```
icon="pi pi-pencil" severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:257
- src/views/admin/UnidadesView.vue:305
- src/views/finanzas/CuentasView.vue:169
- src/views/finanzas/PlantillasGastoView.vue:169
- src/views/superadmin/SaasEmailConfigView.vue:391

### Button · V16 — 5 usos

```
:severity="busquedaVisible ? 'primary' : 'secondary'" icon="pi pi-search" size="small" variant="outlined"
```

Clases usadas: `rounded-lg shrink-0`

- src/views/encomiendas/EncomiendasView.vue:216
- src/views/guardia/BitacoraView.vue:125
- src/views/superadmin/SaasAuditoriaView.vue:207
- src/views/superadmin/SaasCondominiosView.vue:133
- src/views/superadmin/SaasPlantillasView.vue:263

### Button · V17 — 4 usos

```
icon="pi pi-sign-out" severity="warn"
```

- src/components/visitas/BuscadorPatenteCard.vue:222
- src/components/visitas/BuscadorPatenteCard.vue:335
- src/components/visitas/BuscadorPatenteCard.vue:405
- src/components/visitas/ConfirmarSalidaDialog.vue:107

### Button · V18 — 4 usos

```
icon-pos="right" icon="pi pi-arrow-right" size="small"
```

- src/views/dashboard/AdminDashboardView.vue:139
- src/views/setup/SetupEntidadesView.vue:1194
- src/views/setup/SetupLayout.vue:157
- src/views/setup/SetupUnidadesView.vue:1086

### Button · V19 — 4 usos

```
severity="danger"
```

- src/views/finanzas/CargosAdicionalesView.vue:270
- src/views/finanzas/GastosView.vue:323
- src/views/gestion/CasosAdminView.vue:305
- src/views/superadmin/SaasCondominioDetailView.vue:694

### Button · V20 — 4 usos

```
icon="pi pi-times" severity="danger" size="small" variant="text"
```

- src/views/residente/MisAutorizacionesView.vue:265
- src/views/setup/SetupEntidadesView.vue:276
- src/views/setup/SetupEntidadesView.vue:624
- src/views/setup/SetupUnidadesView.vue:484

### Button · V21 — 4 usos

```
icon="pi pi-arrow-left" size="small" variant="text"
```

Clases usadas: `text-text/80`

- src/views/setup/SetupEntidadesView.vue:1182
- src/views/superadmin/SaasModulosView.vue:70
- src/views/superadmin/SaasSuscripcionView.vue:99
- src/views/superadmin/SaasUsuariosView.vue:109

### Button · V22 — 4 usos

```
size="small" variant="text"
```

- src/views/superadmin/SaasAuditoriaView.vue:289
- src/views/superadmin/SaasCondominiosView.vue:203
- src/views/superadmin/SaasCondominiosView.vue:238
- src/views/superadmin/SaasPlantillasView.vue:307

### Button · V23 — 3 usos

```
icon="pi pi-times" rounded severity="secondary" size="small" variant="text"
```

Clases usadas: `btn-no-bg body-btn`

- src/components/common/InfoAyudaVista.vue:42
- src/components/visitas/BuscadorPatenteCard.vue:180
- src/components/visitas/BuscadorPatenteCard.vue:381

### Button · V24 — 3 usos

```
icon="pi pi-arrow-right" size="small" variant="text"
```

- src/components/encomiendas/TarjetaEncomiendasResidente.vue:109
- src/views/residente/InicioView.vue:334
- src/views/residente/InicioView.vue:343

### Button · V25 — 3 usos

```
:icon="foco ? 'pi pi-window-minimize' : 'pi pi-window-maximize'" severity="secondary" size="small" variant="text"
```

Clases usadas: `ml-auto`

- src/components/planilla/PlanillaDatos.vue:305
- src/components/planilla/PlanillaStagedPreview.vue:221
- src/components/planilla/PlanillaStagedPreview.vue:597

### Button · V26 — 3 usos

```
severity="secondary" size="small"
```

- src/components/planilla/PlanillaDatos.vue:328
- src/views/setup/SetupEntidadesView.vue:793
- src/views/setup/SetupUnidadesView.vue:763

### Button · V27 — 3 usos

```
icon="pi pi-trash" severity="secondary" size="small" variant="text"
```

- src/components/planilla/PlanillaStagedPreview.vue:557
- src/components/planilla/PlanillaStagedPreview.vue:1004
- src/views/setup/SetupPlanillaView.vue:216

### Button · V28 — 3 usos

```
icon="pi pi-pencil" severity="secondary" size="small" variant="outlined"
```

- src/components/planilla/PlanillaStagedPreview.vue:1014
- src/views/superadmin/SaasCondominioDetailView.vue:324
- src/views/superadmin/SaasCondominioDetailView.vue:424

### Button · V29 — 3 usos

```
icon="pi pi-ban" severity="danger" size="small" variant="text"
```

- src/views/admin/PersonalView.vue:99
- src/views/finanzas/CargosAdicionalesView.vue:200
- src/views/finanzas/GastosView.vue:244

### Button · V30 — 3 usos

```
fluid icon="pi pi-arrow-left" variant="text"
```

Clases usadas: `primary-text`

- src/views/auth/ForgotPasswordView.vue:68
- src/views/auth/ResetPasswordView.vue:99
- src/views/auth/SetupPasswordView.vue:99

### Button · V31 — 3 usos

```
fluid icon="pi pi-sign-in"
```

Clases usadas: `primary-text`

- src/views/auth/LoginView.vue:123
- src/views/auth/ResetPasswordView.vue:113
- src/views/auth/SetupPasswordView.vue:112

### Button · V32 — 2 usos

```
:icon="collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'" rounded size="small" variant="text"
```

Clases usadas: `text-boton-accion/60`, `text-boton-accion`

- src/components/bitacora/EventoCard.vue:72
- src/components/bitacora/TurnoCard.vue:72

### Button · V33 — 2 usos

```
icon="pi pi-flag" severity="primary"
```

- src/components/bitacora/NovedadDialog.vue:119
- src/views/guardia/BitacoraView.vue:135

### Button · V34 — 2 usos

```
:icon="esOscuro ? 'pi pi-sun' : 'pi pi-moon'" rounded severity="secondary" variant="text"
```

Clases usadas: `btn-no-bg header-btn`, `btn-no-bg`

- src/components/layout/AppHeader.vue:32
- src/components/layout/AppHeaderLogin.vue:15

### Button · V35 — 2 usos

```
icon="pi pi-pencil" size="small"
```

- src/components/planilla/PlanillaDatos.vue:314
- src/views/setup/SetupEntidadesView.vue:779

### Button · V36 — 2 usos

```
:severity="filtro === o.valor ? 'primary' : 'secondary'" :variant="filtro === o.valor ? undefined : 'outlined'" size="small"
```

- src/components/planilla/PlanillaResultado.vue:111
- src/components/planilla/PlanillaStagedPreview.vue:671

### Button · V37 — 2 usos

```
icon="pi pi-download" size="small"
```

- src/components/planilla/PlanillaUploader.vue:36
- src/components/planilla/PlanillaUploader.vue:69

### Button · V38 — 2 usos

```
icon="pi pi-search"
```

- src/components/visitas/BuscadorPatenteCard.vue:108
- src/components/visitas/BuscadorPatenteCard.vue:131

### Button · V39 — 2 usos

```
icon="pi pi-sign-in" severity="success"
```

- src/components/visitas/BuscadorPatenteCard.vue:215
- src/components/visitas/BuscadorPatenteCard.vue:328

### Button · V40 — 2 usos

```
icon="pi pi-info-circle" severity="info" variant="outlined"
```

- src/components/visitas/BuscadorPatenteCard.vue:236
- src/components/visitas/BuscadorPatenteCard.vue:342

### Button · V41 — 2 usos

```
icon="pi pi-undo" severity="danger" size="small" variant="text"
```

- src/views/admin/PlantillasNotificacionView.vue:118
- src/views/gestion/ReglasNotificacionView.vue:163

### Button · V42 — 2 usos

```
fluid icon="pi pi-check"
```

- src/views/auth/ResetPasswordView.vue:92
- src/views/auth/SetupPasswordView.vue:92

### Button · V43 — 2 usos

```
icon="pi pi-bell" variant="text"
```

Clases usadas: `w-full justify-content-start py-2`

- src/views/menu/MenuView.vue:86
- src/views/menu/MenuView.vue:107

### Button · V44 — 2 usos

```
icon="pi pi-arrow-right" size="small"
```

- src/views/setup/SetupUnidadesView.vue:576
- src/views/superadmin/SaasCondominioDetailView.vue:318

### Button · V45 — 2 usos

```
icon="pi pi-save" severity="secondary"
```

- src/views/superadmin/SaasCondominioSetupView.vue:740
- src/views/superadmin/SaasCondominioSetupView.vue:880

### Button · V46 — 2 usos

```
severity="danger" size="small" variant="outlined"
```

- src/views/superadmin/SaasPlanesView.vue:195
- src/views/superadmin/SaasPlantillasView.vue:338

### Button · V47 — 2 usos

```
severity="success" size="small" variant="outlined"
```

- src/views/superadmin/SaasPlanesView.vue:196
- src/views/superadmin/SaasPlantillasView.vue:339

### Button · V48 — 1 usos

```
icon="pi pi-times" rounded severity="secondary" variant="text"
```

- src/components/FiltroFechas.vue:18

### Button · V49 — 1 usos

```
severity="info" size="small"
```

- src/components/NotificationBanner.vue:27

### Button · V50 — 1 usos

```
:icon="accionesLabels?.[accion]?.icon" :severity="accionesLabels?.[accion]?.severity" size="small"
```

- src/components/bitacora/TurnoCard.vue:86

### Button · V51 — 1 usos

```
icon="pi pi-info-circle" rounded severity="secondary" variant="text"
```

- src/components/common/InfoAyudaVista.vue:26

### Button · V52 — 1 usos

```
icon="pi pi-camera" severity="secondary" size="small" variant="outlined"
```

Clases usadas: `rounded-lg border border-border/80`

- src/components/encomiendas/RegistrarEncomiendaDialog.vue:232

### Button · V53 — 1 usos

```
icon="pi pi-image" severity="secondary" size="small" variant="outlined"
```

Clases usadas: `rounded-lg border border-border/80`

- src/components/encomiendas/RegistrarEncomiendaDialog.vue:233

### Button · V54 — 1 usos

```
icon="pi pi-times" rounded severity="danger" size="small" variant="text"
```

Clases usadas: `absolute top-1 right-1`

- src/components/encomiendas/RegistrarEncomiendaDialog.vue:237

### Button · V55 — 1 usos

```
icon="pi pi-bars" rounded severity="secondary" variant="text"
```

Clases usadas: `btn-no-bg header-btn`

- src/components/layout/AppHeader.vue:41

### Button · V56 — 1 usos

```
:severity="auth.activeContext === ctx.key ? 'primary' : 'secondary'" :variant="auth.activeContext === ctx.key ? 'filled' : 'outlined'" rounded size="small"
```

Clases usadas: `context-card`

- src/components/layout/AppHeader.vue:56

### Button · V57 — 1 usos

```
:icon="item.icon" rounded severity="primary"
```

Clases usadas: `w-12! h-12! p-0! shadow-lg transform transition-transform active:scale-95`

- src/components/layout/BottomNavigation.vue:12

### Button · V58 — 1 usos

```
icon="pi pi-bell" rounded severity="secondary" variant="text"
```

Clases usadas: `btn-no-bg header-btn`

- src/components/layout/NotificacionPopover.vue:65

### Button · V59 — 1 usos

```
size="small" variant="link"
```

Clases usadas: `btn-no-bg header-btn text-text-muted`

- src/components/layout/NotificacionPopover.vue:92

### Button · V60 — 1 usos

```
:icon="f.marcadoEliminar ? 'pi pi-undo' : 'pi pi-trash'" :severity="f.marcadoEliminar ? 'secondary' : 'danger'" size="small" variant="text"
```

- src/components/planilla/PlanillaDatos.vue:1267

### Button · V61 — 1 usos

```
:icon="
          filasExpandidas.has('__errores') ? 'pi pi-eye-slash' : 'pi pi-eye'
        " severity="danger" size="small" variant="text"
```

- src/components/planilla/PlanillaResultado.vue:64

### Button · V62 — 1 usos

```
icon="pi pi-download" size="small" variant="outlined"
```

Clases usadas: `bg-surface text-text-muted hover:bg-primary`

- src/components/planilla/PlanillaResultado.vue:90

### Button · V63 — 1 usos

```
icon="pi pi-check-circle" size="small"
```

- src/components/planilla/PlanillaStagedPreview.vue:566

### Button · V64 — 1 usos

```
:icon="
                        filasExpandidas.has(num)
                          ? 'pi pi-eye-slash'
                          : 'pi pi-eye'
                      " size="small" variant="text"
```

Clases usadas: `text-text-muted`

- src/components/planilla/PlanillaStagedPreview.vue:814

### Button · V65 — 1 usos

```
:icon="
                        filasExpandidas.has(f.numeroFila)
                          ? 'pi pi-eye-slash'
                          : 'pi pi-eye'
                      " size="small" variant="text"
```

- src/components/planilla/PlanillaStagedPreview.vue:946

### Button · V66 — 1 usos

```
:icon="item.icon" :severity="item.severity || (item.isCentralFab ? 'primary' : 'secondary')" :variant="item.variant || (item.isCentralFab ? 'filled' : 'outlined')"
```

- src/components/quickaccess/AccesoRapidoCard.vue:31

### Button · V67 — 1 usos

```
icon="pi pi-plus" severity="secondary"
```

- src/components/visitas/BuscadorPatenteCard.vue:229

### Button · V68 — 1 usos

```
icon="pi pi-times" severity="secondary" size="small" variant="text"
```

Clases usadas: `btn-no-bg body-btn`

- src/components/visitas/BuscadorPatenteCard.vue:254

### Button · V69 — 1 usos

```
icon="pi pi-plus"
```

- src/components/visitas/BuscadorPatenteCard.vue:400

### Button · V70 — 1 usos

```
icon="pi pi-arrow-up" severity="secondary" size="small" variant="outlined"
```

- src/modules/permisos/views/CargosPermisosView.vue:135

### Button · V71 — 1 usos

```
icon="pi pi-user-plus" size="small"
```

- src/views/admin/PersonalView.vue:73

### Button · V72 — 1 usos

```
icon="pi pi-link" severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:255

### Button · V73 — 1 usos

```
icon="pi pi-user-plus" severity="info" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:256

### Button · V74 — 1 usos

```
:icon="unidadExpandida === u.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" severity="secondary" size="small" variant="text"
```

- src/views/admin/UnidadesView.vue:297

### Button · V75 — 1 usos

```
fluid icon="pi pi-send"
```

- src/views/auth/ForgotPasswordView.vue:61

### Button · V76 — 1 usos

```
fluid icon="pi pi-arrow-left"
```

Clases usadas: `primary-text`

- src/views/auth/ForgotPasswordView.vue:82

### Button · V77 — 1 usos

```
icon="pi pi-arrow-left" severity="secondary" variant="outlined"
```

- src/views/common/EnConstruccionView.vue:36

### Button · V78 — 1 usos

```
:severity="unidadActiva === u.id ? 'primary' : 'secondary'" :variant="unidadActiva === u.id ? 'solid' : 'outlined'" size="small"
```

- src/views/dashboard/ResidenteDashboardView.vue:105

### Button · V79 — 1 usos

```
icon="pi pi-check" severity="success" size="small"
```

- src/views/encomiendas/EncomiendasView.vue:340

### Button · V80 — 1 usos

```
icon="pi pi-search" severity="secondary" size="small" variant="outlined"
```

- src/views/encomiendas/EncomiendasView.vue:348

### Button · V81 — 1 usos

```
icon="pi pi-filter" severity="secondary" size="small"
```

- src/views/gestion/AnunciosView.vue:126

### Button · V82 — 1 usos

```
icon="pi pi-comment" severity="secondary"
```

- src/views/gestion/CasosAdminView.vue:254

### Button · V83 — 1 usos

```
icon="pi pi-check" severity="danger"
```

- src/views/gestion/CasosAdminView.vue:261

### Button · V84 — 1 usos

```
icon="pi pi-search" size="small"
```

- src/views/guardia/ChecklistTemplatesView.vue:112

### Button · V85 — 1 usos

```
icon="pi pi-pencil" severity="warn" size="small"
```

- src/views/guardia/ChecklistTemplatesView.vue:126

### Button · V86 — 1 usos

```
icon="pi pi-trash" severity="danger" size="small"
```

- src/views/guardia/ChecklistTemplatesView.vue:127

### Button · V87 — 1 usos

```
icon="pi pi-plus" severity="secondary" size="small" variant="outlined"
```

- src/views/guardia/ChecklistTemplatesView.vue:142

### Button · V88 — 1 usos

```
:icon="item.icon" variant="text"
```

Clases usadas: `w-full justify-content-start py-2`

- src/views/menu/MenuView.vue:69

### Button · V89 — 1 usos

```
icon="pi pi-user" variant="text"
```

Clases usadas: `w-full justify-content-start py-2`

- src/views/menu/MenuView.vue:100

### Button · V90 — 1 usos

```
icon="pi pi-sign-out" severity="danger" variant="text"
```

Clases usadas: `w-full justify-content-start py-2`

- src/views/menu/MenuView.vue:115

### Button · V91 — 1 usos

```
icon="pi pi-bell" size="small"
```

- src/views/residente/ConfiguracionView.vue:43

### Button · V92 — 1 usos

```
size="small"
```

- src/views/residente/GestionesView.vue:192

### Button · V93 — 1 usos

```
icon="pi pi-key"
```

- src/views/residente/PerfilView.vue:338

### Button · V94 — 1 usos

```
icon="pi pi-send"
```

- src/views/residente/PerfilView.vue:383

### Button · V95 — 1 usos

```
icon-pos="right" icon="pi pi-arrow-right" size="small" variant="text"
```

- src/views/setup/SetupLayout.vue:141

### Button · V96 — 1 usos

```
icon="pi pi-home" size="small"
```

- src/views/setup/SetupLayout.vue:150

### Button · V97 — 1 usos

```
icon="pi pi-plus" severity="secondary" size="small"
```

- src/views/setup/SetupUnidadesView.vue:494

### Button · V98 — 1 usos

```
icon="pi pi-pencil" severity="secondary" size="small"
```

- src/views/setup/SetupUnidadesView.vue:748

### Button · V99 — 1 usos

```
icon="pi pi-arrow-left" size="small"
```

- src/views/setup/SetupUnidadesView.vue:1076

### Button · V100 — 1 usos

```
icon="pi pi-upload" size="small"
```

- src/views/storage/ArchivosView.vue:167

### Button · V101 — 1 usos

```
:icon="categoriaIcons[cat]" :severity="categoriaSeleccionada === cat ? 'primary' : 'secondary'" size="small" variant="outlined"
```

- src/views/storage/ArchivosView.vue:171

### Button · V102 — 1 usos

```
icon="pi pi-download" severity="secondary" size="small" variant="text"
```

- src/views/storage/ArchivosView.vue:208

### Button · V103 — 1 usos

```
icon="pi pi-upload"
```

- src/views/storage/ArchivosView.vue:267

### Button · V104 — 1 usos

```
icon="pi pi-ban" severity="danger" size="small" variant="outlined"
```

- src/views/superadmin/SaasCondominioDetailView.vue:332

### Button · V105 — 1 usos

```
icon="pi pi-check" severity="success" size="small" variant="outlined"
```

- src/views/superadmin/SaasCondominioDetailView.vue:341

### Button · V106 — 1 usos

```
icon="pi pi-user-plus"
```

- src/views/superadmin/SaasCondominioSetupView.vue:864

### Button · V107 — 1 usos

```
icon="pi pi-refresh" severity="secondary" size="small" variant="outlined"
```

- src/views/superadmin/SaasCondominioSetupView.vue:960

### Button · V108 — 1 usos

```
icon="pi pi-send" severity="secondary" size="small"
```

- src/views/superadmin/SaasCondominioSetupView.vue:969

### Button · V109 — 1 usos

```
icon="pi pi-cog" size="small" variant="text"
```

- src/views/superadmin/SaasCondominiosView.vue:239

### Button · V110 — 1 usos

```
icon="pi pi-arrow-left" severity="secondary" variant="text"
```

- src/views/superadmin/SaasEmailConfigView.vue:285

### Button · V111 — 1 usos

```
icon="pi pi-bolt" severity="secondary" variant="outlined"
```

- src/views/superadmin/SaasEmailConfigView.vue:352

### Button · V112 — 1 usos

```
icon="pi pi-trash" severity="danger" variant="outlined"
```

- src/views/superadmin/SaasEmailConfigView.vue:353

### Button · V113 — 1 usos

```
icon="pi pi-refresh" severity="secondary" size="small"
```

- src/views/superadmin/SaasSuscripcionView.vue:125

### Button · V114 — 1 usos

```
:severity="u.activo ? 'danger' : 'success'" size="small" variant="outlined"
```

- src/views/superadmin/SaasUsuariosView.vue:146

### Button · V115 — 1 usos

```
icon="pi pi-check" severity="secondary"
```

- src/views/visitas/BusquedaDetalleView.vue:23

### Button · V116 — 1 usos

```
icon="pi pi-sign-out" severity="warn" size="small"
```

- src/views/visitas/VisitasView.vue:298

