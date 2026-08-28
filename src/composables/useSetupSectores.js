import { ref, reactive, computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { unidadesService } from "@/services/unidadesService";
import { compararUnidades } from "@/utils/ordenamientoNatural";

let contador = 0;
function uid(prefijo) {
  contador += 1;
  return `${prefijo}-${Date.now()}-${contador}`;
}

// Vista de gestión de sectores (etapa 2 del wizard de configuración).
// Lista los sectores activos y permite crear, editar (nombre/descripción) y
// desactivar. Salvaguardas del backend (V65):
//  - Desactivar un sector en uso (unidades/bodegas/estacionamientos/espacios
//    comunes activos) → 409 con mensaje de conteo (mapeado a la fila).
//  - Desactivar libera el nombre → se puede recrear (dedupe AndActivoTrue).
//  - Reactivar (PUT activo=true) con nombre ocupado por un activo → 409.
export function useSetupSectores() {
  const auth = useAuthStore();
  const cid = auth.condominioActualId;

  const cargando = ref(true);
  const enviando = ref(false);
  const error = ref(null);
  const resultado = ref(null);
  const sectoresHabilitados = ref(true);

  const estado = reactive({
    // [{ id, nombre, descripcion, error, sectorId, esNuevo, marcadoEliminar, original }]
    items: [],
  });

  function ordenarSectores() {
    estado.items.sort((a, b) => compararUnidades(a.nombre, b.nombre));
  }

  function agregarFila() {
    estado.items.push({
      id: uid("sector"),
      nombre: "",
      descripcion: "",
      error: null,
      sectorId: null,
      esNuevo: true,
      marcadoEliminar: false,
      original: null,
    });
  }

  function eliminarFila(item) {
    if (item.sectorId) {
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
    return o.nombre !== x.nombre || o.descripcion !== x.descripcion;
  }

  const itemsValidos = computed(() => {
    const activos = estado.items.filter((x) => !x.marcadoEliminar);
    // "Eliminar todo" es válido: se guardan las desactivaciones.
    if (!activos.length) return estado.items.some((x) => x.marcadoEliminar);
    const nombres = activos.map((x) => (x.nombre || "").trim());
    if (nombres.some((n) => !n)) return false;
    return new Set(nombres).size === nombres.length;
  });

  const tieneErrores = computed(() => estado.items.some((x) => x.error));

  async function cargar() {
    cargando.value = true;
    error.value = null;
    try {
      if (cid) {
        try {
          const { data } = await unidadesService.getSectores(cid);
          const sectores = Array.isArray(data) ? data.filter((s) => s.activo !== false) : [];
          estado.items = sectores.map((s) => ({
            id: uid("sector"),
            nombre: s.nombre ?? "",
            descripcion: s.descripcion ?? "",
            error: null,
            sectorId: s.id,
            esNuevo: false,
            marcadoEliminar: false,
            original: { nombre: s.nombre ?? "", descripcion: s.descripcion ?? "" },
          }));
          sectoresHabilitados.value = true;
          ordenarSectores();
        } catch (e) {
          if (e?.response?.status === 403) {
            // El cargo ADMINISTRADOR (residente) no tiene SECTOR_* (V62 solo
            // los da al rol ADMINISTRADOR y a PRESIDENTE/SECRETARIO/CONSERJE/GUARDIA).
            sectoresHabilitados.value = false;
            estado.items = [];
          } else {
            console.error("Error al cargar los sectores", e);
            error.value = "No se pudieron cargar los sectores";
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
          const { data } = await unidadesService.crearSector(cid, {
            nombre: x.nombre.trim(),
            descripcion: (x.descripcion || "").trim(),
          });
          x.sectorId = data.id;
          x.esNuevo = false;
          x.original = { nombre: x.nombre, descripcion: x.descripcion };
          creados += 1;
        } catch (e) {
          x.error = e?.response?.data?.message || `No se pudo crear el sector ${x.nombre}`;
          hayErrores = true;
        }
      }

      // 2) Existentes con cambios → PUT (activo: true; el backend valida el
      //    dedupe solo entre activos y la reactivación con nombre ocupado)
      for (const x of activos.filter((i) => !i.esNuevo && cambiado(i))) {
        try {
          await unidadesService.actualizarSector(cid, x.sectorId, {
            nombre: x.nombre.trim(),
            descripcion: (x.descripcion || "").trim(),
            activo: true,
          });
          x.original = { nombre: x.nombre, descripcion: x.descripcion };
          actualizados += 1;
        } catch (e) {
          x.error = e?.response?.data?.message || `No se pudo actualizar el sector ${x.nombre}`;
          hayErrores = true;
        }
      }

      // 3) Marcados para eliminar → desactivar (409 si está en uso)
      const aEliminar = estado.items.filter((x) => x.marcadoEliminar && x.sectorId);
      for (const x of aEliminar) {
        try {
          await unidadesService.desactivarSector(cid, x.sectorId);
          eliminados += 1;
          const idx = estado.items.findIndex((i) => i.id === x.id);
          if (idx !== -1) estado.items.splice(idx, 1);
        } catch (e) {
          // La desactivación falló (p.ej. 409: sector en uso) → la fila vuelve
          // a su estado normal (NO quedó eliminada) y se muestra el error.
          x.marcadoEliminar = false;
          x.error = e?.response?.data?.message || `No se pudo eliminar el sector ${x.nombre}`;
          hayErrores = true;
        }
      }

      resultado.value = { creados, actualizados, eliminados };
      ordenarSectores();
      return !hayErrores;
    } catch (e) {
      console.error("Error al guardar los sectores", e);
      error.value = e?.response?.data?.message || "No se pudieron guardar los sectores";
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
    sectoresHabilitados,
    estado,
    itemsValidos,
    tieneErrores,
    ordenarSectores,
    agregarFila,
    eliminarFila,
    cambiado,
    cargar,
    guardar,
  });
}