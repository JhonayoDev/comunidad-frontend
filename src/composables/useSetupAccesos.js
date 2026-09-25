import { ref, reactive, computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { encomiendasService } from "@/services/encomiendasService";
import { compararUnidades } from "@/utils/ordenamientoNatural";

let contador = 0;
function uid(prefijo) {
  contador += 1;
  return `${prefijo}-${Date.now()}-${contador}`;
}

export const NOMBRE_ACCESO_MAX = 25;

// Gestión de puntos de recepción de encomiendas (etapa del wizard).
// Espejo de useSetupSectores: catálogo simple (nombre + activo), sin batch en
// el backend. Salvaguardas del backend (V36):
//  - Nombre duplicado (ignore-case, solo activos) → 400 con mensaje.
//  - Desactivar libera el nombre → se puede recrear.
//  - DELETE desactiva (soft); sin 409 de uso (a diferencia de sectores/pisos).
export function useSetupAccesos() {
  const auth = useAuthStore();
  const cid = auth.condominioActualId;

  const cargando = ref(true);
  const enviando = ref(false);
  const error = ref(null);
  const resultado = ref(null);
  const accesosHabilitados = ref(true);

  const estado = reactive({
    // [{ id, nombre, error, accesoId, esNuevo, marcadoEliminar, original }]
    items: [],
  });

  function ordenarAccesos() {
    estado.items.sort((a, b) => compararUnidades(a.nombre, b.nombre));
  }

  function agregarFila() {
    estado.items.push({
      id: uid("acceso"),
      nombre: "",
      error: null,
      accesoId: null,
      esNuevo: true,
      marcadoEliminar: false,
      original: null,
    });
  }

  function eliminarFila(item) {
    if (item.accesoId) {
      // Existente en backend → se marca para desactivar al guardar.
      item.marcadoEliminar = true;
      item.error = null;
    } else {
      const idx = estado.items.findIndex((x) => x.id === item.id);
      if (idx !== -1) estado.items.splice(idx, 1);
    }
  }

  function cambiado(x) {
    const o = x.original;
    if (!o) return false;
    return o.nombre !== x.nombre;
  }

  const itemsValidos = computed(() => {
    const activos = estado.items.filter((x) => !x.marcadoEliminar);
    // "Eliminar todo" es válido: se guardan las desactivaciones.
    if (!activos.length) return estado.items.some((x) => x.marcadoEliminar);
    const nombres = activos.map((x) => (x.nombre || "").trim());
    if (nombres.some((n) => !n)) return false;
    if (nombres.some((n) => n.length > NOMBRE_ACCESO_MAX)) return false;
    return new Set(nombres.map((n) => n.toLowerCase())).size === nombres.length;
  });

  const tieneErrores = computed(() => estado.items.some((x) => x.error));

  // Cambios pendientes (el botón Guardar refleja estado, no solo validez):
  // nuevas + editadas + marcadas para eliminar.
  const pendientes = computed(() => {
    const nuevas = estado.items.filter((x) => x.esNuevo && !x.marcadoEliminar).length;
    const editadas = estado.items.filter(
      (x) => !x.esNuevo && !x.marcadoEliminar && cambiado(x),
    ).length;
    const eliminadas = estado.items.filter((x) => x.marcadoEliminar && x.accesoId).length;
    return { nuevas, editadas, eliminadas, total: nuevas + editadas + eliminadas };
  });

  const hayCambios = computed(() => pendientes.value.total > 0);

  async function cargar() {
    cargando.value = true;
    error.value = null;
    try {
      if (cid) {
        try {
          const { data } = await encomiendasService.getAccesosEncomiendas(cid);
          const accesos = Array.isArray(data) ? data.filter((a) => a.activo !== false) : [];
          estado.items = accesos.map((a) => ({
            id: uid("acceso"),
            nombre: a.nombre ?? "",
            error: null,
            accesoId: a.id,
            esNuevo: false,
            marcadoEliminar: false,
            original: { nombre: a.nombre ?? "" },
          }));
          accesosHabilitados.value = true;
          ordenarAccesos();
        } catch (e) {
          if (e?.response?.status === 403) {
            // Sin ENCOMIENDA_VER (p.ej. cargo ADMINISTRADOR residente, que no
            // tiene ENCOMIENDA_CONFIGURAR por diseño V36): aviso y vista vacía.
            accesosHabilitados.value = false;
            estado.items = [];
          } else {
            console.error("Error al cargar los accesos", e);
            error.value = "No se pudieron cargar los accesos";
          }
        }
      }
    } finally {
      cargando.value = false;
    }
  }

  async function guardar() {
    if (!cid || !estado.items.length) return false;
    enviando.value = true;
    error.value = null;
    let creados = 0;
    let actualizados = 0;
    let eliminados = 0;
    let hayErrores = false;
    try {
      const activos = estado.items.filter((x) => !x.marcadoEliminar);

      // 1) Filas nuevas → POST individual (una falla no aborta el resto)
      for (const x of activos.filter((i) => i.esNuevo)) {
        try {
          const { data } = await encomiendasService.crearAccesoEncomiendas(cid, {
            nombre: x.nombre.trim(),
          });
          x.accesoId = data.id;
          x.esNuevo = false;
          x.original = { nombre: x.nombre };
          creados += 1;
        } catch (e) {
          x.error = e?.response?.data?.message || `No se pudo crear el acceso ${x.nombre}`;
          hayErrores = true;
        }
      }

      // 2) Existentes con cambios → PUT (el backend valida dedupe entre activos)
      for (const x of activos.filter((i) => !i.esNuevo && cambiado(i))) {
        try {
          await encomiendasService.actualizarAccesoEncomiendas(cid, x.accesoId, {
            nombre: x.nombre.trim(),
          });
          x.original = { nombre: x.nombre };
          actualizados += 1;
        } catch (e) {
          x.error = e?.response?.data?.message || `No se pudo actualizar el acceso ${x.nombre}`;
          hayErrores = true;
        }
      }

      // 3) Marcados para eliminar → DELETE (soft adentro, sin 409 de uso)
      const aEliminar = estado.items.filter((x) => x.marcadoEliminar && x.accesoId);
      for (const x of aEliminar) {
        try {
          await encomiendasService.eliminarAccesoEncomiendas(cid, x.accesoId);
          eliminados += 1;
          const idx = estado.items.findIndex((i) => i.id === x.id);
          if (idx !== -1) estado.items.splice(idx, 1);
        } catch (e) {
          // La desactivación falló → la fila vuelve a su estado normal
          // (NO quedó eliminada) y se muestra el error.
          x.marcadoEliminar = false;
          x.error = e?.response?.data?.message || `No se pudo eliminar el acceso ${x.nombre}`;
          hayErrores = true;
        }
      }

      resultado.value = { creados, actualizados, eliminados };
      ordenarAccesos();
      return !hayErrores;
    } catch (e) {
      console.error("Error al guardar los accesos", e);
      error.value = e?.response?.data?.message || "No se pudieron guardar los accesos";
      return false;
    } finally {
      enviando.value = false;
    }
  }

  return reactive({
    cid,
    cargando,
    enviando,
    error,
    resultado,
    accesosHabilitados,
    estado,
    itemsValidos,
    tieneErrores,
    pendientes,
    hayCambios,
    ordenarAccesos,
    agregarFila,
    eliminarFila,
    cambiado,
    cargar,
    guardar,
  });
}
