import { ref, computed, reactive, watch } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { unidadesService } from "@/services/unidadesService";
import { estacionamientosService } from "@/services/estacionamientosService";
import { bodegasService } from "@/services/bodegasService";
import { generarNombres, parsearListaPersonalizada } from "@/utils/numeracionUnidades";

// Configuración por entidad: estacionamientos y bodegas comparten el mismo
// flujo de 5 fases (sin tipo). Los estacionamientos soportan MÚLTIPLES GRUPOS
// (propietarios E- + visitas EV-) en una sola ventana; las bodegas usan un
// único bloque (prefijo simple).
const CONFIG = {
  estacionamiento: {
    clave: "estacionamientos",
    borrador: (cid) => `comunidad:setup-estacionamientos:${cid}`,
    batch: (cid, payload) => estacionamientosService.crearEstacionamientosBatch(cid, payload),
    prefijoDefault: "E-",
    grupoNombreDefault: "Propietarios",
    multigrupo: true,
    label: "estacionamiento",
    labelPlural: "estacionamientos",
  },
  bodega: {
    clave: "bodegas",
    borrador: (cid) => `comunidad:setup-bodegas:${cid}`,
    batch: (cid, payload) => bodegasService.crearBodegasBatch(cid, payload),
    prefijoDefault: "B-",
    grupoNombreDefault: "",
    multigrupo: false,
    label: "bodega",
    labelPlural: "bodegas",
  },
};

export const PASOS_ENTIDADES = [
  { numero: 1, label: "Cantidad y prefijo", icon: "pi pi-car" },
  { numero: 2, label: "Numeración", icon: "pi pi-hashtag" },
  { numero: 3, label: "Sectores", icon: "pi pi-sitemap" },
  { numero: 4, label: "Asignación", icon: "pi pi-th-large" },
  { numero: 5, label: "Revisar y guardar", icon: "pi pi-check" },
];

let contador = 0;
function uid(prefijo) {
  contador += 1;
  return `${prefijo}-${Date.now()}-${contador}`;
}

export function useSetupEntidades({ entidad } = {}) {
  const cfg = CONFIG[entidad] || CONFIG.estacionamiento;
  const auth = useAuthStore();
  const cid = auth.condominioActualId;

  const cargando = ref(true);
  const enviando = ref(false);
  const error = ref(null);
  const resultado = ref(null);
  const borradorRestaurado = ref(false);
  const sectoresExistentes = ref([]);
  const sectoresHabilitados = ref(true);
  const capacidad = ref(null);

  // Crea un grupo nuevo. En estacionamientos, el segundo grupo se sugiere como
  // "Visitas · EV-" (el caso común); el resto es editable.
  function nuevoGrupo(gruposActuales = []) {
    let prefijo = cfg.prefijoDefault;
    let nombre = cfg.grupoNombreDefault;
    if (cfg.multigrupo && gruposActuales.length > 0 && !gruposActuales.some((g) => g.prefijo === "EV-")) {
      prefijo = "EV-";
      nombre = "Visitas";
    }
    return {
      uid: uid("grupo"),
      nombre,
      prefijo,
      cantidad: 1,
      modo: "correlativo",
      desde: "1",
      pisos: "1",
      porPiso: 1,
      personalizado: "",
    };
  }

  const estado = reactive({
    paso: 1,
    grupos: [nuevoGrupo()],
    sectorOrigen: "sin-sector", // sin-sector | nuevo | existente
    sectoresNuevos: [{ uid: uid("sector"), nombre: "", descripcion: "" }],
    items: [], // [{ id, grupoUid, nombre, piso, sectorRef, error }]
  });

  // ─── Numeración (fase 2) ───
  function nombresDe(g) {
    const opciones =
      g.modo === "correlativo"
        ? { desde: g.desde, cantidad: g.cantidad }
        : g.modo === "por-piso"
          ? { pisos: g.pisos, porPiso: g.porPiso }
          : { lista: g.personalizado };
    return generarNombres(g.prefijo, g.modo, opciones);
  }

  const nombresPreview = computed(() => estado.grupos.flatMap(nombresDe));

  // Nombres repetidos entre grupos (mismo prefijo → colisión). Red de
  // seguridad local; el backend igual responde 409 por fila.
  const nombresDuplicados = computed(() => {
    const vistos = new Set();
    const dups = new Set();
    for (const g of estado.grupos) {
      for (const n of nombresDe(g)) {
        if (vistos.has(n.nombre)) dups.add(n.nombre);
        else vistos.add(n.nombre);
      }
    }
    return [...dups];
  });

  function generarItems() {
    // Preserva la asignación previa por nombre al regenerar.
    const previo = new Map(estado.items.map((x) => [x.nombre, x.sectorRef]));
    const items = [];
    for (const g of estado.grupos) {
      for (const n of nombresDe(g)) {
        items.push({
          id: uid("item"),
          grupoUid: g.uid,
          nombre: n.nombre,
          piso: n.piso,
          sectorRef: previo.get(n.nombre) ?? null,
          error: null,
        });
      }
    }
    estado.items = items;
  }

  function agregarGrupo() {
    estado.grupos.push(nuevoGrupo(estado.grupos));
  }

  function eliminarGrupo(grupoUid) {
    if (estado.grupos.length <= 1) return;
    const idx = estado.grupos.findIndex((g) => g.uid === grupoUid);
    if (idx === -1) return;
    estado.grupos.splice(idx, 1);
    estado.items = estado.items.filter((x) => x.grupoUid !== grupoUid);
  }

  function grupoLabel(grupoUid) {
    const g = estado.grupos.find((x) => x.uid === grupoUid);
    if (!g) return "";
    return (g.nombre || "").trim() || g.prefijo || "Grupo";
  }

  // ─── Sectores (fases 3-4) ───
  const sectoresOpciones = computed(() => {
    if (!sectoresHabilitados.value || estado.sectorOrigen === "sin-sector") return [];
    if (estado.sectorOrigen === "nuevo") {
      return estado.sectoresNuevos
        .map((s) => ({
          ref: s.uid,
          label: (s.nombre || "").trim() || "Sector",
        }))
        .filter((s) => s.label && s.label !== "Sector");
    }
    return sectoresExistentes.value.map((s) => ({
      ref: s.id,
      label: s.nombre,
    }));
  });

  function agregarSectorNuevo() {
    estado.sectoresNuevos.push({ uid: uid("sector"), nombre: "", descripcion: "" });
  }

  function eliminarSectorNuevo(i) {
    const [removido] = estado.sectoresNuevos.splice(i, 1);
    estado.items.forEach((x) => {
      if (x.sectorRef === removido.uid) x.sectorRef = null;
    });
  }

  function asignarSector(itemId, sectorRef) {
    const x = estado.items.find((i) => i.id === itemId);
    if (x) x.sectorRef = sectorRef;
  }

  function asignarTodos(sectorRef) {
    estado.items.forEach((x) => (x.sectorRef = sectorRef));
  }

  // ─── Validación por fase ───
  function validoPaso(paso) {
    switch (paso) {
      case 1:
        return estado.grupos.length > 0 && estado.grupos.every((g) => g.cantidad >= 1);
      case 2:
        return estado.grupos.length > 0 && estado.grupos.every((g) => nombresDe(g).length > 0);
      case 3: {
        if (!sectoresHabilitados.value) return true;
        if (estado.sectorOrigen === "sin-sector") return true;
        if (estado.sectorOrigen === "nuevo") {
          const nombres = estado.sectoresNuevos
            .map((s) => (s.nombre || "").trim())
            .filter(Boolean);
          if (!nombres.length) return false;
          return new Set(nombres).size === nombres.length;
        }
        return true; // la asignación por ítem ocurre en la fase 4
      }
      case 4:
        return true; // "Sin sector" es una asignación válida
      case 5:
        return estado.items.length > 0;
      default:
        return true;
    }
  }

  function siguiente() {
    if (estado.paso >= 5 || !validoPaso(estado.paso)) return;
    if (estado.paso === 2) generarItems();
    estado.paso += 1;
  }

  function atras() {
    if (estado.paso > 1) estado.paso -= 1;
  }

  // ─── Resumen ───
  const totalGeneradas = computed(() =>
    estado.grupos.reduce((acc, g) => acc + nombresDe(g).length, 0),
  );

  const envelopeExcedido = computed(() => {
    if (!capacidad.value) return false;
    const totalNuevas = estado.items.length || totalGeneradas.value;
    return (capacidad.value.totalActual ?? 0) + totalNuevas > (capacidad.value.planUnidadLimit ?? Infinity);
  });

  // ─── Borrador (sessionStorage) ───
  function guardarBorrador() {
    if (!cid) return;
    try {
      const persistible = {
        estado: JSON.parse(JSON.stringify(estado)),
        sectoresExistentes: sectoresExistentes.value,
      };
      sessionStorage.setItem(cfg.borrador(cid), JSON.stringify({ ...persistible, guardadoEn: Date.now() }));
    } catch (e) {
      console.error(`Error al guardar borrador de ${cfg.labelPlural}`, e);
    }
  }

  function cargarBorrador() {
    if (!cid) return false;
    try {
      const raw = sessionStorage.getItem(cfg.borrador(cid));
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.estado && Array.isArray(data.estado.grupos) && Array.isArray(data.estado.items)) {
        Object.assign(estado, data.estado);
        if (Array.isArray(data.sectoresExistentes)) {
          sectoresExistentes.value = data.sectoresExistentes;
        }
        borradorRestaurado.value = true;
        return true;
      }
      // Borrador incompatible (forma anterior sin grupos) → descartar.
      sessionStorage.removeItem(cfg.borrador(cid));
    } catch (e) {
      console.error(`Error al restaurar borrador de ${cfg.labelPlural}`, e);
    }
    return false;
  }

  function descartarBorrador() {
    if (!cid) return;
    try {
      sessionStorage.removeItem(cfg.borrador(cid));
    } catch (e) {
      console.error(`Error al descartar borrador de ${cfg.labelPlural}`, e);
    }
    borradorRestaurado.value = false;
  }

  watch(estado, guardarBorrador, { deep: true });

  // ─── Envío batch (fase 5): sectores primero, entidades después ───
  async function enviar() {
    if (!cid || !estado.items.length) return;
    enviando.value = true;
    error.value = null;
    try {
      // 1) Sectores nuevos (si aplica)
      const idPorRef = new Map();
      if (sectoresHabilitados.value && estado.sectorOrigen === "nuevo") {
        const nombres = estado.sectoresNuevos
          .map((s) => ({ nombre: (s.nombre || "").trim(), descripcion: (s.descripcion || "").trim() }))
          .filter((s) => s.nombre);
        const { data } = await unidadesService.crearSectoresBatch(cid, { sectores: nombres });
        (data.creados || []).forEach((s) => idPorRef.set(s.nombre, s.id));
      }

      // 2) Batch de la entidad (todos los grupos fusionados en una sola petición)
      const payload = estado.items.map((x) => {
        let sectorId = null;
        if (estado.sectorOrigen === "nuevo" && x.sectorRef) {
          const nuevo = estado.sectoresNuevos.find((s) => s.uid === x.sectorRef);
          sectorId = idPorRef.get((nuevo?.nombre || "").trim()) ?? null;
        } else if (estado.sectorOrigen === "existente") {
          sectorId = x.sectorRef;
        }
        return { nombre: x.nombre, piso: x.piso, sectorId };
      });

      const { data } = await cfg.batch(cid, { [cfg.clave]: payload });
      resultado.value = { creadas: (data.creados || []).length };
      descartarBorrador();
      return true;
    } catch (e) {
      console.error(`Error al guardar ${cfg.labelPlural}`, e);
      error.value = e?.response?.data?.message || `No se pudieron guardar los ${cfg.labelPlural}`;
      const fields = e?.response?.data?.fields;
      if (Array.isArray(fields)) {
        estado.items.forEach((x) => (x.error = null));
        fields.forEach((f) => {
          const match = new RegExp(`${cfg.clave}\\[(\\d+)\\]`).exec(f.field || "");
          if (match) {
            const idx = Number(match[1]);
            if (estado.items[idx]) estado.items[idx].error = f.message;
          }
        });
      }
      return false;
    } finally {
      enviando.value = false;
    }
  }

  // ─── Carga inicial ───
  async function cargar() {
    cargando.value = true;
    error.value = null;
    try {
      if (cid) {
        try {
          const { data } = await unidadesService.getSectores(cid);
          sectoresExistentes.value = Array.isArray(data) ? data : [];
          sectoresHabilitados.value = true;
        } catch (e) {
          // 403/404: el cargo ADMINISTRADOR no tiene permisos SECTOR_* (V62 los
          // da al rol ADMINISTRADOR y a PRESIDENTE/SECRETARIO/CONSERJE/GUARDIA).
          // La vista degrada: entidades sin agrupar.
          console.error("Sectores no disponibles, se omitirá la agrupación", e);
          sectoresExistentes.value = [];
          sectoresHabilitados.value = false;
          if (estado.sectorOrigen !== "sin-sector") estado.sectorOrigen = "sin-sector";
        }
        try {
          const capRes = await unidadesService.getCapacidad(cid);
          capacidad.value = capRes.data;
        } catch (e) {
          if (e?.response?.status !== 404) {
            console.error("Error al cargar capacidad del condominio", e);
          }
          capacidad.value = null;
        }
      }
      cargarBorrador();
      // Si el cargo perdió/omite permisos SECTOR_*, descartar cualquier
      // agrupación que haya quedado en el borrador.
      if (!sectoresHabilitados.value) {
        estado.sectorOrigen = "sin-sector";
        estado.items.forEach((x) => (x.sectorRef = null));
      }
    } catch (e) {
      console.error(`Error al cargar el wizard de ${cfg.labelPlural}`, e);
      error.value = `No se pudo cargar el wizard de ${cfg.labelPlural}`;
    } finally {
      cargando.value = false;
    }
  }

  return reactive({
    cid,
    cargando,
    enviando,
    error,
    resultado,
    borradorRestaurado,
    sectoresExistentes,
    sectoresHabilitados,
    sectoresOpciones,
    capacidad,
    multigrupo: cfg.multigrupo,
    estado,
    nombresPreview,
    nombresDe,
    nombresDuplicados,
    totalGeneradas,
    envelopeExcedido,
    validoPaso,
    siguiente,
    atras,
    generarItems,
    agregarGrupo,
    eliminarGrupo,
    grupoLabel,
    agregarSectorNuevo,
    eliminarSectorNuevo,
    asignarSector,
    asignarTodos,
    guardarBorrador,
    cargarBorrador,
    descartarBorrador,
    enviar,
    cargar,
  });
}