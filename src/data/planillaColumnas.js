// Esquema de columnas de la planilla de datos del condominio.
// Fuente única de verdad para: entrada manual, wizard, importación CSV y
// futura vista de gestión (CRM). Una fila = una persona vinculada a una
// unidad, con 0..N vehículos/estacionamientos/bodegas en columnas fijas.

export const TIPOS_UNIDAD = ["CASA", "DEPARTAMENTO", "ESTACIONAMIENTO", "BODEGA", "OTRO"];
export const TIPOS_VINCULO = ["PROPIETARIO", "ARRENDATARIO", "RESIDENTE_ADICIONAL"];
export const TIPOS_VEHICULO = ["AUTO", "CAMIONETA", "MOTO", "FURGON", "CAMION", "OTRO"];

export const MAX_VEHICULOS = 3;
export const MAX_ESTACIONAMIENTOS = 3;
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
  { key: "es_ocupante", label: "Ocupante", tipo: "si_no" },
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

// Genera las columnas completas según la capacidad del condominio.
// `capacidad` usa los campos del backend: capacidadCasas/Departamentos/
// Estacionamientos/Bodegas/Otro (null = sin tope).
export function generarColumnas(capacidad = {}) {
  const cols = [...COLUMNAS_BASE];
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

// Convierte una fila plana (objeto con claves de columna) en el payload
// anidado que espera el backend: { persona, vinculo, vehiculos[], bodegas[] }.
export function filaAPayload(fila) {
  const vehiculos = [];
  for (let i = 1; i <= MAX_VEHICULOS; i++) {
    const patente = (fila[`patente${i}`] || "").trim();
    if (!patente) continue;
    vehiculos.push({
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
    if (b) bodegas.push(b);
  }
  return {
    unidad: (fila.unidad || "").trim(),
    tipoUnidad: (fila.tipo_unidad || "").trim(),
    sector: (fila.sector || "").trim(),
    persona: {
      nombre: (fila.nombre || "").trim(),
      email: (fila.email || "").trim(),
      rut: (fila.rut || "").trim(),
      telefono: (fila.telefono || "").trim(),
    },
    vinculo: {
      tipo: (fila.tipo_vinculo || "").trim(),
      esOcupante: esSi(fila.es_ocupante),
      recibeNotificaciones: esSi(fila.recibe_notificaciones),
      esResponsable: esSi(fila.es_responsable),
    },
    vehiculos,
    bodegas,
  };
}

export function esSi(valor, def = false) {
  const v = (valor || "").toString().trim().toUpperCase();
  if (v === "SI" || v === "S" || v === "TRUE" || v === "1") return true;
  if (v === "NO" || v === "N" || v === "FALSE" || v === "0") return false;
  return def;
}