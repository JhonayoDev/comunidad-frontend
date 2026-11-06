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
