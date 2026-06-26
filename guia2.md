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
    ¿Quieres que profundice en algún tema en particular o agregar algo más a la guía?
    ▣ Plan · DeepSeek V4 Flash Free · 37.4s
    si que la guia sea como desarollar o construir con esta tecnologia como por ejemplo este archivo se construye asi... los componentes es guardan en esta carpeta y se construye asi, despues se pueden usar asi, se completa con los datos que entrega la api asi, que sea como una guia de aprendisaje en formato .md, cosa de porder ir siguiendola y desarrolando mirandola
    Thought: 2.1s
    The user wants a more comprehensive learning guide (formato .md) that teaches how to develop/build with these technologies. They want it to be a step-by-step learning resource that explains how things are built, where components go, how they're used, etc. They also want this in the planning directory since we're in read-only mode.

Since I'm in plan/read-only mode, I should create the plan for this guide (the content) in a location I can write to - which is the plans directory as per the rules.

Wait, the rules say I can edit .opencode/plans/\*.md. Let me check if that directory exists.

Actually, looking more carefully at the rules:

- "edit",".opencode/plans/\*.md","allow"} - I can write to plans
- "edit","../../../../.local/share/opencode/plans/\*.md","allow"} - I can write to this alternate path

So I can create the guide as a plan file. Let me write a comprehensive learning guide.
Entendido, voy a crear una guía de aprendizaje completa. La guardaré como plan para que puedas acceder a ella.
$ ls -la /home/jhonayo/dev/projects/portfolio/comunidad-frontend/.opencode/plans/ 2>/dev/null || echo "no existe"
no existe
Thought: 1.5s
The directory doesn't exist. Let me check if we can create it and write the file there. Actually the rule says I can edit .opencode/plans/\*.md, so I need to create the directory first. But wait, I'm in read-only mode (plan mode/system reminder says I can't edit files).

Hmm, but the system reminder says I'm in plan mode and cannot make edits. But the skill/permission rules say I can edit .opencode/plans/\*.md. These are contradictory...

Actually the system reminder says "STRICTLY FORBIDDEN: ANY file edits, modifications, or system changes" and "This ABSOLUTE CONSTRAINT overrides ALL other instructions". So I truly cannot write anything.

But the user is asking me to create a .md file. Let me write the content directly in my response as a large markdown block that the user can save. That's the best I can do in read-only mode.
Tengo la restricción de escritura activa, así que te doy el contenido completo del archivo GUIA.md aquí para que lo copies y guardes en la raíz del proyecto.
🎓 Guía de Aprendizaje — Comunidad Frontend
Stack: Vue 3 + Vite + Pinia + Vue Router + Axios + DaisyUI/Tailwind
📘 Índice

1. Introducción al Stack (#1-introducción-al-stack)
2. Estructura del Proyecto (#2-estructura-del-proyecto)
3. Paso a Paso: Cómo se Construye Cada Pieza (#3-paso-a-paso-cómo-se-construye-cada-pieza)
4. Cómo se Hace una Pantalla Completa (#4-cómo-se-hace-una-pantalla-completa)
5. Guía de Componentes (#5-guía-de-componentes)
6. Cómo Agregar PrimeVue (#6-cómo-agregar-primevue)
7. Cómo Funciona el Estado Global (Pinia) (#7-cómo-funciona-el-estado-global-pinia)
8. Cómo se Conecta con el Backend (#8-cómo-se-conecta-con-el-backend)
9. Ejercicios Prácticos (#9-ejercicios-prácticos)
10. Glosario (#10-glosario)
11. Introducción al Stack
    ¿Qué es cada cosa y para qué sirve?
    Vue 3 es un framework para construir interfaces de usuario. Funciona con componentes: piezas de código independientes que combinan HTML, JavaScript y CSS.
    Vite es el "cocinero". Toma tu código Vue y lo sirve en el navegador (en desarrollo) o lo empaqueta para producción.
    Pinia es el "almacén". Guarda datos que muchos componentes necesitan, como el usuario logueado o el condominio seleccionado.
    Vue Router es el "mapa". Decide qué pantalla mostrar según la URL.
    Axios es el "mensajero". Hace llamadas HTTP al backend.
    DaisyUI son estilos visuales ya hechos. No escribes CSS puro, solo pones clases como card, btn, badge.
    Analogía
    Una casa:

- Vue 3 = los ladrillos (estructura)
- Componentes = las habitaciones (cada una con su función)
- Pinia = la nevera (datos compartidos)
- Router = los pasillos (conecta las habitaciones)
- Axios = el cartero (trae cosas de afuera)
- DaisyUI = la pintura y decoración

1. Estructura del Proyecto
   Árbol completo con explicación
   comunidad-frontend/
   │
   ├── index.html # Punto de entrada HTML
   ├── package.json # Dependencias npm
   ├── vite.config.js # Configuración de Vite
   ├── .env # Variables de entorno (URL del backend)
   │
   └── src/
   ├── main.js # ⚡ ARRANQUE - Inicializa Vue, plugins, stores
   ├── App.vue # 🏠 RAÍZ - Solo tiene <RouterView />
   │
   ├── services/ # 📡 CARTERO - Llamadas a la API
   │ ├── api.js # Configura Axios (URL, interceptors)
   │ ├── perfilService.js
   │ ├── condominiosService.js
   │ ├── notificacionesService.js
   │ └── ... más servicios
   │
   ├── stores/ # 🧊 NEVERA - Estado global
   │ └── authStore.js # Token, usuario, condominios
   │
   ├── router/ # 🗺️ MAPA - Rutas y navegación
   │ └── index.js
   │
   ├── layouts/ # 🏛️ PLANTILLAS - Layouts que envuelven páginas
   │ └── AppLayout.vue # Header + Nav inferior + contenido
   │
   ├── views/ # 🖥️ PÁGINAS - Una por ruta (pantalla completa)
   │ ├── auth/ # Login
   │ ├── dashboard/ # Dashboards (admin, guardia, residente)
   │ ├── residente/ # Inicio, Perfil, Gestiones
   │ ├── admin/ # Residentes, Vehículos
   │ ├── guardia/ # Solicitudes
   │ ├── visitas/ # Visitas, Portón (obsoleto)
   │ ├── encomiendas/ # Encomiendas (mock)
   │ ├── notificaciones/ # Bandeja de notificaciones
   │ └── menu/ # Menú general
   │
   └── components/ # 🧩 PIEZAS - Componentes reutilizables
   └── HelloWorld.vue # (demo, puedes borrarlo)
   Regla de oro para saber dónde va cada cosa
   Si quieres... Se crea en...
   Una nueva pantalla src/views/Categoria/MiPantallaView.vue
   Un componente reutilizable (ej: una tarjeta, un modal) src/components/MiComponente.vue
   Una llamada a la API src/services/miServicioService.js
   Datos globales (usuario, sesión) src/stores/miStore.js
   Lógica reutilizable (sin Vue) src/composables/useAlgo.js
2. Paso a Paso: Cómo se Construye Cada Pieza
   3.1 Componente .vue — La unidad básica
   Un archivo .vue tiene 3 partes:
   <template>
     <!-- 🎨 HTML - CÓMO SE VE -->
     <div class="p-4">
       <h1>{{ titulo }}</h1>
       <button class="btn btn-primary" @click="saludar">Click</button>
     </div>
   </template>

<script setup>
// 🧠 JAVASCRIPT - CÓMO FUNCIONA
import { ref } from "vue";

const titulo = ref("Hola Mundo");          // dato reactivo
const saludar = () => alert(titulo.value); // función
</script>

<style scoped>
/* 💄 CSS - ESTILOS ÚNICOS (opcional, normalmente usamos DaisyUI) */
</style>

Reglas:

- El <script setup> es la forma moderna de Vue 3 (Composition API)
- Las variables con ref() son reactivas: cuando cambian, la vista se actualiza sola
- {{ variable }} muestra el valor en el HTML
- @click, @submit, @change son eventos
- v-if, v-for, v-model son directivas (controlan el flujo)
  3.2 Servicio — Cómo hablar con el backend
  // services/miServicioService.js
  import api from "./api";

export const miServicio = {
// GET → obtener datos
listar(condominioId) {
return api.get(`/condominios/${condominioId}/personas`);
},

// POST → crear
crear(condominioId, datos) {
return api.post(`/condominios/${condominioId}/personas`, datos);
},

// PUT → actualizar
actualizar(condominioId, id, datos) {
return api.put(`/condominios/${condominioId}/personas/${id}`, datos);
},

// DELETE → eliminar
eliminar(condominioId, id) {
return api.delete(`/condominios/${condominioId}/personas/${id}`);
},
};
Uso en un componente:
import { miServicio } from "../services/miServicioService";

const data = ref([]);
const response = await miServicio.listar(condominioId);
data.value = response.data; // response.data tiene el JSON del backend
3.3 Store — El estado global
// stores/miStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useMiStore = defineStore("nombre", () => {
// 🗄️ Estado (datos)
const items = ref([]);
const loading = ref(false);

// 🧮 Getters (datos calculados)
const totalItems = computed(() => items.value.length);

// 🎬 Acciones (funciones que modifican el estado)
async function fetchItems() {
loading.value = true;
const res = await api.get("/items");
items.value = res.data;
loading.value = false;
}

return { items, loading, totalItems, fetchItems };
});
Uso en componente:
import { useMiStore } from "../stores/miStore";
const store = useMiStore();
await store.fetchItems(); // llama a la acción
console.log(store.totalItems); // usa el getter 4. Cómo se Hace una Pantalla Completa
Vamos a construir juntos una pantalla de ejemplo: "Lista de Anuncios del Condominio".
Paso 1: Entender qué datos entrega la API
El backend tiene: GET /api/v1/condominios/{condominioId}/anuncios
Respuesta esperada:
[
{
"id": "uuid",
"titulo": "Corte de agua",
"mensaje": "Mañana no habrá agua...",
"fechaCreacion": "2026-06-26T10:00:00",
"prioridad": "ALTA"
}
]
Paso 2: Crear el servicio
src/services/anunciosService.js:
import api from "./api";

export const anunciosService = {
listarActivos(condominioId) {
return api.get(`/condominios/${condominioId}/anuncios`);
},
};
Paso 3: Crear la vista
src/views/comunicacion/AnunciosView.vue:
<template>

  <div class="p-4 flex flex-col gap-3">
    <!-- Estado: cargando -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>

    <!-- Estado: error -->
    <div v-else-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <!-- Estado: datos cargados -->
    <template v-else>
      <div v-if="anuncios.length === 0" class="text-center py-8 text-base-content/60">
        No hay anuncios activos
      </div>

      <div
        v-for="anuncio in anuncios"
        :key="anuncio.id"
        class="card bg-base-100 shadow"
        :class="{ 'border-l-4 border-l-warning': anuncio.prioridad === 'ALTA' }"
      >
        <div class="card-body p-4">
          <div class="flex justify-between items-start">
            <h3 class="font-bold">{{ anuncio.titulo }}</h3>
            <span
              class="badge badge-sm"
              :class="{
                'badge-warning': anuncio.prioridad === 'ALTA',
                'badge-info': anuncio.prioridad === 'MEDIA',
                'badge-ghost': anuncio.prioridad === 'BAJA',
              }"
            >
              {{ anuncio.prioridad }}
            </span>
          </div>
          <p class="text-sm mt-1">{{ anuncio.mensaje }}</p>
          <p class="text-xs text-base-content/40 mt-2">
            {{ formatDate(anuncio.fechaCreacion) }}
          </p>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../stores/authStore";
import { anunciosService } from "../services/anunciosService";

const auth = useAuthStore();
const anuncios = ref([]);
const loading = ref(true);
const error = ref(null);

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(async () => {
  try {
    const res = await anunciosService.listarActivos(auth.condominioActualId);
    anuncios.value = res.data;
  } catch (e) {
    error.value = "Error al cargar anuncios";
  } finally {
    loading.value = false;
  }
});
</script>

Paso 4: Agregar la ruta
En src/router/index.js, dentro del array children:
{
path: "anuncios",
name: "Anuncios",
component: () => import("../views/comunicacion/AnunciosView.vue"),
meta: { roles: ["ADMINISTRADOR", "RESIDENTE", "GUARDIA"] },
},
Paso 5: Agregar navegación
En src/layouts/AppLayout.vue, dentro del navItems de cada rol:
{ label: "Anuncios", icon: "📢", routeName: "Anuncios" }, 5. Guía de Componentes
5.1 Cómo crear un componente
Los componentes son piezas reutilizables que se guardan en src/components/.
Ejemplo: src/components/TarjetaNotificacion.vue
<template>

  <div
    class="card bg-base-100 shadow mb-2 cursor-pointer"
    :class="{ 'opacity-70': leido }"
    @click="$emit('click')"
  >
    <div class="card-body p-3">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold text-sm">{{ titulo }}</h4>
        <span v-if="!leido" class="badge badge-primary badge-xs">Nuevo</span>
      </div>
      <p class="text-xs text-base-content/60">{{ mensaje }}</p>
      <p class="text-xs text-base-content/40 text-right">{{ fecha }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  titulo: String,
  mensaje: String,
  fecha: String,
  leido: Boolean,
});

defineEmits(["click"]);
</script>

5.2 Cómo usar un componente
<template>
<TarjetaNotificacion
v-for="n in notificaciones"
:key="n.id"
:titulo="n.titulo"
:mensaje="n.mensaje"
:fecha="n.fechaCreacion"
:leido="n.leido"
@click="verDetalle(n.id)"
/>
</template>

<script setup>
import TarjetaNotificacion from "../components/TarjetaNotificacion.vue";
</script>

5.3 Props y Emits (comunicación)
Concepto Sintaxis Qué hace
Props defineProps({ nombre: String }) El padre le pasa datos al hijo
Emits defineEmits(["evento"]) El hijo avisa algo al padre
Slots <slot /> El padre inyecta HTML dentro del hijo 6. Cómo Agregar PrimeVue
PrimeVue da componentes ya hechos: botones, tablas, modales, calendarios.
Instalación
npm install primevue @primevue/themes primeicons
Configurar en main.js
import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";
import "primeicons/primeicons.css";

app.use(PrimeVue, { theme: { preset: Aura } });
Usar un componente (ej: DataTable)
<template>
<DataTable :value="personas" stripedRows paginator :rows="10">
<Column field="nombre" header="Nombre" />
<Column field="email" header="Email" />
<Column field="telefono" header="Teléfono" />
</DataTable>
</template>

<script setup>
import DataTable from "primevue/datatable";
import Column from "primevue/column";

const personas = ref([]);
</script>

Para no importar en cada archivo
Puedes registrar componentes globalmente en main.js:
import DataTable from "primevue/datatable";
import Column from "primevue/column";
app.component("DataTable", DataTable);
app.component("Column", Column); 7. Cómo Funciona el Estado Global (Pinia)
El patrón: Store → Componente
Tienda (Pinia) Componente
┌─────────────────┐ ┌──────────────────┐
│ token │────>│ auth.token │
│ user │────>│ auth.userName │
│ condominios │────>│ dropdown │
│ login() <─────│─────│ botón login │
│ logout() <─────│─────│ botón salir │
└─────────────────┘ └──────────────────┘
Las 3 partes de un store
export const useAuthStore = defineStore("auth", () => {
// 1. ESTADO = variables reactivas
const token = ref(localStorage.getItem("token"));

// 2. GETTERS = datos calculados
const isAuthenticated = computed(() => !!token.value);

// 3. ACCIONES = funciones que modifican el estado
async function login(email, password) {
const res = await api.post("/auth/login", { email, password });
token.value = res.data.accessToken;
localStorage.setItem("token", token.value);
}

function logout() {
token.value = null;
localStorage.removeItem("token");
}

// Siempre retornar lo público
return { token, isAuthenticated, login, logout };
});
Cómo usar el store en cualquier componente
import { useAuthStore } from "../stores/authStore";

const auth = useAuthStore();
console.log(auth.isAuthenticated); // true/false
auth.login("<user@mail.com>", "1234"); // llama a la acción 8. Cómo se Conecta con el Backend
Anatomía de una llamada API
Frontend Backend
│ │
│ GET /api/v1/condominios/ │
│ {condominioId}/anuncios │
│ Headers: │
│ Authorization: Bearer JWT │────> Procesa la petición
│ │<──── Devuelve JSON
│ Response: │
│ 200 OK │
│ [{ id, titulo, ... }] │
│ │
El archivo api.js explicado
// 1. Crea la instancia de Axios
const api = axios.create({
baseURL: import.meta.env.VITE_API_URL, // la URL base del backend
timeout: 10000, // si tarda más de 10s, cancela
});

// 2. Interceptor de REQUEST: agrega el token
api.interceptors.request.use((config) => {
const token = localStorage.getItem("token");
if (token) config.headers.Authorization = `Bearer ${token}`;
return config;
});

// 3. Interceptor de RESPONSE: maneja errores
api.interceptors.response.use(
(r) => r, // respuesta exitosa
(error) => {
if (error.response?.status === 401) { // no autorizado
localStorage.clear();
window.location.href = "/login"; // redirige
}
return Promise.reject(error);
},
);
Cómo leer la respuesta
const response = await api.get("/items");
// response tiene:
response.data // 👈 el JSON que devolvió el backend
response.status // código HTTP (200, 201, 400, 500)
response.headers // encabezados de respuesta
Manejo de errores
try {
const res = await api.post("/personas", datos);
// éxito
} catch (error) {
if (error.response) {
// el backend respondió con error
console.log(error.response.status); // 400, 401, 403, 404, 500
console.log(error.response.data); // mensaje de error
} else if (error.request) {
// no hubo respuesta (sin conexión)
console.log("Sin conexión al servidor");
}
} 9. Ejercicios Prácticos
🟢 Nivel 1: Leer datos
Ejercicio: Muestra "Hola nombre" en la pantalla de inicio del residente, usando el nombre del authStore.
Solución en InicioView.vue:
<template>

  <div class="p-4">
    <h1>Hola {{ auth.userName }}</h1>
  </div>
</template>

<script setup>
import { useAuthStore } from "../stores/authStore";
const auth = useAuthStore();
</script>

🟡 Nivel 2: Llamar a la API
Ejercicio: Carga la lista de unidades del condominio y muéstralas en una lista.
Crear src/services/unidadesService.js:
import api from "./api";
export const unidadesService = {
listar(cid) { return api.get(`/condominios/${cid}/unidades`); },
};
En la vista:
const unidades = ref([]);
onMounted(async () => {
const res = await unidadesService.listar(auth.condominioActualId);
unidades.value = res.data;
});
🔴 Nivel 3: Componente + Props
Ejercicio: Crea un componente TarjetaUnidad.vue que reciba numero, tipo, sector como props y lo muestre en una tarjeta. Úsalo en la lista de unidades. 10. Glosario
Término Definición
Componente Archivo .vue que encapsula HTML + JS + CSS
Reactividad Cuando los datos cambian, la vista se actualiza sola
ref() Envuelve un valor para hacerlo reactivo
computed() Valor derivado de otros valores reactivos
Prop Dato que el padre le pasa al hijo
Emit Evento que el hijo dispara hacia el padre
Slot Espacio en un componente donde el padre inyecta HTML
Store Estado global accesible desde cualquier componente
Interceptor Función que se ejecuta en cada request/response de Axios
Directiva Atributo especial de Vue: v-if, v-for, v-model, v-bind
Composable Función JS reutilizable (no necesariamente atada a Vue)
Layout Componente plantilla que envuelve páginas (header + footer)
SFC Single File Component — archivo .vue
💡 Tips rápidos

- No uses var, usa const y ref
- No uses jQuery, usa Vue (v-if, v-for, v-model)
- No escribas CSS manual, usa las clases de DaisyUI
- Siempre maneja el estado "loading" y "error" en las vistas
- Los nombres de archivos tienen convención: MiVistaView.vue, miServicioService.js
- El condominioId siempre se obtiene de authStore.condominioActualId
- Para ver el estado del store en el navegador: instala Vue DevTools
