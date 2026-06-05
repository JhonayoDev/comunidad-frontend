<template>
  <div class="p-4">
    <h2 class="text-lg font-bold mb-4">Control de Acceso</h2>

    <!-- Buscador de patente -->
    <div class="card bg-base-100 shadow mb-4">
      <div class="card-body p-4">
        <p class="text-sm text-base-content/60 mb-2">
          Ingrese la patente del vehículo
        </p>
        <div class="flex gap-2">
          <input
            v-model="patente"
            type="text"
            placeholder="Ej: AB1234A"
            class="input input-bordered flex-1 uppercase"
            maxlength="7"
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

    <!-- Resultado: RESIDENTE -->
    <div
      v-if="resultado && resultado.esResidente"
      class="card bg-success text-success-content shadow mb-4"
    >
      <div class="card-body p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">✅</span>
          <p class="font-bold text-lg">RESIDENTE — Puede ingresar</p>
        </div>
        <div class="divider my-1"></div>
        <p>
          <span class="opacity-75">Propietario:</span>
          <strong>{{ resultado.propietarioNombre }}</strong>
        </p>
        <p>
          <span class="opacity-75">Casa:</span>
          <strong>{{ resultado.numeroCasaResidencia }}</strong>
        </p>
        <p>
          <span class="opacity-75">Vehículo:</span> {{ resultado.marca }}
          {{ resultado.modelo }} — {{ resultado.color }}
        </p>
        <div v-if="resultado.estacionamientos?.length > 0">
          <p class="opacity-75 mt-1">Estacionamiento:</p>
          <p v-for="e in resultado.estacionamientos" :key="e.numero">
            <strong>Nº {{ e.numero }}</strong> — {{ e.tipo }}
          </p>
        </div>
      </div>
    </div>

    <!-- Resultado: REGISTRADO pero no residente -->
    <div
      v-else-if="resultado && !resultado.esResidente"
      class="card bg-warning text-warning-content shadow mb-4"
    >
      <div class="card-body p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">⚠️</span>
          <p class="font-bold text-lg">
            Vehículo registrado — NO residente activo
          </p>
        </div>
        <div class="divider my-1"></div>
        <p>
          <span class="opacity-75">Vehículo:</span> {{ resultado.marca }}
          {{ resultado.modelo }} — {{ resultado.color }}
        </p>
        <button
          class="btn btn-sm btn-neutral mt-3 w-full"
          @click="irARegistrarVisita"
        >
          Registrar como visita
        </button>
      </div>
    </div>

    <!-- Resultado: NO encontrado -->
    <div
      v-else-if="noEncontrado"
      class="card bg-error text-error-content shadow mb-4"
    >
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
import { visitasService } from "../../services/visitasService";

const router = useRouter();
const patente = ref("");
const resultado = ref(null);
const noEncontrado = ref(false);
const loading = ref(false);

async function consultar() {
  if (patente.value.length < 2) return;
  loading.value = true;
  resultado.value = null;
  noEncontrado.value = false;

  try {
    const response = await visitasService.consultaRapida(patente.value);
    resultado.value = response.data;
  } catch (e) {
    if (e.response?.status === 404) {
      noEncontrado.value = true;
    }
  } finally {
    loading.value = false;
  }
}

function irARegistrarVisita() {
  router.push({ name: "RegistrarVisita", query: { patente: patente.value } });
}
</script>
