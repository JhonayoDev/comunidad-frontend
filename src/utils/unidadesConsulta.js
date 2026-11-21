// Utilidades puras de la vista "Unidades" (consulta operativa).
//
// La vista NO crea ni edita unidades: eso vive en el wizard (setup/unidades).
// Aquí solo se indexan los recursos del condominio para responder, sin N+1,
// qué tiene cada casa: personas (se piden al expandir), vehículos,
// estacionamientos, bodegas y áreas comunes.

import { esEstacionamientoVisita } from "@/data/planillaColumnas";
import { normalizarTexto, tokensDeBusqueda } from "@/utils/busqueda";
import { compararUnidades } from "@/utils/ordenamientoNatural";

export const TIPO_UNIDAD_LABELS = {
  CASA: "Casa",
  DEPARTAMENTO: "Departamento",
  ESTACIONAMIENTO: "Estacionamiento",
  BODEGA: "Bodega",
  OTRO: "Otro",
  CONDOMINIO: "Condominio",
};

export const TIPO_VINCULO_LABELS = {
  PROPIETARIO: "Propietario",
  ARRENDATARIO: "Arrendatario",
  RESIDENTE_ADICIONAL: "Residente adicional",
};

export const TIPO_VINCULO_SEVERITY = {
  PROPIETARIO: "info",
  ARRENDATARIO: "warn",
  RESIDENTE_ADICIONAL: "secondary",
};

export const ROL_RECURSO_LABELS = {
  PROPIETARIO: "Propietario",
  ARRENDATARIO: "Arrendatario",
  ARRENDATARIO_FUTURO: "Arriendo programado",
};

export const TIPO_VEHICULO_LABELS = {
  AUTO: "Auto",
  CAMIONETA: "Camioneta",
  MOTO: "Moto",
  FURGON: "Furgón",
  CAMION: "Camión",
  OTRO: "Otro",
};

const ORDEN_VINCULO = { PROPIETARIO: 0, ARRENDATARIO: 1, RESIDENTE_ADICIONAL: 2 };

export function labelTipoUnidad(tipo) {
  return TIPO_UNIDAD_LABELS[tipo] || tipo || "—";
}

export function labelTipoVinculo(tipo) {
  return TIPO_VINCULO_LABELS[tipo] || tipo || "—";
}

export function labelRolRecurso(rol) {
  return ROL_RECURSO_LABELS[rol] || rol || "—";
}

export function labelTipoVehiculo(tipo) {
  return TIPO_VEHICULO_LABELS[tipo] || tipo || "—";
}

/** La unidad `CONDOMINIO` agrupa los bienes comunes y no es una vivienda. */
export function esUnidadCondominio(unidad) {
  return unidad?.tipo === "CONDOMINIO";
}

/** ¿Es una vivienda a la que se le pueden vincular vehículos? */
export function admiteVehiculos(unidad) {
  return unidad?.tipo === "CASA" || unidad?.tipo === "DEPARTAMENTO";
}

function activo(recurso) {
  return recurso?.activo !== false;
}

function asegurarUnidad(porUnidad, unidadId) {
  if (!unidadId) return null;
  if (!porUnidad[unidadId]) {
    porUnidad[unidadId] = {
      vehiculos: [],
      estacionamientos: [],
      bodegas: [],
      espacios: [],
    };
  }
  return porUnidad[unidadId];
}

function agregarRecurso(porUnidad, campo, unidadId, recurso) {
  const bucket = asegurarUnidad(porUnidad, unidadId);
  if (!bucket) return;
  // Un mismo bien puede aparecer como propietario y arrendatario de la misma
  // unidad solo por datos inconsistentes: se conserva la primera fila.
  if (bucket[campo].some((x) => x.id === recurso.id)) return;
  bucket[campo].push(recurso);
}

function agregarVinculosDeBien(porUnidad, campo, bien) {
  if (!activo(bien)) return;
  const base = { id: bien.id, nombre: bien.nombre, piso: bien.piso };
  if (bien.propietario) {
    agregarRecurso(porUnidad, campo, bien.propietario.unidadId, {
      ...base,
      rol: "PROPIETARIO",
      vinculoId: bien.propietario.vinculoId,
      fechaInicio: bien.propietario.fechaInicio,
      fechaFin: bien.propietario.fechaFin,
    });
  }
  if (bien.arrendatarioEfectivo) {
    agregarRecurso(porUnidad, campo, bien.arrendatarioEfectivo.unidadId, {
      ...base,
      rol: "ARRENDATARIO",
      vinculoId: bien.arrendatarioEfectivo.vinculoId,
      fechaInicio: bien.arrendatarioEfectivo.fechaInicio,
      fechaFin: bien.arrendatarioEfectivo.fechaFin,
    });
  }
  for (const futuro of bien.arrendatariosFuturos || []) {
    agregarRecurso(porUnidad, campo, futuro.unidadId, {
      ...base,
      rol: "ARRENDATARIO_FUTURO",
      vinculoId: futuro.vinculoId,
      fechaInicio: futuro.fechaInicio,
      fechaFin: futuro.fechaFin,
    });
  }
}

function ordenarRecursos(lista, clave = "nombre") {
  return lista.sort((a, b) => compararUnidades(a[clave], b[clave]));
}

/**
 * Índice unidad → recursos. Una sola pasada sobre los listados globales que
 * ya traen `unidadId`/vínculos, sin peticiones por casa.
 */
export function construirIndice({
  estacionamientos = [],
  bodegas = [],
  espacios = [],
  vehiculos = [],
} = {}) {
  const porUnidad = {};

  for (const e of estacionamientos) agregarVinculosDeBien(porUnidad, "estacionamientos", e);
  for (const b of bodegas) agregarVinculosDeBien(porUnidad, "bodegas", b);
  for (const e of espacios) agregarVinculosDeBien(porUnidad, "espacios", e);

  for (const v of vehiculos) {
    if (!activo(v)) continue;
    agregarRecurso(porUnidad, "vehiculos", v.unidadId, {
      id: v.id,
      patente: v.patente,
      tipo: v.tipo,
      marca: v.marca,
      modelo: v.modelo,
      color: v.color,
    });
  }

  for (const recursos of Object.values(porUnidad)) {
    ordenarRecursos(recursos.estacionamientos);
    ordenarRecursos(recursos.bodegas);
    ordenarRecursos(recursos.espacios);
    recursos.vehiculos.sort((a, b) => String(a.patente || "").localeCompare(String(b.patente || "")));
  }

  return { porUnidad };
}

export function recursosDeUnidad(indice, unidadId) {
  return (
    indice?.porUnidad?.[unidadId] || {
      vehiculos: [],
      estacionamientos: [],
      bodegas: [],
      espacios: [],
    }
  );
}

export function contarRecursos(indice, unidadId) {
  const r = recursosDeUnidad(indice, unidadId);
  return {
    vehiculos: r.vehiculos.length,
    estacionamientos: r.estacionamientos.length,
    bodegas: r.bodegas.length,
    espacios: r.espacios.length,
  };
}

/**
 * Encabezado del condominio con datos reales (no capacidades del plan).
 * Los estacionamientos de visita son los `EV-*` (mismo criterio del wizard).
 */
export function resumenCondominio({
  unidades = [],
  estacionamientos = [],
  bodegas = [],
  espacios = [],
} = {}) {
  const viviendas = unidades.filter((u) => !esUnidadCondominio(u) && activo(u));
  const est = estacionamientos.filter(activo);
  const visitas = est.filter((e) => esEstacionamientoVisita(e.nombre)).length;
  return {
    unidades: viviendas.length,
    estacionamientos: {
      total: est.length,
      residentes: est.length - visitas,
      visitas,
    },
    bodegas: bodegas.filter(activo).length,
    areasComunes: espacios.filter(activo).length,
  };
}

function textoUnidad(unidad) {
  return normalizarTexto(
    [
      unidad.numero,
      labelTipoUnidad(unidad.tipo),
      unidad.sectorNombre,
      unidad.piso == null ? "" : String(unidad.piso),
    ].join(" "),
  );
}

/**
 * Filtro local de viviendas. Ordena el resultado con orden natural y pone
 * primero la coincidencia exacta de número (`100` antes que `1000`).
 */
export function filtrarUnidades(unidades, { q = "", tipo = null, sector = null, piso = null } = {}) {
  const tokens = tokensDeBusqueda(q);
  const consulta = normalizarTexto(q);

  const lista = (unidades || [])
    .filter((u) => !esUnidadCondominio(u) && activo(u))
    .filter((u) => !tipo || u.tipo === tipo)
    .filter((u) => !sector || u.sectorNombre === sector)
    .filter((u) => piso == null || piso === "" || Number(u.piso) === Number(piso))
    .filter((u) => {
      if (!tokens.length) return true;
      const texto = textoUnidad(u);
      return tokens.every((token) => texto.includes(token));
    });

  const exactas = [];
  const resto = [];
  for (const u of lista) {
    if (consulta && normalizarTexto(u.numero) === consulta) exactas.push(u);
    else resto.push(u);
  }

  const ordenar = (a, b) => compararUnidades(a.numero, b.numero);
  return [...exactas.sort(ordenar), ...resto.sort(ordenar)];
}

export function opcionesSector(unidades = []) {
  const nombres = new Set();
  for (const u of unidades || []) {
    if (u.sectorNombre) nombres.add(u.sectorNombre);
  }
  return [...nombres]
    .sort((a, b) => compararUnidades(a, b))
    .map((nombre) => ({ label: nombre, value: nombre }));
}

export function opcionesPiso(unidades = []) {
  const pisos = new Set();
  for (const u of unidades || []) {
    if (u.piso != null && !esUnidadCondominio(u)) pisos.add(Number(u.piso));
  }
  return [...pisos]
    .sort((a, b) => a - b)
    .map((piso) => ({ label: `Piso ${piso}`, value: piso }));
}

export function opcionesTipoUnidad(unidades = []) {
  const tipos = new Set();
  for (const u of unidades || []) {
    if (!esUnidadCondominio(u) && u.tipo) tipos.add(u.tipo);
  }
  return [...tipos]
    .sort((a, b) => labelTipoUnidad(a).localeCompare(labelTipoUnidad(b), "es"))
    .map((tipo) => ({ label: labelTipoUnidad(tipo), value: tipo }));
}

/**
 * Paginación en cliente (la vista ya tiene el índice local). Devuelve la
 * página saneada y el `first` que espera el `Paginator` de PrimeVue.
 */
export function paginarUnidades(lista, page = 1, porPagina = 25) {
  const total = (lista || []).length;
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const actual = Math.min(Math.max(1, Number(page) || 1), paginas);
  const inicio = (actual - 1) * porPagina;
  return {
    items: (lista || []).slice(inicio, inicio + porPagina),
    total,
    paginas,
    page: actual,
    first: inicio,
    porPagina,
  };
}

export function ordenarVinculos(vinculos = []) {
  return [...vinculos].sort((a, b) => {
    const oa = ORDEN_VINCULO[a.tipo] ?? 9;
    const ob = ORDEN_VINCULO[b.tipo] ?? 9;
    if (oa !== ob) return oa - ob;
    return String(a.personaNombre || "").localeCompare(String(b.personaNombre || ""), "es");
  });
}

export function personaPrincipal(vinculos = []) {
  const ordenados = ordenarVinculos(vinculos);
  return ordenados.find((v) => v.tipo === "PROPIETARIO") || ordenados[0] || null;
}
