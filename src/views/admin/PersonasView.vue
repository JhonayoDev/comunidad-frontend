<script setup>
import { ref, computed, watch } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { personasService } from "@/services/personasService";
import { unidadesService } from "@/services/unidadesService";
import { useValidacionChile } from "@/composables/useValidacionChile";
import { mensajeError } from "@/utils/errores";
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
import Paginator from "primevue/paginator";
import { useConfirm } from "primevue/useconfirm";
import ConfirmDialog from "primevue/confirmdialog";

const auth = useAuthStore();
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

const showCrearPersona = ref(false);
const showEditarPersona = ref(false);
const showCambiarEmail = ref(false);
const showVinculos = ref(false);
const showCrearVinculo = ref(false);
const showCrearUsuario = ref(false);
const personaSeleccionada = ref(null);
const personaCambioEmail = ref(null);
const personaDetalle = ref(null);
const vinculos = ref([]);
const cargandoVinculos = ref(false);
const errorVinculos = ref(null);
const exitoVinculos = ref(null);
const enviando = ref(false);

const formPersona = ref({ nombre: "", email: "", rut: "", telefono: "" });
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
const formUsuario = ref({ rol: "RESIDENTE" });

const errorFormPersona = ref(null);
const errorFormEditar = ref(null);
const errorFormCambioEmail = ref(null);
const errorFormVinculo = ref(null);
const errorFormUsuario = ref(null);
const erroresVinculo = ref({});

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

const tiposVinculo = [
  { label: "Propietario", value: "PROPIETARIO" },
  { label: "Arrendatario", value: "ARRENDATARIO" },
  { label: "Residente adicional", value: "RESIDENTE_ADICIONAL" },
];

const rolesUsuario = [
  { label: "Residente", value: "RESIDENTE" },
  { label: "Guardia", value: "GUARDIA" },
];

const tipoVinculoLabels = Object.fromEntries(
  tiposVinculo.map((tipo) => [tipo.value, tipo.label]),
);

const cargoLabels = {
  ADMINISTRADOR: "Administrador",
  PRESIDENTE: "Presidente",
  TESORERO: "Tesorero",
  SECRETARIO: "Secretario",
  DELEGADO: "Delegado",
  CONSERJE: "Conserje",
  GUARDIA: "Guardia",
  MANTENCION: "Mantención",
  JARDINERO: "Jardinero",
};

const puedeCrear = computed(() => auth.permisos.includes("PERSONA_CREAR"));
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

const personasFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase();
  if (!q) return personas.value;
  return personas.value.filter((p) =>
    [p.nombre, p.email, p.rut, p.telefono, p.cargo].some((valor) =>
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
    const { data } = await personasService.listar(cid);
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
    errorCarga.value = mensajeError(
      e,
      "No se pudieron cargar las personas",
    );
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

watch(busqueda, () => {
  pagina.value = 0;
});

watch(personasFiltradas, (lista) => {
  const maxPagina = Math.max(0, Math.ceil(lista.length / TAMANO_PAGINA) - 1);
  if (pagina.value > maxPagina) pagina.value = maxPagina;
});

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

function cargoLabel(cargo) {
  if (!cargo) return "";
  return cargoLabels[cargo] || cargo;
}

function tipoVinculoLabel(tipo) {
  if (!tipo) return "";
  return tipoVinculoLabels[tipo] || tipo;
}

function formatearFecha(valor) {
  if (!valor) return "—";
  const texto = String(valor).slice(0, 10);
  const [anio, mes, dia] = texto.split("-");
  if (!anio || !mes || !dia) return texto;
  return `${dia}/${mes}/${anio}`;
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
    puedeDesactivar.value ||
    (puedeGestionarUsuario.value &&
      (!persona.tieneUsuario ||
        (persona.tieneUsuario && !persona.passwordSetAt)))
  );
}

function abrirCrear() {
  if (!puedeCrear.value) return;
  formPersona.value = { nombre: "", email: "", rut: "", telefono: "" };
  erroresPersona.value = {};
  errorFormPersona.value = null;
  showCrearPersona.value = true;
}

function cerrarCrearPersona() {
  showCrearPersona.value = false;
  errorFormPersona.value = null;
  erroresPersona.value = {};
}

function validarFormularioPersona() {
  erroresPersona.value = {};
  validarNombre(formPersona.value.nombre);
  validarEmail(formPersona.value.email);
  validarRut(formPersona.value.rut);
  validarTelefono(formPersona.value.telefono);
  return Object.keys(erroresPersona.value).length === 0;
}

async function crearPersona() {
  const cid = auth.condominioActualId;
  if (!cid) return;
  if (!validarFormularioPersona()) {
    focusPrimerError([
      ["nombre", nombreCrearRef],
      ["email", emailCrearRef],
      ["rut", rutCrearRef],
      ["telefono", telefonoCrearRef],
    ]);
    return;
  }

  enviando.value = true;
  errorFormPersona.value = null;

  try {
    await personasService.crear(cid, {
      nombre: formPersona.value.nombre.trim(),
      email: normalizarEmail(formPersona.value.email),
      rut: formPersona.value.rut
        ? normalizarRut(formPersona.value.rut)
        : null,
      telefono: formPersona.value.telefono
        ? normalizarTelefono(formPersona.value.telefono)
        : null,
    });
    showCrearPersona.value = false;
    exito.value = "Persona creada correctamente.";
    await cargar();
  } catch (e) {
    console.error("Error al crear persona", e);
    errorFormPersona.value = mensajeError(e, "Error al crear persona");
    aplicarErroresBackend(e, erroresPersona);
  } finally {
    enviando.value = false;
  }
}

function abrirEditar(persona) {
  if (!puedeEditar.value) return;
  personaSeleccionada.value = persona;
  formEditarPersona.value = {
    nombre: persona.nombre || "",
    telefono: persona.telefono || "",
  };
  erroresEdicion.value = {};
  errorFormEditar.value = null;
  showEditarPersona.value = true;
}

function cerrarEditarPersona() {
  showEditarPersona.value = false;
  personaSeleccionada.value = null;
  errorFormEditar.value = null;
  erroresEdicion.value = {};
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
    personaSeleccionada.value = null;
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
      data?.mensaje ||
      "Se reenvió el correo de verificación al nuevo email.";
    await cargar();
  } catch (e) {
    console.error("Error al reenviar verificación", e);
    errorAccion.value = mensajeError(
      e,
      "No se pudo reenviar la verificación",
    );
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

function confirmarDesactivar(persona) {
  if (!puedeDesactivar.value) return;
  confirm.require({
    message: `¿Desactivar a ${persona.nombre}? También se desactivarán sus vínculos, cargos y usuario en este condominio.`,
    header: "Confirmar desactivación",
    acceptLabel: "Desactivar",
    rejectLabel: "Cancelar",
    acceptClass: "p-button-danger",
    accept: () => desactivarPersona(persona),
  });
}

async function desactivarPersona(persona) {
  const cid = auth.condominioActualId;
  if (!cid) return;

  errorAccion.value = null;
  exito.value = null;

  try {
    await personasService.desactivar(cid, persona.id);
    exito.value = "Persona desactivada correctamente.";
    if (personaSeleccionada.value?.id === persona.id) {
      personaSeleccionada.value = null;
      personaDetalle.value = null;
      vinculos.value = [];
    }
    await cargar();
  } catch (e) {
    console.error("Error al desactivar persona", e);
    errorAccion.value = mensajeError(e, "Error al desactivar persona");
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
  personaSeleccionada.value = null;
  personaDetalle.value = null;
  vinculos.value = [];
  errorVinculos.value = null;
  exitoVinculos.value = null;
}

function abrirCrearVinculo() {
  if (!puedeCrearVinculo.value || !personaSeleccionada.value) return;
  formVinculo.value = {
    personaId: personaSeleccionada.value.id,
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

function cerrarCrearVinculo() {
  showCrearVinculo.value = false;
  errorFormVinculo.value = null;
  erroresVinculo.value = {};
  if (personaSeleccionada.value) showVinculos.value = true;
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
    await verVinculos(persona);
    exitoVinculos.value = "Vínculo creado correctamente.";
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
      <Button
        v-if="puedeCrear"
        label="Nueva persona"
        icon="pi pi-plus"
        @click="abrirCrear"
      />
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
        <InputText
          v-model="busqueda"
          placeholder="Buscar por nombre, email o RUT..."
          aria-label="Buscar personas"
          class="w-full"
        />
      </template>
    </Card>

    <Skeleton v-if="loading" width="100%" height="300px" />
    <Message v-else-if="errorCarga" severity="error">
      {{ errorCarga }}
    </Message>

    <template v-else>
      <div
        v-if="!personas.length"
        class="text-center text-text-muted py-8"
      >
        No hay personas registradas
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
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-medium truncate">{{ p.nombre }}</span>
                  <Tag
                    v-if="p.cargo"
                    :value="cargoLabel(p.cargo)"
                    severity="secondary"
                    size="small"
                  />
                  <Tag
                    :value="estadoUsuarioPersona(p).label"
                    :severity="estadoUsuarioPersona(p).severity"
                    size="small"
                  />
                </div>
                <span class="text-sm text-text-muted truncate">
                  {{ p.email || "Sin email" }}
                </span>
                <span
                  v-if="p.emailCambioPendiente"
                  class="text-xs text-text-muted truncate"
                >
                  Pendiente: {{ p.emailCambioPendiente }}
                </span>
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
                  v-if="puedeDesactivar"
                  icon="pi pi-trash"
                  severity="danger"
                  variant="text"
                  size="small"
                  rounded
                  :title="`Desactivar a ${p.nombre}`"
                  :aria-label="`Desactivar a ${p.nombre}`"
                  @click="confirmarDesactivar(p)"
                />
              </div>
            </div>

            <div
              class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm mt-3"
            >
              <span class="text-text-muted">RUT:</span>
              <span>{{ p.rut || "—" }}</span>
              <span class="text-text-muted">Teléfono:</span>
              <span>{{ p.telefono || "—" }}</span>
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
                <th>Estado</th>
                <th>Cargo</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in personasPagina" :key="p.id">
                <td>
                  <span class="font-medium">{{ p.nombre }}</span>
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
                  <Tag
                    :value="estadoUsuarioPersona(p).label"
                    :severity="estadoUsuarioPersona(p).severity"
                    size="small"
                  />
                </td>
                <td>
                  <Tag
                    v-if="p.cargo"
                    :value="cargoLabel(p.cargo)"
                    severity="secondary"
                    size="small"
                  />
                  <span v-else class="text-text-muted">—</span>
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
                      v-if="puedeDesactivar"
                      icon="pi pi-trash"
                      severity="danger"
                      variant="text"
                      size="small"
                      rounded
                      :title="`Desactivar a ${p.nombre}`"
                      :aria-label="`Desactivar a ${p.nombre}`"
                      @click="confirmarDesactivar(p)"
                    />
                    <span
                      v-if="!tieneAcciones(p)"
                      class="text-text-muted"
                    >
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

    <Dialog
      v-model:visible="showCrearPersona"
      header="Nueva persona"
      modal
      :style="{ width: '95%', maxWidth: '440px' }"
    >
      <div class="flex flex-col gap-3">
        <Message v-if="errorFormPersona" severity="error" :closable="false">
          {{ errorFormPersona }}
        </Message>

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
          />
          <small v-if="erroresPersona.email" class="text-danger">
            {{ erroresPersona.email }}
          </small>
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
              @input="formPersona.telefono = onTelefonoInput(formPersona.telefono)"
              @blur="formPersona.telefono = onTelefonoBlur(formPersona.telefono)"
            />
            <small v-if="erroresPersona.telefono" class="text-danger">
              {{ erroresPersona.telefono }}
            </small>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="cerrarCrearPersona"
        />
        <Button
          label="Crear persona"
          :loading="enviando"
          @click="crearPersona"
        />
      </template>
    </Dialog>

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

        <Message
          v-if="!unidades.length"
          severity="warn"
          :closable="false"
        >
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
            :options="tiposVinculo"
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
