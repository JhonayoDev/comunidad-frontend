<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useUnidadesConsulta } from "@/composables/useUnidadesConsulta";
import { mensajeError } from "@/utils/errores";
import {
  admiteVehiculos,
  contarRecursos,
  filtrarUnidades,
  labelTipoUnidad,
  opcionesPiso,
  opcionesSector,
  opcionesTipoUnidad,
  paginarUnidades,
  personaPrincipal,
  recursosDeUnidad,
} from "@/utils/unidadesConsulta";

import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Chip from "primevue/chip";
import Paginator from "primevue/paginator";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

import ResumenCondominio from "@/components/unidades/ResumenCondominio.vue";
import PanelUnidadCondominio from "@/components/unidades/PanelUnidadCondominio.vue";
import UnidadDetalle from "@/components/unidades/UnidadDetalle.vue";
import DialogoEditarPersona from "@/components/unidades/DialogoEditarPersona.vue";
import DialogoQuitarPersona from "@/components/unidades/DialogoQuitarPersona.vue";
import DialogoAgregarVehiculo from "@/components/unidades/DialogoAgregarVehiculo.vue";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const confirm = useConfirm();

const {
  cargando,
  errorCarga,
  advertencias,
  resumen,
  unidadCondominio,
  recursosCondominio,
  indice,
  viviendas,
  cargandoVinculos,
  errorVinculos,
  puedeVerVinculos,
  puedeEditarPersona,
  puedeDesvincular,
  puedeQuitarPersona,
  puedeCrearVehiculo,
  puedeEditarVehiculo,
  puedeEliminarVehiculo,
  cargar,
  cargarVinculos,
  vinculosDe,
  obtenerPersona,
  actualizarPersona,
  desvincularPersonaDeUnidad,
  quitarPersonaDelCondominio,
  desvincularVehiculo,
  moverVehiculo,
  crearVehiculo,
  vehiculosFueraDe,
} = useUnidadesConsulta();

const TAMANO_PAGINA = 25;

const busqueda = ref("");
const tipoFiltro = ref(null);
const sectorFiltro = ref(null);
const pisoFiltro = ref(null);
const pagina = ref(1);
const mostrarFiltros = ref(false);
const inicializadoUrl = ref(false);
const unidadExpandidaId = ref(null);

const exito = ref(null);
const errorAccion = ref(null);

const showEditar = ref(false);
const personaEditando = ref(null);
const guardandoPersona = ref(false);
const errorEditar = ref(null);

const showQuitar = ref(false);
const vinculoAQuitar = ref(null);
const guardandoQuitar = ref(false);
const errorQuitar = ref(null);

const showVehiculo = ref(false);
const guardandoVehiculo = ref(false);
const errorVehiculo = ref(null);

// ─── Derivados ───────────────────────────────────────────────
const puedeConfigurar = computed(
  () =>
    auth.permisos.includes("UNIDAD_CREAR") ||
    auth.permisos.includes("UNIDAD_EDITAR"),
);
const puedeVerPersonas = computed(
  () => auth.permisos.includes("PERSONA_VER") || puedeVerVinculos.value,
);
const puedeVincularPersona = computed(() =>
  auth.permisos.includes("VINCULO_CREAR"),
);

const unidadesFiltradas = computed(() =>
  filtrarUnidades(viviendas.value, {
    q: busqueda.value,
    tipo: tipoFiltro.value,
    sector: sectorFiltro.value,
    piso: pisoFiltro.value,
  }),
);

const paginacion = computed(() =>
  paginarUnidades(unidadesFiltradas.value, pagina.value, TAMANO_PAGINA),
);

const unidadesPagina = computed(() => paginacion.value.items);
const primerRegistro = computed(() => paginacion.value.first);

const opcionesTipos = computed(() => opcionesTipoUnidad(viviendas.value));
const opcionesSectores = computed(() => opcionesSector(viviendas.value));
const opcionesPisos = computed(() => opcionesPiso(viviendas.value));

const unidadExpandida = computed(
  () =>
    viviendas.value.find((u) => u.id === unidadExpandidaId.value) || null,
);

const puedeAgregarVehiculo = computed(() => {
  if (!unidadExpandida.value || !admiteVehiculos(unidadExpandida.value)) {
    return false;
  }
  return puedeCrearVehiculo.value || puedeEditarVehiculo.value;
});

const vehiculosMovibles = computed(() =>
  unidadExpandida.value ? vehiculosFueraDe(unidadExpandida.value.id) : [],
);

const filtrosActivos = computed(
  () =>
    [tipoFiltro.value, sectorFiltro.value].filter(Boolean).length +
    (pisoFiltro.value !== null && pisoFiltro.value !== "" ? 1 : 0),
);

const chipsFiltros = computed(() => {
  const chips = [];
  if (tipoFiltro.value) {
    chips.push({
      key: "tipo",
      label: labelTipoUnidad(tipoFiltro.value),
      quitar: () => {
        tipoFiltro.value = null;
        reiniciarPagina();
      },
    });
  }
  if (sectorFiltro.value) {
    chips.push({
      key: "sector",
      label: `Sector ${sectorFiltro.value}`,
      quitar: () => {
        sectorFiltro.value = null;
        reiniciarPagina();
      },
    });
  }
  if (pisoFiltro.value !== null && pisoFiltro.value !== "") {
    chips.push({
      key: "piso",
      label: `Piso ${pisoFiltro.value}`,
      quitar: () => {
        pisoFiltro.value = null;
        reiniciarPagina();
      },
    });
  }
  return chips;
});

// ─── Helpers de fila ─────────────────────────────────────────
function recursosDe(u) {
  return recursosDeUnidad(indice.value, u.id);
}

function conteoDe(u) {
  return contarRecursos(indice.value, u.id);
}

function personasDe(u) {
  return vinculosDe(u.id);
}

function principalDe(u) {
  return personaPrincipal(personasDe(u));
}

function resumenPersonas(u) {
  const personas = personasDe(u);
  if (!personas.length) return "";
  const principal = principalDe(u);
  return principal ? `${personas.length} · ${principal.personaNombre}` : `${personas.length}`;
}

function cargandoPersonas(u) {
  return !!cargandoVinculos[u.id];
}

// ─── Expansión ───────────────────────────────────────────────
async function alternarUnidad(u) {
  if (unidadExpandidaId.value === u.id) {
    unidadExpandidaId.value = null;
    return;
  }
  unidadExpandidaId.value = u.id;
  await cargarVinculos(u.id);
}

function irAVincularPersona() {
  router.push({ name: "Personas" });
}

// ─── Estado en la URL (patrón Personas) ──────────────────────
function leerUrl() {
  const q = route.query.q;
  if (typeof q === "string") busqueda.value = q;

  const tipo = route.query.tipo;
  if (typeof tipo === "string" && opcionesTipos.value.some((o) => o.value === tipo)) {
    tipoFiltro.value = tipo;
  }

  const sector = route.query.sector;
  if (
    typeof sector === "string" &&
    opcionesSectores.value.some((o) => o.value === sector)
  ) {
    sectorFiltro.value = sector;
  }

  const piso = Number.parseInt(route.query.piso, 10);
  if (
    Number.isFinite(piso) &&
    opcionesPisos.value.some((o) => o.value === piso)
  ) {
    pisoFiltro.value = piso;
  }

  const page = Number.parseInt(route.query.page, 10);
  if (Number.isFinite(page) && page > 0) pagina.value = page;

  if (tipoFiltro.value || sectorFiltro.value || pisoFiltro.value !== null) {
    mostrarFiltros.value = true;
  }
}

let temporizadorUrl = null;
function escribirUrl() {
  if (!inicializadoUrl.value) return;
  if (temporizadorUrl) clearTimeout(temporizadorUrl);
  temporizadorUrl = setTimeout(() => {
    const query = { ...route.query };
    delete query.q;
    delete query.tipo;
    delete query.sector;
    delete query.piso;
    delete query.page;

    if (busqueda.value.trim()) query.q = busqueda.value.trim();
    if (tipoFiltro.value) query.tipo = tipoFiltro.value;
    if (sectorFiltro.value) query.sector = sectorFiltro.value;
    if (pisoFiltro.value !== null && pisoFiltro.value !== "") {
      query.piso = String(pisoFiltro.value);
    }
    if (pagina.value > 1) query.page = String(pagina.value);

    router.replace({ query }).catch((e) => {
      console.error("Error al sincronizar la búsqueda en la URL", e);
    });
  }, 250);
}

watch([busqueda, tipoFiltro, sectorFiltro, pisoFiltro], escribirUrl);

watch(pagina, escribirUrl);

function reiniciarPagina() {
  pagina.value = 1;
}

function limpiarBusqueda() {
  busqueda.value = "";
  pagina.value = 1;
}

function limpiarFiltros() {
  tipoFiltro.value = null;
  sectorFiltro.value = null;
  pisoFiltro.value = null;
  pagina.value = 1;
}

function cambiarPagina(event) {
  pagina.value = event.page + 1;
}

// ─── Acciones: personas ─────────────────────────────────────
async function abrirEditarPersona(vinculo) {
  errorAccion.value = null;
  try {
    const detalle = await obtenerPersona(vinculo.personaId);
    personaEditando.value = detalle;
    errorEditar.value = null;
    showEditar.value = true;
  } catch (e) {
    console.error("Error al cargar la persona", e);
    errorAccion.value = mensajeError(
      e,
      "No se pudieron cargar los datos de la persona",
    );
  }
}

async function guardarPersona(form) {
  if (!personaEditando.value) return;
  guardandoPersona.value = true;
  errorEditar.value = null;
  try {
    await actualizarPersona(personaEditando.value.id, form);
    showEditar.value = false;
    exito.value = `Datos de ${form.nombre} actualizados.`;
  } catch (e) {
    console.error("Error al actualizar la persona", e);
    errorEditar.value = mensajeError(e, "No se pudo guardar la persona");
  } finally {
    guardandoPersona.value = false;
  }
}

function abrirQuitarPersona(vinculo) {
  vinculoAQuitar.value = vinculo;
  errorQuitar.value = null;
  showQuitar.value = true;
}

async function confirmarQuitarPersona({ alcance, motivo }) {
  const vinculo = vinculoAQuitar.value;
  if (!vinculo) return;
  guardandoQuitar.value = true;
  errorQuitar.value = null;
  try {
    if (alcance === "CONDOMINIO") {
      await quitarPersonaDelCondominio(vinculo.personaId, motivo);
      exito.value = `${vinculo.personaNombre} fue quitada del condominio. Su cuenta sigue activa en otros condominios.`;
    } else {
      await desvincularPersonaDeUnidad(vinculo);
      exito.value = `${vinculo.personaNombre} ya no está vinculada a la unidad ${vinculo.unidadNumero}.`;
    }
    showQuitar.value = false;
    vinculoAQuitar.value = null;
  } catch (e) {
    console.error("Error al quitar la persona", e);
    errorQuitar.value = mensajeError(e, "No se pudo quitar la persona");
  } finally {
    guardandoQuitar.value = false;
  }
}

// ─── Acciones: vehículos ────────────────────────────────────
function abrirAgregarVehiculo() {
  if (!unidadExpandida.value) return;
  errorVehiculo.value = null;
  showVehiculo.value = true;
}

async function moverVehiculoAUnidad(vehiculo) {
  const unidad = unidadExpandida.value;
  if (!unidad) return;
  guardandoVehiculo.value = true;
  errorVehiculo.value = null;
  try {
    await moverVehiculo(vehiculo, unidad.id);
    showVehiculo.value = false;
    exito.value = `${vehiculo.patente} ahora está en la unidad ${unidad.numero}.`;
  } catch (e) {
    console.error("Error al mover el vehículo", e);
    errorVehiculo.value = mensajeError(e, "No se pudo mover el vehículo");
  } finally {
    guardandoVehiculo.value = false;
  }
}

async function crearVehiculoEnUnidad(payload) {
  const unidad = unidadExpandida.value;
  if (!unidad) return;
  guardandoVehiculo.value = true;
  errorVehiculo.value = null;
  try {
    await crearVehiculo({ ...payload, unidadId: unidad.id });
    showVehiculo.value = false;
    exito.value = `${payload.patente} fue agregado a la unidad ${unidad.numero}.`;
  } catch (e) {
    console.error("Error al crear el vehículo", e);
    errorVehiculo.value = mensajeError(e, "No se pudo agregar el vehículo");
  } finally {
    guardandoVehiculo.value = false;
  }
}

function confirmarQuitarVehiculo(vehiculo) {
  confirm.require({
    message: `¿Quitar el vehículo ${vehiculo.patente} de esta casa? El historial se conserva.`,
    header: "Quitar vehículo",
    acceptLabel: "Quitar",
    rejectLabel: "Cancelar",
    accept: () => quitarVehiculo(vehiculo),
  });
}

async function quitarVehiculo(vehiculo) {
  errorAccion.value = null;
  try {
    await desvincularVehiculo(vehiculo);
    exito.value = `${vehiculo.patente} ya no está vinculado a esta casa.`;
  } catch (e) {
    console.error("Error al quitar el vehículo", e);
    errorAccion.value = mensajeError(e, "No se pudo quitar el vehículo");
  }
}

// ─── Navegación ──────────────────────────────────────────────
function irAConfigurar() {
  router.push({ name: "SetupUnidades" });
}

function irAPersonas() {
  router.push({ name: "Personas" });
}

onMounted(async () => {
  await cargar();
  leerUrl();
  inicializadoUrl.value = true;
  if (pagina.value > paginacion.value.paginas) pagina.value = 1;
});

onUnmounted(() => {
  if (temporizadorUrl) clearTimeout(temporizadorUrl);
});
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <header
      class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
    >
      <div class="min-w-0">
        <h1 class="text-xl font-bold m-0">Unidades</h1>
        <p class="text-sm text-text-muted m-0">
          Consulta las casas, quiénes viven en ellas y sus vehículos.
        </p>
      </div>
      <div
        v-if="puedeVerPersonas || puedeConfigurar"
        class="flex flex-col sm:flex-row gap-2 sm:shrink-0"
        role="group"
        aria-label="Acciones de la vista Unidades"
      >
        <Button
          v-if="puedeVerPersonas"
          label="Personas"
          icon="pi pi-users"
          severity="secondary"
          class="w-full sm:w-auto"
          @click="irAPersonas"
        />
        <Button
          v-if="puedeConfigurar"
          label="Configurar unidades"
          icon="pi pi-cog"
          class="w-full sm:w-auto"
          @click="irAConfigurar"
        />
      </div>
    </header>

    <Message
      v-if="exito"
      severity="success"
      :closable="true"
      @close="exito = null"
    >
      {{ exito }}
    </Message>
    <Message
      v-if="errorAccion"
      severity="error"
      :closable="true"
      @close="errorAccion = null"
    >
      {{ errorAccion }}
    </Message>
    <Message
      v-for="(aviso, i) in advertencias"
      :key="`aviso-${i}`"
      severity="warn"
      :closable="false"
    >
      {{ aviso }} Las demás secciones siguen disponibles.
    </Message>

    <Skeleton v-if="cargando" width="100%" height="12rem" />
    <Message v-else-if="errorCarga" severity="error" :closable="false">
      {{ errorCarga }}
      <Button
        label="Reintentar"
        size="small"
        severity="secondary"
        class="ml-2"
        @click="cargar"
      />
    </Message>

    <template v-else>
      <ResumenCondominio :resumen="resumen" />

      <PanelUnidadCondominio
        v-if="unidadCondominio"
        :unidad="unidadCondominio"
        :recursos="recursosCondominio"
      />

      <!-- ─── Búsqueda y filtros ─── -->
      <Card>
        <template #content>
          <div class="flex flex-col gap-3" role="search">
            <div class="flex items-start gap-2">
              <div class="relative flex-1 min-w-0">
                <IconField class="w-full">
                  <InputIcon class="pi pi-search" />
                  <InputText
                    id="buscar-unidades"
                    v-model="busqueda"
                    placeholder="Buscar por número de casa, sector o piso…"
                    aria-label="Buscar unidades del condominio"
                    autocomplete="off"
                    class="w-full pr-10"
                    @input="reiniciarPagina"
                    @keydown.esc="limpiarBusqueda"
                  />
                </IconField>
                <Button
                  v-if="busqueda"
                  icon="pi pi-times"
                  severity="secondary"
                  variant="text"
                  size="small"
                  rounded
                  class="absolute right-1 top-1/2 -translate-y-1/2"
                  aria-label="Limpiar búsqueda"
                  @click="limpiarBusqueda"
                />
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2">
              <Button
                :label="filtrosActivos ? `Filtros (${filtrosActivos})` : 'Filtros'"
                :icon="mostrarFiltros ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                iconPos="right"
                severity="secondary"
                variant="text"
                :aria-expanded="mostrarFiltros"
                aria-controls="panel-filtros-unidades"
                @click="mostrarFiltros = !mostrarFiltros"
              />
              <span class="text-xs text-text-muted" aria-live="polite">
                <template v-if="busqueda || filtrosActivos">
                  {{ unidadesFiltradas.length }} de {{ viviendas.length }}
                  unidades
                </template>
                <template v-else>
                  {{ viviendas.length }}
                  {{ viviendas.length === 1 ? "unidad" : "unidades" }}
                </template>
              </span>
            </div>

            <div
              v-if="mostrarFiltros"
              id="panel-filtros-unidades"
              class="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-border bg-inset p-3"
            >
              <div class="flex flex-col gap-1">
                <label for="filtro-tipo-unidad" class="text-xs font-semibold text-text-muted">
                  Tipo
                </label>
                <Select
                  id="filtro-tipo-unidad"
                  v-model="tipoFiltro"
                  :options="opcionesTipos"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Todos"
                  showClear
                  class="w-full"
                  @change="reiniciarPagina"
                />
              </div>
              <div class="flex flex-col gap-1">
                <label for="filtro-sector-unidad" class="text-xs font-semibold text-text-muted">
                  Sector
                </label>
                <Select
                  id="filtro-sector-unidad"
                  v-model="sectorFiltro"
                  :options="opcionesSectores"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Todos"
                  showClear
                  class="w-full"
                  @change="reiniciarPagina"
                />
              </div>
              <div class="flex flex-col gap-1">
                <label for="filtro-piso-unidad" class="text-xs font-semibold text-text-muted">
                  Piso
                </label>
                <Select
                  id="filtro-piso-unidad"
                  v-model="pisoFiltro"
                  :options="opcionesPisos"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Todos"
                  showClear
                  class="w-full"
                  @change="reiniciarPagina"
                />
              </div>
            </div>

            <div v-if="chipsFiltros.length" class="flex flex-wrap items-center gap-1">
              <Chip
                v-for="chip in chipsFiltros"
                :key="chip.key"
                :label="chip.label"
                removable
                @remove="chip.quitar()"
              />
              <Button
                label="Limpiar filtros"
                variant="text"
                severity="secondary"
                size="small"
                @click="limpiarFiltros"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- ─── Estados vacíos ─── -->
      <div
        v-if="!viviendas.length"
        class="text-center text-text-subprincipal py-10 flex flex-col items-center gap-2"
      >
        <i class="pi pi-home text-3xl" aria-hidden="true" />
        <span>Este condominio todavía no tiene unidades registradas.</span>
        <Button
          v-if="puedeConfigurar"
          label="Crear unidades"
          icon="pi pi-plus"
          size="small"
          @click="irAConfigurar"
        />
      </div>

      <div
        v-else-if="!unidadesPagina.length"
        class="text-center text-text-subprincipal py-10 flex flex-col items-center gap-2"
      >
        <i class="pi pi-search text-3xl" aria-hidden="true" />
        <span>Ninguna unidad coincide con la búsqueda o los filtros.</span>
        <div class="flex gap-2">
          <Button
            v-if="busqueda"
            label="Limpiar búsqueda"
            severity="secondary"
            variant="outlined"
            size="small"
            @click="limpiarBusqueda"
          />
          <Button
            v-if="filtrosActivos"
            label="Limpiar filtros"
            severity="secondary"
            variant="outlined"
            size="small"
            @click="limpiarFiltros"
          />
        </div>
      </div>

      <template v-else>
        <!-- ─── Tabla desktop ─── -->
        <div class="planilla hidden md:block">
          <table>
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Tipo</th>
                <th>Sector</th>
                <th>Piso</th>
                <th>Personas</th>
                <th>Vehículos</th>
                <th>Est. y bodegas</th>
                <th class="text-right">Detalle</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="u in unidadesPagina" :key="u.id">
                <tr>
                  <td>
                    <span class="font-semibold">{{ u.numero }}</span>
                  </td>
                  <td>{{ labelTipoUnidad(u.tipo) }}</td>
                  <td>{{ u.sectorNombre || "—" }}</td>
                  <td>{{ u.piso ?? "—" }}</td>
                  <td>
                    <span v-if="cargandoPersonas(u)" class="text-xs text-text-muted">
                      Cargando…
                    </span>
                    <div v-else-if="personasDe(u).length" class="flex flex-col min-w-0">
                      <span>
                        {{ personasDe(u).length }}
                        {{ personasDe(u).length === 1 ? "persona" : "personas" }}
                      </span>
                      <span class="text-xs text-text-muted truncate" :title="principalDe(u)?.personaNombre">
                        {{ principalDe(u)?.personaNombre }}
                      </span>
                    </div>
                    <span v-else class="text-xs text-text-muted">
                      {{ puedeVerVinculos ? "Ver personas" : "—" }}
                    </span>
                  </td>
                  <td>{{ conteoDe(u).vehiculos }}</td>
                  <td>
                    <span class="text-xs text-text-muted">
                      {{ conteoDe(u).estacionamientos }} est ·
                      {{ conteoDe(u).bodegas }} bod
                    </span>
                  </td>
                  <td class="text-right">
                    <Button
                      :icon="unidadExpandidaId === u.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                      severity="secondary"
                      variant="text"
                      size="small"
                      rounded
                      :aria-expanded="unidadExpandidaId === u.id"
                      :aria-label="`${unidadExpandidaId === u.id ? 'Ocultar' : 'Ver'} el detalle de la unidad ${u.numero}`"
                      :title="unidadExpandidaId === u.id ? 'Ocultar detalle' : 'Ver detalle'"
                      @click="alternarUnidad(u)"
                    />
                  </td>
                </tr>
                <tr v-if="unidadExpandidaId === u.id">
                  <td colspan="8" class="!p-0">
                    <div class="p-3 bg-surface">
                      <UnidadDetalle
                        :unidad="u"
                        :vinculos="personasDe(u)"
                        :recursos="recursosDe(u)"
                        :cargando="cargandoPersonas(u)"
                        :error="errorVinculos[u.id] || ''"
                        :puede-ver-vinculos="puedeVerVinculos"
                        :puede-editar-persona="puedeEditarPersona"
                        :puede-desvincular="puedeDesvincular"
                        :puede-quitar-persona="puedeQuitarPersona"
                        :puede-vincular-persona="puedeVincularPersona"
                        :puede-eliminar-vehiculo="puedeEliminarVehiculo"
                        :puede-agregar-vehiculo="puedeAgregarVehiculo"
                        @editar-persona="abrirEditarPersona"
                        @quitar-persona="abrirQuitarPersona"
                        @vincular-persona="irAVincularPersona"
                        @agregar-vehiculo="abrirAgregarVehiculo"
                        @quitar-vehiculo="confirmarQuitarVehiculo"
                      />
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- ─── Cards mobile ─── -->
        <div class="md:hidden flex flex-col gap-2">
          <div
            v-for="u in unidadesPagina"
            :key="u.id"
            class="bg-surface border border-border rounded-lg"
          >
            <div class="p-3 flex flex-col gap-2">
              <div class="flex items-start justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2 min-w-0">
                  <span class="text-base font-bold">{{ u.numero }}</span>
                  <Tag :value="labelTipoUnidad(u.tipo)" severity="info" size="small" />
                  <Tag
                    v-if="u.sectorNombre"
                    :value="u.sectorNombre"
                    severity="secondary"
                    size="small"
                  />
                </div>
                <Button
                  :icon="unidadExpandidaId === u.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                  severity="secondary"
                  variant="text"
                  size="small"
                  rounded
                  :aria-expanded="unidadExpandidaId === u.id"
                  :aria-label="`${unidadExpandidaId === u.id ? 'Ocultar' : 'Ver'} el detalle de la unidad ${u.numero}`"
                  @click="alternarUnidad(u)"
                />
              </div>

              <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <span class="text-text-muted">Piso</span>
                <span>{{ u.piso ?? "—" }}</span>
                <span class="text-text-muted">Personas</span>
                <span class="truncate">
                  {{ cargandoPersonas(u) ? "Cargando…" : resumenPersonas(u) || (puedeVerVinculos ? "Ver personas" : "—") }}
                </span>
                <span class="text-text-muted">Vehículos</span>
                <span>{{ conteoDe(u).vehiculos }}</span>
                <span class="text-text-muted">Est. y bodegas</span>
                <span>{{ conteoDe(u).estacionamientos }} est · {{ conteoDe(u).bodegas }} bod</span>
              </div>
            </div>

            <div v-if="unidadExpandidaId === u.id" class="p-3 border-t border-border-soft">
              <UnidadDetalle
                :unidad="u"
                :vinculos="personasDe(u)"
                :recursos="recursosDe(u)"
                :cargando="cargandoPersonas(u)"
                :error="errorVinculos[u.id] || ''"
                :puede-ver-vinculos="puedeVerVinculos"
                :puede-editar-persona="puedeEditarPersona"
                :puede-desvincular="puedeDesvincular"
                :puede-quitar-persona="puedeQuitarPersona"
                :puede-vincular-persona="puedeVincularPersona"
                :puede-eliminar-vehiculo="puedeEliminarVehiculo"
                :puede-agregar-vehiculo="puedeAgregarVehiculo"
                @editar-persona="abrirEditarPersona"
                @quitar-persona="abrirQuitarPersona"
                @vincular-persona="irAVincularPersona"
                @agregar-vehiculo="abrirAgregarVehiculo"
                @quitar-vehiculo="confirmarQuitarVehiculo"
              />
            </div>
          </div>
        </div>

        <Paginator
          :rows="TAMANO_PAGINA"
          :totalRecords="unidadesFiltradas.length"
          :first="primerRegistro"
          @page="cambiarPagina"
        />
      </template>
    </template>

    <!-- ─── Diálogos ─── -->
    <DialogoEditarPersona
      v-model:visible="showEditar"
      :persona="personaEditando"
      :guardando="guardandoPersona"
      :error="errorEditar || ''"
      @guardar="guardarPersona"
    />

    <DialogoQuitarPersona
      v-model:visible="showQuitar"
      :vinculo="vinculoAQuitar"
      :puede-quitar-unidad="puedeDesvincular"
      :puede-quitar-condominio="puedeQuitarPersona"
      :guardando="guardandoQuitar"
      :error="errorQuitar || ''"
      @confirmar="confirmarQuitarPersona"
    />

    <DialogoAgregarVehiculo
      v-model:visible="showVehiculo"
      :unidad="unidadExpandida"
      :vehiculos-existentes="vehiculosMovibles"
      :puede-crear="puedeCrearVehiculo"
      :guardando="guardandoVehiculo"
      :error="errorVehiculo || ''"
      @mover="moverVehiculoAUnidad"
      @crear="crearVehiculoEnUnidad"
    />

    <ConfirmDialog :draggable="false" />
  </div>
</template>
