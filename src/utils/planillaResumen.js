// Resúmenes de texto de recursos por fila (FE-2/FE-3).
// Aceptan ambas formas: fila staging local ({vehiculos[]/bodegas[]/
// estacionamientos[]} con objetos) y FilaPreview del backend
// ({vehiculos[]: VehiculoPreview, estacionamientos[]/bodegas[]: string[]}).
export function estacionamientosResumen(f) {
  return (f?.estacionamientos || [])
    .map((e) => (typeof e === "string" ? e : e.nombre || "").trim())
    .filter(Boolean)
    .join(", ");
}

export function bodegasResumen(f) {
  return (f?.bodegas || [])
    .map((b) => (typeof b === "string" ? b : b.nombre || "").trim())
    .filter(Boolean)
    .join(", ");
}

export function vehiculosResumen(f) {
  // Dedupe visual: si el est ya está en la columna standalone, no se repite
  // junto al vehículo (el payload igual lo envía en ambos para compatibilidad
  // con el backend pre/post BE-74).
  const standalone = new Set(
    estacionamientosResumen(f)
      .split(",")
      .map((e) => e.trim().toUpperCase())
      .filter(Boolean),
  );
  return (f?.vehiculos || [])
    .map((v) => {
      const p = (v.patente || "").trim();
      let est = (v.estacionamiento || "").trim();
      if (est && standalone.has(est.toUpperCase())) est = "";
      if (!p && !est) return "";
      if (!p && est) return `(sin patente) · ${est}`;
      return est ? `${p} · ${est}` : p;
    })
    .filter(Boolean)
    .join(", ");
}
