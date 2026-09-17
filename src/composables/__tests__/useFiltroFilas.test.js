import { describe, it, expect } from "vitest";
import { ref } from "vue";
import { useFiltroFilas, cumpleFiltroFila } from "@/composables/useFiltroFilas";

const filas = [
  { numeroFila: 1, estado: "OK", advertencias: [] },
  { numeroFila: 2, estado: "ERROR", errores: ["Email inválido"] },
  { numeroFila: 3, estado: "OK", advertencias: ["nombre ignorado"] },
  { numeroFila: 4, estado: "OMITIDA", advertencias: null },
  { numeroFila: 5, estado: "OK" }, // sin clave advertencias
];

describe("useFiltroFilas", () => {
  it("cuenta por grupo y tolera advertencias null/ausente", () => {
    const { conteos } = useFiltroFilas(ref(filas));
    expect(conteos.value).toEqual({
      todos: 5,
      atencion: 2, // fila 2 (ERROR) + fila 3 (OK con advertencia)
      errores: 1,
      advertencias: 1,
      omitidas: 1,
    });
  });

  it("atencion une errores y advertencias sin duplicar", () => {
    const { conteos } = useFiltroFilas(ref(filas));
    // fila 2 (ERROR) + fila 3 (OK+adv) = 2
    expect(conteos.value.atencion).toBe(2);
  });

  it("default es atencion si hay algo que atender, si no todos", () => {
    const { filtro } = useFiltroFilas(ref(filas));
    expect(filtro.value).toBe("atencion");
    const { filtro: f2 } = useFiltroFilas(
      ref([{ numeroFila: 1, estado: "OK" }]),
    );
    expect(f2.value).toBe("todos");
  });

  it("filtra por cada tab", () => {
    const { filasFiltradas, setFiltro } = useFiltroFilas(ref(filas));
    setFiltro("errores");
    expect(filasFiltradas.value.map((f) => f.numeroFila)).toEqual([2]);
    setFiltro("advertencias");
    expect(filasFiltradas.value.map((f) => f.numeroFila)).toEqual([3]);
    setFiltro("omitidas");
    expect(filasFiltradas.value.map((f) => f.numeroFila)).toEqual([4]);
    setFiltro("atencion");
    expect(filasFiltradas.value.map((f) => f.numeroFila)).toEqual([2, 3]);
    setFiltro("todos");
    expect(filasFiltradas.value).toHaveLength(5);
  });

  it("cumpleFiltroFila tolera fila null", () => {
    expect(cumpleFiltroFila(null, "advertencias")).toBe(false);
    expect(cumpleFiltroFila(null, "todos")).toBe(true);
  });
});
