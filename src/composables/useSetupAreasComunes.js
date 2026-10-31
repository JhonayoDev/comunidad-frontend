import { ref, reactive, computed } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { espaciosService } from "@/services/espaciosService";
import { estacionamientosService } from "@/services/estacionamientosService";
import { unidadesService } from "@/services/unidadesService";
import { compararUnidades } from "@/utils/ordenamientoNatural";
import { esEstacionamientoVisita } from "@/data/planillaColumnas";

let contador = 0;
function uid(prefijo) {
  contador += 1;
  return `${prefijo}-${Date.now()}-${contador}`;
}

export const TIPOS_ESPACIO = [
  "SALON_MULTIUSO",
  "QUINCHO",
  "CANCHA",
  "PISCINA",
  "SALA_REUNIONES",
  "OTRO",
];

export const NOMBRE_ESPACIO_MAX = 60;

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

// Gestión de áreas comunes y visitas (etapa del wizard).
// Card 1: espacios comunes (CRUD espejo Pisos/Accesos; el vínculo
// PROPIETARIO→CONDOMINIO lo crea el backend automáticamente).
// Card 2: estacionamientos de visita EV- (piso/sector inline).
// Sin batch en el backend; una falla no aborta el resto.
export function useSetupAreasComunes() {
  const auth = useAuthStore();
  const cid = auth.condominioActualId;

  const cargando = ref(true);
  const enviando = ref(false);
  const error = ref(null);
  const resultado = ref(null);
  const espaciosHabilitados = ref(true);

  const estado = reactive({
    // Espacios: [{ id, nombre, tipo, piso, sectorId, error, espacioId,
    //              esNuevo, marcadoEliminar, original }]
    // El vínculo PROPIETARIO→CONDOMINIO lo gestiona el backend
    // automáticamente al crear (el manual se rechaza): no se modela aquí.
    items: [],
    // EV-: [{ id, estId, nombre, piso, sectorId, error, original }]
    visitas: [],
  });

  const sectoresExistentes = ref([]);
  const pisosDisponibles = ref([]);
  const pisosHabilitados = ref(true);
  // Id y número de la unidad CONDOMINIO: los EV- se vinculan a ella.
  const condominioUnidad = ref({ id: null, numero: null });

  const pisosOpciones = computed(() =>
    (pisosDisponibles.value || []).map((p) => ({
      value: p.numero,
      label: p.nombre ? `${p.numero} · ${p.nombre}` : `${p.numero}`,
    })),
  );

  const sectoresOpciones = computed(() =>
    (sectoresExistentes.value || []).map((s) => ({ value: s.id, label: s.nombre })),
  );

  function ordenarEspacios() {
    estado.items.sort((a, b) => compararUnidades(a.nombre, b.nombre));
  }

  function agregarFila() {
    estado.items.push({
      id: uid("espacio"),
      nombre: "",
      tipo: "OTRO",
      piso: null,
      sectorId: null,
      error: null,
      espacioId: null,
      esNuevo: true,
      marcadoEliminar: false,
      original: null,
    });
  }

  function eliminarFila(item) {
    if (item.espacioId) {
      item.marcadoEliminar = true;
      item.error = null;
    } else {
      const idx = estado.items.findIndex((x) => x.id === item.id);
      if (idx !== -1) estado.items.splice(idx, 1);
    }
  }

  function cambiadoEspacio(x) {
    const o = x.original;
    if (!o) return false;
    return (
      o.nombre !== x.nombre ||
      o.tipo !== x.tipo ||
      o.piso !== x.piso ||
      o.sectorId !== x.sectorId
    );
  }

  function cambiadoVisita(x) {
    const o = x.original;
    if (!o) return false;
    return o.piso !== x.piso || o.sectorId !== x.sectorId;
  }

  const itemsValidos = computed(() => {
    const activos = estado.items.filter((x) => !x.marcadoEliminar);
    if (activos.length) {
      const nombres = activos.map((x) => (x.nombre || "").trim());
      if (nombres.some((n) => !n || n.length > NOMBRE_ESPACIO_MAX)) return false;
      if (new Set(nombres.map((n) => n.toLowerCase())).size !== nombres.length) return false;
      if (activos.some((x) => (x.piso ?? null) !== null && !Number.isInteger(x.piso))) return false;
    } else if (!estado.items.some((x) => x.marcadoEliminar)) {
      // Sin filas y sin eliminaciones: válido si hay visitas que ubicar o vincular.
      if (!estado.visitas.some((x) => cambiadoVisita(x) || !x.vinculadoA)) return false;
    }
    if (estado.visitas.some((x) => (x.piso ?? null) !== null && !Number.isInteger(x.piso))) return false;
    return true;
  });

  // Nombres duplicados entre filas activas (el botón deshabilitado solo
  // confunde: se marcan las filas y se explica el motivo).
  const nombresDuplicados = computed(() => {
    const conteo = new Map();
    estado.items
      .filter((x) => !x.marcadoEliminar)
      .map((x) => (x.nombre || "").trim().toLowerCase())
      .filter(Boolean)
      .forEach((n) => conteo.set(n, (conteo.get(n) || 0) + 1));
    return new Set([...conteo.entries()].filter(([, c]) => c > 1).map(([n]) => n));
  });

  function esDuplicado(x) {
    const n = (x.nombre || "").trim().toLowerCase();
    return !!n && !x.marcadoEliminar && nombresDuplicados.value.has(n);
  }

  // Por qué no se puede guardar (null = nada que objetar): alimenta el
  // tooltip del botón y el mensaje inline para no dejar al usuario adivinando.
  const motivoBloqueo = computed(() => {
    const activos = estado.items.filter((x) => !x.marcadoEliminar);
    if (activos.some((x) => !(x.nombre || "").trim())) {
      return "Hay filas sin nombre: complétalo o elimínalas.";
    }
    const dup = activos.find((x) => esDuplicado(x));
    if (dup) {
      return `Nombre duplicado en la planilla: "${(dup.nombre || "").trim()}". Cámbialo o elimina la fila.`;
    }
    if (activos.some((x) => (x.nombre || "").trim().length > NOMBRE_ESPACIO_MAX)) {
      return `Hay nombres de más de ${NOMBRE_ESPACIO_MAX} caracteres.`;
    }
    if (
      activos.some((x) => (x.piso ?? null) !== null && !Number.isInteger(x.piso)) ||
      estado.visitas.some((x) => (x.piso ?? null) !== null && !Number.isInteger(x.piso))
    ) {
      return "Hay pisos no enteros: usa números enteros o déjalo vacío.";
    }
    return null;
  });

  const tieneErrores = computed(
    () => estado.items.some((x) => x.error) || estado.visitas.some((x) => x.error),
  );

  const pendientes = computed(() => {
    const nuevas = estado.items.filter((x) => x.esNuevo && !x.marcadoEliminar).length;
    const editadas = estado.items.filter(
      (x) => !x.esNuevo && !x.marcadoEliminar && cambiadoEspacio(x),
    ).length;
    const eliminadas = estado.items.filter((x) => x.marcadoEliminar && x.espacioId).length;
    // Visitas por ubicar o por vincular (huérfanas): ambas habilitan Guardar.
    const visitas = estado.visitas.filter((x) => cambiadoVisita(x) || !x.vinculadoA).length;
    return {
      nuevas,
      editadas,
      eliminadas,
      visitas,
      total: nuevas + editadas + eliminadas + visitas,
    };
  });

  const hayCambios = computed(() => pendientes.value.total > 0);

  async function cargar() {
    cargando.value = true;
    error.value = null;
    try {
      if (!cid) return;
      try {
        const { data } = await espaciosService.getEspacios(cid);
        const lista = Array.isArray(data) ? data.filter((e) => e.activo !== false) : [];
        estado.items = lista.map((e) => ({
          id: uid("espacio"),
          nombre: e.nombre ?? "",
          tipo: e.tipo || "OTRO",
          piso: e.piso ?? null,
          sectorId: e.sectorId ?? e.sector?.id ?? null,
          error: null,
          espacioId: e.id,
          esNuevo: false,
          marcadoEliminar: false,
          original: null,
        }));
        estado.items.forEach((x) => {
          x.original = {
            nombre: x.nombre,
            tipo: x.tipo,
            piso: x.piso,
            sectorId: x.sectorId,
          };
        });
        espaciosHabilitados.value = true;
        ordenarEspacios();
      } catch (e) {
        if (e?.response?.status === 403) {
          espaciosHabilitados.value = false;
          estado.items = [];
        } else {
          console.error("Error al cargar los espacios comunes", e);
          error.value = "No se pudieron cargar los espacios comunes";
        }
      }
      try {
        const { data } = await estacionamientosService.getEstacionamientos(cid);
        estado.visitas = (Array.isArray(data) ? data : [])
          .filter((e) => esEstacionamientoVisita(e.nombre))
          .map((e) => {
            // El vínculo viene en la lista (sin GET extra): null = huérfano.
            const dueno = e.propietario || e.arrendatarioEfectivo || null;
            return {
              id: uid("visita"),
              estId: e.id,
              nombre: e.nombre,
              piso: e.piso ?? null,
              sectorId: e.sectorId ?? e.sector?.id ?? null,
              error: null,
              vinculadoA: dueno
                ? {
                    unidadId: dueno.unidadId,
                    unidadNumero: dueno.unidadNumero,
                    tipoUnidad: dueno.tipoUnidad,
                  }
                : null,
              original: { piso: e.piso ?? null, sectorId: e.sectorId ?? e.sector?.id ?? null },
            };
          });
      } catch (e) {
        console.error("Error al cargar estacionamientos de visita", e);
      }
      try {
        const { data } = await unidadesService.getUnidades(cid);
        const cond = (Array.isArray(data) ? data : []).find((u) => u.tipo === "CONDOMINIO");
        condominioUnidad.value = { id: cond?.id || null, numero: cond?.numero ?? null };
      } catch (e) {
        console.error("Error al cargar unidad condominio", e);
        condominioUnidad.value = { id: null, numero: null };
      }
      try {
        const { data } = await unidadesService.getSectores(cid);
        sectoresExistentes.value = Array.isArray(data)
          ? data.filter((s) => s.activo !== false)
          : [];
      } catch (e) {
        if (e?.response?.status !== 403) {
          console.error("Error al cargar sectores", e);
        }
        sectoresExistentes.value = [];
      }
      try {
        const { data } = await unidadesService.getPisos(cid);
        pisosDisponibles.value = Array.isArray(data)
          ? data
              .filter((p) => p.activo !== false)
              .map((p) => ({ id: p.id, numero: p.numero, nombre: p.nombre }))
          : [];
        pisosHabilitados.value = true;
      } catch (e) {
        if (e?.response?.status !== 403) {
          console.error("Error al cargar pisos", e);
        }
        pisosHabilitados.value = false;
        pisosDisponibles.value = [];
      }
    } finally {
      cargando.value = false;
    }
  }

  function snapshotEspacio(x) {
    x.original = {
      nombre: x.nombre,
      tipo: x.tipo,
      piso: x.piso,
      sectorId: x.sectorId,
    };
  }

  async function guardar() {
    if (!cid || (!estado.items.length && !estado.visitas.length)) return false;
    enviando.value = true;
    error.value = null;
    let creados = 0;
    let actualizados = 0;
    let eliminados = 0;
    let visitas = 0;
    let vinculadas = 0;
    let hayErrores = false;
    try {
      const activos = estado.items.filter((x) => !x.marcadoEliminar);

      // 1) Espacios nuevos → POST (el backend vincula PROPIETARIO→CONDOMINIO
      //    automáticamente; el vincular manual se rechaza).
      for (const x of activos.filter((i) => i.esNuevo)) {
        try {
          const { data } = await espaciosService.crearEspacio(cid, {
            nombre: x.nombre.trim(),
            tipo: x.tipo,
            piso: x.piso,
            sectorId: x.sectorId,
          });
          x.espacioId = data.id;
          x.esNuevo = false;
          creados += 1;
          snapshotEspacio(x);
        } catch (e) {
          x.error = e?.response?.data?.message || `No se pudo crear ${x.nombre}`;
          hayErrores = true;
        }
      }

      // 2) Espacios editados → PUT.
      for (const x of activos.filter((i) => !i.esNuevo && cambiadoEspacio(i))) {
        try {
          await espaciosService.actualizarEspacio(cid, x.espacioId, {
            nombre: x.nombre.trim(),
            tipo: x.tipo,
            piso: x.piso,
            sectorId: x.sectorId,
          });
          actualizados += 1;
          snapshotEspacio(x);
        } catch (e) {
          x.error = e?.response?.data?.message || `No se pudo actualizar ${x.nombre}`;
          hayErrores = true;
        }
      }

      // 3) Marcados para eliminar → desactivar.
      const aEliminar = estado.items.filter((x) => x.marcadoEliminar && x.espacioId);
      for (const x of aEliminar) {
        try {
          await espaciosService.desactivarEspacio(cid, x.espacioId);
          eliminados += 1;
          const idx = estado.items.findIndex((i) => i.id === x.id);
          if (idx !== -1) estado.items.splice(idx, 1);
        } catch (e) {
          x.marcadoEliminar = false;
          x.error = e?.response?.data?.message || `No se pudo eliminar ${x.nombre}`;
          hayErrores = true;
        }
      }

      // 4) Visitas EV- con piso/sector cambiado → PUT individual.
      for (const x of estado.visitas.filter((v) => cambiadoVisita(v))) {
        try {
          await estacionamientosService.actualizarEstacionamiento(cid, x.estId, {
            nombre: x.nombre,
            piso: x.piso,
            sectorId: x.sectorId,
          });
          x.original = { piso: x.piso, sectorId: x.sectorId };
          visitas += 1;
        } catch (e) {
          x.error = e?.response?.data?.message || `No se pudo actualizar ${x.nombre}`;
          hayErrores = true;
        }
      }

      // 5) Visitas EV-: vincular al condominio si no lo están (PROPIETARIO).
      // Sin esto quedan huérfanas (verificado en BD: vínculos []).
      for (const x of estado.visitas) {
        try {
          if (!condominioUnidad.value.id) break;
          const { data } = await estacionamientosService.vinculos(cid, x.estId);
          const vinculado = (data || []).some(
            (v) => v.activo && v.unidadId === condominioUnidad.value.id,
          );
          if (!vinculado) {
            await estacionamientosService.vincular(cid, x.estId, {
              tipo: "PROPIETARIO",
              unidadId: condominioUnidad.value.id,
              fechaInicio: hoy(),
            });
            x.vinculadoA = {
              unidadId: condominioUnidad.value.id,
              unidadNumero: condominioUnidad.value.numero,
              tipoUnidad: "CONDOMINIO",
            };
            vinculadas += 1;
          }
        } catch (e) {
          x.error = e?.response?.data?.message || `No se pudo vincular ${x.nombre}`;
          hayErrores = true;
        }
      }

      resultado.value = { creados, actualizados, eliminados, visitas, vinculadas };
      ordenarEspacios();
      return !hayErrores;
    } catch (e) {
      console.error("Error al guardar áreas comunes", e);
      error.value = e?.response?.data?.message || "No se pudieron guardar las áreas comunes";
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
    espaciosHabilitados,
    estado,
    sectoresExistentes,
    sectoresOpciones,
    nombresDuplicados,
    esDuplicado,
    motivoBloqueo,
    pisosDisponibles,
    pisosOpciones,
    pisosHabilitados,
    condominioUnidad,
    itemsValidos,
    tieneErrores,
    pendientes,
    hayCambios,
    ordenarEspacios,
    agregarFila,
    eliminarFila,
    cambiadoEspacio,
    cambiadoVisita,
    cargar,
    guardar,
  });
}
