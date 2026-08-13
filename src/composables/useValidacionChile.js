import { ref } from "vue";
import {
  formatearRut,
  formatearRutCompleto,
  rutValido,
  normalizarRut,
  formatearTelefono,
  telefonoChileValido,
  normalizarTelefono,
  emailValido,
  normalizarEmail,
  nombreValido,
} from "@/utils/validadoresChile";

export function useValidacionChile() {
  const errores = ref({});

  function limpiarError(campo) {
    delete errores.value[campo];
  }

  function validarNombre(valor, campo = "nombre", mensaje = "Ingresa un nombre válido (mínimo 2 caracteres)") {
    if (!nombreValido(valor)) {
      errores.value[campo] = mensaje;
      return false;
    }
    limpiarError(campo);
    return true;
  }

  function validarRut(valor, campo = "rut", mensaje = "Ingresa un RUT válido (ej: 12.345.678-9)") {
    if (valor && !rutValido(valor)) {
      errores.value[campo] = mensaje;
      return false;
    }
    limpiarError(campo);
    return true;
  }

  function validarEmail(valor, campo = "email", mensaje = "Ingresa un email válido (ej: nombre@dominio.cl)") {
    if (!emailValido(valor)) {
      errores.value[campo] = mensaje;
      return false;
    }
    limpiarError(campo);
    return true;
  }

  function validarTelefono(valor, campo = "telefono", mensaje = "Ingresa un teléfono válido (ej: +56 9 1234 5678)") {
    if (valor && !telefonoChileValido(valor)) {
      errores.value[campo] = mensaje;
      return false;
    }
    limpiarError(campo);
    return true;
  }

  const onRutInput = (valor) => formatearRut(valor);
  const onRutBlur = (valor) => formatearRutCompleto(valor);
  const onTelefonoInput = (valor) => formatearTelefono(valor);
  const onTelefonoBlur = (valor) => formatearTelefono(valor);

  function focusPrimerError(orden) {
    const primero = orden.find(([campo]) => errores.value[campo]);
    if (primero && primero[1].value) {
      primero[1].value.$el.focus();
    }
  }

  return {
    errores,
    validarNombre,
    validarRut,
    validarEmail,
    validarTelefono,
    onRutInput,
    onRutBlur,
    onTelefonoInput,
    onTelefonoBlur,
    focusPrimerError,
    normalizarRut,
    normalizarTelefono,
    normalizarEmail,
  };
}