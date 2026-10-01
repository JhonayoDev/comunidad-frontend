# Reporte de migración de tokens

Modo: **ESCRITURA**
Grupo: **semantic**
Fecha: 2026-10-01T06:51:57.755Z

## Resumen

| Total cambios | Archivos afectados |
|---|---|
| 77 | 25 |

### Por grupo

| Grupo | Cambios |
|---|---|
| semantic | 77 |

## ⚠️ Casos que requieren revisión manual (3)

Estos cambios se aplicaron (o se aplicarían) pero deben verificarse visualmente:

| Archivo | Línea | De | A | Nota |
|---|---|---|---|---|
| src/views/superadmin/SaasAlmacenamientoView.vue | 210 | `bg-red-500` | `bg-danger` | Revisar: en SaasAlmacenamientoView era bg de barra excedida — confirmar visualmente |
| src/views/superadmin/SaasAlmacenamientoView.vue | 301 | `bg-red-500` | `bg-danger` | Revisar: en SaasAlmacenamientoView era bg de barra excedida — confirmar visualmente |
| src/views/superadmin/SaasCondominioDetailView.vue | 483 | `bg-red-500` | `bg-danger` | Revisar: en SaasAlmacenamientoView era bg de barra excedida — confirmar visualmente |

## Detalle por archivo

### src/components/bitacora/ChecklistDialog.vue (1 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 88 | semantic | `text-red-500` | `text-danger` |

### src/components/encomiendas/RegistrarEncomiendaDialog.vue (4 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 179 | semantic | `text-red-500` | `text-danger` |
| 189 | semantic | `text-red-500` | `text-danger` |
| 212 | semantic | `text-red-500` | `text-danger` |
| 226 | semantic | `text-red-500` | `text-danger` |

### src/components/stats/TarjetaAccesosActivos.vue (1 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 28 | semantic | `text-green-600` | `text-success-strong` |

### src/views/admin/ConfiguracionAlmacenamientoView.vue (2 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 54 | semantic | `text-green-600` | `text-success-strong` |
| 73 | semantic | `text-green-600` | `text-success-strong` |

### src/views/dashboard/GuardiaDashboardView.vue (1 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 149 | semantic | `text-green-500` | `text-success` |

### src/views/finanzas/CuentasView.vue (2 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 166 | semantic | `text-red-600` | `text-danger-strong` |
| 166 | semantic | `text-green-600` | `text-success-strong` |

### src/views/finanzas/FinanzasDashboardView.vue (9 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 74 | semantic | `text-red-600` | `text-danger-strong` |
| 104 | semantic | `text-red-600` | `text-danger-strong` |
| 132 | semantic | `text-red-600` | `text-danger-strong` |
| 137 | semantic | `text-red-600` | `text-danger-strong` |
| 164 | semantic | `text-red-600` | `text-danger-strong` |
| 68 | semantic | `text-green-600` | `text-success-strong` |
| 98 | semantic | `text-green-600` | `text-success-strong` |
| 128 | semantic | `text-green-600` | `text-success-strong` |
| 164 | semantic | `text-green-600` | `text-success-strong` |

### src/views/finanzas/GastosComunesView.vue (1 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 153 | semantic | `text-green-600` | `text-success-strong` |

### src/views/finanzas/LedgerView.vue (2 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 148 | semantic | `text-red-600` | `text-danger-strong` |
| 148 | semantic | `text-green-600` | `text-success-strong` |

### src/views/finanzas/PagosView.vue (2 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 285 | semantic | `text-green-600` | `text-success-strong` |
| 368 | semantic | `text-green-600` | `text-success-strong` |

### src/views/residente/CasosView.vue (1 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 189 | semantic | `text-red-500` | `text-danger` |

### src/views/residente/MisAutorizacionesView.vue (4 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 308 | semantic | `text-red-500` | `text-danger` |
| 328 | semantic | `text-red-500` | `text-danger` |
| 375 | semantic | `text-red-500` | `text-danger` |
| 385 | semantic | `text-red-500` | `text-danger` |

### src/views/residente/PerfilView.vue (4 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 314 | semantic | `text-red-500` | `text-danger` |
| 323 | semantic | `text-red-500` | `text-danger` |
| 333 | semantic | `text-red-500` | `text-danger` |
| 378 | semantic | `text-red-500` | `text-danger` |

### src/views/setup/SetupAccesosView.vue (1 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 165 | semantic | `text-green-500` | `text-success` |

### src/views/setup/SetupAreasComunesView.vue (2 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 377 | semantic | `text-green-500` | `text-success` |
| 610 | semantic | `text-green-500` | `text-success` |

### src/views/setup/SetupEntidadesView.vue (1 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 961 | semantic | `text-green-500` | `text-success` |

### src/views/setup/SetupPisosView.vue (1 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 180 | semantic | `text-green-500` | `text-success` |

### src/views/setup/SetupSectoresView.vue (1 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 162 | semantic | `text-green-500` | `text-success` |

### src/views/setup/SetupUnidadesView.vue (1 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 912 | semantic | `text-green-500` | `text-success` |

### src/views/superadmin/SaasAlmacenamientoView.vue (4 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 210 | semantic | `bg-red-500` | `bg-danger` |
| 301 | semantic | `bg-red-500` | `bg-danger` |
| 409 | semantic | `text-green-600` | `text-success-strong` |
| 441 | semantic | `text-green-600` | `text-success-strong` |

### src/views/superadmin/SaasCondominioDetailView.vue (7 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 451 | semantic | `text-red-500` | `text-danger` |
| 473 | semantic | `text-red-500` | `text-danger` |
| 555 | semantic | `text-red-500` | `text-danger` |
| 570 | semantic | `text-red-500` | `text-danger` |
| 582 | semantic | `text-red-500` | `text-danger` |
| 605 | semantic | `text-red-500` | `text-danger` |
| 483 | semantic | `bg-red-500` | `bg-danger` |

### src/views/superadmin/SaasCondominioSetupView.vue (9 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 803 | semantic | `text-red-500` | `text-danger` |
| 815 | semantic | `text-red-500` | `text-danger` |
| 831 | semantic | `text-red-500` | `text-danger` |
| 850 | semantic | `text-red-500` | `text-danger` |
| 546 | semantic | `text-green-500` | `text-success` |
| 672 | semantic | `text-green-500` | `text-success` |
| 763 | semantic | `text-green-500` | `text-success` |
| 903 | semantic | `text-green-500` | `text-success` |
| 987 | semantic | `text-green-600` | `text-success-strong` |

### src/views/superadmin/SaasCrearCondominioView.vue (9 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 149 | semantic | `text-red-500` | `text-danger` |
| 157 | semantic | `text-red-500` | `text-danger` |
| 174 | semantic | `text-red-500` | `text-danger` |
| 184 | semantic | `text-red-500` | `text-danger` |
| 192 | semantic | `text-red-500` | `text-danger` |
| 200 | semantic | `text-red-500` | `text-danger` |
| 208 | semantic | `text-red-500` | `text-danger` |
| 216 | semantic | `text-red-500` | `text-danger` |
| 239 | semantic | `text-red-500` | `text-danger` |

### src/views/superadmin/SuperAdminDashboardView.vue (3 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 62 | semantic | `text-red-600` | `text-danger-strong` |
| 56 | semantic | `text-green-600` | `text-success-strong` |
| 68 | semantic | `text-orange-600` | `text-warning` |

### src/views/visitas/RegistrarVisitaView.vue (4 cambios)

| Línea | Grupo | De | A |
|---|---|---|---|
| 168 | semantic | `text-red-500` | `text-danger` |
| 196 | semantic | `text-red-500` | `text-danger` |
| 211 | semantic | `text-red-500` | `text-danger` |
| 233 | semantic | `text-red-500` | `text-danger` |

