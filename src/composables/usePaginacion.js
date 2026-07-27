import { ref, computed } from "vue";

export function usePaginacion(defaultSize = 20) {
  const pagina = ref(0);
  const tamano = ref(defaultSize);
  const totalPaginas = ref(0);
  const totalElementos = ref(0);
  const primera = ref(true);
  const ultima = ref(true);
  const contenido = ref([]);

  function actualizar(pageResponse) {
    contenido.value = pageResponse.content || [];
    pagina.value = pageResponse.page ?? 0;
    tamano.value = pageResponse.size ?? defaultSize;
    totalPaginas.value = pageResponse.totalPages ?? 0;
    totalElementos.value = pageResponse.totalElements ?? 0;
    primera.value = pageResponse.first ?? true;
    ultima.value = pageResponse.last ?? true;
  }

  function alCambiarPagina(event) {
    pagina.value = event.page;
    tamano.value = event.rows;
  }

  function reiniciar() {
    pagina.value = 0;
  }

  const paramsPaginacion = computed(() => ({
    page: pagina.value,
    size: tamano.value,
  }));

  return {
    pagina,
    tamano,
    totalPaginas,
    totalElementos,
    primera,
    ultima,
    contenido,
    actualizar,
    alCambiarPagina,
    reiniciar,
    paramsPaginacion,
  };
}
