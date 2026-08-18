import { ref, computed, reactive, watch } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { unidadesService } from "@/services/unidadesService";
import { generarNumeros, parsearListaPersonalizada } from "@/utils/numeracionUnidades";
import { compararUnidades } from "@/utils/ordenamientoNatural";

const CLAVE_BORRADOR = (cid) => `comunidad:setup-unidades:${cid}`;

// Tipos de unidad que el ADMINISTRADOR puede crear (CONDOMINIO es automático;
// ESTACIONAMIENTO/BODEGA son entidades independientes).
export const TIPOS_UNIDAD_CREAR = [
  { label: "Casa", value: "CASA" },
  { label: "Departamento", value: "DEPARTAMENTO" },
  { label: "Otro", value: "OTRO" },
];

export const PASOS_UNIDADES = [
  { numero: 1, label: "Tipo y cantidad", icon: "pi pi-home" },
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

export function useSetupUnidades() {
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

  const estado = reactive({
    paso: 1,
    tipo: "CASA",
    cantidad: 1,
    modo: "correlativo",
    desde: "1",
    pisos: 1,
    porPiso: 1,
    personalizado: "",
    sectorOrigen: "sin-sector", // sin-sector | nuevo | existente
    sectoresNuevos: [{ uid: uid("sector"), nombre: "", descripcion: "" }],
    sectorExistenteId: null,
    // [{ id, numero, tipo, piso, sectorRef, error, unidadId, esNuevo, marcadoEliminar, original }]
    unidades: [],
  });

  // ─── Numeración (fase 2) ───
  const numerosPreview = computed(() => {
    const opciones =
      estado.modo === "correlativo"
        ? { desde: estado.desde, cantidad: estado.cantidad }
        : estado.modo === "por-piso"
          ? { pisos: estado.pisos, porPiso: estado.porPiso }
          : { lista: estado.personalizado };
    return generarNumeros(estado.modo, opciones);
  });

  function generarUnidades() {
    // Preserva la asignación previa por número al regenerar.
    const previo = new Map(estado.unidades.map((u) => [u.numero, u.sectorRef]));
    estado.unidades = numerosPreview.value.map((n) => ({
      id: uid("unidad"),
      numero: n.numero,
      tipo: estado.tipo,
      piso: n.piso,
      sectorRef: previo.get(n.numero) ?? null,
      error: null,
      unidadId: null,
      esNuevo: true,
      marcadoEliminar: false,
      original: null,
    }));
  }

  // ─── Edición manual (fase 5) ───
  function agregarFila() {
    estado.unidades.push({
      id: uid("unidad"),
      numero: "",
      tipo: estado.tipo,
      piso: null,
      sectorRef: null,
      error: null,
      unidadId: null,
      esNuevo: true,
      marcadoEliminar: false,
      original: null,
    });
  }

  function eliminarFila(un) {
    if (un.unidadId) {
      // Existente en backend → se marca para desactivar al guardar.
      un.marcadoEliminar = true;
      un.error = null;
    } else {
      const idx = estado.unidades.findIndex((x) => x.id === un.id);
      if (idx !== -1) estado.unidades.splice(idx, 1);
    }
  }

  // Reordena las unidades con orden natural (1, 2, 3, ..., 10, 11...). Se
  // invoca al salir del modo edición para revisar el listado antes de guardar.
  function ordenarUnidades() {
    estado.unidades.sort((a, b) => compararUnidades(a.numero, b.numero));
  }

  function cambiado(x) {
    const o = x.original;
    if (!o) return false;
    return (
      o.numero !== x.numero ||
      o.tipo !== x.tipo ||
      o.piso !== x.piso ||
      o.sectorRef !== x.sectorRef
    );
  }

  const itemsValidos = computed(() => {
    const activos = estado.unidades.filter((x) => !x.marcadoEliminar);
    // En reedición, "eliminar todo" es válido: se guardan las desactivaciones.
    if (!activos.length) return estado.unidades.some((x) => x.marcadoEliminar);
    const numeros = activos.map((x) => (x.numero || "").trim());
    if (numeros.some((n) => !n)) return false;
    return new Set(numeros).size === numeros.length;
  });

  const tieneErrores = computed(() => estado.unidades.some((x) => x.error));

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
    estado.unidades.forEach((u) => {
      if (u.sectorRef === removido.uid) u.sectorRef = null;
    });
  }

  function asignarSector(unidadId, sectorRef) {
    const u = estado.unidades.find((x) => x.id === unidadId);
    if (u) u.sectorRef = sectorRef;
  }

  function asignarTodos(sectorRef) {
    estado.unidades.forEach((u) => (u.sectorRef = sectorRef));
  }

  // ─── Validación por fase ───
  function validoPaso(paso) {
    switch (paso) {
      case 1:
        return estado.tipo && estado.cantidad >= 1;
      case 2:
        return numerosPreview.value.length > 0;
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
        return true; // la asignación por unidad ocurre en la fase 4
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
    if (estado.paso === 2) generarUnidades();
    estado.paso += 1;
  }

  function atras() {
    if (estado.paso > 1) estado.paso -= 1;
  }

  // ─── Resumen ───
  const totalGeneradas = computed(() =>
    estado.modo === "personalizado"
      ? parsearListaPersonalizada(estado.personalizado).length
      : numerosPreview.value.length,
  );

  const envelopeExcedido = computed(() => {
    if (!capacidad.value) return false;
    const totalNuevas = modoReedicion.value
      ? estado.unidades.filter((x) => x.esNuevo && !x.marcadoEliminar).length
      : estado.unidades.length || totalGeneradas.value;
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
      sessionStorage.setItem(CLAVE_BORRADOR(cid), JSON.stringify({ ...persistible, guardadoEn: Date.now() }));
    } catch (e) {
      console.error("Error al guardar borrador de unidades", e);
    }
  }

  function cargarBorrador() {
    if (!cid) return false;
    try {
      const raw = sessionStorage.getItem(CLAVE_BORRADOR(cid));
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.estado && Array.isArray(data.estado.unidades)) {
        // Normaliza unidades por si el borrador viene de una versión anterior.
        data.estado.unidades = (data.estado.unidades || []).map((x) => ({
          id: x.id || uid("unidad"),
          numero: x.numero ?? "",
          tipo: x.tipo ?? "CASA",
          piso: x.piso ?? null,
          sectorRef: x.sectorRef ?? null,
          error: x.error ?? null,
          unidadId: x.unidadId ?? null,
          esNuevo: x.esNuevo ?? true,
          marcadoEliminar: x.marcadoEliminar ?? false,
          original: x.original ?? null,
        }));
        Object.assign(estado, data.estado);
        if (Array.isArray(data.sectoresExistentes)) {
          sectoresExistentes.value = data.sectoresExistentes;
        }
        modoReedicion.value = data.estado.unidades.some((x) => x.unidadId);
        borradorRestaurado.value = true;
        return true;
      }
      // Borrador incompatible (forma anterior sin unidades) → descartar.
      sessionStorage.removeItem(CLAVE_BORRADOR(cid));
    } catch (e) {
      console.error("Error al restaurar borrador de unidades", e);
    }
    return false;
  }

  function descartarBorrador() {
    if (!cid) return;
    try {
      sessionStorage.removeItem(CLAVE_BORRADOR(cid));
    } catch (e) {
      console.error("Error al descartar borrador de unidades", e);
    }
    borradorRestaurado.value = false;
  }

  watch(estado, guardarBorrador, { deep: true });

  // ─── Envío (fase 5): sectores primero, unidades después ───
  async function enviar() {
    if (!cid || !estado.unidades.length) return;
    enviando.value = true;
    error.value = null;
    try {
      const activos = estado.unidades.filter((x) => !x.marcadoEliminar);
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
          const payload = nuevos.map((x) => ({
            numero: x.numero,
            tipo: x.tipo,
            piso: x.piso,
            sectorId: resolverSector(x),
          }));
          const { data } = await unidadesService.crearUnidadesBatch(cid, { unidades: payload });
          creadas = (data.creadas || []).length;
          const porNumero = new Map((data.creadas || []).map((c) => [c.numero, c]));
          nuevos.forEach((x) => {
            const c = porNumero.get(x.numero);
            if (c) {
              x.unidadId = c.id;
              x.esNuevo = false;
              x.original = { numero: x.numero, tipo: x.tipo, piso: x.piso, sectorRef: x.sectorRef };
            }
          });
        }

        // 2b) Existentes con cambios → PUT individual
        const editados = activos.filter((x) => !x.esNuevo && cambiado(x));
        for (const x of editados) {
          try {
            await unidadesService.actualizarUnidad(cid, x.unidadId, {
              numero: x.numero,
              tipo: x.tipo,
              piso: x.piso,
              sectorId: resolverSector(x),
            });
            x.original = { numero: x.numero, tipo: x.tipo, piso: x.piso, sectorRef: x.sectorRef };
            actualizadas += 1;
          } catch (e) {
            x.error = e?.response?.data?.message || `No se pudo actualizar la unidad ${x.numero}`;
            throw e;
          }
        }

        // 2c) Existentes marcados para eliminar → desactivar
        const aEliminar = estado.unidades.filter((x) => x.marcadoEliminar && x.unidadId);
        for (const x of aEliminar) {
          try {
            await unidadesService.desactivarUnidad(cid, x.unidadId);
            eliminadas += 1;
            const idx = estado.unidades.findIndex((i) => i.id === x.id);
            if (idx !== -1) estado.unidades.splice(idx, 1);
          } catch (e) {
            // La desactivación falló (p.ej. 409: vínculos activos) → la fila
            // vuelve a su estado normal (NO quedó eliminada) y se muestra el
            // error. Una fila que falla no aborta el resto.
            x.marcadoEliminar = false;
            x.error = e?.response?.data?.message || `No se pudo eliminar la unidad ${x.numero}`;
            hayErrores = true;
          }
        }
      } else {
        // Creación inicial: batch de todas las filas activas
        const payload = activos.map((x) => ({
          numero: x.numero,
          tipo: x.tipo,
          piso: x.piso,
          sectorId: resolverSector(x),
        }));
        const { data } = await unidadesService.crearUnidadesBatch(cid, { unidades: payload });
        creadas = (data.creadas || []).length;
      }

      // Si en reedición se eliminaron todas las unidades y no quedan filas
      // nuevas, volver al wizard de creación (fase 1) para poder regenerarlas
      // con la misma numeración (el backend V64 permite reutilizar números).
      if (modoReedicion.value && estado.unidades.length === 0) {
        modoReedicion.value = false;
        estado.tipo = "CASA";
        estado.cantidad = 1;
        estado.modo = "correlativo";
        estado.desde = "1";
        estado.pisos = 1;
        estado.porPiso = 1;
        estado.personalizado = "";
        estado.sectorOrigen = "sin-sector";
        estado.sectoresNuevos = [{ uid: uid("sector"), nombre: "", descripcion: "" }];
        estado.sectorExistenteId = null;
        estado.unidades = [];
        estado.paso = 1;
        resultado.value = null;
        descartarBorrador();
        return true;
      }

      resultado.value = { creadas, actualizadas, eliminadas };
      if (!hayErrores) descartarBorrador();
      return !hayErrores;
    } catch (e) {
      console.error("Error al guardar unidades", e);
      error.value = e?.response?.data?.message || "No se pudieron guardar las unidades";
      const fields = e?.response?.data?.fields;
      if (Array.isArray(fields)) {
        estado.unidades.forEach((x) => (x.error = null));
        fields.forEach((f) => {
          const match = /unidades\[(\d+)\]/.exec(f.field || "");
          if (match) {
            const idx = Number(match[1]);
            // En reedición el batch solo contiene filas nuevas; en creación
            // inicial el índice coincide con estado.unidades.
            const fila = modoReedicion.value
              ? estado.unidades.filter((x) => x.esNuevo && !x.marcadoEliminar)[idx]
              : estado.unidades[idx];
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
          // La vista degrada: unidades sin agrupar.
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
        estado.sectorExistenteId = null;
        estado.unidades.forEach((u) => (u.sectorRef = null));
      }
      // Re-entrada: si ya existen unidades creadas y no hay borrador en curso,
      // cargarlas para reedición (editar/agregar/eliminar) en vez de empezar
      // de cero. Se excluye la unidad CONDOMINIO (automática, no editable).
      if (!borradorRestaurado.value && cid) {
        try {
          const { data } = await unidadesService.getUnidades(cid);
          const existentes = Array.isArray(data)
            ? data.filter((e) => e.activo !== false && e.tipo !== "CONDOMINIO")
            : [];
          if (existentes.length > 0) {
            modoReedicion.value = true;
            if (sectoresHabilitados.value) estado.sectorOrigen = "existente";
            // UnidadResumenResponse no trae sectorId, solo sectorNombre:
            // se resuelve contra la lista de sectores cargada.
            const sectorIdPorNombre = new Map(
              sectoresExistentes.value.map((s) => [s.nombre, s.id]),
            );
            estado.tipo = existentes[0].tipo;
            estado.unidades = existentes.map((e) => {
              const sectorRef = sectorIdPorNombre.get(e.sectorNombre) ?? null;
              return {
                id: uid("unidad"),
                numero: e.numero,
                tipo: e.tipo,
                piso: e.piso,
                sectorRef,
                error: null,
                unidadId: e.id,
                esNuevo: false,
                marcadoEliminar: false,
                original: { numero: e.numero, tipo: e.tipo, piso: e.piso, sectorRef },
              };
            });
            estado.paso = 5;
          }
        } catch (e) {
          console.error("No se pudieron cargar las unidades existentes", e);
          modoReedicion.value = false;
        }
      }
    } catch (e) {
      console.error("Error al cargar el wizard de unidades", e);
      error.value = "No se pudo cargar el wizard de unidades";
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
    estado,
    numerosPreview,
    totalGeneradas,
    envelopeExcedido,
    itemsValidos,
    tieneErrores,
    validoPaso,
    siguiente,
    atras,
    generarUnidades,
    cargarPisos,
    agregarSectorNuevo,
    eliminarSectorNuevo,
    asignarSector,
    asignarTodos,
    agregarFila,
    eliminarFila,
    ordenarUnidades,
    guardarBorrador,
    cargarBorrador,
    descartarBorrador,
    enviar,
    cargar,
  });
}