# Comunidad Frontend

SaaS de gestión de condominios. Frontend Vue 3 con PrimeVue + Tailwind CSS + TanStack Query.

## Stack

| Tecnología     | Versión  |
| -------------- | -------- |
| Vue            | ^3.5.34  |
| Vite           | ^8.0.12  |
| PrimeVue       | ^4.5.5   |
| Tailwind CSS   | ^4.3.0   |
| TanStack Query | ^5.101.2 |
| Pinia          | ^3.0.4   |
| Axios          | ^1.16.1  |
| Vue Router     | ^4.6.4   |

## Scripts

```bash
pnpm dev        # Servidor de desarrollo
pnpm build      # Build producción + PWA
pnpm preview    # Preview del build
pnpm test       # Tests unitarios (Vitest)
pnpm coverage   # Coverage report
```

## Estructura

```
src/
├── main.js                    # Entry point (Pinia + Router + PrimeVue + TanStack Query)
├── queryClient.js             # TanStack Query config (retry: 2, staleTime: 30s)
├── App.vue                    # Root component
├── style.css                  # Tailwind + PrimeVue base
├── router/index.js            # Rutas con guards por rol/cargo
├── stores/authStore.js        # Pinia store (auth + condominio seleccionado)
├── services/                  # 18 servicios API (axios con auth interceptor)
│   ├── api.js                 # Axios instance principal (con refresh token queue)
│   └── authService.js         # Axios instance para /auth/* (withCredentials)
├── composables/               # 12 composables (8 migrados a TanStack Query)
│   ├── useTurno.js            # useQuery + useMutation (timer cliente fuera de TQ)
│   ├── useEncomiendas.js      # useQuery + useMutation + optimistic update
│   ├── useDashboardGuardia.js # useQueries paralelos (3 endpoints)
│   ├── useNotificaciones.js   # useQuery + useMutation con invalidación
│   ├── useNotificationBadge.js# useQuery con refetchInterval: 30s
│   ├── useSuperAdminDashboard.js # useQuery + filtro local
│   ├── useUnidades.js         # useQuery con enabled: !!cid
│   ├── useCondominioSelector.js # queryClient.invalidateQueries() en cambio
│   ├── usePaginacion.js       # Utilidad de paginación local (sin API)
│   └── useNavigation.js       # Router/Pinia navigation (sin API)
├── components/layout/         # AppHeader, AppFooter, BottomNavigation
├── layouts/                   # AppLayout
├── views/                     # 30+ vistas organizadas por módulo
│   ├── auth/                  # Login, ResetPassword, SetupPassword, ForgotPassword
│   ├── dashboard/             # Admin, Guardia, Residente
│   ├── admin/                 # Unidades, Personas, Vehículos, etc.
│   ├── guardia/               # Autorizaciones, Bitácora, Checklist, Solicitudes
│   ├── residente/             # Inicio, Perfil, Mis Autorizaciones, Mis Deudas
│   ├── encomiendas/           # Encomiendas, Mis Encomiendas
│   ├── finanzas/              # Dashboard, Gastos, Pagos, Ledger, Cuentas, etc.
│   ├── visitas/               # Portón, Visitas, Registrar Visita
│   ├── notificaciones/        # Bandeja de notificaciones
│   └── gestion/               # Anuncios, Casos, Miembros
└── utils/                     # tokenStore (in-memory), refreshScheduler (14 min)
```

## Arquitectura

- **API:** Axios con interceptor de auth (JWT bearer + refresh token queue ante 401)
- **Caché:** TanStack Query con staleTime 30s, retry 2 (para Render gratuito)
- **Estado global:** Pinia (authStore)
- **Estilo:** PrimeVue components + Tailwind utility classes
- **Responsive:** Mobile-first
- **PWA:** Service worker con Workbox (vite-plugin-pwa)
- **Rendimiento:** Sin datos mock, todas las llamadas van al API real

## Backend

- API: `https://apicomunidad.ideaspace.dpdns.org/api/v1`
- Repo: `/home/jhonayo/dev/projects/portfolio/comunidad/`
- Endpoints scoped por condominio: `/api/v1/condominios/{condominioId}/...`

## Roles del Sistema

- `SUPER_ADMIN` — Acceso global a todos los condominios
- `SOPORTE` — Lectura/auditoría global (sin finanzas)
- `ADMINISTRADOR` — Gestión operativa completa de un condominio
- `GUARDIA` — Portería: accesos, encomiendas, bitácora
- `RESIDENTE` — Propietario/arrendatario de una unidad

Cargos adicionales (ADMINISTRADOR, PRESIDENTE, TESORERO, SECRETARIO, DELEGADO, CONSERJE, GUARDIA, MANTENCION, JARDINERO) otorgan permisos extra vía `miembros_condominio`.

### Cuentas Disponibles (password: `Temp2024`)

| Email                        | Rol           | Cargo      | Descripción                            |
| ---------------------------- | ------------- | ---------- | -------------------------------------- |
| `admin@sistema.com`          | SUPER_ADMIN   | —          | Acceso global a todos los condominios  |
| `soporte@sistema.com`        | SOPORTE       | —          | Acceso de lectura global, sin finanzas |
| `carlos.mendoza@test.com`    | ADMINISTRADOR | —          | Admin del condominio Los Robles        |
| `francisca.morales@test.com` | RESIDENTE     | —          | Residente (casa 5)                     |
| `ana.reyes@test.com`         | RESIDENTE     | PRESIDENTE | Presidenta del condominio              |
| `roberto.fuentes@test.com`   | RESIDENTE     | TESORERO   | Tesorero                               |
| `valentina.castro@test.com`  | RESIDENTE     | SECRETARIO | Secretaria                             |
| `miguel.rojas@test.com`      | GUARDIA       | —          | Guardia de portería                    |
| `jorge.silva@test.com`       | GUARDIA       | —          | Guardia de portería                    |

