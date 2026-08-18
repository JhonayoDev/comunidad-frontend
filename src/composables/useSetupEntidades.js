import { ref, computed, reactive, watch } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { unidadesService } from "@/services/unidadesService";
import { estacionamientosService } from "@/services/estacionamientosService";
import { bodegasService } from "@/services/bodegasService";
import { generarNombres, parsearListaPersonalizada } from "@/utils/numeracionUnidades";
import { compararUnidades } from "@/utils/ordenamientoNatural";

// Configuración por entidad: estacionamientos y bodegas comparten el mismo
// flujo de 5 fases (sin tipo). Los estacionamientos soportan MÚLTIPLES GRUPOS
// (propietarios E- + visitas EV-) en una sola ventana; las bodegas usan un
// único bloque (prefijo simple).
const CONFIG = {
  estacionamiento: {
    clave: "estacionamientos",
    borrador: (cid) => `comunidad:setup-estacionamientos:${cid}`,
    batch: (cid, payload) => estacionamientosService.crearEstacionamientosBatch(cid, payload),
    listar: (cid) => estacionamientosService.getEstacionamientos(cid),
    actualizar: (cid, id, data) => estacionamientosService.actualizarEstacionamiento(cid, id, data),
    desactivar: (cid, id) => estacionamientosService.desactivarEstacionamiento(cid, id),
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
    listar: (cid) => bodegasService.getBodegas(cid),
    actualizar: (cid, id, data) => bodegasService.actualizarBodega(cid, id, data),
    desactivar: (cid, id) => bodegasService.desactivarBodega(cid, id),
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
  const modoReedicion = ref(false);
  const pisosDisponibles = ref([]);
  const pisosHabilitados = ref(true);

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
    items: [], // [{ id, grupoUid, nombre, piso, sectorRef, error, entidadId, esNuevo, marcadoEliminar, original }]
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
          entidadId: null,
          esNuevo: true,
          marcadoEliminar: false,
          original: null,
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

  // Prefijo fijo del grupo (no editable en la UI). El nombre de cada ítem se
  // compone como prefijo + sufijo; el sufijo es lo único editable.
  function prefijoDe(grupoUid) {
    const g = estado.grupos.find((x) => x.uid === grupoUid);
    return g?.prefijo || "";
  }

  function sufijoDe(item) {
    const p = prefijoDe(item.grupoUid);
    return item.nombre.startsWith(p) ? item.nombre.slice(p.length) : item.nombre;
  }

  // Infiere el grupo de un nombre por prefijo (el más largo primero, para que
  // "EV-1" matchee "EV-" y no "E-"). Fallback al primer grupo.
  function grupoPorNombre(nombre) {
    const ordenados = [...estado.grupos].sort(
      (a, b) => (b.prefijo || "").length - (a.prefijo || "").length,
    );
    const g = ordenados.find((x) => x.prefijo && String(nombre || "").startsWith(x.prefijo));
    return g?.uid ?? estado.grupos[0]?.uid ?? null;
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

  // ─── Pisos (catálogo declarado; numeración "por-piso" y columna Piso) ───
  const pisosOpciones = computed(() => {
    if (!pisosHabilitados.value) return [];
    return pisosDisponibles.value.map((p) => ({
      value: p.numero,
      label: p.nombre ? `${p.numero} · ${p.nombre}` : `${p.numero}`,
    }));
  });

  const pisosLista = computed(() =>
    pisosDisponibles.value.map((p) => p.numero).join(",")
  );

  async function cargarPisos() {
    if (!cid) return;
    try {
      const { data } = await unidadesService.getPisos(cid);
      pisosDisponibles.value = Array.isArray(data)
        ? data
            .filter((p) => p.activo !== false)
            .map((p) => ({ id: p.id, numero: p.numero, nombre: p.nombre }))
        : [];
      pisosHabilitados.value = true;
    } catch (e) {
      if (e?.response?.status === 403) {
        // Sin permiso PISO_VER → se omite el catálogo y el piso queda libre.
        pisosHabilitados.value = false;
      } else {
        console.error("Error al cargar pisos declarados", e);
      }
      pisosDisponibles.value = [];
    }
  }

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

  // ─── Edición manual (fase 5) ───
  function agregarFila() {
    const grupoUid = estado.grupos[0]?.uid ?? null;
    estado.items.push({
      id: uid("item"),
      grupoUid,
      nombre: prefijoDe(grupoUid),
      piso: null,
      sectorRef: null,
      error: null,
      entidadId: null,
      esNuevo: true,
      marcadoEliminar: false,
      original: null,
    });
  }

  function eliminarFila(item) {
    if (item.entidadId) {
      // Existente en backend → se marca para desactivar al guardar.
      item.marcadoEliminar = true;
      item.error = null;
    } else {
      const idx = estado.items.findIndex((x) => x.id === item.id);
      if (idx !== -1) estado.items.splice(idx, 1);
    }
  }

  // Reordena los ítems con orden natural (E-1, E-2, ..., E-10, EV-1...). Se
  // invoca al salir del modo edición para revisar el listado antes de guardar.
  function ordenarItems() {
    estado.items.sort((a, b) => compararUnidades(a.nombre, b.nombre));
  }

  function cambiado(x) {
    const o = x.original;
    if (!o) return false;
    return o.nombre !== x.nombre || o.piso !== x.piso || o.sectorRef !== x.sectorRef;
  }

  const itemsValidos = computed(() => {
    const activos = estado.items.filter((x) => !x.marcadoEliminar);
    // En reedición, "eliminar todo" es válido: se guardan las desactivaciones.
    if (!activos.length) return estado.items.some((x) => x.marcadoEliminar);
    // El sufijo (parte editable del nombre) no puede quedar vacío: impide
    // guardar un ítem con solo el prefijo (p.ej. "E-" o "B-").
    if (activos.some((x) => !sufijoDe(x).trim())) return false;
    const nombres = activos.map((x) => (x.nombre || "").trim());
    if (nombres.some((n) => !n)) return false;
    return new Set(nombres).size === nombres.length;
  });

  const tieneErrores = computed(() => estado.items.some((x) => x.error));

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
        return itemsValidos.value;
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
    const totalNuevas = modoReedicion.value
      ? estado.items.filter((x) => x.esNuevo && !x.marcadoEliminar).length
      : estado.items.length || totalGeneradas.value;
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
        // Normaliza ítems por si el borrador viene de una versión anterior.
        data.estado.items = (data.estado.items || []).map((x) => ({
          id: x.id || uid("item"),
          grupoUid: x.grupoUid ?? null,
          nombre: x.nombre ?? "",
          piso: x.piso ?? null,
          sectorRef: x.sectorRef ?? null,
          error: x.error ?? null,
          entidadId: x.entidadId ?? null,
          esNuevo: x.esNuevo ?? true,
          marcadoEliminar: x.marcadoEliminar ?? false,
          original: x.original ?? null,
          tieneVinculos: x.tieneVinculos ?? false,
        }));
        Object.assign(estado, data.estado);
        if (Array.isArray(data.sectoresExistentes)) {
          sectoresExistentes.value = data.sectoresExistentes;
        }
        modoReedicion.value = data.estado.items.some((x) => x.entidadId);
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

  // ─── Envío (fase 5): sectores primero, entidades después ───
  async function enviar() {
    if (!cid || !estado.items.length) return;
    enviando.value = true;
    error.value = null;
    try {
      const activos = estado.items.filter((x) => !x.marcadoEliminar);
      let creadas = 0;
      let actualizadas = 0;
      let eliminadas = 0;
      let hayErrores = false;

      // 1) Sectores nuevos (solo aplica en creación inicial con agrupación "nuevo")
      const idPorRef = new Map();
      if (sectoresHabilitados.value && estado.sectorOrigen === "nuevo") {
        const nombres = estado.sectoresNuevos
          .map((s) => ({ nombre: (s.nombre || "").trim(), descripcion: (s.descripcion || "").trim() }))
          .filter((s) => s.nombre);
        if (nombres.length) {
          const { data } = await unidadesService.crearSectoresBatch(cid, { sectores: nombres });
          (data.creados || []).forEach((s) => idPorRef.set(s.nombre, s.id));
        }
      }

      const resolverSector = (x) => {
        if (estado.sectorOrigen === "nuevo" && x.sectorRef) {
          const nuevo = estado.sectoresNuevos.find((s) => s.uid === x.sectorRef);
          return idPorRef.get((nuevo?.nombre || "").trim()) ?? null;
        }
        if (estado.sectorOrigen === "existente") return x.sectorRef;
        return null;
      };

      if (modoReedicion.value) {
        // 2a) Filas nuevas → batch
        const nuevos = activos.filter((x) => x.esNuevo);
        if (nuevos.length) {
          const payload = nuevos.map((x) => ({ nombre: x.nombre, piso: x.piso, sectorId: resolverSector(x) }));
          const { data } = await cfg.batch(cid, { [cfg.clave]: payload });
          creadas = (data.creados || []).length;
          const porNombre = new Map((data.creados || []).map((c) => [c.nombre, c]));
          nuevos.forEach((x) => {
            const c = porNombre.get(x.nombre);
            if (c) {
              x.entidadId = c.id;
              x.esNuevo = false;
              x.original = { nombre: x.nombre, piso: x.piso, sectorRef: x.sectorRef };
            }
          });
        }

        // 2b) Existentes con cambios → PUT individual
        const editados = activos.filter((x) => !x.esNuevo && cambiado(x));
        for (const x of editados) {
          try {
            await cfg.actualizar(cid, x.entidadId, { nombre: x.nombre, piso: x.piso, sectorId: resolverSector(x) });
            x.original = { nombre: x.nombre, piso: x.piso, sectorRef: x.sectorRef };
            actualizadas += 1;
          } catch (e) {
            x.error = e?.response?.data?.message || `No se pudo actualizar ${x.nombre}`;
            throw e;
          }
        }

        // 2c) Existentes marcados para eliminar → desactivar
        const aEliminar = estado.items.filter((x) => x.marcadoEliminar && x.entidadId);
        for (const x of aEliminar) {
          try {
            await cfg.desactivar(cid, x.entidadId);
            eliminadas += 1;
            const idx = estado.items.findIndex((i) => i.id === x.id);
            if (idx !== -1) estado.items.splice(idx, 1);
          } catch (e) {
            // La desactivación falló (p.ej. 409: vínculos activos) → la fila
            // vuelve a su estado normal (NO quedó eliminada) y se muestra el
            // error. Una fila que falla no aborta el resto.
            x.marcadoEliminar = false;
            x.error = e?.response?.data?.message || `No se pudo eliminar ${x.nombre}`;
            hayErrores = true;
          }
        }
      } else {
        // Creación inicial: batch de todas las filas activas
        const payload = activos.map((x) => ({ nombre: x.nombre, piso: x.piso, sectorId: resolverSector(x) }));
        const { data } = await cfg.batch(cid, { [cfg.clave]: payload });
        creadas = (data.creados || []).length;
      }

      // Si en reedición se eliminaron todas las entidades y no quedan filas
      // nuevas, volver al wizard de creación (fase 1) para poder regenerarlas
      // con la misma numeración (el backend P11 permite reutilizar nombres).
      if (modoReedicion.value && estado.items.length === 0) {
        modoReedicion.value = false;
        estado.grupos = [nuevoGrupo()];
        estado.sectorOrigen = "sin-sector";
        estado.sectoresNuevos = [{ uid: uid("sector"), nombre: "", descripcion: "" }];
        estado.items = [];
        estado.paso = 1;
        resultado.value = null;
        descartarBorrador();
        return true;
      }

      resultado.value = { creadas, actualizadas, eliminadas };
      if (!hayErrores) descartarBorrador();
      return !hayErrores;
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
            // En reedición el batch solo contiene filas nuevas; en creación
            // inicial el índice coincide con estado.items.
            const fila = modoReedicion.value
              ? estado.items.filter((x) => x.esNuevo && !x.marcadoEliminar)[idx]
              : estado.items[idx];
            if (fila) fila.error = f.message;
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
        await cargarPisos();
      }
      cargarBorrador();
      // Si el cargo perdió/omite permisos SECTOR_*, descartar cualquier
      // agrupación que haya quedado en el borrador.
      if (!sectoresHabilitados.value) {
        estado.sectorOrigen = "sin-sector";
        estado.items.forEach((x) => (x.sectorRef = null));
      }
      // Re-entrada: si ya existen creados y no hay borrador en curso, cargarlos
      // para reedición (editar/agregar/eliminar) en vez de empezar de cero.
      if (!borradorRestaurado.value && cid) {
        try {
          const { data } = await cfg.listar(cid);
          const existentes = Array.isArray(data) ? data.filter((e) => e.activo !== false) : [];
          if (existentes.length > 0) {
            modoReedicion.value = true;
            if (sectoresHabilitados.value) estado.sectorOrigen = "existente";
            // En multigrupo la reedición salta las fases 1-2, así que hay que
            // asegurar el grupo estándar de visitas (EV-) para poder agregar
            // filas de ese tipo.
            if (cfg.multigrupo && !estado.grupos.some((g) => g.prefijo === "EV-")) {
              agregarGrupo();
            }
            estado.items = existentes.map((e) => ({
              id: uid("item"),
              grupoUid: grupoPorNombre(e.nombre),
              nombre: e.nombre,
              piso: e.piso,
              sectorRef: e.sectorId ?? null,
              error: null,
              entidadId: e.id,
              esNuevo: false,
              marcadoEliminar: false,
              original: { nombre: e.nombre, piso: e.piso, sectorRef: e.sectorId ?? null },
              // Con vínculos activos el nombre/tipo son inmutables (backend 409):
              // solo sector y piso son editables. Se deriva de la respuesta.
              tieneVinculos: !!(
                e.propietario ||
                e.arrendatarioEfectivo ||
                (e.arrendatariosFuturos && e.arrendatariosFuturos.length)
              ),
            }));
            estado.paso = 5;
          }
        } catch (e) {
          console.error(`No se pudieron cargar los ${cfg.labelPlural} existentes`, e);
          modoReedicion.value = false;
        }
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
    pisosDisponibles,
    pisosHabilitados,
    pisosOpciones,
    pisosLista,
    capacidad,
    modoReedicion,
    multigrupo: cfg.multigrupo,
    estado,
    nombresPreview,
    nombresDe,
    nombresDuplicados,
    totalGeneradas,
    envelopeExcedido,
    itemsValidos,
    tieneErrores,
    validoPaso,
    siguiente,
    atras,
    generarItems,
    cargarPisos,
    agregarGrupo,
    eliminarGrupo,
    grupoLabel,
    prefijoDe,
    sufijoDe,
    grupoPorNombre,
    agregarSectorNuevo,
    eliminarSectorNuevo,
    asignarSector,
    asignarTodos,
    agregarFila,
    eliminarFila,
    ordenarItems,
    guardarBorrador,
    cargarBorrador,
    descartarBorrador,
    enviar,
    cargar,
  });
}