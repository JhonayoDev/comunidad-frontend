import { getCurrentScope, onScopeDispose, ref, watch } from "vue";

/**
 * Ref con una copia "debounced".
 *
 * Útil para disparar consultas costosas (p. ej. la búsqueda de identidad
 * global) sin hacer una petición por tecla. El valor original se lee al
 * instante (`valor`), la copia se actualiza tras `espera` ms sin cambios.
 *
 * Se puede forzar con `flush()` (aplica lo pendiente ya), descartar con
 * `cancelar()` o fijar ambos valores con `fijar()` (para limpiar o
 * sincronizar desde la URL).
 */
export function useDebouncedRef(valorInicial = "", espera = 350) {
  const valor = ref(valorInicial);
  const valorDebounced = ref(valorInicial);
  let temporizador = null;

  function cancelar() {
    if (temporizador !== null) {
      clearTimeout(temporizador);
      temporizador = null;
    }
  }

  watch(valor, (nuevo) => {
    cancelar();
    temporizador = setTimeout(() => {
      temporizador = null;
      valorDebounced.value = nuevo;
    }, espera);
  });

  function flush() {
    cancelar();
    valorDebounced.value = valor.value;
  }

  function fijar(nuevo) {
    valor.value = nuevo;
    flush();
  }

  if (getCurrentScope()) {
    onScopeDispose(cancelar);
  }

  return { valor, valorDebounced, flush, cancelar, fijar };
}
