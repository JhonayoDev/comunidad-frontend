<template>
  <div class="p-4 flex flex-col gap-4">
    <h2 class="text-lg font-bold">Gestiones</h2>

    <!-- Visita esperada -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-base-200"
          @click="seccionActiva = seccionActiva === 'visita' ? null : 'visita'"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">🚪</span>
            <div>
              <p class="font-medium">Visita esperada</p>
              <p class="text-xs text-base-content/40">
                Preautorizar ingreso de visita
              </p>
            </div>
          </div>
          <span class="text-base-content/40">{{
            seccionActiva === "visita" ? "∨" : "›"
          }}</span>
        </div>

        <div
          v-if="seccionActiva === 'visita'"
          class="px-4 pb-4 border-t border-base-200"
        >
          <div class="flex flex-col items-center py-6 gap-2">
            <span class="text-4xl">🚧</span>
            <p class="font-semibold">Próximamente</p>
            <p class="text-sm text-base-content/60 text-center">
              Podrás avisar al guardia que espera una visita con anticipación.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Reserva de áreas comunes -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-base-200"
          @click="
            seccionActiva = seccionActiva === 'reserva' ? null : 'reserva'
          "
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">📅</span>
            <div>
              <p class="font-medium">Reservar área común</p>
              <p class="text-xs text-base-content/40">
                Quincho, sala multiuso, cancha
              </p>
            </div>
          </div>
          <span class="text-base-content/40">{{
            seccionActiva === "reserva" ? "∨" : "›"
          }}</span>
        </div>

        <div
          v-if="seccionActiva === 'reserva'"
          class="px-4 pb-4 border-t border-base-200"
        >
          <div class="flex flex-col items-center py-6 gap-2">
            <span class="text-4xl">🚧</span>
            <p class="font-semibold">Próximamente</p>
            <p class="text-sm text-base-content/60 text-center">
              Podrás reservar espacios comunes del condominio.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Reclamos y casos -->
    <div class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div
          class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-base-200"
          @click="
            seccionActiva = seccionActiva === 'reclamo' ? null : 'reclamo'
          "
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">📝</span>
            <div>
              <p class="font-medium">Reclamos y casos</p>
              <p class="text-xs text-base-content/40">
                Reclamos, sugerencias y solicitudes
              </p>
            </div>
          </div>
          <span class="text-base-content/40">{{
            seccionActiva === "reclamo" ? "∨" : "›"
          }}</span>
        </div>

        <div
          v-if="seccionActiva === 'reclamo'"
          class="px-4 pb-4 border-t border-base-200"
        >
          <div class="flex flex-col gap-3 pt-3">
            <!-- Formulario placeholder -->
            <div class="form-control">
              <label class="label"
                ><span class="label-text font-semibold">Tipo</span></label
              >
              <select class="select select-bordered" v-model="reclamoForm.tipo">
                <option value="">Seleccione un tipo</option>
                <option value="RECLAMO">Reclamo</option>
                <option value="SUGERENCIA">Sugerencia</option>
                <option value="SOLICITUD">Solicitud</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label"
                ><span class="label-text font-semibold"
                  >Descripción</span
                ></label
              >
              <textarea
                v-model="reclamoForm.descripcion"
                class="textarea textarea-bordered"
                placeholder="Describa su reclamo, sugerencia o solicitud"
                rows="3"
              ></textarea>
            </div>

            <div class="alert alert-info py-2">
              <span class="text-xs"
                >⚠️ El envío estará disponible próximamente. Puede redactar su
                mensaje y enviarlo cuando esté listo.</span
              >
            </div>

            <button class="btn btn-primary btn-sm opacity-50" disabled>
              Enviar
            </button>

            <!-- Lista de casos anteriores -->
            <div class="divider text-xs">Casos anteriores</div>
            <div class="flex flex-col items-center py-4 gap-2">
              <span class="text-3xl">📭</span>
              <p class="text-sm text-base-content/60">
                No tienes casos anteriores
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const seccionActiva = ref(null);

const reclamoForm = ref({
  tipo: "",
  descripcion: "",
});
</script>
