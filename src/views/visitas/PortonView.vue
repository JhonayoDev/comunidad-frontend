<template>
  <div class="p-4">
    <h2 class="text-lg font-bold mb-4">Control de Acceso</h2>

    <div class="card bg-base-100 shadow mb-4">
      <div class="card-body p-4">
        <p class="text-sm text-base-content/60 mb-2">
          Ingrese la patente del vehículo
        </p>
        <div class="flex gap-2">
          <input
            v-model="patente"
            type="text"
            placeholder="Ej: AB1234"
            class="input input-bordered flex-1 uppercase"
            maxlength="10"
            @keyup.enter="consultar"
            @input="patente = patente.toUpperCase()"
          />
          <button
            class="btn btn-primary"
            :disabled="patente.length < 2 || loading"
            @click="consultar"
          >
            <span
              v-if="loading"
              class="loading loading-spinner loading-sm"
            ></span>
            <span v-else>Buscar</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="errorMsg" class="alert alert-error mb-4 py-2">
      <span class="text-sm">{{ errorMsg }}</span>
    </div>

    <div v-if="resultado" class="card bg-base-100 shadow mb-4">
      <div class="card-body p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">🚗</span>
          <p class="font-bold text-lg">Vehículo encontrado</p>
        </div>
        <div class="divider my-1"></div>
        <p><span class="opacity-75">Patente:</span> <strong>{{ resultado.patente }}</strong></p>
        <p><span class="opacity-75">Marca/Modelo:</span> {{ resultado.marca }} {{ resultado.modelo }} — {{ resultado.color }}</p>
        <p v-if="resultado.estacionamientoNumero">
          <span class="opacity-75">Estacionamiento:</span> Nº {{ resultado.estacionamientoNumero }}
        </p>
        <button
          class="btn btn-sm btn-neutral mt-3 w-full"
          @click="irARegistrarVisita"
        >
          Registrar como visita
        </button>
      </div>
    </div>

    <div v-else-if="noEncontrado" class="card bg-error text-error-content shadow mb-4">
      <div class="card-body p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">❌</span>
          <p class="font-bold text-lg">Patente no registrada</p>
        </div>
        <button
          class="btn btn-sm btn-neutral mt-3 w-full"
          @click="irARegistrarVisita"
        >
          Registrar como visita
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/authStore";
import api from "../../services/api";

const router = useRouter();
const auth = useAuthStore();
const patente = ref("");
const resultado = ref(null);
const noEncontrado = ref(false);
const loading = ref(false);
const errorMsg = ref("");

async function consultar() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  if (patente.value.length < 2) return;
  loading.value = true;
  resultado.value = null;
  noEncontrado.value = false;
  errorMsg.value = "";

  try {
    const res = await api.get(`/condominios/${cid}/vehiculos`);
    const vehiculos = res.data || [];
    const encontrado = vehiculos.find(
      (v) => v.patente?.toUpperCase() === patente.value,
    );
    if (encontrado) {
      resultado.value = encontrado;
    } else {
      noEncontrado.value = true;
    }
  } catch (e) {
    console.error("Error al buscar vehículo:", e);
    errorMsg.value = "Error al consultar. Intente nuevamente.";
  } finally {
    loading.value = false;
  }
}

function irARegistrarVisita() {
  router.push({ name: "RegistrarVisita", query: { patente: patente.value } });
}
</script>
