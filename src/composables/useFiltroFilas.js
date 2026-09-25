import { ref, computed, watch } from "vue";

// Filtro client-side por estado de fila del preview/resultado (FE-3).
// Fuente: array de {estado, advertencias[]} (FilaPreview del backend o vista
// unificada staging+preview). No hace llamadas: solo visual.
// `advertencias[]` null se trata como sin advertencias (BE-4 pendiente).
export const FILTROS_FILA = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "atencion", etiqueta: "Requieren atención" },
  { valor: "errores", etiqueta: "Solo errores" },
  { valor: "advertencias", etiqueta: "Con advertencias" },
  { valor: "omitidas", etiqueta: "Omitidas" },
];

export function cumpleFiltroFila(f, filtro) {
  switch (filtro) {
    case "errores":
      return f?.estado === "ERROR";
    case "advertencias":
      return (f?.advertencias || []).length > 0;
    case "omitidas":
      return f?.estado === "OMITIDA";
    case "atencion":
      return f?.estado === "ERROR" || (f?.advertencias || []).length > 0;
    default:
      return true;
  }
}

export function useFiltroFilas(fuente) {
  const filas = typeof fuente === "function" ? computed(fuente) : fuente;
  const filtro = ref("todos");
  const fijadoManual = ref(false);

  const conteos = computed(() => {
    const lista = filas.value || [];
    const errores = lista.filter((f) => f?.estado === "ERROR").length;
    const advertencias = lista.filter((f) => (f?.advertencias || []).length > 0).length;
    const omitidas = lista.filter((f) => f?.estado === "OMITIDA").length;
    const atencion = lista.filter(
      (f) => f?.estado === "ERROR" || (f?.advertencias || []).length > 0,
    ).length;
    return { todos: lista.length, atencion, errores, advertencias, omitidas };
  });

  // Default: atención si hay algo que atender, si no todos.
  // Solo auto mientras el usuario no haya fijado un filtro manualmente.
  watch(
    () => conteos.value.atencion > 0,
    (hay) => {
      if (fijadoManual.value) return;
      filtro.value = hay ? "atencion" : "todos";
    },
    { immediate: true },
  );

  function setFiltro(v) {
    fijadoManual.value = true;
    filtro.value = v;
  }

  const filasFiltradas = computed(() =>
    (filas.value || []).filter((f) => cumpleFiltroFila(f, filtro.value)),
  );

  return { filtro, conteos, filasFiltradas, setFiltro, cumpleFiltroFila, FILTROS_FILA };
}
