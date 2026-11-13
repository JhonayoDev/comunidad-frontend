<script setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { personasService } from "@/services/personasService";
import { unidadesService } from "@/services/unidadesService";
import { useValidacionChile } from "@/composables/useValidacionChile";
import { useBusquedaPersona } from "@/composables/useBusquedaPersona";
import { emailValido, rutValido } from "@/utils/validadoresChile";
import { mensajeError } from "@/utils/errores";
import { estadoCorreccionRut } from "@/utils/correccionRut";
import { labelCargo as cargoLabel } from "@/data/cargos";
import {
  ESTADOS_MEMBRESIA,
  TIPOS_PARTICIPACION,
  TIPOS_ASOCIACION,
  CARGOS_ASOCIABLES,
  TIPOS_VINCULO_UNIDAD,
  labelTipoParticipacion,
  severityTipoParticipacion,
  labelEstadoMembresia,
  severityEstadoMembresia,
  labelTipoAlta,
} from "@/data/membresia";
import {
  ASOCIACION_UNIDAD,
  ASOCIACION_CARGO,
  ASOCIACION_PROVEEDOR,
  construirAsociacion,
  validarAsociacion,
  construirPayloadAlta,
  datosConflicto,
  mensajeAlta,
} from "@/utils/altaPersona";
import {
  esPreActivacionPersona,
  estadoUsuarioPersona,
  mensajeCambioEmail,
  validarMotivoCambioEmail,
} from "@/utils/personaEmail";

import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Select from "primevue/select";
import Checkbox from "primevue/checkbox";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Message from "primevue/message";
import Divider from "primevue/divider";
import Paginator from "primevue/paginator";
import { useConfirm } from "primevue/useconfirm";
import ConfirmDialog from "primevue/confirmdialog";

const auth = useAuthStore();
const route = useRoute();
const confirm = useConfirm();

const TAMANO_PAGINA = 25;

const loading = ref(true);
const errorCarga = ref(null);
const errorAccion = ref(null);
const exito = ref(null);
const personas = ref([]);
const unidades = ref([]);
const busqueda = ref("");
const pagina = ref(0);
const estadoFiltro = ref("TODOS");
const tipoFiltro = ref(null);

const showCrearPersona = ref(false);
const showEditarPersona = ref(false);
const showCambiarEmail = ref(false);
const showVinculos = ref(false);
const showCrearVinculo = ref(false);
const showCrearUsuario = ref(false);
const showHabilitarRut = ref(false);
const showBuscarPersona = ref(false);
const showAsociarPersona = ref(false);
const showDesactivar = ref(false);
const busquedaModo = ref("email");
const valorBusquedaPersona = ref("");
const errorValorBusquedaPersona = ref(null);
const personaReutilizada = ref(null);
const conflictoAlta = ref(null);
const vinculoDesdeDetalle = ref(false);
const personaSeleccionada = ref(null);
const personaCambioEmail = ref(null);
const personaDetalle = ref(null);
const personaAsociar = ref(null);
const personaDesactivar = ref(null);
const vinculos = ref([]);
const cargandoVinculos = ref(false);
const errorVinculos = ref(null);
const exitoVinculos = ref(null);
const exitoRut = ref(null);
const errorRut = ref(null);
const cargandoRutEdicion = ref(false);
const enviando = ref(false);
const altaDesdeQuery = ref(false);

const formPersona = ref({
  nombre: "",
  email: "",
  rut: "",
  telefono: "",
  asociacionTipo: ASOCIACION_UNIDAD,
  unidadId: null,
  tipoVinculo: null,
  fechaInicio: "",
  esOcupante: false,
  recibeNotificaciones: true,
  esResponsable: false,
  cargo: null,
  empresa: "",
  rubro: "",
  contactoProveedor: "",
});
const formEditarPersona = ref({ nombre: "", telefono: "" });
const formCambioEmail = ref({ emailNuevo: "", motivo: "" });
const formVinculo = ref({
  personaId: null,
  unidadId: null,
  tipo: null,
  fechaInicio: "",
  esOcupante: false,
  recibeNotificaciones: true,
});
const formAsociar = ref({
  asociacionTipo: ASOCIACION_UNIDAD,
  unidadId: null,
  tipoVinculo: null,
  fechaInicio: "",
  esOcupante: false,
  recibeNotificaciones: true,
  esResponsable: false,
  cargo: null,
  empresa: "",
  rubro: "",
  contactoProveedor: "",
});
const formDesactivar = ref({ motivo: "" });
const formUsuario = ref({ rol: "RESIDENTE" });
const formHabilitarRut = ref({ vigenciaHoras: 72, motivo: "" });
const enviandoRut = ref(false);

const errorFormPersona = ref(null);
const errorFormEditar = ref(null);
const errorFormCambioEmail = ref(null);
const errorFormVinculo = ref(null);
const errorFormAsociar = ref(null);
const errorFormUsuario = ref(null);
const errorFormHabilitarRut = ref(null);
const erroresVinculo = ref({});
const erroresAsociacion = ref({});
const erroresAsociar = ref({});

const nombreCrearRef = ref(null);
const emailCrearRef = ref(null);
const rutCrearRef = ref(null);
const telefonoCrearRef = ref(null);
const nombreEditarRef = ref(null);
const telefonoEditarRef = ref(null);
const emailCambioRef = ref(null);
const motivoCambioRef = ref(null);

const {
  errores: erroresPersona,
  validarNombre,
  validarEmail,
  validarRut,
  validarTelefono,
  onRutInput,
  onRutBlur,
  onTelefonoInput,
  onTelefonoBlur,
  focusPrimerError,
  normalizarRut,
  normalizarTelefono,
  normalizarEmail,
} = useValidacionChile();

const {
  errores: erroresCambioEmail,
  validarEmail: validarEmailCambio,
  focusPrimerError: focusPrimerErrorCambioEmail,
  normalizarEmail: normalizarEmailCambio,
} = useValidacionChile();

const {
  errores: erroresEdicion,
  validarNombre: validarNombreEdicion,
  validarTelefono: validarTelefonoEdicion,
  onTelefonoInput: onTelefonoInputEdicion,
  onTelefonoBlur: onTelefonoBlurEdicion,
  focusPrimerError: focusPrimerErrorEdicion,
  normalizarTelefono: normalizarTelefonoEdicion,
} = useValidacionChile();

// Verificación del email en el alta: si la persona ya existe se reutiliza su
// identidad (`personaId`) y solo se agrega la asociación en este condominio.
const {
  buscando: verificandoEmailAlta,
  consultado: emailAltaConsultado,
  noEncontrada: emailAltaDisponible,
  error: errorBusquedaAlta,
  limpiar: limpiarBusquedaAlta,
  buscarPorEmail: buscarEmailAlta,
} = useBusquedaPersona();

// Búsqueda global (email o RUT) desde el diálogo "Buscar persona".
const {
  buscando: buscandoPersona,
  persona: personaBuscada,
  consultado: busquedaPersonaConsultada,
  noEncontrada: personaNoEncontrada,
  error: errorBusquedaPersona,
  limpiar: limpiarBusquedaPersona,
  buscar: buscarPersona,
} = useBusquedaPersona();

const rolesUsuario = [
  { label: "Residente", value: "RESIDENTE" },
  { label: "Guardia", value: "GUARDIA" },
  { label: "Trabajador", value: "TRABAJADOR" },
  { label: "Proveedor", value: "PROVEEDOR" },
];

const vigenciasRut = [
  { label: "24 horas", value: 24 },
  { label: "72 horas", value: 72 },
  { label: "7 días", value: 168 },
];

const estadosFiltro = [
  { value: "TODOS", label: "Todas las membresías" },
  ...ESTADOS_MEMBRESIA,
];

const tiposFiltro = [
  { value: null, label: "Todas las participaciones" },
  ...TIPOS_PARTICIPACION,
];

const tipoVinculoLabels = Object.fromEntries(
  TIPOS_VINCULO_UNIDAD.map((tipo) => [tipo.value, tipo.label]),
);

const puedeCrear = computed(() => auth.permisos.includes("PERSONA_CREAR"));
const puedeVerPersonas = computed(() => auth.permisos.includes("PERSONA_VER"));
const puedeEditar = computed(() => auth.permisos.includes("PERSONA_EDITAR"));
const puedeDesactivar = computed(() =>
  auth.permisos.includes("PERSONA_ELIMINAR"),
);
const puedeVerVinculos = computed(() =>
  auth.permisos.includes("VINCULO_VER"),
);
const puedeCrearVinculo = computed(() =>
  auth.permisos.includes("VINCULO_CREAR"),
);
const puedeDesvincular = computed(() =>
  auth.permisos.includes("VINCULO_ELIMINAR"),
);
const puedeGestionarUsuario = computed(() =>
  auth.permisos.includes("USUARIO_GESTIONAR"),
);
const puedeHabilitarRut = computed(() =>
  auth.permisos.includes("PERSONA_RUT_CORREGIR"),
);

const correccionRut = computed(
  () => personaDetalle.value?.correccionRut || null,
);
const correccionRutVigente = computed(
  () => correccionRut.value?.estado === "VIGENTE",
);
const estadoRut = computed(() => estadoCorreccionRut(correccionRut.value));

const mensajeErrorBusquedaAlta = computed(() =>
  errorBusquedaAlta.value
    ? mensajeError(errorBusquedaAlta.value, "No se pudo verificar el email")
    : null,
);
const mensajeErrorBusquedaPersona = computed(() =>
  errorBusquedaPersona.value
    ? mensajeError(
        errorBusquedaPersona.value,
        "No se pudo buscar la persona",
      )
    : null,
);

/**
 * Membresía de la persona buscada en el condominio actual. `null` si aún no
 * pertenece a este condominio.
 */
const membresiaActualBuscada = computed(() => {
  const cid = auth.condominioActualId;
  const membresias = personaBuscada.value?.membresias || [];
  if (!cid) return null;
  return membresias.find((m) => m.condominioId === cid) || null;
});

const otrasMembresiasBuscada = computed(() => {
  const cid = auth.condominioActualId;
  return (personaBuscada.value?.membresias || []).filter(
    (m) => m.condominioId !== cid,
  );
});

const personaBuscadaEnListado = computed(
  () =>
    !!personaBuscada.value &&
    personas.value.some((p) => p.id === personaBuscada.value.id),
);

const personasFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase();
  if (!q) return personas.value;
  return personas.value.filter((p) =>
    [p.nombre, p.email, p.rut, p.telefono, p.cargo, p.unidadPrincipal].some(
      (valor) =>
        String(valor || "")
          .toLowerCase()
          .includes(q),
    ),
  );
});

const personasPagina = computed(() => {
  const inicio = pagina.value * TAMANO_PAGINA;
  return personasFiltradas.value.slice(inicio, inicio + TAMANO_PAGINA);
});

const primerRegistro = computed(() => pagina.value * TAMANO_PAGINA);

const hayUnidades = computed(() => unidades.value.length > 0);

let tokenCarga = 0;

async function cargar() {
  const cid = auth.condominioActualId;
  if (!cid) {
    loading.value = false;
    return;
  }

  const token = ++tokenCarga;
  loading.value = true;
  errorCarga.value = null;

  try {
    const params = { estado: estadoFiltro.value };
    if (tipoFiltro.value) params.tipoParticipacion = tipoFiltro.value;

    const { data } = await personasService.listar(cid, params);
    if (token !== tokenCarga) return;
    personas.value = Array.isArray(data) ? data : [];

    try {
      const { data: unidadesData } = await unidadesService.getUnidades(cid);
      if (token !== tokenCarga) return;
      unidades.value = (Array.isArray(unidadesData) ? unidadesData : []).filter(
        (unidad) => unidad.tipo !== "CONDOMINIO",
      );
    } catch (e) {
      console.error("Error al cargar unidades para vínculos", e);
      if (token === tokenCarga) unidades.value = [];
    }
  } catch (e) {
    if (token !== tokenCarga) return;
    console.error("Error al cargar personas", e);
    errorCarga.value = mensajeError(e, "No se pudieron cargar las personas");
    personas.value = [];
    unidades.value = [];
  } finally {
    if (token === tokenCarga) loading.value = false;
  }
}

watch(
  () => auth.condominioActualId,
  (cid) => {
    personas.value = [];
    unidades.value = [];
    busqueda.value = "";
    pagina.value = 0;
    errorCarga.value = null;
    errorAccion.value = null;
    exito.value = null;
    if (!cid) {
      loading.value = false;
      return;
    }
    cargar();
  },
  { immediate: true },
);

watch([estadoFiltro, tipoFiltro], () => {
  pagina.value = 0;
  cargar();
});

watch(busqueda, () => {
  pagina.value = 0;
});

watch(personasFiltradas, (lista) => {
  const maxPagina = Math.max(0, Math.ceil(lista.length / TAMANO_PAGINA) - 1);
  if (pagina.value > maxPagina) pagina.value = maxPagina;
});

// Alta de trabajador desde "Miembros" (`?nueva=CARGO`) o de residente
// (`?nueva=UNIDAD`). Solo se procesa una vez.
watch(
  () => route.query.nueva,
  (nueva) => {
    if (altaDesdeQuery.value || !nueva) return;
    if (nueva !== "CARGO" && nueva !== "UNIDAD") return;
    altaDesdeQuery.value = true;
    if (!puedeCrear.value) return;
    abrirCrear(nueva === "CARGO" ? ASOCIACION_CARGO : ASOCIACION_UNIDAD);
  },
  { immediate: true },
);

function aplicarErroresBackend(error, destino) {
  const fields = error?.response?.data?.fields;
  if (!Array.isArray(fields) || !fields.length) return false;
  fields.forEach((field) => {
    if (field?.field) {
      destino.value[field.field] = field.message || "Valor inválido";
    }
  });
  return true;
}

function tipoVinculoLabel(tipo) {
  if (!tipo) return "";
  return tipoVinculoLabels[tipo] || tipo;
}

/**
 * Membresía sin participación vigente: no tiene unidad, cargo ni tipo
 * derivado. Se marca para poder identificar a quienes ya no mantienen vínculo
 * con la app (candidatos a anonimización futura) sin ocultarlos del listado.
 */
function sinVinculo(persona) {
  return !(persona?.tiposParticipacion || []).length && !persona?.cargo;
}

function formatearFecha(valor) {
  if (!valor) return "—";
  const texto = String(valor).slice(0, 10);
  const [anio, mes, dia] = texto.split("-");
  if (!anio || !mes || !dia) return texto;
  return `${dia}/${mes}/${anio}`;
}

function formatearFechaHora(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fechaLocalISO() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function cambiarPagina(event) {
  pagina.value = event.page;
}

function tieneAcciones(persona) {
  return (
    puedeVerVinculos.value ||
    puedeEditar.value ||
    (puedeDesactivar.value && persona.estadoMembresia !== "INACTIVO") ||
    (puedeGestionarUsuario.value &&
      (!persona.tieneUsuario ||
        (persona.tieneUsuario && !persona.passwordSetAt)))
  );
}

function resetFormAlta(asociacionTipo = ASOCIACION_UNIDAD) {
  formPersona.value = {
    nombre: "",
    email: "",
    rut: "",
    telefono: "",
    asociacionTipo,
    unidadId: null,
    tipoVinculo: null,
    fechaInicio: fechaLocalISO(),
    esOcupante: false,
    recibeNotificaciones: true,
    esResponsable: false,
    cargo: null,
    empresa: "",
    rubro: "",
    contactoProveedor: "",
  };
  personaReutilizada.value = null;
  conflictoAlta.value = null;
  erroresPersona.value = {};
  erroresAsociacion.value = {};
  errorFormPersona.value = null;
  limpiarBusquedaAlta();
}

function abrirCrear(asociacionTipo = ASOCIACION_UNIDAD) {
  if (!puedeCrear.value) return;
  resetFormAlta(asociacionTipo);
  showCrearPersona.value = true;
}

function cerrarCrearPersona() {
  showCrearPersona.value = false;
  errorFormPersona.value = null;
  erroresPersona.value = {};
  erroresAsociacion.value = {};
  conflictoAlta.value = null;
  personaReutilizada.value = null;
  limpiarBusquedaAlta();
}

function validarFormularioPersona() {
  erroresPersona.value = {};
  if (!personaReutilizada.value) {
    validarNombre(formPersona.value.nombre);
    validarEmail(formPersona.value.email);
    validarRut(formPersona.value.rut);
    validarTelefono(formPersona.value.telefono);
  }
  erroresAsociacion.value = validarAsociacion(formPersona.value);
  return (
    Object.keys(erroresPersona.value).length === 0 &&
    Object.keys(erroresAsociacion.value).length === 0
  );
}

function validarYEnfocarPersona() {
  if (validarFormularioPersona()) return true;
  if (!personaReutilizada.value) {
    focusPrimerError([
      ["nombre", nombreCrearRef],
      ["email", emailCrearRef],
      ["rut", rutCrearRef],
      ["telefono", telefonoCrearRef],
    ]);
  }
  return false;
}

function payloadPersona() {
  return {
    nombre: formPersona.value.nombre.trim(),
    email: normalizarEmail(formPersona.value.email),
    rut: formPersona.value.rut ? normalizarRut(formPersona.value.rut) : null,
    telefono: formPersona.value.telefono
      ? normalizarTelefono(formPersona.value.telefono)
      : null,
  };
}

function alCambiarEmailAlta() {
  limpiarBusquedaAlta();
  personaReutilizada.value = null;
  conflictoAlta.value = null;
}

async function verificarEmailAlta() {
  if (!puedeVerPersonas.value) return;
  const cid = auth.condominioActualId;
  const email = normalizarEmail(formPersona.value.email);
  if (!cid || !emailValido(email)) {
    limpiarBusquedaAlta();
    return;
  }
  const encontrada = await buscarEmailAlta(cid, email);
  if (encontrada) {
    personaReutilizada.value = encontrada;
    conflictoAlta.value = null;
  }
}

function usarPersonaNueva() {
  personaReutilizada.value = null;
  conflictoAlta.value = null;
  limpiarBusquedaAlta();
}

/**
 * Alta atómica: identidad (`persona` o `personaId`) + asociación.
 * Si el backend responde 409 de email/RUT, guarda `personaId` y permite
 * reintentar reutilizando la identidad existente.
 */
async function guardarPersona() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  if (!validarYEnfocarPersona()) return;

  enviando.value = true;
  errorFormPersona.value = null;

  const personaId = personaReutilizada.value?.id || null;
  const asociacion = construirAsociacion(formPersona.value);
  const payload = construirPayloadAlta({
    persona: personaId ? null : payloadPersona(),
    personaId,
    asociacion,
  });

  try {
    const { data } = await personasService.crear(cid, payload);
    showCrearPersona.value = false;
    limpiarBusquedaAlta();
    personaReutilizada.value = null;
    conflictoAlta.value = null;
    exito.value = mensajeAlta(data);
    await cargar();
  } catch (e) {
    console.error("Error al registrar persona", e);
    const conflicto = datosConflicto(e);
    if (conflicto?.personaId) {
      conflictoAlta.value = conflicto;
      personaReutilizada.value = {
        id: conflicto.personaId,
        nombre: formPersona.value.nombre || "Persona existente",
        email: formPersona.value.email,
        rut: formPersona.value.rut,
        telefono: formPersona.value.telefono,
      };
      errorFormPersona.value = `${conflicto.message} Se reutilizará la persona existente al reintentar.`;
      return;
    }
    errorFormPersona.value = mensajeError(e, "Error al registrar persona");
    aplicarErroresBackend(e, erroresPersona);
  } finally {
    enviando.value = false;
  }
}

function reintentarAlta() {
  if (!personaReutilizada.value?.id) return;
  conflictoAlta.value = null;
  errorFormPersona.value = null;
  guardarPersona();
}

// ─── Buscar persona ──────────────────────────────────────────

function abrirBuscarPersona(valor = "") {
  if (!puedeVerPersonas.value) return;
  limpiarBusquedaPersona();
  busquedaModo.value = "email";
  valorBusquedaPersona.value = typeof valor === "string" ? valor : "";
  errorValorBusquedaPersona.value = null;
  showBuscarPersona.value = true;
}

function cerrarBuscarPersona() {
  showBuscarPersona.value = false;
  valorBusquedaPersona.value = "";
  errorValorBusquedaPersona.value = null;
  limpiarBusquedaPersona();
}

async function ejecutarBusquedaPersona() {
  const cid = auth.condominioActualId;
  errorValorBusquedaPersona.value = null;
  if (!cid) return;

  const valor = String(valorBusquedaPersona.value || "").trim();
  if (!valor) {
    errorValorBusquedaPersona.value =
      busquedaModo.value === "email"
        ? "Ingresa un email"
        : "Ingresa un RUT";
    return;
  }
  if (busquedaModo.value === "email" && !emailValido(valor)) {
    errorValorBusquedaPersona.value =
      "Ingresa un email válido (ej: nombre@dominio.cl)";
    return;
  }
  if (busquedaModo.value === "rut" && !rutValido(valor)) {
    errorValorBusquedaPersona.value = "Ingresa un RUT válido";
    return;
  }

  const params =
    busquedaModo.value === "email"
      ? { email: normalizarEmail(valor) }
      : { rut: normalizarRut(valor) };
  await buscarPersona(cid, params);
}

function crearDesdeBusqueda() {
  const valor = valorBusquedaPersona.value;
  const modo = busquedaModo.value;
  cerrarBuscarPersona();
  abrirCrear(ASOCIACION_UNIDAD);
  if (modo === "email") formPersona.value.email = valor;
  else formPersona.value.rut = valor;
}

// ─── Asociar persona existente ───────────────────────────────

function abrirAsociarPersona(persona) {
  if (!puedeEditar.value || !persona) return;
  personaAsociar.value = persona;
  formAsociar.value = {
    asociacionTipo: ASOCIACION_UNIDAD,
    unidadId: null,
    tipoVinculo: null,
    fechaInicio: fechaLocalISO(),
    esOcupante: false,
    recibeNotificaciones: true,
    esResponsable: false,
    cargo: null,
    empresa: "",
    rubro: "",
    contactoProveedor: "",
  };
  erroresAsociar.value = {};
  errorFormAsociar.value = null;
  showAsociarPersona.value = true;
}

function cerrarAsociarPersona() {
  showAsociarPersona.value = false;
  personaAsociar.value = null;
  erroresAsociar.value = {};
  errorFormAsociar.value = null;
}

function validarFormularioAsociar() {
  erroresAsociar.value = validarAsociacion(formAsociar.value);
  return Object.keys(erroresAsociar.value).length === 0;
}

async function guardarAsociacion() {
  const cid = auth.condominioActualId;
  const persona = personaAsociar.value;
  if (!cid || !persona) return;
  if (!validarFormularioAsociar()) return;

  enviando.value = true;
  errorFormAsociar.value = null;

  try {
    const { data } = await personasService.agregarAsociacion(
      cid,
      persona.id,
      construirAsociacion(formAsociar.value),
    );
    showAsociarPersona.value = false;
    personaAsociar.value = null;
    exito.value = mensajeAlta(data);
    await cargar();
  } catch (e) {
    console.error("Error al asociar persona", e);
    errorFormAsociar.value = mensajeError(e, "Error al asociar la persona");
    aplicarErroresBackend(e, erroresAsociar);
  } finally {
    enviando.value = false;
  }
}

function confirmarReactivar(persona) {
  if (!puedeEditar.value || !persona) return;
  confirm.require({
    message: `¿Reactivar a ${persona.nombre} en este condominio? Deberás volver a asociarla a una unidad o cargo.`,
    header: "Reactivar persona",
    acceptLabel: "Reactivar",
    rejectLabel: "Cancelar",
    accept: () => reactivarPersona(persona),
  });
}

async function reactivarPersona(persona) {
  const cid = auth.condominioActualId;
  if (!cid || !persona) return;
  errorAccion.value = null;
  exito.value = null;
  try {
    await personasService.reactivar(cid, persona.id);
    exito.value = `${persona.nombre} fue reactivada en este condominio.`;
    await cargar();
  } catch (e) {
    console.error("Error al reactivar persona", e);
    errorAccion.value = mensajeError(e, "No se pudo reactivar la persona");
  }
}

// ─── Baja local ──────────────────────────────────────────────

function abrirDesactivar(persona) {
  if (!puedeDesactivar.value || !persona) return;
  personaDesactivar.value = persona;
  formDesactivar.value = { motivo: "" };
  errorAccion.value = null;
  showDesactivar.value = true;
}

function cerrarDesactivar() {
  showDesactivar.value = false;
  personaDesactivar.value = null;
  formDesactivar.value = { motivo: "" };
}

async function desactivarPersona() {
  const cid = auth.condominioActualId;
  const persona = personaDesactivar.value;
  if (!cid || !persona) return;

  enviando.value = true;
  errorAccion.value = null;
  exito.value = null;

  try {
    const motivo = formDesactivar.value.motivo.trim();
    await personasService.desactivar(cid, persona.id, motivo ? { motivo } : {});
    cerrarDesactivar();
    if (personaSeleccionada.value?.id === persona.id) {
      personaSeleccionada.value = null;
      personaDetalle.value = null;
      vinculos.value = [];
    }
    exito.value = `${persona.nombre} fue quitada de este condominio. Su cuenta sigue activa en otros condominios.`;
    await cargar();
  } catch (e) {
    console.error("Error al desactivar persona", e);
    errorAccion.value = mensajeError(
      e,
      "No se pudo quitar a la persona del condominio",
    );
  } finally {
    enviando.value = false;
  }
}

// ─── Edición / email / usuario / vínculos ────────────────────

async function abrirEditar(persona) {
  if (!puedeEditar.value) return;
  personaSeleccionada.value = persona;
  formEditarPersona.value = {
    nombre: persona.nombre || "",
    telefono: persona.telefono || "",
  };
  erroresEdicion.value = {};
  errorFormEditar.value = null;
  exitoRut.value = null;
  errorRut.value = null;
  personaDetalle.value = null;
  cargandoRutEdicion.value = false;
  showEditarPersona.value = true;

  if (puedeHabilitarRut.value) {
    cargandoRutEdicion.value = true;
    try {
      const { data } = await personasService.obtener(
        auth.condominioActualId,
        persona.id,
      );
      if (personaSeleccionada.value?.id === persona.id) {
        personaDetalle.value = data;
      }
    } catch (e) {
      console.error("Error al cargar el detalle de la persona", e);
      if (personaSeleccionada.value?.id === persona.id) {
        errorRut.value = mensajeError(
          e,
          "No se pudo cargar el estado de la corrección de RUT",
        );
      }
    } finally {
      if (personaSeleccionada.value?.id === persona.id) {
        cargandoRutEdicion.value = false;
      }
    }
  }
}

function cerrarEditarPersona() {
  showEditarPersona.value = false;
  showHabilitarRut.value = false;
  personaSeleccionada.value = null;
  personaDetalle.value = null;
  errorFormEditar.value = null;
  erroresEdicion.value = {};
  exitoRut.value = null;
  errorRut.value = null;
  errorFormHabilitarRut.value = null;
  cargandoRutEdicion.value = false;
}

async function editarPersona() {
  const cid = auth.condominioActualId;
  if (!cid || !personaSeleccionada.value) return;

  erroresEdicion.value = {};
  validarNombreEdicion(formEditarPersona.value.nombre);
  validarTelefonoEdicion(formEditarPersona.value.telefono);

  if (Object.keys(erroresEdicion.value).length) {
    focusPrimerErrorEdicion([
      ["nombre", nombreEditarRef],
      ["telefono", telefonoEditarRef],
    ]);
    return;
  }

  enviando.value = true;
  errorFormEditar.value = null;

  try {
    await personasService.actualizar(cid, personaSeleccionada.value.id, {
      nombre: formEditarPersona.value.nombre.trim(),
      telefono: formEditarPersona.value.telefono
        ? normalizarTelefonoEdicion(formEditarPersona.value.telefono)
        : "",
    });
    showEditarPersona.value = false;
    showHabilitarRut.value = false;
    personaSeleccionada.value = null;
    personaDetalle.value = null;
    exitoRut.value = null;
    errorRut.value = null;
    exito.value = "Persona actualizada correctamente.";
    await cargar();
  } catch (e) {
    console.error("Error al editar persona", e);
    errorFormEditar.value = mensajeError(e, "Error al actualizar persona");
    aplicarErroresBackend(e, erroresEdicion);
  } finally {
    enviando.value = false;
  }
}

function abrirCambiarEmail(persona) {
  if (!puedeEditar.value || !persona) return;
  personaCambioEmail.value = persona;
  formCambioEmail.value = { emailNuevo: "", motivo: "" };
  erroresCambioEmail.value = {};
  errorFormCambioEmail.value = null;
  showCambiarEmail.value = true;
}

function cerrarCambiarEmail() {
  showCambiarEmail.value = false;
  personaCambioEmail.value = null;
  erroresCambioEmail.value = {};
  errorFormCambioEmail.value = null;
}

function validarFormularioCambioEmail() {
  erroresCambioEmail.value = {};
  validarEmailCambio(formCambioEmail.value.emailNuevo, "emailNuevo");
  const errorMotivo = validarMotivoCambioEmail(formCambioEmail.value.motivo);
  if (errorMotivo) erroresCambioEmail.value.motivo = errorMotivo;
  return Object.keys(erroresCambioEmail.value).length === 0;
}

async function cambiarEmail() {
  const cid = auth.condominioActualId;
  const persona = personaCambioEmail.value;
  if (!cid || !persona) return;
  if (!validarFormularioCambioEmail()) {
    focusPrimerErrorCambioEmail([
      ["emailNuevo", emailCambioRef],
      ["motivo", motivoCambioRef],
    ]);
    return;
  }

  enviando.value = true;
  errorFormCambioEmail.value = null;

  try {
    const { data } = await personasService.cambiarEmail(cid, persona.id, {
      emailNuevo: normalizarEmailCambio(formCambioEmail.value.emailNuevo),
      motivo: formCambioEmail.value.motivo.trim(),
    });
    const emailNuevo = formCambioEmail.value.emailNuevo;
    showCambiarEmail.value = false;
    personaCambioEmail.value = null;
    exito.value = mensajeCambioEmail(data, emailNuevo);
    await cargar();
  } catch (e) {
    console.error("Error al cambiar email", e);
    errorFormCambioEmail.value = mensajeError(e, "Error al cambiar email");
    aplicarErroresBackend(e, erroresCambioEmail);
  } finally {
    enviando.value = false;
  }
}

function confirmarReenviarVerificacion(persona) {
  if (!puedeEditar.value || !persona?.emailCambioPendiente) return;
  confirm.require({
    message: `¿Reenviar el correo de verificación a ${persona.emailCambioPendiente}? El enlace anterior dejará de funcionar.`,
    header: "Reenviar verificación",
    acceptLabel: "Reenviar",
    rejectLabel: "Cancelar",
    accept: () => reenviarVerificacion(persona),
  });
}

async function reenviarVerificacion(persona) {
  const cid = auth.condominioActualId;
  if (!cid || !persona) return;

  errorAccion.value = null;
  exito.value = null;

  try {
    const { data } = await personasService.reenviarVerificacionEmail(
      cid,
      persona.id,
    );
    exito.value =
      data?.mensaje || "Se reenvió el correo de verificación al nuevo email.";
    await cargar();
  } catch (e) {
    console.error("Error al reenviar verificación", e);
    errorAccion.value = mensajeError(e, "No se pudo reenviar la verificación");
  }
}

function confirmarReenviarSetup(persona) {
  if (!puedeGestionarUsuario.value || !persona) return;
  confirm.require({
    message: `¿Reenviar el correo de configuración de contraseña a ${persona.email}?`,
    header: "Reenviar setup",
    acceptLabel: "Reenviar",
    rejectLabel: "Cancelar",
    accept: () => reenviarSetup(persona),
  });
}

async function reenviarSetup(persona) {
  const cid = auth.condominioActualId;
  if (!cid || !persona) return;

  errorAccion.value = null;
  exito.value = null;

  try {
    await personasService.reenviarSetup(cid, persona.id);
    exito.value =
      "Se reenvió el correo de configuración de contraseña al email actual.";
    await cargar();
  } catch (e) {
    console.error("Error al reenviar setup", e);
    errorAccion.value = mensajeError(
      e,
      "No se pudo reenviar el correo de configuración",
    );
  }
}

async function verVinculos(persona) {
  if (!puedeVerVinculos.value) return;
  const cid = auth.condominioActualId;
  if (!cid) return;

  personaSeleccionada.value = persona;
  personaDetalle.value = null;
  vinculos.value = [];
  errorVinculos.value = null;
  exitoVinculos.value = null;
  showHabilitarRut.value = false;
  errorFormHabilitarRut.value = null;
  cargandoVinculos.value = true;
  showVinculos.value = true;

  try {
    const { data } = await personasService.obtener(cid, persona.id);
    if (personaSeleccionada.value?.id !== persona.id) return;
    personaDetalle.value = data;
    vinculos.value = data?.vinculos || [];
  } catch (e) {
    console.error("Error al cargar vínculos", e);
    if (personaSeleccionada.value?.id === persona.id) {
      errorVinculos.value = mensajeError(e, "Error al cargar vínculos");
    }
  } finally {
    if (personaSeleccionada.value?.id === persona.id) {
      cargandoVinculos.value = false;
    }
  }
}

function cerrarVinculos() {
  showVinculos.value = false;
  showHabilitarRut.value = false;
  personaSeleccionada.value = null;
  personaDetalle.value = null;
  vinculos.value = [];
  errorVinculos.value = null;
  exitoVinculos.value = null;
  errorFormHabilitarRut.value = null;
}

function abrirHabilitarRut() {
  if (!puedeHabilitarRut.value || !personaSeleccionada.value) return;
  formHabilitarRut.value = { vigenciaHoras: 72, motivo: "" };
  errorFormHabilitarRut.value = null;
  showHabilitarRut.value = true;
}

async function recargarDetallePersona() {
  const cid = auth.condominioActualId;
  const persona = personaSeleccionada.value;
  if (!cid || !persona) return;
  try {
    const { data } = await personasService.obtener(cid, persona.id);
    if (personaSeleccionada.value?.id !== persona.id) return;
    personaDetalle.value = data;
    vinculos.value = data?.vinculos || [];
  } catch (e) {
    console.error("Error al recargar el detalle de la persona", e);
    errorRut.value = mensajeError(
      e,
      "No se pudo recargar el detalle de la persona",
    );
  }
}

function habilitarRut() {
  const cid = auth.condominioActualId;
  const motivo = formHabilitarRut.value.motivo.trim();
  if (!cid || !personaSeleccionada.value) return;
  if (!motivo) {
    errorFormHabilitarRut.value = "El motivo es obligatorio.";
    return;
  }
  errorFormHabilitarRut.value = null;
  const vigencia = vigenciasRut.find(
    (v) => v.value === formHabilitarRut.value.vigenciaHoras,
  );
  confirm.require({
    message: `¿Habilitar la corrección de RUT de ${personaSeleccionada.value.nombre} por ${vigencia?.label || formHabilitarRut.value.vigenciaHoras + " horas"}? La persona podrá enviar una única solicitud y recibirá una notificación.`,
    header: "Habilitar corrección de RUT",
    acceptLabel: "Habilitar",
    rejectLabel: "Cancelar",
    accept: () => ejecutarHabilitarRut(),
  });
}

async function ejecutarHabilitarRut() {
  const cid = auth.condominioActualId;
  const motivo = formHabilitarRut.value.motivo.trim();
  if (!cid || !personaSeleccionada.value || !motivo) return;

  enviandoRut.value = true;
  errorFormHabilitarRut.value = null;
  try {
    const { data } = await personasService.habilitarCorreccionRut(
      cid,
      personaSeleccionada.value.id,
      {
        vigenciaHoras: formHabilitarRut.value.vigenciaHoras,
        motivo,
      },
    );
    showHabilitarRut.value = false;
    errorRut.value = null;
    exitoRut.value = `Corrección de RUT habilitada hasta el ${formatearFechaHora(
      data.habilitadaHasta,
    )}.`;
    await recargarDetallePersona();
  } catch (e) {
    console.error("Error al habilitar la corrección de RUT", e);
    errorFormHabilitarRut.value = mensajeError(
      e,
      "No se pudo habilitar la corrección de RUT",
    );
  } finally {
    enviandoRut.value = false;
  }
}

function confirmarRevocarRut() {
  if (!puedeHabilitarRut.value || !personaSeleccionada.value) return;
  confirm.require({
    message: `¿Revocar la habilitación de corrección de RUT de ${personaSeleccionada.value.nombre}? La persona ya no podrá solicitarla.`,
    header: "Revocar habilitación",
    acceptLabel: "Revocar",
    rejectLabel: "Cancelar",
    acceptClass: "p-button-danger",
    accept: () => revocarRut(),
  });
}

async function revocarRut() {
  const cid = auth.condominioActualId;
  if (!cid || !personaSeleccionada.value) return;
  enviandoRut.value = true;
  try {
    await personasService.revocarCorreccionRut(
      cid,
      personaSeleccionada.value.id,
    );
    errorRut.value = null;
    exitoRut.value = "Habilitación de corrección de RUT revocada.";
    await recargarDetallePersona();
  } catch (e) {
    console.error("Error al revocar la corrección de RUT", e);
    errorRut.value = mensajeError(e, "No se pudo revocar la habilitación");
  } finally {
    enviandoRut.value = false;
  }
}

function abrirCrearVinculoConPersona(persona) {
  if (!puedeCrearVinculo.value || !persona) return;
  personaSeleccionada.value = persona;
  personaDetalle.value = null;
  formVinculo.value = {
    personaId: persona.id,
    unidadId: null,
    tipo: null,
    fechaInicio: fechaLocalISO(),
    esOcupante: false,
    recibeNotificaciones: true,
  };
  erroresVinculo.value = {};
  errorFormVinculo.value = null;
  showVinculos.value = false;
  showCrearVinculo.value = true;
}

function abrirCrearVinculo() {
  if (!puedeCrearVinculo.value || !personaSeleccionada.value) return;
  vinculoDesdeDetalle.value = true;
  abrirCrearVinculoConPersona(personaSeleccionada.value);
}

function cerrarCrearVinculo() {
  showCrearVinculo.value = false;
  errorFormVinculo.value = null;
  erroresVinculo.value = {};
  showVinculos.value = vinculoDesdeDetalle.value && !!personaSeleccionada.value;
  if (!showVinculos.value) {
    personaSeleccionada.value = null;
    personaDetalle.value = null;
  }
  vinculoDesdeDetalle.value = false;
}

async function crearVinculo() {
  const cid = auth.condominioActualId;
  const persona = personaSeleccionada.value;
  if (!cid || !persona) return;

  erroresVinculo.value = {};
  errorFormVinculo.value = null;

  if (!formVinculo.value.unidadId) {
    erroresVinculo.value.unidadId = "Selecciona una unidad";
    return;
  }
  if (!formVinculo.value.tipo) {
    erroresVinculo.value.tipo = "Selecciona un tipo de vínculo";
    return;
  }
  if (!formVinculo.value.fechaInicio) {
    erroresVinculo.value.fechaInicio = "Selecciona la fecha de inicio";
    return;
  }

  enviando.value = true;

  try {
    await personasService.crearVinculo(cid, {
      personaId: persona.id,
      unidadId: formVinculo.value.unidadId,
      tipo: formVinculo.value.tipo,
      fechaInicio: formVinculo.value.fechaInicio,
      esOcupante: formVinculo.value.esOcupante,
      recibeNotificaciones: formVinculo.value.recibeNotificaciones,
    });
    showCrearVinculo.value = false;
    vinculoDesdeDetalle.value = false;
    await verVinculos(persona);
    exitoVinculos.value = "Vínculo creado correctamente.";
    await cargar();
    exito.value = "Persona vinculada. Ya aparece en el listado.";
  } catch (e) {
    console.error("Error al crear vínculo", e);
    errorFormVinculo.value = mensajeError(e, "Error al crear vínculo");
    aplicarErroresBackend(e, erroresVinculo);
  } finally {
    enviando.value = false;
  }
}

function confirmarDesvincular(vinculo) {
  if (!puedeDesvincular.value || !personaSeleccionada.value) return;
  confirm.require({
    message: `¿Desvincular a ${personaSeleccionada.value.nombre} de la unidad ${vinculo.unidadNumero}? El historial se conserva.`,
    header: "Confirmar desvinculación",
    acceptLabel: "Desvincular",
    rejectLabel: "Cancelar",
    acceptClass: "p-button-danger",
    accept: () => desvincularVinculo(vinculo),
  });
}

async function desvincularVinculo(vinculo) {
  const cid = auth.condominioActualId;
  const persona = personaSeleccionada.value;
  if (!cid || !persona) return;

  errorVinculos.value = null;

  try {
    await personasService.desactivarVinculo(cid, vinculo.vinculoId);
    await verVinculos(persona);
    exitoVinculos.value = "Vínculo desactivado correctamente.";
    await cargar();
  } catch (e) {
    console.error("Error al desvincular vínculo", e);
    errorVinculos.value = mensajeError(e, "Error al desvincular vínculo");
  }
}

function abrirCrearUsuario(persona) {
  if (!puedeGestionarUsuario.value || !persona || persona.tieneUsuario) return;
  personaSeleccionada.value = persona;
  formUsuario.value = { rol: "RESIDENTE" };
  errorFormUsuario.value = null;
  showCrearUsuario.value = true;
}

function cerrarCrearUsuario() {
  showCrearUsuario.value = false;
  personaSeleccionada.value = null;
  errorFormUsuario.value = null;
}

async function crearUsuario() {
  const cid = auth.condominioActualId;
  const persona = personaSeleccionada.value;
  if (!cid || !persona) return;

  enviando.value = true;
  errorFormUsuario.value = null;

  try {
    await personasService.crearUsuario(cid, persona.id, formUsuario.value);
    showCrearUsuario.value = false;
    personaSeleccionada.value = null;
    exito.value =
      "Cuenta creada. Se envió el email de configuración de contraseña.";
    await cargar();
  } catch (e) {
    console.error("Error al crear usuario", e);
    errorFormUsuario.value = mensajeError(e, "Error al crear usuario");
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="text-xl font-bold m-0">Personas</h1>
        <Tag
          v-if="personas.length"
          :value="`${personas.length} personas`"
          severity="secondary"
        />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button
          v-if="puedeVerPersonas"
          label="Buscar persona"
          icon="pi pi-search"
          severity="secondary"
          @click="abrirBuscarPersona()"
        />
        <Button
          v-if="puedeCrear"
          label="Nueva persona"
          icon="pi pi-plus"
          @click="abrirCrear()"
        />
      </div>
    </div>

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

    <Card>
      <template #content>
        <div class="flex flex-col gap-2 md:flex-row md:items-center">
          <InputText
            v-model="busqueda"
            placeholder="Buscar por nombre, email o RUT..."
            aria-label="Buscar personas"
            class="w-full md:flex-1"
          />
          <Select
            v-model="estadoFiltro"
            :options="estadosFiltro"
            optionLabel="label"
            optionValue="value"
            aria-label="Filtrar por estado de membresía"
            class="w-full md:w-14rem"
          />
          <Select
            v-model="tipoFiltro"
            :options="tiposFiltro"
            optionLabel="label"
            optionValue="value"
            aria-label="Filtrar por tipo de participación"
            class="w-full md:w-15rem"
          />
        </div>
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="errorCarga" severity="error">
      {{ errorCarga }}
    </Message>

    <template v-else>
      <div v-if="!personas.length" class="text-center text-text-muted py-8">
        No hay personas con este filtro
      </div>
      <div
        v-else-if="!personasFiltradas.length"
        class="text-center text-text-muted py-8"
      >
        No hay coincidencias con la búsqueda
      </div>

      <template v-else>
        <div class="flex flex-col gap-2 md:hidden">
          <div
            v-for="p in personasPagina"
            :key="p.id"
            class="bg-surface border border-border-soft rounded-lg p-3"
          >
            <div
              class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
            >
              <div class="min-w-0 flex flex-col gap-1">
                <div class="flex flex-wrap items-center gap-1">
                  <span class="font-medium truncate">{{ p.nombre }}</span>
                  <Tag
                    v-for="t in p.tiposParticipacion || []"
                    :key="t"
                    :value="labelTipoParticipacion(t)"
                    :severity="severityTipoParticipacion(t)"
                    size="small"
                  />
                </div>
                <span class="text-sm text-text-muted truncate">
                  {{ p.email || "Sin email" }}
                </span>
                <span
                  v-if="p.unidadPrincipal"
                  class="text-xs text-text-muted"
                >
                  Unidad {{ p.unidadPrincipal }}
                </span>
                <span
                  v-if="p.emailCambioPendiente"
                  class="text-xs text-text-muted truncate"
                >
                  Pendiente: {{ p.emailCambioPendiente }}
                </span>
                <div class="flex flex-wrap items-center gap-1 mt-1">
                  <Tag
                    :value="labelEstadoMembresia(p.estadoMembresia)"
                    :severity="severityEstadoMembresia(p.estadoMembresia)"
                    size="small"
                  />
                  <Tag
                    :value="estadoUsuarioPersona(p).label"
                    :severity="estadoUsuarioPersona(p).severity"
                    size="small"
                  />
                  <Tag
                    v-if="p.cargo"
                    :value="cargoLabel(p.cargo)"
                    severity="secondary"
                    size="small"
                  />
                  <Tag
                    v-if="sinVinculo(p)"
                    value="Sin vínculo"
                    severity="secondary"
                    size="small"
                  />
                </div>
              </div>

              <div
                v-if="tieneAcciones(p)"
                class="flex flex-wrap items-center gap-1 shrink-0"
              >
                <Button
                  v-if="puedeVerVinculos"
                  icon="pi pi-link"
                  severity="secondary"
                  variant="text"
                  size="small"
                  rounded
                  :title="`Ver vínculos de ${p.nombre}`"
                  :aria-label="`Ver vínculos de ${p.nombre}`"
                  @click="verVinculos(p)"
                />
                <Button
                  v-if="puedeEditar && p.estadoMembresia !== 'INACTIVO'"
                  icon="pi pi-plus-circle"
                  severity="secondary"
                  variant="text"
                  size="small"
                  rounded
                  :title="`Agregar asociación a ${p.nombre}`"
                  :aria-label="`Agregar asociación a ${p.nombre}`"
                  @click="abrirAsociarPersona(p)"
                />
                <Button
                  v-if="puedeEditar && p.estadoMembresia === 'INACTIVO'"
                  icon="pi pi-replay"
                  severity="secondary"
                  variant="text"
                  size="small"
                  rounded
                  :title="`Reactivar a ${p.nombre}`"
                  :aria-label="`Reactivar a ${p.nombre}`"
                  @click="confirmarReactivar(p)"
                />
                <Button
                  v-if="puedeGestionarUsuario && !p.tieneUsuario"
                  icon="pi pi-user-plus"
                  severity="secondary"
                  variant="text"
                  size="small"
                  rounded
                  :title="`Crear usuario para ${p.nombre}`"
                  :aria-label="`Crear usuario para ${p.nombre}`"
                  @click="abrirCrearUsuario(p)"
                />
                <Button
                  v-if="puedeGestionarUsuario && p.tieneUsuario && !p.passwordSetAt"
                  icon="pi pi-send"
                  severity="secondary"
                  variant="text"
                  size="small"
                  rounded
                  :title="`Reenviar setup a ${p.nombre}`"
                  :aria-label="`Reenviar setup a ${p.nombre}`"
                  @click="confirmarReenviarSetup(p)"
                />
                <Button
                  v-if="puedeEditar && p.emailCambioPendiente"
                  icon="pi pi-refresh"
                  severity="secondary"
                  variant="text"
                  size="small"
                  rounded
                  :title="`Reenviar verificación a ${p.emailCambioPendiente}`"
                  :aria-label="`Reenviar verificación a ${p.emailCambioPendiente}`"
                  @click="confirmarReenviarVerificacion(p)"
                />
                <Button
                  v-if="puedeEditar"
                  icon="pi pi-envelope"
                  severity="secondary"
                  variant="text"
                  size="small"
                  rounded
                  :title="`Cambiar email de ${p.nombre}`"
                  :aria-label="`Cambiar email de ${p.nombre}`"
                  @click="abrirCambiarEmail(p)"
                />
                <Button
                  v-if="puedeEditar"
                  icon="pi pi-pencil"
                  severity="secondary"
                  variant="text"
                  size="small"
                  rounded
                  :title="`Editar a ${p.nombre}`"
                  :aria-label="`Editar a ${p.nombre}`"
                  @click="abrirEditar(p)"
                />
                <Button
                  v-if="puedeDesactivar && p.estadoMembresia !== 'INACTIVO'"
                  icon="pi pi-user-minus"
                  severity="danger"
                  variant="text"
                  size="small"
                  rounded
                  :title="`Quitar a ${p.nombre} del condominio`"
                  :aria-label="`Quitar a ${p.nombre} del condominio`"
                  @click="abrirDesactivar(p)"
                />
              </div>
            </div>

            <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm mt-3">
              <span class="text-text-muted">RUT:</span>
              <span>{{ p.rut || "—" }}</span>
              <span class="text-text-muted">Teléfono:</span>
              <span>{{ p.telefono || "—" }}</span>
              <span class="text-text-muted">Alta:</span>
              <span>{{ labelTipoAlta(p.tipoAlta) || "—" }}</span>
            </div>
          </div>
        </div>

        <div class="planilla hidden md:block">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>RUT</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Participación</th>
                <th>Membresía</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in personasPagina" :key="p.id">
                <td>
                  <div class="flex flex-col">
                    <span class="font-medium">{{ p.nombre }}</span>
                    <span
                      v-if="p.unidadPrincipal"
                      class="text-xs text-text-muted"
                    >
                      Unidad {{ p.unidadPrincipal }}
                    </span>
                  </div>
                </td>
                <td class="whitespace-nowrap">{{ p.rut || "—" }}</td>
                <td class="truncado">
                  <div class="flex flex-col">
                    <span :title="p.email">{{ p.email || "—" }}</span>
                    <span
                      v-if="p.emailCambioPendiente"
                      class="text-xs text-text-muted"
                      :title="`Pendiente: ${p.emailCambioPendiente}`"
                    >
                      Pendiente: {{ p.emailCambioPendiente }}
                    </span>
                  </div>
                </td>
                <td class="whitespace-nowrap">{{ p.telefono || "—" }}</td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <Tag
                      v-for="t in p.tiposParticipacion || []"
                      :key="t"
                      :value="labelTipoParticipacion(t)"
                      :severity="severityTipoParticipacion(t)"
                      size="small"
                    />
                    <Tag
                      v-if="p.cargo"
                      :value="cargoLabel(p.cargo)"
                      severity="secondary"
                      size="small"
                    />
                    <Tag
                      v-if="sinVinculo(p)"
                      value="Sin vínculo"
                      severity="secondary"
                      size="small"
                    />
                    <span
                      v-if="
                        !sinVinculo(p) &&
                        !(p.tiposParticipacion || []).length &&
                        !p.cargo
                      "
                      class="text-text-muted"
                    >
                      —
                    </span>
                  </div>
                </td>
                <td>
                  <div class="flex flex-col gap-1">
                    <Tag
                      :value="labelEstadoMembresia(p.estadoMembresia)"
                      :severity="severityEstadoMembresia(p.estadoMembresia)"
                      size="small"
                    />
                    <Tag
                      :value="estadoUsuarioPersona(p).label"
                      :severity="estadoUsuarioPersona(p).severity"
                      size="small"
                    />
                  </div>
                </td>
                <td>
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      v-if="puedeVerVinculos"
                      icon="pi pi-link"
                      severity="secondary"
                      variant="text"
                      size="small"
                      rounded
                      :title="`Ver vínculos de ${p.nombre}`"
                      :aria-label="`Ver vínculos de ${p.nombre}`"
                      @click="verVinculos(p)"
                    />
                    <Button
                      v-if="puedeEditar && p.estadoMembresia !== 'INACTIVO'"
                      icon="pi pi-plus-circle"
                      severity="secondary"
                      variant="text"
                      size="small"
                      rounded
                      :title="`Agregar asociación a ${p.nombre}`"
                      :aria-label="`Agregar asociación a ${p.nombre}`"
                      @click="abrirAsociarPersona(p)"
                    />
                    <Button
                      v-if="puedeEditar && p.estadoMembresia === 'INACTIVO'"
                      icon="pi pi-replay"
                      severity="secondary"
                      variant="text"
                      size="small"
                      rounded
                      :title="`Reactivar a ${p.nombre}`"
                      :aria-label="`Reactivar a ${p.nombre}`"
                      @click="confirmarReactivar(p)"
                    />
                    <Button
                      v-if="puedeGestionarUsuario && !p.tieneUsuario"
                      icon="pi pi-user-plus"
                      severity="secondary"
                      variant="text"
                      size="small"
                      rounded
                      :title="`Crear usuario para ${p.nombre}`"
                      :aria-label="`Crear usuario para ${p.nombre}`"
                      @click="abrirCrearUsuario(p)"
                    />
                    <Button
                      v-if="puedeGestionarUsuario && p.tieneUsuario && !p.passwordSetAt"
                      icon="pi pi-send"
                      severity="secondary"
                      variant="text"
                      size="small"
                      rounded
                      :title="`Reenviar setup a ${p.nombre}`"
                      :aria-label="`Reenviar setup a ${p.nombre}`"
                      @click="confirmarReenviarSetup(p)"
                    />
                    <Button
                      v-if="puedeEditar && p.emailCambioPendiente"
                      icon="pi pi-refresh"
                      severity="secondary"
                      variant="text"
                      size="small"
                      rounded
                      :title="`Reenviar verificación a ${p.emailCambioPendiente}`"
                      :aria-label="`Reenviar verificación a ${p.emailCambioPendiente}`"
                      @click="confirmarReenviarVerificacion(p)"
                    />
                    <Button
                      v-if="puedeEditar"
                      icon="pi pi-envelope"
                      severity="secondary"
                      variant="text"
                      size="small"
                      rounded
                      :title="`Cambiar email de ${p.nombre}`"
                      :aria-label="`Cambiar email de ${p.nombre}`"
                      @click="abrirCambiarEmail(p)"
                    />
                    <Button
                      v-if="puedeEditar"
                      icon="pi pi-pencil"
                      severity="secondary"
                      variant="text"
                      size="small"
                      rounded
                      :title="`Editar a ${p.nombre}`"
                      :aria-label="`Editar a ${p.nombre}`"
                      @click="abrirEditar(p)"
                    />
                    <Button
                      v-if="puedeDesactivar && p.estadoMembresia !== 'INACTIVO'"
                      icon="pi pi-user-minus"
                      severity="danger"
                      variant="text"
                      size="small"
                      rounded
                      :title="`Quitar a ${p.nombre} del condominio`"
                      :aria-label="`Quitar a ${p.nombre} del condominio`"
                      @click="abrirDesactivar(p)"
                    />
                    <span v-if="!tieneAcciones(p)" class="text-text-muted">
                      —
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Paginator
          :rows="TAMANO_PAGINA"
          :totalRecords="personasFiltradas.length"
          :first="primerRegistro"
          @page="cambiarPagina"
        />
      </template>
    </template>

    <!-- ─── Alta unificada: identidad + asociación ─── -->
    <Dialog
      v-model:visible="showCrearPersona"
      header="Nueva persona"
      modal
      :style="{ width: '95%', maxWidth: '520px' }"
    >
      <div class="flex flex-col gap-3">
        <Message v-if="errorFormPersona" severity="error" :closable="false">
          <div class="flex flex-col gap-2">
            <span>{{ errorFormPersona }}</span>
            <Button
              v-if="conflictoAlta?.personaId"
              label="Reintentar reutilizando la persona"
              icon="pi pi-replay"
              :loading="enviando"
              @click="reintentarAlta"
            />
          </div>
        </Message>

        <div
          v-if="personaReutilizada"
          class="flex flex-col gap-2 p-3 bg-inset border border-border-soft rounded-lg"
        >
          <div class="flex flex-wrap items-center gap-2">
            <i class="pi pi-user text-primary-400" />
            <span class="font-medium">{{ personaReutilizada.nombre }}</span>
            <Tag value="Persona existente" severity="info" size="small" />
          </div>
          <span class="text-sm text-text-muted truncate">
            {{ personaReutilizada.email || "Sin email" }}
          </span>
          <span class="text-xs text-text-muted">
            Se reutilizará su identidad y solo se agregará la asociación en
            este condominio. No se creará una persona nueva.
          </span>
          <Button
            label="Usar otra persona"
            icon="pi pi-times"
            severity="secondary"
            variant="text"
            size="small"
            @click="usarPersonaNueva"
          />
        </div>

        <template v-else>
          <div class="flex flex-col gap-1">
            <label for="persona-nombre" class="text-sm">
              Nombre <span class="text-danger">*</span>
            </label>
            <InputText
              id="persona-nombre"
              ref="nombreCrearRef"
              v-model="formPersona.nombre"
              :class="{ 'p-invalid': erroresPersona.nombre }"
            />
            <small v-if="erroresPersona.nombre" class="text-danger">
              {{ erroresPersona.nombre }}
            </small>
          </div>

          <div class="flex flex-col gap-1">
            <label for="persona-email" class="text-sm">
              Email <span class="text-danger">*</span>
            </label>
            <InputText
              id="persona-email"
              ref="emailCrearRef"
              v-model="formPersona.email"
              type="email"
              maxlength="255"
              :class="{ 'p-invalid': erroresPersona.email }"
              @input="alCambiarEmailAlta"
              @blur="verificarEmailAlta"
            />
            <small v-if="erroresPersona.email" class="text-danger">
              {{ erroresPersona.email }}
            </small>
            <div
              v-if="verificandoEmailAlta"
              class="flex items-center gap-2 text-xs text-text-muted"
            >
              <i class="pi pi-spin pi-spinner" />
              <span>Verificando email...</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label for="persona-rut" class="text-sm">RUT</label>
              <InputText
                id="persona-rut"
                ref="rutCrearRef"
                v-model="formPersona.rut"
                placeholder="Ej: 12.345.678-9"
                maxlength="12"
                :class="{ 'p-invalid': erroresPersona.rut }"
                @input="formPersona.rut = onRutInput(formPersona.rut)"
                @blur="formPersona.rut = onRutBlur(formPersona.rut)"
              />
              <small v-if="erroresPersona.rut" class="text-danger">
                {{ erroresPersona.rut }}
              </small>
            </div>

            <div class="flex flex-col gap-1">
              <label for="persona-telefono" class="text-sm">Teléfono</label>
              <InputText
                id="persona-telefono"
                ref="telefonoCrearRef"
                v-model="formPersona.telefono"
                placeholder="Ej: +56 9 1234 5678"
                maxlength="16"
                :class="{ 'p-invalid': erroresPersona.telefono }"
                @input="
                  formPersona.telefono = onTelefonoInput(formPersona.telefono)
                "
                @blur="
                  formPersona.telefono = onTelefonoBlur(formPersona.telefono)
                "
              />
              <small v-if="erroresPersona.telefono" class="text-danger">
                {{ erroresPersona.telefono }}
              </small>
            </div>
          </div>

          <Message
            v-if="mensajeErrorBusquedaAlta"
            severity="warn"
            :closable="false"
          >
            {{ mensajeErrorBusquedaAlta }}. Puedes continuar; si el email ya
            existe, se reutilizará la persona.
          </Message>
          <Message
            v-else-if="emailAltaConsultado && emailAltaDisponible"
            severity="success"
            :closable="false"
          >
            Email disponible para crear.
          </Message>
        </template>

        <Divider align="left">
          <span class="text-xs font-semibold text-text-muted">
            Asociación en el condominio
          </span>
        </Divider>

        <div class="flex flex-col gap-1">
          <label for="alta-asociacion-tipo" class="text-sm">
            ¿Cómo se incorpora? <span class="text-danger">*</span>
          </label>
          <Select
            id="alta-asociacion-tipo"
            v-model="formPersona.asociacionTipo"
            :options="TIPOS_ASOCIACION"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            :class="{ 'p-invalid': erroresAsociacion.asociacionTipo }"
          />
          <small
            v-if="erroresAsociacion.asociacionTipo"
            class="text-danger"
          >
            {{ erroresAsociacion.asociacionTipo }}
          </small>
          <small
            v-else
            class="text-xs text-text-muted"
          >
            {{
              TIPOS_ASOCIACION.find(
                (t) => t.value === formPersona.asociacionTipo,
              )?.descripcion
            }}
          </small>
        </div>

        <template v-if="formPersona.asociacionTipo === ASOCIACION_UNIDAD">
          <Message v-if="!hayUnidades" severity="warn" :closable="false">
            No hay unidades creadas. Crea unidades antes de asociar residentes.
          </Message>

          <div class="flex flex-col gap-1">
            <label for="alta-unidad" class="text-sm">
              Unidad <span class="text-danger">*</span>
            </label>
            <Select
              id="alta-unidad"
              v-model="formPersona.unidadId"
              :options="unidades"
              optionLabel="numero"
              optionValue="id"
              placeholder="Seleccionar unidad"
              filter
              class="w-full"
              :class="{ 'p-invalid': erroresAsociacion.unidadId }"
            />
            <small v-if="erroresAsociacion.unidadId" class="text-danger">
              {{ erroresAsociacion.unidadId }}
            </small>
          </div>

          <div class="flex flex-col gap-1">
            <label for="alta-tipo-vinculo" class="text-sm">
              Tipo de vínculo <span class="text-danger">*</span>
            </label>
            <Select
              id="alta-tipo-vinculo"
              v-model="formPersona.tipoVinculo"
              :options="TIPOS_VINCULO_UNIDAD"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar tipo"
              class="w-full"
              :class="{ 'p-invalid': erroresAsociacion.tipoVinculo }"
            />
            <small v-if="erroresAsociacion.tipoVinculo" class="text-danger">
              {{ erroresAsociacion.tipoVinculo }}
            </small>
          </div>

          <div class="flex flex-col gap-1">
            <label for="alta-fecha" class="text-sm">
              Fecha de inicio <span class="text-danger">*</span>
            </label>
            <InputText
              id="alta-fecha"
              v-model="formPersona.fechaInicio"
              type="date"
              :class="{ 'p-invalid': erroresAsociacion.fechaInicio }"
            />
            <small v-if="erroresAsociacion.fechaInicio" class="text-danger">
              {{ erroresAsociacion.fechaInicio }}
            </small>
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <Checkbox
                v-model="formPersona.esOcupante"
                binary
                inputId="alta-ocupante"
              />
              <label for="alta-ocupante" class="text-sm">
                Ocupante de la unidad
              </label>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox
                v-model="formPersona.recibeNotificaciones"
                binary
                inputId="alta-notificaciones"
              />
              <label for="alta-notificaciones" class="text-sm">
                Recibe notificaciones de la unidad
              </label>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox
                v-model="formPersona.esResponsable"
                binary
                inputId="alta-responsable"
              />
              <label for="alta-responsable" class="text-sm">
                Responsable de la unidad
              </label>
            </div>
          </div>
        </template>

        <template v-else-if="formPersona.asociacionTipo === ASOCIACION_CARGO">
          <div class="flex flex-col gap-1">
            <label for="alta-cargo" class="text-sm">
              Cargo <span class="text-danger">*</span>
            </label>
            <Select
              id="alta-cargo"
              v-model="formPersona.cargo"
              :options="CARGOS_ASOCIABLES"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar cargo"
              class="w-full"
              :class="{ 'p-invalid': erroresAsociacion.cargo }"
            />
            <small v-if="erroresAsociacion.cargo" class="text-danger">
              {{ erroresAsociacion.cargo }}
            </small>
          </div>

          <div class="flex flex-col gap-1">
            <label for="alta-fecha-cargo" class="text-sm">
              Fecha de inicio <span class="text-danger">*</span>
            </label>
            <InputText
              id="alta-fecha-cargo"
              v-model="formPersona.fechaInicio"
              type="date"
              :class="{ 'p-invalid': erroresAsociacion.fechaInicio }"
            />
            <small v-if="erroresAsociacion.fechaInicio" class="text-danger">
              {{ erroresAsociacion.fechaInicio }}
            </small>
          </div>
        </template>

        <template v-else-if="formPersona.asociacionTipo === ASOCIACION_PROVEEDOR">
          <Message severity="info" :closable="false">
            El proveedor quedará registrado como membresía del condominio. Los
            datos de la empresa aún no se persisten en el backend.
          </Message>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label for="alta-empresa" class="text-sm">Empresa</label>
              <InputText
                id="alta-empresa"
                v-model="formPersona.empresa"
                maxlength="120"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label for="alta-rubro" class="text-sm">Rubro</label>
              <InputText
                id="alta-rubro"
                v-model="formPersona.rubro"
                maxlength="120"
              />
            </div>
            <div class="flex flex-col gap-1 sm:col-span-2">
              <label for="alta-contacto" class="text-sm">Contacto</label>
              <InputText
                id="alta-contacto"
                v-model="formPersona.contactoProveedor"
                maxlength="160"
              />
            </div>
          </div>
        </template>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="cerrarCrearPersona"
        />
        <Button
          label="Registrar persona"
          icon="pi pi-check"
          :loading="enviando"
          @click="guardarPersona"
        />
      </template>
    </Dialog>

    <!-- ─── Buscar persona global (email o RUT) ─── -->
    <Dialog
      v-model:visible="showBuscarPersona"
      header="Buscar persona"
      modal
      :style="{ width: '95%', maxWidth: '520px' }"
    >
      <div class="flex flex-col gap-3">
        <p class="text-sm text-text-muted m-0">
          Busca la identidad global de una persona. Si ya existe, puedes
          asociarla a este condominio sin crear un duplicado.
        </p>

        <form
          class="flex flex-col gap-2"
          @submit.prevent="ejecutarBusquedaPersona"
        >
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div class="flex flex-col gap-1 sm:w-9rem">
              <label for="buscar-persona-modo" class="text-sm">Buscar por</label>
              <Select
                id="buscar-persona-modo"
                v-model="busquedaModo"
                :options="[
                  { label: 'Email', value: 'email' },
                  { label: 'RUT', value: 'rut' },
                ]"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
            </div>
            <div class="flex flex-col gap-1 flex-1">
              <label for="buscar-persona-valor" class="text-sm">
                {{ busquedaModo === "email" ? "Email" : "RUT" }}
              </label>
              <InputText
                id="buscar-persona-valor"
                v-model="valorBusquedaPersona"
                :type="busquedaModo === 'email' ? 'email' : 'text'"
                :placeholder="
                  busquedaModo === 'email' ? 'nombre@dominio.cl' : '12.345.678-9'
                "
                :maxlength="busquedaModo === 'email' ? 255 : 12"
                :class="{ 'p-invalid': errorValorBusquedaPersona }"
              />
              <small v-if="errorValorBusquedaPersona" class="text-danger">
                {{ errorValorBusquedaPersona }}
              </small>
            </div>
          </div>
          <div class="flex justify-end">
            <Button
              type="submit"
              label="Buscar"
              icon="pi pi-search"
              severity="secondary"
              :loading="buscandoPersona"
            />
          </div>
        </form>

        <Message
          v-if="mensajeErrorBusquedaPersona"
          severity="error"
          :closable="false"
        >
          {{ mensajeErrorBusquedaPersona }}
        </Message>

        <div
          v-if="personaBuscada"
          class="flex flex-col gap-2 p-3 bg-inset border border-border-soft rounded-lg"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium">{{ personaBuscada.nombre }}</span>
            <Tag
              v-if="!personaBuscada.activo"
              value="Cuenta inactiva"
              severity="warn"
              size="small"
            />
          </div>

          <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <span class="text-text-muted">Email:</span>
            <span class="truncate">{{ personaBuscada.email || "—" }}</span>
            <span class="text-text-muted">RUT:</span>
            <span>{{ personaBuscada.rut || "—" }}</span>
            <span class="text-text-muted">Teléfono:</span>
            <span>{{ personaBuscada.telefono || "—" }}</span>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-text-muted">
              Membresías
            </span>
            <div
              v-if="!(personaBuscada.membresias || []).length"
              class="text-sm text-text-muted"
            >
              No pertenece a ningún condominio todavía.
            </div>
            <div v-else class="flex flex-col gap-1">
              <div
                v-for="m in personaBuscada.membresias"
                :key="m.condominioId"
                class="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span class="truncate">
                  {{ m.condominioNombre }}
                  <Tag
                    v-if="m.condominioId === auth.condominioActualId"
                    value="Este condominio"
                    severity="info"
                    size="small"
                    class="ml-1"
                  />
                </span>
                <div class="flex flex-wrap items-center gap-1">
                  <Tag
                    :value="labelEstadoMembresia(m.estado)"
                    :severity="severityEstadoMembresia(m.estado)"
                    size="small"
                  />
                  <Tag
                    :value="labelTipoAlta(m.tipoAlta)"
                    severity="secondary"
                    size="small"
                  />
                </div>
              </div>
            </div>
          </div>

          <Message
            v-if="!membresiaActualBuscada"
            severity="info"
            :closable="false"
          >
            No pertenece a este condominio. Puedes asociarla a una unidad, a un
            cargo o registrarla como proveedor.
          </Message>
          <Message
            v-else-if="membresiaActualBuscada.estado === 'INACTIVO'"
            severity="warn"
            :closable="false"
          >
            Su membresía en este condominio está inactiva. Reactívala antes de
            volver a asociarla.
          </Message>
          <Message
            v-else-if="membresiaActualBuscada.estado === 'PENDIENTE'"
            severity="warn"
            :closable="false"
          >
            Su membresía está pendiente de asociación en este condominio.
          </Message>
          <Message v-else severity="success" :closable="false">
            Ya pertenece a este condominio como
            {{ labelTipoAlta(membresiaActualBuscada.tipoAlta) || "miembro" }}.
          </Message>

          <div class="flex flex-wrap items-center gap-2">
            <template v-if="!membresiaActualBuscada">
              <Button
                v-if="puedeEditar"
                label="Asociar a este condominio"
                icon="pi pi-plus-circle"
                @click="
                  cerrarBuscarPersona();
                  abrirAsociarPersona(personaBuscada);
                "
              />
            </template>
            <template
              v-else-if="membresiaActualBuscada.estado === 'INACTIVO'"
            >
              <Button
                v-if="puedeEditar"
                label="Reactivar en este condominio"
                icon="pi pi-replay"
                @click="
                  cerrarBuscarPersona();
                  confirmarReactivar(personaBuscada);
                "
              />
            </template>
            <template v-else>
              <Button
                v-if="puedeEditar"
                label="Agregar asociación"
                icon="pi pi-plus-circle"
                @click="
                  cerrarBuscarPersona();
                  abrirAsociarPersona(personaBuscada);
                "
              />
              <Button
                v-if="puedeVerVinculos"
                label="Ver vínculos"
                icon="pi pi-link"
                severity="secondary"
                @click="
                  cerrarBuscarPersona();
                  verVinculos(personaBuscada);
                "
              />
            </template>
          </div>

          <div
            v-if="otrasMembresiasBuscada.length"
            class="text-xs text-text-muted"
          >
            También pertenece a {{ otrasMembresiasBuscada.length }}
            {{ otrasMembresiasBuscada.length === 1 ? "condominio" : "condominios" }}
            más.
          </div>
        </div>

        <div
          v-else-if="busquedaPersonaConsultada && personaNoEncontrada"
          class="flex flex-col gap-2 p-3 bg-inset border border-border-soft rounded-lg"
        >
          <p class="m-0 text-sm">
            No existe una persona con ese
            {{ busquedaModo === "email" ? "email" : "RUT" }}.
          </p>
          <Button
            v-if="puedeCrear"
            label="Registrar persona"
            icon="pi pi-plus"
            @click="crearDesdeBusqueda"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cerrar"
          severity="secondary"
          variant="text"
          @click="cerrarBuscarPersona"
        />
      </template>
    </Dialog>

    <!-- ─── Asociar persona existente ─── -->
    <Dialog
      v-model:visible="showAsociarPersona"
      header="Agregar asociación"
      modal
      :style="{ width: '95%', maxWidth: '480px' }"
    >
      <div class="flex flex-col gap-3">
        <Message v-if="errorFormAsociar" severity="error" :closable="false">
          {{ errorFormAsociar }}
        </Message>

        <div class="p-2 bg-inset border border-border-soft rounded-lg">
          <p class="font-medium m-0 truncate">
            {{ personaAsociar?.nombre }}
          </p>
          <p class="text-sm text-text-muted m-0 truncate">
            {{ personaAsociar?.email || "Sin email" }}
          </p>
        </div>

        <div class="flex flex-col gap-1">
          <label for="asociar-tipo" class="text-sm">
            ¿Cómo se incorpora? <span class="text-danger">*</span>
          </label>
          <Select
            id="asociar-tipo"
            v-model="formAsociar.asociacionTipo"
            :options="TIPOS_ASOCIACION"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            :class="{ 'p-invalid': erroresAsociar.asociacionTipo }"
          />
          <small v-if="erroresAsociar.asociacionTipo" class="text-danger">
            {{ erroresAsociar.asociacionTipo }}
          </small>
        </div>

        <template v-if="formAsociar.asociacionTipo === ASOCIACION_UNIDAD">
          <Message v-if="!hayUnidades" severity="warn" :closable="false">
            No hay unidades creadas.
          </Message>
          <div class="flex flex-col gap-1">
            <label for="asociar-unidad" class="text-sm">
              Unidad <span class="text-danger">*</span>
            </label>
            <Select
              id="asociar-unidad"
              v-model="formAsociar.unidadId"
              :options="unidades"
              optionLabel="numero"
              optionValue="id"
              placeholder="Seleccionar unidad"
              filter
              class="w-full"
              :class="{ 'p-invalid': erroresAsociar.unidadId }"
            />
            <small v-if="erroresAsociar.unidadId" class="text-danger">
              {{ erroresAsociar.unidadId }}
            </small>
          </div>
          <div class="flex flex-col gap-1">
            <label for="asociar-tipo-vinculo" class="text-sm">
              Tipo de vínculo <span class="text-danger">*</span>
            </label>
            <Select
              id="asociar-tipo-vinculo"
              v-model="formAsociar.tipoVinculo"
              :options="TIPOS_VINCULO_UNIDAD"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar tipo"
              class="w-full"
              :class="{ 'p-invalid': erroresAsociar.tipoVinculo }"
            />
            <small v-if="erroresAsociar.tipoVinculo" class="text-danger">
              {{ erroresAsociar.tipoVinculo }}
            </small>
          </div>
          <div class="flex flex-col gap-1">
            <label for="asociar-fecha" class="text-sm">
              Fecha de inicio <span class="text-danger">*</span>
            </label>
            <InputText
              id="asociar-fecha"
              v-model="formAsociar.fechaInicio"
              type="date"
              :class="{ 'p-invalid': erroresAsociar.fechaInicio }"
            />
            <small v-if="erroresAsociar.fechaInicio" class="text-danger">
              {{ erroresAsociar.fechaInicio }}
            </small>
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <Checkbox
                v-model="formAsociar.esOcupante"
                binary
                inputId="asociar-ocupante"
              />
              <label for="asociar-ocupante" class="text-sm">
                Ocupante de la unidad
              </label>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox
                v-model="formAsociar.recibeNotificaciones"
                binary
                inputId="asociar-notificaciones"
              />
              <label for="asociar-notificaciones" class="text-sm">
                Recibe notificaciones de la unidad
              </label>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox
                v-model="formAsociar.esResponsable"
                binary
                inputId="asociar-responsable"
              />
              <label for="asociar-responsable" class="text-sm">
                Responsable de la unidad
              </label>
            </div>
          </div>
        </template>

        <template v-else-if="formAsociar.asociacionTipo === ASOCIACION_CARGO">
          <div class="flex flex-col gap-1">
            <label for="asociar-cargo" class="text-sm">
              Cargo <span class="text-danger">*</span>
            </label>
            <Select
              id="asociar-cargo"
              v-model="formAsociar.cargo"
              :options="CARGOS_ASOCIABLES"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar cargo"
              class="w-full"
              :class="{ 'p-invalid': erroresAsociar.cargo }"
            />
            <small v-if="erroresAsociar.cargo" class="text-danger">
              {{ erroresAsociar.cargo }}
            </small>
          </div>
          <div class="flex flex-col gap-1">
            <label for="asociar-fecha-cargo" class="text-sm">
              Fecha de inicio <span class="text-danger">*</span>
            </label>
            <InputText
              id="asociar-fecha-cargo"
              v-model="formAsociar.fechaInicio"
              type="date"
              :class="{ 'p-invalid': erroresAsociar.fechaInicio }"
            />
            <small v-if="erroresAsociar.fechaInicio" class="text-danger">
              {{ erroresAsociar.fechaInicio }}
            </small>
          </div>
        </template>

        <template v-else-if="formAsociar.asociacionTipo === ASOCIACION_PROVEEDOR">
          <Message severity="info" :closable="false">
            El proveedor quedará registrado como membresía del condominio. Los
            datos de la empresa aún no se persisten en el backend.
          </Message>
        </template>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="cerrarAsociarPersona"
        />
        <Button
          label="Asociar"
          icon="pi pi-check"
          :loading="enviando"
          @click="guardarAsociacion"
        />
      </template>
    </Dialog>

    <!-- ─── Baja local ─── -->
    <Dialog
      v-model:visible="showDesactivar"
      header="Quitar del condominio"
      modal
      :style="{ width: '95%', maxWidth: '460px' }"
    >
      <div class="flex flex-col gap-3">
        <Message severity="warn" :closable="false">
          Esta es una baja local: se desactivan la membresía, los vínculos, los
          cargos y el acceso a este condominio. La persona y su cuenta siguen
          activas en otros condominios.
        </Message>

        <div class="p-2 bg-inset border border-border-soft rounded-lg">
          <p class="font-medium m-0 truncate">
            {{ personaDesactivar?.nombre }}
          </p>
          <p class="text-sm text-text-muted m-0 truncate">
            {{ personaDesactivar?.email || "Sin email" }}
          </p>
        </div>

        <div class="flex flex-col gap-1">
          <label for="baja-motivo" class="text-sm">Motivo (opcional)</label>
          <Textarea
            id="baja-motivo"
            v-model="formDesactivar.motivo"
            rows="3"
            maxlength="500"
            auto-resize
            placeholder="Ej: traslado a otro condominio, término de contrato…"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="cerrarDesactivar"
        />
        <Button
          label="Quitar del condominio"
          icon="pi pi-user-minus"
          severity="danger"
          :loading="enviando"
          @click="desactivarPersona"
        />
      </template>
    </Dialog>

    <!-- ─── Editar persona ─── -->
    <Dialog
      v-model:visible="showEditarPersona"
      header="Editar persona"
      modal
      :style="{ width: '95%', maxWidth: '440px' }"
    >
      <div class="flex flex-col gap-3">
        <Message v-if="errorFormEditar" severity="error" :closable="false">
          {{ errorFormEditar }}
        </Message>

        <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <span class="text-text-muted">Email:</span>
          <span class="truncate">{{ personaSeleccionada?.email || "—" }}</span>
          <span class="text-text-muted">RUT:</span>
          <span>{{ personaSeleccionada?.rut || "—" }}</span>
        </div>
        <small class="text-xs text-text-subtle">
          El RUT no se modifica. El email se cambia con la acción "Cambiar
          email".
        </small>

        <template v-if="puedeHabilitarRut">
          <Divider align="left">
            <span class="text-xs font-semibold text-text-muted"
              >Corrección de RUT</span
            >
          </Divider>

          <Skeleton v-if="cargandoRutEdicion" width="100%" height="4rem" />

          <div
            v-else-if="personaDetalle"
            class="flex flex-col gap-2 p-3 bg-inset border border-border-soft rounded-lg"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <i class="pi pi-id-card text-primary-400" />
                <span class="font-medium">Corrección de RUT</span>
                <Tag
                  :value="estadoRut.label"
                  :severity="estadoRut.severity"
                  size="small"
                />
              </div>
              <Button
                v-if="!correccionRutVigente"
                label="Habilitar"
                icon="pi pi-check"
                size="small"
                @click="abrirHabilitarRut"
              />
              <Button
                v-else
                label="Revocar"
                icon="pi pi-ban"
                severity="danger"
                variant="text"
                size="small"
                :loading="enviandoRut"
                @click="confirmarRevocarRut"
              />
            </div>
            <template v-if="correccionRut">
              <p class="text-xs text-text-muted m-0">
                Habilitada hasta el
                {{ formatearFechaHora(correccionRut.habilitadaHasta) }}
                <template v-if="correccionRut.habilitadaPorNombre">
                  · por {{ correccionRut.habilitadaPorNombre }}
                </template>
              </p>
              <p v-if="correccionRut.motivo" class="text-xs text-text-muted m-0">
                Motivo: {{ correccionRut.motivo }}
              </p>
            </template>
            <p v-else class="text-xs text-text-muted m-0">
              Sin habilitación vigente. La persona no puede solicitar
              corrección de RUT.
            </p>
            <Message
              v-if="exitoRut"
              severity="success"
              :closable="true"
              @close="exitoRut = null"
            >
              {{ exitoRut }}
            </Message>
            <Message v-if="errorRut" severity="error" :closable="false">
              {{ errorRut }}
            </Message>
          </div>

          <Message v-else-if="errorRut" severity="error" :closable="false">
            {{ errorRut }}
          </Message>
        </template>

        <div class="flex flex-col gap-1">
          <label for="editar-persona-nombre" class="text-sm">
            Nombre <span class="text-danger">*</span>
          </label>
          <InputText
            id="editar-persona-nombre"
            ref="nombreEditarRef"
            v-model="formEditarPersona.nombre"
            :class="{ 'p-invalid': erroresEdicion.nombre }"
          />
          <small v-if="erroresEdicion.nombre" class="text-danger">
            {{ erroresEdicion.nombre }}
          </small>
        </div>

        <div class="flex flex-col gap-1">
          <label for="editar-persona-telefono" class="text-sm">
            Teléfono
          </label>
          <InputText
            id="editar-persona-telefono"
            ref="telefonoEditarRef"
            v-model="formEditarPersona.telefono"
            placeholder="Ej: +56 9 1234 5678"
            maxlength="16"
            :class="{ 'p-invalid': erroresEdicion.telefono }"
            @input="
              formEditarPersona.telefono = onTelefonoInputEdicion(
                formEditarPersona.telefono,
              )
            "
            @blur="
              formEditarPersona.telefono = onTelefonoBlurEdicion(
                formEditarPersona.telefono,
              )
            "
          />
          <small v-if="erroresEdicion.telefono" class="text-danger">
            {{ erroresEdicion.telefono }}
          </small>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="cerrarEditarPersona"
        />
        <Button
          label="Guardar cambios"
          :loading="enviando"
          @click="editarPersona"
        />
      </template>
    </Dialog>

    <!-- ─── Vínculos ─── -->
    <Dialog
      v-model:visible="showVinculos"
      header="Vínculos"
      modal
      :style="{ width: '95%', maxWidth: '560px' }"
    >
      <div class="flex flex-col gap-3">
        <div
          class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
        >
          <div class="min-w-0">
            <p class="font-medium m-0 truncate">
              {{ personaSeleccionada?.nombre }}
            </p>
            <p class="text-sm text-text-muted m-0 truncate">
              {{ personaSeleccionada?.email || "Sin email" }}
            </p>
            <div class="flex flex-wrap gap-1 mt-1">
              <Tag
                v-for="t in personaDetalle?.tiposParticipacion ||
                  personaSeleccionada?.tiposParticipacion ||
                  []"
                :key="t"
                :value="labelTipoParticipacion(t)"
                :severity="severityTipoParticipacion(t)"
                size="small"
              />
              <Tag
                v-if="personaSeleccionada?.cargo"
                :value="cargoLabel(personaSeleccionada.cargo)"
                severity="secondary"
                size="small"
              />
              <Tag
                v-if="personaDetalle"
                :value="personaDetalle.usuario ? 'Con usuario' : 'Sin usuario'"
                :severity="personaDetalle.usuario ? 'success' : 'secondary'"
                size="small"
              />
            </div>
          </div>
          <Button
            v-if="puedeCrearVinculo"
            label="Nuevo vínculo"
            icon="pi pi-plus"
            @click="abrirCrearVinculo"
          />
        </div>

        <Message
          v-if="exitoVinculos"
          severity="success"
          :closable="true"
          @close="exitoVinculos = null"
        >
          {{ exitoVinculos }}
        </Message>
        <Message v-if="errorVinculos" severity="error" :closable="false">
          {{ errorVinculos }}
        </Message>

        <Skeleton v-if="cargandoVinculos" width="100%" height="6rem" />
        <div
          v-else-if="!vinculos.length"
          class="text-center text-text-muted py-4"
        >
          Sin vínculos activos
        </div>
        <div v-else class="flex flex-col gap-2">
          <div
            v-for="v in vinculos"
            :key="v.vinculoId"
            class="flex flex-col gap-2 p-2 bg-inset border border-border-soft rounded-lg sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-medium">Unidad {{ v.unidadNumero }}</span>
                <Tag
                  :value="tipoVinculoLabel(v.tipo)"
                  severity="secondary"
                  size="small"
                />
                <Tag
                  v-if="v.esOcupante"
                  value="Ocupante"
                  severity="success"
                  size="small"
                />
              </div>
              <span class="text-xs text-text-muted">
                Desde {{ formatearFecha(v.fechaInicio) }}
              </span>
            </div>
            <Button
              v-if="puedeDesvincular"
              icon="pi pi-user-minus"
              severity="danger"
              variant="text"
              size="small"
              rounded
              :title="`Desvincular de la unidad ${v.unidadNumero}`"
              :aria-label="`Desvincular de la unidad ${v.unidadNumero}`"
              @click="confirmarDesvincular(v)"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cerrar"
          severity="secondary"
          variant="text"
          @click="cerrarVinculos"
        />
      </template>
    </Dialog>

    <!-- ─── Habilitar corrección de RUT ─── -->
    <Dialog
      v-model:visible="showHabilitarRut"
      header="Habilitar corrección de RUT"
      modal
      :style="{ width: '95%', maxWidth: '440px' }"
    >
      <div class="flex flex-col gap-3">
        <Message v-if="errorFormHabilitarRut" severity="error" :closable="false">
          {{ errorFormHabilitarRut }}
        </Message>

        <p class="text-sm text-text-muted m-0">
          Se habilitará una única solicitud de corrección de RUT para
          {{ personaSeleccionada?.nombre }}. La persona verá la opción en su
          perfil hasta que la use o venza el plazo.
        </p>

        <div class="flex flex-col gap-1">
          <label for="rut-vigencia" class="text-sm">Vigencia</label>
          <Select
            id="rut-vigencia"
            v-model="formHabilitarRut.vigenciaHoras"
            :options="vigenciasRut"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label for="rut-motivo" class="text-sm">
            Motivo <span class="text-danger">*</span>
          </label>
          <Textarea
            id="rut-motivo"
            v-model="formHabilitarRut.motivo"
            rows="3"
            autoResize
            maxlength="500"
            placeholder="Ej: RUT mal ingresado en la planilla inicial"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="showHabilitarRut = false"
        />
        <Button
          label="Habilitar"
          :loading="enviandoRut"
          :disabled="!formHabilitarRut.motivo.trim()"
          @click="habilitarRut"
        />
      </template>
    </Dialog>

    <!-- ─── Nuevo vínculo (detalle) ─── -->
    <Dialog
      v-model:visible="showCrearVinculo"
      header="Nuevo vínculo"
      modal
      :style="{ width: '95%', maxWidth: '440px' }"
    >
      <div class="flex flex-col gap-3">
        <Message v-if="errorFormVinculo" severity="error" :closable="false">
          {{ errorFormVinculo }}
        </Message>

        <div class="p-2 bg-inset border border-border-soft rounded-lg">
          <p class="font-medium m-0 truncate">
            {{ personaSeleccionada?.nombre }}
          </p>
          <p class="text-sm text-text-muted m-0 truncate">
            {{ personaSeleccionada?.email || "Sin email" }}
          </p>
        </div>

        <Message v-if="!unidades.length" severity="warn" :closable="false">
          No hay unidades disponibles para vincular.
        </Message>

        <div class="flex flex-col gap-1">
          <label for="vinculo-unidad" class="text-sm">
            Unidad <span class="text-danger">*</span>
          </label>
          <Select
            id="vinculo-unidad"
            v-model="formVinculo.unidadId"
            :options="unidades"
            optionLabel="numero"
            optionValue="id"
            placeholder="Seleccionar unidad"
            filter
            :class="{ 'p-invalid': erroresVinculo.unidadId }"
          />
          <small v-if="erroresVinculo.unidadId" class="text-danger">
            {{ erroresVinculo.unidadId }}
          </small>
        </div>

        <div class="flex flex-col gap-1">
          <label for="vinculo-tipo" class="text-sm">
            Tipo de vínculo <span class="text-danger">*</span>
          </label>
          <Select
            id="vinculo-tipo"
            v-model="formVinculo.tipo"
            :options="TIPOS_VINCULO_UNIDAD"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar tipo"
            :class="{ 'p-invalid': erroresVinculo.tipo }"
          />
          <small v-if="erroresVinculo.tipo" class="text-danger">
            {{ erroresVinculo.tipo }}
          </small>
        </div>

        <div class="flex flex-col gap-1">
          <label for="vinculo-fecha" class="text-sm">
            Fecha de inicio <span class="text-danger">*</span>
          </label>
          <InputText
            id="vinculo-fecha"
            v-model="formVinculo.fechaInicio"
            type="date"
            :class="{ 'p-invalid': erroresVinculo.fechaInicio }"
          />
          <small v-if="erroresVinculo.fechaInicio" class="text-danger">
            {{ erroresVinculo.fechaInicio }}
          </small>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <Checkbox
              v-model="formVinculo.esOcupante"
              binary
              inputId="vinculo-ocupante"
            />
            <label for="vinculo-ocupante" class="text-sm">
              Ocupante de la unidad
            </label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox
              v-model="formVinculo.recibeNotificaciones"
              binary
              inputId="vinculo-notificaciones"
            />
            <label for="vinculo-notificaciones" class="text-sm">
              Recibe notificaciones de la unidad
            </label>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="cerrarCrearVinculo"
        />
        <Button
          label="Vincular persona"
          :loading="enviando"
          :disabled="!unidades.length"
          @click="crearVinculo"
        />
      </template>
    </Dialog>

    <!-- ─── Crear usuario ─── -->
    <Dialog
      v-model:visible="showCrearUsuario"
      header="Crear usuario"
      modal
      :style="{ width: '95%', maxWidth: '440px' }"
    >
      <div class="flex flex-col gap-3">
        <p class="text-sm text-text-muted m-0">
          Crear cuenta para {{ personaSeleccionada?.nombre }}. Se enviará un
          email con el link de configuración de contraseña.
        </p>

        <Message v-if="errorFormUsuario" severity="error" :closable="false">
          {{ errorFormUsuario }}
        </Message>

        <div class="flex flex-col gap-1">
          <label for="usuario-rol" class="text-sm">Rol</label>
          <Select
            id="usuario-rol"
            v-model="formUsuario.rol"
            :options="rolesUsuario"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="cerrarCrearUsuario"
        />
        <Button
          label="Crear usuario"
          :loading="enviando"
          @click="crearUsuario"
        />
      </template>
    </Dialog>

    <!-- ─── Cambiar email ─── -->
    <Dialog
      v-model:visible="showCambiarEmail"
      header="Cambiar email"
      modal
      :style="{ width: '95%', maxWidth: '480px' }"
    >
      <div class="flex flex-col gap-3">
        <Message
          v-if="errorFormCambioEmail"
          severity="error"
          :closable="false"
        >
          {{ errorFormCambioEmail }}
        </Message>

        <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <span class="text-text-muted">Persona:</span>
          <span class="truncate">{{ personaCambioEmail?.nombre }}</span>
          <span class="text-text-muted">Email actual:</span>
          <span class="truncate">{{ personaCambioEmail?.email || "—" }}</span>
        </div>

        <Message severity="info" :closable="false">
          <template v-if="esPreActivacionPersona(personaCambioEmail)">
            Se actualizará de inmediato. No se enviará correo automático;
            después usa "Reenviar setup" o "Crear usuario".
          </template>
          <template v-else>
            Se enviará un enlace al nuevo correo. La cuenta quedará pendiente
            hasta confirmar y definir una nueva contraseña.
          </template>
        </Message>

        <small class="text-xs text-text-subtle">
          El email es el identificador de acceso y afecta a esta persona en
          todos sus condominios.
        </small>

        <div class="flex flex-col gap-1">
          <label for="cambio-email-nuevo" class="text-sm">
            Nuevo email <span class="text-danger">*</span>
          </label>
          <InputText
            id="cambio-email-nuevo"
            ref="emailCambioRef"
            v-model="formCambioEmail.emailNuevo"
            type="email"
            maxlength="255"
            :class="{ 'p-invalid': erroresCambioEmail.emailNuevo }"
          />
          <small v-if="erroresCambioEmail.emailNuevo" class="text-danger">
            {{ erroresCambioEmail.emailNuevo }}
          </small>
        </div>

        <div class="flex flex-col gap-1">
          <label for="cambio-email-motivo" class="text-sm">
            Motivo <span class="text-danger">*</span>
          </label>
          <Textarea
            id="cambio-email-motivo"
            ref="motivoCambioRef"
            v-model="formCambioEmail.motivo"
            rows="3"
            maxlength="500"
            auto-resize
            :class="{ 'p-invalid': erroresCambioEmail.motivo }"
          />
          <div class="flex items-center justify-between gap-2">
            <small v-if="erroresCambioEmail.motivo" class="text-danger">
              {{ erroresCambioEmail.motivo }}
            </small>
            <small v-else class="text-text-muted">
              Mínimo 10 caracteres.
            </small>
            <small class="text-text-muted shrink-0">
              {{ formCambioEmail.motivo.length }}/500
            </small>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="cerrarCambiarEmail"
        />
        <Button
          label="Cambiar email"
          icon="pi pi-envelope"
          :loading="enviando"
          @click="cambiarEmail"
        />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>
