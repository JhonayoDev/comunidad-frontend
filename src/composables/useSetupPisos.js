import { ref, reactive, computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { unidadesService } from "@/services/unidadesService";

let contador = 0;
function uid(prefijo) {
  contador += 1;
  return `${prefijo}-${Date.now()}-${contador}`;
}

// Vista de gestión de pisos (catálogo declarativo del condominio).
// Lista los pisos activos y permite crear, editar (número/nombre/descripción)
// y desactivar. Salvaguardas del backend (V66):
//  - Desactivar un piso en uso (unidades/bodegas/estacionamientos/espacios
//    comunes activos con ese `piso`) → 409 con mensaje de conteo (mapeado a la
//    fila; la fila revierte `marcadoEliminar=false`).
//  - Desactivar libera el número → se puede recrear (dedupe AndActivoTrue).
//  - Reactivar (PUT activo=true) con número ocupado por un activo → 409.
//  - `numero` puede ser negativo (subterráneos); el listado ordena por número.
export function useSetupPisos() {
  const auth = useAuthStore();
  const cid = auth.condominioActualId;

  const cargando = ref(true);
  const enviando = ref(false);
  const error = ref(null);
  const resultado = ref(null);
  const pisosHabilitados = ref(true);

  const estado = reactive({
    // [{ id, numero, nombre, descripcion, error, pisoId, esNuevo, marcadoEliminar, original }]
    items: [],
  });

  function ordenarPisos() {
    estado.items.sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
  }

  function agregarFila() {
    estado.items.push({
      id: uid("piso"),
      numero: null,
      nombre: "",
      descripcion: "",
      error: null,
      pisoId: null,
      esNuevo: true,
      marcadoEliminar: false,
      original: null,
    });
  }

  function eliminarFila(item) {
    if (item.pisoId) {
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
    return o.numero !== x.numero || o.nombre !== x.nombre || o.descripcion !== x.descripcion;
  }

  const itemsValidos = computed(() => {
    const activos = estado.items.filter((x) => !x.marcadoEliminar);
    // "Eliminar todo" es válido: se guardan las desactivaciones.
    if (!activos.length) return estado.items.some((x) => x.marcadoEliminar);
    const numeros = activos.map((x) => x.numero);
    if (numeros.some((n) => n === null || n === undefined)) return false;
    return new Set(numeros).size === numeros.length;
  });

  const tieneErrores = computed(() => estado.items.some((x) => x.error));

  async function cargar() {
    cargando.value = true;
    error.value = null;
    try {
      if (cid) {
        try {
          const { data } = await unidadesService.getPisos(cid);
          const pisos = Array.isArray(data) ? data.filter((p) => p.activo !== false) : [];
          estado.items = pisos.map((p) => ({
            id: uid("piso"),
            numero: p.numero ?? null,
            nombre: p.nombre ?? "",
            descripcion: p.descripcion ?? "",
            error: null,
            pisoId: p.id,
            esNuevo: false,
            marcadoEliminar: false,
            original: {
              numero: p.numero ?? null,
              nombre: p.nombre ?? "",
              descripcion: p.descripcion ?? "",
            },
          }));
          pisosHabilitados.value = true;
          ordenarPisos();
        } catch (e) {
          if (e?.response?.status === 403) {
            // Sin permiso PISO_VER (cargo/rol sin acceso a pisos).
            pisosHabilitados.value = false;
            estado.items = [];
          } else {
            console.error("Error al cargar los pisos", e);
            error.value = "No se pudieron cargar los pisos";
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
          const { data } = await unidadesService.crearPiso(cid, {
            numero: x.numero,
            nombre: (x.nombre || "").trim() || null,
            descripcion: (x.descripcion || "").trim() || null,
          });
          x.pisoId = data.id;
          x.esNuevo = false;
          x.original = { numero: x.numero, nombre: x.nombre, descripcion: x.descripcion };
          creados += 1;
        } catch (e) {
          x.error = e?.response?.data?.message || `No se pudo crear el piso ${x.numero}`;
          hayErrores = true;
        }
      }

      // 2) Existentes con cambios → PUT (activo: true; el backend valida el
      //    dedupe solo entre activos y la reactivación con número ocupado)
      for (const x of activos.filter((i) => !i.esNuevo && cambiado(i))) {
        try {
          await unidadesService.actualizarPiso(cid, x.pisoId, {
            numero: x.numero,
            nombre: (x.nombre || "").trim() || null,
            descripcion: (x.descripcion || "").trim() || null,
            activo: true,
          });
          x.original = { numero: x.numero, nombre: x.nombre, descripcion: x.descripcion };
          actualizados += 1;
        } catch (e) {
          x.error = e?.response?.data?.message || `No se pudo actualizar el piso ${x.numero}`;
          hayErrores = true;
        }
      }

      // 3) Marcados para eliminar → desactivar (409 si está en uso)
      const aEliminar = estado.items.filter((x) => x.marcadoEliminar && x.pisoId);
      for (const x of aEliminar) {
        try {
          await unidadesService.desactivarPiso(cid, x.pisoId);
          eliminados += 1;
          const idx = estado.items.findIndex((i) => i.id === x.id);
          if (idx !== -1) estado.items.splice(idx, 1);
        } catch (e) {
          // La desactivación falló (p.ej. 409: piso en uso) → la fila vuelve
          // a su estado normal (NO quedó eliminada) y se muestra el error.
          x.marcadoEliminar = false;
          x.error = e?.response?.data?.message || `No se pudo eliminar el piso ${x.numero}`;
          hayErrores = true;
        }
      }

      resultado.value = { creados, actualizados, eliminados };
      ordenarPisos();
      return !hayErrores;
    } catch (e) {
      console.error("Error al guardar los pisos", e);
      error.value = e?.response?.data?.message || "No se pudieron guardar los pisos";
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
    pisosHabilitados,
    estado,
    itemsValidos,
    tieneErrores,
    ordenarPisos,
    agregarFila,
    eliminarFila,
    cambiado,
    cargar,
    guardar,
  });
}
