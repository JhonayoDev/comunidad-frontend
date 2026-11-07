/**
 * correccionRut.js
 *
 * La corrección de RUT es una acción excepcional: la administración habilita
 * a la persona por una ventana de tiempo y el residente solo puede solicitarla
 * mientras esté vigente. El backend es la fuente de verdad (expone
 * `rutCorreccionHabilitadaHasta` en `GET /me` y rechaza el alta sin
 * habilitación); este helper solo decide qué mostrar en la UI.
 */
export function correccionRutHabilitada(me, ahora = new Date()) {
  const hasta = me?.rutCorreccionHabilitadaHasta;
  if (!hasta) return { habilitada: false, hasta: null };

  const fecha = new Date(hasta);
  if (Number.isNaN(fecha.getTime())) return { habilitada: false, hasta: null };

  return { habilitada: fecha.getTime() > ahora.getTime(), hasta: fecha };
}

const ESTADOS_CORRECCION_RUT = {
  VIGENTE: { label: "Vigente", severity: "success" },
  CONSUMIDA: { label: "Usada", severity: "info" },
  REVOCADA: { label: "Revocada", severity: "danger" },
  EXPIRADA: { label: "Expirada", severity: "secondary" },
};

/**
 * Presentación del estado de la última habilitación en la vista de
 * administración (`PersonaDetalleResponse.correccionRut`).
 */
export function estadoCorreccionRut(correccionRut) {
  return (
    ESTADOS_CORRECCION_RUT[correccionRut?.estado] || {
      label: "Sin habilitación",
      severity: "secondary",
    }
  );
}
