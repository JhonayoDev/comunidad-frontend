<template>
  <div class="p-4 flex flex-col gap-4">
    <!-- Tarjeta de usuario -->
    <div class="card bg-primary text-primary-content shadow">
      <div class="card-body p-6 flex flex-col items-center text-center">
        <div class="avatar placeholder mb-3">
          <div class="bg-primary-content text-primary rounded-full w-16">
            <span class="text-2xl">{{ iniciales }}</span>
          </div>
        </div>
        <h2 class="text-xl font-bold">{{ auth.user?.nombre }}</h2>
        <p class="text-sm opacity-75">{{ auth.user?.email }}</p>
        <span class="badge badge-outline mt-2">{{ auth.userRole }}</span>
      </div>
    </div>

    <!-- Opciones de cuenta -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <h3
          class="px-4 pt-4 pb-2 text-sm font-semibold text-base-content/60 uppercase tracking-wide"
        >
          Cuenta
        </h3>

        <!-- Mis datos -->
        <div
          class="flex items-center justify-between px-4 py-3 hover:bg-base-200 cursor-pointer border-t border-base-200"
          @click="seccionActiva = seccionActiva === 'datos' ? null : 'datos'"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">👤</span>
            <span class="font-medium">Mis datos</span>
          </div>
          <span class="text-base-content/40">{{
            seccionActiva === "datos" ? "∨" : "›"
          }}</span>
        </div>

        <!-- Expandible: Mis datos -->
        <div
          v-if="seccionActiva === 'datos'"
          class="px-4 pb-4 border-t border-base-200 bg-base-50"
        >
          <div class="flex flex-col gap-3 pt-3">
            <div class="form-control">
              <label class="label"
                ><span class="label-text font-semibold">Nombre</span></label
              >
              <input
                v-model="datoForm.nombre"
                type="text"
                class="input input-bordered"
                placeholder="Tu nombre completo"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Teléfono</span>
                <span class="label-text-alt text-base-content/40"
                  >Próximamente</span
                >
              </label>
              <input
                type="text"
                class="input input-bordered opacity-50"
                placeholder="+56 9 XXXX XXXX"
                disabled
              />
            </div>
            <p
              v-if="mensajeDatos"
              class="text-sm"
              :class="errorDatos ? 'text-error' : 'text-success'"
            >
              {{ mensajeDatos }}
            </p>
            <button
              class="btn btn-primary btn-sm"
              :disabled="loadingDatos"
              @click="guardarDatos"
            >
              <span
                v-if="loadingDatos"
                class="loading loading-spinner loading-xs"
              ></span>
              <span v-else>Guardar cambios</span>
            </button>
          </div>
        </div>

        <!-- Cambiar contraseña -->
        <div
          class="flex items-center justify-between px-4 py-3 hover:bg-base-200 cursor-pointer border-t border-base-200"
          @click="
            seccionActiva = seccionActiva === 'password' ? null : 'password'
          "
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">🔒</span>
            <span class="font-medium">Cambiar contraseña</span>
          </div>
          <span class="text-base-content/40">{{
            seccionActiva === "password" ? "∨" : "›"
          }}</span>
        </div>

        <!-- Expandible: Cambiar contraseña -->
        <div
          v-if="seccionActiva === 'password'"
          class="px-4 pb-4 border-t border-base-200"
        >
          <div class="flex flex-col gap-3 pt-3">
            <div class="form-control">
              <label class="label"
                ><span class="label-text font-semibold"
                  >Contraseña actual</span
                ></label
              >
              <input
                v-model="passForm.actual"
                type="password"
                class="input input-bordered"
                :class="{ 'input-error': erroresPass.actual }"
              />
              <p v-if="erroresPass.actual" class="text-error text-xs mt-1">
                {{ erroresPass.actual }}
              </p>
            </div>
            <div class="form-control">
              <label class="label"
                ><span class="label-text font-semibold"
                  >Nueva contraseña</span
                ></label
              >
              <input
                v-model="passForm.nueva"
                type="password"
                class="input input-bordered"
                :class="{ 'input-error': erroresPass.nueva }"
              />
              <p v-if="erroresPass.nueva" class="text-error text-xs mt-1">
                {{ erroresPass.nueva }}
              </p>
            </div>
            <div class="form-control">
              <label class="label"
                ><span class="label-text font-semibold"
                  >Confirmar contraseña</span
                ></label
              >
              <input
                v-model="passForm.confirmacion"
                type="password"
                class="input input-bordered"
                :class="{ 'input-error': erroresPass.confirmacion }"
              />
              <p
                v-if="erroresPass.confirmacion"
                class="text-error text-xs mt-1"
              >
                {{ erroresPass.confirmacion }}
              </p>
            </div>
            <p
              v-if="mensajePass"
              class="text-sm"
              :class="errorPass ? 'text-error' : 'text-success'"
            >
              {{ mensajePass }}
            </p>
            <button
              class="btn btn-primary btn-sm"
              :disabled="loadingPass"
              @click="cambiarPassword"
            >
              <span
                v-if="loadingPass"
                class="loading loading-spinner loading-xs"
              ></span>
              <span v-else>Cambiar contraseña</span>
            </button>
          </div>
        </div>

        <!-- Cambiar email -->
        <div
          class="flex items-center justify-between px-4 py-3 hover:bg-base-200 cursor-pointer border-t border-base-200"
          @click="seccionActiva = seccionActiva === 'email' ? null : 'email'"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">📧</span>
            <span class="font-medium">Cambiar email</span>
          </div>
          <span class="text-base-content/40">{{
            seccionActiva === "email" ? "∨" : "›"
          }}</span>
        </div>

        <!-- Expandible: Cambiar email -->
        <div
          v-if="seccionActiva === 'email'"
          class="px-4 pb-4 border-t border-base-200"
        >
          <div class="flex flex-col gap-3 pt-3">
            <p class="text-sm text-base-content/60">
              Te enviaremos un link de verificación al nuevo email. El cambio se
              aplicará al confirmar.
            </p>
            <div class="form-control">
              <label class="label"
                ><span class="label-text font-semibold"
                  >Nuevo email</span
                ></label
              >
              <input
                v-model="emailForm.nuevo"
                type="email"
                class="input input-bordered"
                :class="{ 'input-error': erroresEmail.nuevo }"
                placeholder="nuevo@email.com"
              />
              <p v-if="erroresEmail.nuevo" class="text-error text-xs mt-1">
                {{ erroresEmail.nuevo }}
              </p>
            </div>
            <p
              v-if="mensajeEmail"
              class="text-sm"
              :class="errorEmail ? 'text-error' : 'text-success'"
            >
              {{ mensajeEmail }}
            </p>
            <button
              class="btn btn-primary btn-sm"
              :disabled="loadingEmail"
              @click="solicitarEmail"
            >
              <span
                v-if="loadingEmail"
                class="loading loading-spinner loading-xs"
              ></span>
              <span v-else>Solicitar cambio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authStore";
import { perfilService } from "../../services/perfilService";

const router = useRouter();
const auth = useAuthStore();

const seccionActiva = ref(null);

// Iniciales para el avatar
const iniciales = computed(() => {
  const nombre = auth.user?.nombre || auth.user?.email || "U";
  return nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
});

// ── Mis datos ──────────────────────────────────
const datoForm = ref({ nombre: auth.user?.nombre || "" });
const loadingDatos = ref(false);
const mensajeDatos = ref("");
const errorDatos = ref(false);

async function guardarDatos() {
  loadingDatos.value = true;
  mensajeDatos.value = "";
  try {
    // Placeholder — endpoint futuro PUT /me
    await new Promise((resolve) => setTimeout(resolve, 800));
    mensajeDatos.value = "Cambios guardados correctamente";
    errorDatos.value = false;
  } catch (e) {
    mensajeDatos.value = e.response?.data?.message || "Error al guardar";
    errorDatos.value = true;
  } finally {
    loadingDatos.value = false;
  }
}

// ── Cambiar contraseña ─────────────────────────
const passForm = ref({ actual: "", nueva: "", confirmacion: "" });
const erroresPass = ref({});
const loadingPass = ref(false);
const mensajePass = ref("");
const errorPass = ref(false);

async function cambiarPassword() {
  erroresPass.value = {};
  mensajePass.value = "";

  if (!passForm.value.actual) erroresPass.value.actual = "Campo obligatorio";
  if (!passForm.value.nueva) erroresPass.value.nueva = "Campo obligatorio";
  if (!passForm.value.confirmacion)
    erroresPass.value.confirmacion = "Campo obligatorio";
  if (passForm.value.nueva !== passForm.value.confirmacion) {
    erroresPass.value.confirmacion = "Las contraseñas no coinciden";
  }
  if (Object.keys(erroresPass.value).length > 0) return;

  loadingPass.value = true;
  try {
    await perfilService.cambiarPassword({
      passwordActual: passForm.value.actual,
      passwordNueva: passForm.value.nueva,
      passwordNuevaConfirmacion: passForm.value.confirmacion,
    });
    mensajePass.value = "Contraseña cambiada. Iniciando sesión nuevamente...";
    errorPass.value = false;
    setTimeout(() => {
      auth.logout();
      router.push({ name: "Login" });
    }, 2000);
  } catch (e) {
    mensajePass.value =
      e.response?.data?.message || "Error al cambiar contraseña";
    errorPass.value = true;
  } finally {
    loadingPass.value = false;
  }
}

// ── Cambiar email ──────────────────────────────
const emailForm = ref({ nuevo: "" });
const erroresEmail = ref({});
const loadingEmail = ref(false);
const mensajeEmail = ref("");
const errorEmail = ref(false);

async function solicitarEmail() {
  erroresEmail.value = {};
  mensajeEmail.value = "";

  if (!emailForm.value.nuevo) {
    erroresEmail.value.nuevo = "Campo obligatorio";
    return;
  }

  loadingEmail.value = true;
  try {
    await perfilService.solicitarCambioEmail(emailForm.value.nuevo);
    mensajeEmail.value = `Te enviamos un link de verificación a ${emailForm.value.nuevo}`;
    errorEmail.value = false;
    emailForm.value.nuevo = "";
  } catch (e) {
    mensajeEmail.value =
      e.response?.data?.message || "Error al solicitar cambio";
    errorEmail.value = true;
  } finally {
    loadingEmail.value = false;
  }
}
</script>
