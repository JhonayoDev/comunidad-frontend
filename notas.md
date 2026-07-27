1. bitacoraService.js — El que habla con el backend
   // Este archivo solo sabe hacer llamadas HTTP (axios).
   // No guarda nada, solo pide y devuelve.

export const bitacoraService = {
miTurno(condominioId) {
// 👇 Hace un GET a la API y devuelve una PROMESA
// (una promesa es como un "vale" que dice:
// "todavía no tengo los datos, pero cuando lleguen te aviso")
return api.get(`/condominios/${condominioId}/bitacora/mi-turno`);
},

registrarEvento(condominioId, data) {
// 👇 Hace un POST para enviar datos al backend
return api.post(`/condominios/${condominioId}/bitacora`, data);
},
}; 2. useTurno.js — El "cerebro" que maneja la lógica
Este es el archivo más importante de entender. Es un composable (una función reutilizable que Vue ejecuta cuando la vista se carga).
import { ref } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
// 👆 useQuery: "dame datos del backend y mantenlos actualizados"
// useMutation: "envía datos al backend"
// useQueryClient: "para decirle a useQuery que refresque los datos"

import { useAuthStore } from "@/stores/authStore";
// 👆 authStore: guarda info del usuario logueado (como su condominioId)

import { bitacoraService } from "@/services/bitacoraService";

export function useTurno() {
// ─── OBTENER EL CONDOMINIO DEL USUARIO LOGUEADO ───
const auth = useAuthStore();
// auth.condominioActualId → ej: 5

const queryClient = useQueryClient();

// ─── VARIABLES DE ESTADO ───
// "ref" crea una variable REACTIVA:
// cuando cambia su valor, Vue automáticamente re-renderiza la pantalla
const turnoLoading = ref(false); // ¿está cargando?
const turnoError = ref(null); // ¿hubo error?
const enviandoNovedad = ref(false);

// ─── OBJETO CON LOS TEXTOS DE LOS BOTONES ───
const accionesLabels = {
TURNO_INICIO: { label: "Iniciar turno", icon: "pi pi-play", severity: "success" },
TURNO_FIN: { label: "Finalizar turno", icon: "pi pi-stop", severity: "danger" },
COLACION_SALIDA: { label: "Salir a colación", icon: "pi pi-clock", severity: "warn" },
COLACION_REGRESO: { label: "Regresar de colación", icon: "pi pi-check-circle", severity: "info" },
NOVEDAD: { label: "Registrar novedad", icon: "pi pi-pencil", severity: "help" },
};

// ─── PEDIR LOS DATOS DEL TURNO AL BACKEND ───
// useQuery es como un "vigilante":
// - Llama a miTurno() automáticamente
// - Guarda el resultado en "turno"
// - Si los datos cambian, actualiza la pantalla sola
//
// 👇 Esto se ejecuta CUANDO el composable se usa en una vista
const { data: turno, refetch: cargarTurno } = useQuery({
// queryKey: identifica esta consulta (como un nombre único)
// Si el condominioId cambia, VueQuery sabe que debe pedir datos nuevos
queryKey: ["miTurno", auth.condominioActualId],

    // queryFn: la función que hace la llamada real
    queryFn: async () => {
      const cid = auth.condominioActualId;
      if (!cid) return null;  // Si no hay condominio, no preguntar
      const res = await bitacoraService.miTurno(cid);
      // 👆 ESPERA a que el backend responda
      // res.data → ej: { enTurno: true, enColacion: false, ultimoEventoEn: "2026-07-18T10:00:00", accionesDisponibles: ["TURNO_FIN", "COLACION_SALIDA", "NOVEDAD"] }
      return res.data;
    },

    // enabled: solo ejecuta la consulta SI hay un condominio seleccionado
    enabled: !!auth.condominioActualId,

});
// 👉 "turno" ahora es una VARIABLE REACTIVA.
// Mientras el backend no responde, vale undefined.
// Cuando responde, se llena con los datos.
// Si hay error, useQuery lo maneja internamente.

// ─── FORMATEAR FECHA (función helper) ───
function formatearFecha(iso) {
if (!iso) return "";
const d = new Date(iso);
return d.toLocaleTimeString("es-CL", {
hour: "2-digit",
minute: "2-digit",
});
}

// ─── CALCULAR QUÉ MOSTRAR SEGÚN EL ESTADO ───
function eventoLabel(turno) {
// turno? significa "si turno existe, accede a .enTurno, si no, no explotes"
if (!turno?.enTurno) return null; // Sin turno activo → no mostrar nada
const hora = formatearFecha(turno.ultimoEventoEn);
if (turno.enColacion) return "Colación desde " + hora;
return "Turno desde " + hora;
}

// ─── ENVIAR UNA ACCIÓN AL BACKEND ───
// useMutation: "cuando llames a mutate(), envía datos y luego refresca"
const accionMutation = useMutation({
mutationFn: async (tipo) => {
// tipo → "TURNO_INICIO", "TURNO_FIN", etc.
const cid = auth.condominioActualId;
if (!cid) throw new Error("No hay condominio seleccionado");
// 👇 Llama al POST del servicio
await bitacoraService.registrarEvento(cid, {
tipo,
clasificacion: "NORMAL",
});
},
onMutate: () => {
// Se ejecuta ANTES de enviar (para mostrar loading)
turnoLoading.value = true;
turnoError.value = null;
},
onError: (e) => {
// Se ejecuta SI hay error
console.error("Error al registrar acción de turno", e);
turnoError.value = "Error al registrar acción en turno";
},
onSettled: () => {
// Se ejecuta SIEMPRE (haya error o no)
turnoLoading.value = false;
// 👇 Le dice a useQuery: "los datos del turno ya no sirven, pídelos de nuevo"
queryClient.invalidateQueries({
queryKey: ["miTurno", auth.condominioActualId],
});
// Así la pantalla se actualiza sola con el nuevo estado del turno
},
});

// ─── FUNCIÓN QUE EJECUTA LA ACCIÓN ───
async function ejecutarAccion(tipo) {
await accionMutation.mutateAsync(tipo);
}

// ─── DEVOLVER TODO PARA QUE LA VISTA LO USE ───
return {
turno, // 👈 Los datos del turno (reactivo)
turnoLoading, // 👈 Si está cargando (reactivo)
turnoError, // 👈 Si hay error (reactivo)
enviandoNovedad,
accionesLabels, // 👈 Los textos de los botones
confirmMessages, // 👈 Los textos de confirmación
eventoLabel, // 👈 Función para mostrar "Turno desde las 10:00"
cargarTurno, // 👈 Función para recargar manualmente
ejecutarAccion, // 👈 Función para iniciar/finalizar turno
registrarNovedad,
formatearFecha,
};
// 👆 Todo esto queda disponible en la vista que use este composable
} 3. GuardiaDashboardView.vue — La vista que conecta todo

<script setup>
// ─── IMPORTA EL COMPOSABLE ───
import { useTurno } from "@/composables/useTurno";
// Al llamar useTurno(), se ejecuta todo el código de arriba:
// - Se llama al backend (useQuery)
// - Se crean las variables reactivas
const {
  turno,           // ← los datos del turno
  turnoLoading,    // ← true mientras carga
  turnoError,
  accionesLabels,
  confirmMessages,
  eventoLabel,
  cargarTurno,
  ejecutarAccion,  // ← función para cuando aprieten un botón
  registrarNovedad,
  formatearFecha,
} = useTurno();
// 👆 En este momento, "turno" vale undefined porque
//    el backend todavía no respondió

import TurnoCard from "@/components/bitacora/TurnoCard.vue";
</script>

<template>
  <!-- 👇 PASA los datos TURNO como "props" al componente TurnoCard -->
  <!--    :turno="turno"  →  pasa la variable reactiva turno  -->
  <!--    @action="ejecutarAccion"  →  "cuando el botón se aprete, ejecuta esto" -->
  <TurnoCard
    :turno="turno"
    :loading="turnoLoading"
    :acciones-labels="accionesLabels"
    :confirm-messages="confirmMessages"
    :evento-label="eventoLabel"
    @action="ejecutarAccion"
    @novedad="showNovedadDialog = true"
  />
</template>
4. TurnoCard.vue — El "dibujante" que solo muestra la UI
<script setup>
// Define qué datos necesita recibir (las "props")
// Son como parámetros que le pasa el padre (GuardiaDashboardView)
const props = defineProps({
  turno: Object,           // ← Los datos del turno
  loading: Boolean,        // ← Si está cargando
  accionesLabels: Object,  // ← Textos de botones
  confirmMessages: Object,
  eventoLabel: Function,   // ← Función para calcular el texto
});

// Define qué eventos puede emitir (disparar) hacia arriba
const emit = defineEmits(["action", "novedad"]);

function handleClick(accion) {
if (accion === "NOVEDAD") {
emit("novedad"); // Avisa al padre: "el usuario quiere registrar novedad"
return;
}
// Muestra confirmación y luego:
emit("action", accion); // Avisa al padre: "ejecuta TURNO_INICIO"
}
</script>

<template>
  <Card>
    <template #title>
      <!-- turno?.enTurno significa:
           "Si turno existe, muéstrame el puntito; si no, no falles" -->
      <span
        :style="{ background: turno?.enTurno ? 'green' : 'gray' }"
      ></span>
      <span>{{ turno?.enTurno ? "En turno" : "Sin turno activo" }}</span>
    </template>

    <template #content>
      <!-- eventoLabel es UNA FUNCIÓN que recibe turno y devuelve texto -->
      <div v-if="eventoLabel?.(turno)">
        {{ eventoLabel(turno) }}
      </div>

      <!-- Recorre accionesDisponibles y crea un botón por cada una -->
      <Button
        v-for="accion in turno?.accionesDisponibles || []"
        :key="accion"
        :label="accionesLabels?.[accion]?.label || accion"
        :loading="loading"
        @click="handleClick(accion)"
      />
    </template>

  </Card>
</template>
Resumen visual del flujo completo
                  1. USUARIO ENTRA A /guardia
                           │
                           ▼
    2. GuardiaDashboardView.vue se activa
                           │
                           ▼
    3. Llama a useTurno() ───────────────────────┐
                           │                      │
                           ▼                      ▼
    4. useQuery ve que     │          5. bitacoraService.miTurno(5)
       queryKey es nueva   │              hace: GET /condominios/5/bitacora/mi-turno
       y ejecuta queryFn ──┘                      │
                           │                      ▼
                           │          6. Backend responde:
                           │     { enTurno: true, enColacion: false,
                           │       accionesDisponibles: ["TURNO_FIN", ...] }
                           │                      │
                           ▼                      ▼
    7. useQuery guarda     ◄──────────────────────┘
       la respuesta en
       la variable "turno"
                           │
                           ▼
    8. Como "turno" es reactiva (ref),
       Vue RE-RENDERIZA la pantalla
                           │
                           ▼
    9. GuardiaDashboardView pasa
       "turno" como prop a <TurnoCard>
                           │
                           ▼
   10. TurnoCard muestra:
       ● "En turno"  (puntito verde)
       Botón: [Finalizar turno] [Salir a colación] [Registrar novedad]
                           │
                           ▼
   11. Usuario aprieta [Finalizar turno]
                           │
                           ▼
   12. TurnoCard emite: @action="TURNO_FIN"
                           │
                           ▼
   13. GuardiaDashboardView recibe
       y llama a: ejecutarAccion("TURNO_FIN")
                           │
                           ▼
   14. useMutation ejecuta:
       bitacoraService.registrarEvento(5, { tipo: "TURNO_FIN" })
       → POST /condominios/5/bitacora
                           │
                           ▼
   15. Al terminar, onSettled invalida la query:
       "los datos del turno ya no sirven, pídelos de nuevo"
                           │
                           ▼
   16. Vuelve al paso 4 → se refresca la pantalla automáticamente
La clave de todo: las variables son reactivas (ref, useQuery). Cuando cambian, Vue solito actualiza la pantalla. Tú no tienes que decirle "vuelve a dibujar".
