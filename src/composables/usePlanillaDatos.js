import { ref, computed, watch, reactive } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { unidadesService } from "@/services/unidadesService";
import { personasService } from "@/services/personasService";
import { vehiculosService } from "@/services/vehiculosService";
import { estacionamientosService } from "@/services/estacionamientosService";
import { bodegasService } from "@/services/bodegasService";
import { importacionService } from "@/services/importacionService";
import { planillaService } from "@/services/planillaService";
import {
  filaAPayload,
  esSi,
  TIPOS_UNIDAD,
  TIPOS_VINCULO,
  TIPOS_VEHICULO,
  COLUMNAS_DEFAULT,
  clavesColumnas,
  filasCrudasADinamicas,
  esFilaDinamica,
  esEstacionamientoVisita,
  migrarClavesCompatibles,
  normalizarEstAnidados,
} from "@/data/planillaColumnas";
import { parsearCsv, normalizarFilas } from "@/utils/csvParser";
import { compararUnidades } from "@/utils/ordenamientoNatural";
import { rutValido, telefonoChileValido } from "@/utils/validadoresChile";

const CLAVE_BORRADOR = (cid) => `comunidad:planilla-borrador:${cid}`;
// FE-A: último resultado del import (agregado + filas con advertencias) para
// sobrevivir recargas en la misma pestaña. Respaldo local hasta BE-5 (briku#80),
// que lo hidratará desde el backend (7 días); la sesión se pierde al cerrar.
const CLAVE_RESULTADO = (cid) => `comunidad:resultado-import:${cid}`;
// Staging + preview en sesión: volver a la vista tras navegar no pierde el
// borrador del archivo ni la validación (el File .xlsx no se puede persistir;
// su preview sí, válido 30 min por TTL del backend).
const CLAVE_STAGING = (cid) => `comunidad:staging-import:${cid}`;

let uid = 0;
function nuevoId() {
  uid += 1;
  return `fila-${Date.now()}-${uid}`;
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
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
    es_residente: "",
    recibe_notificaciones: "",
    es_responsable: "",
    vehiculos: [],
    bodegas: [],
    // Estacionamientos standalone (unidad ↔ est, sin vehículo — la unidad es
    // el core). [{uid, nombre, __estacionamientoId?}]
    estacionamientos: [],
    esNuevo: true,
    marcadoEliminar: false,
    original: null,
  };
}

function vehiculoVacio() {
  return {
    uid: nuevoId(),
    patente: "",
    tipo: "",
    marca: "",
    modelo: "",
    color: "",
    estacionamiento: "",
  };
}

function bodegaVacia() {
  return { uid: nuevoId(), nombre: "" };
}

function estacionamientoVacio() {
  return { uid: nuevoId(), nombre: "" };
}

// Snapshot de una fila para detectar cambios (vs. el estado original del backend).
function snapshotFila(f) {
  return {
    unidad: f.unidad,
    tipo_unidad: f.tipo_unidad,
    sector: f.sector,
    nombre: f.nombre,
    email: f.email,
    rut: f.rut,
    telefono: f.telefono,
    tipo_vinculo: f.tipo_vinculo,
    es_residente: f.es_residente,
    recibe_notificaciones: f.recibe_notificaciones,
    es_responsable: f.es_responsable,
    vehiculos: (f.vehiculos || []).map((v) => ({ ...v })),
    bodegas: (f.bodegas || []).map((b) => ({ ...b })),
    estacionamientos: (f.estacionamientos || []).map((e) => ({ ...e })),
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
  const rut = (f.rut || "").trim();
  const telefono = (f.telefono || "").trim();
  const tipoUnidad = (f.tipo_unidad || "").trim().toUpperCase();
  const tipoVinculo = (f.tipo_vinculo || "").trim().toUpperCase();
  const fila = esFilaDinamica(f) ? f : filasCrudasADinamicas([f])[0];
  const vehiculos = fila.vehiculos || [];
  const patentes = vehiculos
    .map((v) => (v.patente || "").trim().toUpperCase())
    .filter(Boolean);

  if (!unidad) errores.push("Casa es obligatoria");
  if (!nombre) errores.push("Nombre es obligatorio");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push("Email inválido");

  if (rut && !rutValido(rut)) errores.push("RUT inválido (ej: 12.345.678-9)");
  if (telefono && !telefonoChileValido(telefono)) errores.push("Teléfono inválido (ej: +56 9 1234 5678)");

  const unidadExiste = contexto.unidadesExistentes?.has(unidad);
  if (!unidadExiste && !tipoUnidad) errores.push("Tipo de unidad es obligatorio para casa nueva");
  if (tipoUnidad && !TIPOS_UNIDAD.includes(tipoUnidad)) errores.push(`Tipo de unidad inválido: ${tipoUnidad}`);

  if (!tipoVinculo || !TIPOS_VINCULO.includes(tipoVinculo))
    errores.push("Vínculo inválido (PROPIETARIO/ARRENDATARIO/RESIDENTE_ADICIONAL)");

  if (f.es_residente && !/^(SI|NO|S|N|TRUE|FALSE|1|0)$/i.test(f.es_residente))
    errores.push("Residente debe ser SI o NO");
  if (f.recibe_notificaciones && !/^(SI|NO|S|N|TRUE|FALSE|1|0)$/i.test(f.recibe_notificaciones))
    errores.push("Recibe notificaciones debe ser SI o NO");

  for (const p of patentes) {
    if (contexto.patentesArchivo?.has(p)) errores.push(`Patente duplicada en la planilla: ${p}`);
    // Las filas existentes ya están en el backend: su patente no debe marcarse
    // como "ya registrada" (sería un falso positivo al re-entrar).
    if (f.esNuevo !== false && contexto.patentesExistentes?.has(p))
      errores.push(`Patente ya registrada: ${p}`);
  }
  for (const v of vehiculos) {
    const tv = (v.tipo || "").trim().toUpperCase();
    if (tv && !TIPOS_VEHICULO.includes(tv)) errores.push(`Tipo de vehículo inválido: ${tv}`);
    // Paridad con el backend ("patente obligatoria"): un est sin patente se
    // perdería silencioso al importar — avisar en local antes del server.
    const pat = (v.patente || "").trim();
    const est = (v.estacionamiento || "").trim();
    if (!pat && est) errores.push(`Estacionamiento sin patente: ${est}`);
  }
  // Filas planas legacy: filaCrudaADinamica descarta el est huérfano, así que
  // se revisa el flat original para no perderlo silencioso.
  if (!esFilaDinamica(f)) {
    for (let i = 1; i <= 3; i++) {
      const pat = (f[`patente${i}`] || "").trim();
      const est = (f[`est${i}`] || "").trim();
      if (!pat && est) errores.push(`Est. ${i} sin patente (${est})`);
    }
  }

  if (f.esNuevo !== false && email && contexto.emailsExistentes?.has(email.toLowerCase()))
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
  // 'validar' | 'ejecutar' | null — distingue VALIDANDO de EJECUTANDO en `fase`.
  const operacion = ref(null);
  const resultado = ref(null);
  const previewData = ref(null);
  // FE-3/FE-5: filas del preview preservadas al ejecutar (para filtrar el
  // resultado y marcar advertencias en reedición). El backend aún no devuelve
  // detalle por fila en el ejecutar, así que se conserva la copia en memoria.
  const resultadoFilas = ref(null);
  // D: true solo recién importado; lo restaurado de sesión/backend es histórico.
  const resultadoFresco = ref(false);
  // FE-4: descarga del CSV del resultado (BE-3).
  const descargandoResultado = ref(false);
  const errorDescarga = ref(null);
  const archivoNombre = ref(null);
  // Staging editable (F1, modelo Meta): parse local del csv ANTES de cualquier
  // POST. Se edita en la app y solo al pulsar [Validar] se envía al backend.
  const previewFilasRaw = ref(null);
  // Archivo pendiente de validar (xlsx sin parser local): se guarda el File y
  // solo se sube al pulsar [Validar]. Nada se POSTea al seleccionar.
  const archivoPendiente = ref(null);
  // true si el csv cargado no trae columnas estacionamiento1..3 (formato de
  // 32 cols): los est solo pueden venir anidados al vehículo.
  const sinEstStandalone = ref(false);
  const borradorRestaurado = ref(false);
  const modoReedicion = ref(false);

  // Máquina de estados explícita (F4):
  // VACIO → STAGED → VALIDANDO → REVIEW → EJECUTANDO → REEDICION
  // MANUAL = borrador manual sin archivo (flujo manual existente).
  const fase = computed(() => {
    if (enviando.value) return operacion.value === "ejecutar" ? "EJECUTANDO" : "VALIDANDO";
    if (previewData.value) return "REVIEW";
    if ((previewFilasRaw.value?.length || 0) > 0 || archivoPendiente.value) return "STAGED";
    if (modoReedicion.value) return "REEDICION";
    if ((filas.value?.length || 0) > 0) return "MANUAL";
    return "VACIO";
  });

  // Datos existentes del backend para dedupe y reconstrucción.
  const unidadesExistentes = ref(new Set());
  const unidades = ref([]);
  const personas = ref([]);
  const vehiculos = ref([]);
  const emailsExistentes = ref(new Set());
  const patentesExistentes = ref(new Set());
  const estacionamientos = ref([]);
  const bodegas = ref([]);
  const capacidad = ref(null);

  const personaPorId = computed(() => {
    const m = new Map();
    (personas.value || []).forEach((p) => m.set(p.id, p));
    return m;
  });

  async function cargarExistentes() {
    if (!cid || !cargarExistentes) return;
    try {
      const [uniRes, perRes, vehRes, estRes, bodRes] = await Promise.allSettled([
        unidadesService.getUnidades(cid),
        personasService.listar(cid),
        vehiculosService.listar(cid),
        estacionamientosService.getEstacionamientos(cid),
        bodegasService.getBodegas(cid),
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
        personas.value = perRes.value.data || [];
        emailsExistentes.value = new Set(
          personas.value.map((p) => (p.email || "").toLowerCase()).filter(Boolean),
        );
      }
      if (vehRes.status === "fulfilled") {
        vehiculos.value = vehRes.value.data || [];
        patentesExistentes.value = new Set(
          vehiculos.value.map((v) => (v.patente || "").toUpperCase()).filter(Boolean),
        );
      }
      if (estRes.status === "fulfilled") {
        estacionamientos.value = estRes.value.data || [];
      }
      if (bodRes.status === "fulfilled") {
        bodegas.value = bodRes.value.data || [];
      }
    } catch (e) {
      console.error("Error al cargar datos existentes para dedupe", e);
    }
  }

  // ─── Reconstrucción (re-entrada) ──────────────────────────────────────────
  // Relee el estado real del backend (vínculos persona-unidad activos) y arma
  // una fila por vínculo, con metadatos para editar/eliminar después.
  async function reconstruirFilas() {
    if (!cid || borradorRestaurado.value || !unidades.value.length) return;
    // BE-6 (briku#81): snapshot batch en 1 llamada. Fallback a la vía por
    // unidad (2 GET × N) si el backend no lo tiene (404) o falta VINCULO_VER.
    try {
      const res = await planillaService.reedicion(cid);
      if (reconstruirDesdeSnapshot(res.data)) return;
    } catch (e) {
      if (e?.response?.status !== 404 && e?.response?.status !== 403) {
        console.error("Error en snapshot de reedición, usando vía por unidad", e);
      }
    }
    // Vínculos reales unidad ↔ estacionamiento (el GET /estacionamientos ya
    // trae propietario/arrendatario por unidad, sin requests extra). La unidad
    // es el core: se reconstruyen como lista standalone editable, no como
    // display. Mapa unidadId → [{nombre, id}].
    const estPorUnidad = new Map();
    (estacionamientos.value || []).forEach((e) => {
      const ids = new Set();
      if (e.propietario?.unidadId) ids.add(e.propietario.unidadId);
      if (e.arrendatarioEfectivo?.unidadId) ids.add(e.arrendatarioEfectivo.unidadId);
      (e.arrendatariosFuturos || []).forEach((a) => {
        if (a?.unidadId) ids.add(a.unidadId);
      });
      ids.forEach((id) => {
        if (!estPorUnidad.has(id)) estPorUnidad.set(id, []);
        estPorUnidad.get(id).push({ nombre: e.nombre, id: e.id });
      });
    });
    const reconstruidas = [];
    const residenciales = unidades.value.filter((u) => u.tipo !== "CONDOMINIO");
    const resultados = await Promise.allSettled(
      residenciales.map(async (u) => {
        const [vinRes, detRes] = await Promise.allSettled([
          personasService.vinculosUnidad(cid, u.id),
          unidadesService.getUnidad(cid, u.id),
        ]);
        const vinculos = vinRes.status === "fulfilled" ? vinRes.value.data || [] : [];
        const detalle = detRes.status === "fulfilled" ? detRes.value.data : null;
        const bodegasDet = detalle?.bodegas || [];
        const vehiculosUnidad = vehiculos.value.filter((v) => v.unidadId === u.id);
        const activos = vinculos.filter((v) => v.activo);
        if (!activos.length) return;
        // Los vehículos/bodegas son por UNIDAD en el backend: se adjuntan a la
        // fila primaria (PROPIETARIO/ARRENDATARIO, si no la primera).
        const primaria =
          activos.find((v) => v.tipo === "PROPIETARIO" || v.tipo === "ARRENDATARIO") || activos[0];
        activos.forEach((v) => {
          const persona = personaPorId.value.get(v.personaId) || {};
          const esPrimaria = v === primaria;
          reconstruidas.push({
            id: nuevoId(),
            unidad: String(u.numero),
            tipo_unidad: u.tipo,
            sector: u.sectorNombre || "",
            nombre: v.personaNombre || persona.nombre || "",
            email: persona.email || "",
            rut: persona.rut || "",
            telefono: persona.telefono || "",
            tipo_vinculo: v.tipo,
            es_residente: v.esOcupante ? "SI" : "NO",
            recibe_notificaciones: v.recibeNotificaciones ? "SI" : "NO",
            es_responsable: v.esResponsable ? "SI" : "NO",
            vehiculos: esPrimaria
              ? vehiculosUnidad.map((vh) => ({
                  uid: nuevoId(),
                  patente: vh.patente || "",
                  tipo: vh.tipo || "",
                  marca: vh.marca || "",
                  modelo: vh.modelo || "",
                  color: vh.color || "",
                  // El mapeo vehículo→estacionamiento no es reconstruible (el
                  // vínculo es a nivel unidad): queda en blanco.
                  estacionamiento: "",
                  __vehiculoId: vh.id,
                }))
              : [],
            bodegas: esPrimaria
              ? bodegasDet.map((b) => ({
                  uid: nuevoId(),
                  nombre: b.nombre || "",
                  __bodegaId: b.bodegaId,
                }))
              : [],
            esNuevo: false,
            __vinculoId: v.id,
            __personaId: v.personaId,
            __unidadId: u.id,
            // Estacionamientos standalone vinculados a la unidad en BD
            // (lista editable: vincular/desvincular en aplicarEdicion).
            estacionamientos: esPrimaria
              ? (estPorUnidad.get(u.id) || []).map((e) => ({
                  uid: nuevoId(),
                  nombre: e.nombre,
                  __estacionamientoId: e.id,
                }))
              : [],
            marcadoEliminar: false,
            original: null,
          });
        });
      }),
    );
    if (reconstruidas.length) {
      // Mismo orden natural que la vía snapshot.
      reconstruidas.sort((a, b) => compararUnidades(a.unidad, b.unidad));
      filas.value = reconstruidas;
      filas.value.forEach((f) => {
        f.original = snapshotFila(f);
      });
      modoReedicion.value = true;
    }
  }

  // Reconstrucción desde el snapshot batch (BE-6): misma forma que la vía por
  // unidad (1 fila por vínculo activo, recursos en la fila primaria), pero con
  // los ids de vínculo incluidos (sin GET previo al desvincular). Retorna
  // false si no hay filas (el llamador usa el fallback).
  function reconstruirDesdeSnapshot(items) {
    if (!Array.isArray(items) || !items.length) return false;
    const reconstruidas = [];
    const porUnidad = new Map();
    (items || []).forEach((r) => {
      if (!r || !r.unidad || r.unidad.tipo === "CONDOMINIO") return;
      if (!porUnidad.has(r.unidad.id)) porUnidad.set(r.unidad.id, []);
      porUnidad.get(r.unidad.id).push(r);
    });
    porUnidad.forEach((vinculos) => {
      const primaria =
        vinculos.find((v) => v.tipo === "PROPIETARIO" || v.tipo === "ARRENDATARIO") ||
        vinculos[0];
      vinculos.forEach((v) => {
        const esPrimaria = v === primaria;
        reconstruidas.push({
          id: nuevoId(),
          unidad: String(v.unidad.numero),
          tipo_unidad: v.unidad.tipo,
          sector: v.unidad.sectorNombre || "",
          nombre: v.persona?.nombre || "",
          email: v.persona?.email || "",
          rut: v.persona?.rut || "",
          telefono: v.persona?.telefono || "",
          tipo_vinculo: v.tipo,
          es_residente: v.esOcupante ? "SI" : "NO",
          recibe_notificaciones: v.recibeNotificaciones ? "SI" : "NO",
          es_responsable: v.esResponsable ? "SI" : "NO",
          vehiculos: esPrimaria
            ? (v.vehiculos || []).map((vh) => ({
                uid: nuevoId(),
                patente: vh.patente || "",
                tipo: vh.tipo || "",
                marca: vh.marca || "",
                modelo: vh.modelo || "",
                color: vh.color || "",
                // El mapeo vehículo→estacionamiento no es reconstruible (el
                // vínculo es a nivel unidad): queda en blanco.
                estacionamiento: "",
                __vehiculoId: vh.vehiculoId,
                __vinculoVehiculoId: vh.vinculoId,
              }))
            : [],
          bodegas: esPrimaria
            ? (v.bodegas || []).map((b) => ({
                uid: nuevoId(),
                nombre: b.nombre || "",
                __bodegaId: b.bodegaId,
                __vinculoBodegaId: b.vinculoId,
              }))
            : [],
          esNuevo: false,
          __vinculoId: v.vinculoId,
          __personaId: v.persona?.id,
          __unidadId: v.unidad.id,
          // Estacionamientos standalone vinculados a la unidad en BD
          // (lista editable: vincular/desvincular en aplicarEdicion).
          estacionamientos: esPrimaria
            ? (v.estacionamientos || []).map((e) => ({
                uid: nuevoId(),
                nombre: e.nombre,
                __estacionamientoId: e.estacionamientoId,
                __vinculoEstacionamientoId: e.vinculoId,
              }))
            : [],
          marcadoEliminar: false,
          original: null,
        });
      });
    });
    if (!reconstruidas.length) return false;
    // Orden natural por casa (1, 2, ..., 10, 11 — no lexicográfico).
    // Estable: conserva el orden dentro de cada unidad (primaria primero).
    reconstruidas.sort((a, b) => compararUnidades(a.unidad, b.unidad));
    filas.value = reconstruidas;
    filas.value.forEach((f) => {
      f.original = snapshotFila(f);
    });
    modoReedicion.value = true;
    return true;
  }

  // ─── Borrador (sessionStorage: sobrevive recargas y pérdida de señal) ───
  // Solo trabajo manual o ediciones en reedición: las filas reconstruidas del
  // backend sin cambios NO se guardan (si no, contaminan la sesión y al volver
  // se salta reconstruirFilas() dejando modoReedicion=false con paso completado).
  function guardarBorrador() {
    if (!cid) return;
    if (modoReedicion.value && !hayCambios.value) return;
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
        // Migración defensiva: borradores legacy (formato plano patente1..3)
        // se convierten al shape dinámico vehiculos[]/bodegas[] + clave vieja
        // es_ocupante → es_residente + est anidados → standalone.
        filas.value = data.filas.map((f) =>
          normalizarEstAnidados(
            migrarClavesCompatibles(esFilaDinamica(f) ? f : filasCrudasADinamicas([f])[0]),
          ),
        );
        // Sesión contaminada (solo reconstruidas guardadas por el watch viejo):
        // se descarta y se reconstruye fresco con modoReedicion correcto.
        if (filas.value.length && filas.value.every((f) => f.esNuevo === false)) {
          descartarBorrador();
          filas.value = [];
          return false;
        }
        // Mezcla con trabajo manual: hay existentes reales → reedición.
        if (filas.value.some((f) => f.esNuevo === false)) {
          modoReedicion.value = true;
        }
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

  // ─── Resultado en sesión (FE-A: sobrevive recargas, se pierde al cerrar) ──
  function guardarResultadoSesion() {
    if (!cid || !resultado.value) return;
    try {
      sessionStorage.setItem(
        CLAVE_RESULTADO(cid),
        JSON.stringify({
          resultado: resultado.value,
          filas: resultadoFilas.value,
          guardadoEn: Date.now(),
        }),
      );
    } catch (e) {
      console.error("Error al guardar resultado en sesión", e);
    }
  }

  function cargarResultadoSesion() {
    if (!cid) return false;
    try {
      const raw = sessionStorage.getItem(CLAVE_RESULTADO(cid));
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !data.resultado) return false;
      resultado.value = data.resultado;
      resultadoFresco.value = false;
      resultadoFilas.value = Array.isArray(data.filas) ? data.filas : null;
      return true;
    } catch (e) {
      console.error("Error al restaurar resultado en sesión", e);
    }
    return false;
  }

  function descartarResultadoSesion() {
    if (!cid) return;
    try {
      sessionStorage.removeItem(CLAVE_RESULTADO(cid));
    } catch (e) {
      console.error("Error al descartar resultado en sesión", e);
    }
  }

  // ─── Staging + preview en sesión (no se pierde al navegar) ───────────────
  function guardarStagingSesion() {
    if (!cid) return;
    try {
      sessionStorage.setItem(
        CLAVE_STAGING(cid),
        JSON.stringify({
          staging: previewFilasRaw.value,
          archivoNombre: archivoNombre.value,
          archivoPendienteNombre: archivoPendiente.value?.name || null,
          sinEstStandalone: sinEstStandalone.value,
          preview: previewData.value,
          guardadoEn: Date.now(),
        }),
      );
    } catch (e) {
      console.error("Error al guardar staging en sesión", e);
    }
  }

  function cargarStagingSesion() {
    if (!cid) return false;
    try {
      const raw = sessionStorage.getItem(CLAVE_STAGING(cid));
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || (!data.staging?.length && !data.preview)) return false;
      previewFilasRaw.value = Array.isArray(data.staging) ? data.staging : null;
      archivoNombre.value = data.archivoNombre || null;
      sinEstStandalone.value = !!data.sinEstStandalone;
      previewData.value = data.preview || null;
      // El File .xlsx no sobrevive a la sesión: queda el nombre como referencia
      // y el preview validado (Importar sigue válido dentro del TTL).
      archivoPendiente.value = null;
      return true;
    } catch (e) {
      console.error("Error al restaurar staging en sesión", e);
    }
    return false;
  }

  function descartarStagingSesion() {
    if (!cid) return;
    try {
      sessionStorage.removeItem(CLAVE_STAGING(cid));
    } catch (e) {
      console.error("Error al descartar staging en sesión", e);
    }
  }

  // Autoguardado del borrador ante cualquier cambio (debounced 600ms, evita bloqueo Firefox con 500+ filas)
  let borradorTimer = null;
  function guardarBorradorDebounced() {
    if (borradorTimer) clearTimeout(borradorTimer);
    borradorTimer = setTimeout(() => guardarBorrador(), 600);
  }
  let stagingTimer = null;
  function guardarBorradorDebouncedStaging() {
    if (stagingTimer) clearTimeout(stagingTimer);
    stagingTimer = setTimeout(() => guardarStagingSesion(), 600);
  }
  watch(filas, guardarBorradorDebounced, { deep: true });
  // Staging editable: persiste ediciones (misma ventana de sesión).
  watch(previewFilasRaw, guardarBorradorDebouncedStaging, { deep: true });

  // ─── Filas ───
  function agregarFila() {
    filas.value.push(filaVacia());
  }

  function eliminarFila(id) {
    filas.value = filas.value.filter((f) => f.id !== id);
  }

  // En reedición: las filas existentes se marcan para desactivar (no se borran
  // del arreglo); las nuevas se eliminan directamente.
  function marcarEliminar(id) {
    const f = filas.value.find((x) => x.id === id);
    if (!f) return;
    if (f.esNuevo === false) {
      f.marcadoEliminar = !f.marcadoEliminar;
    } else {
      eliminarFila(id);
    }
  }

  function actualizarFila(id, campo, valor) {
    const f = filas.value.find((x) => x.id === id);
    if (f) f[campo] = valor;
  }

  // ─── Recursos por fila (vehículos / bodegas dinámicos) ───────────────────
  function agregarVehiculo(id) {
    const f = filas.value.find((x) => x.id === id);
    if (f) f.vehiculos.push(vehiculoVacio());
  }

  function quitarVehiculo(id, uid) {
    const f = filas.value.find((x) => x.id === id);
    if (f) f.vehiculos = f.vehiculos.filter((v) => v.uid !== uid);
  }

  function agregarBodega(id) {
    const f = filas.value.find((x) => x.id === id);
    if (f) f.bodegas.push(bodegaVacia());
  }

  function quitarBodega(id, uid) {
    const f = filas.value.find((x) => x.id === id);
    if (f) f.bodegas = f.bodegas.filter((b) => b.uid !== uid);
  }

  function agregarEstacionamiento(id) {
    const f = filas.value.find((x) => x.id === id);
    if (f) f.estacionamientos.push(estacionamientoVacio());
  }

  function quitarEstacionamiento(id, uid) {
    const f = filas.value.find((x) => x.id === id);
    if (f) f.estacionamientos = (f.estacionamientos || []).filter((e) => e.uid !== uid);
  }

  // ─── Selección de casa desde unidades existentes ─────────────────────────
  // Las unidades son la base del condominio: la casa se elige de las ya
  // creadas y de ahí se derivan tipo y sector (no se escriben a mano).
  function unidadPorNumero(numero) {
    const n = String(numero || "").trim();
    return unidades.value.find((u) => String(u.numero) === n) || null;
  }

  function asignarUnidad(id, numero) {
    const f = filas.value.find((x) => x.id === id);
    if (!f) return;
    const u = unidadPorNumero(numero);
    f.unidad = String(numero || "").trim();
    f.tipo_unidad = u ? u.tipo : "";
    f.sector = u?.sectorNombre || "";
  }

  // Marca es_responsable (1 por casa): al marcar una fila, desmarca las otras
  // de la misma casa. El responsable siempre recibe notificaciones (SI).
  function marcarResponsable(id) {
    const f = filas.value.find((x) => x.id === id);
    if (!f) return;
    const casa = (f.unidad || "").trim();
    filas.value.forEach((x) => {
      if (x.id === id) {
        x.es_responsable = "SI";
        x.recibe_notificaciones = "SI";
      } else if (casa && (x.unidad || "").trim() === casa) {
        x.es_responsable = "NO";
      }
    });
  }

  // ─── Validación ───
  const filasConErrores = computed(() => {
    // Patentes por fila (para detectar duplicados ENTRE filas, no contra la
    // propia fila: una patente única no debe marcarse como duplicada).
    const patentesPorFila = filas.value.map((f) =>
      new Set(
        (f.vehiculos || [])
          .map((v) => (v.patente || "").trim().toUpperCase())
          .filter(Boolean),
      ),
    );
    return filas.value.map((f, idx) => {
      const patentesArchivo = new Set();
      patentesPorFila.forEach((set, j) => {
        if (j === idx) return;
        set.forEach((p) => patentesArchivo.add(p));
      });
      return {
        fila: f,
        errores: validarFila(f, {
          unidadesExistentes: unidadesExistentes.value,
          emailsExistentes: emailsExistentes.value,
          patentesExistentes: patentesExistentes.value,
          patentesArchivo,
        }),
      };
    });
  });

  const filasValidas = computed(() =>
    filasConErrores.value.filter((x) => x.errores.length === 0).map((x) => x.fila),
  );
  const filasError = computed(() =>
    filasConErrores.value.filter((x) => x.errores.length > 0),
  );
  // Solo las filas NUEVAS válidas van al import (las existentes ya están en el
  // backend y se gestionan con PUT/PATCH/desactivar).
  const filasNuevasValidas = computed(() =>
    filasValidas.value.filter((f) => f.esNuevo !== false),
  );

  // ─── Detección de cambios (reedición) ─────────────────────────────────────
  function vehiculosCambiados(f, o) {
    const cur = f.vehiculos || [];
    const orig = o.vehiculos || [];
    if (cur.length !== orig.length) return true;
    for (const v of cur) {
      const ov = orig.find(
        (x) =>
          (x.__vehiculoId && x.__vehiculoId === v.__vehiculoId) || x.uid === v.uid,
      );
      if (!ov) return true;
      for (const k of ["patente", "tipo", "marca", "modelo", "color", "estacionamiento"]) {
        if (String(v[k] || "") !== String(ov[k] || "")) return true;
      }
    }
    return false;
  }

  function bodegasCambiadas(f, o) {
    const cur = f.bodegas || [];
    const orig = o.bodegas || [];
    if (cur.length !== orig.length) return true;
    for (const b of cur) {
      const ob = orig.find(
        (x) => (x.__bodegaId && x.__bodegaId === b.__bodegaId) || x.uid === b.uid,
      );
      if (!ob) return true;
      if (String(b.nombre || "") !== String(ob.nombre || "")) return true;
    }
    return false;
  }

  // Standalone unidad ↔ est (sin vehículo): compara por id o uid + nombre.
  function estacionamientosCambiados(f, o) {
    const cur = f.estacionamientos || [];
    const orig = o.estacionamientos || [];
    if (cur.length !== orig.length) return true;
    for (const e of cur) {
      const oe = orig.find(
        (x) =>
          (x.__estacionamientoId && x.__estacionamientoId === e.__estacionamientoId) ||
          x.uid === e.uid,
      );
      if (!oe) return true;
      if (String(e.nombre || "") !== String(oe.nombre || "")) return true;
    }
    return false;
  }

  function cambiado(f) {
    const o = f.original;
    if (!o) return false;
    const base = [
      "unidad",
      "tipo_unidad",
      "sector",
      "nombre",
      "email",
      "rut",
      "telefono",
      "tipo_vinculo",
      "es_residente",
      "recibe_notificaciones",
      "es_responsable",
    ];
    for (const k of base) {
      if (String(f[k] || "") !== String(o[k] || "")) return true;
    }
    if (vehiculosCambiados(f, o)) return true;
    if (bodegasCambiadas(f, o)) return true;
    if (estacionamientosCambiados(f, o)) return true;
    return false;
  }

  const hayCambios = computed(() => {
    if (filasNuevasValidas.value.length) return true;
    return filas.value.some(
      (f) => f.esNuevo === false && (f.marcadoEliminar || cambiado(f)),
    );
  });

  // FE-5: mapa email|unidad → advertencias[] del último import (fuente del
  // badge en reedición; en memoria, se pierde al recargar — aceptable).
  const advertenciasPostImport = computed(() => {
    const m = new Map();
    (resultadoFilas.value || []).forEach((f) => {
      const adv = f?.advertencias || [];
      if (!adv.length) return;
      const email = (f.personaEmail || f.email || "").toLowerCase().trim();
      const unidad = String(f.unidad || "").trim();
      if (email && unidad) m.set(`${email}|${unidad}`, adv);
    });
    return m;
  });

  function advertenciasDeFila(f) {
    if (!f) return [];
    const email = (f.email || "").toLowerCase().trim();
    const unidad = String(f.unidad || "").trim();
    return advertenciasPostImport.value.get(`${email}|${unidad}`) || [];
  }

  // ─── Payload batch (solo filas nuevas) ───
  function buildPayload() {
    return filasNuevasValidas.value.map((f) => filaAPayload(f));
  }

  // ─── Resolución de IDs (reedición) ────────────────────────────────────────
  // Las filas nuevas recién importadas no traen IDs del backend; se resuelven
  // de forma perezosa al editar (por unidad + persona + vínculo activo).
  async function resolverIdsFila(f) {
    if (!f.__unidadId) {
      const u = unidadPorNumero(f.unidad);
      if (u) f.__unidadId = u.id;
    }
    if (!f.__personaId) {
      const p = personas.value.find(
        (x) => (x.email || "").toLowerCase() === (f.email || "").toLowerCase(),
      );
      if (p) f.__personaId = p.id;
    }
    if (!f.__vinculoId && f.__unidadId && f.__personaId) {
      try {
        const res = await personasService.vinculosUnidad(cid, f.__unidadId);
        const v = (res.data || []).find(
          (x) => x.personaId === f.__personaId && x.activo,
        );
        if (v) f.__vinculoId = v.id;
      } catch (e) {
        console.error("Error al resolver vínculo de la fila", e);
      }
    }
  }

  function resolverEstacionamientoId(nombre) {
    const n = String(nombre || "").trim();
    return estacionamientos.value.find((x) => String(x.nombre).trim() === n)?.id || null;
  }

  function resolverBodegaId(nombre) {
    const n = String(nombre || "").trim();
    return bodegas.value.find((x) => String(x.nombre).trim() === n)?.id || null;
  }

  async function desvincularEstacionamiento(nombre, unidadId) {
    const id = resolverEstacionamientoId(nombre);
    if (!id) return;
    try {
      const res = await estacionamientosService.vinculos(cid, id);
      const v = (res.data || []).find((x) => x.activo && x.unidadId === unidadId);
      if (v) await estacionamientosService.desvincular(cid, id, v.id);
    } catch (e) {
      console.error("Error al desvincular estacionamiento", e);
      throw e;
    }
  }

  async function desvincularEstacionamientoPorId(estacionamientoId, unidadId, vinculoId) {
    try {
      if (!vinculoId) {
        const res = await estacionamientosService.vinculos(cid, estacionamientoId);
        const v = (res.data || []).find((x) => x.activo && x.unidadId === unidadId);
        if (v) vinculoId = v.id;
      }
      if (vinculoId) {
        await estacionamientosService.desvincular(cid, estacionamientoId, vinculoId);
      }
    } catch (e) {
      console.error("Error al desvincular estacionamiento", e);
      throw e;
    }
  }

  async function desvincularBodega(bodegaId, unidadId, vinculoId) {
    try {
      if (!vinculoId) {
        const res = await bodegasService.vinculos(cid, bodegaId);
        const v = (res.data || []).find((x) => x.activo && x.unidadId === unidadId);
        if (v) vinculoId = v.id;
      }
      if (vinculoId) {
        await bodegasService.desvincular(cid, bodegaId, vinculoId);
      }
    } catch (e) {
      console.error("Error al desvincular bodega", e);
      throw e;
    }
  }

  async function aplicarEstacionamiento(v, ov, f) {
    const nuevo = (v.estacionamiento || "").trim();
    const anterior = (ov?.estacionamiento || "").trim();
    if (nuevo === anterior) return;
    if (anterior) await desvincularEstacionamiento(anterior, f.__unidadId);
    if (nuevo && !esEstacionamientoVisita(nuevo)) {
      const id = resolverEstacionamientoId(nuevo);
      if (id) {
        await estacionamientosService.vincular(cid, id, {
          tipo: f.tipo_vinculo,
          unidadId: f.__unidadId,
          fechaInicio: hoy(),
        });
      }
    }
  }

  // Aplica los cambios de UNA fila existente (persona + vínculo + recursos).
  async function aplicarEdicion(f) {
    await resolverIdsFila(f);
    const o = f.original || {};

    // Persona: solo nombre/teléfono son editables en el backend.
    if (
      String(f.nombre || "") !== String(o.nombre || "") ||
      String(f.telefono || "") !== String(o.telefono || "")
    ) {
      await personasService.actualizar(cid, f.__personaId, {
        nombre: (f.nombre || "").trim(),
        telefono: (f.telefono || "").trim(),
      });
    }

    // Vínculo: recibe_notificaciones tiene PATCH dedicado; los demás flags
    // (tipo/es_residente/es_responsable) exigen desactivar + recrear.
    const vinculoCambio =
      String(f.tipo_vinculo || "") !== String(o.tipo_vinculo || "") ||
      String(f.es_residente || "") !== String(o.es_residente || "") ||
      String(f.es_responsable || "") !== String(o.es_responsable || "");
    const notifCambio =
      String(f.recibe_notificaciones || "") !== String(o.recibe_notificaciones || "");

    if (vinculoCambio) {
      if (f.__vinculoId) await personasService.desactivarVinculo(cid, f.__vinculoId);
      const res = await personasService.crearVinculo(cid, {
        personaId: f.__personaId,
        unidadId: f.__unidadId,
        tipo: (f.tipo_vinculo || "").trim(),
        esOcupante: esSi(f.es_residente),
        recibeNotificaciones: esSi(f.recibe_notificaciones),
        esResponsable: esSi(f.es_responsable),
        fechaInicio: hoy(),
      });
      f.__vinculoId = res.data?.id;
    } else if (notifCambio && f.__vinculoId) {
      await personasService.actualizarRecibeNotificaciones(
        cid,
        f.__vinculoId,
        esSi(f.recibe_notificaciones),
      );
    }

    // Vehículos: quitar / crear / actualizar / estacionamiento.
    const origVehiculos = o.vehiculos || [];
    const curVehiculos = f.vehiculos || [];
    for (const ov of origVehiculos) {
      if (ov.__vehiculoId && !curVehiculos.some((v) => v.__vehiculoId === ov.__vehiculoId)) {
        await vehiculosService.desactivar(cid, ov.__vehiculoId);
      }
    }
    for (const v of curVehiculos) {
      const ov = origVehiculos.find(
        (x) => x.__vehiculoId && x.__vehiculoId === v.__vehiculoId,
      );
      if (!ov) {
        const res = await vehiculosService.crear(cid, {
          patente: (v.patente || "").trim(),
          tipo: (v.tipo || "").trim() || "AUTO",
          unidadId: f.__unidadId,
          marca: (v.marca || "").trim(),
          modelo: (v.modelo || "").trim(),
          color: (v.color || "").trim(),
        });
        v.__vehiculoId = res.data?.id;
        await aplicarEstacionamiento(v, null, f);
      } else {
        const patenteCambio =
          String(v.patente || "").trim().toUpperCase() !==
          String(ov.patente || "").trim().toUpperCase();
        if (patenteCambio) {
          await vehiculosService.desactivar(cid, v.__vehiculoId);
          const res = await vehiculosService.crear(cid, {
            patente: (v.patente || "").trim(),
            tipo: (v.tipo || "").trim() || "AUTO",
            unidadId: f.__unidadId,
            marca: (v.marca || "").trim(),
            modelo: (v.modelo || "").trim(),
            color: (v.color || "").trim(),
          });
          v.__vehiculoId = res.data?.id;
          await aplicarEstacionamiento(v, null, f);
        } else {
          const cambia = ["tipo", "marca", "modelo", "color"].some(
            (k) => String(v[k] || "") !== String(ov[k] || ""),
          );
          if (cambia) {
            await vehiculosService.actualizar(cid, v.__vehiculoId, {
              tipo: (v.tipo || "").trim() || "AUTO",
              unidadId: f.__unidadId,
              marca: (v.marca || "").trim(),
              modelo: (v.modelo || "").trim(),
              color: (v.color || "").trim(),
            });
          }
          await aplicarEstacionamiento(v, ov, f);
        }
      }
    }

    // Bodegas: quitar / vincular.
    const origBodegas = o.bodegas || [];
    const curBodegas = f.bodegas || [];
    for (const ob of origBodegas) {
      if (ob.__bodegaId && !curBodegas.some((b) => b.__bodegaId === ob.__bodegaId)) {
        await desvincularBodega(ob.__bodegaId, f.__unidadId, ob.__vinculoBodegaId);
      }
    }
    for (const b of curBodegas) {
      const ob = origBodegas.find(
        (x) => x.__bodegaId && x.__bodegaId === b.__bodegaId,
      );
      if (!ob) {
        const id = resolverBodegaId(b.nombre);
        if (id) {
          await bodegasService.vincular(cid, id, {
            tipo: (f.tipo_vinculo || "").trim(),
            unidadId: f.__unidadId,
            fechaInicio: hoy(),
          });
        }
      }
    }

    // Estacionamientos standalone (unidad ↔ est, sin vehículo): quitar / vincular.
    const origEst = o.estacionamientos || [];
    const curEst = f.estacionamientos || [];
    for (const oe of origEst) {
      if (
        oe.__estacionamientoId &&
        !curEst.some((e) => e.__estacionamientoId === oe.__estacionamientoId)
      ) {
        await desvincularEstacionamientoPorId(
          oe.__estacionamientoId,
          f.__unidadId,
          oe.__vinculoEstacionamientoId,
        );
      }
    }
    for (const e of curEst) {
      const oe = origEst.find(
        (x) => x.__estacionamientoId && x.__estacionamientoId === e.__estacionamientoId,
      );
      if (!oe && !esEstacionamientoVisita(e.nombre)) {
        const id = e.__estacionamientoId || resolverEstacionamientoId(e.nombre);
        if (id) {
          e.__estacionamientoId = id;
          await estacionamientosService.vincular(cid, id, {
            tipo: (f.tipo_vinculo || "").trim(),
            unidadId: f.__unidadId,
            fechaInicio: hoy(),
          });
        }
      }
    }
  }

  // Fase 1: POST /importaciones/preview — valida fila a fila sin persistir.
  // Devuelve el borrador (importacionId) + estados por fila (OK/ERROR/OMITIDA).
  async function preview() {
    const payload = buildPayload();
    if (!payload.length) return;
    enviando.value = true;
    operacion.value = "validar";
    error.value = null;
    try {
      const res = await importacionService.previewJson(cid, payload);
      previewData.value = res.data;
      resultado.value = null;
      guardarStagingSesion();
    } catch (e) {
      console.error("Error al previsualizar planilla", e);
      error.value = e?.response?.data?.message || "No se pudo previsualizar la planilla";
    } finally {
      enviando.value = false;
      operacion.value = null;
    }
  }

  // F1 — Staging (Meta): al seleccionar archivo NO se hace ningún POST.
  // csv → parse local a staging editable; xlsx → se guarda el File pendiente.
  // Solo [Validar] envía al backend (validarStaging).
  async function cargarStaging(archivo) {
    if (!archivo) return;
    const nombre = archivo.name || "";
    const ext = nombre.toLowerCase().split(".").pop();
    if (!["csv", "xlsx"].includes(ext)) {
      error.value = "Formato no soportado. Usa .csv o .xlsx";
      descartarStagingSesion();
      return;
    }
    error.value = null;
    resultado.value = null;
    previewData.value = null;
    archivoNombre.value = nombre;
    if (ext === "xlsx") {
      archivoPendiente.value = archivo;
      previewFilasRaw.value = null;
      guardarStagingSesion();
      return;
    }
    archivoPendiente.value = null;
    sinEstStandalone.value = false;
    try {
      const texto = await archivo.text();
      const { encabezados, filas: filasCrudas } = parsearCsv(texto);
      if (!encabezados.length) {
        error.value = "El archivo no tiene encabezado legible";
        previewFilasRaw.value = null;
        descartarStagingSesion();
        return;
      }
      sinEstStandalone.value = !encabezados.includes("estacionamiento1");
      const filasNorm = normalizarFilas(encabezados, filasCrudas, COLUMNAS_DEFAULT);
      // Mismo orden que el backend (sin filtrar vacías) + ids para edición.
      // Compat: header viejo es_ocupante → es_residente.
      previewFilasRaw.value = filasCrudasADinamicas(filasNorm).map((f) => ({
        id: nuevoId(),
        ...migrarClavesCompatibles(f),
        esNuevo: true,
        marcadoEliminar: false,
        original: null,
      }));
    } catch (pe) {
      console.error("Error parseando csv local para staging", pe);
      error.value = "No se pudo leer el archivo csv";
      previewFilasRaw.value = null;
      descartarStagingSesion();
    }
    guardarStagingSesion();
  }

  // F1 — [Validar]: valida el staging editado contra el backend.
  // csv → previewJson con el payload de lo editado (lo que ves es lo que se valida).
  // xlsx → previewArchivo multipart (sin edición local posible).
  async function validarStaging() {
    if (!cid) {
      error.value = "No se pudo determinar el condominio";
      return;
    }
    if ((previewFilasRaw.value?.length || 0) > 0) {
      const payload = previewFilasRaw.value
        .filter((f) => !f.marcadoEliminar)
        .map((f) => filaAPayload(f));
      if (!payload.length) {
        error.value = "No hay filas para validar";
        return;
      }
      enviando.value = true;
      operacion.value = "validar";
      error.value = null;
      try {
        const res = await importacionService.previewJson(cid, payload);
        previewData.value = res.data;
        resultado.value = null;
        guardarStagingSesion();
      } catch (e) {
        console.error("Error al validar staging", e);
        if (e?.response?.status === 403) {
          error.value =
            "No tienes permiso para importar (IMPORTACION_DATOS). Contacta al SUPER_ADMIN para que te asigne el permiso en tu rol/cargo.";
        } else {
          error.value = e?.response?.data?.message || "No se pudo validar el archivo";
        }
        previewData.value = null;
      } finally {
        enviando.value = false;
        operacion.value = null;
      }
      return;
    }
    if (archivoPendiente.value) {
      await previewArchivo(archivoPendiente.value);
    }
  }

  // Fase 1b: POST /importaciones/preview multipart — solo xlsx (vía validarStaging).
  // 403 estricto: no bypass — informa falta de permiso.
  async function previewArchivo(archivo) {
    if (!cid) {
      error.value = "No se pudo determinar el condominio";
      return;
    }
    if (!archivo) return;
    enviando.value = true;
    operacion.value = "validar";
    error.value = null;
    archivoNombre.value = archivo.name || archivoNombre.value;
    try {
      const res = await importacionService.previewArchivo(cid, archivo);
      previewData.value = res.data;
      resultado.value = null;
      guardarStagingSesion();
    } catch (e) {
      console.error("Error al previsualizar archivo", e);
      const status = e?.response?.status;
      if (status === 403) {
        error.value =
          "No tienes permiso para importar (IMPORTACION_DATOS). Contacta al SUPER_ADMIN para que te asigne el permiso en tu rol/cargo. Si eres SUPER_ADMIN, falta la migración del backend que asigna el permiso a SUPER_ADMIN/SOPORTE (V67 la omitió).";
        previewData.value = null;
        return;
      }
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "No se pudo previsualizar el archivo";
      if (status === 413) {
        error.value = "El archivo es demasiado grande";
      } else {
        error.value = msg;
      }
      previewData.value = null;
    } finally {
      enviando.value = false;
      operacion.value = null;
    }
  }

  function descartarPreviewArchivo() {
    previewData.value = null;
    error.value = null;
    guardarStagingSesion();
  }

  // ─── Staging editable (F1): edita el borrador antes de validar ──────────
  function quitarStagingFila(id) {
    previewFilasRaw.value = (previewFilasRaw.value || []).filter((f) => f.id !== id);
  }

  function stagingPorId(id) {
    return (previewFilasRaw.value || []).find((f) => f.id === id) || null;
  }

  function agregarStagingVehiculo(id) {
    const f = stagingPorId(id);
    if (f) (f.vehiculos || (f.vehiculos = [])).push(vehiculoVacio());
  }

  function quitarStagingVehiculo(id, uid) {
    const f = stagingPorId(id);
    if (f) f.vehiculos = (f.vehiculos || []).filter((v) => v.uid !== uid);
  }

  function agregarStagingBodega(id) {
    const f = stagingPorId(id);
    if (f) (f.bodegas || (f.bodegas = [])).push(bodegaVacia());
  }

  function quitarStagingBodega(id, uid) {
    const f = stagingPorId(id);
    if (f) f.bodegas = (f.bodegas || []).filter((b) => b.uid !== uid);
  }

  function agregarStagingEstacionamiento(id) {
    const f = stagingPorId(id);
    if (f) (f.estacionamientos || (f.estacionamientos = [])).push(estacionamientoVacio());
  }

  function quitarStagingEstacionamiento(id, uid) {
    const f = stagingPorId(id);
    if (f) f.estacionamientos = (f.estacionamientos || []).filter((e) => e.uid !== uid);
  }

  // Limpieza total (Meta: "Descartar todo" — evita errores fantasma del archivo anterior en etapa editable)
  function limpiarTodo() {
    filas.value = [];
    previewData.value = null;
    resultadoFilas.value = null;
    errorDescarga.value = null;
    descartarResultadoSesion();
    archivoNombre.value = null;
    previewFilasRaw.value = null;
    archivoPendiente.value = null;
    sinEstStandalone.value = false;
    error.value = null;
    resultado.value = null;
    resultadoFresco.value = false;
    operacion.value = null;
    descartarBorrador();
    descartarStagingSesion();
  }

  // ─── Asentar importadas (post-ejecutar eficiente) ─────────────────────────
  // Convierte las filas OK importadas en existentes en vez de reconstruir
  // todo (2 GET × todas las unidades). Solo refresca los 5 listados base y
  // completa los IDs que ya vienen gratis (__unidadId por número, __personaId
  // por email, __vehiculoId por patente+unidad, __estacionamientoId/__bodegaId
  // por nombre). __vinculoId queda para resolución perezosa al editar
  // (1 GET solo esa fila). Sin fuente local (xlsx sin staging): fallback a
  // reconstruirFilas(). Las no-OK se descartan (como antes).
  async function asentarImportadas() {
    const prev = previewData.value;
    const okNums = new Set(
      (prev?.filas || []).filter((f) => f.estado === "OK").map((f) => f.numeroFila),
    );
    // Mismo orden del payload enviado (índice ↔ numeroFila). En staging se
    // excluyen las marcadas para eliminar, igual que al validar.
    const base = previewFilasRaw.value?.length
      ? previewFilasRaw.value.filter((f) => !f.marcadoEliminar)
      : filasNuevasValidas.value;
    const fuente = base.filter((_, i) => okNums.has(i + 1));
    await cargarExistentes();
    if (!fuente.length) {
      filas.value = [];
      await reconstruirFilas();
      return;
    }
    const unidadPorNum = new Map(
      (unidades.value || []).map((u) => [String(u.numero), u]),
    );
    const personaPorEmail = new Map(
      (personas.value || []).map((p) => [(p.email || "").toLowerCase(), p]),
    );
    const vehiculoPorClave = new Map(
      (vehiculos.value || []).map((v) => [
        `${v.unidadId}|${(v.patente || "").toUpperCase()}`,
        v,
      ]),
    );
    const estPorNombre = new Map(
      (estacionamientos.value || []).map((e) => [String(e.nombre).trim(), e]),
    );
    const bodPorNombre = new Map(
      (bodegas.value || []).map((b) => [String(b.nombre).trim(), b]),
    );
    filas.value = fuente.map((f) => {
      const u = unidadPorNum.get(String(f.unidad || "").trim()) || null;
      const p = personaPorEmail.get((f.email || "").toLowerCase().trim()) || null;
      (f.vehiculos || []).forEach((v) => {
        if (!v.__vehiculoId && u) {
          const m = vehiculoPorClave.get(
            `${u.id}|${(v.patente || "").trim().toUpperCase()}`,
          );
          if (m) v.__vehiculoId = m.id;
        }
      });
      (f.bodegas || []).forEach((b) => {
        if (b && typeof b !== "string" && !b.__bodegaId) {
          const m = bodPorNombre.get(String(b.nombre || "").trim());
          if (m) b.__bodegaId = m.id;
        }
      });
      (f.estacionamientos || []).forEach((e) => {
        if (e && typeof e !== "string" && !e.__estacionamientoId) {
          const m = estPorNombre.get(String(e.nombre || "").trim());
          if (m) e.__estacionamientoId = m.id;
        }
      });
      f.esNuevo = false;
      f.__unidadId = u ? u.id : f.__unidadId || null;
      f.__personaId = p ? p.id : f.__personaId || null;
      f.__vinculoId = f.__vinculoId || null;
      f.marcadoEliminar = false;
      delete f.error;
      f.original = snapshotFila(f);
      return f;
    });
    modoReedicion.value = true;
  }

  // Fase 2: POST /importaciones/{importacionId}/ejecutar — aplica las filas OK.
  async function ejecutar() {
    if (!previewData.value?.importacionId) return;
    enviando.value = true;
    operacion.value = "ejecutar";
    error.value = null;
    try {
      const res = await importacionService.ejecutar(cid, previewData.value.importacionId);
      resultado.value = res.data;
      resultadoFresco.value = true;
      // FE-3/FE-5: conservar las filas del preview para filtrar el resultado
      // y marcar advertencias (el ejecutar no devuelve detalle por fila).
      resultadoFilas.value = previewData.value?.filas
        ? [...previewData.value.filas]
        : null;
      guardarResultadoSesion();
      // Tras importar: asienta las filas OK como existentes (sin
      // reconstrucción masiva). Va ANTES de limpiar preview/staging porque
      // los usa como fuente.
      try {
        await asentarImportadas();
      } catch (e) {
        console.error("Error al asentar filas importadas", e);
      }
      descartarStagingSesion();
      previewData.value = null;
      archivoNombre.value = null;
      previewFilasRaw.value = null;
      archivoPendiente.value = null;
      descartarBorrador();
    } catch (e) {
      console.error("Error al ejecutar importación", e);
      error.value = e?.response?.data?.message || "No se pudo ejecutar la importación";
    } finally {
      enviando.value = false;
      operacion.value = null;
    }
  }

  // Flujo completo (preview → ejecutar) para el wizard de una sola acción.
  // En reedición: importa solo las filas nuevas y aplica ediciones/eliminaciones.
  async function enviar() {
    if (!modoReedicion.value) {
      await preview();
      if (previewData.value?.filasOk > 0) {
        await ejecutar();
      }
      return;
    }

    enviando.value = true;
    error.value = null;
    const resumen = { creadas: 0, actualizadas: 0, eliminadas: 0 };
    try {
      // 1) Filas nuevas → import (preview + ejecutar).
      const nuevas = filasNuevasValidas.value;
      if (nuevas.length) {
        const payload = nuevas.map((f) => filaAPayload(f));
        const prev = await importacionService.previewJson(cid, payload);
        previewData.value = prev.data;
        resultadoFilas.value = prev.data?.filas ? [...prev.data.filas] : null;
        if (prev.data?.filasOk > 0) {
          const res = await importacionService.ejecutar(cid, prev.data.importacionId);
          resumen.creadas = res.data?.filasOk || 0;
        }
      }
      resultado.value = resumen;

      // 2) Filas existentes editadas.
      const editadas = filas.value.filter(
        (f) => f.esNuevo === false && !f.marcadoEliminar && cambiado(f),
      );
      for (const f of editadas) {
        try {
          await aplicarEdicion(f);
          resumen.actualizadas++;
          f.original = snapshotFila(f);
        } catch (e) {
          console.error("Error al actualizar fila", e);
          f.error = e?.response?.data?.message || "No se pudo actualizar la fila";
        }
      }

      // 3) Filas existentes marcadas para eliminar → desactivar vínculo.
      const eliminadas = filas.value.filter(
        (f) => f.esNuevo === false && f.marcadoEliminar,
      );
      for (const f of eliminadas) {
        try {
          await personasService.desactivarVinculo(cid, f.__vinculoId);
          resumen.eliminadas++;
          filas.value = filas.value.filter((x) => x.id !== f.id);
        } catch (e) {
          console.error("Error al eliminar fila", e);
          f.error = e?.response?.data?.message || "No se pudo eliminar la fila";
          f.marcadoEliminar = false;
        }
      }

      // 4) Las filas nuevas importadas pasan a existentes (snapshot para
      //    detectar cambios futuros; los IDs se resuelven de forma perezosa).
      filas.value.forEach((f) => {
        if (f.esNuevo !== false && !f.marcadoEliminar) {
          f.esNuevo = false;
          f.original = snapshotFila(f);
        }
      });

      resultado.value = resumen;
      resultadoFresco.value = true;
      guardarResultadoSesion();
      descartarBorrador();
      if (!filas.value.length) modoReedicion.value = false;
    } catch (e) {
      console.error("Error al guardar planilla", e);
      error.value = e?.response?.data?.message || "No se pudo guardar la planilla";
    } finally {
      enviando.value = false;
    }
  }

  // FE-4: GET /importaciones/{id}/resultado?formato=csv (BE-3) — descarga con
  // auth header vía el cliente axios (no window.open directo). Requiere
  // importacionId del resultado; el flujo manual (reedición) no lo tiene.
  async function descargarResultado() {
    const importacionId = resultado.value?.importacionId;
    if (!cid || !importacionId) return;
    descargandoResultado.value = true;
    errorDescarga.value = null;
    try {
      const blob = await importacionService.resultadoCsv(cid, importacionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resultado_import_${importacionId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error al descargar resultado", e);
      if (e?.response?.status === 404) {
        errorDescarga.value =
          "El resultado ya no está disponible (expiró después de 7 días)";
      } else {
        errorDescarga.value =
          e?.response?.data?.message || "No se pudo descargar el resultado";
      }
    } finally {
      descargandoResultado.value = false;
    }
  }

  // BE-5 (briku#80): hidrata resultado + filas desde el backend (auditoría
  // 7 días). La sesión es respaldo: si el backend no trae filas (historial
  // viejo o BE previo a BE-5) o falla, se conserva la copia de sesión.
  // Nota: filas = revalidadas al ejecutar (sin las ERROR del preview, que
  // solo están en el CSV) — suficiente para badges/filtros/detalle.
  async function hidratarResultado() {
    const importacionId = resultado.value?.importacionId;
    if (!cid || !importacionId) return false;
    try {
      const res = await importacionService.resultado(cid, importacionId);
      if (!res.data) return false;
      resultado.value = res.data;
      resultadoFresco.value = false;
      if (Array.isArray(res.data.filas) && res.data.filas.length) {
        resultadoFilas.value = [...res.data.filas];
      }
      guardarResultadoSesion();
      return true;
    } catch (e) {
      console.error("Error al hidratar resultado", e);
      return false;
    }
  }

  // GET /importaciones/plantilla — descarga la plantilla CSV del backend.
  // 403 estricto: no bypass — avisa que falta permiso y que contacte al SUPER_ADMIN.
  async function descargarPlantilla() {
    try {
      const blob = await importacionService.plantilla(cid);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_integrantes.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error al descargar plantilla", e);
      const status = e?.response?.status;
      if (status === 403) {
        error.value =
          "No tienes permiso para descargar la plantilla (IMPORTACION_DATOS). Contacta al SUPER_ADMIN para que te asigne el permiso. Si eres SUPER_ADMIN, falta la migración del backend (ver SOLICITUD_FIX_PERMISO_IMPORTACION).";
      } else {
        error.value = e?.response?.data?.message || "No se pudo descargar la plantilla";
      }
    }
  }

  async function cargar() {
    cargando.value = true;
    error.value = null;
    try {
      await cargarExistentes();
      const restaurado = cargarBorrador();
      if (!restaurado) await reconstruirFilas();
      // FE-A: último resultado (badges/filtros/detalle sobreviven recargas).
      // BE-5: si hay importacionId se refresca desde el backend (7 días).
      if (cargarResultadoSesion() && resultado.value?.importacionId) {
        await hidratarResultado();
      }
      // Staging/review: volver tras navegar restaura borrador y validación.
      cargarStagingSesion();
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
    operacion,
    fase,
    resultado,
    previewData,
    resultadoFilas,
    resultadoFresco,
    descargandoResultado,
    errorDescarga,
    advertenciasPostImport,
    advertenciasDeFila,
    descargarResultado,
    archivoNombre,
    previewFilasRaw,
    archivoPendiente,
    sinEstStandalone,
    borradorRestaurado,
    modoReedicion,
    capacidad,
    unidadesExistentes,
    unidades,
    personas,
    vehiculos,
    emailsExistentes,
    patentesExistentes,
    estacionamientos,
    bodegas,
    filasConErrores,
    filasValidas,
    filasNuevasValidas,
    filasError,
    hayCambios,
    agregarFila,
    eliminarFila,
    marcarEliminar,
    actualizarFila,
    agregarVehiculo,
    quitarVehiculo,
    agregarBodega,
    quitarBodega,
    agregarEstacionamiento,
    quitarEstacionamiento,
    asignarUnidad,
    unidadPorNumero,
    marcarResponsable,
    cambiado,
    guardarBorrador,
    cargarBorrador,
    descartarBorrador,
    guardarResultadoSesion,
    cargarResultadoSesion,
    descartarResultadoSesion,
    guardarStagingSesion,
    cargarStagingSesion,
    descartarStagingSesion,
    buildPayload,
    preview,
    previewArchivo,
    cargarStaging,
    validarStaging,
    quitarStagingFila,
    agregarStagingVehiculo,
    quitarStagingVehiculo,
    agregarStagingBodega,
    quitarStagingBodega,
    agregarStagingEstacionamiento,
    quitarStagingEstacionamiento,
    descartarPreviewArchivo,
    limpiarTodo,
    ejecutar,
    enviar,
    hidratarResultado,
    descargarPlantilla,
    cargar,
  });
}

export { esSi };