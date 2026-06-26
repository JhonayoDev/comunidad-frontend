GUIA.md
Guía del Proyecto — Comunidad Frontend
Bienvenido. Este documento explica cómo está organizado el proyecto, cómo funciona cada pieza y cómo hacer modificaciones. Está escrito pensando en alguien que se enfrenta a estas tecnologías por primera vez.

1. Stack Tecnológico
   Tecnología Para qué sirve
   Vue 3 Framework de frontend. Crea la interfaz de usuario con componentes reutilizables
   Vite Herramienta de build. Sirve el proyecto en desarrollo y lo compila para producción
   Pinia Manejo de estado global (datos compartidos entre componentes, ej: usuario logueado)
   Vue Router Enrutamiento. Define qué pantalla se ve según la URL (/login, /inicio, etc.)
   Axios Cliente HTTP. Hace llamadas al backend (API REST)
   DaisyUI + Tailwind Framework de CSS. Da estilos sin escribir CSS manual
2. Estructura de Carpetas
   src/
   ├── App.vue # Componente raíz (solo renderiza <RouterView />)
   ├── main.js # Punto de entrada. Inicializa Vue, router, stores
   │
   ├── services/ # Llamadas a la API (Axios)
   │ ├── api.js # Instancia de Axios con URL base + interceptors
   │ ├── condominiosService.js # GET /me/condominios
   │ ├── perfilService.js # /me, /me/password, /me/email/...
   │ ├── notificacionesService.js
   │ ├── unidadesService.js
   │ ├── visitasService.js # (obsoleto - sin backend)
   │ ├── solicitudesService.js # (obsoleto - sin backend)
   │ └── encomiendasService.js # (solo mock data)
   │
   ├── stores/ # Estado global (Pinia)
   │ └── authStore.js # Token, usuario, condominios, selección
   │
   ├── composables/ # Lógica reutilizable
   │ ├── useResidente.js # (antes cargaba /me/vinculos, ahora en desuso)
   │ ├── useResidentes.js # Carga unidades y vínculos
   │ ├── useVehiculos.js # Carga vehículos
   │ └── useDashboardAdmin.js # (antes cargaba dashboard admin, ahora en desuso)
   │
   ├── router/
   │ └── index.js # Configuración de rutas y guardias de navegación
   │
   ├── layouts/
   │ └── AppLayout.vue # Layout principal: header + footer nav + <RouterView />
   │
   ├── views/ # Pantallas completas (una por ruta)
   │ ├── auth/
   │ │ └── LoginView.vue
   │ ├── dashboard/
   │ │ ├── DashboardView.vue # (placeholder)
   │ │ ├── AdminDashboardView.vue # Dashboard del admin
   │ │ └── GuardiaDashboardView.vue # Dashboard del guardia
   │ ├── residente/
   │ │ ├── InicioView.vue # Dashboard del residente
   │ │ ├── PerfilView.vue
   │ │ └── GestionesView.vue
   │ ├── admin/
   │ │ ├── ResidentesView.vue
   │ │ ├── VehiculosView.vue
   │ │ └── SolicitudesAdminView.vue
   │ ├── guardia/
   │ │ └── SolicitudesView.vue
   │ ├── visitas/
   │ │ ├── VisitasView.vue
   │ │ ├── RegistrarVisitaView.vue
   │ │ └── PortonView.vue
   │ ├── encomiendas/
   │ │ ├── EncomiendasView.vue
   │ │ └── MisEncomiendasView.vue
   │ ├── notificaciones/
   │ │ └── NotificacionesView.vue
   │ └── menu/
   │ └── MenuView.vue
   │
   └── components/
   └── HelloWorld.vue # (demo, se puede borrar)
3. Flujo de la Aplicación
   3.1 Login
4. Usuario escribe email + contraseña en LoginView.vue
5. Se llama authStore.login() en authStore.js
6. El store hace POST /api/v1/auth/login → recibe accessToken, refreshToken, personaId, nombre, email, roles
7. Guarda el token en localStorage
8. Llama GET /api/v1/me para obtener el perfil completo
9. Llama GET /api/v1/me/condominios para obtener los condominios accesibles
10. Si 1 condominio → se selecciona automáticamente
11. Si varios → el usuario debe elegir uno en el header
12. Redirige al dashboard según el rol del condominio seleccionado
    3.2 Selección de condominio

- El AppLayout.vue muestra un <select> en el header si hasMultipleCondominios es true
- Al cambiar, se llama authStore.seleccionarCondominio(id) y se recarga la página
- El condominioActual se guarda en localStorage
  3.3 Navegación protegida
- router/index.js tiene un beforeEach que verifica:
- Si la ruta requiere autenticación → redirige a /login
- Si el rol del usuario no tiene permiso → redirige a su ruta inicial
- Los roles se comparan contra meta.roles de cada ruta
  3.4 Llamadas a la API
- Todas pasan por api.js (instancia de Axios)
- El interceptor de request agrega Authorization: Bearer <token> automáticamente
- El interceptor de response captura errores 401 y redirige al login
- La URL base se lee de VITE_API_URL en .env

1. Archivos Clave Explicados
   src/services/api.js
   import axios from "axios";

const api = axios.create({
baseURL: import.meta.env.VITE_API_URL, // ej: <http://192.168.1.25:9100/api/v1>
timeout: 10000,
});

// Pone el token en cada request
api.interceptors.request.use((config) => {
const token = localStorage.getItem("token");
if (token) config.headers.Authorization = `Bearer ${token}`;
return config;
});

// Si el backend responde 401, cierra sesión
api.interceptors.response.use(
(r) => r,
(error) => {
if (error.response?.status === 401) {
localStorage.clear();
window.location.href = "/login";
}
return Promise.reject(error);
},
);

export default api;
src/stores/authStore.js
Un store de Pinia usando la Composition API (setup function):

- Estado: token, user, condominios, condominioActual
- Getters computados: isAuthenticated, userName, condominioActualId, condominioActualRol
- Acciones: login(), fetchCondominios(), seleccionarCondominio(), logout()
- Todo se persiste en localStorage para que sobreviva al refresh
  src/router/index.js
  Cada ruta tiene:
- path: la URL
- name: identificador para navegar con router.push({ name: "..." })
- component: el archivo .vue que se renderiza
- meta.public: si es true, se puede ver sin login
- meta.roles: array de roles que pueden acceder (ej: ["ADMINISTRADOR", "GUARDIA"])
  Las rutas hijas de / usan AppLayout.vue como layout compartido (header + nav inferior).

1. Convenciones del Proyecto
   Nombres de archivos

- Servicios: snakeCaseService.js (ej: perfilService.js)
- Stores: camelCaseStore.js (ej: authStore.js)
- Vistas: PascalCaseView.vue (ej: AdminDashboardView.vue)
- Componentes: PascalCase.vue (ej: MiComponente.vue)
- Composables: useCamelCase.js (ej: useResidente.js)
  Roles del backend (códigos)
  Los roles llegan como strings en el array user.roles:
  Rol Significado
  SUPER_ADMIN Dueño de la plataforma SaaS
  ADMINISTRADOR Administrador del condominio
  GUARDIA Personal de portería
  RESIDENTE Residente del condominio
  SOPORTE Soporte técnico
  ⚠️ Importante: En el frontend anterior se usaba "ADMIN", ahora es "ADMINISTRADOR".
  Respuestas del backend (formato JSON)
  Login → POST /api/v1/auth/login:
  {
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "personaId": "uuid",
  "nombre": "Juan Pérez",
  "email": "<juan@mail.com>",
  "roles": ["RESIDENTE"]
  }
  Perfil → GET /api/v1/me:
  {
  "personaId": "uuid",
  "nombre": "Juan Pérez",
  "email": "<juan@mail.com>",
  "roles": ["RESIDENTE"]
  }
  Condominios → GET /api/v1/me/condominios:
  [
  {
  "id": "uuid",
  "nombre": "Condominio Los Olivos",
  "direccion": "Av. Siempre Viva 123",
  "rolAcceso": "RESIDENTE",
  "cargo": null
  }
  ]
  Dashboard Residente → GET /api/v1/condominios/{id}/dashboard/residente:
  {
  "nombre": "Juan Pérez",
  "email": "<juan@mail.com>",
  "unidades": [
  {
  "id": "uuid",
  "numero": "101",
  "tipo": "CASA",
  "vehiculos": [{"id": "uuid", "patente": "ABC123", "activo": true}],
  "personas": [{"id": "uuid", "nombre": "Juan Pérez", "tipo": "PROPIETARIO"}],
  "gastoActual": {
  "periodo": "Junio 2026",
  "fechaVencimiento": "2026-07-10",
  "monto": 75000,
  "estadoPago": "PENDIENTE",
  "fechaPago": null
  }
  }
  ]
  }
  Dashboard Admin → GET /api/v1/condominios/{id}/dashboard/admin:
  {
  "condominio": {"id": "uuid", "nombre": "Los Olivos", "direccion": "..."},
  "totales": {"unidades": 20, "residentesActivos": 45, "vehiculos": 30},
  "accesos": {"activosAhora": 3, "ultimosMovimientos": [...]},
  "anunciosVigentes": 2,
  "pendientes": {"encomiendas": 0, "reclamos": 0},
  "gastoComunActual": null
  }

1. Cómo Agregar PrimeVue
   PrimeVue es una librería de componentes UI. Aquí los pasos para instalarla y usarla:
   Paso 1: Instalar
   npm install primevue @primevue/themes
   Paso 2: Configurar en main.js
   import { createApp } from "vue";
   import { createPinia } from "pinia";
   import App from "./App.vue";
   import router from "./router";
   import PrimeVue from "primevue/config";
   import Aura from "@primevue/themes/aura";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
theme: { preset: Aura },
});
app.mount("#app");
Paso 3: Usar un componente
<template>
<Button label="Guardar" icon="pi pi-check" @click="guardar" />

  <Dialog v-model:visible="visible" header="Confirmar">
    <p>¿Estás seguro?</p>
  </Dialog>
</template>

<script setup>
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import "primeicons/primeicons.css"; // íconos

const visible = ref(false);
</script>

Dónde agregar import global (opcional)
Si usas muchos componentes de PrimeVue, puedes importarlos globalmente en main.js para no tener que importarlos en cada archivo:
import Button from "primevue/button";
import Dialog from "primevue/dialog";
const app = createApp(App);
app.component("Button", Button);
app.component("Dialog", Dialog); 7. Cómo Crear un Nuevo Componente
Reglas:

1. Crear archivo en src/components/ con nombre PascalCase.vue
2. Usar <script setup> (Composition API)
3. No agregar comentarios
4. Seguir el estilo del proyecto
Ejemplo: src/components/TarjetaUnidad.vue
<template>

  <div class="card bg-base-100 shadow">
    <div class="card-body p-4">
      <div class="flex items-center gap-2">
        <span class="text-xl">🏠</span>
        <div>
          <p class="font-semibold">{{ titulo }}</p>
          <p class="text-xs text-base-content/60">{{ subtitulo }}</p>
        </div>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({ titulo: String, subtitulo: String });
</script>

Cómo usarlo:
<TarjetaUnidad titulo="Casa 101" subtitulo="Propietario">

  <p>Contenido adicional aquí</p>
</TarjetaUnidad>
8. Flujo Completo de una Feature
Ejemplo: "Mostrar lista de personas del condominio"
Paso 1: Crear servicio (src/services/personasService.js)
import api from "./api";

export const personasService = {
listar(condominioId) {
return api.get(`/condominios/${condominioId}/personas`);
},
};
Paso 2: Crear vista (src/views/admin/PersonasView.vue)
<template>

  <div class="p-4">
    <div v-if="loading">Cargando...</div>
    <div v-else>
      <div v-for="p in personas" :key="p.id" class="card bg-base-100 shadow mb-2 p-3">
        <p class="font-bold">{{ p.nombre }}</p>
        <p class="text-sm">{{ p.email }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../../stores/authStore";
import { personasService } from "../../services/personasService";

const auth = useAuthStore();
const personas = ref([]);
const loading = ref(true);

onMounted(async () => {
  const response = await personasService.listar(auth.condominioActualId);
  personas.value = response.data;
  loading.value = false;
});
</script>

Paso 3: Agregar ruta en router/index.js
{
path: "personas",
name: "Personas",
component: () => import("../views/admin/PersonasView.vue"),
meta: { roles: ["ADMINISTRADOR"] },
},
Paso 4: Agregar botón en AppLayout.vue (navItems)
{ label: "Personas", icon: "👥", routeName: "Personas" }, 9. Resolución de Problemas Comunes
"No carga la página después del login"

- Abre la consola del navegador (F12)
- Revisa que el endpoint del backend sea correcto en .env
- Revisa que el backend esté corriendo (docker ps o curl <http://localhost:8080/api/v1/auth/login>)
- Revisa que no haya errores CORS en la consola
  "Error 401 en todas las llamadas"
- El token expiró o no se guardó bien
- Revisa localStorage.getItem("token") en la consola del navegador
- Revisa que el interceptor de api.js esté agregando el header
  "El dropdown de condominio no aparece"
- El usuario tiene que tener más de 1 condominio asignado
- Revisa auth.condominios en la consola (Vue DevTools)
  "No reconoce el role ADMINISTRADOR"
- En el router y layout, los roles ahora son "ADMINISTRADOR" (no "ADMIN")
- user.roles ahora es un array, no un string

1. Comandos Útiles
    npm run dev # Servidor de desarrollo (puerto 5173)
    npm run build # Compilar para producción
    npm run preview # Vista previa de la compilación
    npm run lint # Verificar estilo de código
