import { ref, computed, reactive, watch } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { unidadesService } from "@/services/unidadesService";
import { generarNumeros, parsearListaPersonalizada } from "@/utils/numeracionUnidades";

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
    unidades: [], // [{ id, numero, piso, sectorRef, error }]
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
      piso: n.piso,
      sectorRef: previo.get(n.numero) ?? null,
      error: null,
    }));
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
        return !!estado.sectorExistenteId;
      }
      case 4:
        return true; // "Sin sector" es una asignación válida
      case 5:
        return estado.unidades.length > 0;
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
    const totalNuevas = estado.unidades.length || totalGeneradas.value;
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
        Object.assign(estado, data.estado);
        if (Array.isArray(data.sectoresExistentes)) {
          sectoresExistentes.value = data.sectoresExistentes;
        }
        borradorRestaurado.value = true;
        return true;
      }
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

  // ─── Envío batch (fase 5): sectores primero, unidades después ───
  async function enviar() {
    if (!cid || !estado.unidades.length) return;
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

      // 2) Unidades batch
      const payload = estado.unidades.map((u) => {
        let sectorId = null;
        if (estado.sectorOrigen === "nuevo" && u.sectorRef) {
          const nuevo = estado.sectoresNuevos.find((s) => s.uid === u.sectorRef);
          sectorId = idPorRef.get((nuevo?.nombre || "").trim()) ?? null;
        } else if (estado.sectorOrigen === "existente") {
          sectorId = u.sectorRef;
        }
        return { numero: u.numero, tipo: estado.tipo, piso: u.piso, sectorId };
      });

      const { data } = await unidadesService.crearUnidadesBatch(cid, { unidades: payload });
      resultado.value = { creadas: (data.creadas || []).length };
      descartarBorrador();
      return true;
    } catch (e) {
      console.error("Error al guardar unidades", e);
      error.value = e?.response?.data?.message || "No se pudieron guardar las unidades";
      const fields = e?.response?.data?.fields;
      if (Array.isArray(fields)) {
        estado.unidades.forEach((u) => (u.error = null));
        fields.forEach((f) => {
          const match = /unidades\[(\d+)\]/.exec(f.field || "");
          if (match) {
            const idx = Number(match[1]);
            if (estado.unidades[idx]) estado.unidades[idx].error = f.message;
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
      }
      cargarBorrador();
      // Si el cargo perdió/omite permisos SECTOR_*, descartar cualquier
      // agrupación que haya quedado en el borrador.
      if (!sectoresHabilitados.value) {
        estado.sectorOrigen = "sin-sector";
        estado.sectorExistenteId = null;
        estado.unidades.forEach((u) => (u.sectorRef = null));
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
    capacidad,
    estado,
    numerosPreview,
    totalGeneradas,
    envelopeExcedido,
    validoPaso,
    siguiente,
    atras,
    generarUnidades,
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
