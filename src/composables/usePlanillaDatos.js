import { ref, computed, watch, reactive } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { unidadesService } from "@/services/unidadesService";
import { personasService } from "@/services/personasService";
import { vehiculosService } from "@/services/vehiculosService";
import { filaAPayload, esSi, TIPOS_UNIDAD, TIPOS_VINCULO, TIPOS_VEHICULO } from "@/data/planillaColumnas";

const CLAVE_BORRADOR = (cid) => `comunidad:planilla-borrador:${cid}`;

let uid = 0;
function nuevoId() {
  uid += 1;
  return `fila-${Date.now()}-${uid}`;
}

function filaVacia() {
  return {
    id: nuevoId(),
    unidad: "",
    tipo_unidad: "",
    sector: "",
    nombre: "",
    email: "",
    rut: "",
    telefono: "",
    tipo_vinculo: "",
    es_ocupante: "",
    recibe_notificaciones: "",
    es_responsable: "",
    patente1: "", tipo_vehiculo1: "", marca1: "", modelo1: "", color1: "", est1: "",
    patente2: "", tipo_vehiculo2: "", marca2: "", modelo2: "", color2: "", est2: "",
    patente3: "", tipo_vehiculo3: "", marca3: "", modelo3: "", color3: "", est3: "",
    bodega1: "", bodega2: "", bodega3: "",
  };
}

// Valida una fila contra las reglas del contrato (mismas que el import).
// `contexto` trae los sets de datos ya cargados (unidades/personas/vehículos
// existentes en el backend) para detectar duplicados reales.
export function validarFila(f, contexto = {}) {
  const errores = [];
  const unidad = (f.unidad || "").trim();
  const nombre = (f.nombre || "").trim();
  const email = (f.email || "").trim();
  const tipoUnidad = (f.tipo_unidad || "").trim().toUpperCase();
  const tipoVinculo = (f.tipo_vinculo || "").trim().toUpperCase();
  const patentes = [1, 2, 3].map((i) => (f[`patente${i}`] || "").trim().toUpperCase()).filter(Boolean);

  if (!unidad) errores.push("Casa es obligatoria");
  if (!nombre) errores.push("Nombre es obligatorio");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push("Email inválido");

  const unidadExiste = contexto.unidadesExistentes?.has(unidad);
  if (!unidadExiste && !tipoUnidad) errores.push("Tipo de unidad es obligatorio para casa nueva");
  if (tipoUnidad && !TIPOS_UNIDAD.includes(tipoUnidad)) errores.push(`Tipo de unidad inválido: ${tipoUnidad}`);

  if (!tipoVinculo || !TIPOS_VINCULO.includes(tipoVinculo))
    errores.push("Vínculo inválido (PROPIETARIO/ARRENDATARIO/RESIDENTE_ADICIONAL)");

  if (f.es_ocupante && !/^(SI|NO|S|N|TRUE|FALSE|1|0)$/i.test(f.es_ocupante))
    errores.push("Ocupante debe ser SI o NO");
  if (f.recibe_notificaciones && !/^(SI|NO|S|N|TRUE|FALSE|1|0)$/i.test(f.recibe_notificaciones))
    errores.push("Recibe notificaciones debe ser SI o NO");

  for (const p of patentes) {
    if (contexto.patentesArchivo?.has(p)) errores.push(`Patente duplicada en la planilla: ${p}`);
    if (contexto.patentesExistentes?.has(p)) errores.push(`Patente ya registrada: ${p}`);
  }
  for (let i = 1; i <= 3; i++) {
    const tv = (f[`tipo_vehiculo${i}`] || "").trim().toUpperCase();
    if (tv && !TIPOS_VEHICULO.includes(tv)) errores.push(`Tipo de vehículo inválido: ${tv}`);
  }

  if (email && contexto.emailsExistentes?.has(email.toLowerCase()))
    errores.push("Email ya registrado en el condominio");

  return errores;
}

export function usePlanillaDatos({ condominioId, cargarExistentes = true } = {}) {
  const auth = useAuthStore();
  const cid = condominioId || auth.condominioActualId;

  const filas = ref([]);
  const cargando = ref(true);
  const error = ref(null);
  const enviando = ref(false);
  const resultado = ref(null);
  const borradorRestaurado = ref(false);

  // Datos existentes del backend para dedupe.
  const unidadesExistentes = ref(new Set());
  const unidades = ref([]);
  const emailsExistentes = ref(new Set());
  const patentesExistentes = ref(new Set());
  const capacidad = ref(null);

  async function cargarExistentes() {
    if (!cid || !cargarExistentes) return;
    try {
      const [uniRes, perRes, vehRes] = await Promise.allSettled([
        unidadesService.getUnidades(cid),
        personasService.listar(cid),
        vehiculosService.listar(cid),
      ]);
      if (uniRes.status === "fulfilled") {
        unidades.value = uniRes.value.data || [];
        unidadesExistentes.value = new Set(unidades.value.map((u) => String(u.numero)));
        try {
          const capRes = await unidadesService.getCapacidad(cid);
          capacidad.value = capRes.data;
        } catch (e) {
          // Endpoint pendiente de implementación en el backend (404 esperado):
          // degradación suave, la planilla funciona sin el cupo.
          if (e?.response?.status !== 404) {
            console.error("Error al cargar capacidad del condominio", e);
          }
          capacidad.value = null;
        }
      }
      if (perRes.status === "fulfilled") {
        emailsExistentes.value = new Set(
          (perRes.value.data || []).map((p) => (p.email || "").toLowerCase()).filter(Boolean),
        );
      }
      if (vehRes.status === "fulfilled") {
        patentesExistentes.value = new Set(
          (vehRes.value.data || []).map((v) => (v.patente || "").toUpperCase()).filter(Boolean),
        );
      }
    } catch (e) {
      console.error("Error al cargar datos existentes para dedupe", e);
    }
  }

  // ─── Borrador (sessionStorage: sobrevive recargas y pérdida de señal) ───
  function guardarBorrador() {
    if (!cid) return;
    try {
      sessionStorage.setItem(
        CLAVE_BORRADOR(cid),
        JSON.stringify({ filas: filas.value, guardadoEn: Date.now() }),
      );
    } catch (e) {
      console.error("Error al guardar borrador", e);
    }
  }

  function cargarBorrador() {
    if (!cid) return false;
    try {
      const raw = sessionStorage.getItem(CLAVE_BORRADOR(cid));
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (Array.isArray(data.filas) && data.filas.length) {
        filas.value = data.filas;
        borradorRestaurado.value = true;
        return true;
      }
    } catch (e) {
      console.error("Error al restaurar borrador", e);
    }
    return false;
  }

  function descartarBorrador() {
    if (!cid) return;
    try {
      sessionStorage.removeItem(CLAVE_BORRADOR(cid));
    } catch (e) {
      console.error("Error al descartar borrador", e);
    }
    borradorRestaurado.value = false;
  }

  // Autoguardado del borrador ante cualquier cambio.
  watch(filas, guardarBorrador, { deep: true });

  // ─── Filas ───
  function agregarFila() {
    filas.value.push(filaVacia());
  }

  function eliminarFila(id) {
    filas.value = filas.value.filter((f) => f.id !== id);
  }

  function actualizarFila(id, campo, valor) {
    const f = filas.value.find((x) => x.id === id);
    if (f) f[campo] = valor;
  }

  // Marca es_responsable (1 por casa): al marcar una fila, desmarca las otras
  // de la misma casa.
  function marcarResponsable(id) {
    const f = filas.value.find((x) => x.id === id);
    if (!f) return;
    const casa = (f.unidad || "").trim();
    filas.value.forEach((x) => {
      if (x.id === id) x.es_responsable = "SI";
      else if (casa && (x.unidad || "").trim() === casa) x.es_responsable = "NO";
    });
  }

  // ─── Validación ───
  const filasConErrores = computed(() => {
    const patentesArchivo = new Set();
    const mapa = new Map();
    filas.value.forEach((f) => {
      [1, 2, 3].forEach((i) => {
        const p = (f[`patente${i}`] || "").trim().toUpperCase();
        if (p) patentesArchivo.add(p);
      });
    });
    return filas.value.map((f) => ({
      fila: f,
      errores: validarFila(f, {
        unidadesExistentes: unidadesExistentes.value,
        emailsExistentes: emailsExistentes.value,
        patentesExistentes: patentesExistentes.value,
        patentesArchivo,
      }),
    }));
  });

  const filasValidas = computed(() =>
    filasConErrores.value.filter((x) => x.errores.length === 0).map((x) => x.fila),
  );
  const filasError = computed(() =>
    filasConErrores.value.filter((x) => x.errores.length > 0),
  );

  // ─── Payload batch (todas las filas en una sola petición) ───
  function buildPayload() {
    return filasValidas.value.map((f) => filaAPayload(f));
  }

  // Envío simulado: el endpoint real (POST /importaciones/preview + ejecutar)
  // está pendiente de implementación en el backend.
  async function enviar() {
    if (!filasValidas.value.length) return;
    enviando.value = true;
    error.value = null;
    try {
      const payload = buildPayload();
      await new Promise((r) => setTimeout(r, 1200));
      resultado.value = {
        filasOk: payload.length,
        filasError: filasError.value.length,
        unidadesCreadas: new Set(payload.map((p) => p.unidad)).size,
        personasCreadas: payload.length,
        personasReutilizadas: 0,
        vinculosCreados: payload.length,
        vehiculosCreados: payload.reduce((acc, p) => acc + p.vehiculos.length, 0),
        estacionamientosVinculados: payload.reduce(
          (acc, p) => acc + p.vehiculos.filter((v) => v.estacionamiento).length,
          0,
        ),
      };
      descartarBorrador();
    } catch (e) {
      console.error("Error al enviar planilla", e);
      error.value = "No se pudo enviar la planilla";
    } finally {
      enviando.value = false;
    }
  }

  async function cargar() {
    cargando.value = true;
    error.value = null;
    try {
      await cargarExistentes();
      cargarBorrador();
    } catch (e) {
      console.error("Error al cargar planilla", e);
      error.value = "No se pudo cargar la planilla";
    } finally {
      cargando.value = false;
    }
  }

  return reactive({
    cid,
    filas,
    cargando,
    error,
    enviando,
    resultado,
    borradorRestaurado,
    capacidad,
    unidadesExistentes,
    unidades,
    emailsExistentes,
    patentesExistentes,
    filasConErrores,
    filasValidas,
    filasError,
    agregarFila,
    eliminarFila,
    actualizarFila,
    marcarResponsable,
    guardarBorrador,
    cargarBorrador,
    descartarBorrador,
    buildPayload,
    enviar,
    cargar,
  });
}

export { esSi };