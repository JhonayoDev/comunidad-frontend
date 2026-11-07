# Inventario PrimeVue (v2)

Generado: 2026-11-07T07:26:11.283Z

Total de usos: **470**

Firma = props de estilo (sin title, sin class, props heredadas normalizadas a `variant`).

## Button (470 usos, 0 con prop heredada text/outlined/link)

Variantes distintas: **125**

### Button · V1 — 50 usos

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
              `, `w-full`

- src/components/layout/BottomNavigation.vue:28
- src/components/layout/NotificacionPopover.vue:96
- src/components/planilla/PlanillaDatos.vue:1072
- src/components/planilla/PlanillaDatos.vue:1128
- src/components/planilla/PlanillaDatos.vue:1200
- src/components/planilla/PlanillaResultado.vue:129
- src/modules/permisos/views/CargosPermisosView.vue:102
- src/views/admin/PersonalView.vue:121
- src/views/admin/PersonasView.vue:1703
- src/views/admin/PersonasView.vue:1709
- src/views/admin/PersonasView.vue:2011
- src/views/admin/PersonasView.vue:2179
- src/views/admin/PersonasView.vue:2299
- src/views/admin/PersonasView.vue:2344
- src/views/admin/UnidadesView.vue:382
- … y 35 más

### Button · V2 — 48 usos

```
severity="secondary"
```

Clases usadas: `rounded-lg`, `flex-1 rounded-lg`, `flex-1`

- src/components/NotificationBanner.vue:34
- src/components/bitacora/ChecklistDialog.vue:119
- src/components/bitacora/NovedadDialog.vue:111
- src/components/encomiendas/DetalleEncomiendaDialog.vue:176
- src/components/encomiendas/EntregarEncomiendaDialog.vue:75
- src/components/encomiendas/RegistrarEncomiendaDialog.vue:246
- src/components/visitas/ConfirmarSalidaDialog.vue:99
- src/views/admin/PersonalView.vue:120
- src/views/admin/PlantillasNotificacionView.vue:132
- src/views/admin/UnidadesView.vue:381
- src/views/admin/UnidadesView.vue:414
- src/views/finanzas/CargosAdicionalesView.vue:254
- src/views/finanzas/CargosAdicionalesView.vue:269
- src/views/finanzas/CategoriasView.vue:143
- src/views/finanzas/CuentasView.vue:212
- … y 33 más

### Button · V3 — 30 usos

```
icon="pi pi-trash" severity="danger" size="small" variant="text"
```

- src/components/planilla/PlanillaDatos.vue:693
- src/components/planilla/PlanillaDatos.vue:737
- src/components/planilla/PlanillaDatos.vue:780
- src/components/planilla/PlanillaDatos.vue:827
- src/components/planilla/PlanillaDatos.vue:1104
- src/components/planilla/PlanillaDatos.vue:1159
- src/components/planilla/PlanillaDatos.vue:1232
- src/components/planilla/PlanillaStagedPreview.vue:413
- src/components/planilla/PlanillaStagedPreview.vue:452
- src/components/planilla/PlanillaStagedPreview.vue:504
- src/components/planilla/PlanillaStagedPreview.vue:520
- src/views/admin/UnidadesView.vue:306
- src/views/finanzas/CategoriasView.vue:131
- src/views/finanzas/CuentasView.vue:170
- src/views/finanzas/PlantillasGastoView.vue:170
- … y 15 más

### Button · V4 — 22 usos

```
icon="pi pi-check"
```

Clases usadas: `flex-1 rounded-lg shadow-lg`, `self-start`, `flex-1`

- src/components/bitacora/ChecklistDialog.vue:123
- src/components/encomiendas/EntregarEncomiendaDialog.vue:81
- src/components/encomiendas/RegistrarEncomiendaDialog.vue:252
- src/views/admin/ConfiguracionAlmacenamientoView.vue:79
- src/views/admin/PlantillasNotificacionView.vue:133
- src/views/guardia/ChecklistTemplatesView.vue:148
- src/views/notificaciones/NotificacionesView.vue:92
- src/views/residente/CasosView.vue:215
- src/views/residente/MisAutorizacionesView.vue:405
- src/views/setup/SetupAccesosView.vue:107
- src/views/setup/SetupAreasComunesView.vue:200
- src/views/setup/SetupEntidadesView.vue:442
- src/views/setup/SetupEntidadesView.vue:545
- src/views/setup/SetupPisosView.vue:107
- src/views/setup/SetupSectoresView.vue:102
- … y 7 más

### Button · V5 — 22 usos

```
icon="pi pi-plus" size="small"
```

- src/components/planilla/PlanillaDatos.vue:333
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
- src/views/residente/MisAutorizacionesView.vue:209
- src/views/setup/SetupEntidadesView.vue:318
- … y 7 más

### Button · V6 — 22 usos

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

### Button · V7 — 19 usos

```
severity="secondary" variant="text"
```

- src/views/admin/PersonasView.vue:1680
- src/views/admin/PersonasView.vue:1695
- src/views/admin/PersonasView.vue:1855
- src/views/admin/PersonasView.vue:2005
- src/views/admin/PersonasView.vue:2119
- src/views/admin/PersonasView.vue:2173
- src/views/admin/PersonasView.vue:2293
- src/views/admin/PersonasView.vue:2338
- src/views/admin/PersonasView.vue:2435
- src/views/admin/SolicitudesAdminView.vue:1107
- src/views/admin/SolicitudesAdminView.vue:1176
- src/views/admin/SolicitudesAdminView.vue:1221
- src/views/admin/SolicitudesAdminView.vue:1263
- src/views/gestion/CasosAdminView.vue:649
- src/views/gestion/CasosAdminView.vue:684
- … y 4 más

### Button · V8 — 14 usos

```
icon="pi pi-plus" severity="secondary"
```

- src/components/planilla/PlanillaDatos.vue:702
- src/components/planilla/PlanillaDatos.vue:747
- src/components/planilla/PlanillaDatos.vue:789
- src/components/planilla/PlanillaDatos.vue:1113
- src/components/planilla/PlanillaDatos.vue:1178
- src/components/planilla/PlanillaDatos.vue:1241
- src/components/planilla/PlanillaStagedPreview.vue:422
- src/components/planilla/PlanillaStagedPreview.vue:484
- src/components/planilla/PlanillaStagedPreview.vue:512
- src/views/setup/SetupAccesosView.vue:109
- src/views/setup/SetupAreasComunesView.vue:209
- src/views/setup/SetupEntidadesView.vue:630
- src/views/setup/SetupPisosView.vue:109
- src/views/setup/SetupSectoresView.vue:104

### Button · V9 — 14 usos

```
icon="pi pi-save"
```

- src/modules/permisos/views/CargosPermisosView.vue:90
- src/views/admin/SolicitudesAdminView.vue:970
- src/views/residente/PerfilView.vue:393
- src/views/setup/SetupAccesosView.vue:228
- src/views/setup/SetupAreasComunesView.vue:693
- src/views/setup/SetupEntidadesView.vue:1195
- src/views/setup/SetupPisosView.vue:251
- src/views/setup/SetupPlanillaView.vue:225
- src/views/setup/SetupSectoresView.vue:225
- src/views/setup/SetupUnidadesView.vue:1092
- src/views/superadmin/SaasCondominioSetupView.vue:650
- src/views/superadmin/SaasCondominioSetupView.vue:740
- src/views/superadmin/SaasCondominioSetupView.vue:879
- src/views/superadmin/SaasEmailConfigView.vue:356

### Button · V10 — 9 usos

```
icon="pi pi-pencil" severity="secondary" size="small" variant="outlined"
```

- src/components/planilla/PlanillaStagedPreview.vue:1000
- src/views/admin/PersonalView.vue:98
- src/views/admin/PlantillasNotificacionView.vue:117
- src/views/setup/SetupAccesosView.vue:100
- src/views/setup/SetupAreasComunesView.vue:193
- src/views/setup/SetupPisosView.vue:100
- src/views/setup/SetupSectoresView.vue:95
- src/views/superadmin/SaasCondominioDetailView.vue:324
- src/views/superadmin/SaasCondominioDetailView.vue:424

### Button · V11 — 9 usos

```
icon="pi pi-plus"
```

- src/components/visitas/BuscadorPatenteCard.vue:228
- src/components/visitas/BuscadorPatenteCard.vue:394
- src/views/admin/PersonasView.vue:1179
- src/views/admin/PersonasView.vue:1845
- src/views/admin/PersonasView.vue:2051
- src/views/admin/SolicitudesAdminView.vue:1269
- src/views/guardia/ChecklistTemplatesView.vue:142
- src/views/residente/GestionesView.vue:149
- src/views/residente/MisSolicitudesView.vue:442

### Button · V12 — 8 usos

```
icon="pi pi-check" size="small"
```

- src/components/planilla/PlanillaDatos.vue:321
- src/components/planilla/PlanillaStagedPreview.vue:1009
- src/views/admin/PersonasView.vue:1909
- src/views/setup/SetupEntidadesView.vue:660
- src/views/setup/SetupEntidadesView.vue:781
- src/views/setup/SetupUnidadesView.vue:526
- src/views/setup/SetupUnidadesView.vue:606
- src/views/setup/SetupUnidadesView.vue:754

### Button · V13 — 6 usos

```
fluid icon="pi pi-sign-in"
```

Clases usadas: `primary-text`

- src/views/auth/ConfirmarCambioEmailView.vue:139
- src/views/auth/LoginView.vue:138
- src/views/auth/ResetPasswordView.vue:113
- src/views/auth/SetupPasswordView.vue:112
- src/views/auth/VerificarCambioEmailView.vue:85
- src/views/auth/VerificarCambioEmailView.vue:97

### Button · V14 — 6 usos

```
icon="pi pi-search" severity="secondary" size="small"
```

- src/views/finanzas/GastosView.vue:214
- src/views/finanzas/LedgerView.vue:114
- src/views/finanzas/PagosView.vue:255
- src/views/superadmin/SaasAuditoriaView.vue:301
- src/views/superadmin/SaasCondominiosView.vue:202
- src/views/superadmin/SaasPlantillasView.vue:333

### Button · V15 — 5 usos

```
icon="pi pi-link"
```

- src/views/admin/PersonasView.vue:1617
- src/views/admin/PersonasView.vue:1687
- src/views/admin/PersonasView.vue:1824
- src/views/admin/SolicitudesAdminView.vue:1227
- src/views/gestion/CasosAdminView.vue:743

### Button · V16 — 5 usos

```
fluid icon="pi pi-arrow-left" variant="text"
```

Clases usadas: `primary-text`

- src/views/auth/ConfirmarCambioEmailView.vue:125
- src/views/auth/ForgotPasswordView.vue:68
- src/views/auth/ResetPasswordView.vue:99
- src/views/auth/SetupPasswordView.vue:99
- src/views/auth/VerificarCambioEmailView.vue:109

### Button · V17 — 5 usos

```
:severity="busquedaVisible ? 'primary' : 'secondary'" icon="pi pi-search" size="small" variant="outlined"
```

Clases usadas: `rounded-lg shrink-0`

- src/views/encomiendas/EncomiendasView.vue:216
- src/views/guardia/BitacoraView.vue:125
- src/views/superadmin/SaasAuditoriaView.vue:220
- src/views/superadmin/SaasCondominiosView.vue:133
- src/views/superadmin/SaasPlantillasView.vue:290

### Button · V18 — 4 usos

```
icon="pi pi-times" rounded severity="secondary" size="small" variant="text"
```

Clases usadas: `btn-no-bg body-btn`

- src/components/common/InfoAyudaVista.vue:41
- src/components/visitas/BuscadorPatenteCard.vue:180
- src/components/visitas/BuscadorPatenteCard.vue:376
- src/views/residente/MisSolicitudesView.vue:698

### Button · V19 — 4 usos

```
icon="pi pi-sign-out" severity="warn"
```

- src/components/visitas/BuscadorPatenteCard.vue:221
- src/components/visitas/BuscadorPatenteCard.vue:330
- src/components/visitas/BuscadorPatenteCard.vue:399
- src/components/visitas/ConfirmarSalidaDialog.vue:105

### Button · V20 — 4 usos

```
icon="pi pi-ban" severity="danger" size="small" variant="text"
```

- src/views/admin/PersonalView.vue:99
- src/views/admin/PersonasView.vue:1916
- src/views/finanzas/CargosAdicionalesView.vue:200
- src/views/finanzas/GastosView.vue:244

### Button · V21 — 4 usos

```
icon="pi pi-send"
```

- src/views/admin/SolicitudesAdminView.vue:1067
- src/views/residente/MisSolicitudesView.vue:776
- src/views/residente/MisSolicitudesView.vue:936
- src/views/residente/PerfilView.vue:501

### Button · V22 — 4 usos

```
icon="pi pi-pencil" severity="secondary" size="small" variant="text"
```

- src/views/admin/UnidadesView.vue:305
- src/views/finanzas/CuentasView.vue:169
- src/views/finanzas/PlantillasGastoView.vue:169
- src/views/superadmin/SaasEmailConfigView.vue:396

### Button · V23 — 4 usos

```
icon-pos="right" icon="pi pi-arrow-right" size="small"
```

- src/views/dashboard/AdminDashboardView.vue:165
- src/views/setup/SetupEntidadesView.vue:1186
- src/views/setup/SetupLayout.vue:155
- src/views/setup/SetupUnidadesView.vue:1083

### Button · V24 — 4 usos

```
severity="danger"
```

- src/views/finanzas/CargosAdicionalesView.vue:270
- src/views/finanzas/GastosView.vue:323
- src/views/gestion/CasosAdminView.vue:781
- src/views/superadmin/SaasCondominioDetailView.vue:688

### Button · V25 — 4 usos

```
icon="pi pi-times" severity="danger" size="small" variant="text"
```

- src/views/residente/MisAutorizacionesView.vue:265
- src/views/setup/SetupEntidadesView.vue:276
- src/views/setup/SetupEntidadesView.vue:620
- src/views/setup/SetupUnidadesView.vue:484

### Button · V26 — 4 usos

```
icon="pi pi-arrow-left" severity="secondary" size="small" variant="outlined"
```

- src/views/setup/SetupEntidadesView.vue:1176
- src/views/superadmin/SaasModulosView.vue:70
- src/views/superadmin/SaasSuscripcionView.vue:99
- src/views/superadmin/SaasUsuariosView.vue:109

### Button · V27 — 3 usos

```
icon="pi pi-arrow-right" severity="secondary" size="small" variant="outlined"
```

- src/components/encomiendas/TarjetaEncomiendasResidente.vue:109
- src/views/residente/InicioView.vue:369
- src/views/residente/InicioView.vue:376

### Button · V28 — 3 usos

```
:icon="foco ? 'pi pi-window-minimize' : 'pi pi-window-maximize'" severity="secondary" size="small" variant="text"
```

Clases usadas: `ml-auto`

- src/components/planilla/PlanillaDatos.vue:305
- src/components/planilla/PlanillaStagedPreview.vue:221
- src/components/planilla/PlanillaStagedPreview.vue:587

### Button · V29 — 3 usos

```
severity="secondary" size="small"
```

- src/components/planilla/PlanillaDatos.vue:327
- src/views/setup/SetupEntidadesView.vue:787
- src/views/setup/SetupUnidadesView.vue:760

### Button · V30 — 3 usos

```
icon="pi pi-trash" severity="secondary" size="small" variant="outlined"
```

- src/components/planilla/PlanillaStagedPreview.vue:550
- src/components/planilla/PlanillaStagedPreview.vue:993
- src/views/setup/SetupPlanillaView.vue:216

### Button · V31 — 3 usos

```
icon="pi pi-search"
```

- src/components/visitas/BuscadorPatenteCard.vue:108
- src/components/visitas/BuscadorPatenteCard.vue:131
- src/views/admin/PersonasView.vue:1525

### Button · V32 — 3 usos

```
icon="pi pi-search" severity="secondary"
```

- src/views/admin/PersonasView.vue:1172
- src/views/admin/PersonasView.vue:1750
- src/views/encomiendas/EncomiendasView.vue:348

### Button · V33 — 3 usos

```
icon="pi pi-link" severity="secondary"
```

- src/views/admin/PersonasView.vue:1830
- src/views/admin/SolicitudesAdminView.vue:998
- src/views/gestion/CasosAdminView.vue:502

### Button · V34 — 3 usos

```
icon="pi pi-filter-slash" severity="secondary" variant="text"
```

- src/views/admin/SolicitudesAdminView.vue:743
- src/views/gestion/CasosAdminView.vue:341
- src/views/residente/MisSolicitudesView.vue:511

### Button · V35 — 3 usos

```
fluid icon="pi pi-check"
```

- src/views/auth/ConfirmarCambioEmailView.vue:118
- src/views/auth/ResetPasswordView.vue:92
- src/views/auth/SetupPasswordView.vue:92

### Button · V36 — 2 usos

```
:icon="collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'" rounded size="small" variant="text"
```

Clases usadas: `text-boton-accion/60`, `text-boton-accion`

- src/components/bitacora/EventoCard.vue:72
- src/components/bitacora/TurnoCard.vue:72

### Button · V37 — 2 usos

```
icon="pi pi-flag"
```

- src/components/bitacora/NovedadDialog.vue:117
- src/views/guardia/BitacoraView.vue:135

### Button · V38 — 2 usos

```
:icon="esOscuro ? 'pi pi-sun' : 'pi pi-moon'" rounded severity="secondary" variant="text"
```

Clases usadas: `btn-no-bg header-btn`, `btn-no-bg`

- src/components/layout/AppHeader.vue:32
- src/components/layout/AppHeaderLogin.vue:15

### Button · V39 — 2 usos

```
icon="pi pi-pencil" size="small"
```

- src/components/planilla/PlanillaDatos.vue:313
- src/views/setup/SetupEntidadesView.vue:773

### Button · V40 — 2 usos

```
:severity="filtro === o.valor ? 'primary' : 'secondary'" :variant="filtro === o.valor ? undefined : 'outlined'" size="small"
```

- src/components/planilla/PlanillaResultado.vue:109
- src/components/planilla/PlanillaStagedPreview.vue:660

### Button · V41 — 2 usos

```
icon="pi pi-download" size="small"
```

- src/components/planilla/PlanillaUploader.vue:36
- src/components/planilla/PlanillaUploader.vue:69

### Button · V42 — 2 usos

```
icon="pi pi-sign-in" severity="success"
```

- src/components/visitas/BuscadorPatenteCard.vue:214
- src/components/visitas/BuscadorPatenteCard.vue:323

### Button · V43 — 2 usos

```
icon="pi pi-info-circle" severity="info" variant="outlined"
```

- src/components/visitas/BuscadorPatenteCard.vue:234
- src/components/visitas/BuscadorPatenteCard.vue:337

### Button · V44 — 2 usos

```
icon="pi pi-times" severity="secondary" size="small" variant="outlined"
```

- src/components/visitas/BuscadorPatenteCard.vue:252
- src/views/admin/SolicitudesAdminView.vue:987

### Button · V45 — 2 usos

```
icon="pi pi-link" rounded severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:1275
- src/views/admin/PersonasView.vue:1416

### Button · V46 — 2 usos

```
icon="pi pi-user-plus" rounded severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:1286
- src/views/admin/PersonasView.vue:1427

### Button · V47 — 2 usos

```
icon="pi pi-send" rounded severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:1297
- src/views/admin/PersonasView.vue:1438

### Button · V48 — 2 usos

```
icon="pi pi-refresh" rounded severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:1308
- src/views/admin/PersonasView.vue:1449

### Button · V49 — 2 usos

```
icon="pi pi-envelope" rounded severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:1319
- src/views/admin/PersonasView.vue:1460

### Button · V50 — 2 usos

```
icon="pi pi-pencil" rounded severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:1330
- src/views/admin/PersonasView.vue:1471

### Button · V51 — 2 usos

```
icon="pi pi-trash" rounded severity="danger" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:1341
- src/views/admin/PersonasView.vue:1482

### Button · V52 — 2 usos

```
icon="pi pi-undo" severity="secondary" variant="text"
```

- src/views/admin/PlantillasNotificacionView.vue:118
- src/views/gestion/ReglasNotificacionView.vue:163

### Button · V53 — 2 usos

```
icon="pi pi-plus" severity="secondary" size="small"
```

- src/views/admin/SolicitudesAdminView.vue:1004
- src/views/setup/SetupUnidadesView.vue:494

### Button · V54 — 2 usos

```
icon="pi pi-times" severity="danger"
```

- src/views/admin/SolicitudesAdminView.vue:1096
- src/views/residente/MisSolicitudesView.vue:950

### Button · V55 — 2 usos

```
icon="pi pi-bell" variant="text"
```

Clases usadas: `w-full justify-content-start py-2`

- src/views/menu/MenuView.vue:86
- src/views/menu/MenuView.vue:107

### Button · V56 — 2 usos

```
icon="pi pi-arrow-right" size="small"
```

- src/views/setup/SetupUnidadesView.vue:576
- src/views/superadmin/SaasCondominioDetailView.vue:318

### Button · V57 — 2 usos

```
severity="danger" size="small" variant="outlined"
```

- src/views/superadmin/SaasPlanesView.vue:195
- src/views/superadmin/SaasPlantillasView.vue:365

### Button · V58 — 2 usos

```
severity="success" size="small" variant="outlined"
```

- src/views/superadmin/SaasPlanesView.vue:196
- src/views/superadmin/SaasPlantillasView.vue:366

### Button · V59 — 1 usos

```
icon="pi pi-times" rounded severity="secondary" variant="text"
```

- src/components/FiltroFechas.vue:18

### Button · V60 — 1 usos

```
severity="info" size="small"
```

- src/components/NotificationBanner.vue:27

### Button · V61 — 1 usos

```
:icon="accionesLabels?.[accion]?.icon" :severity="accionesLabels?.[accion]?.severity" size="small"
```

- src/components/bitacora/TurnoCard.vue:85

### Button · V62 — 1 usos

```
v-bind="{ ...resueltas, ...attrs }"
```

- src/components/common/AppButton.vue:64

### Button · V63 — 1 usos

```
icon="pi pi-info-circle" rounded severity="secondary" variant="text"
```

- src/components/common/InfoAyudaVista.vue:26

### Button · V64 — 1 usos

```
icon="pi pi-camera" severity="secondary" size="small" variant="outlined"
```

Clases usadas: `rounded-lg border border-border/80`

- src/components/encomiendas/RegistrarEncomiendaDialog.vue:232

### Button · V65 — 1 usos

```
icon="pi pi-image" severity="secondary" size="small" variant="outlined"
```

Clases usadas: `rounded-lg border border-border/80`

- src/components/encomiendas/RegistrarEncomiendaDialog.vue:233

### Button · V66 — 1 usos

```
icon="pi pi-times" rounded severity="danger" size="small" variant="text"
```

Clases usadas: `absolute top-1 right-1`

- src/components/encomiendas/RegistrarEncomiendaDialog.vue:237

### Button · V67 — 1 usos

```
icon="pi pi-bars" rounded severity="secondary" variant="text"
```

Clases usadas: `btn-no-bg header-btn`

- src/components/layout/AppHeader.vue:40

### Button · V68 — 1 usos

```
:severity="auth.activeContext === ctx.key ? 'primary' : 'secondary'" :variant="auth.activeContext === ctx.key ? 'filled' : 'outlined'" rounded size="small"
```

Clases usadas: `context-card`

- src/components/layout/AppHeader.vue:54

### Button · V69 — 1 usos

```
:icon="item.icon" rounded severity="primary"
```

Clases usadas: `w-12! h-12! p-0! shadow-lg transform transition-transform active:scale-95`

- src/components/layout/BottomNavigation.vue:12

### Button · V70 — 1 usos

```
icon="pi pi-bell" rounded severity="secondary" variant="text"
```

Clases usadas: `btn-no-bg header-btn`

- src/components/layout/NotificacionPopover.vue:70

### Button · V71 — 1 usos

```
:icon="f.marcadoEliminar ? 'pi pi-undo' : 'pi pi-trash'" :severity="f.marcadoEliminar ? 'secondary' : 'danger'" size="small" variant="text"
```

- src/components/planilla/PlanillaDatos.vue:1254

### Button · V72 — 1 usos

```
:icon="
          filasExpandidas.has('__errores') ? 'pi pi-eye-slash' : 'pi pi-eye'
        " severity="danger" size="small" variant="text"
```

- src/components/planilla/PlanillaResultado.vue:64

### Button · V73 — 1 usos

```
icon="pi pi-download"
```

- src/components/planilla/PlanillaResultado.vue:90

### Button · V74 — 1 usos

```
icon="pi pi-check-circle" size="small"
```

- src/components/planilla/PlanillaStagedPreview.vue:556

### Button · V75 — 1 usos

```
:icon="
                        filasExpandidas.has(num)
                          ? 'pi pi-eye-slash'
                          : 'pi pi-eye'
                      " size="small" variant="text"
```

Clases usadas: `text-text-muted`

- src/components/planilla/PlanillaStagedPreview.vue:803

### Button · V76 — 1 usos

```
:icon="
                        filasExpandidas.has(f.numeroFila)
                          ? 'pi pi-eye-slash'
                          : 'pi pi-eye'
                      " size="small" variant="text"
```

- src/components/planilla/PlanillaStagedPreview.vue:935

### Button · V77 — 1 usos

```
:icon="item.icon" :severity="item.severity || (item.isCentralFab ? 'primary' : 'secondary')" :variant="item.variant || (item.isCentralFab ? 'filled' : 'outlined')"
```

- src/components/quickaccess/AccesoRapidoCard.vue:31

### Button · V78 — 1 usos

```
icon="pi pi-arrow-up" rounded severity="secondary" size="small" variant="text"
```

- src/modules/permisos/views/CargosPermisosView.vue:135

### Button · V79 — 1 usos

```
icon="pi pi-user-plus" size="small"
```

- src/views/admin/PersonalView.vue:73

### Button · V80 — 1 usos

```
icon="pi pi-user-minus" rounded severity="danger" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:2103

### Button · V81 — 1 usos

```
icon="pi pi-envelope"
```

- src/views/admin/PersonasView.vue:2441

### Button · V82 — 1 usos

```
icon="pi pi-paperclip" severity="secondary" size="small" variant="outlined"
```

- src/views/admin/SolicitudesAdminView.vue:914

### Button · V83 — 1 usos

```
icon="pi pi-id-card" severity="success"
```

- src/views/admin/SolicitudesAdminView.vue:1082

### Button · V84 — 1 usos

```
icon="pi pi-check" severity="success"
```

- src/views/admin/SolicitudesAdminView.vue:1089

### Button · V85 — 1 usos

```
:severity="resolverData.resultado === 'RECHAZADA' ? 'danger' : 'success'" icon="pi pi-check"
```

- src/views/admin/SolicitudesAdminView.vue:1182

### Button · V86 — 1 usos

```
:icon="unidadExpandida === u.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" severity="secondary" size="small" variant="text"
```

- src/views/admin/UnidadesView.vue:297

### Button · V87 — 1 usos

```
fluid icon="pi pi-send"
```

- src/views/auth/ForgotPasswordView.vue:61

### Button · V88 — 1 usos

```
fluid icon="pi pi-arrow-left" severity="secondary"
```

- src/views/auth/ForgotPasswordView.vue:82

### Button · V89 — 1 usos

```
icon="pi pi-arrow-left" severity="secondary" variant="outlined"
```

- src/views/common/EnConstruccionView.vue:36

### Button · V90 — 1 usos

```
:severity="unidadActiva === u.id ? 'primary' : 'secondary'" :variant="unidadActiva === u.id ? 'solid' : 'outlined'" size="small"
```

- src/views/dashboard/ResidenteDashboardView.vue:105

### Button · V91 — 1 usos

```
icon="pi pi-check" severity="success" size="small"
```

- src/views/encomiendas/EncomiendasView.vue:340

### Button · V92 — 1 usos

```
icon="pi pi-filter" severity="secondary" size="small"
```

- src/views/gestion/AnunciosView.vue:126

### Button · V93 — 1 usos

```
icon="pi pi-comment" severity="secondary"
```

- src/views/gestion/CasosAdminView.vue:635

### Button · V94 — 1 usos

```
icon="pi pi-check" severity="danger"
```

- src/views/gestion/CasosAdminView.vue:642

### Button · V95 — 1 usos

```
icon="pi pi-search" size="small"
```

- src/views/guardia/ChecklistTemplatesView.vue:112

### Button · V96 — 1 usos

```
icon="pi pi-pencil" severity="warn" size="small"
```

- src/views/guardia/ChecklistTemplatesView.vue:126

### Button · V97 — 1 usos

```
icon="pi pi-trash" severity="danger" size="small"
```

- src/views/guardia/ChecklistTemplatesView.vue:127

### Button · V98 — 1 usos

```
:icon="item.icon" variant="text"
```

Clases usadas: `w-full justify-content-start py-2`

- src/views/menu/MenuView.vue:69

### Button · V99 — 1 usos

```
icon="pi pi-user" variant="text"
```

Clases usadas: `w-full justify-content-start py-2`

- src/views/menu/MenuView.vue:100

### Button · V100 — 1 usos

```
icon="pi pi-sign-out" severity="secondary" variant="text"
```

Clases usadas: `w-full justify-content-start py-2`

- src/views/menu/MenuView.vue:115

### Button · V101 — 1 usos

```
icon="pi pi-id-card" severity="secondary" size="small" variant="text"
```

- src/views/notificaciones/NotificacionesView.vue:177

### Button · V102 — 1 usos

```
icon="pi pi-bell" size="small"
```

- src/views/residente/ConfiguracionView.vue:43

### Button · V103 — 1 usos

```
icon="pi pi-arrow-right" severity="secondary" size="small" variant="text"
```

- src/views/residente/GestionesView.vue:175

### Button · V104 — 1 usos

```
icon="pi pi-id-card" severity="secondary" size="small" variant="outlined"
```

- src/views/residente/PerfilView.vue:380

### Button · V105 — 1 usos

```
icon="pi pi-key"
```

- src/views/residente/PerfilView.vue:454

### Button · V106 — 1 usos

```
icon-pos="right" icon="pi pi-arrow-right" severity="secondary" size="small" variant="outlined"
```

- src/views/setup/SetupLayout.vue:141

### Button · V107 — 1 usos

```
icon="pi pi-home" size="small"
```

- src/views/setup/SetupLayout.vue:148

### Button · V108 — 1 usos

```
icon="pi pi-pencil" severity="secondary" size="small"
```

- src/views/setup/SetupUnidadesView.vue:745

### Button · V109 — 1 usos

```
icon="pi pi-arrow-left" size="small"
```

- src/views/setup/SetupUnidadesView.vue:1073

### Button · V110 — 1 usos

```
icon="pi pi-upload" size="small"
```

- src/views/storage/ArchivosView.vue:167

### Button · V111 — 1 usos

```
:icon="categoriaIcons[cat]" :severity="categoriaSeleccionada === cat ? 'primary' : 'secondary'" size="small" variant="outlined"
```

- src/views/storage/ArchivosView.vue:171

### Button · V112 — 1 usos

```
icon="pi pi-download" severity="secondary" size="small" variant="text"
```

- src/views/storage/ArchivosView.vue:208

### Button · V113 — 1 usos

```
icon="pi pi-upload"
```

- src/views/storage/ArchivosView.vue:267

### Button · V114 — 1 usos

```
icon="pi pi-ban" severity="danger" size="small" variant="outlined"
```

- src/views/superadmin/SaasCondominioDetailView.vue:332

### Button · V115 — 1 usos

```
icon="pi pi-check" severity="success" size="small" variant="outlined"
```

- src/views/superadmin/SaasCondominioDetailView.vue:341

### Button · V116 — 1 usos

```
icon="pi pi-user-plus"
```

- src/views/superadmin/SaasCondominioSetupView.vue:863

### Button · V117 — 1 usos

```
icon="pi pi-refresh" severity="secondary" size="small" variant="outlined"
```

- src/views/superadmin/SaasCondominioSetupView.vue:958

### Button · V118 — 1 usos

```
icon="pi pi-send" severity="secondary" size="small"
```

- src/views/superadmin/SaasCondominioSetupView.vue:967

### Button · V119 — 1 usos

```
icon="pi pi-cog" size="small" variant="text"
```

- src/views/superadmin/SaasCondominiosView.vue:239

### Button · V120 — 1 usos

```
icon="pi pi-arrow-left" severity="secondary" variant="text"
```

- src/views/superadmin/SaasEmailConfigView.vue:290

### Button · V121 — 1 usos

```
icon="pi pi-bolt" severity="secondary"
```

- src/views/superadmin/SaasEmailConfigView.vue:357

### Button · V122 — 1 usos

```
icon="pi pi-trash" severity="danger" variant="outlined"
```

- src/views/superadmin/SaasEmailConfigView.vue:358

### Button · V123 — 1 usos

```
icon="pi pi-refresh" severity="secondary" size="small"
```

- src/views/superadmin/SaasSuscripcionView.vue:125

### Button · V124 — 1 usos

```
:severity="u.activo ? 'danger' : 'success'" size="small" variant="outlined"
```

- src/views/superadmin/SaasUsuariosView.vue:146

### Button · V125 — 1 usos

```
icon="pi pi-sign-out" severity="warn" size="small"
```

- src/views/visitas/VisitasView.vue:295

