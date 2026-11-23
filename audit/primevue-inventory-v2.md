# Inventario PrimeVue (v2)

Generado: 2026-11-23T15:29:47.436Z

Total de usos: **507**

Firma = props de estilo (sin title, sin class, props heredadas normalizadas a `variant`).

## Button (507 usos, 0 con prop heredada text/outlined/link)

Variantes distintas: **146**

### Button · V1 — 49 usos

```
severity="secondary"
```

Clases usadas: `rounded-lg`, `flex-1 rounded-lg`, `flex-1`

- src/components/NotificationBanner.vue:34
- src/components/bitacora/ChecklistDialog.vue:120
- src/components/bitacora/NovedadDialog.vue:112
- src/components/encomiendas/DetalleEncomiendaDialog.vue:177
- src/components/encomiendas/EntregarEncomiendaDialog.vue:76
- src/components/encomiendas/RegistrarEncomiendaDialog.vue:247
- src/components/unidades/DialogoAgregarVehiculo.vue:209
- src/components/unidades/DialogoEditarPersona.vue:135
- src/components/unidades/DialogoQuitarPersona.vue:108
- src/components/visitas/ConfirmarSalidaDialog.vue:100
- src/views/admin/PersonalView.vue:120
- src/views/admin/PlantillasNotificacionView.vue:132
- src/views/finanzas/CargosAdicionalesView.vue:254
- src/views/finanzas/CargosAdicionalesView.vue:269
- src/views/finanzas/CategoriasView.vue:143
- … y 34 más

### Button · V2 — 49 usos

```
(default)
```

Clases usadas: `inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 align-middle text-text-muted hover:text-text`, `[
            'bottom-nav-item flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors',
            activo(item)
              ? 'text-primary font-semibold'
              : 'text-text-muted hover:text-text',
          ]`, `flex items-center justify-between w-full text-left`, `flex items-center gap-2 w-full text-left text-sm`, `w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-emphasis transition-colors`, `text-primary-400 underline cursor-pointer bg-transparent border-none p-0`, `
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

- src/components/common/InfoAyudaVista.vue:39
- src/components/layout/BottomNavigation.vue:28
- src/components/layout/NotificacionPopover.vue:96
- src/components/planilla/PlanillaDatos.vue:1072
- src/components/planilla/PlanillaDatos.vue:1128
- src/components/planilla/PlanillaDatos.vue:1200
- src/components/planilla/PlanillaResultado.vue:129
- src/components/unidades/DialogoEditarPersona.vue:141
- src/modules/permisos/views/CargosPermisosView.vue:102
- src/views/admin/PersonalView.vue:121
- src/views/admin/PersonasView.vue:3331
- src/views/admin/PersonasView.vue:3513
- src/views/admin/PersonasView.vue:3631
- src/views/admin/PersonasView.vue:3678
- src/views/finanzas/CargosAdicionalesView.vue:255
- … y 34 más

### Button · V3 — 29 usos

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
- src/views/finanzas/CategoriasView.vue:131
- src/views/finanzas/CuentasView.vue:170
- src/views/finanzas/PlantillasGastoView.vue:170
- src/views/gestion/MiembrosView.vue:264
- … y 14 más

### Button · V4 — 24 usos

```
icon="pi pi-check"
```

Clases usadas: `flex-1 rounded-lg shadow-lg`, `self-start`, `flex-1`

- src/components/bitacora/ChecklistDialog.vue:124
- src/components/encomiendas/EntregarEncomiendaDialog.vue:82
- src/components/encomiendas/RegistrarEncomiendaDialog.vue:253
- src/views/admin/ConfiguracionAlmacenamientoView.vue:79
- src/views/admin/PersonasView.vue:2931
- src/views/admin/PersonasView.vue:3119
- src/views/admin/PlantillasNotificacionView.vue:133
- src/views/guardia/ChecklistTemplatesView.vue:148
- src/views/notificaciones/NotificacionesView.vue:92
- src/views/residente/CasosView.vue:216
- src/views/residente/MisAutorizacionesView.vue:406
- src/views/setup/SetupAccesosView.vue:107
- src/views/setup/SetupAreasComunesView.vue:200
- src/views/setup/SetupEntidadesView.vue:442
- src/views/setup/SetupEntidadesView.vue:545
- … y 9 más

### Button · V5 — 23 usos

```
severity="secondary" variant="text"
```

- src/views/admin/PersonasView.vue:2091
- src/views/admin/PersonasView.vue:2112
- src/views/admin/PersonasView.vue:2131
- src/views/admin/PersonasView.vue:2137
- src/views/admin/PersonasView.vue:2925
- src/views/admin/PersonasView.vue:3113
- src/views/admin/PersonasView.vue:3166
- src/views/admin/PersonasView.vue:3325
- src/views/admin/PersonasView.vue:3451
- src/views/admin/PersonasView.vue:3507
- src/views/admin/PersonasView.vue:3625
- src/views/admin/PersonasView.vue:3672
- src/views/admin/PersonasView.vue:3771
- src/views/admin/SolicitudesAdminView.vue:1108
- src/views/admin/SolicitudesAdminView.vue:1178
- … y 8 más

### Button · V6 — 22 usos

```
icon="pi pi-plus" size="small"
```

- src/components/planilla/PlanillaDatos.vue:333
- src/views/admin/UnidadesView.vue:685
- src/views/encomiendas/EncomiendasView.vue:182
- src/views/finanzas/CargosAdicionalesView.vue:149
- src/views/finanzas/CategoriasView.vue:106
- src/views/finanzas/CuentasView.vue:137
- src/views/finanzas/GastosComunesView.vue:118
- src/views/finanzas/GastosView.vue:183
- src/views/finanzas/PagosView.vue:228
- src/views/finanzas/PlantillasGastoView.vue:140
- src/views/gestion/AnunciosView.vue:133
- src/views/gestion/MiembrosView.vue:205
- src/views/residente/CasosView.vue:118
- src/views/residente/MisAutorizacionesView.vue:209
- src/views/setup/SetupEntidadesView.vue:318
- … y 7 más

### Button · V7 — 22 usos

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
- src/views/admin/SolicitudesAdminView.vue:971
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

### Button · V10 — 10 usos

```
icon="pi pi-plus"
```

- src/components/unidades/DialogoAgregarVehiculo.vue:223
- src/components/visitas/BuscadorPatenteCard.vue:228
- src/components/visitas/BuscadorPatenteCard.vue:394
- src/views/admin/PersonasView.vue:1732
- src/views/admin/PersonasView.vue:2085
- src/views/admin/PersonasView.vue:3383
- src/views/admin/SolicitudesAdminView.vue:1273
- src/views/guardia/ChecklistTemplatesView.vue:142
- src/views/residente/GestionesView.vue:149
- src/views/residente/MisSolicitudesView.vue:442

### Button · V11 — 9 usos

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

### Button · V12 — 8 usos

```
icon="pi pi-check" size="small"
```

- src/components/planilla/PlanillaDatos.vue:321
- src/components/planilla/PlanillaStagedPreview.vue:1009
- src/views/admin/PersonasView.vue:3229
- src/views/setup/SetupEntidadesView.vue:660
- src/views/setup/SetupEntidadesView.vue:781
- src/views/setup/SetupUnidadesView.vue:526
- src/views/setup/SetupUnidadesView.vue:606
- src/views/setup/SetupUnidadesView.vue:754

### Button · V13 — 7 usos

```
icon="pi pi-times" rounded severity="secondary" size="small" variant="text"
```

Clases usadas: `btn-no-bg body-btn`, `absolute right-1 top-1/2 -translate-y-1/2`

- src/components/common/InfoAyudaVista.vue:66
- src/components/visitas/BuscadorPatenteCard.vue:180
- src/components/visitas/BuscadorPatenteCard.vue:376
- src/views/admin/PersonasView.vue:1775
- src/views/admin/PersonasView.vue:1909
- src/views/admin/UnidadesView.vue:566
- src/views/residente/MisSolicitudesView.vue:699

### Button · V14 — 6 usos

```
fluid icon="pi pi-sign-in"
```

Clases usadas: `primary-text`

- src/views/auth/ConfirmarCambioEmailView.vue:139
- src/views/auth/LoginView.vue:142
- src/views/auth/ResetPasswordView.vue:113
- src/views/auth/SetupPasswordView.vue:112
- src/views/auth/VerificarCambioEmailView.vue:85
- src/views/auth/VerificarCambioEmailView.vue:97

### Button · V15 — 6 usos

```
icon="pi pi-search" severity="secondary" size="small"
```

- src/views/finanzas/GastosView.vue:214
- src/views/finanzas/LedgerView.vue:114
- src/views/finanzas/PagosView.vue:255
- src/views/superadmin/SaasAuditoriaView.vue:301
- src/views/superadmin/SaasCondominiosView.vue:202
- src/views/superadmin/SaasPlantillasView.vue:333

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
severity="secondary" size="small"
```

Clases usadas: `ml-2`

- src/components/planilla/PlanillaDatos.vue:327
- src/views/admin/UnidadesView.vue:529
- src/views/setup/SetupEntidadesView.vue:787
- src/views/setup/SetupUnidadesView.vue:760

### Button · V19 — 4 usos

```
icon="pi pi-user-minus" rounded severity="danger" size="small" variant="text"
```

- src/components/unidades/UnidadDetalle.vue:147
- src/views/admin/PersonasView.vue:2324
- src/views/admin/PersonasView.vue:2547
- src/views/admin/PersonasView.vue:3435

### Button · V20 — 4 usos

```
icon="pi pi-sign-out" severity="warn"
```

- src/components/visitas/BuscadorPatenteCard.vue:221
- src/components/visitas/BuscadorPatenteCard.vue:330
- src/components/visitas/BuscadorPatenteCard.vue:399
- src/components/visitas/ConfirmarSalidaDialog.vue:106

### Button · V21 — 4 usos

```
icon="pi pi-ban" severity="danger" size="small" variant="text"
```

- src/views/admin/PersonalView.vue:99
- src/views/admin/PersonasView.vue:3236
- src/views/finanzas/CargosAdicionalesView.vue:200
- src/views/finanzas/GastosView.vue:244

### Button · V22 — 4 usos

```
icon="pi pi-send"
```

- src/views/admin/SolicitudesAdminView.vue:1068
- src/views/residente/MisSolicitudesView.vue:777
- src/views/residente/MisSolicitudesView.vue:938
- src/views/residente/PerfilView.vue:501

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
- src/views/gestion/CasosAdminView.vue:785
- src/views/superadmin/SaasCondominioDetailView.vue:691

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
icon="pi pi-trash" severity="secondary" size="small" variant="outlined"
```

- src/components/planilla/PlanillaStagedPreview.vue:550
- src/components/planilla/PlanillaStagedPreview.vue:993
- src/views/setup/SetupPlanillaView.vue:216

### Button · V30 — 3 usos

```
icon="pi pi-pencil" rounded severity="secondary" size="small" variant="text"
```

- src/components/unidades/UnidadDetalle.vue:136
- src/views/admin/PersonasView.vue:2313
- src/views/admin/PersonasView.vue:2536

### Button · V31 — 3 usos

```
icon="pi pi-link" severity="secondary"
```

- src/views/admin/PersonasView.vue:2054
- src/views/admin/SolicitudesAdminView.vue:999
- src/views/gestion/CasosAdminView.vue:503

### Button · V32 — 3 usos

```
icon="pi pi-filter-slash" severity="secondary" variant="text"
```

- src/views/admin/SolicitudesAdminView.vue:743
- src/views/gestion/CasosAdminView.vue:341
- src/views/residente/MisSolicitudesView.vue:511

### Button · V33 — 3 usos

```
fluid icon="pi pi-check"
```

- src/views/auth/ConfirmarCambioEmailView.vue:118
- src/views/auth/ResetPasswordView.vue:92
- src/views/auth/SetupPasswordView.vue:92

### Button · V34 — 3 usos

```
icon="pi pi-pencil" severity="secondary" size="small" variant="text"
```

- src/views/finanzas/CuentasView.vue:169
- src/views/finanzas/PlantillasGastoView.vue:169
- src/views/superadmin/SaasEmailConfigView.vue:396

### Button · V35 — 2 usos

```
:icon="collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'" rounded size="small" variant="text"
```

Clases usadas: `text-boton-accion/60`, `text-boton-accion`

- src/components/bitacora/EventoCard.vue:72
- src/components/bitacora/TurnoCard.vue:72

### Button · V36 — 2 usos

```
icon="pi pi-flag"
```

- src/components/bitacora/NovedadDialog.vue:118
- src/views/guardia/BitacoraView.vue:135

### Button · V37 — 2 usos

```
:icon="esOscuro ? 'pi pi-sun' : 'pi pi-moon'" rounded severity="secondary" variant="text"
```

Clases usadas: `btn-no-bg header-btn`, `btn-no-bg`

- src/components/layout/AppHeader.vue:32
- src/components/layout/AppHeaderLogin.vue:15

### Button · V38 — 2 usos

```
icon="pi pi-pencil" size="small"
```

- src/components/planilla/PlanillaDatos.vue:313
- src/views/setup/SetupEntidadesView.vue:773

### Button · V39 — 2 usos

```
:severity="filtro === o.valor ? 'primary' : 'secondary'" :variant="filtro === o.valor ? undefined : 'outlined'" size="small"
```

- src/components/planilla/PlanillaResultado.vue:109
- src/components/planilla/PlanillaStagedPreview.vue:660

### Button · V40 — 2 usos

```
icon="pi pi-download" size="small"
```

- src/components/planilla/PlanillaUploader.vue:36
- src/components/planilla/PlanillaUploader.vue:69

### Button · V41 — 2 usos

```
icon="pi pi-user-minus" severity="danger"
```

- src/components/unidades/DialogoQuitarPersona.vue:114
- src/views/admin/PersonasView.vue:3172

### Button · V42 — 2 usos

```
icon="pi pi-search"
```

- src/components/visitas/BuscadorPatenteCard.vue:108
- src/components/visitas/BuscadorPatenteCard.vue:131

### Button · V43 — 2 usos

```
icon="pi pi-sign-in" severity="success"
```

- src/components/visitas/BuscadorPatenteCard.vue:214
- src/components/visitas/BuscadorPatenteCard.vue:323

### Button · V44 — 2 usos

```
icon="pi pi-info-circle" severity="info" variant="outlined"
```

- src/components/visitas/BuscadorPatenteCard.vue:234
- src/components/visitas/BuscadorPatenteCard.vue:337

### Button · V45 — 2 usos

```
icon="pi pi-times" severity="secondary" size="small" variant="outlined"
```

- src/components/visitas/BuscadorPatenteCard.vue:252
- src/views/admin/SolicitudesAdminView.vue:988

### Button · V46 — 2 usos

```
severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:1883
- src/views/admin/UnidadesView.vue:666

### Button · V47 — 2 usos

```
icon="pi pi-plus-circle"
```

- src/views/admin/PersonasView.vue:2032
- src/views/admin/PersonasView.vue:2048

### Button · V48 — 2 usos

```
icon="pi pi-replay"
```

- src/views/admin/PersonasView.vue:2040
- src/views/admin/PersonasView.vue:2589

### Button · V49 — 2 usos

```
icon="pi pi-link" rounded severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:2236
- src/views/admin/PersonasView.vue:2459

### Button · V50 — 2 usos

```
icon="pi pi-plus-circle" rounded severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:2247
- src/views/admin/PersonasView.vue:2470

### Button · V51 — 2 usos

```
icon="pi pi-replay" rounded severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:2258
- src/views/admin/PersonasView.vue:2481

### Button · V52 — 2 usos

```
icon="pi pi-user-plus" rounded severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:2269
- src/views/admin/PersonasView.vue:2492

### Button · V53 — 2 usos

```
icon="pi pi-send" rounded severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:2280
- src/views/admin/PersonasView.vue:2503

### Button · V54 — 2 usos

```
icon="pi pi-refresh" rounded severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:2291
- src/views/admin/PersonasView.vue:2514

### Button · V55 — 2 usos

```
icon="pi pi-envelope" rounded severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:2302
- src/views/admin/PersonasView.vue:2525

### Button · V56 — 2 usos

```
icon="pi pi-undo" severity="secondary" variant="text"
```

- src/views/admin/PlantillasNotificacionView.vue:118
- src/views/gestion/ReglasNotificacionView.vue:163

### Button · V57 — 2 usos

```
icon="pi pi-plus" severity="secondary" size="small"
```

- src/views/admin/SolicitudesAdminView.vue:1005
- src/views/setup/SetupUnidadesView.vue:494

### Button · V58 — 2 usos

```
icon="pi pi-times" severity="danger"
```

- src/views/admin/SolicitudesAdminView.vue:1097
- src/views/residente/MisSolicitudesView.vue:952

### Button · V59 — 2 usos

```
icon="pi pi-link"
```

- src/views/admin/SolicitudesAdminView.vue:1230
- src/views/gestion/CasosAdminView.vue:746

### Button · V60 — 2 usos

```
severity="secondary" size="small" variant="outlined"
```

- src/views/admin/UnidadesView.vue:701
- src/views/admin/UnidadesView.vue:709

### Button · V61 — 2 usos

```
:icon="unidadExpandidaId === u.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" rounded severity="secondary" size="small" variant="text"
```

- src/views/admin/UnidadesView.vue:770
- src/views/admin/UnidadesView.vue:832

### Button · V62 — 2 usos

```
icon="pi pi-user" severity="secondary" size="small" variant="text"
```

- src/views/dashboard/ProveedorDashboardView.vue:120
- src/views/dashboard/TrabajadorDashboardView.vue:118

### Button · V63 — 2 usos

```
icon="pi pi-bell" severity="secondary" size="small" variant="text"
```

- src/views/dashboard/ProveedorDashboardView.vue:144
- src/views/dashboard/TrabajadorDashboardView.vue:142

### Button · V64 — 2 usos

```
icon="pi pi-bell" variant="text"
```

Clases usadas: `w-full justify-content-start py-2`

- src/views/menu/MenuView.vue:86
- src/views/menu/MenuView.vue:107

### Button · V65 — 2 usos

```
icon="pi pi-arrow-right" size="small"
```

- src/views/setup/SetupUnidadesView.vue:576
- src/views/superadmin/SaasCondominioDetailView.vue:318

### Button · V66 — 2 usos

```
severity="danger" size="small" variant="outlined"
```

- src/views/superadmin/SaasPlanesView.vue:195
- src/views/superadmin/SaasPlantillasView.vue:365

### Button · V67 — 2 usos

```
severity="success" size="small" variant="outlined"
```

- src/views/superadmin/SaasPlanesView.vue:196
- src/views/superadmin/SaasPlantillasView.vue:366

### Button · V68 — 1 usos

```
icon="pi pi-times" rounded severity="secondary" variant="text"
```

- src/components/FiltroFechas.vue:18

### Button · V69 — 1 usos

```
severity="info" size="small"
```

- src/components/NotificationBanner.vue:27

### Button · V70 — 1 usos

```
:icon="accionesLabels?.[accion]?.icon" :severity="accionesLabels?.[accion]?.severity" size="small"
```

- src/components/bitacora/TurnoCard.vue:85

### Button · V71 — 1 usos

```
v-bind="{ ...resueltas, ...attrs }"
```

- src/components/common/AppButton.vue:64

### Button · V72 — 1 usos

```
icon="pi pi-info-circle" rounded severity="secondary" variant="text"
```

- src/components/common/InfoAyudaVista.vue:49

### Button · V73 — 1 usos

```
icon="pi pi-camera" severity="secondary" size="small" variant="outlined"
```

Clases usadas: `rounded-lg border border-border/80`

- src/components/encomiendas/RegistrarEncomiendaDialog.vue:233

### Button · V74 — 1 usos

```
icon="pi pi-image" severity="secondary" size="small" variant="outlined"
```

Clases usadas: `rounded-lg border border-border/80`

- src/components/encomiendas/RegistrarEncomiendaDialog.vue:234

### Button · V75 — 1 usos

```
icon="pi pi-times" rounded severity="danger" size="small" variant="text"
```

Clases usadas: `absolute top-1 right-1`

- src/components/encomiendas/RegistrarEncomiendaDialog.vue:238

### Button · V76 — 1 usos

```
icon="pi pi-bars" rounded severity="secondary" variant="text"
```

Clases usadas: `btn-no-bg header-btn`

- src/components/layout/AppHeader.vue:40

### Button · V77 — 1 usos

```
:severity="auth.activeContext === ctx.key ? 'primary' : 'secondary'" :variant="auth.activeContext === ctx.key ? 'filled' : 'outlined'" rounded size="small"
```

Clases usadas: `context-card`

- src/components/layout/AppHeader.vue:54

### Button · V78 — 1 usos

```
:icon="item.icon" rounded severity="primary"
```

Clases usadas: `w-12! h-12! p-0! shadow-lg transform transition-transform active:scale-95`

- src/components/layout/BottomNavigation.vue:12

### Button · V79 — 1 usos

```
icon="pi pi-bell" rounded severity="secondary" variant="text"
```

Clases usadas: `btn-no-bg header-btn`

- src/components/layout/NotificacionPopover.vue:70

### Button · V80 — 1 usos

```
:icon="f.marcadoEliminar ? 'pi pi-undo' : 'pi pi-trash'" :severity="f.marcadoEliminar ? 'secondary' : 'danger'" size="small" variant="text"
```

- src/components/planilla/PlanillaDatos.vue:1254

### Button · V81 — 1 usos

```
:icon="
          filasExpandidas.has('__errores') ? 'pi pi-eye-slash' : 'pi pi-eye'
        " severity="danger" size="small" variant="text"
```

- src/components/planilla/PlanillaResultado.vue:64

### Button · V82 — 1 usos

```
icon="pi pi-download"
```

- src/components/planilla/PlanillaResultado.vue:90

### Button · V83 — 1 usos

```
icon="pi pi-check-circle" size="small"
```

- src/components/planilla/PlanillaStagedPreview.vue:556

### Button · V84 — 1 usos

```
:icon="
                        filasExpandidas.has(num)
                          ? 'pi pi-eye-slash'
                          : 'pi pi-eye'
                      " size="small" variant="text"
```

Clases usadas: `text-text-muted`

- src/components/planilla/PlanillaStagedPreview.vue:803

### Button · V85 — 1 usos

```
:icon="
                        filasExpandidas.has(f.numeroFila)
                          ? 'pi pi-eye-slash'
                          : 'pi pi-eye'
                      " size="small" variant="text"
```

- src/components/planilla/PlanillaStagedPreview.vue:935

### Button · V86 — 1 usos

```
:icon="item.icon" :severity="item.severity || (item.isCentralFab ? 'primary' : 'secondary')" :variant="item.variant || (item.isCentralFab ? 'filled' : 'outlined')"
```

- src/components/quickaccess/AccesoRapidoCard.vue:31

### Button · V87 — 1 usos

```
:severity="modo === 'EXISTENTE' ? 'primary' : 'secondary'" :variant="modo === 'EXISTENTE' ? undefined : 'outlined'" icon="pi pi-arrow-right-arrow-left" size="small"
```

- src/components/unidades/DialogoAgregarVehiculo.vue:114

### Button · V88 — 1 usos

```
:severity="modo === 'NUEVO' ? 'primary' : 'secondary'" :variant="modo === 'NUEVO' ? undefined : 'outlined'" icon="pi pi-plus" size="small"
```

- src/components/unidades/DialogoAgregarVehiculo.vue:122

### Button · V89 — 1 usos

```
icon="pi pi-arrow-right"
```

- src/components/unidades/DialogoAgregarVehiculo.vue:215

### Button · V90 — 1 usos

```
icon="pi pi-user-plus" severity="secondary" size="small" variant="text"
```

- src/components/unidades/UnidadDetalle.vue:74

### Button · V91 — 1 usos

```
icon="pi pi-plus" severity="secondary" size="small" variant="text"
```

- src/components/unidades/UnidadDetalle.vue:175

### Button · V92 — 1 usos

```
icon="pi pi-trash" rounded severity="danger" size="small" variant="text"
```

- src/components/unidades/UnidadDetalle.vue:211

### Button · V93 — 1 usos

```
icon="pi pi-arrow-up" rounded severity="secondary" size="small" variant="text"
```

- src/modules/permisos/views/CargosPermisosView.vue:135

### Button · V94 — 1 usos

```
icon="pi pi-user-plus" size="small"
```

- src/views/admin/PersonalView.vue:73

### Button · V95 — 1 usos

```
:icon="
                mostrarFiltros ? 'pi pi-chevron-up' : 'pi pi-chevron-down'
              " iconPos="right" severity="secondary" variant="text"
```

- src/views/admin/PersonasView.vue:1794

### Button · V96 — 1 usos

```
icon="pi pi-times" severity="secondary" size="small" variant="text"
```

- src/views/admin/PersonasView.vue:2615

### Button · V97 — 1 usos

```
icon="pi pi-envelope"
```

- src/views/admin/PersonasView.vue:3777

### Button · V98 — 1 usos

```
icon="pi pi-paperclip" severity="secondary" size="small" variant="outlined"
```

- src/views/admin/SolicitudesAdminView.vue:915

### Button · V99 — 1 usos

```
icon="pi pi-id-card" severity="success"
```

- src/views/admin/SolicitudesAdminView.vue:1083

### Button · V100 — 1 usos

```
icon="pi pi-check" severity="success"
```

- src/views/admin/SolicitudesAdminView.vue:1090

### Button · V101 — 1 usos

```
:severity="resolverData.resultado === 'RECHAZADA' ? 'danger' : 'success'" icon="pi pi-check"
```

- src/views/admin/SolicitudesAdminView.vue:1184

### Button · V102 — 1 usos

```
icon="pi pi-users" severity="secondary"
```

Clases usadas: `w-full sm:w-auto`

- src/views/admin/UnidadesView.vue:483

### Button · V103 — 1 usos

```
icon="pi pi-cog"
```

Clases usadas: `w-full sm:w-auto`

- src/views/admin/UnidadesView.vue:491

### Button · V104 — 1 usos

```
:icon="mostrarFiltros ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" iconPos="right" severity="secondary" variant="text"
```

- src/views/admin/UnidadesView.vue:581

### Button · V105 — 1 usos

```
fluid icon="pi pi-send"
```

- src/views/auth/ForgotPasswordView.vue:61

### Button · V106 — 1 usos

```
fluid icon="pi pi-arrow-left" severity="secondary"
```

- src/views/auth/ForgotPasswordView.vue:82

### Button · V107 — 1 usos

```
icon="pi pi-arrow-left" severity="secondary" variant="outlined"
```

- src/views/common/EnConstruccionView.vue:36

### Button · V108 — 1 usos

```
:severity="unidadActiva === u.id ? 'primary' : 'secondary'" :variant="unidadActiva === u.id ? 'solid' : 'outlined'" size="small"
```

- src/views/dashboard/ResidenteDashboardView.vue:105

### Button · V109 — 1 usos

```
icon="pi pi-shield" severity="secondary" size="small" variant="text"
```

- src/views/dashboard/TrabajadorDashboardView.vue:206

### Button · V110 — 1 usos

```
icon="pi pi-check" severity="success" size="small"
```

- src/views/encomiendas/EncomiendasView.vue:340

### Button · V111 — 1 usos

```
icon="pi pi-search" severity="secondary"
```

- src/views/encomiendas/EncomiendasView.vue:348

### Button · V112 — 1 usos

```
icon="pi pi-filter" severity="secondary" size="small"
```

- src/views/gestion/AnunciosView.vue:126

### Button · V113 — 1 usos

```
icon="pi pi-comment" severity="secondary"
```

- src/views/gestion/CasosAdminView.vue:636

### Button · V114 — 1 usos

```
icon="pi pi-check" severity="danger"
```

- src/views/gestion/CasosAdminView.vue:643

### Button · V115 — 1 usos

```
icon="pi pi-briefcase" severity="secondary" size="small" variant="outlined"
```

- src/views/gestion/MiembrosView.vue:197

### Button · V116 — 1 usos

```
icon="pi pi-search" size="small"
```

- src/views/guardia/ChecklistTemplatesView.vue:112

### Button · V117 — 1 usos

```
icon="pi pi-pencil" severity="warn" size="small"
```

- src/views/guardia/ChecklistTemplatesView.vue:126

### Button · V118 — 1 usos

```
icon="pi pi-trash" severity="danger" size="small"
```

- src/views/guardia/ChecklistTemplatesView.vue:127

### Button · V119 — 1 usos

```
:icon="item.icon" variant="text"
```

Clases usadas: `w-full justify-content-start py-2`

- src/views/menu/MenuView.vue:69

### Button · V120 — 1 usos

```
icon="pi pi-user" variant="text"
```

Clases usadas: `w-full justify-content-start py-2`

- src/views/menu/MenuView.vue:100

### Button · V121 — 1 usos

```
icon="pi pi-sign-out" severity="secondary" variant="text"
```

Clases usadas: `w-full justify-content-start py-2`

- src/views/menu/MenuView.vue:115

### Button · V122 — 1 usos

```
icon="pi pi-id-card" severity="secondary" size="small" variant="text"
```

- src/views/notificaciones/NotificacionesView.vue:177

### Button · V123 — 1 usos

```
icon="pi pi-bell" size="small"
```

- src/views/residente/ConfiguracionView.vue:43

### Button · V124 — 1 usos

```
icon="pi pi-arrow-right" severity="secondary" size="small" variant="text"
```

- src/views/residente/GestionesView.vue:175

### Button · V125 — 1 usos

```
icon="pi pi-id-card" severity="secondary" size="small" variant="outlined"
```

- src/views/residente/PerfilView.vue:380

### Button · V126 — 1 usos

```
icon="pi pi-key"
```

- src/views/residente/PerfilView.vue:454

### Button · V127 — 1 usos

```
icon-pos="right" icon="pi pi-arrow-right" severity="secondary" size="small" variant="outlined"
```

- src/views/setup/SetupLayout.vue:141

### Button · V128 — 1 usos

```
icon="pi pi-home" size="small"
```

- src/views/setup/SetupLayout.vue:148

### Button · V129 — 1 usos

```
icon="pi pi-pencil" severity="secondary" size="small"
```

- src/views/setup/SetupUnidadesView.vue:745

### Button · V130 — 1 usos

```
icon="pi pi-arrow-left" size="small"
```

- src/views/setup/SetupUnidadesView.vue:1073

### Button · V131 — 1 usos

```
icon="pi pi-upload" size="small"
```

- src/views/storage/ArchivosView.vue:167

### Button · V132 — 1 usos

```
:icon="categoriaIcons[cat]" :severity="categoriaSeleccionada === cat ? 'primary' : 'secondary'" size="small" variant="outlined"
```

- src/views/storage/ArchivosView.vue:171

### Button · V133 — 1 usos

```
icon="pi pi-download" severity="secondary" size="small" variant="text"
```

- src/views/storage/ArchivosView.vue:208

### Button · V134 — 1 usos

```
icon="pi pi-upload"
```

- src/views/storage/ArchivosView.vue:267

### Button · V135 — 1 usos

```
icon="pi pi-ban" severity="danger" size="small" variant="outlined"
```

- src/views/superadmin/SaasCondominioDetailView.vue:332

### Button · V136 — 1 usos

```
icon="pi pi-check" severity="success" size="small" variant="outlined"
```

- src/views/superadmin/SaasCondominioDetailView.vue:341

### Button · V137 — 1 usos

```
icon="pi pi-user-plus"
```

- src/views/superadmin/SaasCondominioSetupView.vue:863

### Button · V138 — 1 usos

```
icon="pi pi-refresh" severity="secondary" size="small" variant="outlined"
```

- src/views/superadmin/SaasCondominioSetupView.vue:958

### Button · V139 — 1 usos

```
icon="pi pi-send" severity="secondary" size="small"
```

- src/views/superadmin/SaasCondominioSetupView.vue:967

### Button · V140 — 1 usos

```
icon="pi pi-cog" size="small" variant="text"
```

- src/views/superadmin/SaasCondominiosView.vue:239

### Button · V141 — 1 usos

```
icon="pi pi-arrow-left" severity="secondary" variant="text"
```

- src/views/superadmin/SaasEmailConfigView.vue:290

### Button · V142 — 1 usos

```
icon="pi pi-bolt" severity="secondary"
```

- src/views/superadmin/SaasEmailConfigView.vue:357

### Button · V143 — 1 usos

```
icon="pi pi-trash" severity="danger" variant="outlined"
```

- src/views/superadmin/SaasEmailConfigView.vue:358

### Button · V144 — 1 usos

```
icon="pi pi-refresh" severity="secondary" size="small"
```

- src/views/superadmin/SaasSuscripcionView.vue:125

### Button · V145 — 1 usos

```
:severity="u.activo ? 'danger' : 'success'" size="small" variant="outlined"
```

- src/views/superadmin/SaasUsuariosView.vue:146

### Button · V146 — 1 usos

```
icon="pi pi-sign-out" severity="warn" size="small"
```

- src/views/visitas/VisitasView.vue:295

