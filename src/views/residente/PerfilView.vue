<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authStore";
import { perfilService } from "../../services/perfilService";

import Card from "primevue/card";
import Avatar from "primevue/avatar";
import Tag from "primevue/tag";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Message from "primevue/message";
import Divider from "primevue/divider";
import Skeleton from "primevue/skeleton";
import InputSwitch from "primevue/inputswitch";

const router = useRouter();
const auth = useAuthStore();

const me = ref(null);
const loading = ref(true);
const error = ref(null);

const seccionActiva = ref(null);

const preferencias = ref([]);
const loadingPref = ref(false);
const guardandoPref = ref({});

const tipoLabels = {
  VISITA_PREAUTORIZADA: "Visita preautorizada",
  VISITA_INGRESADA: "Visita ingresada",
  VISITA_RECHAZADA: "Visita rechazada",
  ENCOMIENDA_RECIBIDA: "Encomienda recibida",
  ENCOMIENDA_ENTREGADA: "Encomienda entregada",
  RECLAMO_CREADO: "Reclamo creado",
  RECLAMO_RESPONDIDO: "Reclamo respondido",
  RECLAMO_CERRADO: "Reclamo cerrado",
  RESERVA_CREADA: "Reserva creada",
  RESERVA_APROBADA: "Reserva aprobada",
  RESERVA_RECHAZADA: "Reserva rechazada",
  GASTO_COMUN_GENERADO: "Gasto común generado",
  PAGO_REGISTRADO: "Pago registrado",
  DEUDA_VENCIDA: "Deuda vencida",
  ANUNCIO_GENERAL_PUBLICADO: "Anuncio publicado",
  DOCUMENTO_PUBLICADO: "Documento publicado",
};

async function cargarPreferencias() {
  loadingPref.value = true;
  try {
    const { data } = await perfilService.listarPreferenciasNotificacion();
    preferencias.value = data;
  } catch (e) {
    console.error("Error al cargar preferencias", e);
  } finally {
    loadingPref.value = false;
  }
}

async function togglePref(tipo, canal) {
  guardandoPref.value[`${tipo}-${canal}`] = true;
  try {
    const pref = preferencias.value.find((p) => p.tipo === tipo);
    if (!pref) return;
    await perfilService.actualizarPreferenciaNotificacion(tipo, {
      enApp: pref.enApp,
      email: pref.email,
      push: pref.push,
    });
  } catch (e) {
    console.error("Error al actualizar preferencia", e);
    // revert local state
    const pref = preferencias.value.find((p) => p.tipo === tipo);
    if (pref) pref[canal] = !pref[canal];
  } finally {
    guardandoPref.value[`${tipo}-${canal}`] = false;
  }
}

const iniciales = computed(() => {
  const nombre = me.value?.nombre || auth.user?.nombre || "U";
  return nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
});

onMounted(async () => {
  try {
    const res = await perfilService.getMiPerfil();
    me.value = res.data;
    datoForm.value.nombre = res.data.nombre;
  } catch (e) {
    console.error("Error al cargar perfil", e);
    error.value = "Error al cargar perfil";
  } finally {
    loading.value = false;
  }
  cargarPreferencias();
});

// Mis datos
const datoForm = ref({ nombre: "", telefono: "" });
const loadingDatos = ref(false);
const mensajeDatos = ref("");
const errorDatos = ref(false);

async function guardarDatos() {
  loadingDatos.value = true;
  mensajeDatos.value = "";
  errorDatos.value = false;
  try {
    const res = await perfilService.actualizarMe(datoForm.value);
    me.value = res.data;
    mensajeDatos.value = "Cambios guardados correctamente";
  } catch (e) {
    console.error("Error al guardar datos", e);
    mensajeDatos.value = e.response?.data?.message || "Error al guardar";
    errorDatos.value = true;
  } finally {
    loadingDatos.value = false;
  }
}

// Cambiar contraseña
const passForm = ref({ actual: "", nueva: "", confirmacion: "" });
const erroresPass = ref({});
const loadingPass = ref(false);
const mensajePass = ref("");
const errorPass = ref(false);

async function cambiarPassword() {
  erroresPass.value = {};
  mensajePass.value = "";
  errorPass.value = false;

  if (!passForm.value.actual) erroresPass.value.actual = "Campo obligatorio";
  if (!passForm.value.nueva) erroresPass.value.nueva = "Campo obligatorio";
  if (!passForm.value.confirmacion)
    erroresPass.value.confirmacion = "Campo obligatorio";
  else if (passForm.value.nueva !== passForm.value.confirmacion)
    erroresPass.value.confirmacion = "Las contraseñas no coinciden";
  if (Object.keys(erroresPass.value).length > 0) return;

  loadingPass.value = true;
  try {
    await perfilService.cambiarPassword({
      passwordActual: passForm.value.actual,
      passwordNueva: passForm.value.nueva,
      passwordNuevaConfirmacion: passForm.value.confirmacion,
    });
    mensajePass.value = "Contraseña cambiada. Iniciando sesión nuevamente...";
    passForm.value = { actual: "", nueva: "", confirmacion: "" };
    setTimeout(() => {
      auth.logout();
      router.push({ name: "Login" });
    }, 2000);
  } catch (e) {
    console.error("Error al cambiar contraseña", e);
    mensajePass.value =
      e.response?.data?.message || "Error al cambiar contraseña";
    errorPass.value = true;
  } finally {
    loadingPass.value = false;
  }
}

// Cambiar email
const emailForm = ref({ nuevo: "" });
const erroresEmail = ref({});
const loadingEmail = ref(false);
const mensajeEmail = ref("");
const errorEmail = ref(false);

async function solicitarEmail() {
  erroresEmail.value = {};
  mensajeEmail.value = "";
  errorEmail.value = false;

  if (!emailForm.value.nuevo) {
    erroresEmail.value.nuevo = "Campo obligatorio";
    return;
  }

  loadingEmail.value = true;
  try {
    await perfilService.solicitarCambioEmail(emailForm.value.nuevo);
    mensajeEmail.value = `Te enviamos un link de verificación a ${emailForm.value.nuevo}`;
    emailForm.value.nuevo = "";
  } catch (e) {
    console.error("Error al solicitar cambio de email", e);
    mensajeEmail.value =
      e.response?.data?.message || "Error al solicitar cambio";
    errorEmail.value = true;
  } finally {
    loadingEmail.value = false;
  }
}
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <template v-if="loading">
      <Card>
        <template #content>
          <div class="flex flex-col items-center gap-3 py-4">
            <Skeleton shape="circle" size="4rem" />
            <Skeleton width="50%" height="1.2rem" />
            <Skeleton width="30%" height="0.9rem" />
          </div>
        </template>
      </Card>
    </template>

    <template v-else-if="me">
      <!-- Perfil usuario -->
      <Card>
        <template #content>
          <div class="flex flex-col items-center text-center gap-3 py-2">
            <Avatar
              :label="iniciales"
              size="xlarge"
              shape="circle"
              class="font-bold"
              style="background: var(--p-primary-400); color: #fff"
            />
            <div>
              <h2 class="text-xl font-bold m-0">{{ me.nombre }}</h2>
              <p class="text-sm text-surface-500 m-0">{{ me.email }}</p>
            </div>
            <Tag :value="auth.userRole" severity="info" />
          </div>
        </template>
      </Card>

      <!-- Mis datos -->
      <Card>
        <template #title>
          <div
            class="flex items-center justify-between cursor-pointer"
            @click="seccionActiva = seccionActiva === 'datos' ? null : 'datos'"
          >
            <div class="flex items-center gap-2">
              <i class="pi pi-user"></i>
              <span>Mis datos</span>
            </div>
            <i
              :class="seccionActiva === 'datos' ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
              class="text-surface-400"
            ></i>
          </div>
        </template>
        <template v-if="seccionActiva === 'datos'" #content>
          <div class="flex flex-col gap-3 pt-2">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">Nombre</label>
              <InputText v-model="datoForm.nombre" placeholder="Tu nombre completo" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">Teléfono</label>
              <InputText
                v-model="datoForm.telefono"
                placeholder="+56 9 XXXX XXXX"
              />
            </div>
            <Message v-if="mensajeDatos" :severity="errorDatos ? 'error' : 'success'" :closable="false">
              {{ mensajeDatos }}
            </Message>
            <Button
              label="Guardar cambios"
              icon="pi pi-save"
              :loading="loadingDatos"
              @click="guardarDatos"
            />
          </div>
        </template>
      </Card>

      <!-- Cambiar contraseña -->
      <Card>
        <template #title>
          <div
            class="flex items-center justify-between cursor-pointer"
            @click="seccionActiva = seccionActiva === 'password' ? null : 'password'"
          >
            <div class="flex items-center gap-2">
              <i class="pi pi-lock"></i>
              <span>Cambiar contraseña</span>
            </div>
            <i
              :class="seccionActiva === 'password' ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
              class="text-surface-400"
            ></i>
          </div>
        </template>
        <template v-if="seccionActiva === 'password'" #content>
          <div class="flex flex-col gap-3 pt-2">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">Contraseña actual</label>
              <Password
                v-model="passForm.actual"
                :feedback="false"
                toggleMask
                :class="{ 'p-invalid': erroresPass.actual }"
              />
              <small v-if="erroresPass.actual" class="text-red-500">{{ erroresPass.actual }}</small>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">Nueva contraseña</label>
              <Password
                v-model="passForm.nueva"
                toggleMask
                :class="{ 'p-invalid': erroresPass.nueva }"
              />
              <small v-if="erroresPass.nueva" class="text-red-500">{{ erroresPass.nueva }}</small>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">Confirmar contraseña</label>
              <Password
                v-model="passForm.confirmacion"
                :feedback="false"
                toggleMask
                :class="{ 'p-invalid': erroresPass.confirmacion }"
              />
              <small v-if="erroresPass.confirmacion" class="text-red-500">{{ erroresPass.confirmacion }}</small>
            </div>
            <Message v-if="mensajePass" :severity="errorPass ? 'error' : 'success'" :closable="false">
              {{ mensajePass }}
            </Message>
            <Button
              label="Cambiar contraseña"
              icon="pi pi-key"
              :loading="loadingPass"
              @click="cambiarPassword"
            />
          </div>
        </template>
      </Card>

      <!-- Cambiar email -->
      <Card>
        <template #title>
          <div
            class="flex items-center justify-between cursor-pointer"
            @click="seccionActiva = seccionActiva === 'email' ? null : 'email'"
          >
            <div class="flex items-center gap-2">
              <i class="pi pi-envelope"></i>
              <span>Cambiar email</span>
            </div>
            <i
              :class="seccionActiva === 'email' ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
              class="text-surface-400"
            ></i>
          </div>
        </template>
        <template v-if="seccionActiva === 'email'" #content>
          <div class="flex flex-col gap-3 pt-2">
            <p class="text-sm text-surface-500">
              Te enviaremos un link de verificación al nuevo email. El cambio se aplicará al confirmar.
            </p>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold">Nuevo email</label>
              <InputText
                v-model="emailForm.nuevo"
                type="email"
                placeholder="nuevo@email.com"
                :class="{ 'p-invalid': erroresEmail.nuevo }"
              />
              <small v-if="erroresEmail.nuevo" class="text-red-500">{{ erroresEmail.nuevo }}</small>
            </div>
            <Message v-if="mensajeEmail" :severity="errorEmail ? 'error' : 'success'" :closable="false">
              {{ mensajeEmail }}
            </Message>
            <Button
              label="Solicitar cambio"
              icon="pi pi-send"
              :loading="loadingEmail"
              @click="solicitarEmail"
            />
          </div>
        </template>
      </Card>

      <!-- Preferencias de notificación -->
      <Card>
        <template #title>
          <div
            class="flex items-center justify-between cursor-pointer"
            @click="seccionActiva = seccionActiva === 'notificaciones' ? null : 'notificaciones'"
          >
            <div class="flex items-center gap-2">
              <i class="pi pi-bell"></i>
              <span>Preferencias de notificación</span>
            </div>
            <i
              :class="seccionActiva === 'notificaciones' ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
              class="text-surface-400"
            ></i>
          </div>
        </template>
        <template v-if="seccionActiva === 'notificaciones'" #content>
          <div v-if="loadingPref" class="flex flex-col gap-2 py-2">
            <Skeleton v-for="i in 5" :key="i" width="100%" height="2.5rem" />
          </div>
          <div v-else class="flex flex-col gap-2 pt-2">
            <div v-for="pref in preferencias" :key="pref.tipo" class="flex items-center justify-between py-1">
              <span class="text-sm">{{ tipoLabels[pref.tipo] || pref.tipo }}</span>
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1 text-xs text-surface-500">
                  <span>App</span>
                  <InputSwitch v-model="pref.enApp" :disabled="guardandoPref[`${pref.tipo}-enApp`]" @change="togglePref(pref.tipo, 'enApp')" />
                </div>
                <div class="flex items-center gap-1 text-xs text-surface-500">
                  <span>Email</span>
                  <InputSwitch v-model="pref.email" :disabled="guardandoPref[`${pref.tipo}-email`]" @change="togglePref(pref.tipo, 'email')" />
                </div>
                <div class="flex items-center gap-1 text-xs text-surface-500">
                  <span>Push</span>
                  <InputSwitch v-model="pref.push" :disabled="guardandoPref[`${pref.tipo}-push`]" @change="togglePref(pref.tipo, 'push')" />
                </div>
              </div>
            </div>
            <p v-if="!preferencias.length" class="text-sm text-surface-400 text-center py-2">No hay preferencias disponibles</p>
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>
