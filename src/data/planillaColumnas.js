// Esquema de columnas de la planilla de datos del condominio.
// Fuente única de verdad para: entrada manual, wizard, importación CSV y
// futura vista de gestión (CRM). Una fila = una persona vinculada a una
// unidad, con 0..N vehículos/estacionamientos/bodegas en columnas fijas.

import { normalizarRut, normalizarTelefono } from "@/utils/validadoresChile";

export const TIPOS_UNIDAD = ["CASA", "DEPARTAMENTO", "ESTACIONAMIENTO", "BODEGA", "OTRO"];
export const TIPOS_VINCULO = ["PROPIETARIO", "ARRENDATARIO", "RESIDENTE_ADICIONAL"];
export const TIPOS_VEHICULO = ["AUTO", "CAMIONETA", "MOTO", "FURGON", "CAMION", "OTRO"];

export const MAX_VEHICULOS = 3;
export const MAX_ESTACIONAMIENTOS_STANDALONE = 3;
export const MAX_BODEGAS = 3;

// Columnas base (por persona).
export const COLUMNAS_BASE = [
  { key: "unidad", label: "Casa", tipo: "text", requerida: true },
  { key: "tipo_unidad", label: "Tipo", tipo: "select", opciones: TIPOS_UNIDAD },
  { key: "sector", label: "Sector", tipo: "text" },
  { key: "nombre", label: "Nombre", tipo: "text", requerida: true },
  { key: "email", label: "Email", tipo: "text", requerida: true },
  { key: "rut", label: "RUT", tipo: "text" },
  { key: "telefono", label: "Teléfono", tipo: "text" },
  { key: "tipo_vinculo", label: "Vínculo", tipo: "select", opciones: TIPOS_VINCULO, requerida: true },
  { key: "es_residente", label: "Residente", tipo: "si_no" },
  { key: "recibe_notificaciones", label: "Recibe notif.", tipo: "si_no" },
  { key: "es_responsable", label: "Responsable", tipo: "check" },
];

// Columnas de vehículos: patente{i}, tipo_vehiculo{i}, marca{i}, modelo{i},
// color{i}, est{i} (estacionamiento asociado al vehículo).
export function columnasVehiculos(n = MAX_VEHICULOS) {
  const cols = [];
  for (let i = 1; i <= n; i++) {
    cols.push(
      { key: `patente${i}`, label: `Patente ${i}`, tipo: "text", grupo: "vehiculo", indice: i },
      { key: `tipo_vehiculo${i}`, label: `Tipo ${i}`, tipo: "select", opciones: TIPOS_VEHICULO, grupo: "vehiculo", indice: i },
      { key: `marca${i}`, label: `Marca ${i}`, tipo: "text", grupo: "vehiculo", indice: i },
      { key: `modelo${i}`, label: `Modelo ${i}`, tipo: "text", grupo: "vehiculo", indice: i },
      { key: `color${i}`, label: `Color ${i}`, tipo: "text", grupo: "vehiculo", indice: i },
      { key: `est${i}`, label: `Est. ${i}`, tipo: "text", grupo: "vehiculo", indice: i },
    );
  }
  return cols;
}

// Columnas de bodegas (solo si el condominio tiene capacidad de bodegas).
export function columnasBodegas(n = MAX_BODEGAS) {
  const cols = [];
  for (let i = 1; i <= n; i++) {
    cols.push({ key: `bodega${i}`, label: `Bodega ${i}`, tipo: "text", grupo: "bodega", indice: i });
  }
  return cols;
}

// Columnas de estacionamientos standalone (vínculo estacionamiento ↔ unidad,
// sin vehículo — la unidad es el core, igual que las bodegas). Van al final
// del CSV (tras bodega3), mismo orden que el backend (BE-74).
export function columnasEstacionamientos(n = MAX_ESTACIONAMIENTOS_STANDALONE) {
  const cols = [];
  for (let i = 1; i <= n; i++) {
    cols.push({ key: `estacionamiento${i}`, label: `Estac. ${i}`, tipo: "text", grupo: "estacionamiento", indice: i });
  }
  return cols;
}

// Genera las columnas completas según la capacidad del condominio.
// `capacidad` usa los campos del backend: capacidadCasas/Departamentos/
// Estacionamientos/Bodegas/Otro (null = sin tope).
export function generarColumnas(capacidad = {}) {
  // Orden canónico = patrón del archivo del usuario: base, estacionamientos
  // standalone, vehículos, bodegas. (Los est1..3 anidados se conservan en el
  // esquema solo por compatibilidad con archivos viejos.)
  const cols = [...COLUMNAS_BASE];
  cols.push(...columnasEstacionamientos(MAX_ESTACIONAMIENTOS_STANDALONE));
  cols.push(...columnasVehiculos(MAX_VEHICULOS));
  if (capacidad.capacidadBodegas > 0) cols.push(...columnasBodegas(MAX_BODEGAS));
  return cols;
}

// Columnas por defecto (sin bodegas) — usadas por el parser CSV y plantillas.
export const COLUMNAS_DEFAULT = generarColumnas({});

// Devuelve las claves planas de las columnas (para CSV / payload).
export function clavesColumnas(columnas) {
  return columnas.map((c) => c.key);
}

// True si el nombre corresponde a un estacionamiento de visitas (convención
// de prefijo EV- del backend). Los EV-* no se asignan a casas.
export function esEstacionamientoVisita(nombre) {
  return /^ev-/i.test(String(nombre || "").trim());
}

// Convierte una fila plana (formato CSV: patente1..3 / est1..3 / bodega1..3)
// al shape dinámico de la planilla: { vehiculos[], bodegas[] }.
export function filaCrudaADinamica(fila) {
  const vehiculos = [];
  for (let i = 1; i <= MAX_VEHICULOS; i++) {
    const patente = (fila[`patente${i}`] || "").trim();
    if (!patente) continue;
    vehiculos.push({
      uid: `veh-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
      patente,
      tipo: (fila[`tipo_vehiculo${i}`] || "").trim() || "AUTO",
      marca: (fila[`marca${i}`] || "").trim(),
      modelo: (fila[`modelo${i}`] || "").trim(),
      color: (fila[`color${i}`] || "").trim(),
      estacionamiento: (fila[`est${i}`] || "").trim(),
    });
  }
  const bodegas = [];
  for (let i = 1; i <= MAX_BODEGAS; i++) {
    const b = (fila[`bodega${i}`] || "").trim();
    if (b) bodegas.push({ uid: `bod-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`, nombre: b });
  }
  // Estacionamientos standalone (unidad ↔ est, sin vehículo).
  const estacionamientos = [];
  for (let i = 1; i <= MAX_ESTACIONAMIENTOS_STANDALONE; i++) {
    const e = (fila[`estacionamiento${i}`] || "").trim();
    if (e) estacionamientos.push({ uid: `est-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`, nombre: e });
  }
  return normalizarEstAnidados({ ...fila, vehiculos, bodegas, estacionamientos });
}

// Convierte una lista de filas planas (CSV) al shape dinámico.
export function filasCrudasADinamicas(filas) {
  return (filas || []).map(filaCrudaADinamica);
}

// Fuente única VISUAL de est: el standalone (unidad ↔ est). Si un vehículo
// trae `est` anidado (archivos viejos), se COPIA a la lista standalone con
// dedupe pero se conserva en el vehículo: el backend desplegado (pre-BE-74)
// solo vincula por el anidado, y el nuevo hace unión con dedupe. Así el
// payload funciona contra ambas versiones.
export function normalizarEstAnidados(fila) {
  if (!fila || !Array.isArray(fila.vehiculos)) return fila;
  if (!Array.isArray(fila.estacionamientos)) fila.estacionamientos = [];
  const vistos = new Set(
    fila.estacionamientos.map((e) =>
      (typeof e === "string" ? e : e.nombre || "").trim().toUpperCase(),
    ),
  );
  for (const v of fila.vehiculos) {
    const est = (v.estacionamiento || "").trim();
    const pat = (v.patente || "").trim();
    if (pat && est && !vistos.has(est.toUpperCase())) {
      vistos.add(est.toUpperCase());
      fila.estacionamientos.push({
        uid: `est-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        nombre: est,
      });
    }
  }
  return fila;
}

// Compatibilidad con archivos viejos (header es_ocupante): si la fila trae
// la clave vieja y no la nueva, se migra. El canónico es es_residente.
export function migrarClavesCompatibles(fila) {
  if (fila && (fila.es_residente || "") === "" && (fila.es_ocupante || "") !== "") {
    fila.es_residente = fila.es_ocupante;
  }
  return fila;
}

// True si la fila usa el shape dinámico (vehiculos[]/bodegas[]/estacionamientos[]).
export function esFilaDinamica(fila) {
  return (
    Array.isArray(fila?.vehiculos) ||
    Array.isArray(fila?.bodegas) ||
    Array.isArray(fila?.estacionamientos)
  );
}

// Convierte una fila (dinámica o legacy plana) al payload anidado que espera
// el backend: { persona, vinculo, vehiculos[], bodegas[] }.
export function filaAPayload(fila) {
  const f = esFilaDinamica(fila) ? fila : filaCrudaADinamica(fila);
  const vehiculos = (f.vehiculos || [])
    .map((v) => ({
      patente: (v.patente || "").trim(),
      tipo: (v.tipo || "").trim() || "AUTO",
      marca: (v.marca || "").trim(),
      modelo: (v.modelo || "").trim(),
      color: (v.color || "").trim(),
      estacionamiento: (v.estacionamiento || "").trim(),
    }))
    .filter((v) => v.patente);
  const bodegas = (f.bodegas || [])
    .map((b) => (typeof b === "string" ? b : b.nombre || "").trim())
    .filter(Boolean);
  const estacionamientos = (f.estacionamientos || [])
    .map((e) => (typeof e === "string" ? e : e.nombre || "").trim())
    .filter(Boolean);
  return {
    unidad: (f.unidad || "").trim(),
    tipoUnidad: (f.tipo_unidad || "").trim(),
    sector: (f.sector || "").trim(),
    persona: {
      nombre: (f.nombre || "").trim(),
      email: (f.email || "").trim(),
      rut: normalizarRut(f.rut),
      telefono: normalizarTelefono(f.telefono),
    },
    vinculo: {
      tipo: (f.tipo_vinculo || "").trim(),
      esOcupante: esSi(f.es_residente),
      recibeNotificaciones: esSi(f.recibe_notificaciones),
      esResponsable: esSi(f.es_responsable),
    },
    vehiculos,
    bodegas,
    estacionamientos,
  };
}

export function esSi(valor, def = false) {
  const v = (valor || "").toString().trim().toUpperCase();
  if (v === "SI" || v === "S" || v === "TRUE" || v === "1") return true;
  if (v === "NO" || v === "N" || v === "FALSE" || v === "0") return false;
  return def;
}